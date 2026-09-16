# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

ConfigShell is an early-stage, open-source Linux software discovery and management
platform. The intended product (see `README.md`) is a layered pipeline:

```
UI → Application Catalog → System Detection → AI / Planning → MCP → Validated System Operation
```

Non-negotiable safety principles that govern any feature work here:
- The browser/web app never executes arbitrary shell commands.
- AI never gets unrestricted system access — it plans/recommends, it does not execute.
- System-changing operations must go through a trusted local agent with validation and
  explicit user confirmation. (The local agent is **Future** scope — nothing implements it
  today — but the principle constrains every layer built before it.)
- Installed applications must resolve against the trusted catalog; untrusted manifests are
  never installed.

## Current implementation state (read before assuming anything works)

This repo is a scaffold — most files exist as empty placeholders, not stubs with TODOs.
Before editing, check whether a file actually has content; many don't:

- **`apps/server/`**: **implemented** — a read-only planning API. `app.js` is an Express app
  factory; `index.js` is the only file that binds a port. Routes: `/health`,
  `/api/applications[/:id]`, `/api/catalog/{categories,environments,stats}`, `POST /api/plan`
  and `POST /api/plan/resolve` (all listed in `routes/index.js`). Controllers are thin —
  validate, call a service, send. **41 tests** (`apps/server/api.test.js`,
  `config/env.test.js`).
  - **It never executes anything.** No `child_process` import exists in the workspace and a
    test asserts it never will. Don't add one: execution belongs to the local agent
    (`docs/agent.md`), and a server doing it would be remote sudo.
  - It is **JavaScript run under `tsx`**, so it can import the TypeScript workspace packages
    with no build step. `tsconfig.json` runs `checkJs` (with `noImplicitAny: false` — the
    point is the package boundary, not annotating Express handlers) and excludes `*.test.js`.
  - `controllers/ai.controller.js`, `services/ai.service.js`, `routes/ai.routes.js` and
    `middleware/auth.middleware.js` are still **0 bytes on purpose**. Leave them that way.
  - Variables are documented in `apps/server/.env.example`; `.env` is git-ignored. There are
    deliberately no AI keys, database URLs or auth secrets, and a test checks for them.
- **`apps/web/`**: a Vite + React + TypeScript + Tailwind v4 + **shadcn/ui** app, now
  implementing the **whole deterministic flow**: environment (OS + distribution) → optional
  role presets → browse/search/filter → application detail → selection → setup plan →
  commands. Two views (`build` and `plan`) held in `App.tsx`, which owns selection state.
  See "shadcn/ui setup" below before adding UI.
  - **It calls the API for anything the resolver decides** (`src/lib/api.ts`):
    `POST /api/plan` for setup plans, `GET /api/applications/:id?distro=…` for per-source
    availability. The catalog is still compiled in, so browsing works offline; those two do
    not, and the UI says so rather than degrading quietly. Do **not** import
    `@configshell/installer` here — one implementation of command generation, not two.
  - **Never re-derive resolver policy in a component.** The detail sheet once computed which
    sources applied to a distribution and disagreed with the plan, because the local copy did
    not know vendor package-manager sources need a repository first. If a screen needs to
    know whether a source is usable, ask the API.
  - **Dev server is port 5173**, the API is 3000, and Vite proxies `/api`. `pnpm dev` from
    the root runs both in parallel; `pnpm dev:web` runs the web app alone.
  - 11 tests on `tsx --test`: `src/lib/api.test.ts` (the API client's contract) and
    `src/lib/safety.test.ts` (structural invariants — the web source must contain no
    package-manager command vocabulary, must never import `@configshell/installer`, and must
    have no `eval`/`new Function`/`dangerouslySetInnerHTML`). There is **no DOM test
    runner**, so component behaviour is untested; adding Vitest is a deliberate dependency
    decision, not an oversight.
  - The workspace is named `web`, so both `--filter web` and `--filter ./apps/web` resolve.
- **`packages/catalog`**: real, and as of Phase 2 the **single source of truth for
  application metadata** — 31 verified applications, the data model, a dependency-free
  validation function, and its own tests. Published to the workspace as
  `@configshell/catalog` and consumed by `apps/web`, `packages/installer` and `apps/server`
  via `workspace:*`. It also owns the **environment model** (`environment.ts`:
  `createEnvironment`, `parseEnvironment`, the distro↔ecosystem mapping) and read-only
  **queries** (`query.ts`: `findApplication`, `searchApplications`) so every consumer answers
  the same question the same way. `ECOSYSTEM_DISTROS` in `types.ts` is the *single* home for
  which distributions use which package manager — `validate.ts` reuses it rather than keeping
  a copy, and adding a distribution should be a one-line change there. Optional
  `verify: { binary }` per application drives verification commands; absence means "no binary
  name verified", which is a legitimate state. It is
  TypeScript source with **no build step** (`main`/`types`/`exports` point straight at
  `src/index.ts`); Vite and `tsc` both resolve it through the pnpm symlink, so don't add a
  bundler/`dist` pipeline unless something actually needs one. `apps/web/src/data/
  mockCatalog.ts` is **gone** — never reintroduce a second catalog in the web app. Read
  `docs/catalog.md` before adding entries: identifiers must be verified against an
  authoritative source, unverified ones are omitted rather than guessed, the AUR doesn't
  count as `pacman`, and version numbers are never recorded.
- **`packages/installer`**: **implemented** — the deterministic core, and the most
  security-sensitive code in the repo. Three pure stages: `resolve()` → `buildPlan()` →
  `renderPlan()`. No I/O, no execution. **44 tests.** Rules that must hold:
  - `renderPlan` is the **only** code anywhere that knows a package manager's command form.
    Do not generate command text in `apps/web`, `apps/server`, or the catalog.
  - The plan is **data**. A test asserts it contains no command text; keep it that way.
  - Every identifier is re-validated against a strict pattern immediately before
    interpolation, and throws on failure. Never quote-and-hope.
  - Privilege comes from the install method, never from scanning a string for `sudo`.
  - Vendor sources needing a third-party repo are **skipped** (provisional, Q1 — see
    `docs/TechnicalAudit.md` §9). `requiresRepositorySetup()` is the single place that
    decides; change it there, not at the call sites.
  - No application is silently dropped: every one resolves, becomes manual, or is reported
    unavailable, each with an explanation.
- **`packages/mcp`**: **implemented** — ConfigShell's external integration boundary. A stdio
  MCP server built on the **official SDK** (`@modelcontextprotocol/server` v2), with seven
  read-only tools, two resources and one prompt. **52 tests.** Rules:
  - **Use the SDK for protocol, not hand-rolled JSON-RPC.** It owns framing, the handshake,
    version negotiation, capability declaration, JSON Schema generation and argument
    validation. An earlier hand-written implementation was replaced — see `docs/mcp.md` for
    why, and don't reintroduce one.
  - It is a **thin adapter**. No business logic, and no command vocabulary: a test fails if
    `apt-get install`, `sudo ` and friends appear anywhere in the package. Command text comes
    only from `@configshell/installer`.
  - **`detect_system`, `check_installed` and `execute_setup` must never be registered** —
    not even as stubs that return an error. They need the local agent. `WITHHELD_CAPABILITIES`
    records why, and tests assert they stay absent and undiscoverable.
  - **No tool may take a package name, command, flag, URL or repository argument.** A test
    walks the registered Zod schemas. `validate_setup`'s `commands` is the sole exception and
    is only ever compared, never executed or re-emitted.
  - **Schemas are Zod and `.strict()`** — unknown arguments are rejected, not ignored.
  - **`createConfigShellServer()` binds no transport.** `bin.ts` binds stdio; a future HTTP
    entry point binds Streamable HTTP and registers the same tools. Keep `tools.ts` ignorant
    of transport — the integration tests depend on it by using an in-memory pair.
  - Interoperability is tested with the **official MCP client**, not asserted from the spec.
- **`packages/ai`**: a `package.json` and a README, no source — placeholder for the AI
  planning layer. **AI is future scope: do not implement it.**
- **`docs/*.md`**: `architecture.md`, `catalog.md`, `security-model.md` and `development.md` are
  the source of truth for the implementation state, the V1 flow boundary, the security
  model, and the commands — read them before making architecture-adjacent changes.
  `ai.md`, `agent.md` and `mcp.md` are **status documents for unstarted layers**: they
  record constraints any future implementation must satisfy and explicitly state that
  nothing is implemented. Don't turn them into descriptions of working features.
- **Turborepo is not used.** `turbo.json` was empty and has been deleted; root
  `package.json` scripts orchestrate the workspaces with pnpm filters. Don't add a Turbo
  pipeline unless the dependency graph actually needs one.
- **Lint vs. typecheck**: `pnpm lint` at the root is real ESLint (flat config in
  `eslint.config.js`, covering every workspace). `typecheck` is `tsc --noEmit` per
  TypeScript workspace. The old per-workspace `"lint": "tsc --noEmit"` scripts were
  renamed to `typecheck`, and `apps/server`'s broken `lint`/`check` scripts were removed.
- **Tests**: **199**, on Node's built-in runner via `tsx`, in five workspaces —
  `packages/catalog` (45), `packages/installer` (46), `packages/mcp` (52), `apps/server` (45),
  `apps/web` (11).
  They exercise real data and the real app, not fixtures and mocks. **`apps/web` has no DOM
  test runner**, so component behaviour is untested — the largest remaining gap.
- **`apps/web` typecheck (`tsc --noEmit`) needs `@types/react`/`@types/react-dom`**, added
  in Phase 1 — they were missing entirely before that (JSX/React props typechecked as
  effectively `any`, so `tsc --noEmit` looked clean but wasn't actually validating React
  code). Keep them if you touch `apps/web/package.json`.

When adding real functionality, prefer filling in these existing empty files/dirs over
inventing a different structure — the scaffold's shape (controller/service/validator split
on the server, `packages/{ai,catalog,mcp}` as the planned home for those layers) reflects
the intended architecture from `README.md`.

## shadcn/ui setup (`apps/web`)

Initialized in Phase 1 via `pnpm dlx shadcn@latest init --template vite -b radix -p nova`
(Radix UI base, the "Nova" preset — Lucide icons + Geist Variable font, matching the
lucide-react dependency already in use). Config lives in `apps/web/components.json`.

- **The `@/*` import alias points at `apps/web/src`** (`tsconfig.json` `paths` +
  `vite.config.ts` `resolve.alias`). The shadcn CLI's own default assumes `@` → `./src` for
  Vite projects; this repo's alias originally pointed at the app root instead, so the very
  first `init` planted `components/ui` and `lib/utils.ts` outside `src/` before this was
  fixed. If a future `shadcn add` ever lands files outside `src/` again, the alias has
  regressed — fix `tsconfig.json`/`vite.config.ts`, don't just move the files.
  - `cn` (used by every generated component) is a real npm package here (`"cn"` in
    `package.json`), not the classic hand-rolled `clsx` + `tailwind-merge` helper — that's
    this shadcn CLI version's convention, not a mistake.
- **Theming**: `src/index.css` defines light/dark CSS variables (oklch) and
  `@custom-variant dark (&:is(.dark *));` for class-based dark mode (shadcn's own init
  output, not hand-configured). `src/hooks/useTheme.ts` toggles `.dark` on
  `<html>`, persists the choice in `localStorage`, and defaults dark-first. Use existing
  `bg-background`/`text-foreground`/etc. tokens for new UI rather than hardcoded colors so
  both themes keep working.
- **Adding components**: from `apps/web`, `pnpm dlx shadcn@latest add <name>` — it will
  correctly land in `src/components/ui` now that the alias is fixed. Check
  `src/components/ui/` first; don't hand-write something shadcn already provides.
- **Radix primitives render as native interactive elements** (Checkbox/RadioGroupItem as
  `<button>`, etc.) — cards that need "click anywhere to toggle" use a wrapping
  `<label htmlFor>` around the real control rather than a second custom click handler
  (see `AppCard`/`DistroSelector`). Don't nest a real shadcn control inside something
  already interactive (e.g. inside a `<button>`) — that's invalid and double-handles
  input; `<label>` wrapping a button/checkbox is valid and is what's used here.

## Commands

Package manager is pnpm (workspace = `apps/*` + `packages/*`); Node >= 20.

```sh
pnpm install                     # install all workspace deps, from repo root
```

Root scripts (pnpm filters — there is no Turbo pipeline):
```sh
pnpm dev                         # web (5173) + API (3000) in parallel
pnpm dev:web                     # web only — the plan step needs the API
pnpm build                       # == pnpm --filter web build
pnpm start                       # == pnpm --filter web start
pnpm lint                        # eslint . across the whole repo (real ESLint)
pnpm typecheck                   # tsc --noEmit for web, catalog, installer, server (checkJs)
pnpm test                        # 199 tests: catalog 45, installer 46, mcp 52, server 45, web 11
pnpm mcp                         # start the MCP server on stdio
pnpm check                       # lint -> typecheck -> test -> build (what CI runs)
```

Per workspace (name-based filters work; path-based ones still do too):
```sh
pnpm --filter web dev                   # Vite dev server on port 5173
pnpm --filter web build                 # production build -> apps/web/dist
pnpm --filter web preview               # preview the production build
pnpm --filter web start                 # node server.js, serves apps/web/dist as a static SPA
pnpm --filter web typecheck             # tsc --noEmit
pnpm --filter web test                  # tsx --test (API client)

pnpm --filter @configshell/catalog typecheck    # tsc --noEmit
pnpm --filter @configshell/catalog test         # validates the real catalog data

pnpm --filter @configshell/installer typecheck  # tsc --noEmit
pnpm --filter @configshell/installer test       # resolution, plans, command safety

pnpm --filter @configshell/mcp typecheck        # tsc --noEmit
pnpm --filter @configshell/mcp test             # tool surface, protocol, hostile input
pnpm --filter @configshell/mcp start            # stdio MCP server

pnpm --filter server dev                # tsx watch index.js
pnpm --filter server start              # tsx index.js
pnpm --filter server test               # tsx --test — API integration tests
pnpm --filter server typecheck          # tsc --noEmit with checkJs
```

The web dev server is on 5173 and the API on 3000, so they no longer collide. Vite proxies
`/api` to the API (`apps/web/vite.config.ts`); override the target with `CONFIGSHELL_API_URL`.

CI (`.github/workflows/ci.yml`) runs `pnpm install --frozen-lockfile` then lint, typecheck,
test and build on Node 20 and 22, for pushes to `main` and pull requests. If you change a
script name, update the workflow, `README.md`, `docs/development.md`, `CONTRIBUTING.md` and
this file together.

Server uses Node's built-in test runner. Once test files exist (convention: `*.test.js`
alongside the code they test), run a single file from `apps/server`:
```sh
node --test path/to/file.test.js
```

## Open-source repository conventions

This is a public repository. Keep these accurate when you change anything they describe:

- **All community-health documents live in `docs/`, not the repository root:**
  `docs/CONTRIBUTING.md` (setup, branch/commit conventions, PR expectations),
  `docs/SECURITY.md` (private vulnerability reporting — `docs/security-model.md` is the
  *model*, not the policy), `docs/CODE_OF_CONDUCT.md`, `docs/SUPPORT.md`,
  `docs/MAINTAINERS.md`, `docs/ROADMAP.md`, `docs/CHANGELOG.md`,
  `docs/THIRD_PARTY_NOTICES.md`, `docs/NOTICE`. Only `README.md`, `CLAUDE.md` and `LICENSE`
  are at the root. Relative links from `docs/*` to the README need `../`.
- `.github/`: CI workflow, issue templates, PR template, `CODEOWNERS`, `dependabot.yml`,
  `GOOD_FIRST_ISSUES.md`.
- Commit convention: lightweight Conventional Commits (`feat:`, `fix:`, `docs:`,
  `refactor:`, `test:`, `chore:`, `build:`, `ci:`), branches `feature|fix|docs|refactor|chore|test/<name>`.
- Add a `CHANGELOG.md` entry under `## [Unreleased]` for user-visible changes.
- Add any new dependency to `THIRD_PARTY_NOTICES.md` in the same change.
- Never document, display, or imply functionality that doesn't exist — this repo documents
  its own incompleteness on purpose, and reviewers enforce that.
- Never commit a `.env`, a key, or a token. `.env.example` files carry placeholders only.

## Deployment

`.antideploy.json` at the repo root configures Antideploy for this project (just an
`applicationId`); there's no further deployment config checked in.
