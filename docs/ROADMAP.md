# Roadmap

What is done, what is being worked on, and what is intended. This is a statement of
direction, **not a set of promises** — items move, change shape, or get dropped as the
project learns. Nothing listed under "Planned" or later exists today.

For what actually ships right now, see the README's
[current status](../README.md#what-exists-today); for why a given layer is designed the way it
is, see [`docs/architecture.md`](architecture.md).

The product requirements behind this roadmap are in
[`ProductRequirements.md`](ProductRequirements.md), and
[`TechnicalAudit.md`](TechnicalAudit.md) maps every requirement onto what actually exists,
with the prioritised backlog (P0/P1/P2/Future) and the resolved product decisions. **The
audit is the authority on sequencing**; this page is the readable summary.

**Direction:** the core release is deterministic and is built **without external AI model
integration**. AI stays in "Future / experimental" below. MCP is retained as a separate
future integration layer and is *not* blocked on AI — see [`mcp.md`](mcp.md).

## Completed

### Phase 1 — web foundation
- Vite + React 19 + TypeScript + Tailwind v4 + shadcn/ui (Radix base) application.
- Browser-only "does this look like Linux" indicator (never claims a distribution).
- Manual distribution selection: Ubuntu, Debian, Fedora, Arch Linux.
- Application browser with search and category filtering.
- Multi-select with a selection summary (desktop sidebar, mobile sheet + sticky bar).
- Dark/light theme, dark by default, persisted to `localStorage`.
- Responsive layout.

### Phase 2 — the catalog
- `packages/catalog`: 31 applications, 116 verified installation sources, consumed by the
  web app through `workspace:*`.
- Data model separating `method` / `identifier` / `origin` / `distros`, with no commands
  and no version numbers anywhere.
- Dependency-free `validateCatalog` plus the repository's first test suite (20 tests),
  which validates the real data, not only fixtures.
- The web app's local catalog fixture deleted — one source of truth.

### Phase 3 — open-source readiness
- Contribution, conduct, security, support, maintainer, roadmap and changelog documents.
- GitHub issue and pull request templates, CODEOWNERS, Dependabot.
- CI on pushes to `main` and pull requests: install, lint, typecheck, test, build, on
  Node 20 and 22.
- Repository-wide ESLint, validated server environment configuration, workspace READMEs,
  and a dependency clean-up.

### Phase 4 — the deterministic core and the planning API
- `packages/catalog` gains the **environment model** (`Environment`, `parseEnvironment`,
  the distro↔ecosystem mapping in one place), read-only **queries**, and optional
  **verification metadata** (`verify.binary`, 26 of 31 entries).
- `packages/installer`: **resolution → setup plan → command generation**, as three pure
  functions with no I/O and no execution. PRD §22's trust hierarchy encoded explicitly;
  sources needing a third-party repository skipped in favour of the vendor's instructions;
  manual steps and unavailable applications reported rather than dropped.
- `apps/server`: a **read-only planning API** — health with catalog integrity, catalog
  browse/search/lookup, supported-environment discovery, `POST /api/plan`. Structured
  logging, a closed set of error codes, and a bounded untrusted-input surface. It plans and
  validates; it never executes, and a test asserts the workspace cannot.
- Tests go from 20 to **122**, across three workspaces.

### Phase 5 — the deterministic flow, end to end in the browser
- `apps/web` now implements the whole flow: environment (OS + distribution) → optional role
  presets → browse/search/filter → application detail → selection → setup plan → commands.
- The web app calls `POST /api/plan`; the catalog stays compiled into the bundle, so
  browsing works with no server while plan generation needs one — and says so.
- Deterministic **role presets** in `packages/catalog` (General use, Student, Developer, Web
  developer, DevOps). Curated id lists; no model anywhere.
- Loading, empty and error states throughout, including a distinct offline state.
- Accessibility fixes (unnamed distribution radios, indistinguishable preset buttons),
  responsive behaviour down to 375px, and first tests for `apps/web`.

### Phase 6 — the MCP interface
- `packages/mcp`: ConfigShell's external integration boundary, letting an MCP-capable AI host
  use the trusted catalog and deterministic setup capabilities. Seven read-only tools, two
  reference resources, one workflow prompt.
- Built on the **official MCP TypeScript SDK** (`@modelcontextprotocol/server` v2,
  protocol revisions through `2025-11-25`), replacing an initial hand-written JSON-RPC
  implementation — see
  [`mcp.md`](mcp.md) for the reasoning.
- Transport-agnostic server factory: stdio today, Streamable HTTP later without touching the
  tools.
- `detect_system`, `check_installed` and `execute_setup` deliberately **withheld**, with
  their reasons recorded in code and asserted by test. They belong to the local agent.
- 52 tests, including interoperability tests that connect the **official MCP client** over
  the real protocol and spawn the binary over stdio as a host would.

## Current — completing the V1 flow

V1 is a **command generator, not an installer**: it ends at a command the user copies into
their own terminal. The remaining pieces, in the order they make sense:

The flow works end to end. What remains is polish and the gaps it exposed:

1. **A DOM test runner for `apps/web`.** Component behaviour is untested — the largest gap
   in the repository. Needs Vitest plus a DOM implementation plus Testing Library, which is
   a dependency decision worth making deliberately.
2. **Selection persistence across reloads**, so a half-built selection survives a refresh.
4. **Application icons**, once the licensing and trademark questions are settled.
5. **Search by tags and aliases** (PRD §14) — needs a catalog field; `id` matching landed
   with the shared search function.
6. **More verified applications**, and the missing PRD §13 categories. The role presets are
   currently limited by what the catalog holds: AI/ML Developer, Designer and Video Editor
   have no honest preset because the applications are not there yet.

The V1 flow, end to end:

```
Website → Linux detection state → Distribution selection → Application catalog
→ Application selection → Installer resolution → Terminal command generation
→ Copy to terminal → user runs it themselves
```

## Planned

### Catalog and UI
- More verified applications and broader distribution coverage.
- Application icons, with the licensing and trademark questions settled first.
- Additional distributions (each one makes every existing entry's coverage a question —
  see [`docs/catalog.md`](catalog.md)).
- Accessibility and keyboard-navigation passes.

### Platform
- **Repository-setup steps.** Sources needing a third-party repository are skipped today and
  the user is sent to the vendor's instructions. Generating those steps — with signing keys
  and sources files — is a real feature and a real security question; the current behaviour
  is recorded as provisional in `docs/TechnicalAudit.md` §9 (Q1).
- Persisted selections (shareable lists) — requires deciding whether that needs a backend.
- Broader API surface, if a consumer needs one. The web app compiles the catalog in and does
  not call the API; the API exists for clients that cannot, such as a CLI or an MCP server.

## Future / experimental

Everything below is post-core, unstarted, and gated on design discussion. Each has a document
describing the constraints any implementation must satisfy. **None of it is a dependency of
the core release.**

- **AI planning layer** ([`docs/ai.md`](ai.md)) — recommendations, compatibility
  reasoning, natural-language discovery, plan drafting. AI plans; it never executes.
- **Remote MCP (Streamable HTTP) and authorization** ([`docs/mcp.md`](mcp.md)) — the tool
  surface, resources and a prompt are implemented and read-only over stdio. A remotely hosted
  server needs sessions, origin validation and an authorization story; the SDK ships all of
  it, and the transport boundary is already drawn so the tools would not change. Anything
  that could lead to a system change still waits for the agent.
- **Local Linux agent** ([`docs/agent.md`](agent.md)) — real system detection and the
  only component permitted to change a system, with validation and explicit confirmation.
- **Production platform** — database, accounts, catalog management, community-submitted
  entries, deployment infrastructure.

## Not on the roadmap

Some things are out of scope on purpose, and reopening them needs a strong argument:

- Executing shell commands from the browser.
- Remote or unattended installation on someone's machine.
- Distribution-guessing in the browser (it cannot be done honestly —
  [why](../README.md#important-distro-detection-rule)).
- Version numbers in the catalog.
- Shell-script installers (`curl … | sh`) as catalog sources.

## Want to help?

Pick something from [`.github/GOOD_FIRST_ISSUES.md`](../.github/GOOD_FIRST_ISSUES.md), or open
an issue describing what you would like to work on. Items in "Current" are the most useful
place to start; items in "Future / experimental" need a design conversation first.
