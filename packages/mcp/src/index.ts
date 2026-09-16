/**
 * Public API of the MCP layer.
 *
 * The tools are exported separately from the server so they can be tested and
 * reused without the protocol, and the server is exported without a transport
 * so stdio, Streamable HTTP or an in-memory pair can all bind to the same
 * instance.
 */

export { createConfigShellServer, INSTRUCTIONS, SERVER_INFO } from './server.ts';
export { TOOLS, WITHHELD_CAPABILITIES, findTool, type ToolDefinition } from './tools.ts';
export { ToolError, type ToolErrorCode } from './errors.ts';
