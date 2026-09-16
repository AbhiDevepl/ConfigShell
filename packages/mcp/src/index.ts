/**
 * Public API of the MCP layer.
 *
 * The tools are exported separately from the transport so they can be tested,
 * reused, or hosted over a different transport without touching them. They are
 * pure functions over the catalog and the installer.
 */

export { TOOLS, WITHHELD_CAPABILITIES, findTool, type ToolDefinition } from './tools.ts';
export { ToolError, type ToolErrorCode } from './errors.ts';
export {
  SERVER_INFO,
  SUPPORTED_PROTOCOL_VERSIONS,
  handleMessage,
  type JsonRpcRequest,
  type JsonRpcResponse,
} from './protocol.ts';
export { handleLine, serve, type ServerIo } from './server.ts';
