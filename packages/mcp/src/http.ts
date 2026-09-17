/**
 * The MCP server over Streamable HTTP, for remote clients.
 *
 * ## Same server, second transport
 *
 * This binds `createConfigShellServer()` — the identical instance `bin.ts`
 * serves over stdio, with the identical tools, resources and prompts — to the
 * SDK's HTTP handler. There is no second tool surface and no second copy of any
 * business logic: a remote caller and a local one reach the same
 * `@configshell/installer` functions and get the same answer.
 *
 * ## Stateless, deliberately
 *
 * `createMcpHandler` is configured `legacy: 'stateless'`: each request is
 * served by a fresh server instance from the factory, over a transport built
 * with `sessionIdGenerator: undefined`. Nothing is remembered between requests.
 *
 * That is the right model here rather than a compromise. Every ConfigShell tool
 * is a pure function of its arguments over a compiled-in catalog — there is no
 * conversation state, no cursor, no subscription and nothing to resume. A
 * session store would be infrastructure guarding data that does not exist, and
 * it is what would otherwise force a database and pin the deployment to a
 * single instance. Statelessness is why this runs on serverless infrastructure
 * and scales horizontally with no coordination.
 *
 * ## Why the official Node adapter
 *
 * The SDK's handler speaks Web-standard `Request`/`Response`. Express speaks
 * Node's `IncomingMessage`/`ServerResponse`. `toNodeHandler` from
 * `@modelcontextprotocol/node` is the official bridge between them, written by
 * the people who maintain the transport. Hand-rolling that conversion — body
 * streaming, header copying, SSE flushing, abort propagation — would be
 * exactly the kind of protocol-adjacent code this package deliberately does not
 * own.
 */

import { createMcpHandler } from '@modelcontextprotocol/server';
import { toNodeHandler } from '@modelcontextprotocol/node';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { createConfigShellServer } from './server.ts';

export interface McpHttpOptions {
  /**
   * Reporting hook for out-of-band transport errors. It cannot alter a
   * response; it exists so a host can log what the transport rejected instead
   * of the rejection being silent.
   *
   * Diagnostics must never reach stdout in a process that also serves stdio.
   */
  onError?: (error: Error) => void;
  /**
   * Hostnames permitted in the `Origin` header, for DNS-rebinding protection.
   *
   * Omitted means no origin restriction, which is correct for a public
   * read-only endpoint that an AI host calls server-to-server with no browser
   * and no credentials — there is no session to hijack and nothing to steal.
   * It becomes load-bearing the moment authentication arrives, which is why
   * the option exists now rather than being retrofitted later.
   */
  allowedOrigins?: readonly string[];
}

/** A Node request handler, mountable directly on Express. */
export type McpNodeHandler = (
  request: IncomingMessage,
  response: ServerResponse,
) => void | Promise<void>;

/**
 * Build the Streamable HTTP handler as a Node/Express-compatible function.
 *
 * Returns a handler plus the `close()` the SDK needs on shutdown, so a host can
 * tear the transport down rather than leaking it.
 */
export function createMcpHttpHandler(options: McpHttpOptions = {}): {
  handler: McpNodeHandler;
  close: () => Promise<void>;
} {
  const mcp = createMcpHandler(() => createConfigShellServer(), {
    // Named rather than left to the default: statelessness is a deliberate
    // architectural property here, not an accident of the SDK's defaults.
    legacy: 'stateless',
    ...(options.onError ? { onerror: options.onError } : {}),
  });

  return {
    handler: toNodeHandler(mcp) as McpNodeHandler,
    close: () => mcp.close(),
  };
}
