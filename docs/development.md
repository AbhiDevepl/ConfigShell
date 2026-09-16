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
git clone https://github.com/AbhiDevepl/linux-app-platform.git
cd linux-app-platform
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
| `PORT` | `apps/server` | no | `3000` | Integer 1–65535; validated at startup. Also read by `apps/web`'s `server.js` (from the process environment, not `.env`). |
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
pnpm --filter web dev       # Vite dev server, port 3000
pnpm --filter server dev    # Express scaffold (nodemon) — starts, serves nothing
```

> Both default to port 3000. To run them together, set `PORT` in `apps/server/.env`
> (the template suggests 4000).

## Check your work

From the repository root:

| Command | What it does |
| ------- | ------------ |
| `pnpm lint` | ESLint across the repo (flat config in `eslint.config.js`) |
| `pnpm typecheck` | `tsc --noEmit` for `apps/web` and `packages/catalog` |
| `pnpm test` | catalog test suite, then `apps/server` (which has no test files yet) |
| `pnpm build` | production build of the web app → `apps/web/dist` |
| `pnpm check` | all four, in that order — run this before opening a pull request |

Per-workspace equivalents:

```sh
pnpm --filter web typecheck
pnpm --filter @linux-app-platform/catalog test
pnpm --filter @linux-app-platform/catalog typecheck
pnpm --filter server test
```

### Testing, honestly

- `packages/catalog` has the repository's **only** test suite: 20 tests using Node's
  built-in test runner via `tsx`. It validates the real catalog data, not just fixtures.
- `apps/server` runs `node --test` and finds **no test files**. That is a pass with zero
  tests, not a passing test suite.
- `apps/web` has **no tests at all** — no test runner is installed. Adding one (Vitest is
  the obvious choice for a Vite project) is an open task; see
  [`.github/GOOD_FIRST_ISSUES.md`](../.github/GOOD_FIRST_ISSUES.md).

### Formatting

There is no enforced formatter — no Prettier, no format script. `.editorconfig` sets
indentation, charset, and line endings; beyond that, match the style of the file you are
editing. Do not reformat files you are not otherwise changing: unrelated whitespace churn
makes review harder and will be asked for removal.

## Building and serving the production build

```sh
pnpm build                  # → apps/web/dist
pnpm --filter web preview   # Vite's own preview server
pnpm start                  # node apps/web/server.js (serves dist as a static SPA)
```

`pnpm start` requires a prior `pnpm build`; it serves whatever is in `apps/web/dist`.

## Repository layout

```
apps/web          React web interface (the only runnable app)
apps/server       Express API scaffold — starts, no endpoints
packages/catalog  verified application catalog (single source of truth)
packages/ai       placeholder, empty
packages/mcp      placeholder, empty
docs/             architecture, catalog, security, development
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

**Editor cannot resolve `@linux-app-platform/catalog`** — run `pnpm install`; the package
is resolved through a workspace symlink and has no build step.

**`pnpm --filter web …` matches nothing** — you are on a checkout from before the web
package was renamed from `react-example`. Pull `main`.
