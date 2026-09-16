/**
 * Structural safety invariants for the web app.
 *
 * These assert properties the security model claims, rather than trusting that
 * they stay true. They check source rather than behaviour on purpose: the point
 * is that the browser bundle never *contains* the machinery, so there is nothing
 * to reach even if something else goes wrong.
 */

import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join, sep } from 'node:path';
import { test } from 'node:test';

const SRC = new URL('..', import.meta.url).pathname;

function sourceFiles(dir: string): string[] {
  const entries = readdirSync(dir, { recursive: true, encoding: 'utf8' })
    // `recursive` descends into node_modules and dotfile directories.
    .filter((entry) => !entry.split(sep).some((s) => s === 'node_modules' || s.startsWith('.')))
    .filter((entry) => /\.tsx?$/.test(entry) && !entry.endsWith('.test.ts'));

  // A scan that found nothing would pass every test below vacuously.
  assert.ok(entries.length > 0, `expected source files under ${dir}`);
  return entries.map((entry) => join(dir, entry));
}

/** Comments discuss these rules in prose; only code should be searched. */
function stripComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
}

test('the web app contains no package-manager command vocabulary', () => {
  // Command generation lives in packages/installer and runs server-side. The
  // browser receives command *text* to display and never assembles one, so this
  // vocabulary should not appear in the app at all — not in a template, not in
  // a fallback, not in a "just in case" helper.
  const forbidden = [
    'apt-get install',
    'apt install',
    'dnf install',
    'pacman -S',
    'snap install',
    'flatpak install',
    'sudo ',
  ];

  const offenders: string[] = [];
  for (const file of sourceFiles(SRC)) {
    const source = stripComments(readFileSync(file, 'utf8'));
    for (const fragment of forbidden) {
      if (source.includes(fragment)) offenders.push(`${file}: ${fragment}`);
    }
  }

  assert.deepEqual(offenders, [], 'the browser must not know how to build a command');
});

test('the app is wrapped in an error boundary', () => {
  // A render error should degrade to a message, not a blank page. Asserted
  // structurally because there is no DOM test runner to render it.
  const main = readFileSync(join(SRC, 'main.tsx'), 'utf8');
  assert.match(main, /<ErrorBoundary>/, 'main.tsx does not mount the error boundary');
  assert.match(main, /<\/ErrorBoundary>/);

  const boundary = readFileSync(
    join(SRC, 'components', 'layout', 'ErrorBoundary.tsx'),
    'utf8',
  );
  assert.match(boundary, /getDerivedStateFromError/, 'not a real error boundary');
  assert.match(boundary, /role="alert"/, 'the fallback is not announced');
});

test('the web app never imports the installer package', () => {
  // One implementation of command generation, not two. Importing it here would
  // put the security-critical function in the browser bundle and give the API
  // and the UI two places to drift apart.
  for (const file of sourceFiles(SRC)) {
    const source = stripComments(readFileSync(file, 'utf8'));
    assert.ok(
      !source.includes('@configshell/installer'),
      `${file} imports @configshell/installer`,
    );
  }
});

test('the web app has no way to execute anything', () => {
  const forbidden = ['child_process', 'eval(', 'new Function(', 'dangerouslySetInnerHTML'];
  const offenders: string[] = [];

  for (const file of sourceFiles(SRC)) {
    const source = stripComments(readFileSync(file, 'utf8'));
    for (const fragment of forbidden) {
      if (source.includes(fragment)) offenders.push(`${file}: ${fragment}`);
    }
  }

  assert.deepEqual(offenders, []);
});
