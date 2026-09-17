/**
 * The Streamable HTTP transport, exercised by the official MCP client.
 *
 * `stdio.test.ts` proves a host can launch the binary locally. This proves the
 * remaining half: that a *remote* host can reach the same server over HTTP and
 * get the same answers. The load-bearing assertion is the last one — both
 * transports returning byte-identical results — because that is the property
 * that stops a remote deployment from quietly becoming a second product.
 */

import assert from 'node:assert/strict';
import { createServer, type Server } from 'node:http';
import { after, before, test } from 'node:test';
import { Client, StreamableHTTPClientTransport } from '@modelcontextprotocol/client';
import { createMcpHttpHandler } from './http.ts';

let server: Server;
let url: URL;
let closeHandler: () => Promise<void>;

before(async () => {
  const { handler, close } = createMcpHttpHandler();
  closeHandler = close;
  server = createServer((req, res) => {
    void handler(req, res);
  });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  if (typeof address === 'string' || address === null) throw new Error('no port');
  url = new URL(`http://127.0.0.1:${address.port}/mcp`);
});

after(async () => {
  await closeHandler();
  await new Promise<void>((resolve) => server.close(() => resolve()));
});

async function connect(): Promise<Client> {
  const client = new Client({ name: 'configshell-http-test', version: '1.0.0' });
  await client.connect(new StreamableHTTPClientTransport(url));
  return client;
}

test('a remote host can initialize, discover and call over Streamable HTTP', async () => {
  const client = await connect();
  try {
    assert.equal(client.getServerVersion()?.name, 'configshell');
    const capabilities = client.getServerCapabilities();
    assert.ok(capabilities?.tools && capabilities?.resources && capabilities?.prompts);

    const { tools } = await client.listTools();
    assert.equal(tools.length, 7, tools.map((tool) => tool.name).join(','));
    for (const withheld of ['detect_system', 'check_installed', 'execute_setup']) {
      assert.ok(!tools.some((tool) => tool.name === withheld), `${withheld} must stay absent`);
    }

    const { resources } = await client.listResources();
    assert.equal(resources.length, 2);
    const { prompts } = await client.listPrompts();
    assert.equal(prompts.length, 1);
  } finally {
    await client.close();
  }
});

test('the remote transport enforces the same input rules as stdio', async () => {
  const client = await connect();
  try {
    // A hostile identifier must not survive a change of transport.
    const hostile = await client.callTool({
      name: 'generate_setup',
      arguments: { applicationIds: ['git; rm -rf /'], environment: { distro: 'Fedora' } },
    });
    assert.equal(hostile.isError, true);

    // Nor may a caller pair a distribution with an ecosystem of its choosing.
    const spoofed = await client.callTool({
      name: 'check_compatibility',
      arguments: { applicationIds: ['git'], environment: { distro: 'Arch Linux', ecosystem: 'apt' } },
    });
    assert.equal(spoofed.isError, true);
  } finally {
    await client.close();
  }
});

test('the transport is stateless: repeated calls are independent and identical', async () => {
  const client = await connect();
  try {
    const results: string[] = [];
    for (let i = 0; i < 4; i += 1) {
      const result = await client.callTool({
        name: 'generate_setup',
        arguments: { applicationIds: ['git', 'htop'], environment: { distro: 'Fedora' } },
      });
      results.push(JSON.stringify(result.structuredContent));
    }
    assert.equal(new Set(results).size, 1, 'a stateless server must not drift between calls');
  } finally {
    await client.close();
  }
});

test('stdio and Streamable HTTP return byte-identical results', async () => {
  // The whole justification for a second transport is that it is only a
  // transport. If these ever diverge, a remote host and a local one are using
  // different products under one name.
  const { StdioClientTransport } = await import('@modelcontextprotocol/client/stdio');
  const { fileURLToPath } = await import('node:url');
  const { dirname, join } = await import('node:path');
  const packageRoot = join(dirname(fileURLToPath(import.meta.url)), '..');

  const viaStdio = new Client({ name: 'stdio-cmp', version: '1.0.0' });
  await viaStdio.connect(
    new StdioClientTransport({ command: 'npx', args: ['tsx', 'src/bin.ts'], cwd: packageRoot }),
  );
  const viaHttp = await connect();

  try {
    const args = {
      applicationIds: ['git', 'firefox', 'cursor', 'docker'],
      environment: { distro: 'openSUSE' },
    };

    for (const name of ['generate_setup', 'check_compatibility'] as const) {
      const [a, b] = await Promise.all([
        viaStdio.callTool({ name, arguments: args }),
        viaHttp.callTool({ name, arguments: args }),
      ]);
      assert.deepEqual(a.structuredContent, b.structuredContent, `${name} differs across transports`);
    }

    const [stdioTools, httpTools] = await Promise.all([viaStdio.listTools(), viaHttp.listTools()]);
    assert.deepEqual(
      stdioTools.tools.map((t) => t.name),
      httpTools.tools.map((t) => t.name),
      'the tool surface must not depend on the transport',
    );
  } finally {
    await viaStdio.close();
    await viaHttp.close();
  }
});
