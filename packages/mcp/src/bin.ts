#!/usr/bin/env -S npx tsx
/**
 * ConfigShell MCP server (stdio).
 *
 *     pnpm --filter @configshell/mcp start
 *
 * Read-only and deterministic: it reads the compiled-in catalog and computes
 * plans. It opens no sockets, reads no files, and executes nothing.
 */

import { createInterface } from 'node:readline';
import { serve } from './server.ts';
import { SERVER_INFO } from './protocol.ts';

const io = {
  // The single writer to stdout in this process. Anything else would corrupt
  // the message framing.
  send: (response: unknown) => process.stdout.write(`${JSON.stringify(response)}\n`),
  log: (message: string) => process.stderr.write(`[configshell-mcp] ${message}\n`),
};

io.log(`${SERVER_INFO.name} ${SERVER_INFO.version} ready on stdio`);

const input = createInterface({ input: process.stdin, terminal: false });
serve(input, io);

input.on('close', () => process.exit(0));
