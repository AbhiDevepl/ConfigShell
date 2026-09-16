# ConfigShell

An open-source, AI-native Linux software discovery and management platform.

The project's long-term goal is to help users discover Linux applications, understand
how compatible those applications are with their system, and — with explicit consent —
plan and validate installation workflows. AI is intended to reason about software and
plan actions; it is never granted unrestricted access to the operating system.

> **Status: V1 in development.** The platform is being built incrementally. This README
> clearly separates what is currently implemented from what is planned. Nothing described
> below as "planned" or "future work" should be treated as shipped functionality.

---

## What this project does

Today the platform is a foundation being assembled from the pieces described below. The
intended end-to-end experience is:

1. **Discover** Linux applications from a curated catalog.
2. **Understand** compatibility with your Linux system (distribution, architecture,
   desktop environment, package managers, installed software).
3. **Search and filter** software by name, category, and other attributes.
4. **Select** multiple applications.
5. **Generate a safe installation plan** that resolves each app against the catalog.
6. **Eventually** use AI to recommend and plan software workflows, expose controlled
   capabilities through MCP, and have a local Linux agent perform validated system
   operations.

### Non-negotiable safety principles

- The browser **never** directly executes arbitrary shell commands.
- AI **never** receives unrestricted system access.
- System-changing operations must go through a **trusted local agent** with validation
  and explicit user confirmation.

See [Security](#security) for the full policy.

---

## Project status

The current repository layout:

```
apps/
├── server/        Express API server (scaffold)
│   ├── app.js
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── routes/
│   ├── services/
│   ├── utils/
│   └── validators/
└── web/           React web app (shadcn/ui on Tailwind v4)
    ├── src/
    │   ├── components/
    │   │   ├── ui/           shadcn-generated primitives (button, card, checkbox, ...)
    │   │   ├── layout/        Header, theme toggle
    │   │   ├── detection/     Linux detection banner
    │   │   ├── distro/       Distribution selector
    │   │   ├── applications/ App catalog, search/filter, cards
    │   │   └── selection/     Selection summary, sticky bottom bar
    │   ├── data/          Distro selector copy (Distro type comes from the catalog)
    │   ├── hooks/         Browser-only Linux detection, light/dark theme
    │   └── lib/            shadcn's `cn` re-export
    ├── components.json  shadcn/ui config
    ├── public/
    ├── index.html
    ├── package.json
    └── vite.config.ts

packages/
├── ai/            (placeholder)
├── catalog/       Verified application catalog — single source of truth
│   └── src/
│       ├── types.ts         Data model
│       ├── applications.ts  The verified entries
│       ├── validate.ts      Integrity checks
│       └── index.ts         Public API
├── mcp/           (placeholder)
├── types/         (planned)
└── ui/            (planned)

docs/
├── agent.md
├── ai.md
├── architecture.md
├── catalog.md
├── mcp.md
└── security.md
```

**What exists today:**

- A Vite + React + TypeScript + Tailwind CSS + **shadcn/ui** (Radix UI base) web
  application (`apps/web`) with a working **Phase 1 UI foundation**: a browser-only "does
  this look like Linux" indicator, manual distribution selection (Ubuntu, Debian, Fedora,
  Arch Linux), a searchable/filterable application browser, selectable application cards,
  a selection summary (sidebar on desktop, sheet + sticky bottom bar on mobile), and a
  dark/light theme toggle (dark by default). Built from shadcn primitives — button, card,
  badge, checkbox, radio-group, input, toggle-group, alert, sheet, empty, tooltip, etc.
  (`apps/web/src/components/ui`). Nothing on this page installs, executes, or generates a
  command — the "Continue" button is intentionally inert.
- A **real, verified application catalog** (`packages/catalog`, **Phase 2**) — 31
  applications across the seven categories, with 116 installation sources whose identifiers
  were each checked against an authoritative source (the distribution's own package
  database, Flathub, the Snap Store, or vendor documentation). It is the single source of
  truth for application metadata; the web app consumes it via `@linux-app-platform/catalog`
  and owns no application data of its own. Support is explicit per distribution rather than
  assumed, unverified identifiers are omitted rather than guessed, no version numbers are
  recorded, and each source is labelled `distro` / `vendor` / `community` so third-party
  repackagings aren't presented as vendor-official. The catalog is inert descriptive data —
  it contains **no commands** and nothing acts on it yet. See
  [`docs/catalog.md`](docs/catalog.md).
- An Express API server scaffold (`apps/server`) with routing, controller, service, and
  validator directories, all still empty. The server is not yet wired to serve the platform
  API, and its one file with code (`index.js`) currently fails to start — it imports
  `dotenv`, which isn't declared as a dependency.
- Empty workspace packages (`packages/ai`, `packages/mcp`) prepared as homes for the AI
  and MCP modules.
- Draft design documents in `docs/` describing the architecture, agent, catalog, MCP,
  and security plans (`docs/ai.md`, `docs/agent.md`, `docs/mcp.md` are currently empty).

**What is not yet implemented (planned):** package-manager resolution (turning catalog
metadata into an actual install plan), terminal command generation, system detection beyond
"does the browser look like Linux", application details pages, application icons, AI
features, the MCP server, the local Linux agent, database storage, and authentication.

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

Each layer is intentionally decoupled:

- **UI** — discovery, browsing, selection, and review experiences. No system access.
- **Catalog data** — a curated, structured repository of Linux applications, kept separate
  from the interface that renders it.
- **System detection** — reads the local environment (never blind to it).
- **AI planning** — reasons about recommendations and generates plans; it plans rather than
  executes.
- **MCP** — exposes controlled, explicitly authorized capabilities to AI systems.
- **Local system execution** — confined to the local agent, which validates every operation
  and requires user confirmation.

Because these layers are separated, security boundaries can be enforced at each hop:
nothing downstream runs arbitrary input, and nothing upstream can touch the operating
system directly.

---

## Current V1 scope

V1 is a **Ninite-style installer-command generator**, not an installer: it stops at
generating a terminal command the user copies and runs themselves. The full V1 flow is:

```
Website → Linux detection state → Distribution selection → Application catalog
→ Application selection → Installer resolution → Terminal command generation
→ Copy to terminal → user runs it themselves
```

Status of each piece:

- Linux application discovery — **implemented** (UI + verified catalog)
- Manual distribution selection (Ubuntu / Debian / Fedora / Arch Linux) — **implemented**
- Browser-only "looks like Linux" detection — **implemented** (exact distro is never
  inferred; see [Important distro detection rule](#important-distro-detection-rule))
- Search — **implemented**
- Category filtering — **implemented**
- Application selection + selection summary — **implemented**
- Responsive interface — **implemented**
- Dark/light theme toggle — **implemented** (dark by default)
- Real, verified application catalog — **implemented** (31 applications in
  `packages/catalog`; metadata only, no installation logic)
- Application details — **not started**
- Installer resolution (APT/DNF/Pacman/Flatpak/Snap) — **not started**
- Terminal command generation / copy-to-clipboard — **not started**

V1 does **not** include real package installation, arbitrary shell execution, MCP, AI, or
a local agent — those are out of scope for V1 entirely (see
[Important distro detection rule](#important-distro-detection-rule) and
[Roadmap](#roadmap)).

### Important distro detection rule

Normal browser APIs cannot reliably identify which Linux distribution a visitor is
running. `apps/web/src/hooks/useLinuxDetection.ts` only ever reports whether the browser
*looks like* Linux (and explicitly excludes Android, which also reports "Linux" in its
user agent) — never a specific distribution. Exact distribution is always a manual,
explicit choice via the distribution selector. True system-level distro detection is a
future local-agent capability, not a browser one.

### Application catalog categories

The catalog (`packages/catalog/src/applications.ts`) is organized into the following
categories:

- Browsers
- Code Editors
- CLI Tools
- Development
- Utilities
- Media
- Communication

---

## Design

The product direction is:

- Linux-native
- Minimal
- Technical
- Editorial
- High-contrast
- Open-source oriented
- Modern, but not a generic SaaS look

The visual direction is a monochrome interface with a single restrained green accent (used
for selection state, the primary action, and the logo mark) — no gradients, glassmorphism,
or decorative color. Light mode uses a warm off-white background with white card surfaces;
dark mode uses a deep neutral charcoal (not pure black) with slightly lighter card surfaces.
The layout itself is intentionally utility-first and Ninite-inspired: a compact header, no
marketing hero section, and the application list — not a landing page — as the homepage.
Full design guidance lives with the platform documentation rather than this README.

---

## AI

AI is planned as a **planning layer**, not an execution layer. It should help with:

- Software discovery
- Application recommendations
- Compatibility analysis
- Installation planning
- Natural-language software requests
- Structured workflows

AI plans and reasons about actions; it does not execute arbitrary commands. Every planned
operation flows through the same validation path as a manual one. No AI model is ever given
direct, unrestricted control of the operating system.

**Current status:** the AI architecture is documented in theory (see
[`docs/ai.md`](docs/ai.md)) and a placeholder package exists at `packages/ai`. No AI
functionality is implemented yet.

---

## MCP

MCP (Model Context Protocol) is planned as the **controlled interface** between AI systems
and Linux App Platform.

Potential future capabilities:

| Tool                     | Purpose                                   |
| ------------------------ | ----------------------------------------- |
| `get_system_info`        | Describe the user's Linux system          |
| `search_apps`            | Search the application catalog            |
| `get_app_details`        | Fetch details for one application         |
| `check_compatibility`    | Assess compatibility with the system      |
| `create_install_plan`    | Draft an installation plan                |
| `validate_install_plan`  | Validate a plan against the catalog       |
| `execute_install_plan`   | Request execution of an approved plan     |

These tools are **planned**, implement what is useful, and all would be subject to
authorization. **Current status:** the MCP architecture is documented in
[`docs/mcp.md`](docs/mcp.md), and `packages/mcp` exists as a placeholder. No MCP server
is implemented.

---

## Local agent

The local Linux agent is planned as the **security boundary for operating-system changes**.
It would run on the user's machine and handle:

- Detecting the Linux distribution
- Detecting the CPU architecture
- Detecting the desktop environment
- Detecting package managers
- Detecting installed applications
- Checking package availability
- Validating installation plans
- Executing explicitly approved operations

Every operation the agent performs is validated against the trusted catalog and requires
explicit user confirmation. **Current status:** the agent is documented in
[`docs/agent.md`](docs/agent.md). No agent exists yet.

---

## Security

Security is a primary design constraint, not an afterthought. The platform enforces the
following rules:

- **No arbitrary shell execution from the browser.** The web interface can never run
  shell commands.
- **No remote sudo.** Privileged operations are never exposed over a remote interface.
- **No unrestricted command execution.** All operations are scoped and validated.
- **AI cannot directly control the operating system.** AI plans and recommends; it never
  executes.
- **Installation requests must be validated.** Plans are checked before execution.
- **Applications must resolve against the trusted catalog.** Untrusted manifests are not
  installed.
- **System-changing operations require explicit user confirmation.** Nothing changes the
  system silently.
- **Privileged operations belong in the local agent.** The agent is the only component
  allowed to perform system changes.
- **Security-sensitive operations should be logged.** System changes are auditable.

The full security model is described in [`docs/security.md`](docs/security.md).

---

## Technology

### Frontend
- React
- Vite
- TypeScript
- Tailwind CSS
- shadcn/ui (Radix UI base) — installed and in use as of Phase 1
- Lucide React
- Zustand *(intended — not yet installed)*

### Backend
- Node.js
- Express

### Monorepo
- pnpm *(package manager)*
- Turborepo *(intended — workspace config not fully set up yet)*

### Planned / future
- AI/LLM providers
- MCP
- Linux local agent
- PostgreSQL
- Zod
- Vitest
- Playwright

---

## Development

### Prerequisites

- Node.js
- [pnpm](https://pnpm.io)

### Install dependencies

```sh
pnpm install
```

### Run the applications

The repository is a pnpm workspace. Until the root-level workspace scripts are wired up,
run individual packages directly. Note: `apps/web/package.json` names the package
`react-example` (a scaffold leftover), so pnpm's name-based `--filter web` does **not**
resolve — use the path-based filter instead:

```sh
# Web app (Vite dev server, port 3000)
pnpm --filter ./apps/web dev

# API server (Express + nodemon) — currently fails to start; see "What exists today"
pnpm --filter ./apps/server dev
```

### Build and check

```sh
# Build the web app
pnpm --filter ./apps/web build

# Type-check the web app
pnpm --filter ./apps/web lint

# Catalog: type-check and run the validation tests
pnpm --filter ./packages/catalog lint
pnpm --filter ./packages/catalog test

# Server checks (lint + tests) — lint currently fails: no ESLint config exists
pnpm --filter ./apps/server check
```

> **Note on root workspace commands.** The monorepo scaffold (`pnpm-workspace.yaml` and
> `turbo.json`) is in place but its root scripts and Turborepo pipeline have not been
> configured yet. Once the root workspace is wired up, the standard workflow will be:

```sh
pnpm dev
pnpm build
pnpm lint
pnpm test
```

```sh
pnpm turbo build
pnpm turbo lint
pnpm turbo test
```

---

## Contributing

- Read the architecture documentation in [`docs/`](docs/) first, especially
  [`docs/architecture.md`](docs/architecture.md).
- Keep features modular.
- Avoid unnecessary dependencies.
- Keep catalog data separate from the UI.
- Do not introduce unsafe command execution.
- Add tests for important functionality.
- Keep pull requests focused.
- Follow the existing monorepo structure.

---

## Documentation

- [`docs/architecture.md`](docs/architecture.md) — architecture and layer separation
- [`docs/ai.md`](docs/ai.md) — AI planning architecture
- [`docs/agent.md`](docs/agent.md) — local Linux agent
- [`docs/catalog.md`](docs/catalog.md) — application catalog design
- [`docs/mcp.md`](docs/mcp.md) — MCP interface design
- [`docs/security.md`](docs/security.md) — security model

---

## Roadmap

### V1 — Discovery
- Web foundation
- Application catalog
- Search / filtering
- Application details
- System detection UI
- Selection / review flow

### V2 — Intelligence
- AI recommendations
- Compatibility analysis
- Natural-language discovery
- Installation planning
- Structured AI outputs

### V3 — MCP
- MCP server
- MCP resources
- MCP tools
- Tool authorization

### V4 — Local Agent
- Linux system detection
- Package-manager detection
- Installation validation
- Explicit user-confirmed installation

### V5 — Production Platform
- Database
- Accounts / authentication
- Catalog management
- Community contributions
- Production infrastructure

---

## License

Distributed under the **Apache License 2.0**. The license is declared in the package
metadata and source headers (Apache-2.0). A standalone `LICENSE` file will accompany the
initial release.

---

## Author

Created and maintained by **AbhiDevepl && tejjasdev**.

GitHub: [https://github.com/AbhiDevepl](https://github.com/AbhiDevepl)
