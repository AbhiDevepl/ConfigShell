/**
 * The ConfigShell MCP server, built on the official SDK.
 *
 * ## Transport-agnostic on purpose
 *
 * `createConfigShellServer()` returns a configured `McpServer` with **no
 * transport attached**. `bin.ts` binds stdio; a future HTTP entry point would
 * bind `WebStandardStreamableHTTPServerTransport` from the same package and
 * register the same tools. Nothing in `tools.ts` knows how it is being reached,
 * which is what keeps a remote deployment from becoming a rewrite.
 *
 * ## What the SDK owns, and what ConfigShell owns
 *
 * The SDK owns the protocol: JSON-RPC framing, the initialize handshake,
 * protocol-version negotiation, capability declaration, `tools/list` and
 * `tools/call` dispatch, JSON Schema generation from our Zod schemas, argument
 * validation, and the error envelope.
 *
 * ConfigShell owns the business logic: the catalog, resolution, compatibility,
 * setup plans and the security policy. That split is the whole point — protocol
 * correctness is a solved problem maintained by the people who write the spec,
 * and a trusted application catalog is not.
 */

import { McpServer } from '@modelcontextprotocol/server';
import {
  APPLICATIONS,
  CATEGORIES,
  DISTROS,
  PACKAGE_ECOSYSTEMS,
  ROLES,
  ecosystemForDistro,
} from '@configshell/catalog';
import { z } from 'zod';
import { ToolError } from './errors.ts';
import { TOOLS } from './tools.ts';

export const SERVER_INFO = {
  name: 'configshell',
  title: 'ConfigShell',
  version: '0.1.0',
} as const;

/**
 * Server instructions, shown to the host once at connection.
 *
 * Written for a model that has never seen ConfigShell: what it is, what the
 * tools are for, the one thing it cannot do (detect the machine), and the one
 * thing it must not imply (that anything was installed). Hosts surface this as
 * system context, so it is the highest-leverage text in the package.
 */
export const INSTRUCTIONS = `ConfigShell turns a selection of Linux applications and a distribution into an ordered setup plan and the exact commands to run.

It is a trusted, deterministic catalog — not an assistant. You do the reasoning and the conversation; ConfigShell supplies verified data and computes plans. The same inputs always produce the same output.

A typical flow:
1. list_environments — see what is supported. ConfigShell CANNOT detect the user's system: ask them which distribution they run.
2. search_application / list_roles — find candidates. Role presets are curated starting points, not recommendations; you are expected to explain and adjust them.
3. get_application — details for one application, including every verified installation source and who packages it (the distribution, the vendor, or a third party). Use this when comparing options or explaining trade-offs.
4. check_compatibility — will these work on this distribution, and why or why not.
5. generate_setup — the ordered plan and the commands.

Important when presenting results:
- ConfigShell NEVER installs anything. generate_setup returns commands for the USER to run in their own terminal. Do not imply anything has been installed or that you can install it.
- Show privileged commands ("privileged": true) as needing root, before the user agrees to run anything.
- Some applications come back as manual steps with a vendor link rather than a command — that is deliberate, because the command would fail on a clean system. Relay the link.
- Applications with no verified route are reported rather than dropped. Say so; do not invent an alternative package name.
- Every command comes from the verified catalog. Never edit one, and never substitute a package name of your own.`;

/**
 * Build the server and register everything on it.
 *
 * Pure construction: no I/O, no transport, no side effects. Tests build one and
 * connect it to an in-memory transport; `bin.ts` builds the same one and
 * connects it to stdio.
 */
export function createConfigShellServer(): McpServer {
  const server = new McpServer(SERVER_INFO, { instructions: INSTRUCTIONS });

  registerTools(server);
  registerResources(server);
  registerPrompts(server);

  return server;
}

function registerTools(server: McpServer): void {
  for (const tool of TOOLS) {
    server.registerTool(
      tool.name,
      {
        title: tool.title,
        description: tool.description,
        inputSchema: tool.inputSchema,
        annotations: tool.annotations,
      },
      (args: unknown) => {
        try {
          // The SDK has already validated these against the tool's schema.
          const result = tool.handler((args ?? {}) as Record<string, unknown>);
          return {
            content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
            structuredContent: result as Record<string, unknown>,
          };
        } catch (cause) {
          if (cause instanceof ToolError) {
            // Reported as a tool error rather than a protocol error: the host
            // asked a valid question badly, and it can read this and correct
            // itself. Protocol errors are for protocol problems.
            const error = {
              error: { code: cause.code, message: cause.message, details: cause.details },
            };
            return {
              content: [{ type: 'text' as const, text: JSON.stringify(error, null, 2) }],
              structuredContent: error,
              isError: true,
            };
          }
          // A bug here. The message the caller sees stays generic; `cause` keeps
          // the real error attached for local diagnostics, and stderr is the
          // only place it is written — stdout carries protocol messages alone.
          console.error(`[configshell-mcp] tool ${tool.name} failed:`, cause);
          throw new Error('Internal error.', { cause });
        }
      },
    );
  }
}

/**
 * Resources: small, static reference data a host can read once instead of
 * spending a tool call on it.
 *
 * Deliberately only two. Resources are not a place to mirror the whole catalog
 * — `search_application` exists precisely because a host should filter server
 * side rather than pull 31 entries into context. What earns a resource is data
 * that shapes *every* subsequent call: what environments exist, and what this
 * server will and will not do.
 */
function registerResources(server: McpServer): void {
  server.registerResource(
    'supported-environments',
    'configshell://reference/environments',
    {
      title: 'Supported environments',
      description:
        'The distributions ConfigShell supports and the package ecosystem each uses. Read ' +
        'this before planning. ConfigShell cannot detect the user\'s system.',
      mimeType: 'application/json',
    },
    (uri) => ({
      contents: [
        {
          uri: uri.href,
          mimeType: 'application/json',
          text: JSON.stringify(
            {
              detectionAvailable: false,
              distros: DISTROS.map((distro) => ({
                distro,
                ecosystem: ecosystemForDistro(distro),
              })),
              ecosystems: [...PACKAGE_ECOSYSTEMS],
              categories: [...CATEGORIES],
              roles: ROLES.map((role) => ({ id: role.id, name: role.name })),
              catalogSize: APPLICATIONS.length,
            },
            null,
            2,
          ),
        },
      ],
    }),
  );

  server.registerResource(
    'safety-boundaries',
    'configshell://reference/safety',
    {
      title: 'ConfigShell safety boundaries',
      description:
        'What ConfigShell will and will not do. Read this before presenting commands to a user.',
      mimeType: 'text/markdown',
    },
    (uri) => ({
      contents: [
        {
          uri: uri.href,
          mimeType: 'text/markdown',
          text: SAFETY_BOUNDARIES,
        },
      ],
    }),
  );
}

const SAFETY_BOUNDARIES = `# ConfigShell safety boundaries

## ConfigShell never executes anything
Every tool here is read-only. \`generate_setup\` returns command **text** for the user to run
themselves in their own terminal. Nothing in this server can run a command, read a file or
open a socket. Do not tell a user that something has been installed.

## Commands come only from the verified catalog
Package identifiers are checked against a strict pattern immediately before they are placed
in a command. There is no tool argument for a package name, a command, a flag, a URL or a
repository — you supply catalog ids and a distribution, and nothing else can reach command
generation. Do not edit a returned command or substitute your own package name; a modified
command is no longer something ConfigShell has verified.

## Privileged steps are marked
Commands carrying \`"privileged": true\` change the system as root. Show which ones before the
user agrees to run anything.

## Honest gaps are deliberate
- **Manual steps**: some applications need a vendor repository, or ship only as a vendor
  download. ConfigShell returns a link rather than a command that would fail on a clean
  system. Relay the link.
- **Unavailable**: an application with no verified route for that distribution is reported,
  not dropped. Say so rather than inventing an alternative.

## Not available, by design
\`detect_system\`, \`check_installed\` and executing a plan all require access to the user's
machine. They belong to a local agent that does not exist yet. Ask the user for their
distribution rather than guessing, and never claim to know what is already installed.
`;

/**
 * One prompt: the workflow, as a reusable starting point.
 *
 * A host can discover the tools on its own, but the *order* — establish the
 * environment before planning, explain trade-offs before generating commands —
 * is ConfigShell-specific knowledge worth handing over explicitly. A single
 * prompt covers the product's main journey; more would be padding.
 */
function registerPrompts(server: McpServer): void {
  server.registerPrompt(
    'plan_a_setup',
    {
      title: 'Plan a Linux setup',
      description:
        'Walk a user from "what is this machine for" to a reviewed setup plan, using ' +
        "ConfigShell's verified catalog.",
      argsSchema: z.object({
        distro: z
          .string()
          .optional()
          .describe('The distribution, if the user has already said. Otherwise ask them.'),
        useCase: z
          .string()
          .optional()
          .describe('What the machine is for, e.g. "full-stack web development".'),
      }),
    },
    ({ distro, useCase }) => ({
      messages: [
        {
          role: 'user' as const,
          content: {
            type: 'text' as const,
            text: [
              useCase
                ? `Help me set up a Linux machine for ${useCase}.`
                : 'Help me set up a Linux machine.',
              distro ? `I'm running ${distro}.` : '',
              '',
              'Use the ConfigShell tools:',
              '1. Call list_environments first. If I have not told you my distribution, ask — do not guess.',
              '2. Use list_roles and search_application to find candidates, and get_application to compare them. Explain the trade-offs in your own words, including who packages each option.',
              '3. Confirm the selection with me before planning.',
              '4. Call generate_setup and show me the commands, marking which need root.',
              '5. Tell me plainly about anything that needs a manual install or has no verified route.',
              '',
              'Remember that you are not installing anything — I run the commands myself.',
            ]
              .filter(Boolean)
              .join('\n'),
          },
        },
      ],
    }),
  );
}
