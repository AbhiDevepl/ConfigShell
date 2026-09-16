# Application catalog

## Status

**Implemented (Phase 2).** The catalog is a real, verified, structured dataset living in
`packages/catalog`. It replaced the Phase 1 UI fixture (`apps/web/src/data/mockCatalog.ts`),
which has been deleted — there is exactly one authoritative catalog, and the web app reads
from it rather than owning any application data of its own.

What is **not** implemented: the installer resolver, terminal command generation, and
anything that installs software. The catalog holds the structured metadata those later
phases will consume; it does not act on it. See "Deliberate non-goals" below.

## Location and consumption

```
packages/catalog          ← the catalog (single source of truth)
  src/types.ts            ← data model
  src/applications.ts     ← the verified entries
  src/validate.ts         ← integrity checks
  src/validate.test.ts    ← tests for the checks and the real data
  src/index.ts            ← public API
```

The package is published to the workspace as `@configshell/catalog` and consumed by
`apps/web` through a `workspace:*` dependency. It is TypeScript source with no build step:
`main`/`types`/`exports` point directly at `src/index.ts`, and Vite and `tsc` both resolve
it through the pnpm workspace symlink. That keeps the smallest correct setup — no `dist/`,
no bundler config, no Turborepo pipeline needed just to read a list of applications.

Consumers import only from the package root:

```ts
import { APPLICATIONS, CATEGORIES, type Application } from '@configshell/catalog';
```

## Schema

```ts
interface Application {
  id: string;            // stable lowercase slug; UI selection state is keyed on it
  name: string;
  description: string;   // one line; what it is, never an installability claim
  category: Category;
  homepage: string;      // official project/vendor URL (https)
  installation: readonly InstallationSource[];
  verify?: Verification;  // how to check it afterwards — optional; see below
}

interface Verification {
  binary: string;        // the command the package puts on PATH: 'git', 'nvim', 'code'
}

interface InstallationSource {
  method: InstallMethod;        // 'apt' | 'dnf' | 'pacman' | 'flatpak' | 'snap' | 'official'
  identifier: string;           // package name, Flatpak app ID, or Snap name
  origin: RepositoryOrigin;     // 'distro' | 'vendor' | 'community'
  distros?: readonly Distro[];  // required for apt/dnf/pacman/zypper, forbidden otherwise
  url?: string;                 // where to get it / repo setup docs
}
```

Fields from the original planned shape that are deliberately **not** implemented yet:
`icon` (see "Icons") and any version field (see "Version policy"). They were left out
rather than stubbed, because an empty field that looks meaningful is worse than an absent
one.

### `origin` — who actually packages it

This field exists because presence on Flathub or the Snap Store proves the identifier is
real, not that the application's vendor stands behind it. Several official-looking
reverse-DNS Flatpak IDs (`com.google.Chrome`, `com.brave.Browser`, `com.slack.Slack`,
`dev.zed.Zed`) are third-party repackagings that Flathub itself marks unverified. A catalog
that is meant to be *trusted* should not flatten that away.

| origin      | meaning                                                                           |
| ----------- | --------------------------------------------------------------------------------- |
| `distro`    | ships in a supported distribution's own repositories, or is published by that distribution's vendor (e.g. Canonical's Chromium snap) |
| `vendor`    | published by the application's own project/vendor (their apt/dnf repo, their official Flatpak/Snap) |
| `community` | packaged by a third party                                                          |

**`origin` is now acted on.** `packages/installer` ranks sources by it (PRD §22), and for
`apt`/`dnf`/`pacman` it decides whether a source is usable at all — see "What consumes this
catalog" below. Getting it wrong changes what a user is told to run.

### `distros` — support is explicit, never assumed

`distros` is required on `apt`/`dnf`/`pacman` and forbidden on `flatpak`/`snap`/`official`
(which are distribution-agnostic by design). An application is **not** assumed to work
everywhere just because it runs on Linux. Real consequences of that rule in the current
data:

- **VLC has no `dnf` entry** — it is not in Fedora's own repositories (codec licensing);
  RPM Fusion is a third-party repo and does not qualify.
- **Chrome, Brave, Cursor, Sublime Text, Postman, Slack and Zoom have no `pacman` entry** —
  they are AUR-only, and the AUR is not an official Arch repository.
- **Ubuntu is absent from Firefox's and Chromium's `distro` apt entries** — on current
  Ubuntu those archive packages are transitional stubs that install the snap, not real debs.
  Firefox is instead reachable on Ubuntu via Mozilla's own apt repo (`origin: 'vendor'`).
- **Cursor, Postman and Zoom have no package-manager route at all** on any supported
  distribution, and are reachable only through Flatpak/Snap/official download.

One method may carry several sources when genuinely different routes exist — Docker lists
both `docker-ce` (Docker's own repo, `vendor`) and `docker.io` (the distro-maintained
build, `distro`). Uniqueness is enforced per `(method, identifier)`, not per method.

## Categories

The seven established categories are unchanged from Phase 1: **Browsers**, **Code
Editors**, **CLI Tools**, **Development**, **Utilities**, **Media**, **Communication**.
Every application belongs to exactly one. No new categories were added.

## Supported distributions

**Ubuntu**, **Debian**, **Fedora**, **Arch Linux**. The `Distro` union lives in this
package and `apps/web/src/data/distros.ts` imports it, so the selector in the UI cannot
drift from what catalog entries can declare support for.

## Version policy

**The catalog never records application version numbers.** No `Firefox 123.4`, no
`VS Code 1.99`. Entries record *which package identifier or source to use*; the package
manager or the vendor's own updater owns versions and updates. This is a project rule, not
a Phase 2 convenience — a hand-maintained version field would be stale the week after it
was written and would turn the catalog into a mirror of five package archives.

## Verification requirements

Every identifier in the catalog was checked against an authoritative source, in this
preference order:

1. Official application documentation
2. The distribution's own package database — packages.ubuntu.com,
   packages.fedoraproject.org, archlinux.org/packages
3. The application's Flathub page
4. The application's Snap Store page

Rules that govern additions:

- **Never invent an identifier or a URL.** If it cannot be confirmed, it does not go in.
- **Absence means "not verified", never "not available."** Omitting a method is always the
  correct fallback; guessing never is.
- **The AUR does not count as `pacman`.** Only Arch's official core/extra/multilib repos do.
- **Third-party community repos (RPM Fusion, random PPAs, `deb.griffo.io`) do not count**
  as distro or vendor sources.
- **No shell-script installers.** Vendor install scripts piped to a shell (Zed's
  `curl … | sh`, for example) are deliberately not represented — the project does not
  distribute arbitrary script URLs.
- **Record provenance honestly** via `origin` rather than presenting a community
  repackaging as vendor-official.

### `verify` — how to check the install worked

A **closed shape with exactly one field**, deliberately. It is a binary *name*, never a
check *command*: a free-text command field would be precisely the route by which arbitrary
strings reach a shell, which the security model forbids. Verification commands are built
from one fixed template — `command -v <binary>` — and nothing else.

Two rules:

1. **The same "verified or omitted" discipline as identifiers.** If the binary name differs
   between distributions, omit it. `chromium` is the worked example: Debian and Ubuntu ship
   `chromium`, Fedora ships `chromium-browser`, so the entry carries no `verify` at all.
2. **Omit it when there is no route that puts a binary on `PATH`.** Flatpak applications are
   launched with `flatpak run <id>`, and vendor downloads vary. A test enforces this: an
   entry whose only sources are `flatpak` or `official` must not claim a binary.

Absence means "no binary name has been verified", not "unverifiable" — the same meaning
absence has everywhere else in this catalog. 26 of the 31 entries carry one; `chromium`,
`cursor`, `zed`, `postman` and `zoom` deliberately do not.

The validator rejects anything that is not a plain executable name (`/^[A-Za-z0-9][A-Za-z0-9._+-]*$/`),
and command generation re-checks it before interpolating.

## Icons

Not implemented. No icon field exists. The web app renders a generic per-category Lucide
icon as a safe placeholder, which avoids scraping logos, hotlinking untrusted remote
images, making the UI depend on external image hosting, or taking on third-party
trademark/licensing questions. Verified icon assets are future work and did not block the
catalog.

## Validation

`validateCatalog(applications)` returns an array of human-readable problems (empty means
valid) rather than throwing on the first one, so a bad entry cannot hide the entries after
it. `assertValidCatalog` is the throwing wrapper. Checks:

**Identity** — id is a lowercase slug; ids unique; names unique; name and description
non-empty; category is one of the seven.

**Sources** — homepage is a well-formed `https` URL with a dotted host; any source `url` is
likewise.

**Installation metadata** — no empty identifiers; no duplicate `(method, identifier)` pair
within an application; method is one of the six; origin is one of the three; `apt`/`dnf`/
`pacman` must list the distros they are verified for; `flatpak`/`snap`/`official` must not
list distros; a package manager cannot be paired with a distribution that does not use it
(no "dnf on Arch Linux"). The distro↔package-manager mapping lives in one place,
`ECOSYSTEM_DISTROS` in `types.ts`, which the validator reuses rather than copying.

**Verification** — `verify.binary`, when present, must be a plain executable name matching
`/^[A-Za-z0-9][A-Za-z0-9._+-]*$/`. Anything containing a space, a quote, `;`, `$`, a
backtick or a leading `-` is rejected here, at the data boundary, because this value is
interpolated into a generated command. Command generation re-checks it anyway.

Run it with `pnpm --filter @configshell/catalog test` (Node's built-in test runner via
`tsx`). The suite covers each rule above against synthetic entries *and* asserts the real
catalog is valid, non-trivial, that every category is populated, and that no entry claims a
binary it could not put on `PATH`.

## Current contents

**31 applications**, **116 verified installation sources**, **26 with a verified binary name**.

**openSUSE coverage is the open gap.** 23 of 31 applications already resolve there through
Flatpak or Snap, which are distribution-agnostic. The seven that do not — `git`, `curl`,
`htop`, `github-cli`, `gnome-tweaks`, `timeshift`, `gparted` — need a verified `zypper`
identifier each. That is a good first contribution: one line of data, checked against
`software.opensuse.org`, following the same "verified or omitted" rule as every other
identifier.

| Category      | Apps |     | Method    | Sources |     | Origin      | Sources |
| ------------- | ---- | --- | --------- | ------- | --- | ----------- | ------- |
| Browsers      | 4    |     | `apt`     | 28      |     | `distro`    | 58      |
| Code Editors  | 4    |     | `dnf`     | 22      |     | `vendor`    | 36      |
| CLI Tools     | 6    |     | `pacman`  | 23      |     | `community` | 22      |
| Development   | 4    |     | `flatpak` | 21      |     |             |         |
| Utilities     | 4    |     | `snap`    | 20      |     |             |         |
| Media         | 4    |     | `official`| 2       |     |             |         |
| Communication | 5    |     |           |         |     |             |         |

Native package-manager coverage (i.e. excluding Flatpak/Snap/official): 25/31 on Ubuntu,
25/31 on Debian, 22/31 on Fedora, 23/31 on Arch Linux.

The list is intentionally small. 31 verified entries are worth more than hundreds of
half-checked ones, and every future addition carries the same verification cost.

## How to add an application

This is the most accessible way to contribute to the project, and the most rule-bound.
Budget most of the effort for verification, not for typing.

1. **Check it is not already there.** Search `packages/catalog/src/applications.ts` for the
   name and for plausible ids.
2. **Pick the id.** A stable lowercase slug (`^[a-z0-9]+(-[a-z0-9]+)*$`), e.g.
   `google-chrome`. UI selection state is keyed on it, so treat it as permanent.
3. **Verify every installation source** against an authoritative source, in this order of
   preference: official documentation → the distribution's own package database
   (packages.ubuntu.com, packages.fedoraproject.org, archlinux.org/packages) → the Flathub
   page → the Snap Store page. Record only what you actually confirmed.
4. **Write the entry** in the block for its category, keeping the file's existing ordering
   and formatting:

   ```ts
   {
     id: 'example-app',
     name: 'Example App',
     description: 'One line describing what it is.',
     category: 'Utilities',
     homepage: 'https://example.com/',
     installation: [
       { method: 'apt', identifier: 'example-app', origin: 'distro', distros: ['Ubuntu', 'Debian'] },
       { method: 'flatpak', identifier: 'com.example.App', origin: 'vendor' },
     ],
   },
   ```

5. **Run the checks:**

   ```sh
   pnpm --filter @configshell/catalog test
   pnpm --filter @configshell/catalog typecheck
   ```

6. **Update the counts** in the "Current contents" table above if they have moved.
7. **In the pull request, list your sources** — one link per installation source. A pull
   request without them cannot be reviewed and will be asked for them.

Rules the reviewer will apply (see "Verification requirements" above): never invent an
identifier or URL; absence means "not verified", never "not available"; the AUR is not
`pacman`; no version numbers; no commands, flags, or shell fragments in any field; record
`origin` honestly.

## How to add a Linux distribution

Adding a distribution is a larger change than it looks, because *every existing entry's
coverage becomes a question*. Open an issue and agree on the approach before starting.

The mechanical steps:

1. **`packages/catalog/src/types.ts`** — add the name to the `Distro` union and to the
   `DISTROS` array.
2. **`packages/catalog/src/validate.ts`** — add it to `METHOD_DISTROS` under the package
   manager it actually uses (e.g. an apt-based distribution goes under `apt`). This is what
   stops entries like "dnf on Arch Linux"; a new distribution missing from this map means
   no package-manager source can ever claim it.
3. **A new package manager?** If the distribution does not use apt/dnf/pacman/zypper, also add the
   method to `InstallMethod` and `INSTALL_METHODS` in `types.ts`, and to `METHOD_DISTROS`.
4. **`packages/catalog/src/applications.ts`** — verify and add sources for the new
   distribution. Partial coverage is acceptable and honest; guessing is not.
5. **`apps/web/src/data/distros.ts`** — add the one-line selector description. The `Distro`
   type is imported from the catalog, so the selector cannot drift from the data.
6. **`packages/catalog/src/validate.test.ts`** — extend the tests if you added a method or
   a new validation rule.
7. **Docs** — update the "Supported distributions" section above, the counts table, and the
   distribution list in the README.

Run `pnpm check` from the repository root before opening the pull request.

## What consumes this catalog

`packages/installer` turns an entry plus an environment into a chosen installation source, a
setup plan and a command. Two consequences for anyone editing catalog data:

- **`origin` is now load-bearing.** It decides which source wins (PRD §22's trust hierarchy)
  and, for `apt`/`dnf`/`pacman`, whether a source is usable at all: a package-manager source
  with `origin: 'vendor'` means "in the vendor's own repository", which ConfigShell will not
  add. Those sources are skipped and the user is pointed at the vendor's instructions
  instead — so getting `origin` wrong now changes what a user is told to run, not just what
  a badge says.
- **Adding a `url` to a vendor source matters.** It becomes the link a user follows when
  there is no generated command. `google-chrome`'s `apt` and `dnf` sources currently have
  none, which is worth fixing.

Skipping vendor-repository sources is **provisional** — see `docs/TechnicalAudit.md` §9 (Q1).

## Deliberate non-goals for this phase

Not implemented, by design: the installer resolver, terminal command generation,
clipboard install commands, any execution of any kind, a backend or database behind the
catalog, and icon assets. The catalog is inert, descriptive data — see `docs/security-model.md`
for why that matters and what guards it.
