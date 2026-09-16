# Contributing to ConfigShell

Thanks for considering a contribution. This project is maintained by two people, so a
focused, well-described pull request gets reviewed much faster than a large one.

Before anything else, please read the [Code of Conduct](CODE_OF_CONDUCT.md). It applies to
every space this project uses.

**New here?** [`.github/GOOD_FIRST_ISSUES.md`](../.github/GOOD_FIRST_ISSUES.md) lists real,
self-contained tasks in this codebase, with the files each one touches.

---

## What this project accepts

The project is an early-stage scaffold with a deliberately narrow current scope (see
[`ROADMAP.md`](ROADMAP.md)). Contributions that fit well:

- Catalog additions and corrections — the most valuable contribution right now.
- Tests, especially the first tests for `apps/web`.
- Documentation fixes (including "this command did not work for me").
- UI, accessibility, and error-handling improvements in `apps/web`.
- Developer tooling that removes friction without adding a tool to learn.

Contributions that need an issue and agreement **first**:

- Anything that adds a runtime dependency.
- The first real API endpoint in `apps/server` (the catalog is currently compiled into the
  browser bundle — adding a server-side catalog API is an architecture change).
- AI, MCP, or local-agent work (see `docs/ai.md`, `docs/mcp.md`, `docs/agent.md`).
- Adding a Linux distribution (see [`docs/catalog.md`](catalog.md)).
- Restructuring workspaces, build tooling, or the theming setup.

Contributions that will be declined outright: anything that lets the browser execute shell
commands, anything that hands unvalidated input to a shell, anything that installs software
without explicit user confirmation, and any catalog entry whose identifiers were guessed.
These are [security invariants](security-model.md), not preferences.

---

## Set up

Requirements: **Node.js >= 20** and **pnpm 9.15.5** (pinned in the root `package.json`).

```sh
corepack enable
corepack prepare pnpm@9.15.5 --activate
```

Fork the repository on GitHub, then:

```sh
git clone https://github.com/<your-username>/configshell.git
cd configshell
git remote add upstream https://github.com/AbhiDevepl/configshell.git
pnpm install
```

Environment variables are optional; the web app needs none. For the server:

```sh
cp apps/server/.env.example apps/server/.env
```

Full setup notes, every variable, and troubleshooting live in
[`docs/development.md`](development.md).

## Run it

```sh
pnpm dev                    # web app → http://localhost:3000
pnpm --filter server dev    # Express scaffold (starts, serves nothing yet)
```

Both default to port 3000 — set `PORT` in `apps/server/.env` if you run them together.

## Check your work

Run this before opening a pull request. It is exactly what CI runs:

```sh
pnpm check     # lint → typecheck → test → build
```

Individually:

```sh
pnpm lint       # ESLint (flat config at eslint.config.js)
pnpm typecheck  # tsc --noEmit for apps/web and packages/catalog
pnpm test       # catalog test suite (+ apps/server, which has no test files yet)
pnpm build      # production build of apps/web
```

**Formatting:** there is no formatter to run. `.editorconfig` covers indentation and line
endings; otherwise match the file you are editing. Please do not reformat code you are not
otherwise changing.

**Tests:** only `packages/catalog` has a test suite today (Node's built-in runner via
`tsx`). If your change is testable there, add a test. `apps/web` has no test runner yet —
adding one is itself a welcome contribution, as an intentional pull request rather than a
side effect of another change.

---

## Branches

Branch off `main`, one topic per branch:

```sh
git checkout main
git pull upstream main
git checkout -b feature/catalog-add-inkscape
```

| Prefix | Use for | Example |
| ------ | ------- | ------- |
| `feature/` | new functionality | `feature/installer-resolver` |
| `fix/` | bug fixes | `fix/selection-bar-mobile-overflow` |
| `docs/` | documentation only | `docs/clarify-distro-detection` |
| `refactor/` | no behaviour change | `refactor/extract-app-card` |
| `chore/` | tooling, deps, config | `chore/bump-eslint` |
| `test/` | tests only | `test/catalog-validation-edge-cases` |

Lowercase, hyphen-separated, descriptive.

## Commits

Lightweight [Conventional Commits](https://www.conventionalcommits.org/). No tooling
enforces this — it is a convention that keeps the log readable and makes changelog
assembly straightforward.

```
<type>(<optional scope>): <short imperative summary>

<optional body: what changed and why, wrapped at ~72 columns>
```

Types: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`, `build`, `ci`, `perf`.

Scopes used in this repo: `catalog`, `web`, `server`, `docs`, `ci`, `deps`.

Real examples:

```
feat(catalog): add Inkscape with verified apt, dnf and flatpak sources
fix(web): keep the selection sheet usable when the list is empty
docs(catalog): document how to add a distribution
chore(deps): move vite plugins to devDependencies
```

Write the summary in the imperative ("add", not "added"), keep it under ~72 characters, and
do not end it with a period. A body is optional for small changes and expected for anything
non-obvious — explain *why*, since the diff already shows *what*. Breaking changes get a
`!` after the type (`feat(catalog)!: …`) and a `BREAKING CHANGE:` note in the body.

---

## Pull requests

1. Make sure `pnpm check` passes.
2. Push your branch to your fork and open a pull request against `main`.
3. Fill in the [pull request template](../.github/PULL_REQUEST_TEMPLATE.md) — summary, linked
   issue, what you tested, and screenshots for UI changes.
4. Keep it focused. One logical change per pull request; unrelated fixes belong in their own.
5. Update the docs in the same pull request as the behaviour they describe. A command,
   script, or variable that changes must be corrected everywhere it appears —
   `README.md`, `docs/`, the relevant workspace README, and `CLAUDE.md`.
6. Add an entry under `## [Unreleased]` in [`CHANGELOG.md`](CHANGELOG.md) for anything
   user-visible (features, fixes, breaking changes). Pure refactors and internal chores do
   not need one.

### What reviewers look for

- **It is what the pull request says it is.** No unrelated changes, no drive-by
  reformatting, no stray dependency additions.
- **Accuracy over ambition.** Nothing in the code, docs, or UI may claim functionality that
  does not exist. This project documents its own incompleteness on purpose.
- **Catalog entries are verified**, with source links in the pull request description.
- **Security invariants hold** (see [`docs/security-model.md`](security-model.md)) — no shell
  execution from the browser, no unvalidated input reaching a command, no silent system
  changes.
- **It fits the existing structure.** Fill in the scaffold rather than inventing a parallel
  one; the directory layout reflects the intended architecture.
- **New dependencies are justified.** "It saves 20 lines" usually is not enough.

Expect review comments — most pull requests get some. Push follow-up commits to the same
branch rather than force-pushing a rewritten history while review is in progress; the
maintainers squash on merge, so your branch history does not need to be pretty.

Maintainers are two people doing this alongside other work: a first response may take
several days. Pinging the pull request after a week is fine and welcome.

---

## Reporting bugs and requesting features

Use the [issue templates](../.github/ISSUE_TEMPLATE) — bug report, feature request, or
documentation issue. A bug report needs your OS and distribution, Node and pnpm versions,
the commit you are on, exact reproduction steps, and what you expected instead.

**Do not report security vulnerabilities in a public issue.** Follow
[`SECURITY.md`](SECURITY.md).

Questions that are not bugs belong in [`SUPPORT.md`](SUPPORT.md).

---

## Licensing of contributions

This project is licensed under the [Apache License 2.0](../LICENSE). By submitting a
contribution you agree that it is licensed under the same terms (Apache-2.0, section 5).
Only contribute code you have the right to contribute, and never paste code from a source
whose license you have not checked — see [`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md).
