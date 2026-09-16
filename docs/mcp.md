# MCP interface

## Status: implemented (read-only)

`packages/mcp` is a working MCP server over stdio, exposing **seven read-only, deterministic
tools** over the trusted catalog and the installer. It plans and validates; it executes
nothing.

```sh
pnpm mcp        # or: pnpm --filter @configshell/mcp start
```

It is a **thin adapter**: resolution, plan ordering, privilege marking and command generation
are all decided by `@configshell/installer`, the same functions the web app and the API
server use. An MCP client cannot get a different answer from anyone else, and a test asserts
the package-manager vocabulary never appears in this package at all.

## Purpose

MCP (Model Context Protocol) is the **controlled interface** through which *external clients*
interact with the platform — a fixed, explicitly authorized set of capabilities instead of
general access. If a client can do something, it is because a tool for it exists, was
reviewed, and was authorized.

**MCP does not depend on the AI layer.** An AI system is one possible client; so is a CLI, an
editor extension, or a script. Nothing here requires a model to exist, and MCP must never
become the AI layer's private back door — an AI client gets exactly the same seven tools, and
exactly the same validation, as any other caller.

## The tool surface

| Tool | Purpose | Reads or changes |
| ---- | ------- | ---------------- |
| `list_environments` | Supported distributions and their package ecosystems | read-only |
| `search_application` | Search the trusted catalog by text and/or category | read-only |
| `get_application` | One entry, with its sources; optionally resolved for an environment | read-only |
| `list_roles` | Deterministic role/use-case presets | read-only |
| `check_compatibility` | Resolve a selection against an environment, without a plan | read-only |
| `generate_setup` | Ordered setup plan plus the commands a **user** would run | read-only (produces a proposal) |
| `validate_setup` | Check submitted commands against what the catalog produces | read-only |

Every tool validates its arguments, rejects rather than coerces, and returns both a JSON text
block and `structuredContent`.

### `generate_setup` produces a proposal, not an action

It returns commands for the **user** to run in their own terminal. Every result carries an
explicit marker:

```json
"execution": { "executed": false, "executedBy": null, "note": "ConfigShell never runs these…" }
```

Privileged commands are flagged so a client can show which ones need root *before* the user
agrees. Applications that need a vendor repository, or ship only as a vendor download, come
back as **manual steps with a link** — never as a command that would fail on a clean system.

### `validate_setup` is a check, not an authorisation

It re-derives the plan from the trusted catalog and compares the submitted commands,
reporting anything added, altered, dropped or reordered. Submitted commands are **compared
only**: never executed, and never echoed back as approved.

A pass is not permission to run anything. Whatever eventually executes must re-validate
against the catalog itself and ask the user — see [`agent.md`](agent.md) rule 2.

## What is deliberately absent

Three capabilities from the original sketch are **not tools**, and are not stubs that return
an error either. A tool that always fails is still a tool a caller must discover and handle;
a tool that returns a plausible guess would be a lie.

| Capability | Why it is withheld |
| ---------- | ------------------ |
| `detect_system` | Real distribution, architecture and desktop detection requires reading the user's machine. A server process is not on it. `list_environments` returns `detectionAvailable: false` and says to ask the user. |
| `check_installed` | Requires reading the user's package database. |
| `execute_setup` | Execution is the local agent's entire purpose, with local re-validation and per-step confirmation. **No MCP tool may run a command.** |

All three belong to the local agent ([`agent.md`](agent.md)), which does not exist.
`WITHHELD_CAPABILITIES` in `src/tools.ts` records them with their reasons, and a test asserts
none of them is ever registered.

## Rules for any implementation

These held before the server existed and still hold:

1. **No raw shell tool. Ever.** There is no `run_command`, no `exec`, no escape hatch. A tool
   that accepts an arbitrary string destined for a shell is out of scope for this project,
   not a design decision to be revisited.
2. **Tool inputs are untrusted.** Every argument is validated against a schema; rejected
   rather than coerced.
3. **Everything resolves against the trusted catalog.** Tools operate on catalog ids and
   verified installation sources, never on caller-supplied package names or URLs.
4. **Read-only by default.** A new tool is read-only unless there is a specific reason
   otherwise, and anything that is not read-only goes through the agent's confirmation path.
5. **Authorization is explicit and per-capability**, not "connected = allowed".
6. **Security-relevant calls are logged** so a user can audit what was asked for.

### How rules 1–3 are enforced

The structural defence matters more than any individual check: **no tool takes an argument
for a package name, a command, a flag, a URL or a repository.** A caller supplies catalog ids
and a distribution name. Nothing else can reach command generation, because nothing else is
read. Tests assert exactly this against the registered schemas.

The one exception is `validate_setup`'s `commands`, which exists to be compared against
catalog-derived output and is never executed or re-emitted.

Defence in depth, in order:

1. Argument shape and length (`src/validate.ts`).
2. Ids checked against the catalog — an unknown id refuses the whole call rather than being
   skipped.
3. The package ecosystem is **derived** from the distribution, never accepted, so
   `{"distro":"Arch Linux","ecosystem":"apt"}` resolves as pacman.
4. Only a catalog source's own identifier reaches command generation, which re-validates it
   against a strict pattern immediately before interpolation and throws rather than quoting
   anything suspicious.

A test renders every application on every supported distribution through the MCP layer and
asserts no generated command contains a shell metacharacter.

### On rule 6

Logging is currently **the transport's startup line on stderr, and nothing else.** The server
is read-only, holds no credentials and performs no privileged operation, so there is no
security-relevant call to audit yet. When a tool is added that could lead to a system change,
it must arrive with an audit log — which, per rule 4, means it arrives with the agent.

## Design decisions

### Hand-written JSON-RPC rather than the official SDK

`@modelcontextprotocol/sdk` pulls in seventeen transitive dependencies — express, hono, jose,
cors, eventsource, pkce-challenge and `cross-spawn` among them — almost all of it for HTTP
transports and OAuth that a read-only stdio server does not use. Adding a process-spawning
library to the dependency tree of a project whose central claim is "nothing here can execute
a command" is a poor trade, and the surface actually needed is small: `initialize`,
`notifications/initialized`, `ping`, `tools/list`, `tools/call`, over newline-delimited JSON.

`packages/mcp` therefore has **zero runtime dependencies** beyond the two workspace packages.

This is a judgement call, not a rule. `src/tools.ts` knows nothing about the transport, so
swapping `src/protocol.ts` for the SDK later would not touch a single tool. Revisit it if
ConfigShell needs an HTTP transport, OAuth, sampling, or resources.

### stdio only

The browser never speaks MCP, and there is no HTTP transport. A stdio server is launched by
the client that uses it, which means no listening port, no authentication story and no remote
attack surface.

## Using it

Point an MCP client at the server command. For example:

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

Protocol versions supported: `2025-06-18`, `2025-03-26`, `2024-11-05`. An unrecognised
version is answered with the newest supported one, per the specification.

Diagnostics go to **stderr**; stdout carries protocol messages only. Anything else writing to
stdout would corrupt the framing, which is why `src/bin.ts` is the single writer.

## Where it lives

`packages/mcp` — a standalone stdio server importing `@configshell/catalog` and
`@configshell/installer` directly. It does **not** go through the HTTP API: both are adapters
over the same pure functions, and a network hop between them would add a failure mode without
adding a guarantee.

```sh
pnpm --filter @configshell/mcp test        # 52 tests
pnpm --filter @configshell/mcp typecheck
```

Related: [`architecture.md`](architecture.md), [`security-model.md`](security-model.md),
[`agent.md`](agent.md), [`ai.md`](ai.md).
