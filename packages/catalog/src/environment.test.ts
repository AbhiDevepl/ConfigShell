import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  createEnvironment,
  distrosForEcosystem,
  ecosystemForDistro,
  isArchitecture,
  isDistro,
  parseEnvironment,
} from './environment.ts';
import { DISTROS, ECOSYSTEM_DISTROS, PACKAGE_ECOSYSTEMS } from './types.ts';

test('every distribution maps to exactly one ecosystem', () => {
  for (const distro of DISTROS) {
    const ecosystem = ecosystemForDistro(distro);
    assert.ok(PACKAGE_ECOSYSTEMS.includes(ecosystem), `${distro} → ${ecosystem}`);
    assert.ok(
      ECOSYSTEM_DISTROS[ecosystem].includes(distro),
      `${distro} → ${ecosystem} is not reflected back in ECOSYSTEM_DISTROS`,
    );
  }
});

test('the distro↔ecosystem mapping covers every distribution and nothing else', () => {
  const mapped = PACKAGE_ECOSYSTEMS.flatMap((e) => [...distrosForEcosystem(e)]);
  assert.deepEqual([...mapped].sort(), [...DISTROS].sort());
});

test('createEnvironment derives the ecosystem rather than accepting one', () => {
  assert.deepEqual(createEnvironment('Ubuntu'), {
    os: 'linux',
    distro: 'Ubuntu',
    ecosystem: 'apt',
  });
  assert.deepEqual(createEnvironment('Arch Linux', 'aarch64'), {
    os: 'linux',
    distro: 'Arch Linux',
    ecosystem: 'pacman',
    architecture: 'aarch64',
  });
});

test('parseEnvironment accepts a minimal valid input and defaults the OS', () => {
  const result = parseEnvironment({ distro: 'Fedora' });
  assert.ok(result.ok);
  assert.deepEqual(result.environment, { os: 'linux', distro: 'Fedora', ecosystem: 'dnf' });
});

test('parseEnvironment ignores a caller-supplied ecosystem', () => {
  // The important case: a caller must not be able to pair Arch Linux with apt.
  const result = parseEnvironment({ distro: 'Arch Linux', ecosystem: 'apt' });
  assert.ok(result.ok);
  assert.equal(result.environment.ecosystem, 'pacman');
});

test('parseEnvironment rejects unknown values rather than coercing them', () => {
  for (const input of [
    { distro: 'Gentoo' },
    { distro: 'ubuntu' }, // case-sensitive on purpose
    { distro: 'Ubuntu', os: 'windows' },
    { distro: 'Ubuntu', architecture: 'riscv64' },
    {},
    null,
    'Ubuntu',
    ['Ubuntu'],
    42,
  ]) {
    const result = parseEnvironment(input);
    assert.equal(result.ok, false, `expected ${JSON.stringify(input)} to be rejected`);
  }
});

test('parseEnvironment reports every problem at once', () => {
  const result = parseEnvironment({ distro: 'Gentoo', os: 'windows', architecture: 'riscv64' });
  assert.equal(result.ok, false);
  assert.ok(!result.ok);
  assert.deepEqual(
    result.errors.map((e) => e.field).sort(),
    ['architecture', 'distro', 'os'],
  );
});

test('type guards accept only catalog values', () => {
  assert.ok(isDistro('Debian'));
  assert.ok(!isDistro('debian'));
  assert.ok(!isDistro(undefined));
  assert.ok(isArchitecture('x86_64'));
  assert.ok(!isArchitecture('amd64'));
});
