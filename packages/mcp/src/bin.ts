#!/usr/bin/env node
/**
 * ConfigShell MCP server over stdio.
 *
 *     pnpm --filter @configshell/mcp start
 *
 * stdio is the transport MCP hosts use to launch a local server: the host runs
 * this command and speaks the protocol over the pipe. There is no listening
 * port and no authentication story, because there is nothing remote to
 * authenticate.
 *
 * **Never write to stdout here.** It carries protocol messages; anything else
 * corrupts the stream. Diagnostics go to stderr.
 */

import { StdioServerTransport } from '@modelcontextprotocol/server/stdio';
import { createConfigShellServer, SERVER_INFO } from './server.ts';

async function main(): Promise<void> {
  const server = createConfigShellServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error(`[configshell-mcp] ${SERVER_INFO.name} ${SERVER_INFO.version} ready on stdio`);
}

main().catch((error: unknown) => {
  console.error('[configshell-mcp] fatal:', error instanceof Error ? error.message : error);
  process.exit(1);
});
