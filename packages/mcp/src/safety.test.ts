/**
 * Structural safety invariants for the MCP layer.
 *
 * MCP is the interface most likely to be driven by something that is not a
 * person — an agent, a script, a model. That makes "there is no tool for it"
 * the load-bearing guarantee, so it is asserted rather than assumed.
 */

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { sourceFiles, stripComments } from '@configshell/test-utils';
import { TOOLS } from './tools.ts';

const SRC = new URL('.', import.meta.url).pathname;

const isSource = (name: string) => name.endsWith('.ts') && !name.endsWith('.test.ts');

test('the MCP layer has no way to execute anything', () => {
  const forbidden = [
    'child_process',
    'execSync',
    'spawnSync',
    'execFile',
    'eval(',
    'new Function(',
  ];

  const offenders: string[] = [];
  for (const file of sourceFiles(SRC, isSource)) {
    const source = stripComments(readFileSync(file, 'utf8'));
    for (const fragment of forbidden) {
      if (source.includes(fragment)) offenders.push(`${file}: ${fragment}`);
    }
  }
  assert.deepEqual(offenders, [], 'no MCP tool may be able to run a command');
});

test('the MCP layer reads no files and opens no sockets', () => {
  // Beyond its own module graph. It answers from the compiled-in catalog, so
  // there is no path for a caller to steer it at the filesystem or the network.
  const forbidden = ['node:fs', 'node:net', 'node:http', 'node:https', 'fetch(', 'node:dns'];

  // The transports are the exception, and only the transports. A transport's
  // whole job is to move bytes — stdio reads stdin, Streamable HTTP is reached
  // over a socket the host owns — so the rule cannot apply to them. It applies
  // to everything a *caller* can steer: the tools, the validation and the
  // server wiring.
  //
  // The list is pinned below rather than pattern-matched, so adding a file that
  // touches the filesystem or the network is a deliberate edit to this test
  // with a reason attached, not something that slips in behind a wildcard.
  const TRANSPORTS = ['bin.ts', 'http.ts'];

  const offenders: string[] = [];
  const exempted: string[] = [];
  for (const file of sourceFiles(SRC, isSource)) {
    if (TRANSPORTS.some((t) => file.endsWith(t))) {
      exempted.push(file.split('/').pop()!);
      continue;
    }
    const source = stripComments(readFileSync(file, 'utf8'));
    for (const fragment of forbidden) {
      if (source.includes(fragment)) offenders.push(`${file}: ${fragment}`);
    }
  }
  assert.deepEqual(offenders, []);
  assert.deepEqual(
    exempted.sort(),
    [...TRANSPORTS].sort(),
    'the exemption must cover exactly the transports — no more, no fewer',
  );
});

test('the HTTP transport touches the network only through types', () => {
  // `http.ts` is exempted above because it is a transport, so this asserts what
  // that exemption is actually worth: its only `node:http` reference is an
  // `import type`, which erases at compile time. The module opens no socket and
  // starts no listener — the host it is mounted on owns the server.
  const source = stripComments(readFileSync(`${SRC}/http.ts`, 'utf8'));

  assert.match(source, /import type \{[^}]*\} from 'node:http'/, 'node:http is imported as types only');
  assert.ok(!/from 'node:http'/.test(source.replace(/import type \{[^}]*\} from 'node:http';/, '')),
    'no value import of node:http');
  for (const fragment of ['createServer', '.listen(', 'node:net', 'node:fs', 'child_process']) {
    assert.ok(!source.includes(fragment), `the transport must not use ${fragment}`);
  }
});

test('command text is produced only by the installer package', () => {
  // The package-manager vocabulary must not appear here. If it ever does,
  // command generation has been forked, and the MCP layer could disagree with
  // the web app and the API about what a user should run.
  const forbidden = [
    'apt-get install',
    'apt install',
    'dnf install',
    'pacman -S',
    'snap install',
    'flatpak install',
    'command -v ',
    'sudo ',
  ];

  const offenders: string[] = [];
  for (const file of sourceFiles(SRC, isSource)) {
    const source = stripComments(readFileSync(file, 'utf8'));
    for (const fragment of forbidden) {
      if (source.includes(fragment)) offenders.push(`${file}: ${fragment}`);
    }
  }
  assert.deepEqual(offenders, [], 'command generation belongs to @configshell/installer');
});

test('every tool is read-only: calling one twice changes nothing', () => {
  // Determinism doubles as a mutation check — if a handler mutated the catalog,
  // a second identical call would differ.
  for (const tool of TOOLS) {
    const args =
      tool.name === 'search_application' || tool.name === 'list_environments' || tool.name === 'list_roles'
        ? {}
        : tool.name === 'get_application'
          ? { applicationId: 'git', environment: { distro: 'Ubuntu' } }
          : tool.name === 'validate_setup'
            ? {
                applicationIds: ['git'],
                environment: { distro: 'Ubuntu' },
                commands: ['sudo apt-get update'],
              }
            : { applicationIds: ['git'], environment: { distro: 'Ubuntu' } };

    const first = JSON.stringify(tool.handler(args));
    const second = JSON.stringify(tool.handler(args));
    assert.equal(first, second, `${tool.name} is not deterministic`);
  }
});
