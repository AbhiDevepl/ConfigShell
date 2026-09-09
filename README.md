# Linux App Platform

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
└── web/           React web app (scaffold)
    ├── src/
    ├── public/
    ├── index.html
    ├── package.json
    └── vite.config.ts

packages/
├── ai/            (placeholder)
├── catalog/       (placeholder)
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

- A Vite + React + TypeScript + Tailwind CSS web application. The current `apps/web`
  contains a placeholder landing page; the application-discovery UI has **not** been
  built yet.
- An Express API server scaffold (`apps/server`) with routing, controller, service, and
  validator directories. The server is not yet wired to serve the platform API.
- Empty workspace packages (`packages/ai`, `packages/catalog`, `packages/mcp`) prepared
  as homes for the AI, catalog, and MCP modules.
- Draft design documents in `docs/` describing the architecture, AI, agent, catalog, MCP,
  and security plans.

**What is not yet implemented (planned):** the application catalog and its data, search
and filtering, application details, system detection, application selection and
installation-planning flow, AI features, the MCP server, the local Linux agent, database
storage, and authentication.

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

V1 is focused on the **web experience and platform foundation**:

- Linux application discovery
- Application catalog
- Search
- Category filtering
- Application details
- System detection interface
- Application selection
- Installation-plan / review flow
- Responsive interface

Some of these are partially scaffolded today; others are not yet started. V1 does **not**
include real package installation, MCP, or AI-driven features — those are later milestones
(see [Roadmap](#roadmap)).

### Application catalog categories

The catalog is organized into the following categories:

- Browsers
- Code Editors
- Development
- Terminals & Shells
- Utilities
- Media
- Productivity

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

The visual direction is a monochrome light editorial interface with Linux green used as an
accent color. Full design guidance lives with the platform documentation rather than this
README.

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
- shadcn/ui *(intended — not yet installed)*
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
run individual packages directly:

```sh
# Web app (Vite dev server, port 3000)
pnpm --filter web dev

# API server (Express + nodemon)
pnpm --filter server dev
```

### Build and check

```sh
# Build the web app
pnpm --filter web build

# Type-check the web app
pnpm --filter web lint

# Server checks (lint + tests)
pnpm --filter server check
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

Created and maintained by **AbhiDevepl**.

GitHub: [https://github.com/AbhiDevepl](https://github.com/AbhiDevepl)