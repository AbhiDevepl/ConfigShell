import assert from 'node:assert/strict';
import { test } from 'node:test';
import { APPLICATIONS } from './applications.ts';
import { ROLES, applicationsForRole, findRole, validateRoles, type Role } from './roles.ts';

test('the real presets are valid', () => {
  assert.deepEqual(validateRoles(), []);
});

test('every id a preset names exists in the catalog', () => {
  // The failure this guards against is silent: a preset naming a removed
  // application would just quietly select fewer things.
  const catalogIds = new Set(APPLICATIONS.map((a) => a.id));
  for (const role of ROLES) {
    for (const id of [...role.recommended, ...role.optional]) {
      assert.ok(catalogIds.has(id), `${role.id} names "${id}", which is not in the catalog`);
    }
  }
});

test('presets are non-trivial and distinct', () => {
  assert.ok(ROLES.length >= 4, `expected several roles, got ${ROLES.length}`);
  const ids = ROLES.map((r) => r.id);
  assert.equal(new Set(ids).size, ids.length, 'duplicate role ids');

  const signatures = ROLES.map((r) => [...r.recommended].sort().join(','));
  assert.equal(new Set(signatures).size, signatures.length, 'two roles recommend the same set');
});

test('no application is both recommended and optional within one role', () => {
  for (const role of ROLES) {
    const overlap = role.recommended.filter((id) => role.optional.includes(id));
    assert.deepEqual(overlap, [], `${role.id}: ${overlap.join(', ')} appears twice`);
  }
});

test('applicationsForRole returns catalog entries in catalog order', () => {
  const role = findRole('web-developer');
  assert.ok(role);

  const recommended = applicationsForRole(role);
  assert.deepEqual(
    recommended.map((a) => a.id).sort(),
    [...role.recommended].sort(),
  );

  const catalogOrder = APPLICATIONS.map((a) => a.id);
  const positions = recommended.map((a) => catalogOrder.indexOf(a.id));
  assert.deepEqual([...positions].sort((a, b) => a - b), positions, 'not in catalog order');

  assert.equal(
    applicationsForRole(role, 'all').length,
    role.recommended.length + role.optional.length,
  );
});

test('findRole returns undefined for an unknown id', () => {
  assert.equal(findRole('no-such-role'), undefined);
});

test('validateRoles rejects a preset naming an application that does not exist', () => {
  const broken: Role = {
    id: 'broken',
    name: 'Broken',
    description: 'Names something that is not in the catalog.',
    recommended: ['git', 'definitely-not-in-the-catalog'],
    optional: [],
  };
  const errors = validateRoles([broken]);
  assert.equal(errors.length, 1);
  assert.match(errors[0]!, /not in the catalog/);
});

test('validateRoles rejects malformed, empty and duplicate presets', () => {
  const base: Role = {
    id: 'ok',
    name: 'Ok',
    description: 'Fine.',
    recommended: ['git'],
    optional: [],
  };
  assert.ok(validateRoles([{ ...base, id: 'Not A Slug' }]).length > 0);
  assert.ok(validateRoles([{ ...base, name: '  ' }]).length > 0);
  assert.ok(validateRoles([{ ...base, description: '' }]).length > 0);
  assert.ok(validateRoles([{ ...base, recommended: [] }]).length > 0);
  assert.ok(validateRoles([base, base]).length > 0);
  assert.ok(validateRoles([{ ...base, optional: ['git'] }]).length > 0);
});
