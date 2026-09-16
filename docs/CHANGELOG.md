# Changelog

All notable changes to this project are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this
project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

**There are no releases yet.** The project is pre-1.0 and in active early development; the
version in `package.json` is `0.1.0` and has not been tagged or published. While the
version is below `1.0.0`, the public surface may change in a minor release — see
"Versioning" below.

## [Unreleased]

### Added

- Open-source project files: `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, `SECURITY.md`,
  `SUPPORT.md`, `MAINTAINERS.md`, `ROADMAP.md`, `THIRD_PARTY_NOTICES.md`, `NOTICE`, and
  this changelog.
- GitHub contribution tooling: issue templates (bug, feature, documentation), a pull
  request template, `CODEOWNERS`, Dependabot configuration, and a CI workflow running
  install, lint, typecheck, test and build on Node 20 and 22.
- ESLint across the whole repository via a single flat config (`eslint.config.js`), wired
  to `pnpm lint`.
- `apps/server/.env.example` and validated environment configuration
  (`apps/server/config/env.js`): `PORT` and `NODE_ENV` are checked at startup and an
  invalid value fails with an explanatory error.
- READMEs for every workspace, `docs/development.md`, and contributor guides for adding an
  application and adding a distribution in `docs/catalog.md`.
- Honest status documents for the unimplemented layers: `docs/ai.md`, `docs/mcp.md`,
  `docs/agent.md` (previously empty files).
- `.editorconfig` and `.gitattributes`.

### Changed

- `apps/server` now starts successfully. It previously crashed immediately with
  `ERR_MODULE_NOT_FOUND` because it imported `dotenv` without declaring it; `dotenv` is now
  a declared dependency and the port comes from validated configuration.
- The web workspace is named `web` (was `react-example`, a scaffold leftover), so
  `pnpm --filter web …` now works. Root scripts use the name-based filter.
- `lint` scripts that ran `tsc --noEmit` were renamed to `typecheck`; `pnpm lint` is now
  actually ESLint. New root scripts: `typecheck` and `check`.
- `apps/web`'s `clean` script no longer deletes `server.js`, which is a source file.
- Dependency placement: Vite plugins moved to `devDependencies`.
- `apps/web`'s static server now uses Express 5 (matching `apps/server`), which clears two
  moderate `qs` advisories that came in through Express 4 — `pnpm audit` is now clean. Its
  SPA fallback is written as middleware instead of an `app.get('*')` wildcard, which
  Express 5 no longer accepts.

### Removed

- Unused dependencies from `apps/web`: `@google/genai`, `motion`, `dotenv`, `autoprefixer`,
  `esbuild`, `tsx`, and a duplicate `vite` entry.
- Unused, unreferenced images from `apps/web/public/` (`BG.png` and a grid-texture JPEG) —
  scaffold leftovers of unclear provenance.
- The empty `turbo.json`. Turborepo was never installed and root pnpm scripts orchestrate
  the workspaces; the file only implied a pipeline that did not exist.
- `apps/server`'s `lint` and `check` scripts, which invoked an ESLint that was not
  installed and always failed. Linting now runs from the repository root.

### Fixed

- Documentation contradictions in `README.md` (root scripts described as unwired, the
  `LICENSE` file described as missing, empty docs described as written).

---

## Before this changelog

Work up to this point is recorded in the git history rather than here. In summary:

- **Phase 1** — the web UI foundation: Vite + React + TypeScript + Tailwind v4 +
  shadcn/ui, Linux detection indicator, distribution selector, application browser with
  search and category filtering, selection summary, dark/light theme.
- **Phase 2** — `packages/catalog`: 31 verified applications with 116 verified installation
  sources, the data model, dependency-free validation, and the repository's first test
  suite. The web app's local catalog fixture was deleted in favour of it.

---

## Versioning

[Semantic Versioning](https://semver.org/spec/v2.0.0.html): `MAJOR.MINOR.PATCH`.

- **MAJOR** — incompatible changes: removing or renaming a catalog field, changing the
  meaning of an existing one, breaking a package's public API, or removing a documented
  command.
- **MINOR** — backwards-compatible functionality: new catalog entries or applications, a
  new distribution, new UI capabilities, new optional configuration.
- **PATCH** — backwards-compatible fixes: corrections to catalog data, bug fixes,
  documentation and tooling fixes.

While the version is `0.x`, a MINOR bump may include a breaking change — such changes are
called out explicitly in the entry, marked **BREAKING**. The first tagged release is
expected to be `0.1.0`; `1.0.0` is not planned until the V1 flow (through terminal command
generation) is complete.

Releases are cut by the repository owner: move the `[Unreleased]` entries under a new
`## [x.y.z] - YYYY-MM-DD` heading, bump the versions in the affected `package.json` files,
tag the commit `vx.y.z`, and publish a GitHub release pointing at that section.
