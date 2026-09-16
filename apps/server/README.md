# `server` — API server

Node.js + Express. **Scaffold only.** It starts, logs its port, and serves nothing else.

## Current state — read this before adding code

- `index.js` starts an Express app with **no routes, no middleware, and no endpoints**.
- `config/env.js` reads and validates the environment (`PORT`, `NODE_ENV`) and fails
  startup with an explanatory error on an invalid value. `config/index.js` re-exports it.
- **Every other file in `controllers/`, `services/`, `routes/`, `middleware/`,
  `validators/` and `utils/` is empty** (0 bytes). The directory names describe the
  intended shape, not existing code.
- The web app does not call this server. There is no API contract yet.

If you are adding the first real endpoint, discuss the shape in an issue first — the
catalog is currently compiled into the web app, so a server-side catalog API is an
architectural change, not a small one. See
[`docs/architecture.md`](../../docs/architecture.md).

## Commands

```sh
pnpm --filter server dev     # nodemon index.js
pnpm --filter server start   # node index.js
pnpm --filter server test    # node --test (no test files exist yet — 0 tests, exits 0)
```

Test convention once tests exist: `*.test.js` next to the code it covers. Run a single
file with `node --test path/to/file.test.js` from this directory.

## Environment

Copy the template and edit as needed — all values are optional:

```sh
cp apps/server/.env.example apps/server/.env
```

`.env` is git-ignored. Never commit real credentials; see
[`SECURITY.md`](../../SECURITY.md).

> The web dev server also defaults to port 3000. If you run both, set `PORT` here to
> something else (the template suggests 4000).
