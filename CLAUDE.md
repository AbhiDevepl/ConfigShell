# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

ConfigShell is an early-stage, open-source Linux software discovery and management
platform. The intended product (see `README.md`) is a layered pipeline:

```
UI → Application Catalog → System Detection → AI / Planning → MCP  → Validated System Operation
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

- **`apps/server/`**: the only files with code are `index.js` — a bare `express()` app that
  calls `app.listen(...)` and registers no routes or middleware — and `config/env.js` +
  `config/index.js`, which load `.env` via `dotenv`, validate `PORT`/`NODE_ENV`, and throw
  an explanatory error on an invalid value. `app.js` and every file in `routes/`,
  `controllers/`, `services/`, `middleware/`, `validators/`, `utils/` is still 0 bytes.
  There is no routing, no catalog endpoint, no AI endpoint, and no auth, despite the
  directory names. The server *does* start (`pnpm --filter server start`) — it just serves
  nothing. Variables are documented in `apps/server/.env.example`; `.env` is git-ignored.
- **`apps/web/`**: a Vite + React + TypeScript + Tailwind v4 + **shadcn/ui** app. As of
  Phase 1 it has a working UI foundation for the actual product, built primarily from
  shadcn components (`components/ui/*` — button, card, badge, checkbox, radio-group,
  input, toggle-group, separator, scroll-area, alert, sheet, empty, label, tooltip),
  composed under `components/{layout,detection,distro,applications,selection}/`. See
  "shadcn/ui setup" below before adding more components or new UI code.
  Application data comes from `@configshell/catalog` (see below); the web app holds
  no catalog of its own, and `src/data/distros.ts` now only carries selector copy, with the
  `Distro` type imported from the catalog. There is no command generation, no
  package-manager resolution, and no backend calls yet — see `docs/architecture.md` for
  what's planned vs. implemented.
  The workspace is named `web` (it was `react-example`, a scaffold leftover, until the
  open-source cleanup), so both `--filter web` and `--filter ./apps/web` resolve.
- **`packages/catalog`**: real, and as of Phase 2 the **single source of truth for
  application metadata** — 31 verified applications, the data model, a dependency-free
  validation function, and its own tests. Published to the workspace as
  `@configshell/catalog` and consumed by `apps/web` via `workspace:*`. It is
  TypeScript source with **no build step** (`main`/`types`/`exports` point straight at
  `src/index.ts`); Vite and `tsc` both resolve it through the pnpm symlink, so don't add a
  bundler/`dist` pipeline unless something actually needs one. `apps/web/src/data/
  mockCatalog.ts` is **gone** — never reintroduce a second catalog in the web app. Read
  `docs/catalog.md` before adding entries: identifiers must be verified against an
  authoritative source, unverified ones are omitted rather than guessed, the AUR doesn't
  count as `pacman`, and version numbers are never recorded.
- **`packages/ai`, `packages/mcp`**: a `package.json` and a README each, no source —
  placeholders for the AI planning and MCP layers. They are real (empty) workspace members.
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
- **Tests**: `packages/catalog` has the repo's only test suite (Node's built-in runner via
  `tsx`: `pnpm --filter @configshell/catalog test`). `apps/server` has no test
  files (`node --test` passes with zero tests); `apps/web` has no test runner at all.
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
pnpm dev                         # == pnpm --filter web dev  (web only, no server)
pnpm build                       # == pnpm --filter web build
pnpm start                       # == pnpm --filter web start
pnpm lint                        # eslint . across the whole repo (real ESLint)
pnpm typecheck                   # tsc --noEmit for apps/web and packages/catalog
pnpm test                        # catalog tests (tsx --test), then apps/server (node --test, no files)
pnpm check                       # lint -> typecheck -> test -> build (what CI runs)
```

Per workspace (name-based filters work; path-based ones still do too):
```sh
pnpm --filter web dev                   # Vite dev server on port 3000
pnpm --filter web build                 # production build -> apps/web/dist
pnpm --filter web preview               # preview the production build
pnpm --filter web start                 # node server.js, serves apps/web/dist as a static SPA
pnpm --filter web typecheck             # tsc --noEmit

pnpm --filter @configshell/catalog typecheck   # tsc --noEmit
pnpm --filter @configshell/catalog test        # node test runner via tsx — validates the real catalog

pnpm --filter server dev                # nodemon index.js — starts, serves nothing
pnpm --filter server start              # node index.js
pnpm --filter server test               # node --test (no test files exist yet)
```

The web dev server and the server both default to port 3000 — set `PORT` in
`apps/server/.env` (see `apps/server/.env.example`) before running both at once.

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
