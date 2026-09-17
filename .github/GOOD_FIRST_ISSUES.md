# Good first issues

Real, self-contained work in this codebase — not placeholder tasks. Each one names the
files it touches and what "done" looks like, so you can start without waiting for a
maintainer to scope it for you.

**Before you start:** read [`CONTRIBUTING.md`](../docs/CONTRIBUTING.md), run `pnpm install` and
`pnpm check` to confirm a clean baseline, and **open (or comment on) an issue saying you
are taking it** so two people do not do the same work. Anything marked ⚠️ needs agreement
on the approach before you write code.

Difficulty is about context needed, not hours: **Starter** needs no prior knowledge of the
codebase, **Intermediate** needs you to read a couple of files first, **Involved** touches
a design decision.

---

### 1. Add a verified application to the catalog

| | |
| --- | --- |
| **Difficulty** | Starter |
| **Area** | `packages/catalog` |
| **Files** | `packages/catalog/src/applications.ts`, `docs/catalog.md` (counts table) |
| **Skills** | TypeScript basics, careful research |

The catalog has 31 applications; obvious absences include GIMP, Inkscape, Blender, Thunderbird, LibreOffice, Neovim, Audacity, OBS Studio, and Kdenlive. Pick one, verify every installation identifier against an authoritative source, add the entry, update the counts.

**Done when:** the entry is added, `pnpm --filter @configshell/catalog test` passes, and the pull request lists a source link for every identifier. Read the rules in [`docs/catalog.md`](../docs/catalog.md) first — the AUR is not `pacman`, and an unverified identifier is omitted, never guessed.

---

### 2. Write the first tests for `apps/server`

| | |
| --- | --- |
| **Difficulty** | Starter |
| **Area** | `apps/server` |
| **Files** | new `apps/server/config/env.test.js` |
| **Skills** | Node's built-in test runner |

`apps/server/config/env.js` validates `PORT` and `NODE_ENV` and is pure, easily testable logic — and `pnpm --filter server test` currently finds zero test files. Cover: defaults when unset, a valid port, a non-numeric port, out-of-range ports (`0`, `70000`), and an invalid `NODE_ENV`.

**Done when:** `pnpm --filter server test` reports passing tests instead of zero, and the error cases assert on the message, not just that it throws. (You will likely need to export the validation helpers, or set `process.env` before a dynamic `import()` — either is fine; explain which you chose.)

---

### 3. Add a favicon

| | |
| --- | --- |
| **Difficulty** | Starter |
| **Area** | `apps/web` |
| **Files** | `apps/web/index.html`, new `apps/web/public/favicon.svg` |
| **Skills** | HTML, basic SVG |

`apps/web/index.html` declares no icon, so browsers request `/favicon.ico` and get a 404. The header already has a logo mark (a green rounded square with an "L" — see `SiteHeader.tsx`); make an SVG favicon that matches it.

**Done when:** the tab shows the icon in dev and in `pnpm build` + `pnpm start`, and the asset is original work (no third-party logo).

---

### 4. Show distribution availability on application cards ⚠️

| | |
| --- | --- |
| **Difficulty** | Intermediate |
| **Area** | `apps/web` |
| **Files** | `apps/web/src/components/applications/AppCard.tsx`, `AppCatalog.tsx`, `apps/web/src/App.tsx` |
| **Skills** | React, TypeScript |

A distribution is selected at the top of the page, but the cards below ignore it. The data to fix this already exists: each entry's `installation[].distros` says which distributions a source is verified for. Surface it — for example, a small badge when an application has a native package-manager source for the selected distribution, and a quieter note when it is only reachable via Flatpak/Snap/official download.

**Done when:** selecting a distribution visibly changes the cards, an application with no route at all for that distribution is clearly (and honestly) marked, and nothing implies installability that the catalog does not verify. ⚠️ Propose the wording and visual treatment in the issue first — how this is phrased is a product decision.

---

### 5. Persist the selection across reloads

| | |
| --- | --- |
| **Difficulty** | Intermediate |
| **Area** | `apps/web` |
| **Files** | `apps/web/src/App.tsx`, new hook in `apps/web/src/hooks/` |
| **Skills** | React hooks, `localStorage` |

Selected applications are lost on refresh. `useTheme.ts` already shows the pattern this codebase uses for `localStorage` (including the try/catch for private-browsing modes) — follow it.

**Done when:** a selection survives a reload, unknown ids from an older stored value are dropped rather than rendered, and a blocked or corrupt `localStorage` degrades to an empty selection instead of crashing.

---

### 6. Set up a test runner for `apps/web`

| | |
| --- | --- |
| **Difficulty** | Intermediate |
| **Area** | `apps/web`, tooling |
| **Files** | `apps/web/package.json`, new Vitest config, a first test file, `docs/development.md`, `CONTRIBUTING.md`, `.github/workflows/ci.yml` |
| **Skills** | Vitest (or your proposal), React Testing Library |

The web app has no tests and no runner. Vitest is the natural fit for a Vite project. Keep the setup minimal, add `pnpm --filter web test`, wire it into the root `test` script, and include at least one real test — the filtering logic in `AppCatalog.tsx` (search matches name, description, and category; the count line; the empty state) is the best starting target.

**Done when:** `pnpm test` from the root runs web tests too, CI stays green, and the docs no longer say `apps/web` has no tests.

---

### 7. Search by application id and alias

| | |
| --- | --- |
| **Difficulty** | Starter |
| **Area** | `apps/web` |
| **Files** | `apps/web/src/components/applications/AppCatalog.tsx` |
| **Skills** | React, TypeScript |

Search matches name, description, and category. Typing `vscode` does not find "Visual Studio Code", even though `vscode` is that entry's id. Including `app.id` in the match is a two-line change.

**Done when:** searching an id finds the application. Pairs well with #6 — add the test with it. (Proper aliases — `code`, `chrome` for Chromium — would need a new catalog field; that is a separate, larger discussion.)

---

### 8. Explain the inert "Continue" button — ✅ **already done**

| | |
| --- | --- |
| **Difficulty** | Starter |
| **Area** | `apps/web` |
| **Files** | `apps/web/src/components/selection/SelectionBar.tsx` |
| **Skills** | React, accessibility |

"Continue" is deliberately non-functional (command generation does not exist yet) and carries `aria-disabled="true"`, but nothing tells the user why. Add a tooltip or short helper text — the `Tooltip` primitive is already installed and the app is already wrapped in a `TooltipProvider`.

**Status: completed.** `SelectionBar.tsx` already wraps the button in a `Tooltip` reading "Command generation isn't part of Phase 1 yet." Left here for the record — pick a different issue. It will be removed when the button becomes real (backlog item H5).

---

### 9. A catalog statistics script

| | |
| --- | --- |
| **Difficulty** | Intermediate |
| **Area** | `packages/catalog`, docs |
| **Files** | new `packages/catalog/src/stats.ts` (or a `scripts/` file), `packages/catalog/package.json`, `docs/catalog.md` |
| **Skills** | TypeScript, Node |

The "Current contents" table in `docs/catalog.md` (apps per category, sources per method and origin, per-distribution coverage) is maintained by hand and drifts every time an entry is added. Add `pnpm --filter @configshell/catalog stats` that computes and prints it.

**Done when:** the script's output matches the table in the docs for the current data, and `docs/catalog.md` tells contributors to run it instead of counting by hand.

---

### 10. Accessibility pass on the catalog grid

| | |
| --- | --- |
| **Difficulty** | Intermediate |
| **Area** | `apps/web` |
| **Files** | `apps/web/src/components/applications/*`, `selection/*`, `distro/DistroSelector.tsx` |
| **Skills** | ARIA, keyboard navigation, screen readers |

The UI already does several things right (`aria-live` counts, labelled controls, `<label>`-wrapped Radix primitives). Audit it properly: tab order through filters → cards → selection summary, focus visibility in both themes, the mobile sheet's focus trap and restore, and announcements when the filtered count changes.

**Done when:** the issues found are listed in the pull request with what you changed for each, and the whole flow is usable with the keyboard alone. Report anything you find but do not fix — that is useful too.

---

### 11. Verify and fix the documented commands

| | |
| --- | --- |
| **Difficulty** | Starter |
| **Area** | docs |
| **Files** | `README.md`, `docs/*.md`, workspace READMEs, `CLAUDE.md` |
| **Skills** | patience, a terminal |

Every command in the docs was verified when written, but docs drift. On a **fresh clone**, run each documented command in order, from the directory the docs say, and record what actually happens.

**Done when:** each incorrect command is fixed (or the file it lives in gets an issue), and you say in the pull request which commands you ran and on which OS and Node version. Finding nothing wrong is a valid, reportable result.

---

### 12. Error boundary for the web app

| | |
| --- | --- |
| **Difficulty** | Intermediate |
| **Area** | `apps/web` |
| **Files** | `apps/web/src/main.tsx`, new `apps/web/src/components/ErrorBoundary.tsx` |
| **Skills** | React |

A render error currently leaves a blank page. Add a small error boundary around `<App />` that shows a readable message and a reload action, using the existing `Alert` primitive and theme tokens.

**Done when:** a deliberately thrown render error shows the fallback instead of a white screen, and the fallback works in both themes.

---

### 13. Document the AI Studio scaffolding ⚠️

| | |
| --- | --- |
| **Difficulty** | Starter |
| **Area** | `apps/web`, docs |
| **Files** | `apps/web/vite.config.ts`, `apps/web/metadata.json`, `apps/web/README.md` |
| **Skills** | reading configuration carefully |

`vite.config.ts` contains an `aistudioMediaPlugin` and a `DISABLE_HMR` switch from a Google AI Studio template, and `metadata.json` is an AI Studio manifest that declares a server-side Gemini capability the project does not implement. The directory the plugin serves from (`apps/web/public/assets/aistudio/`) is not in the repository — it is a local, self-ignored artifact. Work out what is still load-bearing, document it, and propose what can go.

**Done when:** a new contributor can tell from the docs what that code is for. ⚠️ Removing any of it needs maintainer agreement — the maintainers may still use that tooling.

---

### 14. Improve empty and edge states in the selection summary

| | |
| --- | --- |
| **Difficulty** | Starter |
| **Area** | `apps/web` |
| **Files** | `apps/web/src/components/selection/SelectionSummary.tsx`, `SelectionList.tsx` |
| **Skills** | React, UI copy |

Check how the summary behaves with zero, one, and ~30 selected applications, and with no distribution chosen. Fix whatever is awkward — cramped layout, missing scroll, copy that reads oddly in the singular.

**Done when:** all three states look deliberate on both a narrow phone viewport and a desktop one, with before/after screenshots in the pull request.

---

### 15. Add a category to the catalog ⚠️

| | |
| --- | --- |
| **Difficulty** | Involved |
| **Area** | `packages/catalog`, `apps/web` |
| **Files** | `packages/catalog/src/types.ts`, `applications.ts`, `apps/web/src/components/applications/AppCard.tsx`, `docs/catalog.md` |
| **Skills** | TypeScript |

The seven categories have no home for office, graphics, or gaming applications. Adding one means extending `Category` and `CATEGORIES`, adding a `CATEGORY_ICON` entry (a generic Lucide icon — never a brand logo), and adding enough verified applications that the category is not empty.

**Done when:** the new category is populated, the tests still assert every category has entries, and the docs are updated. ⚠️ Agree on the category name in an issue first.

---

### 16. Add a supported Linux distribution ⚠️

| | |
| --- | --- |
| **Difficulty** | Involved |
| **Area** | `packages/catalog`, `apps/web` |
| **Files** | `packages/catalog/src/types.ts`, `validate.ts`, `applications.ts`, `validate.test.ts`, `apps/web/src/components/environment/distros.ts`, `docs/catalog.md`, `README.md` |
| **Skills** | TypeScript, deep knowledge of the distribution's packaging |

Linux Mint, openSUSE, and Pop!_OS are plausible candidates. The step-by-step process is in [`docs/catalog.md`](../docs/catalog.md#how-to-add-a-linux-distribution). Note that this makes **every existing entry's coverage a question** — that research is the bulk of the work.

**Done when:** the distribution is selectable, validation knows which package manager it uses, and its sources are verified rather than assumed. ⚠️ Discuss in an issue first; a partial, honest rollout is better than a guessed complete one.

---

## Not a good first issue

The installer resolver, terminal command generation, the AI layer, the MCP server, and the
local agent. They are either load-bearing for the project's security model or unstarted
design work — see [`ROADMAP.md`](../docs/ROADMAP.md) and the documents in `docs/`. Interest is
welcome; start with an issue, not a pull request.
