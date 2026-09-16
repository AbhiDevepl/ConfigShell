# Testing

The authoritative guide to how ConfigShell is tested and what the tests guarantee.
`README.md` links here rather than repeating it.

## Running them

```sh
pnpm test        # every workspace
pnpm check       # lint → typecheck → test → build, which is what CI runs
```

Per workspace:

```sh
pnpm --filter @configshell/catalog test      # catalog data, environment model, presets
pnpm --filter @configshell/installer test    # resolution, plans, command safety
pnpm --filter @configshell/mcp test          # tools, protocol interop, hostile input
pnpm --filter server test                    # API integration, against the real app
pnpm --filter web test                       # API client contract, safety invariants
pnpm --filter @configshell/contract-tests test  # HTTP vs MCP: do the adapters agree?
pnpm --filter @configshell/test-utils test      # architecture enforcement
```

One runner everywhere: Node's built-in test runner via `tsx`. There is no Jest, no Vitest
and no assertion library — `node:test` and `node:assert/strict`.

## What is covered

| Workspace | Tests | What they actually check |
| --------- | ----- | ------------------------ |
| `packages/test-utils` | 6 | **Architecture enforcement**: dependency direction, acyclicity, forbidden edges, and that package-manager syntax stays inside `packages/installer` |
| `packages/catalog` | 46 | All 31 real catalog entries validate; the environment model; role presets name only real applications |
| `packages/installer` | 73 | Every application resolved on every distribution; the cross-ecosystem contract matrix (apt/dnf/pacman/zypper); plan ordering and determinism; golden command output per package manager; the canonical setup plan — status, counts, validation failure modes, byte-identical determinism, hostile catalog entries |
| `packages/mcp` | 52 | The tool surface; **interoperability with the official MCP client** over the real protocol and over a spawned stdio process; hostile arguments |
| `apps/server` | 53 | The real Express app over an ephemeral port: every endpoint, every rejection path, single-port production serving |
| `apps/web` | 20 | The API client's contract, structural safety invariants, and plan rendering for every outcome (server-rendered, no DOM runner) |
| `packages/contract-tests` | 12 | **Cross-adapter**: the HTTP API and the MCP server must answer the same question the same way — including a whole-object comparison of the setup plan |

**They test real data and the real application**, not fixtures and mocks. The catalog suite
validates the actual catalog; the server suite drives the actual app; the MCP suite connects
the actual official client.

## Security tests

These are the reason the suite exists, and they are worth reading before changing anything
in the resolution → plan → command path.

| Case | Where | Expected |
| ---- | ----- | -------- |
| Identifier with `;`, `&&`, `\|`, `$()`, backticks, newlines | `installer/commands.test.ts`, `mcp/tools.test.ts`, `server/api.test.js` | Rejected before interpolation |
| A hostile *catalog entry* reaching command generation | `installer/commands.test.ts` | Throws rather than emitting a command |
| Any generated command, every app × every distribution | `installer/commands.test.ts`, `mcp/tools.test.ts`, `server/api.test.js` | Matches `/^[A-Za-z0-9 _.+-]+$/` — no shell metacharacter |
| Arbitrary command supplied by a caller | `mcp/tools.test.ts`, `server/api.test.js` | No argument accepts one; extra fields are refused |
| Unknown application id | all three adapters | Refuses the whole request, never silently skipped |
| Unsupported distribution | all three adapters | Structured rejection naming what is supported |
| Vendor source needing a third-party repository | `installer/resolve.test.ts` | Never resolved as if it were a native package |
| Malformed catalog entry | `catalog/validate.test.ts` | Validation failure |
| Execution capability anywhere | `server/api.test.js`, `mcp/safety.test.ts`, `web/safety.test.ts` | No `child_process`, `eval`, filesystem or socket access exists |

### Cross-adapter contract tests

ConfigShell exposes one core through two adapters, and they do **not** call each other — MCP
does not go over HTTP, so nothing at the transport level forces them to agree.

Both now build their plan with `presentSetupPlan` from `@configshell/installer`, so
agreement on the plan is structural. These tests keep it that way. They earned their keep by
failing to: each adapter used to shape the plan itself, the two drifted, and the tests here
compared only the fields both happened to share — so the drift passed. The plan assertion is
now a whole-object comparison, which is the only form that would have caught it.

`packages/contract-tests` runs the real Express app on an ephemeral port and the real MCP
tool handlers in the same process, then asserts they agree on: catalog contents, search
results, role presets, per-source resolution (including *why* each source was rejected), the
entire setup plan across all five distributions, plan status for complete/partial/empty
selections, and every rejection path — unknown ids, hostile identifiers, unsupported
distributions. A divergence in either adapter fails here rather than reaching a client.

### Architecture tests

`packages/test-utils/src/architecture.test.ts` enforces the dependency graph the
architecture doc describes — because a boundary that no test checks is a comment. It reads
the workspace manifests and asserts: no upward dependencies, no cycles, `packages/catalog`
depends on nothing, `web → installer` and `ai → installer` never exist, and package-manager
command syntax appears only in `packages/installer`.

### Structural tests

Three suites assert properties over the *source* rather than over behaviour, because the
guarantee is that the machinery is absent, not that it is guarded:

- No workspace imports `child_process` or `eval`.
- `apps/web` contains no package-manager vocabulary at all and never imports
  `@configshell/installer` — command generation must not be forked into the browser.
- `packages/mcp` contains no command vocabulary either, and never registers
  `detect_system`, `check_installed` or `execute_setup`.

They share `packages/test-utils`, which refuses to scan an empty tree — a structural test
whose scan came back empty would pass vacuously.

## Cross-layer coverage

The deterministic path is tested end to end rather than only per unit:

```
catalog → environment → resolution → setup plan → command generation
```

`installer/plan.test.ts` asserts that for each of the four supported distributions, **every
one of the 31 applications is accounted for** — installed, manual, or reported unavailable —
so nothing can be silently dropped. `mcp/integration.test.ts` drives the same path through
the protocol with the official client.

## What is not tested

Stated plainly, because a gap you know about is cheaper than one you discover:

- **No DOM or component tests.** `apps/web`'s tests cover its API client and structural
  invariants; rendering, interaction and accessibility are unverified. Closing this needs
  Vitest plus a DOM implementation plus Testing Library — a deliberate dependency decision
  that has not been made.
- **No end-to-end browser test** of the full user journey.
- **No coverage measurement.** No threshold is enforced.

## Adding tests

Put a test next to the code it covers, named `*.test.ts` (or `*.test.js` in `apps/server`).
The runners pick them up with no registration.

If you are touching resolution, planning or command generation, a test is not optional —
that path is the one that produces text a user will paste into a root shell. See
[`security-model.md`](security-model.md) for the boundaries it has to preserve.
