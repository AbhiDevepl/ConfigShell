# `@configshell/mcp`

ConfigShell's **external integration boundary**: an MCP server that lets an MCP-capable AI
host — Claude, ChatGPT, Cursor, VS Code — use ConfigShell's trusted catalog and deterministic
setup capabilities.

```sh
pnpm mcp        # or: pnpm --filter @configshell/mcp start
```

```
External AI host  →  MCP  →  ConfigShell  →  Catalog · Resolver · Setup plan
                                     ↓
                     results back to the host, which explains them to the user
```

The host does the reasoning and the conversation. ConfigShell supplies verified data and
deterministic operations, and contains **no model, no provider SDK and no API key**.

Built on **`@modelcontextprotocol/server` v2**, the official MCP TypeScript SDK. The SDK owns
the protocol; this package owns only the adapters. Business logic lives in
`@configshell/catalog` and `@configshell/installer`, so the same request gives the same answer
from the web app, the API and an MCP client.

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

All read-only, deterministic, and annotated as such in the protocol. Each returns both text
content and `structuredContent`.

Plus two reference **resources** (`configshell://reference/environments`, `.../safety`) and
one **prompt** (`plan_a_setup`).

## What it will not do

**Nothing here executes anything.** No `child_process`, no `eval`, no filesystem, no sockets
— all asserted by test. Three capabilities are deliberately **not tools**, rather than stubs
that fail:

- **`detect_system`** — requires reading the user's machine. `list_environments` returns
  `detectionAvailable: false` and says to ask the user.
- **`check_installed`** — requires the user's package database.
- **`execute_setup`** — execution is the local agent's purpose, with local re-validation and
  per-step confirmation.

All three belong to the local agent (`docs/agent.md`), which does not exist.

## Security boundary

**No tool takes an argument for a package name, a command, a flag, a URL or a repository.** A
caller supplies catalog ids and a distribution name. Schemas are strict, so unknown arguments
are rejected rather than ignored, and the package ecosystem is derived from the distribution
rather than accepted.

`validate_setup` is the one tool accepting command text, and only to **compare** it against
catalog-derived output — never to execute or re-emit it. A pass is not permission to run
anything.

## Transport

**stdio today**, which is how hosts launch a local MCP server.
`createConfigShellServer()` returns a server with **no transport bound**, so a future
Streamable HTTP entry point registers the same tools without touching them. Not implemented
now: it needs sessions, origin validation and authorization, none of which has a user yet.

Connect a host:

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

## Tests

```sh
pnpm --filter @configshell/mcp test        # 52 tests
```

Interoperability is verified rather than assumed: `integration.test.ts` connects the
**official MCP client** to this server over the real protocol, and `stdio.test.ts` spawns the
binary as a subprocess exactly as a host does.

See [`docs/mcp.md`](../../docs/mcp.md) for the full architecture and the SDK decision.
