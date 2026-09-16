# `@configshell/installer`

The deterministic core: **resolution → setup plan → commands**.

Given a selection of catalog applications and an environment, this package decides which
installation source to use, builds an ordered plan, and renders the exact commands a user
will run themselves. It is pure — no I/O, no filesystem, no network, no execution.

```
resolve()      (application, environment)  →  which source, and why
buildPlan()    (resolutions, environment)  →  ordered steps, as DATA
renderPlan()   (plan)                      →  command strings
```

## Why the three stages are separate

The split is the security model, not tidiness. `renderPlan` is the only code in the
repository that knows `apt` means `apt-get install`. Everything before it is structured
data that cannot contain a shell fragment, which keeps the dangerous step small enough to
test exhaustively — and lets a future CLI or MCP server reuse resolution and planning
without inheriting command generation.

It is also why this lives in a package rather than in `apps/web` or `apps/server`. Both are
consumers; neither owns the logic.

## Guarantees, each covered by a test

- **Deterministic.** The same (selection, environment, catalog) always produces byte-for-byte
  the same plan and the same commands.
- **Nothing is invented.** Every package identifier in a generated command comes from the
  catalog. There is no code path that interpolates caller-supplied text.
- **Identifiers are re-validated immediately before interpolation**, against a strict
  pattern, even though the catalog validator already checked them. A value that fails
  throws — it is never quoted and used anyway.
- **No application is silently dropped.** Every selected application ends up resolved,
  manual, or unavailable, each with an explanation.
- **Privilege is derived from the install method**, never from scanning a command for
  `sudo`.
- **Nothing executes.** Running the commands is the user's own act in their own terminal.

## Trust policy

PRD §22's hierarchy, encoded in `policy.ts` and tested rule by rule:

| Rank | Source | Example |
| ---- | ------ | ------- |
| 0 | The distribution's own repositories | `apt install git` on Ubuntu |
| 1 | Flathub, published by the application vendor | `org.mozilla.firefox` |
| 2 | Snap Store, published by the application vendor | `vlc` |
| 3–4 | Flathub / Snap Store, published by the distribution's vendor | Canonical's `chromium` |
| 5–6 | Flathub / Snap Store, third-party repackaging | `com.google.Chrome` |
| — | **Excluded:** needs a third-party repository added first | Google's apt repo |
| — | **Excluded:** vendor download only | Cursor |

Flatpak outranks Snap within a tier because ConfigShell installs Flatpaks with `--user`,
which needs no root at all.

Excluded sources are not hidden: they appear in the resolution's `considered` list with the
reason they were rejected, and an application whose *only* routes are excluded becomes a
**manual step** with a link to the vendor's instructions — never a command that would fail
on a clean system.

### Vendor repositories are provisional

Skipping sources that require third-party repository setup is a recorded, temporary
decision (`docs/TechnicalAudit.md` §9, Q1). `requiresRepositorySetup()` is the single
place that decides what counts, so generating repository-setup steps later is a change to
that function and the plan model — not to the resolver's shape.

## Verification

Verification commands come from one fixed template — `command -v <binary>` — using the
catalog's `verify.binary` field. The catalog deliberately has no field that could carry a
check *command*: that is exactly the field through which arbitrary strings would reach a
shell.

Only routes that put a binary on `PATH` are verified. Flatpak installs are not, because
they do not.

## Usage

```ts
import { APPLICATIONS, createEnvironment, findApplication } from '@configshell/catalog';
import { buildPlan, renderPlan, resolveAll } from '@configshell/installer';

const environment = createEnvironment('Ubuntu');
const selection = ['git', 'htop'].map((id) => findApplication(id)!);

const plan = buildPlan(resolveAll(selection, environment), environment);
const { commands, manualSteps, unavailable } = renderPlan(plan);
```

## Commands

```sh
pnpm --filter @configshell/installer test        # 44 tests
pnpm --filter @configshell/installer typecheck
```

TypeScript source, no build step — the same arrangement as `packages/catalog`.
