/**
 * The stdio transport, exercised the way a host actually uses it.
 *
 * `integration.test.ts` proves protocol conformance over an in-memory pair.
 * This proves the remaining thing that cannot: that the published binary starts
 * as a subprocess, speaks the protocol over the pipe, and keeps stdout clean —
 * which is precisely how Claude Desktop, Cursor and VS Code launch a local MCP
 * server.
 *
 * It spawns a real process, so it is deliberately one test with a handful of
 * assertions rather than a suite.
 */

import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { Client } from '@modelcontextprotocol/client';
import { StdioClientTransport } from '@modelcontextprotocol/client/stdio';

const packageRoot = join(dirname(fileURLToPath(import.meta.url)), '..');

test('an external host can launch the binary over stdio and use it', { timeout: 60_000 }, async () => {
  const transport = new StdioClientTransport({
    command: 'npx',
    args: ['tsx', 'src/bin.ts'],
    cwd: packageRoot,
  });
  const client = new Client({ name: 'configshell-stdio-test', version: '1.0.0' });

  try {
    await client.connect(transport);

    assert.equal(client.getServerVersion()?.name, 'configshell');
    assert.ok(client.getServerCapabilities()?.tools);

    const { tools } = await client.listTools();
    assert.ok(tools.length >= 7, `expected the full tool surface, got ${tools.length}`);

    // A real call, over a real pipe. If anything in the process wrote to stdout
    // the framing would be corrupt and this would fail rather than hang.
    const result: any = await client.callTool({
      name: 'generate_setup',
      arguments: { applicationIds: ['git', 'htop'], environment: { distro: 'Fedora' } },
    });

    assert.deepEqual(
      result.structuredContent.commands.map((c: any) => c.command),
      ['sudo dnf install git htop', 'command -v git', 'command -v htop'],
    );
    assert.equal(result.structuredContent.execution.executed, false);
  } finally {
    await client.close();
  }
});
