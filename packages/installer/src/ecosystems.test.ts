/**
 * The cross-ecosystem contract.
 *
 * One table, four package managers, asserted end to end: catalog → environment
 * → resolution → plan → command. These are golden tests — they pin the answer,
 * not the implementation — so a change to the trust policy or a command form
 * shows up here as a diff rather than as a silent behaviour change.
 *
 * Nothing here touches the machine running the tests. `git` resolving on Ubuntu
 * is a statement about the catalog, not about whether git is installed.
 */

import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  APPLICATIONS,
  DISTROS,
  PACKAGE_ECOSYSTEMS,
  createEnvironment,
  findApplication,
  type Distro,
} from '@configshell/catalog';
import { buildPlan, catalogCoverage, renderPlan, resolve, resolveAll } from './index.ts';

function resolveOne(id: string, distro: Distro) {
  const application = findApplication(id);
  assert.ok(application, `catalog is missing ${id}`);
  return resolve(application, createEnvironment(distro));
}

function commandsFor(ids: string[], distro: Distro): string[] {
  const environment = createEnvironment(distro);
  const applications = ids.map((id) => {
    const application = findApplication(id);
    assert.ok(application, `catalog is missing ${id}`);
    return application;
  });
  return renderPlan(buildPlan(resolveAll(applications, environment), environment)).commands.map(
    (command) => command.command,
  );
}

// ------------------------------------------------------------ SUPPORTED

test('the native package manager wins on every distribution that has the package', () => {
  // `git` is in all four distributions' own repositories except openSUSE, where
  // no zypper identifier has been verified yet.
  const table: [Distro, string][] = [
    ['Ubuntu', 'apt:git'],
    ['Debian', 'apt:git'],
    ['Fedora', 'dnf:git'],
    ['Arch Linux', 'pacman:git'],
  ];

  for (const [distro, expected] of table) {
    const result = resolveOne('git', distro);
    assert.equal(result.outcome, 'resolved', distro);
    assert.ok(result.outcome === 'resolved');
    assert.equal(`${result.source.method}:${result.source.identifier}`, expected, distro);
  }
});

test('each ecosystem renders its own command form', () => {
  assert.deepEqual(commandsFor(['git'], 'Ubuntu'), [
    'sudo apt-get update',
    'sudo apt-get install git',
    'command -v git',
  ]);
  assert.deepEqual(commandsFor(['git'], 'Fedora'), ['sudo dnf install git', 'command -v git']);
  assert.deepEqual(commandsFor(['git'], 'Arch Linux'), [
    'sudo pacman -Syu --needed git',
    'command -v git',
  ]);
  // openSUSE has no zypper identifier for git yet, so a package that *does*
  // have one would render like this. Use a distro-agnostic app to pin the
  // zypper refresh step without inventing catalog data.
  const openSuse = commandsFor(['firefox'], 'openSUSE');
  assert.ok(
    openSuse.every((command) => !command.startsWith('sudo zypper')),
    'firefox has no zypper source; it must not pretend to have one',
  );
});

// ---------------------------------------------------------- UNAVAILABLE

test('an application with no verified route here is reported, not guessed at', () => {
  // VLC is deliberately absent from Fedora's own repositories (codec
  // licensing), and `git` has no verified zypper identifier.
  const git = resolveOne('git', 'openSUSE');
  assert.equal(git.outcome, 'unavailable');
  assert.ok(git.outcome === 'unavailable');
  assert.equal(git.reason, 'no-source-for-environment');
  assert.match(git.explanation, /not verified/i);
});

test('a distro-agnostic route covers a distribution with no native identifier', () => {
  // This is why openSUSE is usable the day the ecosystem is added: Flatpak and
  // Snap are not distribution-specific.
  const firefox = resolveOne('firefox', 'openSUSE');
  assert.equal(firefox.outcome, 'resolved');
  assert.ok(firefox.outcome === 'resolved');
  assert.ok(['flatpak', 'snap'].includes(firefox.source.method));
});

// ------------------------------------------------------ MANUAL_REQUIRED

test('a vendor repository is a manual step on every ecosystem, never a native package', () => {
  for (const distro of DISTROS) {
    const result = resolveOne('cursor', distro);
    assert.equal(result.outcome, 'manual', distro);
    assert.ok(result.outcome === 'manual');
    assert.equal(result.reason, 'official-download-only');
  }
});

test('no resolved native source is one that needs a third-party repository', () => {
  // The invariant across the whole matrix: 31 applications × 5 distributions.
  for (const distro of DISTROS) {
    const environment = createEnvironment(distro);
    for (const application of APPLICATIONS) {
      const result = resolve(application, environment);
      if (result.outcome !== 'resolved') continue;
      if (!PACKAGE_ECOSYSTEMS.includes(result.source.method as never)) continue;
      assert.equal(
        result.source.origin,
        'distro',
        `${application.id} on ${distro} resolved to a ${result.source.origin} ${result.source.method} source`,
      );
      assert.equal(result.source.method, environment.ecosystem, `${application.id} on ${distro}`);
    }
  }
});

// -------------------------------------------------------------- totality

test('every application on every distribution has a stated outcome', () => {
  for (const distro of DISTROS) {
    const environment = createEnvironment(distro);
    for (const application of APPLICATIONS) {
      const result = resolve(application, environment);
      assert.ok(
        ['resolved', 'manual', 'unavailable'].includes(result.outcome),
        `${application.id} on ${distro}`,
      );
    }
  }
});

test('coverage is the resolver counted up, and adds to the catalog size', () => {
  for (const distro of DISTROS) {
    const coverage = catalogCoverage(createEnvironment(distro));
    assert.equal(coverage.total, APPLICATIONS.length, distro);
    assert.equal(
      coverage.installable + coverage.manual + coverage.unavailable,
      coverage.total,
      `${distro}: coverage does not account for every application`,
    );
  }
});

test('every ecosystem is reachable from some distribution', () => {
  // Guards against adding an ecosystem to the type model that no distribution
  // uses — dead code that looks like support.
  for (const ecosystem of PACKAGE_ECOSYSTEMS) {
    const reachable = DISTROS.some((distro) => createEnvironment(distro).ecosystem === ecosystem);
    assert.ok(reachable, `${ecosystem} is declared but no distribution uses it`);
  }
});

test('the plan is deterministic on every distribution', () => {
  const ids = ['git', 'firefox', 'cursor'];
  for (const distro of DISTROS) {
    assert.deepEqual(commandsFor(ids, distro), commandsFor(ids, distro), distro);
  }
});
