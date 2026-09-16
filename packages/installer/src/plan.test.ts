import assert from 'node:assert/strict';
import { test } from 'node:test';
import { APPLICATIONS, createEnvironment, findApplication } from '@configshell/catalog';
import type { Application, Environment } from '@configshell/catalog';
import { buildPlan } from './plan.ts';
import { resolveAll } from './resolve.ts';
import type { InstallStep, SetupPlan } from './types.ts';

const UBUNTU = createEnvironment('Ubuntu');
const FEDORA = createEnvironment('Fedora');
const ARCH = createEnvironment('Arch Linux');

function app(id: string): Application {
  const entry = findApplication(id);
  assert.ok(entry, `catalog is missing ${id}`);
  return entry;
}

function plan(ids: string[], environment: Environment): SetupPlan {
  return buildPlan(resolveAll(ids.map(app), environment), environment);
}

test('a plan contains no command text anywhere', () => {
  // The whole point of the plan/render split: this layer is data.
  const p = plan(['git', 'firefox', 'vlc', 'cursor', 'google-chrome'], UBUNTU);
  const serialised = JSON.stringify(p);
  for (const fragment of ['apt-get', 'sudo', 'pacman -', 'dnf install', 'command -v']) {
    assert.ok(!serialised.includes(fragment), `plan leaked command text: ${fragment}`);
  }
});

test('steps are ordered: refresh → installs → manual → verify', () => {
  const p = plan(['git', 'htop', 'cursor', 'vlc'], UBUNTU);
  const kinds = p.steps.map((s) => s.kind);
  const order = ['refresh-metadata', 'install', 'manual', 'verify'];
  const positions = kinds.map((k) => order.indexOf(k));
  assert.deepEqual(
    [...positions].sort((a, b) => a - b),
    positions,
    `steps out of order: ${kinds.join(' → ')}`,
  );
});

test('installs are grouped so each package manager runs once', () => {
  const p = plan(['git', 'htop', 'curl', 'gparted'], UBUNTU);
  const installSteps = p.steps.filter((s): s is InstallStep => s.kind === 'install');
  assert.equal(installSteps.length, 1, 'four APT packages should be one step');
  assert.deepEqual([...installSteps[0]!.identifiers].sort(), ['curl', 'git', 'gparted', 'htop']);
});

test('the native package manager is installed from before Flatpak and Snap', () => {
  const p = plan(['git', 'zoom', 'postman'], UBUNTU);
  const methods = p.steps
    .filter((s): s is InstallStep => s.kind === 'install')
    .map((s) => s.method);
  assert.equal(methods[0], 'apt');
  assert.ok(methods.slice(1).every((m) => m === 'flatpak' || m === 'snap'));
});

test('APT gets a metadata refresh; DNF and pacman do not', () => {
  // pacman refreshes as part of -Syu, and issuing a bare -Sy first would create
  // the partial-upgrade state Arch warns against. dnf refreshes itself.
  assert.ok(plan(['git'], UBUNTU).steps.some((s) => s.kind === 'refresh-metadata'));
  assert.ok(!plan(['git'], FEDORA).steps.some((s) => s.kind === 'refresh-metadata'));
  assert.ok(!plan(['git'], ARCH).steps.some((s) => s.kind === 'refresh-metadata'));
});

test('no refresh step when nothing uses the native package manager', () => {
  const p = plan(['postman'], UBUNTU); // Snap/Flatpak only
  assert.ok(!p.steps.some((s) => s.kind === 'refresh-metadata'));
});

test('privileged is derived from the method, and Flatpak is the unprivileged route', () => {
  const p = plan(['git', 'zoom'], UBUNTU);
  for (const step of p.steps) {
    if (step.kind !== 'install') continue;
    const expected = step.method !== 'flatpak';
    assert.equal(step.privileged, expected, `${step.method}`);
  }
  assert.ok(p.steps.every((s) => s.kind !== 'verify' || s.privileged === false));
});

test('the Flatpak step states its one precondition rather than generating repo setup', () => {
  const p = plan(['google-chrome'], UBUNTU);
  const flatpak = p.steps.find(
    (s): s is InstallStep => s.kind === 'install' && s.method === 'flatpak',
  );
  assert.ok(flatpak);
  assert.match(flatpak.note ?? '', /Flathub remote/);
});

test('manual steps are first-class plan steps, not dropped applications', () => {
  const p = plan(['git', 'cursor'], UBUNTU);
  const manual = p.steps.filter((s) => s.kind === 'manual');
  assert.equal(manual.length, 1);
  assert.ok(manual[0]!.kind === 'manual');
  assert.equal(manual[0].applicationId, 'cursor');
  assert.equal(manual[0].reason, 'official-download-only');
  assert.equal(manual[0].url, 'https://cursor.com/');
  assert.equal(manual[0].privileged, false);
});

test('unavailable applications are reported, never silently omitted', () => {
  const unknown: Application = {
    id: 'nothing',
    name: 'Nothing',
    description: 'No verified sources.',
    category: 'Utilities',
    homepage: 'https://example.com',
    installation: [],
  };
  const p = buildPlan(resolveAll([app('git'), unknown], UBUNTU), UBUNTU);
  assert.equal(p.unavailable.length, 1);
  assert.equal(p.unavailable[0]!.application.id, 'nothing');
  assert.ok(p.unavailable[0]!.explanation.length > 0);
});

test('verification covers only what the plan installs onto PATH', () => {
  // Flatpak installs put nothing predictable on PATH, so they are not verified.
  const p = plan(['google-chrome', 'git'], UBUNTU);
  const verify = p.steps.find((s) => s.kind === 'verify');
  assert.ok(verify && verify.kind === 'verify');
  assert.deepEqual(verify.applicationIds, ['git']);
  assert.deepEqual(verify.binaries, ['git']);
});

test('no verify step at all when nothing verifiable is installed', () => {
  assert.ok(!plan(['cursor'], UBUNTU).steps.some((s) => s.kind === 'verify'));
  assert.ok(!plan(['google-chrome'], UBUNTU).steps.some((s) => s.kind === 'verify'));
});

test('an empty selection produces an empty plan rather than an error', () => {
  const p = buildPlan([], UBUNTU);
  assert.deepEqual(p.steps, []);
  assert.deepEqual(p.unavailable, []);
  assert.equal(p.environment.distro, 'Ubuntu');
});

test('the plan is deterministic for a given selection and environment', () => {
  const ids = ['vlc', 'git', 'cursor', 'postman', 'google-chrome'];
  assert.equal(JSON.stringify(plan(ids, UBUNTU)), JSON.stringify(plan(ids, UBUNTU)));
});

test('the whole catalog plans cleanly on every distribution', () => {
  for (const environment of [UBUNTU, createEnvironment('Debian'), FEDORA, ARCH]) {
    const p = buildPlan(resolveAll(APPLICATIONS, environment), environment);
    const accounted =
      p.steps
        .filter((s): s is InstallStep => s.kind === 'install')
        .reduce((n, s) => n + s.applicationIds.length, 0) +
      p.steps.filter((s) => s.kind === 'manual').length +
      p.unavailable.length;
    assert.equal(
      accounted,
      APPLICATIONS.length,
      `${environment.distro}: ${accounted} of ${APPLICATIONS.length} applications accounted for`,
    );
  }
});
