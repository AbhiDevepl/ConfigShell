# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

Linux App Platform is an early-stage, open-source Linux software discovery and management
platform. The intended product (see `README.md`) is a layered pipeline:

```
UI → Application Catalog → System Detection → AI / Planning → MCP → Local Agent → Validated System Operation
```

Non-negotiable safety principles that govern any feature work here:
- The browser/web app never executes arbitrary shell commands.
- AI never gets unrestricted system access — it plans/recommends, it does not execute.
- System-changing operations must go through a trusted local agent with validation and
  explicit user confirmation.
- Installed applications must resolve against the trusted catalog; untrusted manifests are
  never installed.

## Current implementation state (read before assuming anything works)

This repo is a scaffold — most files exist as empty placeholders, not stubs with TODOs.
Before editing, check whether a file actually has content; many don't:

- **`apps/server/`**: only `index.js` has code, and it's a bare `express()` app that just
  calls `app.listen(3000, ...)` — it does not import or mount `app.js`, `routes/`,
  `controllers/`, `services/`, `middleware/`, `validators/`, `utils/`, or `config/`. Every
  file in those directories is 0 bytes. There is no routing, no catalog data, no AI
  endpoint, and no auth wired up yet, despite the directory names suggesting otherwise.
  **It also doesn't currently run**: `index.js` does `import dotenv from "dotenv"` but
  `dotenv` isn't declared in `apps/server/package.json` — `node index.js` throws
  `ERR_MODULE_NOT_FOUND` immediately.
- **`apps/web/`**: a Vite + React + TypeScript + Tailwind v4 + **shadcn/ui** app. As of
  Phase 1 it has a working UI foundation for the actual product, built primarily from
  shadcn components (`components/ui/*` — button, card, badge, checkbox, radio-group,
  input, toggle-group, separator, scroll-area, alert, sheet, empty, label, tooltip),
  composed under `components/{layout,detection,distro,applications,selection}/`. See
  "shadcn/ui setup" below before adding more components or new UI code.
  Application data comes from `@linux-app-platform/catalog` (see below); the web app holds
  no catalog of its own, and `src/data/distros.ts` now only carries selector copy, with the
  `Distro` type imported from the catalog. There is no command generation, no
  package-manager resolution, and no backend calls yet — see `docs/architecture.md` for
  what's planned vs. implemented.
  `apps/web/package.json`'s `name` field is still `react-example` (a scaffold leftover) —
  see the pnpm filter note under Commands below.
- **`packages/catalog`**: real, and as of Phase 2 the **single source of truth for
  application metadata** — 31 verified applications, the data model, a dependency-free
  validation function, and its own tests. Published to the workspace as
  `@linux-app-platform/catalog` and consumed by `apps/web` via `workspace:*`. It is
  TypeScript source with **no build step** (`main`/`types`/`exports` point straight at
  `src/index.ts`); Vite and `tsc` both resolve it through the pnpm symlink, so don't add a
  bundler/`dist` pipeline unless something actually needs one. `apps/web/src/data/
  mockCatalog.ts` is **gone** — never reintroduce a second catalog in the web app. Read
  `docs/catalog.md` before adding entries: identifiers must be verified against an
  authoritative source, unverified ones are omitted rather than guessed, the AUR doesn't
  count as `pacman`, and version numbers are never recorded.
- **`packages/ai`, `packages/mcp`**: contain only a `.gitkeep` each — placeholders for the
  AI planning and MCP layers.
- **`docs/*.md`**: `architecture.md`, `catalog.md`, and `security.md` are now written and
  are the source of truth for the current Phase 1 implementation state, the V1 flow
  boundary, and the security model — read them before making architecture-adjacent
  changes. `ai.md`, `agent.md`, and `mcp.md` are still empty placeholders (post-V1 layers
  with no work started).
- **`turbo.json`**: empty. Turborepo is a stated dependency but has no configured
  pipeline; there are no root `turbo` tasks to run.
- **`apps/server` lint**: `package.json` defines `"lint": "eslint ."`, but ESLint is not a
  dependency anywhere in the repo and no ESLint config exists — this script currently
  fails until both are added.
- **Tests**: `packages/catalog` has the repo's only test suite (Node's built-in runner via
  `tsx`: `pnpm --filter ./packages/catalog test`). `apps/web` and `apps/server` still have
  no tests.
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

Root-level scripts only proxy to specific workspaces (not a full monorepo orchestration —
`turbo.json` is unconfigured):
```sh
pnpm dev                         # == pnpm --filter ./apps/web dev  (web only, no server)
pnpm build                       # == pnpm --filter ./apps/web build
pnpm start                       # == pnpm --filter ./apps/web start
pnpm lint                        # == pnpm --filter ./apps/web lint (tsc --noEmit, not ESLint)
pnpm test                        # catalog tests (tsx --test), then apps/server (node --test, no files)
```

Run each app directly when you need both, or need server-specific tasks. `apps/web`'s
`package.json` name is `react-example` (scaffold leftover), so pnpm's name-based
`--filter web` does **not** match — use the path-based filter:
```sh
pnpm --filter ./apps/web dev            # Vite dev server on port 3000
pnpm --filter ./apps/web build          # production build -> apps/web/dist
pnpm --filter ./apps/web preview        # preview the production build
pnpm --filter ./apps/web start          # node server.js, serves apps/web/dist as a static SPA
pnpm --filter ./apps/web lint           # tsc --noEmit (this is a type-check, not ESLint)

pnpm --filter ./packages/catalog lint   # tsc --noEmit
pnpm --filter ./packages/catalog test   # node test runner via tsx — validates the real catalog

pnpm --filter ./apps/server dev         # nodemon index.js — currently crashes, see above
pnpm --filter ./apps/server start       # node index.js — currently crashes, see above
pnpm --filter ./apps/server test        # node --test (no test files exist yet)
pnpm --filter ./apps/server check       # lint + test (lint currently fails — see above)
```

The web dev server and the server dev process both default to port 3000 — don't run both
at once without changing one's port (moot right now since the server doesn't start).

Server uses Node's built-in test runner. Once test files exist (convention: `*.test.js`
alongside the code they test), run a single file from `apps/server`:
```sh
node --test path/to/file.test.js
```

## Deployment

`.antideploy.json` at the repo root configures Antideploy for this project (just an
`applicationId`); there's no further deployment config checked in.
