import assert from 'node:assert/strict';
import { test } from 'node:test';
import { APPLICATIONS } from './applications.ts';
import { findApplication, searchApplications } from './query.ts';

test('findApplication returns the entry for a known id and undefined otherwise', () => {
  assert.equal(findApplication('git')?.name, 'Git');
  assert.equal(findApplication('no-such-app'), undefined);
  assert.equal(findApplication(''), undefined);
});

test('an empty search returns the whole catalog, in catalog order', () => {
  assert.deepEqual(searchApplications(), APPLICATIONS);
  assert.deepEqual(searchApplications({ query: '   ' }), APPLICATIONS);
});

test('search matches id, name, description and category, case-insensitively', () => {
  const ids = (q: string) => searchApplications({ query: q }).map((a) => a.id);
  assert.ok(ids('vscode').includes('vscode'), 'id match');
  assert.ok(ids('Visual Studio').includes('vscode'), 'name match');
  assert.ok(ids('VERSION CONTROL').includes('git'), 'description match, case-insensitive');
  assert.ok(ids('browsers').length >= 3, 'category match');
});

test('category filtering is exact and composes with the query', () => {
  const browsers = searchApplications({ category: 'Browsers' });
  assert.ok(browsers.length > 0);
  assert.ok(browsers.every((a) => a.category === 'Browsers'));

  const narrowed = searchApplications({ category: 'Browsers', query: 'firefox' });
  assert.deepEqual(
    narrowed.map((a) => a.id),
    ['firefox'],
  );

  assert.deepEqual(searchApplications({ category: 'Browsers', query: 'git' }), []);
});

test('search is a pure filter — it never mutates or reorders the catalog', () => {
  const before = APPLICATIONS.map((a) => a.id);
  searchApplications({ query: 'a' });
  assert.deepEqual(
    APPLICATIONS.map((a) => a.id),
    before,
  );
});
