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

- **MCP resources and a prompt.** Two reference resources
  (`configshell://reference/environments`, `configshell://reference/safety`) give an AI host
  static context in one read instead of a tool call, and the `plan_a_setup` prompt hands over
  the intended workflow order. The catalog itself is deliberately not a resource —
  `search_application` exists so a host filters server-side.
- **`packages/mcp` — an MCP server over stdio.** Seven read-only, deterministic tools over
  the trusted catalog and the installer: `list_environments`, `search_application`,
  `get_application`, `list_roles`, `check_compatibility`, `generate_setup` and
  `validate_setup`. A thin adapter — every decision comes from `@configshell/installer`, so
  an MCP client cannot get a different answer from the web app or the API, and a test asserts
  the package-manager vocabulary never appears in the package.
  - **`detect_system`, `check_installed` and `execute_setup` are deliberately absent, not
    stubbed.** All three require the local agent. A tool that always fails is still a tool a
    caller must discover and handle; one returning a plausible guess would be a lie. Their
    reasons are recorded in `WITHHELD_CAPABILITIES` and asserted by test.
  - **No tool takes an argument for a package name, a command, a flag, a URL or a
    repository** — a caller supplies catalog ids and a distribution name, and a test walks
    the registered schemas to keep it that way. `validate_setup` accepts command text only to
    *compare* it against catalog-derived output; it never executes or re-emits it.
  - Built on the official SDK (see "Changed"). `src/tools.ts` is transport-independent, which
    is what made that migration a replacement of the protocol layer alone.
  - 52 tests: the tool surface, the protocol, hostile arguments, and structural guarantees
    (no `child_process`, no `eval`, no filesystem, no sockets, read-only, deterministic).
- `pnpm mcp` starts the server.

- **The complete deterministic workflow in the web app**: environment selection (operating
  system, with macOS and Windows shown as not-yet-supported rather than hidden), optional
  role presets, application detail with every verified source and who packages it, and a
  **setup-plan view** showing the generated commands with privileged steps marked, manual
  steps explained, applications with no verified route stated plainly, and copy-to-clipboard
  per command or for the whole script. The page never executes anything.
- **Deterministic role/use-case presets** (`packages/catalog`): curated role →
  application-id bundles for General use, Student, Developer, Web developer and DevOps.
  Fixed, reviewable lists — no model, no scoring. Applying one *adds* to the selection rather
  than replacing it. Validated, and the health endpoint now fails if a preset names an
  application the catalog no longer has. PRD §15's AI/ML Developer, Designer and Video Editor
  are deliberately absent: the catalog has no applications that would honestly serve them.
- `GET /api/catalog/roles` and `GET /api/catalog/roles/:id`; `/health` is now also served at
  `/api/health` so one proxy rule covers the whole API.
- Loading, empty and error states throughout, including a distinct "the API is not reachable"
  state that names the command to start it.
- `apps/web` tests (8) covering the API client's contract, on the runner the other workspaces
  already use — no new test framework.

- **`packages/installer` — the deterministic core.** Resolution, setup-plan generation and
  command generation as three pure functions over `(catalog, environment)`, with no I/O and
  no execution. PRD §22's source-trust hierarchy is encoded explicitly and tested rule by
  rule; a resolution records which source won, why, and what was rejected. Sources needing a
  third-party repository are skipped in favour of the vendor's own instructions, so a
  generated command never fails on a clean system (provisional — see `docs/TechnicalAudit.md`
  §9). Manual steps and applications with no verified route are reported, never dropped.
- **`apps/server` — a read-only planning API.** `/health` (with catalog integrity),
  `/api/applications[/:id]`, `/api/catalog/{categories,environments,stats}`, `POST /api/plan`
  and `POST /api/plan/resolve`. Structured JSON logging, per-request correlation ids, a
  closed set of error codes, a 16 kB body cap and a 200-id selection cap. It plans and
  validates; **it never executes**, and a test asserts no module in the workspace imports
  `child_process`.
- **Environment model** in `packages/catalog`: `Environment`, `createEnvironment`,
  `parseEnvironment`, and an explicit `os` axis with `'linux'` as its only value so a second
  operating system is a data problem later rather than a refactor. The
  distribution↔ecosystem mapping now lives in exactly one place, which the validator reuses.
- **Verification metadata**: optional `verify: { binary }` per application, populated for 26
  of 31 entries. A closed shape with one field on purpose — a free-text check *command* is
  precisely the field through which arbitrary strings would reach a shell. Verification
  commands come from one fixed template, `command -v <binary>`.
- Read-only catalog queries (`findApplication`, `searchApplications`) shared by every
  consumer, so the API and the web app cannot answer the same question differently.
- **102 new tests** (20 → 122): the catalog suite grew to 37, `packages/installer` has 44,
  and `apps/server` has 41 API integration tests against the real application. Includes
  golden command output per package manager and an assertion that no generated command can
  contain a shell metacharacter on any supported distribution.

- `docs/ProductRequirements.md` — the product requirements document (vision, scope, MVP
  definition, long-term architecture).
- `docs/TechnicalAudit.md` — a full audit of the repository against the PRD and README:
  gap analysis, documentation audit, architectural risks, the AI-to-future-scope record,
  the prioritised P0/P1/P2/Future backlog, and the resolved product decisions.

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

- **MCP argument limits moved from hand-written checks into the Zod schemas** — the catalog-id
  pattern, the 100-character query cap, the 200-id selection cap and the 4096-character
  command cap. The SDK now enforces them before a handler runs *and* publishes them in the
  JSON Schema clients read, so a host can see the rules instead of discovering them from an
  error. `packages/mcp/src/validate.ts` keeps only what a schema cannot express: catalog
  existence, deduplication, and building a validated `Environment`.
- Three hand-rolled recursive directory walkers in tests replaced with
  `readdirSync(dir, { recursive: true })`, each now asserting it actually scanned something
  so the structural tests cannot pass vacuously.

- **The MCP layer now uses the official MCP TypeScript SDK** (`@modelcontextprotocol/server`
  v2, negotiating protocol revisions through `2025-11-25`), replacing the hand-written
  JSON-RPC and stdio
  implementation. Two things changed the calculus behind the original decision: v2 **split the
  monolithic `@modelcontextprotocol/sdk`** into scoped packages, so a server now needs three
  dependencies rather than seventeen and the OAuth/process-spawning code is in the *client*
  package; and the hand-written server negotiated protocol versions only up to `2025-06-18`,
  with no knowledge of the current spec. `src/protocol.ts` and the hand-rolled framing in
  `src/server.ts` are gone; the tools themselves were kept.
- Tool input schemas are now **Zod and strict**. The SDK derives the JSON Schema clients see
  and validates arguments before a handler runs, so unknown arguments are rejected rather than
  ignored — a host that invents a `command` field is told so.
- Every tool now carries **annotations** (`readOnlyHint`, `destructiveHint: false`,
  `idempotentHint`, `openWorldHint: false`) and a `title`, stating the security posture in the
  protocol's own vocabulary, and returns `structuredContent` alongside text.
- `createConfigShellServer()` binds **no transport**, so stdio today and Streamable HTTP later
  are the same tools with a different binding.
- MCP tests are now interoperability tests: the **official MCP client** connects to the server
  over the real protocol, and a second test spawns the binary over stdio exactly as a host
  does. The hand-written protocol unit tests were deleted with the code they covered.
- The application-id pattern now lives in `@configshell/catalog` (`APPLICATION_ID_PATTERN`,
  `isApplicationIdShape`) instead of being written out separately in the API server — three
  consumers, one rule.
- `eslint.config.js` allows `any` in test files only. Tests assert on deliberately untyped
  payloads, where the assertion *is* the type check; source keeps the stricter rule.

- **The web app now calls the API** to generate setup plans. The catalog stays compiled into
  the bundle, so browsing, search and presets work with no server; plan generation goes to
  the one implementation of command generation rather than shipping a second copy of that
  security-critical code to the browser.
- **The web dev server moved to port 5173**, so it no longer collides with the API on 3000.
  `pnpm dev` starts both; `pnpm dev:web` starts the web app alone. Vite proxies `/api`.
- The "Continue" button is real: it builds the setup plan, and when it cannot, the tooltip
  says which of the two preconditions is missing.
- Catalog search in the web app now uses the shared `searchApplications` from
  `packages/catalog`, so it matches on `id` too — "vscode" finds Visual Studio Code.
- Each verification command now names the application it checks, instead of four consecutive
  lines all reading "Verify 4 installations".
- A step's precondition note (the Flathub remote) now travels on its own rendered command
  rather than being matched up by the consumer, which had attached it to the APT command too.
- **Accessibility fixes:** the distribution radios had no accessible name at all — a
  `<label for>` does not name a `<button role="radio">`, so screen readers announced four
  unnamed radios. Preset buttons now name their role rather than five buttons all reading
  "Add 5 apps".

- `apps/server` runs under `tsx` so it can import the workspace's TypeScript packages
  directly; the monorepo still has no build step. Its `tsconfig.json` runs `checkJs` over
  the JavaScript source, so misuse of the catalog or installer APIs is caught by
  `pnpm typecheck`.
- `origin` is now load-bearing rather than descriptive: it drives source preference and, for
  `apt`/`dnf`/`pacman`, whether a source is usable at all.
- Root `typecheck` and `test` scripts cover the two new workspaces; CI runs them unchanged.

- **Renamed the project to ConfigShell** throughout: workspace package names, the npm scope
  (`@linux-app-platform/*` → `@configshell/*`), the page title, UI copy, and every
  repository URL.
- **Product direction: the core release is built without external AI model integration.**
  AI recommendations and explainability move to Future; role/use-case selection is
  retained but will be satisfied deterministically with curated catalog bundles. MCP is
  *not* removed — it is retained as a separate future integration layer and `docs/mcp.md`
  is reframed so it no longer depends on AI existing. The PRD was amended accordingly
  (MVP list, version ladder, success criteria).
- Community-health documents are now consistently referenced at their real location under
  `docs/`; all 50 broken relative links left by the earlier move have been repaired.
- `docs/security.md` renamed to `docs/security-model.md`. It previously collided with
  `docs/SECURITY.md` on case-insensitive filesystems, which breaks clones on macOS and
  Windows.
- Corrected stale PRD claims: Turborepo was never installed, and the AI backend "structure"
  is a set of 0-byte placeholder files.

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

- **Dead AI Studio scaffolding**: `aistudioMediaPlugin` from `apps/web/vite.config.ts` (60
  lines of dev-server middleware serving `public/assets/aistudio/`, a directory whose only
  content was a `.gitignore` containing `*`), the directory itself, and
  `apps/web/metadata.json` — an AI Studio manifest with no readers anywhere in the repo.
- `apps/server/services/app.service.js` (one function, one caller — inlined into its
  controller), `apps/server/config/index.js` (a re-export barrel with one importer),
  `logger.debug` (no callers), the `REQUIRES_LOCAL_AGENT` error code (declared, never thrown
  — by design it cannot be), and speculative injectable-collection parameters on
  `findApplication`, `findRole`, `applicationsForRole` and `searchApplications` that no
  caller ever passed.

- `nodemon` from `apps/server` — `tsx watch` covers it.

- `MAJOR_CAPABILITY_SERVER_SIDE_GEMINI_API` from `apps/web/metadata.json` — the only place
  in the repository that asserted a live model dependency, for a feature that does not
  exist.
- The "AI-native" tagline from `README.md` and the root `package.json` description.

- Unused dependencies from `apps/web`: `@google/genai`, `motion`, `dotenv`, `autoprefixer`,
  `esbuild`, `tsx`, and a duplicate `vite` entry.
- Unused, unreferenced images from `apps/web/public/` (`BG.png` and a grid-texture JPEG) —
  scaffold leftovers of unclear provenance.
- The empty `turbo.json`. Turborepo was never installed and root pnpm scripts orchestrate
  the workspaces; the file only implied a pipeline that did not exist.
- `apps/server`'s `lint` and `check` scripts, which invoked an ESLint that was not
  installed and always failed. Linting now runs from the repository root.

### Fixed

- **The application detail view disagreed with the setup plan.** It computed which
  installation sources applied to a distribution itself, and that local copy did not know
  that a vendor package-manager source needs a third-party repository added first. On Ubuntu
  it highlighted VS Code's `apt` source as applicable while the plan installed the Snap. The
  duplicated logic is gone; the view now asks the resolver through the API and shows its
  reason per source, plus which one would actually be used.
- **`GET /api/applications/:id` and `POST /api/plan` returned different shapes for the same
  resolution** — the former leaked the raw installer type (nested sources, the policy's
  internal rank integer, and the application repeated inside its own resolution). Both now
  use one shared presenter, and a test asserts the two shapes are identical.
- A resolution's `considered` entries now report `eligible: boolean` rather than the policy's
  internal `rank`, matching what the MCP adapter already emitted. A resolution reads the same
  however it was requested.
- **Added an error boundary**, so a render error degrades to a message rather than a blank
  page. The fallback deliberately uses no design-system components, since the thing that
  broke may be the design system.

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
