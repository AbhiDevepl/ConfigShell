# Development setup

Everything on this page has been run against the repository as it currently stands. If a
command here does not behave as described, that is a bug — please
[report it](../.github/ISSUE_TEMPLATE/bug_report.md).

## Requirements

| Tool | Version | Notes |
| ---- | ------- | ----- |
| Node.js | **>= 20** | Enforced by `engines` in the root `package.json`. Developed on 20 and 22; CI runs both. |
| pnpm | **9.15.5** | Pinned by the root `packageManager` field. |
| git | any recent | |

Enable the pinned pnpm through Corepack (ships with Node):

```sh
corepack enable
corepack prepare pnpm@9.15.5 --activate
```

No other system dependencies are needed. Nothing in this repository installs software on
your machine or requires root.

## Install

```sh
git clone https://github.com/AbhiDevepl/configshell.git
cd configshell
pnpm install
```

`pnpm install` installs every workspace (`apps/*`, `packages/*`) from the committed
`pnpm-lock.yaml`. Use `pnpm install --frozen-lockfile` to verify the lockfile is in sync —
that is what CI does.

## Environment variables

The web app needs none, and the server starts fine without any. For the server:

```sh
cp apps/server/.env.example apps/server/.env
```

| Variable | Used by | Required | Default | Notes |
| -------- | ------- | -------- | ------- | ----- |
| `PORT` | `apps/server` | no | `3000` | Integer 1–65535; validated at startup. Serves the API and, when a build exists, the web app. |
| `NODE_ENV` | `apps/server` | no | `development` | One of `development`, `test`, `production`. |
| `DISABLE_HMR` | `apps/web` dev server | no | unset | Set to `true` to disable HMR and file watching (used by AI Studio tooling). |

Invalid values fail server startup with an explanatory error rather than being silently
ignored — see `apps/server/config/env.js`. There are intentionally **no** AI provider keys,
database URLs, or auth secrets: nothing in the repository implements features that need
them. Do not add variables ahead of the code that reads them.

`.env` files are git-ignored; `.env.example` is committed. Never put a real secret in the
example file.

## Run it

```sh
pnpm dev                    # web app → http://localhost:3000
```

`pnpm dev` is the normal entry point — the web app is the only runnable user-facing piece.
Per-workspace:

```sh
pnpm --filter web dev       # Vite dev server, port 5173
pnpm --filter server dev    # planning API (tsx watch) — http://localhost:3000/health
```

> The web dev server is on 5173 and the API on 3000; `pnpm dev` runs both in parallel.

## Check your work

From the repository root:

| Command | What it does |
| ------- | ------------ |
| `pnpm lint` | ESLint across the repo (flat config in `eslint.config.js`) |
| `pnpm typecheck` | `tsc --noEmit` for `apps/web`, `packages/catalog`, `packages/installer` and `apps/server` |
| `pnpm test` | 236 tests across seven workspaces — see [`testing.md`](testing.md) |
| `pnpm build` | production build of the web app → `apps/web/dist` |
| `pnpm check` | all four, in that order — run this before opening a pull request |

Per-workspace equivalents:

```sh
pnpm --filter web typecheck
pnpm --filter @configshell/catalog test
pnpm --filter @configshell/catalog typecheck
pnpm --filter @configshell/installer test
pnpm --filter @configshell/installer typecheck
pnpm --filter @configshell/mcp test
pnpm --filter @configshell/mcp typecheck
pnpm --filter server test
pnpm --filter server typecheck
```

### Testing

`pnpm test` runs all 206 across five workspaces. Coverage per workspace, the security test
cases, and what is deliberately **not** tested are documented in
[`testing.md`](testing.md) — the authority on this.

### Running the built app

```sh
pnpm build && pnpm start      # http://localhost:3000
```

`pnpm start` runs the API, which serves `apps/web/dist` when a build is present — one
process, one port, so the web app and the API share an origin. `apps/web` has no server of
its own; `pnpm --filter web preview` is Vite's preview of the build alone, without the API.

### Running both processes in development

`pnpm dev` starts the web app (port **5173**) and the API (port **3000**) together. Vite
proxies `/api` to the API server, so the browser stays on one origin.

Browsing, search and role presets work without the API — the catalog is compiled into the
bundle. **Generating a setup plan needs it**, and the UI says so explicitly rather than
degrading quietly. `pnpm dev:web` runs the web app alone.

### Trying the MCP server

```sh
pnpm mcp
```

It speaks MCP over stdio, so it is normally launched by the host that uses it rather than run
by hand. To connect a host — Claude Desktop, Cursor, VS Code — point it at the command:

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

Diagnostics go to stderr; stdout carries protocol messages only. See
[`docs/mcp.md`](mcp.md).

### Trying the API

```sh
pnpm --filter server dev
curl -s localhost:3000/health
curl -s localhost:3000/api/plan -H 'content-type: application/json' \
  -d '{"environment":{"distro":"Ubuntu"},"applicationIds":["git","htop"]}'
```

Endpoints are documented in [`apps/server/README.md`](../apps/server/README.md).

### Formatting

There is no enforced formatter — no Prettier, no format script. `.editorconfig` sets
indentation, charset, and line endings; beyond that, match the style of the file you are
editing. Do not reformat files you are not otherwise changing: unrelated whitespace churn
makes review harder and will be asked for removal.

## Building and serving the production build

```sh
pnpm build                  # → apps/web/dist
pnpm --filter web preview   # Vite's own preview server
pnpm start                  # the API server, which also serves apps/web/dist
```

`pnpm start` requires a prior `pnpm build`; it serves whatever is in `apps/web/dist`.

## Repository layout

```
apps/web          React web interface (the only runnable app)
apps/server       Express API scaffold — starts, no endpoints
packages/catalog  verified application catalog (single source of truth)
packages/ai       placeholder, empty
packages/mcp      placeholder, empty
docs/             architecture, catalog, security-model, development, ai, mcp, agent,
                  the PRD and technical audit, plus the community-health documents
                  (CONTRIBUTING, CODE_OF_CONDUCT, SECURITY, SUPPORT, MAINTAINERS,
                  ROADMAP, CHANGELOG, THIRD_PARTY_NOTICES, NOTICE)
.github/          issue/PR templates, CI, contribution aids
```

There is no Turborepo pipeline: root `package.json` scripts orchestrate the workspaces
directly with pnpm filters. That is enough for the current dependency graph.

## Troubleshooting

**`pnpm: command not found`** — run the Corepack commands above, or install pnpm
following [pnpm.io/installation](https://pnpm.io/installation).

**`ERR_PNPM_UNSUPPORTED_ENGINE`** — your Node is older than 20. Upgrade Node.

**Port 3000 already in use** — something else (often the other app in this repo) is on it.
For the server, set `PORT` in `apps/server/.env`. For the web app, run Vite on another
port directly: `pnpm --filter web exec vite --port 5173` (the `dev` script hardcodes 3000).

**Editor cannot resolve `@configshell/catalog`** — run `pnpm install`; the package
is resolved through a workspace symlink and has no build step.

**`pnpm --filter web …` matches nothing** — you are on a checkout from before the web
package was renamed from `react-example`. Pull `main`.
