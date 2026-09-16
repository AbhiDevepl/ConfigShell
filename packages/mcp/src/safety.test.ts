/**
 * Structural safety invariants for the MCP layer.
 *
 * MCP is the interface most likely to be driven by something that is not a
 * person — an agent, a script, a model. That makes "there is no tool for it"
 * the load-bearing guarantee, so it is asserted rather than assumed.
 */

import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';
import { TOOLS } from './tools.ts';

const SRC = new URL('.', import.meta.url).pathname;

function sourceFiles(dir: string, acc: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules' || entry.startsWith('.')) continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) sourceFiles(full, acc);
    else if (/\.ts$/.test(entry) && !entry.endsWith('.test.ts')) acc.push(full);
  }
  return acc;
}

/** Comments discuss these rules in prose; only code should be searched. */
function stripComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
}

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
  for (const file of sourceFiles(SRC)) {
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

  const offenders: string[] = [];
  for (const file of sourceFiles(SRC)) {
    if (file.endsWith('bin.ts')) continue; // reads stdin, which is the transport
    const source = stripComments(readFileSync(file, 'utf8'));
    for (const fragment of forbidden) {
      if (source.includes(fragment)) offenders.push(`${file}: ${fragment}`);
    }
  }
  assert.deepEqual(offenders, []);
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
  for (const file of sourceFiles(SRC)) {
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
