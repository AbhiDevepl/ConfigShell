import assert from 'node:assert/strict';
import { test } from 'node:test';
import { APPLICATIONS, createEnvironment, findApplication } from '@configshell/catalog';
import type { Application, Environment } from '@configshell/catalog';
import { resolve, resolveAll } from './resolve.ts';

const UBUNTU = createEnvironment('Ubuntu');
const DEBIAN = createEnvironment('Debian');
const FEDORA = createEnvironment('Fedora');
const ARCH = createEnvironment('Arch Linux');

function app(id: string): Application {
  const entry = findApplication(id);
  assert.ok(entry, `catalog is missing ${id}`);
  return entry;
}

function chosen(id: string, env: Environment): string {
  const r = resolve(app(id), env);
  assert.equal(r.outcome, 'resolved', `${id} on ${env.distro}: ${JSON.stringify(r.outcome)}`);
  assert.ok(r.outcome === 'resolved');
  return `${r.source.method}:${r.source.identifier}`;
}

test('the distribution’s own repository wins over every add-on route', () => {
  // Firefox has apt, dnf, pacman, flatpak and snap routes. The native one wins.
  assert.equal(chosen('firefox', DEBIAN), 'apt:firefox-esr');
  assert.equal(chosen('firefox', FEDORA), 'dnf:firefox');
  assert.equal(chosen('firefox', ARCH), 'pacman:firefox');
  assert.equal(chosen('git', UBUNTU), 'apt:git');
});

test('a vendor repository is never silently used, but a usable route still wins', () => {
  // Google Chrome's only apt/dnf routes are Google's own repository, which
  // ConfigShell will not set up. It does have a Flathub package, so it still
  // resolves — to that, with the third-party packaging stated out loud rather
  // than to Google's repo behind the user's back.
  for (const env of [UBUNTU, DEBIAN, FEDORA]) {
    const r = resolve(app('google-chrome'), env);
    assert.equal(r.outcome, 'resolved', `${env.distro}`);
    assert.ok(r.outcome === 'resolved');
    assert.equal(r.source.method, 'flatpak');
    assert.match(r.reason, /third party, not the vendor/);

    // The vendor apt/dnf source was seen, ranked out, and the reason recorded.
    const vendorSource = r.considered.find((c) => c.source.origin === 'vendor');
    assert.ok(vendorSource);
    assert.equal(vendorSource.rank, null);
    assert.match(vendorSource.note, /repository|package manager/);
  }
});

test('an application whose only route needs a vendor repository becomes a manual step', () => {
  const vendorOnly: Application = {
    id: 'vendor-only',
    name: 'Vendor Only',
    description: 'Only available from the vendor’s own apt repository.',
    category: 'General',
    homepage: 'https://example.com',
    installation: [
      {
        method: 'apt',
        identifier: 'vendor-only',
        origin: 'vendor',
        distros: ['Ubuntu', 'Debian'],
        url: 'https://example.com/install',
      },
    ],
  };
  const r = resolve(vendorOnly, UBUNTU);
  assert.equal(r.outcome, 'manual');
  assert.ok(r.outcome === 'manual');
  assert.equal(r.reason, 'repository-setup-required');
  assert.equal(r.url, 'https://example.com/install');
  assert.match(r.explanation, /does not generate repository-setup commands/);
});

test('the generated route never requires a repository the user has not added', () => {
  // The property that matters, across the whole catalog and every distribution.
  for (const environment of [UBUNTU, DEBIAN, FEDORA, ARCH]) {
    for (const entry of APPLICATIONS) {
      const r = resolve(entry, environment);
      if (r.outcome !== 'resolved') continue;
      const { method, origin } = r.source;
      if (['apt', 'dnf', 'pacman'].includes(method)) {
        assert.equal(
          origin,
          'distro',
          `${entry.id} on ${environment.distro} resolved to a ${origin} ${method} source, ` +
            `which needs a third-party repository`,
        );
      }
    }
  }
});

test('a resolved native source is always the environment’s own package manager', () => {
  for (const environment of [UBUNTU, DEBIAN, FEDORA, ARCH]) {
    for (const entry of APPLICATIONS) {
      const r = resolve(entry, environment);
      if (r.outcome !== 'resolved') continue;
      if (!['apt', 'dnf', 'pacman'].includes(r.source.method)) continue;
      assert.equal(r.source.method, environment.ecosystem, `${entry.id} on ${environment.distro}`);
      assert.ok(
        r.source.distros?.includes(environment.distro),
        `${entry.id}: ${r.source.method} source not verified for ${environment.distro}`,
      );
    }
  }
});

test('deliberate catalog omissions surface honestly, not as silent drops', () => {
  // VLC is not in Fedora's own repositories (codec licensing), and RPM Fusion
  // is a third-party repo the catalog deliberately does not record.
  const vlc = resolve(app('vlc'), FEDORA);
  assert.equal(vlc.outcome, 'resolved');
  assert.ok(vlc.outcome === 'resolved');
  // VideoLAN publishes the Snap; the Flathub package is a third-party
  // repackaging. The vendor-published route is preferred over the community one.
  assert.equal(vlc.source.method, 'snap', 'VLC on Fedora should fall back to the vendor Snap');
  assert.equal(vlc.source.origin, 'vendor');

  // Cursor is an official download only — a manual step, never a fake command.
  const cursor = resolve(app('cursor'), UBUNTU);
  assert.equal(cursor.outcome, 'manual');
  assert.ok(cursor.outcome === 'manual');
  assert.equal(cursor.reason, 'official-download-only');
  assert.equal(cursor.url, 'https://cursor.com/');
});

test('AUR-only applications are not resolved to pacman on Arch', () => {
  // Chrome, Brave, Sublime, Postman, Slack and Zoom are AUR-only; the AUR is
  // not an official repository and the catalog records no pacman source.
  for (const id of ['google-chrome', 'brave', 'sublime-text', 'postman', 'slack', 'zoom']) {
    const r = resolve(app(id), ARCH);
    if (r.outcome === 'resolved') {
      assert.notEqual(r.source.method, 'pacman', `${id} must not resolve to pacman on Arch`);
    }
  }
});

test('an application with no sources at all is unavailable, with a reason', () => {
  const empty: Application = {
    id: 'nothing',
    name: 'Nothing',
    description: 'An application with no verified sources.',
    category: 'General',
    homepage: 'https://example.com',
    installation: [],
  };
  const r = resolve(empty, UBUNTU);
  assert.equal(r.outcome, 'unavailable');
  assert.ok(r.outcome === 'unavailable');
  assert.equal(r.reason, 'no-verified-source');
  assert.match(r.explanation, /has been verified/i);
});

test('an application verified only for other distributions is unavailable here', () => {
  const debianOnly: Application = {
    id: 'debian-only',
    name: 'Debian Only',
    description: 'Verified for Debian alone.',
    category: 'General',
    homepage: 'https://example.com',
    installation: [
      { method: 'apt', identifier: 'debian-only', origin: 'distro', distros: ['Debian'] },
    ],
  };
  const r = resolve(debianOnly, UBUNTU);
  assert.equal(r.outcome, 'unavailable');
  assert.ok(r.outcome === 'unavailable');
  assert.equal(r.reason, 'no-source-for-environment');
});

test('every resolution explains itself and records what it considered', () => {
  for (const environment of [UBUNTU, DEBIAN, FEDORA, ARCH]) {
    for (const entry of APPLICATIONS) {
      const r = resolve(entry, environment);
      const text = r.outcome === 'resolved' ? r.reason : r.explanation;
      assert.ok(text.length > 0, `${entry.id} on ${environment.distro} gave no explanation`);
      assert.equal(r.considered.length, entry.installation.length);
      for (const c of r.considered) {
        assert.ok(c.note.length > 0, `${entry.id}: a considered source has no note`);
      }
    }
  }
});

test('resolution is deterministic and order-preserving', () => {
  const selection = [app('git'), app('firefox'), app('cursor')];
  const once = resolveAll(selection, UBUNTU);
  const twice = resolveAll(selection, UBUNTU);
  assert.deepEqual(
    once.map((r) => [r.application.id, r.outcome]),
    twice.map((r) => [r.application.id, r.outcome]),
  );
  assert.deepEqual(
    once.map((r) => r.application.id),
    ['git', 'firefox', 'cursor'],
  );
});

test('every catalog application resolves to a stated outcome on every distribution', () => {
  // No holes: 31 applications × 4 distributions, all accounted for.
  for (const environment of [UBUNTU, DEBIAN, FEDORA, ARCH]) {
    for (const entry of APPLICATIONS) {
      const r = resolve(entry, environment);
      assert.ok(
        ['resolved', 'manual', 'unavailable'].includes(r.outcome),
        `${entry.id} on ${environment.distro}`,
      );
    }
  }
});
