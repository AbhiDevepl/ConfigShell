# AI planning layer

## Status: not started

Nothing in this repository implements AI functionality. There is no model client, no
prompt, no API key handling, no AI dependency — and no package. An empty `packages/ai`
workspace reserved the name for a while and was removed: it implemented nothing while
costing a lockfile importer and a line in every Dockerfile's build context. No empty
controller or route pretends otherwise either. This document is the design; the code does
not exist yet.

This document records the constraints an implementation must satisfy, so that the first
pull request in this area starts from the project's rules rather than from scratch. It
describes **intent**, not behaviour that exists.

## The one rule

**AI plans; it never executes.**

The AI layer may read the catalog, read a description of the user's system, and produce a
*proposal*. It never acquires the ability to run a command, and no code path may exist
that hands model output to a shell. Every planned operation flows through exactly the same
validation and explicit user confirmation as a manually chosen one — being AI-generated
grants no shortcut.

## Intended responsibilities

- Software discovery and recommendation from natural-language requests.
- Compatibility reasoning ("will this work on my system?").
- Drafting an installation plan out of catalog entries.
- Explaining trade-offs between installation sources (distro vs. vendor vs. community).

## Constraints for any implementation

1. **Output must be structured and validated.** Model output is untrusted input. It must
   be parsed into a known shape and rejected on failure — never passed through.
2. **Plans reference catalog entries by id.** The model may only select from
   `@configshell/catalog`; it may not invent an application, a package identifier,
   or a URL. Anything that does not resolve against the trusted catalog is rejected.
3. **No command strings anywhere.** The AI layer must not produce, and must not be asked
   to produce, shell commands, flags, or arguments. Turning a plan into a command is the
   resolver's job, from trusted data only.
4. **No secrets in the browser.** If a hosted model is ever used, the key lives
   server-side. A provider key must never reach `apps/web`'s bundle or `import.meta.env`.
5. **Provider-agnostic by default.** Keep the model client behind a narrow interface in
   the AI package so a provider swap does not reach into the UI.
6. **Cost and failure are normal.** The product must remain fully usable with the AI layer
   unavailable, disabled, or erroring. AI is additive, never load-bearing for discovery.

## Where it would live

A `packages/ai` workspace consumed by the server (not directly by the browser, which must
never hold provider credentials) — created when there is code for it, together with its
`ai → installer` forbidden-edge rule in `packages/test-utils/src/architecture.test.ts`. The
UI would render plans it receives; it would not talk to a model itself.

## Before you start

This is post-V1 work, after installer resolution and command generation land (see
[`ROADMAP.md`](ROADMAP.md)). Open an issue describing the boundary you intend to
implement before writing code — a design conversation is expected here, and a large
unsolicited AI pull request is likely to be declined on architectural grounds rather than
on quality.

Related: [`architecture.md`](architecture.md), [`security-model.md`](security-model.md),
[`mcp.md`](mcp.md).
