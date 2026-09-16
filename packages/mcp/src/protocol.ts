/**
 * MCP over JSON-RPC 2.0, handled as pure message-in/message-out.
 *
 * ## Why this is hand-written
 *
 * The official `@modelcontextprotocol/sdk` pulls in seventeen transitive
 * dependencies — express, hono, jose, cors, eventsource, pkce-challenge and
 * `cross-spawn` among them — almost all of it for HTTP transports and OAuth
 * that a read-only stdio server does not use. Adding a process-spawning library
 * to the dependency tree of a project whose central claim is "nothing here can
 * execute a command" is a poor trade, and this surface is small: a handful of
 * JSON-RPC methods over newline-delimited JSON.
 *
 * That is a judgement call, not a rule. It is recorded in `docs/mcp.md` so it
 * can be revisited — and because the tools in `tools.ts` know nothing about the
 * transport, swapping this file for the SDK would not touch them.
 *
 * This module does no I/O. `server.ts` owns stdin and stdout, which is what
 * makes the protocol testable by feeding it messages.
 */

import { ToolError, type ToolErrorCode } from './errors.ts';
import { TOOLS, findTool } from './tools.ts';

/** Protocol revisions this server implements. Newest first. */
export const SUPPORTED_PROTOCOL_VERSIONS = ['2025-06-18', '2025-03-26', '2024-11-05'] as const;

export const SERVER_INFO = {
  name: 'configshell',
  title: 'ConfigShell',
  version: '0.1.0',
} as const;

/** JSON-RPC 2.0 reserved codes, plus the subset of behaviour we need. */
const JSON_RPC = {
  PARSE_ERROR: -32700,
  INVALID_REQUEST: -32600,
  METHOD_NOT_FOUND: -32601,
  INVALID_PARAMS: -32602,
  INTERNAL_ERROR: -32603,
} as const;

export interface JsonRpcRequest {
  jsonrpc: '2.0';
  id?: string | number | null;
  method: string;
  params?: unknown;
}

export interface JsonRpcResponse {
  jsonrpc: '2.0';
  id: string | number | null;
  result?: unknown;
  error?: { code: number; message: string; data?: unknown };
}

function ok(id: string | number | null, result: unknown): JsonRpcResponse {
  return { jsonrpc: '2.0', id, result };
}

function fail(
  id: string | number | null,
  code: number,
  message: string,
  data?: unknown,
): JsonRpcResponse {
  return { jsonrpc: '2.0', id, error: { code, message, ...(data === undefined ? {} : { data }) } };
}

/** Tool errors map onto JSON-RPC codes; the tool's own code travels in `data`. */
const TOOL_ERROR_RPC_CODE: Record<ToolErrorCode, number> = {
  INVALID_ARGUMENTS: JSON_RPC.INVALID_PARAMS,
  UNKNOWN_APPLICATION: JSON_RPC.INVALID_PARAMS,
  NOT_FOUND: JSON_RPC.INVALID_PARAMS,
  TOO_LARGE: JSON_RPC.INVALID_PARAMS,
  REQUIRES_LOCAL_AGENT: JSON_RPC.INVALID_PARAMS,
};

function negotiateVersion(requested: unknown): string {
  if (
    typeof requested === 'string' &&
    (SUPPORTED_PROTOCOL_VERSIONS as readonly string[]).includes(requested)
  ) {
    return requested;
  }
  // Spec behaviour: answer with a version we do support and let the client
  // decide whether to continue.
  return SUPPORTED_PROTOCOL_VERSIONS[0];
}

/**
 * Handle one parsed message.
 *
 * Returns `null` for notifications (a JSON-RPC message with no `id`), which by
 * specification get no response.
 */
export function handleMessage(message: unknown): JsonRpcResponse | null {
  if (typeof message !== 'object' || message === null || Array.isArray(message)) {
    return fail(null, JSON_RPC.INVALID_REQUEST, 'Request must be a JSON-RPC 2.0 object.');
  }

  const request = message as Partial<JsonRpcRequest>;
  const id = request.id ?? null;
  const isNotification = request.id === undefined;

  if (request.jsonrpc !== '2.0' || typeof request.method !== 'string') {
    return isNotification
      ? null
      : fail(id, JSON_RPC.INVALID_REQUEST, 'Missing or invalid "jsonrpc"/"method".');
  }

  switch (request.method) {
    case 'initialize': {
      const params = (request.params ?? {}) as Record<string, unknown>;
      return ok(id, {
        protocolVersion: negotiateVersion(params.protocolVersion),
        capabilities: { tools: { listChanged: false } },
        serverInfo: SERVER_INFO,
        instructions:
          'ConfigShell turns a selection of catalog applications and a Linux distribution ' +
          'into an ordered setup plan and the exact commands to run.\n\n' +
          'It cannot detect the user\'s system — call list_environments and ask which ' +
          'distribution they use. It never executes anything: generate_setup returns ' +
          'commands for the USER to run in their own terminal. Show them in full, ' +
          'including which ones need root, and let the user decide.',
      });
    }

    // Notifications: acknowledged by silence.
    case 'notifications/initialized':
    case 'notifications/cancelled':
      return null;

    case 'ping':
      return isNotification ? null : ok(id, {});

    case 'tools/list':
      return ok(id, {
        tools: TOOLS.map((tool) => ({
          name: tool.name,
          description: tool.description,
          inputSchema: tool.inputSchema,
        })),
      });

    case 'tools/call':
      return handleToolCall(id, request.params);

    default:
      return isNotification
        ? null
        : fail(id, JSON_RPC.METHOD_NOT_FOUND, `Unknown method: ${request.method}`);
  }
}

function handleToolCall(id: string | number | null, params: unknown): JsonRpcResponse {
  if (typeof params !== 'object' || params === null || Array.isArray(params)) {
    return fail(id, JSON_RPC.INVALID_PARAMS, 'tools/call params must be an object.');
  }

  const { name, arguments: args } = params as { name?: unknown; arguments?: unknown };
  if (typeof name !== 'string') {
    return fail(id, JSON_RPC.INVALID_PARAMS, 'tools/call requires a tool "name".');
  }

  const tool = findTool(name);
  if (!tool) {
    return fail(id, JSON_RPC.METHOD_NOT_FOUND, `Unknown tool: ${name}`, {
      availableTools: TOOLS.map((t) => t.name),
    });
  }

  try {
    const result = tool.handler(args ?? {});
    return ok(id, {
      content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      structuredContent: result,
      isError: false,
    });
  } catch (cause) {
    if (cause instanceof ToolError) {
      // A rejected call is reported as a tool result rather than a protocol
      // error: the caller asked a valid question badly, and an agent can read
      // the message and correct itself. Protocol errors are for protocol
      // problems.
      return ok(id, {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              { error: { code: cause.code, message: cause.message, details: cause.details } },
              null,
              2,
            ),
          },
        ],
        structuredContent: {
          error: { code: cause.code, message: cause.message, details: cause.details },
        },
        isError: true,
      });
    }

    // Anything else is a bug here. The caller learns nothing about this
    // process: no message, no stack, no paths.
    return fail(id, JSON_RPC.INTERNAL_ERROR, 'Internal error.');
  }
}

export { JSON_RPC, TOOL_ERROR_RPC_CODE };
