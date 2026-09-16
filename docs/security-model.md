# Security model

This document describes how the product is designed to be safe. **To report a
vulnerability, see [`SECURITY.md`](SECURITY.md) at the repository root** — do not open a
public issue for a suspected vulnerability.

## Non-negotiable principles

These hold at every phase, not just once the local agent or AI exist:

- The web application never executes shell commands.
- No remote sudo — privileged operations are never exposed over a remote interface.
- No unrestricted command execution — all operations are scoped and validated.
- AI cannot directly control the operating system. AI plans and recommends; it never
  executes.
- Installation requests must be validated before execution.
- Applications must resolve against the trusted catalog — untrusted manifests are never
  installed.
- System-changing operations require explicit user confirmation. Nothing changes the
  system silently.
- Privileged operations belong in the local agent — it is the only component allowed to
  perform system changes.
- Security-sensitive operations should be logged and auditable.

## Current state (Phase 2)

There is currently nothing to exploit in the sense these principles guard against: the web
app (`apps/web`) is a static-content React SPA with no backend calls, no command
generation, and no execution of any kind. Distribution and application selection only
update in-memory UI state. The Express server scaffold (`apps/server`) starts a process
that registers no routes and no middleware — it has no live endpoints, so there is no
server-side attack surface yet either.

### The catalog as trusted data

Phase 2 introduced `packages/catalog`, which is the "trusted catalog" the principles above
refer to. Its security-relevant properties:

- **It is inert data, not instructions.** Entries record *identifiers* (`docker-ce`,
  `org.gimp.GIMP`) and *method names* (`apt`, `flatpak`) — never commands, flags, argument
  strings, or shell fragments. There is no field a command could hide in, and nothing in
  the repository concatenates one. A grep of the production bundle for `sudo` and for
  `apt install` / `dnf install` / `pacman -S` / `flatpak install` / `snap install` returns
  zero matches.
- **It is compiled in, not fetched.** The catalog is a TypeScript module bundled at build
  time. It is not loaded from a network endpoint at runtime, so there is no catalog-fetch
  path to poison, intercept, or spoof.
- **It is validated deterministically.** `validateCatalog` (dependency-free, in
  `packages/catalog/src/validate.ts`) enforces unique ids, known categories, known
  installation methods, known distributions, non-empty identifiers, no duplicate
  `(method, identifier)` pairs, `https`-only URLs, and that a package manager is never
  paired with a distribution that does not use it. The test suite asserts the real catalog
  passes with zero errors, so a malformed or nonsensical entry fails CI rather than
  reaching a future resolver.
- **Provenance is recorded rather than flattened.** Each source carries
  `origin: 'distro' | 'vendor' | 'community'`. Community repackagings on Flathub and the
  Snap Store — including ones with official-looking reverse-DNS IDs such as
  `com.google.Chrome` — are labelled as such instead of being presented as vendor-official.
  This is a supply-chain distinction, and later phases are expected to surface or prefer on
  it. Phase 2 records it; it does not yet act on it.
- **Unverified means absent.** Identifiers that could not be confirmed against an
  authoritative source were omitted rather than guessed, and vendor shell-script installers
  (`curl … | sh`) are deliberately not represented at all — the project does not ship
  arbitrary script URLs. See `docs/catalog.md`.

The trust boundary to keep in mind going forward: catalog data is *curated input to a
future resolver*, and it must never become a mechanism through which arbitrary strings
reach a shell. Any future field that carries command-shaped content would break that and
should be rejected in review.

The one thing worth calling out even at this stage: `apps/web/src/hooks/useLinuxDetection.ts`
reads only `navigator.userAgent` / `navigator.userAgentData` / `navigator.platform` — no
other browser or system APIs — and only to answer "does this look like Linux," never to
identify an exact distribution. See `docs/architecture.md` and the README's "Important
distro detection rule" for why exact detection is out of scope for the browser entirely.

## Planned, by phase

- **Terminal command generation** (a later V1 phase): commands must be generated only from
  trusted, structured catalog data (see `docs/catalog.md`) — never assembled from arbitrary
  user input. The user must see the full command before copying it; the browser never runs
  it.
- **Local agent** (post-V1): the security boundary for any actual system change. Validates
  every operation against the trusted catalog and requires explicit user confirmation
  before executing anything.
- **MCP** (post-V1): exposes only controlled, explicitly authorized capabilities to AI
  systems — never raw shell access.
- **AI / planning** (post-V1): plans and recommends; every planned operation still flows
  through the same validation and confirmation path as a manual one.

Nothing in this "Planned" section is implemented yet. This file will be updated as each
piece is actually built, not in advance of it.
