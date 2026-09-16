# Local Linux agent

## Status: not started

No agent exists. There is no agent package, no daemon, no IPC, and no code anywhere in this
repository that touches the operating system. Nothing here installs software today.

This document records what the agent is *for* and the rules it would have to follow,
because those rules constrain the layers being built now.

## Purpose

The local agent is the **security boundary for operating-system changes**. It is the only
component that would ever be allowed to change a system, and it runs on the user's own
machine — never remotely, never as a hosted service acting on someone's computer.

Everything upstream of it (the web app, the catalog, a future AI or MCP layer) produces
*proposals*. The agent is what turns a proposal into an action, and only after validating
it and asking the user.

## Intended responsibilities

Detection (read-only):

- Linux distribution and version
- CPU architecture
- Desktop environment
- Available package managers
- Already-installed applications
- Whether a package is actually available

Execution (privileged, gated):

- Validate an installation plan against the trusted catalog
- Present exactly what will happen, in full
- Execute only explicitly approved operations
- Log what it did

## Rules for any implementation

1. **No remote sudo, no remote control.** The agent must never accept instructions from a
   remote origin that lead to a privileged operation without local, explicit,
   per-operation user confirmation.
2. **Re-validate everything.** A plan arriving from the web app, from AI, or from MCP is
   untrusted input. The agent validates it against the trusted catalog itself; upstream
   validation is not evidence.
3. **No arbitrary strings reach a shell.** Commands are constructed from a fixed vocabulary
   of package managers and validated identifiers — never concatenated from input.
4. **Least privilege.** Privileged work is the narrowest possible step, not a long-lived
   root process.
5. **Auditable.** Every system-changing operation is logged with what was run and what
   approved it.
6. **Refusable and reversible.** The user can decline any step, and declining is a normal
   outcome rather than an error state.

## Relationship to the browser

The browser never talks to the operating system, and the agent is not a way around that.
True distribution detection is an agent capability precisely because the browser cannot do
it honestly — see the note on distro detection in the
[README](../README.md#important-distro-detection-rule).

## Before you start

This is the last planned layer (see [`ROADMAP.md`](ROADMAP.md)) and the highest-risk one
in the project. It is not a good first contribution, and it will not be merged without a
design discussion in an issue first.

Related: [`architecture.md`](architecture.md), [`security-model.md`](security-model.md),
[`mcp.md`](mcp.md).
