# Roadmap

What is done, what is being worked on, and what is intended. This is a statement of
direction, **not a set of promises** — items move, change shape, or get dropped as the
project learns. Nothing listed under "Planned" or later exists today.

For what actually ships right now, see the README's
[current status](../README.md#what-exists-today); for why a given layer is designed the way it
is, see [`docs/architecture.md`](architecture.md).

The product requirements behind this roadmap are in
[`ProductRequirements.md`](ProductRequirements.md), and
[`TechnicalAudit.md`](TechnicalAudit.md) maps every requirement onto what actually exists,
with the prioritised backlog (P0/P1/P2/Future) and the resolved product decisions. **The
audit is the authority on sequencing**; this page is the readable summary.

**Direction:** the core release is deterministic and is built **without external AI model
integration**. AI stays in "Future / experimental" below. MCP is retained as a separate
future integration layer and is *not* blocked on AI — see [`mcp.md`](mcp.md).

## Completed

### Phase 1 — web foundation
- Vite + React 19 + TypeScript + Tailwind v4 + shadcn/ui (Radix base) application.
- Browser-only "does this look like Linux" indicator (never claims a distribution).
- Manual distribution selection: Ubuntu, Debian, Fedora, Arch Linux.
- Application browser with search and category filtering.
- Multi-select with a selection summary (desktop sidebar, mobile sheet + sticky bar).
- Dark/light theme, dark by default, persisted to `localStorage`.
- Responsive layout.

### Phase 2 — the catalog
- `packages/catalog`: 31 applications, 116 verified installation sources, consumed by the
  web app through `workspace:*`.
- Data model separating `method` / `identifier` / `origin` / `distros`, with no commands
  and no version numbers anywhere.
- Dependency-free `validateCatalog` plus the repository's first test suite (20 tests),
  which validates the real data, not only fixtures.
- The web app's local catalog fixture deleted — one source of truth.

### Phase 3 — open-source readiness
- Contribution, conduct, security, support, maintainer, roadmap and changelog documents.
- GitHub issue and pull request templates, CODEOWNERS, Dependabot.
- CI on pushes to `main` and pull requests: install, lint, typecheck, test, build, on
  Node 20 and 22.
- Repository-wide ESLint, validated server environment configuration, workspace READMEs,
  and a dependency clean-up.

### Phase 4 — the deterministic core and the planning API
- `packages/catalog` gains the **environment model** (`Environment`, `parseEnvironment`,
  the distro↔ecosystem mapping in one place), read-only **queries**, and optional
  **verification metadata** (`verify.binary`, 26 of 31 entries).
- `packages/installer`: **resolution → setup plan → command generation**, as three pure
  functions with no I/O and no execution. PRD §22's trust hierarchy encoded explicitly;
  sources needing a third-party repository skipped in favour of the vendor's instructions;
  manual steps and unavailable applications reported rather than dropped.
- `apps/server`: a **read-only planning API** — health with catalog integrity, catalog
  browse/search/lookup, supported-environment discovery, `POST /api/plan`. Structured
  logging, a closed set of error codes, and a bounded untrusted-input surface. It plans and
  validates; it never executes, and a test asserts the workspace cannot.
- Tests go from 20 to **122**, across three workspaces.

## Current — completing the V1 flow

V1 is a **command generator, not an installer**: it ends at a command the user copies into
their own terminal. The remaining pieces, in the order they make sense:

The deterministic core is built and tested. What remains is the part a user can see:

1. **Wire the environment through `apps/web`.** `App.tsx` still holds `distro` as
   write-only state that nothing downstream reads. Replace it with the catalog's
   `Environment` and pass it to the catalog view.
2. **Setup-plan review screen** — the ordered steps, privileged steps marked, manual steps
   explained, and per-application "no verified route here" stated plainly.
3. **Command display and copy-to-clipboard** — the full command visible before it can be
   copied. The browser never runs it.
4. **Application details** — a per-application view showing the verified sources, what
   `distro`/`vendor`/`community` mean, and which source would be used here and why.
5. **Failure and empty states** for every outcome the resolver can produce, plus an error
   boundary.
6. **Tests for `apps/web`** — a test runner and coverage of selection, filtering and the new
   plan rendering. `apps/web` is now the only workspace with no tests at all.

Then, immediately after: **deterministic role/use-case presets** (Web Developer, Student,
General User, …) as curated role → application-id bundles in the catalog. No model.

The V1 flow, end to end:

```
Website → Linux detection state → Distribution selection → Application catalog
→ Application selection → Installer resolution → Terminal command generation
→ Copy to terminal → user runs it themselves
```

## Planned

### Catalog and UI
- More verified applications and broader distribution coverage.
- Application icons, with the licensing and trademark questions settled first.
- Additional distributions (each one makes every existing entry's coverage a question —
  see [`docs/catalog.md`](catalog.md)).
- Accessibility and keyboard-navigation passes.

### Platform
- **Repository-setup steps.** Sources needing a third-party repository are skipped today and
  the user is sent to the vendor's instructions. Generating those steps — with signing keys
  and sources files — is a real feature and a real security question; the current behaviour
  is recorded as provisional in `docs/TechnicalAudit.md` §9 (Q1).
- Persisted selections (shareable lists) — requires deciding whether that needs a backend.
- Broader API surface, if a consumer needs one. The web app compiles the catalog in and does
  not call the API; the API exists for clients that cannot, such as a CLI or an MCP server.

## Future / experimental

Everything below is post-core, unstarted, and gated on design discussion. Each has a document
describing the constraints any implementation must satisfy. **None of it is a dependency of
the core release.**

- **AI planning layer** ([`docs/ai.md`](ai.md)) — recommendations, compatibility
  reasoning, natural-language discovery, plan drafting. AI plans; it never executes.
- **MCP interface** ([`docs/mcp.md`](mcp.md)) — a fixed, authorized set of tools for
  AI systems. No raw shell tool, ever.
- **Local Linux agent** ([`docs/agent.md`](agent.md)) — real system detection and the
  only component permitted to change a system, with validation and explicit confirmation.
- **Production platform** — database, accounts, catalog management, community-submitted
  entries, deployment infrastructure.

## Not on the roadmap

Some things are out of scope on purpose, and reopening them needs a strong argument:

- Executing shell commands from the browser.
- Remote or unattended installation on someone's machine.
- Distribution-guessing in the browser (it cannot be done honestly —
  [why](../README.md#important-distro-detection-rule)).
- Version numbers in the catalog.
- Shell-script installers (`curl … | sh`) as catalog sources.

## Want to help?

Pick something from [`.github/GOOD_FIRST_ISSUES.md`](../.github/GOOD_FIRST_ISSUES.md), or open
an issue describing what you would like to work on. Items in "Current" are the most useful
place to start; items in "Future / experimental" need a design conversation first.
