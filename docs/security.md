# Security model

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

## Current state (Phase 1)

There is currently nothing to exploit in the sense these principles guard against: the web
app (`apps/web`) is a static-content React SPA with no backend calls, no command
generation, and no execution of any kind. Distribution and application selection only
update in-memory UI state. The Express server scaffold (`apps/server`) has no live
endpoints (and currently fails to start at all — see `docs/architecture.md`), so there is
no server-side attack surface yet either.

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
