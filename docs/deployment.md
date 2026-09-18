# Deployment — Docker & Docker Compose

ConfigShell ships as production Docker images and a one-command Compose stack.
This document is the source of truth for the container layout, the runtime
graph, configuration, security, and how to validate a deployment. It describes
only what exists and is tested; see `docs/development.md` for local
development (which Docker is *not* part of).

- [What gets a container — and why](#what-gets-a-container--and-why)
- [Prerequisites](#prerequisites)
- [Quick start](#quick-start)
- [The three images](#the-three-images)
- [Compose: default mode (one container)](#compose-default-mode-one-container)
- [Compose: reverse-proxy mode (nginx front)](#compose-reverse-proxy-mode-nginx-front)
- [MCP over stdio](#mcp-over-stdio)
- [Configuration](#configuration)
- [Security model in the container](#security-model-in-the-container)
- [Validation matrix](#validation-matrix)

## What gets a container — and why

The audit result first: the repository is a pnpm workspace whose runtime
surface is **one Express process** (`apps/server`) that already serves every
surface — the built web app, the `/api/*` read-only planning API, and the MCP
server over Streamable HTTP at `/mcp` (see `apps/server/src/app.ts`). That is
the architecture `pnpm build && pnpm start` runs, and Docker packages it
rather than replacing it.

| Package | Kind | Runtime home |
| ------- | ---- | ------------ |
| `apps/web` | static SPA build | bundled into the server image; also the nginx image in reverse-proxy mode |
| `apps/server` | runtime service (Express) | `configshell` image, port 3000 |
| `packages/catalog` | library (TypeScript source) | compiled into consumers; no container |
| `packages/installer` | library | compiled into consumers; no container |
| `packages/mcp` | library + stdio bin | HTTP surface inside `configshell`; stdio surface as `configshell-mcp` |
| `packages/test-utils` | test-only | never shipped |
| `packages/contract-tests` | test-only | never shipped |

## Prerequisites

- Docker Engine ≥ 24 with the Compose plugin (or Docker Desktop).
- A shell. Everything below is exact; every command is part of the validation
  matrix at the end of this document.

The images are built against the frozen lockfile with exactly the pnpm declared
in the root `package.json` `packageManager` field (`pnpm@12.3.4`), so the same
dependency graph CI installs is the one the image resolves. No host
`node_modules` is ever copied into a build context — `.dockerignore` excludes
it — and no `.env` or other secret can enter an image.

## Quick start

Default mode — the whole product on one port, exactly like `pnpm start`:

```sh
docker compose up -d --build
curl -fsS http://localhost:3000/health
# open http://localhost:3000
```

Pick a different host port without touching code:

```sh
API_PORT=8080 docker compose up -d --build
```

Bring the stack down:

```sh
docker compose down
# also remove the (empty) project network:
docker compose down --remove-orphans
```

## The three images

### `configshell` — the product, one container

`docker/server.Dockerfile`, built by the default `compose.yml`. A two-stage
build:

1. **build** — `node:22-alpine`, corepack-prepares `pnpm@12.3.4` from the
   `packageManager` field, `pnpm install --frozen-lockfile`, then `pnpm build`
   (Vite) to produce `apps/web/dist`. Manifests and the lockfile are copied
   first so dependency layers are cached until they actually change.
2. **runtime** — fresh `node:22-alpine`, production-only filtered install
   (`pnpm install --frozen-lockfile --prod --filter server...`), the built web
   bundle copied in, non-root `USER node`, exec-form `CMD`.

Why a second full stage rather than slimming the first: the runtime excludes
every dependency the tests, the linter and the bundler need, and never contains
a write to the store. `tsx` stays in production dependencies because the server
is TypeScript run under `tsx` with no build step — that is the repository's
documented choice, so the image ships exactly the runtime the code was designed
for.

### `configshell-web` — optional nginx front

`docker/web.Dockerfile` + `docker/nginx.conf`. Only rolled out with
`compose.web.yml` (reverse-proxy mode). It serves the identical `apps/web/dist`
bundle and reverse-proxies `/api/*` and `/mcp` to the `configshell` backend on
the internal compose network. nginx is used purely as deployment plumbing:
no business logic, no command vocabulary, no resolver policy.

### `configshell-mcp` — the stdio MCP tool

`docker/mcp.Dockerfile`. The same `createConfigShellServer()` that the HTTP
surface serves, bound to **stdio** — the transport an MCP host uses to launch a
local tool. It has no port and does not belong to a compose network; a host
would start it with `docker run -i` (see [MCP over stdio](#mcp-over-stdio)).
It installs the tool's full dependency branch including dev dependencies,
because the entry point is `tsx` — again, the existing runtime, packaged rather
than changed.

## Compose: default mode (one container)

`compose.yml` defines a single service that is the whole product:

- publishes `${API_PORT:-3000}:3000`,
- sets `NODE_ENV=production` and passes `PORT`, `MCP_PATH`, `PUBLIC_BASE_URL`
  through,
- healthchecks `GET /health` with the container's own `node`,
- runs non-root with `no-new-privileges`, all capabilities dropped and a
  read-only root filesystem.

The stack is stateless by construction — the catalog is compiled into the
image, there is no database and no volume — so restart, `up -d` after a crash
and `down` + `up` all return you to the identical product.

## Compose: reverse-proxy mode (nginx front)

For operators who want a dedicated web tier rather than Express serving the
static bundle:

```sh
docker compose -f compose.yml -f compose.web.yml up -d --build
curl -fsS http://localhost:80/api/health
```

In this mode:

- `web` (nginx) is the only published service (`${WEB_PORT:-80}:80`); the
  backend has **no host port** (`ports: !reset []`).
- `web` starts only after the backend is healthy (`depends_on: condition:
  service_healthy`).
- nginx serves the SPA with a fallback to `index.html`, long-cached hashed
  assets, and proxies `/api/*` plus `/mcp` to `server:3000` on the internal
  network. The browser stays on one origin, so no CORS configuration —
  identical to the default mode from the app's point of view.
- `MCP_PATH` must match what nginx proxies: the shipped `nginx.conf` proxies
  `/mcp`. Changing `MCP_PATH` means updating the nginx `location` block too —
  it is deployment topology, not business logic.

Set `PUBLIC_BASE_URL` to the public origin (https unless localhost) in this
mode so the MCP URL the backend advertises is reachable.

## MCP over stdio

The HTTP MCP surface needs nothing extra — it is served inside `configshell`
at `/mcp` (or `MCP_PATH`). The stdio surface is a separate tool an MCP host
launches as a subprocess:

```sh
docker build -f docker/mcp.Dockerfile -t configshell-mcp .
docker run -i --rm configshell-mcp
```

It logs its readiness to stderr and keeps stdout exclusively for protocol
messages. Tools are the same read-only, schema-strict surface the HTTP endpoint
serves: nothing that executes commands, no arguments that carry commands, and
the three capabilities the safety model withholds (`detect_system`,
`check_installed`, `execute_setup`) stay unregistered.

## Configuration

All variables are optional; the defaults run the stack as-is. Values reach the
container through Compose's `environment:` mapping, which reads your shell or a
repo-root `.env` (copy of `.env.example`). The server itself reads
`apps/server/.env` for non-Docker runs — `.env.example` there documents it.

| Variable | Default | Meaning |
| -------- | ------- | ------- |
| `PORT` | `3000` | port the Express process binds inside the container (`0.0.0.0`) |
| `NODE_ENV` | `production` | validated against `development`/`test`/`production` |
| `MCP_PATH` | `/mcp` | HTTP MCP mount path; cannot collide with `/api` or `/health` |
| `PUBLIC_BASE_URL` | `http://localhost:3000` | canonical public origin; only derives/display the MCP URL; https required unless localhost |
| `API_PORT` | `3000` | *host-side* published port in default mode |
| `WEB_PORT` | `80` | *host-side* published port in reverse-proxy mode |

Secrets policy is unchanged from the rest of the repository: there are none.
No AI key, database URL, or auth token exists to configure, and `.env` files
are git-ignored. `.env.example` carries placeholders only.

## Security model in the container

The container enforces the repository's non-negotiable principles rather than
adding new ones:

- **Never in a position to execute.** The server generates installation
  commands as *text* and must never run one; it runs as the unprivileged
  `node` user, all capabilities are dropped, and `no-new-privileges` is set.
- **No remote sudo.** Execution belongs to the future local agent
  (`docs/agent.md`); nothing in any image invokes a package manager.
- **No secrets in images.** No `.env` or key file can enter the build context
  (`.dockerignore`), and there are no secrets to configure anyway.
- **Input limits unchanged.** Express caps request bodies at 16 kB; the web
  nginx config mirrors that.
- **Blast radius on the host.** The stack publishes exactly one port
  (default `3000`, or per-mode as above) and mounts no host directories. The
  catalog is read-only data compiled into the image.

The default server container also runs a read-only root filesystem. If an
operator needs to relax that (it is a hardening toggle, not a supported
feature), remove `read_only: true` from the service — the product does not
depend on it.

### Base image pinning and scanning

The images build on `node:22.23-alpine` (pinned to a Node minor, not a floating
`22` tag) so the vulnerability posture is reproducible instead of changing with
every base-image push. An `npx trivy`-style container scan of the built images
reports only findings in the base image's **bundled `npm`** — `npm` ships inside
`node:22-alpine` but no ConfigShell runtime ever invokes it (package management
is pnpm via Corepack; the entry points are `pnpm`/`tsx`). The runtime
dependency tree that a container actually loads is clean: no OS-level findings
and none in the installed `.pnpm` store. The `configshell-web` (nginx + static
bundle) image reports zero findings. When a Node minor with fixes is released,
bump the `node:X.Y-alpine` pin in `docker/*.Dockerfile` and rebuild; a future
npm-free base (e.g. distroless) would remove the bundled-npm surface entirely.

## Validation matrix

The container deployment is verified by exactly these commands on every
material change (the `check` CI job does not run them — they need a Docker
daemon, so they live here and in CI-on-schedule if GitHub Actions adds a Docker
job later):

```sh
# 0 — the repository's own checks, unchanged, must stay green
pnpm install --frozen-lockfile
pnpm lint && pnpm typecheck && pnpm test && pnpm build

# 1 — no host node_modules / .env leaks into any build context
docker build --check -f docker/server.Dockerfile .        # requires BuildKit
docker compose config

# 2 — images build and inspect cleanly
docker compose build --no-cache
docker image inspect configshell:latest \
  --format '{{.Config.User}} {{.Config.Cmd}} {{.Config.WorkingDir}}'

# 3 — default mode: one container, whole product
docker compose up -d
curl -fsS http://localhost:3000/health
curl -fsS http://localhost:3000/                            # SPA HTML
curl -fsS 'http://localhost:3000/api/applications/git?distro=ubuntu'
docker compose ps                                           # healthy

# 4 — a real setup plan through the published surface
curl -fsS -X POST http://localhost:3000/api/plan \
  -H 'content-type: application/json' \
  -d '{"environment":{"distro":"ubuntu"},"applicationIds":["git"]}'

# 5 — the MCP HTTP endpoint answers
curl -fsS -X POST http://localhost:3000/mcp \
  -H 'content-type: application/json' \
  -H 'accept: application/json, text/event-stream' \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"probe","version":"0"}}}'

# 6 — graceful restart preserves the product
docker compose restart
curl -fsS http://localhost:3000/health

# 7 — teardown
docker compose down

# 8 — stdio MCP container
docker build -f docker/mcp.Dockerfile -t configshell-mcp .
printf '%s\n' \
  '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"probe","version":"0"}}}' \
  '{"jsonrpc":"2.0","method":"notifications/initialized"}' \
  '{"jsonrpc":"2.0","id":2,"method":"tools/list"}' \
  | docker run -i --rm configshell-mcp
#   expect two JSON-RPC responses, the second listing the read-only tools

# 9 — reverse-proxy mode
docker compose -f compose.yml -f compose.web.yml up -d --build
curl -fsS http://localhost:80/api/health
curl -fsS -X POST http://localhost:80/api/plan \
  -H 'content-type: application/json' \
  -d '{"environment":{"distro":"ubuntu"},"applicationIds":["git"]}'
docker compose -f compose.yml -f compose.web.yml down

# 10 — optional security scan of the built images (trivy)
trivy image --scanners vuln configshell:latest
trivy image --scanners vuln configshell-web:latest
trivy image --scanners vuln configshell-mcp:latest
```

Checklist before a release: default mode up → healthy → plan generated →
restart survives → down; stdio container handshake→`tools/list`; proxy mode
web→`/health` and `/api/plan`; `docker image inspect` shows `User=node`,
exec-form `Cmd`, non-empty `WorkingDir`.

---

See also: `README.md` (product overview), `docs/architecture.md` (the system
this deploys), `docs/security-model.md` (why the container looks the way it
does), `docs/mcp.md` (the MCP surfaces), `docs/development.md` (local, without
Docker).