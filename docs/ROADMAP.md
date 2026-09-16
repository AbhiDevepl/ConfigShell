# Roadmap

What is done, what is being worked on, and what is intended. This is a statement of
direction, **not a set of promises** — items move, change shape, or get dropped as the
project learns. Nothing listed under "Planned" or later exists today.

For what actually ships right now, see the README's
[current status](README.md#what-exists-today); for why a given layer is designed the way it
is, see [`docs/architecture.md`](docs/architecture.md).

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

## Current — completing the V1 flow

V1 is a **command generator, not an installer**: it ends at a command the user copies into
their own terminal. The remaining pieces, in the order they make sense:

1. **Application details** — a per-application view showing the verified sources and what
   each one means (distro vs. vendor vs. community).
2. **Installer resolution** — choosing an appropriate `InstallationSource` for the selected
   distribution, honestly reporting when there is none. Belongs in a package, not in the
   UI.
3. **Terminal command generation** — turning a resolved plan into a command built *only*
   from trusted catalog data, shown in full before it is copied, with copy-to-clipboard.
   The browser never runs it.
4. **Tests for `apps/web`** — a test runner and coverage of the selection and filtering
   logic. Blocking-adjacent: the resolver deserves tests from its first commit.

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
  see [`docs/catalog.md`](docs/catalog.md)).
- Accessibility and keyboard-navigation passes.

### Platform
- A real API in `apps/server` — only once something genuinely needs a server. The catalog
  is compiled into the browser bundle today, which is simpler and safer.
- Persisted selections (shareable lists) — requires deciding whether that needs a backend.

## Future / experimental

Everything below is post-V1, unstarted, and gated on design discussion. Each has a document
describing the constraints any implementation must satisfy.

- **AI planning layer** ([`docs/ai.md`](docs/ai.md)) — recommendations, compatibility
  reasoning, natural-language discovery, plan drafting. AI plans; it never executes.
- **MCP interface** ([`docs/mcp.md`](docs/mcp.md)) — a fixed, authorized set of tools for
  AI systems. No raw shell tool, ever.
- **Local Linux agent** ([`docs/agent.md`](docs/agent.md)) — real system detection and the
  only component permitted to change a system, with validation and explicit confirmation.
- **Production platform** — database, accounts, catalog management, community-submitted
  entries, deployment infrastructure.

## Not on the roadmap

Some things are out of scope on purpose, and reopening them needs a strong argument:

- Executing shell commands from the browser.
- Remote or unattended installation on someone's machine.
- Distribution-guessing in the browser (it cannot be done honestly —
  [why](README.md#important-distro-detection-rule)).
- Version numbers in the catalog.
- Shell-script installers (`curl … | sh`) as catalog sources.

## Want to help?

Pick something from [`.github/GOOD_FIRST_ISSUES.md`](.github/GOOD_FIRST_ISSUES.md), or open
an issue describing what you would like to work on. Items in "Current" are the most useful
place to start; items in "Future / experimental" need a design conversation first.
