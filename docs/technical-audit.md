# ConfigShell — Technical Audit & Implementation Backlog

**Date:** 2026-09-16
**Audited commit:** `28aba68` (plus one uncommitted `README.md` edit — see D-03)
**Scope:** full repository audit against `docs/product-requirements.md` and `README.md`.
**Status of this document:** analysis and plan only. No source or documentation files were
changed to produce it.
**Re-verified:** every baseline command, every catalog count, the link scan, the naming
split, and the three truncated sentences were re-run independently against the working
tree. Two claims were corrected in that pass (the broken-link count is **50**, not 52; and
`cursor` is the only `official`-only application — see R-02), and two findings were added
(**D-17**, **D-18**). Everything else stood.

This is the document the PRD itself asks for in §47 ("ConfigShell Technical Audit → Gap
Analysis → Architecture v1"), using the PRD's own priority scale: **P0** required for the
core release, **P1** important after P0, **P2** later, **Future** AI/model integration,
MCP, local agent, CLI, cross-platform.

**Product direction applied throughout:** the core product is built **without external AI
model integration**. Every AI/model-dependent requirement found in the repository is
recorded in §6 and moved to Future. MCP is *not* removed — it remains a planned integration
layer, and §5 records what the core must do to keep it buildable later.

---

## 1. Verified baseline

Every check below was run against the repository as audited, on Node v22.22.1 / pnpm 9.15.5.

| Command | Result |
| ------- | ------ |
| `pnpm install --frozen-lockfile` | ✅ lockfile in sync, 6 workspace projects |
| `pnpm lint` | ✅ clean (ESLint flat config, whole repo) |
| `pnpm typecheck` | ✅ clean (`apps/web`, `packages/catalog`) |
| `pnpm test` | ✅ 20/20 catalog tests pass; `apps/server` reports **0 tests** (not a suite) |
| `pnpm build` | ✅ `apps/web` builds, 418 kB JS / 131 kB gzip |

**The repository is in a working, green state.** Nothing in this audit is a recovery
exercise; it is a gap analysis on a healthy base.

Catalog claims were recomputed from the data rather than trusted: **31 applications, 116
installation sources**, `apt` 28 / `dnf` 22 / `pacman` 23 / `flatpak` 21 / `snap` 20 /
`official` 2; `distro` 58 / `vendor` 36 / `community` 22; native coverage 25/25/22/23 for
Ubuntu/Debian/Fedora/Arch. **Every count in `docs/catalog.md` is exactly correct.**

---

## 2. Repository state

### 2.1 What is real

| Area | State | Notes |
| ---- | ----- | ----- |
| `packages/catalog` | **Implemented** | The strongest asset in the repo. 31 verified apps, a deliberate data model (`method`/`identifier`/`origin`/`distros`), a dependency-free `validateCatalog`, and 20 tests that validate the **real** data, not fixtures. No commands, no versions, no invented identifiers. |
| `apps/web` | **Implemented (discovery only)** | Vite + React 19 + TS + Tailwind v4 + shadcn/ui. Detection card, distro selector, search, category filter, selectable cards, selection summary (sidebar + mobile sheet + sticky bar), dark-first theme. Reads the catalog via `workspace:*`; owns no application data. |
| `apps/server` | **Scaffold** | `index.js` (bare `express()` + `listen`) and `config/env.js` + `config/index.js` (validated `PORT`/`NODE_ENV`) are the only files with content. **18 files across `controllers/`, `services/`, `routes/`, `middleware/`, `validators/`, `utils/` and `app.js` are 0 bytes.** No routes, no health endpoint, no logger. The web app never calls it. |
| `packages/ai`, `packages/mcp` | **Placeholders** | `package.json` + README each, no source. Real (empty) workspace members. |
| Tooling | **Implemented** | pnpm workspaces, root flat ESLint, per-workspace `tsc --noEmit`, CI on Node 20 + 22 (install → lint → typecheck → test → build), Dependabot, CODEOWNERS, issue/PR templates. |
| Documentation | **Extensive and unusually honest** | `architecture.md`, `catalog.md`, `security.md`, `development.md` are accurate about what does and does not exist. `ai.md`/`mcp.md`/`agent.md` are explicit "not started" status documents. This is a real strength; §4 lists where it has nonetheless drifted. |

### 2.2 The pipeline, honestly

```
Catalog  ──▶  Environment selection  ──✖  (nothing downstream exists)
  ✅              ⚠️ write-only
```

`apps/web/src/App.tsx` holds `const [distro, setDistro] = useState<Distro | null>(null)`.
`distro` is passed to `DistroSelector` and **read by nothing else** — not `AppCatalog`, not
`AppCard`, not `SelectionSummary`. Environment selection currently has **zero effect on the
product**. That single fact is the clearest statement of where the core stands: discovery
is done, and the deterministic chain the PRD describes (§20 setup plan, §21 installation
engine, §23 verification) has not been started.

---

## 3. PRD → implementation gap analysis

Status key: **Implemented** · **Partial** · **Missing** · **Future** (AI/model-dependent or
explicitly post-core) · **Obsolete** (documented but no longer true).

| PRD | Requirement | Current implementation | Status | Priority |
| --- | ----------- | ---------------------- | ------ | -------- |
| §9 FR-001 | System detection: OS, distro, ecosystem, arch | `useLinuxDetection` returns `linux`/`not-linux`/`unknown` only | **Partial** | P0 (model) / Future (real detection) |
| §10 | Manual environment selection | `DistroSelector`, 4 distros. No OS selector, no ecosystem selector, and the result is unused | **Partial** | **P0** |
| §11 | Application catalog | `packages/catalog`, verified, validated, tested | **Implemented** | — |
| §12 | Application metadata fields | `id`, `name`, `description`, `category`, `homepage`, `installation[]`. Absent: tags, aliases, icon, docs URL, source repo, license, dependencies, **verification**, config options, architectures, OS axis | **Partial** | P0 (verification) / P1 (search fields) / P2 (rest) |
| §13 | Categories | 7 of the 12 suggested (no Design, Productivity, Databases, DevOps, AI/ML, Security, Education) | **Partial** | P1 |
| §14 | Search: name, description, category, tags, aliases | Name, description, category only. `vscode` does not find Visual Studio Code | **Partial** | P1 |
| §15 | User intent / role selection | Nothing | **Missing** | **P1** (Q3 — deterministic presets, after the core chain) |
| §16 | AI recommendation engine | Nothing | **Future** | Future |
| §17 | AI must not control the shell | Holds by construction: no AI, no execution, no command strings anywhere | **Implemented (as constraint)** | — |
| §18 | Recommendation explainability | Nothing | **Future** | Future |
| §19 | Application selection + override | Add/remove/search/select/deselect all work. No persistence | **Implemented** | P1 (persistence) |
| §20 | Setup plan (ordered, deterministic) | Nothing | **Missing** | **P0** |
| §21 | Installation engine / resolver | Nothing. Catalog stops at metadata by design | **Missing** | **P0** |
| §22 | Installation source trust hierarchy | `origin` records provenance; **nothing ranks or acts on it** | **Partial (data only)** | **P0** |
| §23 | Installation verification | No verification metadata, no check, no plan step | **Missing** | **P0** |
| §24 | Failure handling (8 named cases) | Catalog validation errors only. No resolver failure model, no UI error states, no error boundary | **Missing** | **P0** |
| §25 | Security requirements | Documented and structurally true today because nothing executes. Untested against a resolver that does not exist | **Partial** | **P0** |
| §26 | Privacy | True by absence — the app makes no network requests | **Implemented** | — |
| §27–28 | Open-source model + catalog contribution workflow | CONTRIBUTING, `docs/catalog.md` add-an-app guide, templates, CI validation of real data | **Implemented** | — |
| §29–30 | Repository architecture | `apps/{server,web}` + `packages/{ai,catalog,mcp}` exist. `packages/{core,detection,installer}` and `apps/cli` do not | **Partial** | P0 (installer) / Future (cli) |
| §31 | Frontend flows | Landing → detection → environment → catalog → selection exist. Intent, recommendations, setup plan, and execution/instructions do not | **Partial** | **P0** |
| §32 | Backend responsibilities | Scaffold; 18 empty files | **Missing** | P1 (thin) |
| §33 | Database strategy: Git-managed catalog for MVP, no DB | Exactly what exists | **Implemented** | — |
| §34 | MCP | Placeholder package + constraints doc | **Future (retained)** | Future |
| §35 | CLI | Nothing | **Future** | Future |
| §36 | Agentic future | Nothing | **Future** | Future |
| §37 | Configuration beyond applications | Nothing (PRD puts it outside MVP) | **Future** | Future |
| §38 | NFRs | Extensibility partly at risk (§5 R-03). Accessibility partly good but unaudited. Maintainability good | **Partial** | P1 |
| §39 | Testing: unit / integration / e2e | Catalog unit tests only. No web tests, no server tests, no integration, no e2e | **Partial** | **P0** |
| §40 | Observability: logging, error handling, health endpoint | `utils/logger.js` is 0 bytes; no health endpoint; no error middleware | **Missing** | P1 |
| §41 | Version ladder v0.1 → v1.0 | v0.1 (detection + catalog) effectively done. The ladder puts **v0.3 = AI recommendations before v0.4 = verification** | **Obsolete** under the no-AI direction | P0 (rewrite ladder) |
| §42 | MVP success criteria | Blocked on §20/§21/§23; its "receive relevant recommendations" step is satisfied deterministically by P1 role presets, not by AI | **Partial** | P0 chain + **P1** (Q3) |
| §6 | Phase 1 ecosystems include **Zypper / openSUSE** | Catalog supports apt/dnf/pacman only; README and ROADMAP name 4 distros | **Obsolete** — resolved in favour of the implementation (Q4) | P0 (amend PRD) / Future (zypper) |

---

## 4. Documentation audit

The documentation is better than most projects at this stage — it repeatedly and correctly
says what does not exist. The problems below are drift from two recent moves (community
docs relocated into `docs/`, and a partial rename), not sloppiness.

### 4.1 Broken and stale

| # | Finding | Evidence | Severity |
| - | ------- | -------- | -------- |
| **D-01** | **50 broken relative markdown links.** Community-health docs were moved into `docs/` (commit `566a8f7`) but every cross-reference still assumes the repository root. | `README.md` → `CONTRIBUTING.md`, `ROADMAP.md`, `SECURITY.md`, `CHANGELOG.md`, `NOTICE`, `THIRD_PARTY_NOTICES.md`, `CODE_OF_CONDUCT.md`, `MAINTAINERS.md`, `SUPPORT.md` (16 links). `docs/ROADMAP.md` → `docs/architecture.md` (resolves to `docs/docs/…`, 8 links). `docs/CONTRIBUTING.md` (8), `docs/SUPPORT.md` (5), `docs/{ai,mcp,agent}.md` → `../ROADMAP.md` (3), `packages/{ai,mcp}/README.md`, `apps/server/README.md`, `.github/GOOD_FIRST_ISSUES.md`, `docs/MAINTAINERS.md`, `docs/SECURITY.md`, `docs/security.md`, `docs/THIRD_PARTY_NOTICES.md` → `LICENSE`. | **High** — the contributor path the project depends on (PRD §44) is broken at the first click. |
| **D-02** | **`docs/SECURITY.md` and `docs/security.md` both exist.** Two different files differing only in case. | 5566 B and 5452 B, same directory. | **High** — a clone or checkout **fails or silently loses one file** on macOS and Windows, which are case-insensitive by default. Contributors on those platforms cannot work on the repo cleanly. |
| **D-03** | **Three truncated sentences** left by the in-progress "remove local agent" edits. | `README.md:165` "…MCP, AI, or a — those are out of scope" (uncommitted edit); `README.md:129` mermaid node `REST["AI · MCP · "]`; `CLAUDE.md:17` "must go through a trusted with validation and". | **High** — visible on the repository front page. |
| **D-04** | **Half-removed local-agent layer.** `docs/agent.md` (70 lines) still exists in full, `README.md` and `docs/security.md` still list "privileged operations belong in the local agent" as a non-negotiable principle, but `docs/architecture.md`'s layer description and the README sentences above were stripped. | Commit `28aba68` + working-tree diff. | **Medium** — the repo currently both keeps and denies the layer. Under the stated direction the local agent is **Future**, so the coherent fix is to restore the text and label it Future, not to keep deleting it. |
| **D-05** | **Product name is split in two.** Only `README.md` and `docs/product-requirements.md` say *ConfigShell*. **34 other files** say *Linux App Platform* / `linux-app-platform`, including the root `package.json` name, every workspace package name, the npm scope `@linux-app-platform/*` used in all imports, `apps/web/index.html` `<title>`, `metadata.json`, the CI badge URL, the clone URL in README and `docs/development.md`, `.github/ISSUE_TEMPLATE/config.yml`, and user-visible UI copy in `SiteHeader.tsx`. | `git grep`. | **High** — blocks the doc-coherence pass; see **Q2**. |
| **D-06** | **PRD §29 / header say "Existing Turborepo implementation".** Turborepo was never installed; `turbo.json` was empty and was deleted (commit `c9f3112`). | `CHANGELOG.md` "Removed"; no `turbo` dependency anywhere. | **Medium** — the PRD's own architecture premise is stale. |
| **D-07** | **PRD §47 claims "AI backend structure ✓".** `apps/server/{controllers,services,routes}/ai.*` are **0 bytes**. The same table's "Turborepo ✓" is false (D-06). | `wc -c apps/server/**`. | **Medium** — the PRD overstates current state, which is the one thing the rest of the repo is careful never to do. |
| **D-08** | **The PRD is invisible to the repository's own navigation.** `README.md`'s Documentation table, `docs/ROADMAP.md`, `CLAUDE.md` and `CONTRIBUTING.md` never mention `docs/product-requirements.md`, although it is the newest and highest-level document. | grep. | **Medium** |
| **D-09** | **PRD vs README/ROADMAP on AI.** PRD §7 lists "AI-assisted recommendations" as **MVP-required** and §41 schedules v0.3 AI *before* v0.4 verification. README and ROADMAP place AI firmly post-V1. | §7, §41 vs README "Current V1 scope", ROADMAP "Future / experimental". | **High** — resolved by the stated direction in favour of README/ROADMAP; the PRD must be amended, not quietly ignored. |
| **D-10** | **PRD §6 lists Zypper/openSUSE as a Phase 1 ecosystem;** the catalog, validator, selector, README and ROADMAP all support four distros on apt/dnf/pacman only. | `packages/catalog/src/types.ts`. | **Medium** — see **Q4**. |
| **D-11** | **`CLAUDE.md` "Open-source repository conventions" lists `CONTRIBUTING.md`, `SECURITY.md`, `ROADMAP.md`… as root files.** They are in `docs/`. | `CLAUDE.md`. | **Low** |
| **D-12** | **`.github/CODEOWNERS` protects `/SECURITY.md` and `/NOTICE` at the root** — paths that no longer exist, so those files are now covered only by the `*` default rule. | `CODEOWNERS`. | **Low** |
| **D-13** | **`GOOD_FIRST_ISSUES.md` #8 is already done.** "Explain the inert Continue button" — `SelectionBar.tsx` already wraps it in a `Tooltip` reading "Command generation isn't part of Phase 1 yet." | `SelectionBar.tsx:60-70`. | **Low** |
| **D-14** | **`docs/development.md` "Repository layout" says `docs/` holds "architecture, catalog, security, development".** It now holds 19 files. | `ls docs/`. | **Low** |
| **D-15** | **`CHANGELOG.md` `[Unreleased]` does not record the docs move into `docs/`, the PRD addition, or the partial rename** — the three largest recent changes. | `docs/CHANGELOG.md`. | **Low** |
| **D-16** | **Phase language is ambiguous.** Docs use "Phase 1/2/3" for *completed historical* phases while README/ROADMAP use "V1–V5" for *milestones*, and this document adds implementation phases. Three overlapping schemes. | throughout | **Low** — worth settling on one before the backlog is executed. |
| **D-17** | **The repository's own tagline is "AI-native".** `README.md:8` reads "An open-source, **AI-native** Linux software discovery and management platform", and the root `package.json` `description` repeats it. This is the strongest AI claim anywhere in the repo, and it is the project's first line. | `README.md:8`, `package.json`. | **High** under the no-AI direction — the front page promises a model dependency the core release will not have. Reword to describe the deterministic product, keeping AI as stated future work. |
| **D-18** | **`docs/mcp.md` defines MCP as AI-only.** "MCP … is intended to be the **controlled interface through which AI systems interact with the platform**", and every tool in its sketch is framed around an AI caller. | `docs/mcp.md`. | **Medium** — the direction keeps MCP while deferring AI, but as written MCP is *definitionally* blocked on AI. Reframe it as a client-agnostic tool interface (CLI, editor, agent, or AI) over the same deterministic core; the rules themselves need no change. |

### 4.2 Accurate — confirmed by cross-check

Worth stating explicitly, because it is unusual: **`docs/catalog.md`'s statistics table,
coverage numbers, and every "deliberate omission" claim were recomputed from the data and
are exactly right.** `README.md`'s "What exists today", `docs/architecture.md`'s current-state
section, `apps/server/README.md`'s "0 bytes" claim, `docs/security.md`'s "nothing to exploit"
assessment, and `docs/development.md`'s command table all match reality. Do not "fix" these.

---

## 5. Architectural risks and decisions

| # | Risk | Why it matters | Recommendation |
| - | ---- | -------------- | -------------- |
| **R-01** | **16 of the 73 package-manager sources are `origin: 'vendor'`** — they only work *after* a third-party repository is added (Google's apt/dnf repos, Docker's, Microsoft's, Brave's, Sublime's, Slack's, GitHub CLI's, DBeaver's, Insomnia's, Mozilla's PPA). The catalog has **no field for repository setup**. 14 carry a docs `url`; `google-chrome`'s apt and dnf sources carry **nothing**. | A naive resolver emitting `sudo apt install google-chrome-stable` produces a command that **fails on a clean system**. This is the single biggest correctness risk in the P0 chain, and it is also a security question — repo-setup steps mean keys and sources files. | **Resolved provisionally — Q1 option (b): skip these sources, link the vendor's docs. See §9.** |
| **R-02** | **`official`-only applications cannot produce a command at all.** `cursor` is the only such entry: one source, `method: 'official'`. (`zoom` is *not* official-only — it has `flatpak` and `snap` sources, but both are `origin: 'community'`, which is its own trust question for R-05.) | The plan model must have a first-class **manual step** ("open this vendor page") rather than the resolver silently dropping the app or the UI faking a command. | Model manual steps in the plan type from day one. |
| **R-03** | **No OS/platform axis in the type model.** `Distro`, `InstallMethod` and `InstallationSource` are Linux-only. PRD §6 plans macOS (Homebrew) and Windows (WinGet/Scoop/Chocolatey); PRD §4.5 makes extensibility a principle. | Adding a second OS later would touch every type, every validation rule, and every catalog entry. | Introduce an `Environment` type with an explicit `os` field **now**, with `'linux'` as the only value. Cheap now, expensive later. Do **not** add macOS/Windows data. |
| **R-04** | **Command generation must not live in `apps/web`.** | It is the security-critical step (PRD §17, §25), and it is exactly what a future CLI, MCP server and local agent must reuse. Putting it in React would make all three impossible without a rewrite, and would put the one dangerous function behind a UI framework. | Put resolver + plan + command generation in **one new package, `packages/installer`** (the name PRD §30 already uses). The web app becomes a renderer. |
| **R-05** | **`origin` preference order is undefined.** The catalog records `distro`/`vendor`/`community` and `docs/catalog.md` says later phases "are expected to prefer on it", but PRD §22's hierarchy has never been encoded. | Without an explicit, documented, tested policy the resolver's choice is arbitrary — and "which source did you pick and why" is a user-trust question, not an implementation detail. | Encode PRD §22 as an explicit, overridable preference function with tests, and surface the reason in the UI. |
| **R-06** | **Verification (PRD §23) has no data to work from.** There is no binary name, no version flag, no "how do I know this worked" field. | The resolver must not invent per-application check commands — that is precisely the "arbitrary strings reach a shell" failure the security model forbids. | Add a narrow, closed-shape verification field to the catalog schema (e.g. `verify: { binary: string }`) and generate only `command -v <binary>` style checks from a fixed template. |
| **R-07** | **Privileged steps are not modelled.** PRD §25 requires privileged operations to be displayed. | `apt`/`dnf`/`pacman`/`snap` need root; `flatpak --user` and `official` do not. The user must see which steps escalate *before* copying. | Mark each plan step with a `privileged: boolean` derived from the method, not from a string scan. |
| **R-08** | **Zero tests outside `packages/catalog`.** No web test runner at all; `apps/server` reports 0 tests. | Command generation is the one feature in this project that **cannot** ship untested. | A test runner is a **P0 prerequisite**, not a follow-up. |
| **R-09** | **Documentation drift is now a contribution risk** (D-01, D-02, D-05) and the catalog statistics table is hand-maintained. | PRD §44 makes contribution velocity an explicit goal; 50 dead links and a case-colliding filename work directly against it. | Fix in the first phase; automate the stats table (GOOD_FIRST_ISSUES #9). |
| **R-10** | **Unowned vendor template code in the build path.** `apps/web/vite.config.ts` contains `aistudioMediaPlugin` (with a `// LINT.ThenChange(//depot/google3/…)` marker pointing at a Google-internal path) serving files from `apps/web/public/assets/aistudio/`, a directory whose only content is a `.gitignore` containing `*`. `apps/web/metadata.json` is an AI Studio manifest. | Low security risk (dev-server only, path-prefix checked), but it is unexplained third-party scaffolding in the build of a project whose selling point is auditability. | Document it or remove it — maintainer's call (already GOOD_FIRST_ISSUES #13). The `metadata.json` Gemini capability is a separate, clearer issue — see §6. |
| **R-11** | **Local `apps/web/package-lock.json` (8419 lines).** Untracked and correctly git-ignored, so it is not a repository defect — but it means npm has been run inside a pnpm-only workspace on this machine. | Can produce a divergent local `node_modules`. | Delete it locally. No repo change needed. |
| **R-12** | **No dependency-vulnerability gate in CI**, although `docs/SECURITY.md` names dependency vulnerabilities as today's most realistic risk. Dependabot covers updates, not PR-time regressions. | Cheap gap. | Add `pnpm audit` to CI (non-blocking first, then blocking). P1. |

### 5.1 Unnecessary dependencies — checked, none found

Every non-obvious `apps/web` dependency was traced to a real import: `radix-ui` (11),
`cn` (16), `class-variance-authority` (6), `lucide-react` (9), `tw-animate-css`,
`@fontsource-variable/geist` and `shadcn` (all three imported by `src/index.css`), and
`express` (used by `server.js`). `shadcn` as a runtime dependency looks wrong but is
correct for this CLI version, which ships `shadcn/tailwind.css`. `apps/server` has only
`express` + `dotenv`, both used. **No dependency removals are recommended.** The previous
cleanup (removing `@google/genai`, `motion`, `autoprefixer`, `esbuild`, `tsx`, duplicate
`vite`) appears to have been thorough.

### 5.2 Keeping MCP buildable (without building it)

MCP stays in scope as a future integration layer. The core work in §7 is what makes it
possible, and nothing extra is needed now:

- The `packages/mcp` sketch in `docs/mcp.md` lists `search_apps`, `get_app_details`,
  `check_compatibility`, `create_install_plan`, `validate_install_plan`. **Each maps 1:1
  onto a function the deterministic core must expose anyway.**
- Therefore: build the core as **pure, UI-independent, synchronous functions over
  (catalog, environment)** with typed inputs and outputs. If the web app is the only thing
  that can call the resolver, MCP is blocked; if `packages/installer` exports plain
  functions, MCP is a thin adapter later.
- `get_system_info` and `execute_install_plan` depend on the local agent and stay Future.
- Do not add an MCP SDK dependency, a transport, or a tool registry now.

---

## 6. AI / model items moved to Future scope

Nothing in the repository currently *implements* AI — there is no model client, no provider
SDK, no key handling, and no AI dependency in any lockfile. The work is therefore
**recording and containment**, not removal. Nothing below blocks the core.

| Item | Where it lives | Action |
| ---- | -------------- | ------ |
| AI recommendation engine (PRD §16) | PRD only | **Future.** Amend PRD §7 so it is not listed as MVP-required (D-09). |
| Recommendation explainability (PRD §18) | PRD only | **Future.** Depends on the above. |
| AI-assisted recommendations as MVP requirement #8 (PRD §7) | PRD §7 | **Future.** This is the specific line that contradicts the direction. |
| Version ladder "v0.3 = AI recommendations" (PRD §41) | PRD §41 | **Rewrite.** Resequence so verification and reliability precede any AI milestone. |
| MVP success criterion "receive relevant recommendations" (PRD §42) | PRD §42 | **Satisfied deterministically at P1** (Q3): curated role → app-id bundles, no model. |
| `packages/ai` (package.json + README, no source) | `packages/ai` | **Keep as-is.** It is an empty, zero-cost workspace member that reserves the seam. Do not delete; do not implement. |
| `docs/ai.md` | `docs/ai.md` | **Keep as-is.** It is already an accurate "not started" status document with the right constraints (AI plans, never executes; output is untrusted; plans reference catalog ids only; no provider key in the browser). Add a one-line note that it is Future under the current direction. |
| `apps/server/controllers/ai.controller.js`, `services/ai.service.js`, `routes/ai.routes.js` | `apps/server` | ~~Keep as 0-byte placeholders.~~ **Superseded:** they were deleted in the open-source readiness pass. An empty controller sitting among working ones makes the repo look more complete than it is; the design lives in `docs/ai.md`, which is where it belongs until there is code. |
| **`apps/web/metadata.json` declares `MAJOR_CAPABILITY_SERVER_SIDE_GEMINI_API`** | `apps/web/metadata.json` | **Remove that capability now (P0).** It is the only place in the repository that asserts a live model dependency, the project does not implement it, and the repo's own rule is "never document, display, or imply functionality that doesn't exist." |
| **README tagline + root `package.json` description say "AI-native"** | `README.md:8`, `package.json` | **Reword now (P0).** See D-17. The core release is deterministic; the tagline should say so. |
| **`docs/mcp.md` frames MCP as an AI-only interface** | `docs/mcp.md` | **Reframe (P0-A).** See D-18. MCP is retained; describe it as client-agnostic so it is not blocked on AI. |
| AI provider keys / model-hosting requirements | `apps/server/.env.example` | **Already correct** — the file explicitly declares no AI keys and says not to add them ahead of the code. No change. |
| Local agent (`docs/agent.md`), CLI, cross-platform, database/accounts | docs + PRD §35–37 | **Future**, unchanged. Note the local agent is *not* an AI item — it is being half-removed by unrelated edits (D-04) and should be restored as Future. |

**Architectural possibility preserved.** The seam for AI is already correct and needs no new
work: a future AI layer consumes `packages/catalog` + `packages/installer`, emits
*application ids only*, and those ids flow through the same resolver, the same validation
and the same user approval as a manual selection. Building the core as pure functions
(R-04, §5.2) is the only thing required to keep that door open.

---

## 7. What must be built first, and why

The core release is the deterministic chain the PRD describes:

```
catalog → environment → selection → resolution → setup plan → command generation → verification
  ✅          ⚠️            ✅          ✗            ✗               ✗                  ✗
```

The order below is dictated by data dependencies, not preference.

1. **Repository coherence first (P0-A).** 50 dead links, a filename that breaks macOS and
   Windows clones, three truncated sentences on the front page, and a two-name identity
   crisis. This is one focused pass, it unblocks every contributor including future Claude
   Code sessions, and it is the only phase whose cost *increases* with every commit made
   before it.

2. **Environment model before anything downstream (P0-B).** The resolver's input is
   `(application, environment)`. Today `distro` is write-only state. Until the environment
   is a real, typed value flowing through the app, everything after it is guesswork — and
   R-03 (the OS axis) is nearly free now and expensive later.

3. **Catalog schema additions before the resolver (P0-C).** Verification (R-06) and
   repository setup (R-01) are *data*, and the resolver must not invent either. Changing
   the schema after the resolver exists means changing both. The catalog already has the
   validation and test machinery to absorb this cleanly.

4. **Resolver before plan before commands (P0-D → P0-F).** Each is a pure function over the
   previous one's output. Resolution answers "which source, and why"; the plan answers "in
   what order, with what privileges"; command generation is the *only* step that knows
   `apt` means `apt-get install -y`. Keeping them separate is what makes the security model
   testable, and it is what MCP and a future CLI reuse (§5.2).

5. **A test runner alongside the resolver, not after it (P0-G).** Command generation is the
   one feature that cannot ship on inspection alone. The resolver deserves tests from its
   first commit.

6. **UI wiring last (P0-H).** Once the core is a set of pure functions, the UI is
   comparatively cheap. Wiring it earlier guarantees logic leaks into React (R-04).

**Deliberately *not* first: the backend.** `apps/server` has 18 empty files and no reason to
exist yet. The catalog is compiled into the browser bundle, which is simpler, faster and
strictly safer; README, ROADMAP and `apps/server/README.md` all already say a real API waits
until something genuinely needs one. Nothing in the P0 chain does. Building it now would add
deployment, an API contract and an attack surface in exchange for nothing a user can see.

---

## 8. Implementation backlog

Each phase is sized to be a reviewable unit of work. Phases are ordered; items within a
phase are mostly parallelisable.

> ### Progress as of 2026-09-16
>
> | Phase | State |
> | ----- | ----- |
> | **A** — repository coherence | ✅ **done** — rename applied repo-wide, 50 links fixed, case collision resolved, truncations repaired, PRD amended, AI references moved to future scope, `docs/mcp.md` reframed as client-agnostic |
> | **B** — environment model | ✅ **done in `packages/catalog`** — `Environment`, `parseEnvironment`, `os` axis, single distro↔ecosystem mapping. ⚠️ **B3 outstanding:** `apps/web` still holds `distro` as write-only state |
> | **C** — catalog schema | ✅ **done** — `verify.binary` on 26 of 31 entries, validated. **C2 resolved without a schema change:** `requiresRepositorySetup()` derives the answer from `method` + `origin`, which the catalog already records (see below). C4 (stats script) outstanding |
> | **D** — resolution | ✅ **done** — `packages/installer`, trust policy per PRD §22, typed failure model, 44 tests |
> | **E** — setup plan | ✅ **done** — ordered, deterministic, data-not-strings, privileged flags, first-class manual steps |
> | **F** — command generation | ✅ **done** — fixed vocabulary, re-validation before interpolation, golden tests per manager, hostile-catalog test, metacharacter assertion |
> | **G** — test infrastructure | ⚠️ **partial** — 122 tests across catalog, installer and server, including an integration test across the full chain (G4). **G1/G2 outstanding:** `apps/web` still has no test runner |
> | **H** — UI completion | ❌ **not started** — the core generates plans and commands; the interface renders neither |
> | **I** — release readiness | ⚠️ **partial** — documentation updated to match (I1); CI covers the new workspaces (I2) |
>
> **Also built, ahead of its place in this backlog:** `apps/server`, a read-only planning
> API. §7 argued for deferring the backend on the grounds that nothing in the P0 chain
> needed it, and that reasoning still holds for the *web app*, which compiles the catalog in
> and does not call the API. It was built on the maintainer's instruction; the cost noted
> there (an API contract and an attack surface) is real and now exists. It is kept thin — no
> database, no auth, no execution — so it adds a consumer rather than a dependency.
>
> **On C2.** Q1's answer asked for "the smallest clean abstraction" distinguishing directly
> resolvable sources from vendor sources needing setup. That turned out to need **no new
> catalog field at all**: for a native package manager, `origin: 'vendor'` already means
> "published in the vendor's own repository" by the catalog's own definition — if the
> distribution shipped it, the origin would be `'distro'`. The derivation lives in one
> predicate, so a future catalog field can replace it without reshaping the resolver.

### P0 — required for the core release

#### Phase A — repository coherence *(no behaviour change)*
| ID | Item | Touches |
| -- | ---- | ------- |
| A1 | **Rename to ConfigShell everywhere** (Q2 = full rename): package names, npm scope, `index.html` title, `metadata.json`, UI copy, badge and clone URLs, `.github/ISSUE_TEMPLATE/config.yml` | repo-wide |
| A2 | **Fix all 50 broken relative links** (D-01) | `README.md`, `docs/*`, `packages/*/README.md`, `apps/server/README.md`, `.github/GOOD_FIRST_ISSUES.md` |
| A3 | **Resolve `docs/SECURITY.md` vs `docs/security.md`** (D-02) — rename the model document (e.g. `docs/security-model.md`) and update every reference | `docs/` |
| A4 | **Repair the three truncated sentences** and restore the local agent as explicit Future scope (D-03, D-04) | `README.md`, `CLAUDE.md`, `docs/architecture.md` |
| A5 | **Amend the PRD**: remove AI from MVP-required (§7), resequence the version ladder (§41), correct "Turborepo" (§29) and the "AI backend structure ✓" status table (§47), reconcile §6 Zypper with actual scope (Q4) | `docs/product-requirements.md` |
| A6 | **Remove `MAJOR_CAPABILITY_SERVER_SIDE_GEMINI_API`** from `apps/web/metadata.json` (§6) | `apps/web/metadata.json` |
| A6b | **Reword the "AI-native" tagline** (D-17) and **reframe `docs/mcp.md` as client-agnostic** (D-18) | `README.md`, `package.json`, `docs/mcp.md` |
| A7 | **Link the PRD and this audit** from `README.md`'s documentation table, `docs/ROADMAP.md` and `CLAUDE.md` (D-08); refresh `CODEOWNERS` paths (D-12), `CLAUDE.md` root-file list (D-11), `docs/development.md` layout (D-14), CHANGELOG (D-15); mark GOOD_FIRST_ISSUES #8 done (D-13) | docs, `.github/` |

#### Phase B — environment model
| ID | Item |
| -- | ---- |
| B1 | Add an `Environment` type to `packages/catalog` (alongside `Distro`), with an explicit `os: 'linux'` field, the selected distribution, the derived package ecosystem, and an optional architecture. Linux-only values; no macOS/Windows data (R-03). |
| B2 | Derive ecosystem from distribution in one place (`Ubuntu|Debian → apt`, `Fedora → dnf`, `Arch Linux → pacman`) rather than scattering the mapping. `validate.ts`'s `METHOD_DISTROS` is the existing home for this knowledge — reuse it, do not duplicate it. |
| B3 | Thread the environment through `apps/web`: `App.tsx` → `AppCatalog` → `AppCard`, replacing the write-only `distro` state (§2.2). |
| B4 | Keep detection honest: `useLinuxDetection` continues to report only "looks like Linux"; the environment is always an explicit user choice. Real detection stays Future. |

#### Phase C — catalog schema for the core
| ID | Item |
| -- | ---- |
| C1 | **Verification metadata** (R-06): a closed-shape field per application (e.g. `verify: { binary: string }`). Extend `validateCatalog` and its tests. Populate for all 31 entries against the same verification discipline `docs/catalog.md` already mandates. |
| C2 | **No repository-setup metadata** (Q1 = option b, provisional). Instead: whatever minimal catalog signal the resolver needs to tell a *directly resolvable* source from a *vendor source requiring setup*. Keep it small and extensible; document it as temporary/TBD. The catalog stays free of shell fragments. |
| C3 | Document both additions in `docs/catalog.md` (schema, rules, add-an-application guide) and update the counts table. |
| C4 | Add the catalog statistics script (GOOD_FIRST_ISSUES #9) so the counts stop being hand-maintained (R-09). |

#### Phase D — `packages/installer`: resolution
| ID | Item |
| -- | ---- |
| D1 | Create `packages/installer` (PRD §30's name), TypeScript, no build step, same pattern as `packages/catalog`. Add it to root `typecheck`/`test` scripts and CI. |
| D2 | `resolve(application, environment)` → a typed result: the chosen `InstallationSource` **plus the reason it was chosen**, or a typed "no verified route" outcome. Pure function, no I/O. |
| D3 | Encode PRD §22's trust hierarchy as an explicit preference policy over `origin` and `method` (R-05), with tests per rule. |
| D4 | Typed failure model covering PRD §24's cases that are knowable without executing anything: no verified route for this environment, `official`-only (manual step), unsupported environment, unknown application id. |
| D5 | Tests from the first commit, including every deliberate catalog omission (VLC on Fedora, AUR-only apps on Arch, Cursor/Zoom official-only). |

#### Phase E — setup plan
| ID | Item |
| -- | ---- |
| E1 | `buildPlan(selection, environment)` → an ordered, deterministic plan: metadata-refresh step, grouped installs per package manager, manual steps for `official` sources, repository-setup steps if Q1 requires them, verification steps last (PRD §20). |
| E2 | Each step carries `privileged: boolean` derived from its method, never from string inspection (R-07). |
| E3 | Manual steps are first-class, not a fallback hack (R-02). |
| E4 | The plan is **data, not strings** — no command text at this layer. Deterministic for a given (selection, environment, catalog). Snapshot-tested. |

#### Phase F — safe command generation
| ID | Item |
| -- | ---- |
| F1 | `renderCommands(plan)` — the only code in the repository that knows a package manager's command form. Fixed vocabulary per manager; identifiers re-validated against a strict pattern before interpolation; nothing user-supplied ever reaches a command string (PRD §17, §25). |
| F2 | Verification commands generated from the C1 template only (`command -v <binary>`), never per-application free text. |
| F3 | Privileged steps rendered visibly as such; the full command is always shown before it can be copied. |
| F4 | Tests: golden-output tests per manager, plus a negative test asserting that a hostile catalog entry cannot inject shell metacharacters. Keep `docs/security.md`'s bundle-grep property true by asserting it. |

#### Phase G — test infrastructure
| ID | Item |
| -- | ---- |
| G1 | Vitest in `apps/web` (GOOD_FIRST_ISSUES #6); wire `pnpm --filter web test` into the root `test` script and CI. |
| G2 | Web tests for selection, filtering, and the new environment-aware rendering. |
| G3 | First `apps/server` tests for `config/env.js` (GOOD_FIRST_ISSUES #2) so `pnpm test` stops reporting a zero-test pass. |
| G4 | An integration test across the PRD §39 boundary: environment → catalog → resolver → plan → commands. |

#### Phase H — UI completion of the V1 flow
| ID | Item |
| -- | ---- |
| H1 | Distribution availability on application cards, honestly worded (GOOD_FIRST_ISSUES #4 — ⚠️ wording is a product decision). |
| H2 | Application detail view: verified sources, what `distro`/`vendor`/`community` mean, homepage. |
| H3 | Setup plan review screen (PRD §20, §31): ordered steps, privileged steps marked, manual steps explained, per-app "no route" stated plainly. |
| H4 | Command display + copy-to-clipboard, with the full command visible first. The browser never executes it. |
| H5 | The "Continue" button becomes real; remove the Phase-1 tooltip. |
| H6 | Failure and empty states for every outcome in D4 (PRD §24). |
| H7 | Error boundary (GOOD_FIRST_ISSUES #12). |

#### Phase I — release readiness
| ID | Item |
| -- | ---- |
| I1 | Update `README.md`, `docs/architecture.md`, `docs/security.md`, `docs/catalog.md`, `ROADMAP.md`, `CHANGELOG.md` to describe the core as built — same honesty standard as today. |
| I2 | CI runs the new packages; `pnpm check` stays the single gate. |
| I3 | Tag the first release per the CHANGELOG's own procedure. |

### P1 — important after P0
- Search by `id`, `tags` and `aliases` (PRD §14; needs a catalog field — GOOD_FIRST_ISSUES #7).
- Selection persistence across reloads (GOOD_FIRST_ISSUES #5).
- Accessibility audit of the full flow, including the new plan screen (GOOD_FIRST_ISSUES #10, PRD §38).
- `apps/server` minimum viable observability *only if a server is actually needed*: health endpoint, error + not-found middleware, structured logger, tests (PRD §40).
- `pnpm audit` in CI (R-12).
- Catalog growth: more verified applications; the missing PRD §13 categories (Design, Productivity, Databases, DevOps, Security, Education).
- Application icons, after the licensing/trademark question is settled.
- Decide and document the AI-Studio scaffolding in `vite.config.ts` (R-10, GOOD_FIRST_ISSUES #13).
- **Deterministic role/use-case presets (Q3).** Curated role → app-id bundles: Web Developer, Student, General User, AI/ML Developer, DevOps. No AI/model dependency. The resolver and catalog must absorb these without restructuring.

### P2 — later
- Additional distributions: Linux Mint, Pop!_OS, openSUSE/Zypper (Q4 — explicitly *not* P0; no catalog research triggered now).
- Shareable/persisted selections (may need a backend — decide then).
- A real `apps/server` API, once something genuinely needs one.
- Automated link checking in CI, to stop D-01 recurring.
- E2E tests of the full journey (PRD §39).
- Additional install methods (AppImage, `zypper`) as the ecosystem list grows.

### Future — explicitly deferred
- **AI planning layer** (`packages/ai`, `docs/ai.md`): recommendations, explainability, compatibility reasoning, natural-language discovery, plan drafting. Provider-agnostic, server-side keys, output validated against the catalog, never a command string. *No work now.*
- **MCP interface** (`packages/mcp`, `docs/mcp.md`): retained as a planned integration layer; unblocked by building the core as pure functions (§5.2). *No work now.*
- **Local Linux agent** (`docs/agent.md`): real system detection, package-manager detection, installation execution, `check_installed`. The only component permitted to change a system.
- **CLI** (`apps/cli`, PRD §35) — a natural second consumer of `packages/installer`.
- **Cross-platform** (PRD §6): macOS/Homebrew, Windows/WinGet/Scoop/Chocolatey. The `os` field from B1 is the only preparation needed now.
- **Database, accounts, analytics, community catalog submissions** (PRD §33 "Future").
- **Configuration beyond applications** (PRD §37): dotfiles, git/SSH/shell config, language version managers.

---

## 9. Decisions (resolved 2026-09-16)

All four blocking questions were answered by the maintainer. **Three of the four are
explicitly provisional** — they are sequencing and scope calls made to get the
deterministic core moving, not permanent product decisions. Implementation must keep each
one cheap to reverse.

### Q1 — vendor repositories → **(b), provisional**

Vendor-origin package-manager sources that require third-party repository setup are
**skipped** by the resolver. No command is generated for them; where an official
documentation `url` exists it is surfaced as the recommended installation path instead.

**Explicitly not now:** repository-setup metadata, signing keys, sources files, any
repo-management logic.

**Binding constraint on the implementation:** introduce the *smallest clean abstraction*
that lets the resolver distinguish three outcomes —

1. directly resolvable package-manager source,
2. vendor source requiring additional setup (skipped, link out),
3. unsupported / unresolvable,

— and no more. The catalog schema, the resolver's result type and the UI must all stay
easy to extend when this is revisited. Do not over-engineer for option (a) now; do not
foreclose it either. **Document this in-code and in `docs/catalog.md` as temporary/TBD.**

### Q2 — product name → **ConfigShell, everywhere**

Full rename: documentation, workspace package names, the `@linux-app-platform/*` npm scope
used in every import, `apps/web/index.html` title, `metadata.json`, UI copy, CI badge and
clone URLs, `.github/ISSUE_TEMPLATE/config.yml`, and the GitHub repository URL. One pass,
in Phase A, before `packages/installer` exists.

### Q3 — role/use-case presets → **P1, after the core chain**

Not part of the initial core. Build `catalog → resolution → setup plan → command
generation → verification` first and get it stable. Then add curated role presets (Web
Developer, Student, General User, AI/ML Developer, DevOps, …).

**Constraints:** presets stay **fully deterministic and catalog-driven, with no AI/model
dependency**, and the resolver and catalog must be shaped so bundles can be added *without
restructuring either*. This is a sequencing decision — keep the feature cheap to promote
back to P0.

### Q4 — openSUSE / Zypper → **out of active scope; the implementation wins**

> **Superseded by the implementation (do not act on this decision).** Zypper/openSUSE was
> subsequently built: `PackageEcosystem`, `ECOSYSTEM_DISTROS`, the trust policy, plan
> ordering and command generation all cover it, and `openSUSE` is a selectable
> distribution. What is still missing is **catalog data**, not code — no entry carries a
> verified `zypper` identifier, so on openSUSE 23 of 31 applications resolve through
> Flatpak/Snap, one is a manual step, and seven have no route at all. See
> `docs/catalog.md` and `docs/product-requirements.md` §6 for the current position. The rest
> of this section is kept as the record of what was decided at the audited commit.

Active scope is the repository's **actual verified coverage**: apt / dnf / pacman across
Ubuntu, Debian, Fedora and Arch Linux. Zypper/openSUSE becomes a later/future ecosystem.
Amend the PRD and any other document to match the implementation rather than expanding the
catalog to satisfy older PRD wording. No new catalog research is triggered by this.

### Standing rule for scope/documentation mismatches

The maintainer generalised Q4 into a rule that applies for the rest of the implementation.
When documentation and code disagree:

1. **inspect the actual repository data first** — never trust the doc;
2. **preserve working implementation**;
3. prefer the **smallest safe change**;
4. keep **future extensibility**;
5. avoid locking in a permanent product decision unnecessarily;
6. **document provisional decisions clearly as provisional.**


## 10. Summary

- **The repository is healthy and green.** Lint, typecheck, 20 catalog tests and the
  production build all pass. There is no broken state to recover from.
- **The catalog is production-quality** and is the project's main asset — verified,
  validated, tested, and accurately documented down to the counts.
- **The deterministic core does not exist yet.** Resolution, setup plan, command generation
  and verification are all unstarted, and environment selection is currently write-only
  state with no downstream effect.
- **Documentation is honest but has drifted**: 50 broken links, a case-colliding filename
  that breaks macOS/Windows clones, three truncated sentences, a half-removed local-agent
  layer, and a product name that only two files use.
- **No AI is implemented anywhere**, so the no-AI direction costs nothing to adopt. The only
  live model reference is one capability flag in `apps/web/metadata.json`. Everything else
  is documentation, and the existing `packages/ai` + `docs/ai.md` seam is already the right
  shape to add AI later.
- **MCP is retained.** Building the core as pure, UI-independent functions in
  `packages/installer` is the entire cost of keeping it possible.
