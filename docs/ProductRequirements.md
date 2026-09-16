# ConfigShell — Product Requirements Document (PRD)

**Product:** ConfigShell
**Type:** Open-source system setup & configuration platform
**Initial Platform:** Linux
**Future Platforms:** macOS, Windows
**Primary Users:** Developers, students, new Linux users
**Status:** Planning / MVP definition
**Repository:** Existing pnpm-workspace monorepo (no Turborepo — see §29)
**Amended:** 2026-09-16, per `docs/TechnicalAudit.md` §9

---

# 1. Product Overview

**ConfigShell** is an open-source platform designed to make setting up a new computer significantly easier.

Instead of manually searching for applications, determining the correct package manager, finding installation instructions, and configuring a development environment, users interact with ConfigShell through a simple interface.

The platform detects the user's environment, understands what the user wants to do, recommends relevant applications, and generates a validated system setup plan.

The long-term vision is to evolve ConfigShell from a **visual setup generator** into an **AI-assisted system configuration agent** capable of configuring an entire workstation.

---

# 2. Problem Statement

Setting up a fresh Linux system can require users to:

1. Identify their Linux distribution.
2. Understand its package ecosystem.
3. Search for applications.
4. Determine whether an application exists in the default repositories.
5. Find the correct installation method.
6. Copy commands from multiple websites.
7. Install applications individually.
8. Configure development tools manually.
9. Troubleshoot installation failures.
10. Repeat the process whenever they install a new system.

This is particularly inconvenient for:

* Developers
* Students
* New Linux users
* Users migrating from Windows/macOS
* Users setting up a development workstation

ConfigShell aims to provide a unified experience around this workflow.

---

# 3. Vision

### Short-term

> **Make Linux system setup simple enough that a new user can configure their machine without needing to understand package-management commands.**

### Long-term

> **Build an open-source, cross-platform AI system configuration agent that can understand a user's goals and safely configure their workstation.**

---

# 4. Product Philosophy

ConfigShell should follow five principles.

### 4.1 User control

The user should understand and approve important system changes.

### 4.2 Security first

AI must not be allowed to blindly generate and execute arbitrary shell commands.

### 4.3 Open source

The application catalog, core logic, and contribution process should be transparent.

### 4.4 Data-driven architecture

Applications and installation methods should be represented as structured data rather than hard-coded UI logic.

### 4.5 Extensibility

Linux should be the first platform, not an architectural limitation.

---

# 5. Target Users

## 5.1 Developers

Examples:

* Web developers
* Full-stack developers
* Python developers
* AI/ML developers
* DevOps engineers
* Students learning programming

Typical requirements:

```text
Git
VS Code
Node.js
Python
Docker
Database tools
Browsers
API tools
CLI utilities
```

---

## 5.2 Students

Students may be installing Linux for the first time and may not know:

* APT
* DNF
* Pacman
* Zypper
* repositories
* package names
* shell commands

ConfigShell should reduce this complexity.

---

## 5.3 New Linux users

A user migrating from another operating system should be able to answer:

> "What do you want to use this computer for?"

rather than:

> "Which package should I install?"

---

## 5.4 Future users

The architecture should eventually support:

* Video editors
* Designers
* Content creators
* Researchers
* System administrators
* General computer users
* AI developers

---

# 6. Platform Roadmap

## Phase 1 — Linux

Fully functional.

Initial package ecosystems:

| Ecosystem       | Package Manager | Status |
| --------------- | --------------- | ------ |
| Debian family   | APT             | in scope — verified (Ubuntu, Debian) |
| Fedora family   | DNF             | in scope — verified (Fedora) |
| Arch family     | Pacman          | in scope — verified (Arch Linux) |
| openSUSE family | Zypper          | **deferred** — see below |

> **Amended (Q4).** Active scope is the repository's actual verified coverage: apt / dnf /
> pacman across Ubuntu, Debian, Fedora and Arch Linux, plus the distribution-agnostic
> `flatpak` and `snap` methods. **openSUSE / Zypper is a later ecosystem**, not a Phase 1
> one — adding it makes every existing catalog entry's coverage a fresh research question,
> and nothing in the core release depends on it. A scope decision, not a rejection.

ConfigShell should reason primarily around the **package ecosystem**, rather than creating completely separate logic for every distribution.

---

## Phase 2 — macOS

Potential installation ecosystem:

```text
Homebrew
```

---

## Phase 3 — Windows

Potential ecosystems:

```text
WinGet
Scoop
Chocolatey
```

The exact Windows implementation can be finalized during the Windows planning phase.

---

# 7. MVP Definition

The MVP should focus on the Linux experience.

## MVP capabilities

### Required

1. System/platform detection
2. Linux distribution/package ecosystem detection
3. Manual environment selection
4. Application catalog
5. Application search
6. Application selection
7. Installation-plan generation
8. User review before execution/instructions
9. Secure command generation
10. Basic installation verification

> **Amended.** The core release is built **without external AI model integration.** Two
> items were moved off this list:
>
> - *AI-assisted recommendations* → **Future** (§16, §18). No model, no provider, no key.
> - *User role/use-case selection* → **P1**, immediately after the deterministic core, and
>   satisfied **deterministically** by curated role → application-id bundles in the catalog
>   (§15). It needs no model and must not wait for one.
>
> The deterministic chain — catalog → environment → selection → resolution → setup plan →
> command generation → verification — is the whole of the core release.

### Not required for initial MVP

* macOS implementation
* Windows implementation
* **AI-assisted recommendations of any kind** (§16, §18)
* Fully autonomous AI agent
* Complex system modification
* Complete workstation provisioning
* Advanced rollback
* Enterprise device management
* Large-scale telemetry infrastructure

---

# 8. Core User Journey

```text
                  ConfigShell
                       │
                       ▼
               Open ConfigShell
                       │
                       ▼
                Detect system
                       │
             ┌─────────┴─────────┐
             │                   │
          Detected            Manual
             │                   │
             └─────────┬─────────┘
                       ▼
              Identify environment
                       │
                       ▼
             Understand user intent
                       │
                       ▼
              AI recommendations
                       │
                       ▼
             Application selection
                       │
                       ▼
               Review setup plan
                       │
                       ▼
             Generate installation
                       │
                       ▼
                  User approval
                       │
                       ▼
               Execute / install
                       │
                       ▼
                 Verify results
```

---

# 9. Functional Requirements

## FR-001 — System Detection

ConfigShell should attempt to identify:

* Operating system
* Linux distribution
* Package ecosystem
* CPU architecture

Example:

```text
Operating System: Linux
Distribution: Ubuntu
Package Manager: APT
Architecture: x86_64
```

---

# 10. Manual Environment Selection

Automatic detection should never be the only option.

Users should be able to select their environment manually.

Example:

```text
Operating System
○ Linux
○ macOS
○ Windows

Linux ecosystem
○ APT
○ DNF
○ Pacman
○ Zypper
```

For unsupported environments:

```text
Environment not currently supported.
```

---

# 11. Application Catalog

The catalog is one of the most important components of ConfigShell.

It should contain structured metadata for applications.

Example conceptual structure:

```json
{
  "id": "git",
  "name": "Git",
  "description": "Distributed version control system",
  "category": "development",
  "platforms": {
    "linux": {
      "apt": {},
      "dnf": {},
      "pacman": {},
      "zypper": {}
    }
  }
}
```

The exact schema will be finalized during architecture design.

---

# 12. Application Metadata

An application entry may eventually contain:

```text
ID
Name
Slug
Description
Category
Icon
Homepage
Documentation URL
Source repository
License
Supported platforms
Package names
Installation methods
Dependencies
Verification method
Configuration options
Tags
Supported architectures
```

Not every field needs to be populated for every application.

---

# 13. Application Categories

Initial categories can include:

```text
Development
Browsers
Communication
Media
Design
Productivity
Utilities
Databases
DevOps
AI / ML
Security
Education
```

The catalog should remain extensible.

---

# 14. Application Search

Users should be able to search:

```text
VS Code
Git
Docker
Node
Python
Firefox
```

Search should support:

* Name
* Description
* Category
* Tags
* Aliases

For example:

```text
"vscode"
"code editor"
"editor"
```

could resolve to the same application.

---

# 15. User Intent

> **P1, deterministic, no model.** Role selection is *not* an AI feature. It is implemented
> as curated, reviewable **role → application-id bundles** stored in the catalog, shipped
> immediately after the deterministic core chain is stable. Keeping it catalog-driven means
> it is auditable, contributable, and testable — and it satisfies §42's "receive relevant
> recommendations" criterion without a provider.

Instead of forcing users to manually select every application, ConfigShell should understand their objective.

Example roles:

```text
Developer
Student
Web Developer
AI/ML Developer
Video Editor
Designer
General User
```

This list should remain configurable.

---

# 16. AI Recommendation Engine

> **Future scope — not in the core release.** The core product is built without external AI
> model integration. Nothing in this section is implemented, scheduled, or a dependency of
> anything that is. The constraints any future implementation must satisfy live in
> [`ai.md`](ai.md); the architectural seam is preserved (see §17) so this can be added later
> without restructuring. Deterministic recommendations are covered by §15's role presets.

The AI receives structured context.

Example:

```json
{
  "platform": "linux",
  "packageManager": "apt",
  "architecture": "x86_64",
  "role": "web-developer",
  "preferences": [
    "React",
    "Node.js"
  ]
}
```

The AI produces recommendations.

Example:

```text
Recommended

Git
VS Code
Node.js
Docker

Optional

Postman
GitHub CLI
DBeaver
```

---

# 17. Critical AI Architecture Rule

The AI should **not** directly control the shell in the MVP.

Avoid:

```text
AI
 ↓
arbitrary shell command
 ↓
system
```

Instead:

```text
User
 ↓
AI
 ↓
Application IDs
 ↓
Trusted Catalog
 ↓
Installer Engine
 ↓
Validation
 ↓
User Approval
 ↓
Execution
```

This makes the system significantly safer and more deterministic.

---

# 18. Recommendation Explainability

> **Future scope**, with one part brought forward: the *deterministic* core must already
> explain **which installation source it chose and why** (distro vs. vendor vs. community),
> because that is a user-trust question independent of AI. Explaining a *recommendation*
> waits on §16.

ConfigShell should ideally explain recommendations.

Example:

> **Git**
> Recommended because it is commonly required for software development and version control.

Or:

> **Docker**
> Optional — useful for containerized development environments.

This prevents the AI from appearing as a black box.

---

# 19. Application Selection

Users must be able to override AI recommendations.

Actions:

```text
Add
Remove
Search
Select
Deselect
```

Example:

```text
Your setup

✓ Git
✓ VS Code
✓ Node.js

Optional

□ Docker
□ Postman
□ DBeaver
```

---

# 20. Setup Plan

ConfigShell converts selected applications into an ordered plan.

Example:

```text
Setup Plan

01  Update package metadata
02  Install Git
03  Install Node.js
04  Install VS Code
05  Install Docker
06  Verify installations
```

The plan should be deterministic once generated.

---

# 21. Installation Engine

The installation engine translates catalog metadata into platform-specific actions.

Conceptually:

```text
Application
     +
Environment
     ↓
Installer Resolver
     ↓
Installation Strategy
     ↓
Validated Commands
```

Example:

```text
Git + APT
      ↓
APT installation strategy
```

---

# 22. Installation Sources

ConfigShell should prioritize trusted sources.

Potential hierarchy:

```text
Official distribution repository
        ↓
Official package repository
        ↓
Official application source
        ↓
Other explicitly trusted source
```

Arbitrary Internet downloads should not automatically become installation sources.

---

# 23. Installation Verification

After installation, ConfigShell should eventually verify that the requested application exists.

Conceptually:

```text
Install Git
    ↓
Check git availability
    ↓
Read version
    ↓
Installation successful
```

Example:

```text
✓ Git installed
✓ VS Code installed
✓ Node.js installed
```

---

# 24. Failure Handling

The system should handle:

* Package unavailable
* Network failure
* Permission denied
* Unsupported distribution
* Dependency failure
* Existing installation
* Repository unavailable
* Invalid catalog entry

Example:

```text
Docker installation failed.

Reason:
Required repository is unavailable.

Suggested action:
Review installation source.
```

---

# 25. Security Requirements

Security is a first-class requirement.

### ConfigShell must:

* Avoid arbitrary AI-generated shell execution
* Validate application IDs
* Validate installation methods
* Display privileged operations
* Request explicit approval where required
* Avoid hidden commands
* Avoid unnecessary privileges
* Validate package sources
* Handle secrets carefully
* Keep AI API credentials server-side where applicable

---

# 26. Privacy

ConfigShell should minimize personal information collection.

AI requests should contain only the context necessary for recommendations.

For example:

```text
OS
Distribution
Architecture
User-selected role
Selected preferences
Catalog information
```

Avoid sending unnecessary system information to third-party AI providers.

---

# 27. Open-Source Model

ConfigShell should be designed as a community-driven project.

Potential contribution areas:

```text
Application catalog
Linux support
Package mappings
Detection
Installer strategies
AI recommendations
UI
Documentation
Testing
Security
CLI
```

---

# 28. Catalog Contribution Workflow

A contributor should be able to add an application without understanding the entire codebase.

Example:

```text
Contributor
    ↓
Add application metadata
    ↓
Add package mappings
    ↓
Add verification
    ↓
Run validation
    ↓
Submit Pull Request
    ↓
Automated tests
    ↓
Maintainer review
    ↓
Merge
```

This can become one of ConfigShell's strongest open-source contribution mechanisms.

---

# 29. Repository Architecture

> **Corrected.** Turborepo was never actually installed — `turbo.json` was empty and has
> been deleted. The monorepo is **pnpm workspaces**, orchestrated by root `package.json`
> scripts with pnpm filters. Do not add a Turbo pipeline unless the dependency graph
> genuinely needs one.

The existing repository uses a pnpm-workspace monorepo with:

```text
apps/
├── server
└── web

packages/
├── ai
├── catalog
└── mcp
```

It also already contains dedicated documentation for architecture, AI, catalog, MCP, agent behavior, and security. 

Therefore, **the PRD does not require rebuilding the project from scratch**.

The architecture should evolve from the existing repository.

---

# 30. Proposed Architecture

```text
ConfigShell Monorepo
│
├── apps
│   ├── web
│   │   └── React + Vite + TypeScript
│   │
│   ├── server
│   │   └── Express
│   │
│   └── cli                 # Future
│
├── packages
│   ├── catalog
│   ├── ai
│   ├── mcp
│   ├── core                # Future/refinement
│   ├── detection           # Future/refinement
│   └── installer           # Future/refinement
│
└── docs
```

---

# 31. Frontend Requirements

The web application should contain the major flows:

```text
Landing
   ↓
System Detection
   ↓
Environment
   ↓
User Intent
   ↓
AI Recommendations
   ↓
Application Catalog
   ↓
Selection
   ↓
Setup Plan
   ↓
Execution / Instructions
```

Your current repository already contains UI components for application catalog, application cards, Linux detection, distro selection, and selection management. 

---

# 32. Backend Requirements

The backend should handle:

```text
AI requests
Catalog APIs
Application metadata
Recommendation orchestration
Validation
Configuration
Future authentication
Future analytics
```

Your current server already has separate controllers/services/routes for AI, applications, and catalog functionality, which aligns with this separation. 

---

# 33. Database Strategy

### MVP

Prefer **Git-managed structured catalog data** rather than introducing a database solely for application definitions.

Benefits:

* Version control
* Pull requests
* Transparency
* Easy community contributions
* Simple CLI consumption

### Future

A database can be introduced if required for:

* User accounts
* Preferences
* Analytics
* Community data
* Dynamic catalog indexing
* Usage statistics
* Remote configuration

---

# 34. MCP

Your repository already contains an MCP package.

MCP can eventually provide a standardized interface between AI agents and ConfigShell capabilities.

Potential future tools:

```text
detect_system
search_application
get_application
generate_setup
validate_setup
check_installed
```

However, MCP should not bypass ConfigShell's security boundaries.

---

# 35. CLI Roadmap

The CLI is a major future component.

Potential commands:

```bash
configshell detect
```

```bash
configshell search vscode
```

```bash
configshell install git
```

```bash
configshell install developer
```

```bash
configshell list
```

```bash
configshell doctor
```

Eventually:

```bash
configshell setup
```

---

# 36. Agentic Future

Long-term ConfigShell can become an agent rather than just a command generator.

Example:

```text
User:
"Set up my machine for full-stack development."
```

Agent:

```text
Detect environment
        ↓
Understand requirements
        ↓
Build configuration plan
        ↓
Identify required software
        ↓
Check installed software
        ↓
Ask permission
        ↓
Install
        ↓
Configure
        ↓
Verify
        ↓
Report
```

The agent should operate through controlled tools rather than unrestricted shell access.

---

# 37. Configuration Beyond Applications

Future versions can handle:

```text
Git configuration
SSH
Shell configuration
Environment variables
Node versions
Python environments
Docker
Databases
Editors
Terminal configuration
Dotfiles
Developer tooling
```

This is outside the initial MVP.

---

# 38. Non-Functional Requirements

## Performance

The web interface should feel responsive even while catalog and AI operations occur.

## Reliability

A failed application should not unnecessarily break unrelated installations.

## Maintainability

Core logic should be separated into reusable packages.

## Extensibility

New package ecosystems should be addable without rewriting the application layer.

## Accessibility

The UI should be usable with:

* Keyboard navigation
* Screen readers where practical
* Clear status indicators
* Appropriate contrast

---

# 39. Testing Strategy

### Unit tests

Test:

* Catalog validation
* Package resolution
* Environment detection
* Recommendation processing
* Command generation

### Integration tests

Test:

```text
Environment
 ↓
Catalog
 ↓
Installer
```

### End-to-end tests

Test the complete user journey:

```text
Open
 ↓
Detect
 ↓
Select role
 ↓
Recommend
 ↓
Select apps
 ↓
Generate plan
```

---

# 40. Observability

For the backend:

* Structured logging
* Error handling
* Request tracing where appropriate
* Health endpoint
* AI request/error monitoring

Do not log:

* API keys
* passwords
* secrets
* unnecessary personal information
* raw sensitive system information

---

# 41. Version Strategy

### v0.x

Experimental/open development.

### v0.1

Linux environment detection + catalog.

### v0.2

Application selection + installer resolution + setup-plan generation.

### v0.3

Safe command generation + installation verification.

### v0.4

Reliability, failure handling, and deterministic role/use-case presets (no model).

### v1.0

Stable Linux release.

After v1.0:

```text
v1.x → Linux improvements
v2.x → macOS
v3.x → Windows
```

These numbers are provisional; release milestones should ultimately be based on implementation readiness.

---

# 42. MVP Success Criteria

ConfigShell MVP should be considered successful when a new Linux user can:

```text
Open ConfigShell
       ↓
Detect their environment
       ↓
Choose what they're using the computer for      (P1 — deterministic role presets)
       ↓
Receive relevant recommendations                (P1 — from curated bundles, not a model)
       ↓
Review applications
       ↓
Generate a setup plan
       ↓
Safely install/configure the selected software
       ↓
Verify the result
```

without needing to manually research every application.

> **Amended.** The two marked steps are satisfied **deterministically** by §15's curated
> role → application-id bundles and land at **P1**, immediately after the core chain. The
> core release itself (browse → select → resolve → plan → commands → verify) does not
> depend on them, and neither depends on a model.

---

# 43. Out of Scope for MVP

Explicitly avoid turning v1 into an enormous system-management platform.

Not initially included:

* Full autonomous system administration
* Arbitrary shell execution by AI
* Enterprise device management
* Remote machine management
* Complete dotfile synchronization
* OS installation
* Disk partitioning
* BIOS configuration
* Kernel management
* Automatic driver replacement
* Full system backup/restore
* Multi-machine orchestration

These can be evaluated later.

---

# 44. Open-Source Growth Strategy

ConfigShell should optimize for **contribution velocity**.

Good first contributions:

```text
Add an application
Add package mapping
Add verification rule
Improve documentation
Add test
Fix UI
Add category
Improve distro detection
```

GitHub issue labels could include:

```text
good first issue
help wanted
catalog
linux
ai
security
cli
documentation
bug
enhancement
```

---

# 45. Long-Term Product Architecture

The eventual platform could look like:

```text
                         ConfigShell
                              │
             ┌────────────────┼────────────────┐
             │                │                │
            Web              CLI              MCP
             │                │                │
             └────────────────┼────────────────┘
                              │
                       ConfigShell Core
                              │
          ┌───────────────────┼───────────────────┐
          │                   │                   │
      Detection           AI Advisor         Catalog
          │                   │                   │
          └───────────────────┼───────────────────┘
                              │
                       Policy Engine
                              │
                       Installer Engine
                              │
             ┌────────────────┼────────────────┐
             │                │                │
           Linux            macOS           Windows
             │                │                │
           APT              Brew           WinGet
           DNF                              Scoop
         Pacman                           Chocolatey
         Zypper
```

---

# 46. Ultimate Vision

The final product should not simply be:

> **"A website that generates Linux commands."**

The larger vision is:

> **ConfigShell is an open-source, AI-assisted workstation configuration platform that understands what a user needs and safely transforms a fresh computer into a ready-to-use environment.**

The progression is:

```text
Command Generator
       ↓
Setup Builder
       ↓
AI Setup Advisor
       ↓
Configuration Engine
       ↓
CLI
       ↓
Local Agent
       ↓
Cross-platform Workstation Agent
```

---

# 47. Current Project Status

Based on the repository you shared, you're already beyond the pure idea stage.

You currently have the beginnings of:

> **Corrected 2026-09-16 against the actual repository.** The original table overstated
> two rows. Verified state:

```text
pnpm workspaces           ✓   (Turborepo ✗ — never installed, turbo.json deleted)
React + Vite + TS         ✓
Express backend           ~   scaffold only: starts, registers no routes;
                              18 files across controllers/services/routes/
                              middleware/validators/utils are 0 bytes
Catalog package           ✓   31 verified apps, 116 sources, validator, 20 tests
AI package                ~   package.json + README, no source (intentional placeholder)
MCP package               ~   package.json + README, no source (intentional placeholder)
Linux detection           ~   browser-only "looks like Linux"; never names a distribution
Distro selection          ~   selector works, but the result is currently unused downstream
Application catalog UI    ✓
Application selection     ✓
AI backend structure      ✗   ai.controller.js / ai.service.js / ai.routes.js are 0 bytes
Security documentation    ✓
Architecture docs         ✓
```

So the next step **after this PRD is not "start coding."**

It should be:

## **ConfigShell Technical Audit → Gap Analysis → Architecture v1**

> **Done.** See [`TechnicalAudit.md`](TechnicalAudit.md) — the full gap analysis,
> documentation audit, architectural risks, AI-to-future-scope record, phased backlog, and
> the resolved product decisions (§9) that amend this PRD.

We take your current repository and map:

```text
PRD requirement
      ↓
Current implementation
      ↓
Status
      ↓
Required change
      ↓
Priority
```

with:

**P0 = required for MVP**
**P1 = important**
**P2 = later**
**Future = CLI/agent/cross-platform**

That will give you a precise implementation backlog instead of rebuilding parts of ConfigShell that you've already created.

