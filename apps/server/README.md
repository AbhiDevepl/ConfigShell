# `apps/server`

The ConfigShell API: a **read-only planning service** over the trusted catalog.

It answers two kinds of question — *what is in the catalog?* and *given this environment and
this selection, what should I run?* — and it has no other capabilities.

## What it does not do, permanently

**It never executes anything.** There is no `child_process` import anywhere in this
workspace, and an integration test asserts there never is one. A server that ran
package-manager commands on a user's behalf would be remote sudo, which the security model
rules out permanently rather than as a matter of sequencing.

Execution belongs to a local agent running on the user's own machine, which re-validates the
plan locally and asks for explicit confirmation before each privileged step. That component
does not exist — see [`docs/agent.md`](../../docs/agent.md).

It also has **no database, no authentication and no sessions**, because nothing here needs
one. The catalog is Git-managed data compiled into the process (PRD §33), and every endpoint
is a pure function of the request.

## Endpoints

| Method | Path | Returns |
| ------ | ---- | ------- |
| `GET` | `/health` | Liveness and catalog integrity |
| `GET` | `/api/applications` | Browse, search (`?query=`), filter (`?category=`) |
| `GET` | `/api/applications/:id` | One entry; with `?distro=` also its resolution |
| `GET` | `/api/catalog/categories` | Supported categories |
| `GET` | `/api/catalog/environments` | Supported distributions and their ecosystems |
| `GET` | `/api/catalog/stats` | Counts, computed from the data |
| `POST` | `/api/plan` | Selection + environment → plan, commands, manual steps |
| `POST` | `/api/plan/resolve` | Selection + environment → resolutions only |

`POST /api/plan` is a `POST` because its input is a selection rather than an identifier. It
is still a pure read: nothing is stored, nothing is mutated, nothing is executed.

### Example

```sh
curl -s localhost:3000/api/plan -H 'content-type: application/json' \
  -d '{"environment":{"distro":"Ubuntu"},"applicationIds":["git","htop","cursor"]}'
```

```
sudo apt-get update
sudo apt-get install git htop
command -v git
command -v htop
```

…plus a manual step for Cursor, which is a vendor download and has no command.

## Responses

Success is `{ "data": … }`; failure is `{ "error": { "code", "message" } }` with an optional
`details`. Codes are a closed set (`utils/response.js`): `INVALID_REQUEST`,
`UNKNOWN_APPLICATION`, `NOT_FOUND`, `REQUEST_TOO_LARGE`, `INTERNAL`. Switch on `code`;
`message` is for humans and may be reworded.

Every response carries an `X-Request-Id`. A caller-supplied one is ignored — trusting it
would let a caller write arbitrary text into the server's logs.

## Security boundary

A caller supplies **catalog ids and a distribution name, and nothing else.** There is no
field for a package name, a command, a flag, a URL or a repository, so no request body can
introduce one. Defence in depth, in order:

1. `validators/plan.validator.js` checks id *shape* against a slug pattern and *existence*
   against the catalog. An unknown id refuses the whole request rather than being skipped —
   a plan that silently omits what was asked for is worse than an error.
2. The ecosystem is always **derived** from the distribution, never accepted from the
   caller, so `{"distro":"Arch Linux","ecosystem":"apt"}` resolves as pacman.
3. Only a catalog source's own identifier reaches command generation.
4. `renderPlan` re-validates every identifier against a strict pattern immediately before
   interpolation, and throws rather than quoting anything suspicious.

Request bodies are capped at 16 kB and a selection at 200 ids.

## Logging

One JSON object per line (`utils/logger.js`). Request bodies, query strings and selections
are **not** logged — the only environment data recorded is the distribution a caller asked
to plan for, which is what makes a resolution explicable afterwards. There are no secrets to
redact: the server declares no API keys, database URL or auth secret, and a test asserts it.

## Structure

```
app.js                 Express app factory (no port binding)
index.js               the only file that listens
config/                validated PORT / NODE_ENV — fails startup on a bad value
routes/                the full API surface, in one readable table
controllers/           validate → call a service → send
services/              catalog access and plan generation; no application data
validators/            the untrusted-input boundary
middleware/            request context, 404, error handling
utils/                 structured logger, response envelope
```

`controllers/ai.controller.js`, `services/ai.service.js`, `routes/ai.routes.js` and
`middleware/auth.middleware.js` are **empty placeholders** that record intended shape. AI is
future scope ([`docs/ai.md`](../../docs/ai.md)); there is nothing to authenticate yet.

## Running it

```sh
pnpm --filter server dev     # tsx watch
pnpm --filter server start   # tsx index.js
pnpm --filter server test    # 41 tests
pnpm --filter server typecheck
```

The server is JavaScript that imports the workspace's TypeScript packages
(`@configshell/catalog`, `@configshell/installer`) directly. `tsx` transpiles them on the
fly, which is why there is no build step and no `dist/`. `tsconfig.json` runs `checkJs` over
this code so a mistake in how it calls those packages is caught by `pnpm typecheck`.

The web dev server also defaults to port 3000 — set `PORT` in `.env` to run both
(see `.env.example`).

## The web app does not call this

Not yet, and possibly not ever for the catalog itself. `apps/web` compiles
`@configshell/catalog` into its bundle, which is simpler, faster and strictly safer than a
network round trip.

**The web UI does not yet show a setup plan at all** — wiring `@configshell/installer` into
the interface is separate, still-unstarted work (`docs/TechnicalAudit.md`, Phase H). When it
happens, the web app can import the installer package directly, exactly as this server does;
it does not need this API to do it.

So what is this API for? Consumers that cannot compile the catalog in — a CLI, an MCP
server, or any other client that should reuse resolution rather than reimplement it.
