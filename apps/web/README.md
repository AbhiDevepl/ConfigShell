# `web` — the web interface

Vite + React 19 + TypeScript + Tailwind CSS v4 + [shadcn/ui](https://ui.shadcn.com)
(Radix UI base). This is the only part of the platform a user currently interacts with.

## What it does today

Renders the discovery flow: a browser-only "does this look like Linux" indicator, manual
distribution selection, a searchable/filterable application list, selection state, and a
selection summary (sidebar on desktop, sheet + sticky bar on mobile), plus a dark/light
theme toggle.

It makes **no network requests** and calls **no backend**. All application data comes from
[`@configshell/catalog`](../../packages/catalog) at build time. Selection state is
in-memory only and does not survive a refresh. The "Continue" button is intentionally
inert — nothing here generates or runs a command.

## Commands

Run from the repository root (or from this directory without the `--filter`):

```sh
pnpm --filter web dev        # Vite dev server on http://localhost:3000
pnpm --filter web build      # production build → apps/web/dist
pnpm --filter web preview    # serve the production build with Vite
pnpm --filter web start      # serve apps/web/dist with server.js (needs a build first)
pnpm --filter web typecheck  # tsc --noEmit
```

Environment variables: none are required. `PORT` (used by `server.js`, default 3000) and
`DISABLE_HMR` (dev server only) are read from the process environment; this app does not
load `.env` files.

## Layout

```
src/
├── App.tsx                 page composition and all shared state
├── components/
│   ├── ui/                 shadcn-generated primitives — do not hand-edit lightly
│   ├── layout/             header, theme toggle
│   ├── detection/          Linux detection card
│   ├── distro/             distribution selector
│   ├── applications/       catalog list, search/filter, app cards
│   └── selection/          selection summary, list, sticky bottom bar
├── data/distros.ts         selector copy (the `Distro` type comes from the catalog)
├── hooks/                  useLinuxDetection, useTheme
├── lib/utils.ts            re-export of `cn`
└── index.css               Tailwind entry + shadcn theme tokens
server.js                   static file server used by `pnpm start`
vite.config.ts              Vite config (includes an AI Studio media plugin)
components.json             shadcn/ui config
metadata.json               Google AI Studio manifest (dev tooling, not shipped)
```

There is no `public/` directory in the repository — the app ships no static images or
icons. Create one if you add an asset (Vite copies its contents to `dist/` verbatim).

## Conventions

- **Import alias:** `@/*` → `apps/web/src/*` (configured in both `tsconfig.json` and
  `vite.config.ts` — they must stay in sync).
- **Adding a component:** check `src/components/ui/` first, then
  `pnpm dlx shadcn@latest add <name>` from this directory. Generated files land in
  `src/components/ui/`.
- **Colors:** use the theme tokens (`bg-background`, `text-foreground`, `border-border`, …)
  rather than hardcoded colors, so both themes keep working.
- **Radix primitives render as real interactive elements.** For "click anywhere to toggle"
  cards, wrap the real control in a `<label htmlFor>` (see `AppCard`, `DistroSelector`) —
  never nest a control inside another interactive element.
- **No application data lives here.** Add applications to `packages/catalog` instead.

See [`CLAUDE.md`](../../CLAUDE.md) for the full shadcn/ui setup notes and
[`docs/architecture.md`](../../docs/architecture.md) for where this layer sits.
