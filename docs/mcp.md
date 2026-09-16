# MCP interface

## Status: implemented, built on the official MCP SDK

`packages/mcp` is a working MCP server exposing **seven read-only, deterministic tools**,
plus two reference resources and one workflow prompt, over the trusted catalog and the
installer.

```sh
pnpm mcp        # or: pnpm --filter @configshell/mcp start
```

## What it is for

MCP is ConfigShell's **external integration boundary**. It lets an MCP-capable AI host —
Claude, ChatGPT, Cursor, VS Code, or anything else that speaks the protocol — use
ConfigShell's trusted capabilities to help a user discover, compare and choose software and
build a setup plan.

```
External AI host          reasoning, conversation, recommendations
        ↓  MCP protocol
ConfigShell MCP           adapters only — no business logic
        ↓
ConfigShell core
        ↓
Catalog · Resolver · Compatibility · Setup plan
        ↓
        results back to the host, which explains them to the user
```

**The division of labour is the point.** The host does the reasoning and the talking.
ConfigShell supplies verified data and deterministic operations, and contains no model, no
provider SDK and no API key. A question like *"I'm setting up Fedora for full-stack web
development, what should I install?"* is answered by the host calling `list_environments`,
`list_roles`, `search_application`, `get_application`, `check_compatibility` and
`generate_setup`, then explaining the results in its own words.

ConfigShell must not try to become the conversational AI itself, and AI/model integration
inside ConfigShell remains future scope ([`ai.md`](ai.md)).

## Built on the official SDK

The server uses **`@modelcontextprotocol/server` v2** — the official MCP TypeScript SDK,
which negotiates [MCP protocol](https://modelcontextprotocol.io/specification) revisions
`2025-11-25` through `2024-10-07`. (`2025-11-25` is the newest the installed package
advertises in `SUPPORTED_PROTOCOL_VERSIONS`; the SDK's own README describes a later spec, so
check the package rather than the prose when this matters.)

The SDK owns the protocol: JSON-RPC framing, the initialize handshake, protocol-version
negotiation, capability declaration, `tools/list` and `tools/call` dispatch, JSON Schema
generation from our Zod schemas, argument validation, and error envelopes.

ConfigShell owns the business logic: the catalog, resolution, compatibility, setup plans and
the security policy. Protocol correctness is a solved problem maintained by the people who
write the spec; a trusted application catalog is not.

> **This replaced a hand-written JSON-RPC implementation.** That earlier decision was made
> against `@modelcontextprotocol/sdk` v1, a monolithic package with seventeen transitive
> dependencies — HTTP transports, OAuth, and a process-spawning library. **v2 split the
> packages**, and a server now needs three: `@modelcontextprotocol/server`,
> `@modelcontextprotocol/core` and `zod`. The dependency objection no longer held.
>
> The compatibility argument settled it independently: the hand-written server negotiated
> protocol versions up to `2025-06-18`, two revisions behind what the SDK negotiates.
> Tracking a moving
> spec by hand is a maintenance burden with no upside, and every month it drifts further
> from what real clients expect.

## The tool surface

| Tool | Purpose |
| ---- | ------- |
| `list_environments` | Supported distributions and their package ecosystems |
| `search_application` | Search the catalog by text and/or category |
| `get_application` | One entry, its verified sources and who packages them; optionally resolved for an environment |
| `list_roles` | Deterministic role/use-case presets |
| `check_compatibility` | Resolve a selection against an environment, without building a plan |
| `generate_setup` | Ordered setup plan plus the commands a **user** would run |
| `validate_setup` | Check submitted commands against what the catalog produces |

Every tool is annotated `readOnlyHint: true`, `destructiveHint: false`,
`idempotentHint: true`, `openWorldHint: false` — the security posture stated in the
protocol's own vocabulary, where a host will actually read it, rather than only in prose.

Every tool returns **both** a JSON text block and `structuredContent`, so a host can parse
the result rather than re-reading prose.

Input schemas are Zod and **strict**: an unrecognised argument is rejected rather than
ignored. A host that invents a `command` field is told so, instead of receiving a plan that
silently dropped it.

### `generate_setup` produces a proposal, not an action

It returns commands for the **user** to run in their own terminal. Every result carries:

```json
"execution": { "executed": false, "executedBy": null, "note": "ConfigShell never runs these…" }
```

Privileged commands are flagged so a host can show which need root *before* the user agrees.
Applications needing a vendor repository, or shipping only as a vendor download, come back as
**manual steps with a link** — never a command that would fail on a clean system.

### `validate_setup` is a check, not an authorisation

It re-derives the plan from the catalog and compares the submitted commands, reporting
anything added, altered, dropped or reordered. Submitted commands are **compared only**:
never executed, never echoed back as approved. A pass is not permission to run anything —
whatever eventually executes must re-validate for itself ([`agent.md`](agent.md) rule 2).

## Resources and prompts

Added because they earn their place, not for completeness.

**Resources** (two): `configshell://reference/environments` — the supported distributions,
ecosystems, categories and role names as one small JSON document a host can read once instead
of spending a tool call; and `configshell://reference/safety` — what ConfigShell will and
will not do, for a host to consult before presenting commands.

The catalog itself is deliberately **not** a resource. `search_application` exists so a host
filters server-side rather than pulling every entry into its context.

**Prompt** (one): `plan_a_setup`, with optional `distro` and `useCase` arguments. A host can
discover the tools by itself, but the *order* — establish the environment before planning,
explain trade-offs before generating commands — is ConfigShell-specific knowledge worth
handing over explicitly. One prompt covers the product's main journey; more would be padding.

## What is deliberately absent

Three capabilities are **not tools**, and are not stubs that return an error either. A tool
that always fails is still a tool a caller must discover and handle; one returning a
plausible guess would be a lie.

| Capability | Why it is withheld |
| ---------- | ------------------ |
| `detect_system` | Real distribution, architecture and desktop detection requires reading the user's machine. A server process is not on it. `list_environments` returns `detectionAvailable: false` and says to ask the user. |
| `check_installed` | Requires reading the user's package database. |
| `execute_setup` | Execution is the local agent's entire purpose, with local re-validation and per-step confirmation. **No MCP tool may run a command.** |

All three belong to the local agent ([`agent.md`](agent.md)), which does not exist.
`WITHHELD_CAPABILITIES` in `src/tools.ts` records them with reasons, and tests assert none is
ever registered or discoverable.

## Security boundaries

1. **No raw shell tool. Ever.** No `run_command`, no `exec`, no escape hatch.
2. **No tool takes an argument for a package name, a command, a flag, a URL or a
   repository.** A caller supplies catalog ids and a distribution name; nothing else can
   reach command generation because nothing else is read. A test walks the registered
   schemas and fails if such a field appears.
   Schemas are Zod and **`.strict()`**, so an unrecognised argument is refused rather than
   ignored. Shape, lengths, array bounds and the catalog-id pattern are all declared there:
   the SDK enforces them before a handler runs, and publishes them in the JSON Schema
   clients read, so a host can see the rules instead of discovering them from an error.
   `src/validate.ts` keeps only what a schema cannot express — catalog existence,
   deduplication, and building a validated `Environment`.
3. **Everything resolves against the trusted catalog.** An unknown id refuses the whole call
   rather than being skipped, so a plan always matches what was asked for.
4. **The package ecosystem is derived from the distribution, never accepted**, so a caller
   cannot pair "Arch Linux" with "apt" to steer command generation.
5. **Identifiers are re-validated** against a strict pattern immediately before
   interpolation, inside `@configshell/installer`, which does not trust this layer either.
6. **No execution, no filesystem, no sockets** anywhere in the package — asserted
   structurally over the source, along with the absence of package-manager command
   vocabulary, so this layer cannot fork command generation and disagree with the web app.

`validate_setup`'s `commands` is the one argument that accepts command text, and only to be
compared against catalog-derived output.

### Authorization

There is none, and none is needed yet: the transport is stdio, so the server is launched by
the user's own client as a subprocess with no listening port and no remote attack surface.
Per-capability authorization becomes a real requirement the moment either a remote transport
or a non-read-only tool arrives — which, per rule 4 above, means it arrives with the agent.

### Logging

Diagnostics go to stderr; stdout carries protocol messages alone. There is no audit log
because there is no security-relevant call to audit: every tool is read-only and the server
holds no credentials. A tool that could lead to a system change must arrive with one.

## Transport

**stdio today.** That is what MCP hosts use to launch a local server, and it is the whole
transport story for a local integration.

The boundary is drawn so a remote deployment is not a rewrite:
`createConfigShellServer()` returns a configured `McpServer` with **no transport attached**.
`bin.ts` binds stdio; a future HTTP entry point binds
`WebStandardStreamableHTTPServerTransport` from the same SDK package and registers the same
tools. Nothing in `tools.ts` knows how it is being reached — the tests prove it by binding
the same server to an in-memory transport instead.

**Streamable HTTP is not implemented**, deliberately. It would bring sessions, origin
validation and an authorization story, none of which has a user yet. The SDK ships it, along
with adapters for Express, Fastify, Hono and plain Node, whenever ConfigShell needs a
remotely hosted server.

**Today the server is local-only.**

## Connecting a client

Point an MCP host at the server command:

```json
{
  "mcpServers": {
    "configshell": {
      "command": "pnpm",
      "args": ["--filter", "@configshell/mcp", "start"]
    }
  }
}
```

Compatibility is not a claim made from reading the spec: `src/integration.test.ts` connects
the **official MCP client** to this server over the real protocol, and `src/stdio.test.ts`
spawns the binary as a subprocess exactly as a host does.

## Where it lives

`packages/mcp` — a standalone server importing `@configshell/catalog` and
`@configshell/installer` directly. It does **not** go through the HTTP API: both are adapters
over the same pure functions, and a network hop between them would add a failure mode without
adding a guarantee. The same request produces the same result from the web app, the API and
an MCP client, because all three call the same code.

```
src/
├── bin.ts            stdio entry point — the only transport binding
├── server.ts         createConfigShellServer(): tools, resources, prompts, instructions
├── tools.ts          the seven tools — pure, transport-independent
├── validate.ts       business-rule validation (Zod covers shape)
└── errors.ts         tool errors, safe to return to a caller
```

```sh
pnpm --filter @configshell/mcp test        # 52 tests
pnpm --filter @configshell/mcp typecheck
```

Related: [`architecture.md`](architecture.md), [`security-model.md`](security-model.md),
[`agent.md`](agent.md), [`ai.md`](ai.md).
