# MCP interface

## Status: not started

No MCP server exists. There is no MCP dependency, no tool implementation, and no transport.
`packages/mcp` is an empty placeholder.

This document records the intended shape and the rules any implementation must follow. It
is **not** a description of working functionality, and the tool names below are sketches,
not an API.

## Purpose

MCP (Model Context Protocol) is intended to be the **controlled interface** through which
*external clients* interact with the platform — a fixed, explicitly authorized set of
capabilities instead of general access. If a client can do something, it is because a tool
for it exists, was reviewed, and was authorized.

**MCP does not depend on the AI layer.** An AI system is one possible client; so is a CLI,
an editor extension, or a script. Every tool below is a thin adapter over the same
deterministic core the web app uses (`packages/catalog` + the installer resolver), which is
why MCP stays on the roadmap while AI is deferred. Nothing here requires a model to exist,
and MCP must never become the AI layer's private back door — an AI client gets exactly the
same authorized tools, and exactly the same validation, as any other caller.

## Sketch of the intended tools

| Tool | Purpose | Reads or changes |
| ---- | ------- | ---------------- |
| `search_apps` | Search the trusted catalog | read-only |
| `get_app_details` | Details for one catalog entry | read-only |
| `get_system_info` | Describe the user's Linux system | read-only |
| `check_compatibility` | Assess an app against a system | read-only |
| `create_install_plan` | Draft a plan from catalog entries | read-only (produces a proposal) |
| `validate_install_plan` | Check a plan against the catalog | read-only |
| `execute_install_plan` | Request execution of an approved plan | **delegates to the local agent** |

Only the last one can lead to a system change, and it cannot perform one itself — it hands
an already-validated plan to the local agent, which re-validates and requires explicit user
confirmation.

## Rules for any implementation

1. **No raw shell tool. Ever.** There is no `run_command`, no `exec`, no escape hatch. A
   tool that accepts an arbitrary string destined for a shell is out of scope for this
   project, not a design decision to be revisited.
2. **Tool inputs are untrusted.** Validate every argument against a schema; reject rather
   than coerce.
3. **Everything resolves against the trusted catalog.** Tools operate on catalog ids and
   verified installation sources, never on caller-supplied package names or URLs.
4. **Read-only by default.** A new tool is read-only unless there is a specific reason
   otherwise, and anything that is not read-only goes through the agent's confirmation
   path.
5. **Authorization is explicit and per-capability**, not "connected = allowed".
6. **Security-relevant calls are logged** so a user can audit what was asked for.

## Where it would live

`packages/mcp`, consumed by the server. The browser never speaks MCP.

## Before you start

Post-core work (see [`ROADMAP.md`](ROADMAP.md)), and it depends on layers that do not
exist yet — there is nothing to expose until installer resolution is real, and
`get_system_info` / `execute_install_plan` additionally wait on the local agent. Open an
issue first.

The single thing the core release does to keep MCP buildable is architectural, and it is
already planned: the resolver, setup plan and command generation live in `packages/installer`
as **pure, UI-independent functions over (catalog, environment)**. Each read-only tool above
then maps 1:1 onto one of them. No MCP SDK, transport or tool registry should be added
before that core exists.

Related: [`architecture.md`](architecture.md), [`security-model.md`](security-model.md),
[`agent.md`](agent.md), [`ai.md`](ai.md).
