import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  SERVER_INFO,
  SUPPORTED_PROTOCOL_VERSIONS,
  handleMessage,
  type JsonRpcResponse,
} from './protocol.ts';
import { handleLine, type ServerIo } from './server.ts';
import { TOOLS } from './tools.ts';

function request(method: string, params?: unknown, id: string | number = 1) {
  return handleMessage({ jsonrpc: '2.0', id, method, params });
}

function callTool(name: string, args: unknown): any {
  const response = request('tools/call', { name, arguments: args });
  assert.ok(response?.result, `tools/call ${name} produced no result`);
  return response.result as any;
}

// ------------------------------------------------------------- handshake

test('initialize advertises tools and echoes a supported protocol version', () => {
  const response = request('initialize', { protocolVersion: '2025-06-18' });
  const result = response?.result as any;

  assert.equal(result.protocolVersion, '2025-06-18');
  assert.deepEqual(result.serverInfo, SERVER_INFO);
  assert.ok(result.capabilities.tools, 'tools capability must be declared');
  assert.match(result.instructions, /never executes/i);
});

test('an unsupported protocol version gets one we do support, not an error', () => {
  const result = request('initialize', { protocolVersion: '1999-01-01' })?.result as any;
  assert.equal(result.protocolVersion, SUPPORTED_PROTOCOL_VERSIONS[0]);
});

test('notifications get no response', () => {
  assert.equal(handleMessage({ jsonrpc: '2.0', method: 'notifications/initialized' }), null);
  assert.equal(handleMessage({ jsonrpc: '2.0', method: 'notifications/cancelled' }), null);
  // A notification for an unknown method is also silent — replying would be a
  // protocol violation.
  assert.equal(handleMessage({ jsonrpc: '2.0', method: 'nonsense/thing' }), null);
});

test('ping answers', () => {
  assert.deepEqual(request('ping')?.result, {});
});

// ------------------------------------------------------------ tools/list

test('tools/list returns every registered tool with its schema', () => {
  const result = request('tools/list')?.result as any;
  assert.equal(result.tools.length, TOOLS.length);
  for (const tool of result.tools) {
    assert.ok(tool.name && tool.description && tool.inputSchema);
    assert.equal(tool.inputSchema.type, 'object');
  }
});

test('the advertised surface is exactly the reviewed one', () => {
  // A new tool should fail this test until someone updates it deliberately.
  const names = (request('tools/list')?.result as any).tools.map((t: any) => t.name).sort();
  assert.deepEqual(names, [
    'check_compatibility',
    'generate_setup',
    'get_application',
    'list_environments',
    'list_roles',
    'search_application',
    'validate_setup',
  ]);
});

test('no execution or detection tool is advertised', () => {
  const names: string[] = (request('tools/list')?.result as any).tools.map((t: any) => t.name);
  for (const forbidden of [
    'detect_system',
    'check_installed',
    'execute_setup',
    'execute_install_plan',
    'run_command',
    'exec',
    'shell',
  ]) {
    assert.ok(!names.includes(forbidden), `${forbidden} must not be exposed`);
  }
});

// ------------------------------------------------------------ tools/call

test('a successful call returns text content and structured content', () => {
  const result = callTool('generate_setup', {
    applicationIds: ['git'],
    environment: { distro: 'Ubuntu' },
  });

  assert.equal(result.isError, false);
  assert.equal(result.content[0].type, 'text');
  assert.deepEqual(JSON.parse(result.content[0].text), result.structuredContent);
  assert.equal(result.structuredContent.execution.executed, false);
});

test('a rejected call is a tool error, not a protocol error', () => {
  // The caller asked a valid question badly. An agent can read the message and
  // correct itself, which a protocol-level error would not allow.
  const result = callTool('generate_setup', {
    applicationIds: ['not-a-real-app'],
    environment: { distro: 'Ubuntu' },
  });

  assert.equal(result.isError, true);
  assert.equal(result.structuredContent.error.code, 'UNKNOWN_APPLICATION');
  assert.deepEqual(result.structuredContent.error.details.unknown, ['not-a-real-app']);
});

test('an unknown tool is a protocol error naming what is available', () => {
  const response = request('tools/call', { name: 'execute_install_plan', arguments: {} });
  assert.equal(response?.error?.code, -32601);
  assert.match(response!.error!.message, /Unknown tool/);
  assert.ok(Array.isArray((response!.error!.data as any).availableTools));
});

test('malformed tools/call params are rejected', () => {
  assert.equal(request('tools/call', 'nope')?.error?.code, -32602);
  assert.equal(request('tools/call', {})?.error?.code, -32602);
  assert.equal(request('tools/call', { name: 42 })?.error?.code, -32602);
});

test('missing arguments default to an empty object rather than crashing', () => {
  const response = request('tools/call', { name: 'list_environments' });
  assert.equal((response?.result as any).isError, false);
});

// -------------------------------------------------------- malformed input

test('malformed JSON-RPC envelopes are rejected', () => {
  assert.equal(handleMessage(null)?.error?.code, -32600);
  assert.equal(handleMessage('string')?.error?.code, -32600);
  assert.equal(handleMessage([])?.error?.code, -32600);
  assert.equal(handleMessage({ id: 1, method: 'ping' })?.error?.code, -32600);
  assert.equal(handleMessage({ jsonrpc: '1.0', id: 1, method: 'ping' })?.error?.code, -32600);
  assert.equal(handleMessage({ jsonrpc: '2.0', id: 1 })?.error?.code, -32600);
});

test('an unknown method with an id is method-not-found', () => {
  assert.equal(request('resources/list')?.error?.code, -32601);
});

test('no error response carries a stack trace or a path', () => {
  const responses = [
    handleMessage(null),
    request('resources/list'),
    request('tools/call', { name: 'nope', arguments: {} }),
    request('tools/call', { name: 'get_application', arguments: { applicationId: '!!' } }),
  ].filter(Boolean) as JsonRpcResponse[];

  for (const response of responses) {
    const serialised = JSON.stringify(response);
    assert.ok(!serialised.includes('/home/'), 'leaked a path');
    assert.ok(!serialised.includes('node_modules'));
    assert.ok(!/\\n\s+at /.test(serialised), 'looks like a stack trace');
  }
});

// ------------------------------------------------------------- transport

function collect(): { io: ServerIo; sent: JsonRpcResponse[]; logs: string[] } {
  const sent: JsonRpcResponse[] = [];
  const logs: string[] = [];
  return { io: { send: (r) => sent.push(r), log: (m) => logs.push(m) }, sent, logs };
}

test('a line of JSON is handled and answered', () => {
  const { io, sent } = collect();
  handleLine(JSON.stringify({ jsonrpc: '2.0', id: 7, method: 'ping' }), io);
  assert.equal(sent.length, 1);
  assert.equal(sent[0]!.id, 7);
});

test('blank lines are ignored, and unparseable lines are a parse error', () => {
  const { io, sent } = collect();
  handleLine('', io);
  handleLine('   ', io);
  assert.equal(sent.length, 0);

  handleLine('{ not json', io);
  assert.equal(sent.length, 1);
  assert.equal(sent[0]!.error?.code, -32700);
  assert.equal(sent[0]!.id, null);
});

test('a notification line produces no output', () => {
  const { io, sent } = collect();
  handleLine(JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' }), io);
  assert.equal(sent.length, 0);
});

test('every serialised response is a single line', () => {
  // Newlines frame messages on stdio, so an embedded one would corrupt the
  // stream for everything after it.
  const { io, sent } = collect();
  for (const message of [
    { jsonrpc: '2.0', id: 1, method: 'tools/list' },
    { jsonrpc: '2.0', id: 2, method: 'initialize', params: {} },
    {
      jsonrpc: '2.0',
      id: 3,
      method: 'tools/call',
      params: {
        name: 'generate_setup',
        arguments: { applicationIds: ['git'], environment: { distro: 'Ubuntu' } },
      },
    },
  ]) {
    handleLine(JSON.stringify(message), io);
  }

  assert.equal(sent.length, 3);
  for (const response of sent) {
    assert.ok(!JSON.stringify(response).includes('\n'), 'response contains a raw newline');
  }
});
