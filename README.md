# ConfigShell

[![CI](https://github.com/AbhiDevepl/linux-app-platform/actions/workflows/ci.yml/badge.svg)](https://github.com/AbhiDevepl/linux-app-platform/actions/workflows/ci.yml)
[![License: Apache 2.0](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D20-brightgreen.svg)](https://nodejs.org)
[![pnpm](https://img.shields.io/badge/pnpm-9.15.5-orange.svg)](https://pnpm.io)

An open-source, AI-native Linux software discovery and management platform.

The long-term goal is to help users discover Linux applications, understand how compatible
those applications are with their system, and — with explicit consent — plan and validate
installation workflows. AI is intended to reason about software and plan actions; it is
never granted unrestricted access to the operating system.

> **Status: V1 in development. Nothing here installs software yet.**
> This README separates what is implemented from what is planned, and says so at every
> point. Anything described as "planned" or "future work" does not exist in the code.

**Quick links:** [What works today](#what-exists-today) ·
[Install](#installation) · [Development](#development) ·
[Contributing](CONTRIBUTING.md) · [Roadmap](ROADMAP.md) ·
[Good first issues](.github/GOOD_FIRST_ISSUES.md) · [Security](SECURITY.md)

---

## What this project is

A curated catalog of Linux applications plus an interface for choosing the ones you want —
with, eventually, a safe path from "I want these applications" to "they are installed",
that never puts a shell behind a web page.

**Why it exists.** Setting up a fresh Linux system means identifying your distribution,
knowing its package ecosystem, checking whether each application is in the default
repositories, finding the right installation method, and copying commands from a dozen
websites. The information is scattered, often outdated, and frequently wrong for your
distribution specifically. This project's answer is a small, *verified* catalog and a flow
that is honest about what it does not know.

The intended end-to-end experience:

1. **Discover** Linux applications from a curated catalog.
2. **Understand** compatibility with your system (distribution, architecture, desktop
   environment, package managers, installed software).
3. **Search and filter** by name, category, and other attributes.
4. **Select** multiple applications.
5. **Generate a safe installation plan** that resolves each application against the catalog.
6. **Eventually** use AI to recommend and plan workflows, expose controlled capabilities
   through MCP, and let a local Linux agent perform validated system operations.

### Non-negotiable safety principles

- The browser **never** directly executes arbitrary shell commands.
- AI **never** receives unrestricted system access.
- System-changing operations must go through a **trusted local agent** with validation and
  explicit user confirmation.
- Applications must resolve against the **trusted catalog** — untrusted manifests are never
  installed.

See [Security](#security) and [`docs/security.md`](docs/security.md) for the full model.

---

## What exists today

- **A working web interface** (`apps/web`) — Vite + React 19 + TypeScript + Tailwind CSS v4
  + [shadcn/ui](https://ui.shadcn.com) (Radix UI base). A browser-only "does this look like
  Linux" indicator, manual distribution selection (Ubuntu, Debian, Fedora, Arch Linux), a
  searchable and filterable application browser, selectable application cards, a selection
  summary (sidebar on desktop, sheet + sticky bottom bar on mobile), and a dark/light theme
  toggle that defaults to dark. **Nothing on this page installs, executes, or generates a
  command** — the "Continue" button is intentionally inert.

- **A real, verified application catalog** (`packages/catalog`) — 31 applications across
  seven categories, with 116 installation sources whose identifiers were each checked
  against an authoritative source (the distribution's own package database, Flathub, the
  Snap Store, or vendor documentation). It is the single source of truth for application
  metadata; the web app consumes it via `@linux-app-platform/catalog` and owns no
  application data of its own. Support is explicit per distribution rather than assumed,
  unverified identifiers are omitted rather than guessed, version numbers are never
  recorded, and each source is labelled `distro` / `vendor` / `community` so third-party
  repackagings are not presented as vendor-official. The catalog is inert descriptive data:
  it contains **no commands**, and nothing acts on it yet. See
  [`docs/catalog.md`](docs/catalog.md).

- **An Express API scaffold** (`apps/server`) — starts, validates its environment, and
  registers **no routes**. The `controllers/`, `services/`, `routes/`, `middleware/`,
  `validators/` and `utils/` directories exist but their files are empty. The web app does
  not call it.

- **Repository tooling** — pnpm workspaces, repository-wide ESLint, per-workspace
  typechecking, the catalog test suite, and CI that runs all of it on Node 20 and 22.

**Not implemented (planned):** package-manager resolution (turning catalog metadata into an
install plan), terminal command generation, system detection beyond "does the browser look
like Linux", application detail pages, application icons, AI features, the MCP server, the
local Linux agent, database storage, and authentication. See [`ROADMAP.md`](ROADMAP.md).

*There is no screenshot or demo in this README yet — run it locally with `pnpm dev`; it
takes about a minute.*

---

## Architecture

The platform is designed around a strict separation of layers:

```
UI                 ✻  React web application
   ↓
Application Catalog   Curated application data, independent of the UI
   ↓
System Detection      What the user's Linux system looks like
   ↓
AI / Planning         Recommendation, compatibility, and plan generation
   ↓
MCP                   A controlled, tool-based interface for AI systems
   ↓
Local Agent           Runs on the user's machine; understands the OS
   ↓
Validated System
Operation             The only layer that can change the system
```

**Of that pipeline, the first two layers exist.** Everything below "Application Catalog" is
design, not code:

```mermaid
flowchart LR
    CATALOG["packages/catalog<br/>verified application data"] -- "bundled at build time" --> WEB["apps/web<br/>React interface"]
    WEB -. "not wired up" .-> SERVER["apps/server<br/>Express scaffold"]
    SERVER -. "does not exist" .-> REST["AI · MCP · local agent"]
```

Each layer is intentionally decoupled so security boundaries can be enforced at each hop:
nothing downstream runs arbitrary input, and nothing upstream can touch the operating
system directly. Full detail — including what is implemented versus planned — is in
[`docs/architecture.md`](docs/architecture.md).

---

## Current V1 scope

V1 is a **Ninite-style installer-command generator, not an installer**: it stops at
generating a terminal command that the user copies and runs themselves.

```
Website → Linux detection state → Distribution selection → Application catalog
→ Application selection → Installer resolution → Terminal command generation
→ Copy to terminal → user runs it themselves
```

| Piece | Status |
| ----- | ------ |
| Linux application discovery (UI + verified catalog) | **implemented** |
| Manual distribution selection (Ubuntu / Debian / Fedora / Arch Linux) | **implemented** |
| Browser-only "looks like Linux" detection | **implemented** |
| Search | **implemented** |
| Category filtering | **implemented** |
| Application selection + selection summary | **implemented** |
| Responsive interface | **implemented** |
| Dark/light theme toggle (dark by default) | **implemented** |
| Verified application catalog (31 apps, metadata only) | **implemented** |
| Application details | not started |
| Installer resolution (APT/DNF/Pacman/Flatpak/Snap) | not started |
| Terminal command generation / copy to clipboard | not started |

V1 does **not** include real package installation, arbitrary shell execution, MCP, AI, or a
local agent — those are out of scope for V1 entirely.

### Important distro detection rule

Normal browser APIs cannot reliably identify which Linux distribution a visitor is running.
`apps/web/src/hooks/useLinuxDetection.ts` only ever reports whether the browser *looks like*
Linux (and explicitly excludes Android, which also reports "Linux" in its user agent) —
never a specific distribution. Exact distribution is always a manual, explicit choice in the
selector. True system-level distro detection is a future local-agent capability, not a
browser one.

### Application catalog categories

Browsers · Code Editors · CLI Tools · Development · Utilities · Media · Communication

Every application belongs to exactly one category. See
[`docs/catalog.md`](docs/catalog.md).

---

## Tech stack

| Layer | Technology |
| ----- | ---------- |
| Web interface | React 19, Vite, TypeScript, Tailwind CSS v4, shadcn/ui (Radix UI), Lucide icons, Geist font |
| API server | Node.js, Express *(scaffold — no endpoints)* |
| Shared packages | TypeScript, no build step |
| Monorepo | pnpm workspaces (no Turborepo pipeline — root pnpm scripts orchestrate) |
| Lint / types / tests | ESLint (flat config), `tsc --noEmit`, Node's built-in test runner |
| CI | GitHub Actions, Node 20 and 22 |
| Planned | AI/LLM providers, MCP, a local Linux agent, PostgreSQL, Zod, Vitest, Playwright |

---

## Repository structure

```
apps/
├── server/            Express API scaffold — starts, registers no routes
│   ├── config/        env.js / index.js — validated configuration (the only code here)
│   ├── controllers/   empty
│   ├── middleware/    empty
│   ├── routes/        empty
│   ├── services/      empty
│   ├── utils/         empty
│   ├── validators/    empty
│   └── .env.example   environment template (all values optional)
└── web/               React web app (shadcn/ui on Tailwind v4)
    ├── src/
    │   ├── components/
    │   │   ├── ui/            shadcn-generated primitives
    │   │   ├── layout/        header, theme toggle
    │   │   ├── detection/     Linux detection card
    │   │   ├── distro/        distribution selector
    │   │   ├── applications/  catalog list, search/filter, cards
    │   │   └── selection/     selection summary, list, sticky bar
    │   ├── data/distros.ts    selector copy (the Distro type comes from the catalog)
    │   ├── hooks/             useLinuxDetection, useTheme
    │   └── lib/utils.ts       `cn` re-export
    ├── server.js              static server for the production build
    ├── components.json        shadcn/ui config
    └── vite.config.ts

packages/
├── ai/                placeholder — no source (docs/ai.md)
├── catalog/           verified application catalog — single source of truth
│   └── src/           types.ts · applications.ts · validate.ts · validate.test.ts · index.ts
└── mcp/               placeholder — no source (docs/mcp.md)

docs/                  architecture · catalog · security · development · ai · agent · mcp
.github/               CI workflow, issue/PR templates, CODEOWNERS, Dependabot, good first issues
```

Each workspace has its own README describing what is real in it.

---

## Requirements

- **Node.js >= 20** (developed on 20 and 22; CI runs both)
- **pnpm 9.15.5** (pinned in `package.json` via `packageManager`)
- git

```sh
corepack enable
corepack prepare pnpm@9.15.5 --activate
```

Nothing in this repository requires root, installs system packages, or modifies your
machine.

## Installation

```sh
git clone https://github.com/AbhiDevepl/linux-app-platform.git
cd linux-app-platform
pnpm install
```

## Environment setup

**Optional.** The web app reads no environment variables and the server starts without any.
For the server:

```sh
cp apps/server/.env.example apps/server/.env
```

| Variable | Used by | Required | Default |
| -------- | ------- | -------- | ------- |
| `PORT` | `apps/server` (and `apps/web`'s `server.js`, from the process environment) | no | `3000` |
| `NODE_ENV` | `apps/server` | no | `development` |
| `DISABLE_HMR` | `apps/web` dev server | no | unset |

Invalid values fail server startup with an explanatory error rather than being ignored.
There are deliberately **no** AI keys, database URLs, or auth secrets — nothing in the
repository implements a feature that needs one. `.env` files are git-ignored; never put a
real secret in a `.env.example`. Details in [`docs/development.md`](docs/development.md).

## Development

```sh
pnpm dev                    # web app → http://localhost:3000
```

Per workspace:

```sh
pnpm --filter web dev       # Vite dev server, port 3000
pnpm --filter web build     # production build → apps/web/dist
pnpm --filter web preview   # preview the production build
pnpm --filter web start     # serve apps/web/dist (needs a build first)
pnpm --filter server dev    # Express scaffold via nodemon — starts, serves nothing
```

> Both default to port 3000. Set `PORT` in `apps/server/.env` to run them together.

### Checks

```sh
pnpm check       # lint → typecheck → test → build (what CI runs)

pnpm lint        # ESLint across the repository
pnpm typecheck   # tsc --noEmit for apps/web and packages/catalog
pnpm test        # catalog test suite (+ apps/server, which has no test files yet)
pnpm build       # production build of apps/web
```

There is no formatter to run — `.editorconfig` covers the basics; match the file you are
editing.

## Testing

`packages/catalog` has the repository's **only** test suite: 20 tests on Node's built-in
runner (via `tsx`) that validate the real catalog data, not just fixtures.

```sh
pnpm --filter @linux-app-platform/catalog test
```

`apps/server` runs `node --test` and finds no test files (a pass with zero tests).
`apps/web` has no test runner at all. Closing those gaps is open work — see
[`.github/GOOD_FIRST_ISSUES.md`](.github/GOOD_FIRST_ISSUES.md).

---

## Contributing

Contributions are welcome, and the most useful ones right now are catalog additions, tests,
and documentation fixes.

- [`CONTRIBUTING.md`](CONTRIBUTING.md) — setup, branch and commit conventions, pull request
  process, and what reviewers look for.
- [`.github/GOOD_FIRST_ISSUES.md`](.github/GOOD_FIRST_ISSUES.md) — 16 real tasks with the
  files each one touches.
- [`CODE_OF_CONDUCT.md`](CODE_OF_CONDUCT.md) — expected conduct in every project space.
- [`MAINTAINERS.md`](MAINTAINERS.md) — who maintains what and who decides what.
- [`SUPPORT.md`](SUPPORT.md) — where questions go.

House rules, in short: keep features modular, avoid unnecessary dependencies, keep catalog
data separate from the UI, never introduce unsafe command execution, add tests for
important functionality, keep pull requests focused, and never document or display
functionality that does not exist.

---

## Security

Security is a design constraint, not an afterthought:

- **No arbitrary shell execution from the browser.**
- **No remote sudo.** Privileged operations are never exposed over a remote interface.
- **No unrestricted command execution.** All operations are scoped and validated.
- **AI cannot control the operating system.** It plans and recommends; it never executes.
- **Installation requests must be validated** before execution.
- **Applications must resolve against the trusted catalog.**
- **System-changing operations require explicit user confirmation.**
- **Privileged operations belong in the local agent** — the only component allowed to change
  a system.
- **Security-sensitive operations are logged** and auditable.

The full model is in [`docs/security.md`](docs/security.md). To **report a vulnerability**,
follow [`SECURITY.md`](SECURITY.md) — not a public issue.

---

## Documentation

| Document | What it covers |
| -------- | -------------- |
| [`docs/development.md`](docs/development.md) | Setup, commands, environment, troubleshooting |
| [`docs/architecture.md`](docs/architecture.md) | Layer separation; implemented vs. planned |
| [`docs/catalog.md`](docs/catalog.md) | Catalog schema, verification rules, how to add an application or a distribution |
| [`docs/security.md`](docs/security.md) | The security model |
| [`docs/ai.md`](docs/ai.md) | AI planning layer — **not started**; constraints for any implementation |
| [`docs/mcp.md`](docs/mcp.md) | MCP interface — **not started**; intended shape and rules |
| [`docs/agent.md`](docs/agent.md) | Local Linux agent — **not started**; rules it must follow |
| [`ROADMAP.md`](ROADMAP.md) | Done, current, planned, and explicitly out of scope |
| [`CHANGELOG.md`](CHANGELOG.md) | Notable changes and the versioning policy |
| [`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md) | Third-party licenses and attribution |

`CLAUDE.md` holds working notes for AI coding assistants used on this repository; it is not
required reading for contributors, but it is kept accurate.

---

## Roadmap

| Milestone | Contents |
| --------- | -------- |
| **V1 — Discovery** | Web foundation ✅, application catalog ✅, search/filtering ✅, selection flow ✅, application details, installer resolution, command generation |
| **V2 — Intelligence** | AI recommendations, compatibility analysis, natural-language discovery, installation planning |
| **V3 — MCP** | MCP server, resources, tools, tool authorization |
| **V4 — Local agent** | Linux system detection, package-manager detection, installation validation, confirmed installation |
| **V5 — Production** | Database, accounts, catalog management, community contributions, infrastructure |

Details, including what is deliberately **not** on the roadmap, are in
[`ROADMAP.md`](ROADMAP.md).

---

## License

Distributed under the **Apache License 2.0** — see [`LICENSE`](LICENSE) for the full text
and [`NOTICE`](NOTICE) for the copyright notice. Third-party components and their licenses
are listed in [`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md).

Application names in the catalog are trademarks of their respective owners; this project is
not affiliated with or endorsed by any of them and redistributes none of their software.

## Maintainers

Created and maintained by **AbhiDevepl** and **tejjasdev** — see
[`MAINTAINERS.md`](MAINTAINERS.md).

GitHub: [AbhiDevepl/linux-app-platform](https://github.com/AbhiDevepl/linux-app-platform)
