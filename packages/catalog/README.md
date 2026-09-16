# `@linux-app-platform/catalog`

The verified application catalog — the **single source of truth** for application metadata
in this repository. 31 applications, 116 verified installation sources.

TypeScript source with **no build step**: `main`/`types`/`exports` point straight at
`src/index.ts`, and both Vite and `tsc` resolve it through the pnpm workspace symlink.
Do not add a bundler or a `dist/` pipeline unless something actually needs one.

## Use it

```ts
import { APPLICATIONS, CATEGORIES, DISTROS, type Application } from '@linux-app-platform/catalog';
```

Consumers import from the package root only. The web app depends on it via `workspace:*`
and keeps no application data of its own.

## Commands

```sh
pnpm --filter @linux-app-platform/catalog test       # node test runner via tsx
pnpm --filter @linux-app-platform/catalog typecheck  # tsc --noEmit
```

The test suite validates the **real** catalog, not just synthetic fixtures, so a malformed
entry fails CI.

## Layout

```
src/types.ts          the data model (Application, InstallationSource, …)
src/applications.ts   the verified entries
src/validate.ts       dependency-free integrity checks
src/validate.test.ts  tests for the checks and for the real data
src/index.ts          public API
```

## Adding or changing entries

Read [`docs/catalog.md`](../../docs/catalog.md) first — it is the normative document. The
rules that get pull requests rejected most often:

- **Never invent an identifier or URL.** If you cannot confirm it against an authoritative
  source, leave it out. Absence means "not verified", never "not available".
- **The AUR is not `pacman`.** Only Arch's official core/extra/multilib repositories count.
- **No version numbers, ever.** The catalog records which package to use, not which version.
- **No commands, flags, or shell fragments** in any field. The catalog is inert data; only
  a future resolver turns `method` + `identifier` into a command.
- **Record provenance honestly** with `origin` (`distro` / `vendor` / `community`). A
  third-party Flatpak repackaging is `community`, even with an official-looking ID.

Then run the tests — they enforce most of the above mechanically.
