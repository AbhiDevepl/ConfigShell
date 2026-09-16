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

## Current state

The web app (`apps/web`) is a React SPA that generates no commands of its own: it displays
what the API returns. It calls only ConfigShell's own API, and a test asserts the
package-manager vocabulary appears nowhere in its source, so the browser never holds the
means to build a command even if something else went wrong.

Three things have changed since this project shipped only a catalog, and all are
security-relevant.

**Commands now exist.** `packages/installer` generates real package-manager command strings.
Nothing executes them — they are text a user reads and pastes into their own terminal — but
the repository now contains the code that turns catalog data into something a shell will
interpret, so the "arbitrary strings reach a shell" risk is live rather than hypothetical.
See "Command generation" below for how it is contained.

**The API server has endpoints.** `apps/server` serves a read-only planning API. It accepts
untrusted input (`POST /api/plan`), which is a real attack surface. See "The API server"
below.

**An MCP server exists.** `packages/mcp` accepts untrusted tool arguments from whatever
client launched it — the interface most likely to be driven by something that is not a
person. See "The MCP interface" below.

### Command generation

The dangerous step is deliberately small, and everything about the design is aimed at
keeping it that way.

- **One function knows what a command looks like.** `renderPlan` in
  `packages/installer/src/commands.ts` is the only code in the repository that knows `apt`
  means `apt-get install`. Resolution and planning before it produce structured data; a test
  asserts a generated plan contains no command text at all.
- **Fixed vocabulary, no templating.** Each method has one hard-coded command form. There is
  no template a caller can influence, and no pass-through of user-supplied flags or
  arguments — no such parameter exists anywhere in the chain.
- **Identifiers are re-validated immediately before interpolation**, against
  `/^[A-Za-z0-9][A-Za-z0-9._+-]*$/`, even though the catalog validator already checked them.
  Command generation does not trust its callers. A value that fails **throws**; it is never
  quoted and used anyway.
- **Asserted, not assumed.** A test renders every application on every supported
  distribution and asserts that no resulting command contains a shell metacharacter. Another
  feeds a deliberately hostile catalog entry (`evil; curl … | sh`) through the whole chain
  and asserts it throws rather than emitting a command.
- **Privilege is derived from the install method**, never from scanning a command for
  `sudo` — a property that must not depend on the formatting of the thing it guards.
- **No auto-confirm flags.** Generated commands carry no `-y` or `--noconfirm`, so the
  package manager asks before it changes anything. ConfigShell's plan review is one
  confirmation; this is a second, and it costs nothing.
- **No repository setup.** ConfigShell adds no apt sources file, no signing key and no
  Flatpak remote. Sources requiring a third-party repository are skipped in favour of the
  vendor's own instructions — which also means a generated command never fails on a clean
  system.

### The API server

`apps/server` **plans and validates; it never executes.** There is no `child_process` import
in the workspace, and an integration test walks every source file to assert there never is
one. This is a permanent boundary, not a sequencing decision: a server that ran
package-manager commands on a user's behalf would be remote sudo, which the principles above
rule out. Execution belongs to a local agent on the user's own machine, with local
re-validation and per-step confirmation (`docs/agent.md`).

The untrusted-input surface is deliberately tiny. A caller supplies **catalog ids and a
distribution name, and nothing else** — there is no field for a package name, a command, a
flag, a URL or a repository, so no request body can introduce one. Ids are checked for shape
*and* existence, and an unknown id refuses the whole request rather than being silently
skipped. The package ecosystem is always *derived* from the distribution, never accepted, so
a caller cannot pair "Arch Linux" with "apt". Bodies are capped at 16 kB and selections at
200 ids. Error responses carry a closed set of codes and never a stack trace or a filesystem
path — also asserted by test.

The server holds no secrets, has no database and no authentication, because nothing it does
needs any of them.

### The MCP interface

`packages/mcp` is the interface most likely to be driven by something that is not a person —
an AI host, a script, an agent. That makes **"there is no tool for it"** the load-bearing
guarantee rather than any runtime check, and it is asserted by test:

- **No tool takes an argument for a package name, a command, a flag, a URL or a repository.**
  A caller supplies catalog ids and a distribution name. Nothing else can reach command
  generation because nothing else is read. A test walks the registered schemas and fails if
  such a field ever appears.
- **Schemas are strict.** An unrecognised argument is rejected rather than ignored, so a host
  that invents a `command` field is told so instead of receiving a plan that silently dropped
  it. The SDK validates arguments against the declared schema before a handler runs; business
  rules a schema cannot express — does this id exist in the catalog? — are checked after.
- **The package ecosystem is derived from the distribution, never accepted**, so a caller
  cannot pair "Arch Linux" with "apt" to steer command generation.
- **`detect_system`, `check_installed` and `execute_setup` are not registered at all** — not
  as stubs that fail. They require the local agent, and a tool that always errors is still a
  tool a caller must discover and handle. Tests assert none of them is exposed or
  discoverable over the protocol.
- **No `child_process`, no `eval`, no filesystem read, no socket** anywhere in the package,
  asserted structurally over the source.
- **The package-manager vocabulary does not appear in the package.** Command text comes only
  from `@configshell/installer`, so the MCP layer cannot fork command generation and quietly
  disagree with the web app about what a user should run.
- Every tool is **read-only and deterministic**, and says so in the protocol's own vocabulary
  via tool annotations (`readOnlyHint`, `openWorldHint: false`) where a host will actually
  read it.

`validate_setup` is the one tool that accepts command text, and only to **compare** it against
catalog-derived output. It never executes or re-emits it, and its result says explicitly that
a pass is not an authorisation — whatever eventually executes must re-validate against the
catalog itself and ask the user (`docs/agent.md` rule 2).

The protocol layer is the **official MCP TypeScript SDK**, not hand-written. That is a
security property as much as a maintenance one: framing, version negotiation and schema
validation are handled by the implementation the specification's authors maintain, rather than
by code here that would silently drift from the spec.

The transport is **stdio only**: launched by the client that uses it, so there is no listening
port, no authentication story and no remote attack surface. Diagnostics go to stderr; stdout
carries protocol messages alone.

Authorization is therefore absent, and correctly so for a local subprocess. It becomes a real
requirement the moment either a remote transport or a non-read-only tool arrives — and since
anything that could change a system belongs to the agent, those two questions arrive together.

### The catalog as trusted data

`packages/catalog` is the "trusted catalog" the principles above refer to. Its security-relevant properties:

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
  This is a supply-chain distinction, and the resolver now **acts** on it: `origin` drives
  the source-preference order, and for `apt`/`dnf`/`pacman` it determines whether a source
  is usable at all. A resolution records which source won, why, and what was rejected, so
  the choice is auditable rather than implicit.
- **Unverified means absent.** Identifiers that could not be confirmed against an
  authoritative source were omitted rather than guessed, and vendor shell-script installers
  (`curl … | sh`) are deliberately not represented at all — the project does not ship
  arbitrary script URLs. See `docs/catalog.md`.

The trust boundary, now that the resolver exists: catalog data is *curated input to command
generation*, and it must never become a mechanism through which arbitrary strings reach a
shell. Any future field carrying command-shaped content breaks that and should be rejected
in review.

The `verify.binary` field added for installation verification is the closest thing to an
exception, and shows the shape such a field must take: it is a binary **name**, not a check
**command**; it is validated against a strict pattern at the data boundary; and it is only
ever substituted into one fixed template (`command -v <binary>`). A free-text "verification
command" field would have been the obvious design and exactly the wrong one.

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
- **Remote MCP and authorization** (post-V1): the tool surface is built and read-only over
  stdio (see "The MCP interface" above). A remotely hosted server would need sessions, origin
  validation and per-capability authorization. Anything that could lead to a system change
  waits for the agent.
- **AI / planning** (post-V1): plans and recommends; every planned operation still flows
  through the same validation and confirmation path as a manual one.

Nothing in this "Planned" section is implemented yet. This file will be updated as each
piece is actually built, not in advance of it.
