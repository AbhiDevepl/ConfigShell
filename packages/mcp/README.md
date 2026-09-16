# `@configshell/mcp`

An **MCP server over stdio** exposing read-only, deterministic tools over the ConfigShell
catalog and installer.

```sh
pnpm mcp        # or: pnpm --filter @configshell/mcp start
```

It is a thin adapter. Resolution, plan ordering, privilege marking and command generation all
come from `@configshell/installer` — the same functions the web app and the API server use —
so an MCP client cannot get a different answer from anyone else.

## Tools

| Tool | Purpose |
| ---- | ------- |
| `list_environments` | Supported distributions and their package ecosystems |
| `search_application` | Search the catalog by text and/or category |
| `get_application` | One entry with its verified sources; optionally resolved for an environment |
| `list_roles` | Deterministic role/use-case presets |
| `check_compatibility` | Resolve a selection against an environment, without a plan |
| `generate_setup` | Ordered setup plan plus the commands a **user** would run |
| `validate_setup` | Check submitted commands against what the catalog produces |

All seven are read-only and deterministic.

## What it will not do

**Nothing here executes anything.** There is no `child_process` import, no `eval`, no
filesystem read and no socket — tests assert all of it. Three capabilities are deliberately
**not tools**, rather than stubs that fail:

- **`detect_system`** — requires reading the user's machine. `list_environments` returns
  `detectionAvailable: false` and says to ask the user instead.
- **`check_installed`** — requires reading the user's package database.
- **`execute_setup`** — execution is the local agent's entire purpose, with local
  re-validation and per-step confirmation.

All three belong to the local agent (`docs/agent.md`), which does not exist.

## Security boundary

**No tool takes an argument for a package name, a command, a flag, a URL or a repository.** A
caller supplies catalog ids and a distribution name; nothing else can reach command
generation because nothing else is read. The package ecosystem is derived from the
distribution, never accepted, so `{"distro":"Arch Linux","ecosystem":"apt"}` resolves as
pacman.

`validate_setup` is the one tool that accepts command text, and only to **compare** it
against catalog-derived output. It never executes or re-emits it, and a pass is not
permission to run anything — whatever executes must re-validate for itself.

## Dependencies

Two workspace packages, and **nothing else at runtime**. The JSON-RPC layer is hand-written:
the official SDK pulls in seventeen transitive dependencies, mostly for HTTP transports and
OAuth a stdio server does not use, including a process-spawning library this project has good
reason not to carry. `src/tools.ts` is transport-independent, so that decision is reversible
without touching a tool — see [`docs/mcp.md`](../../docs/mcp.md).

## Layout

```
src/
├── bin.ts        the executable; the only writer to stdout
├── server.ts     stdio framing (newline-delimited JSON)
├── protocol.ts   JSON-RPC 2.0 and the MCP methods
├── tools.ts      the seven tools — pure, transport-independent
├── validate.ts   the untrusted-input boundary
└── errors.ts     tool errors, safe to return to a caller
```

```sh
pnpm --filter @configshell/mcp test        # 52 tests
pnpm --filter @configshell/mcp typecheck
```

TypeScript source, no build step — the same arrangement as the other packages.
