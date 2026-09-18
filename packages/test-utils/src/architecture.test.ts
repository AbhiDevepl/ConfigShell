/**
 * The dependency direction, enforced.
 *
 * ConfigShell's architecture doc claims a one-way graph. A claim a test does
 * not check is a comment, and comments do not fail CI — so this reads the
 * workspace manifests and the imports themselves.
 *
 * It lives here because `packages/test-utils` is the only workspace that
 * depends on nothing: a test asserting "nobody may depend upwards" should not
 * itself have to depend on the things it is policing.
 */

import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join, sep } from 'node:path';
import { test } from 'node:test';

const REPO_ROOT = join(new URL('.', import.meta.url).pathname, '..', '..', '..');

/**
 * Layers, lowest first. A workspace may depend on its own layer or below, and
 * never above.
 *
 *   catalog        the trusted data and the domain model — depends on nothing
 *     ↓
 *   installer      resolution, planning, command generation
 *     ↓
 *   server / mcp   adapters that expose the core over a protocol
 *     ↓
 *   contract-tests cross-adapter tests — depends on both, ships nothing
 *
 * `web` is likewise beside the adapters rather than above `installer`: it may
 * use the catalog only. Command generation must not reach the browser.
 */
type WorkspaceName =
  | '@configshell/test-utils'
  | '@configshell/catalog'
  | '@configshell/installer'
  | '@configshell/mcp'
  | 'server'
  | 'web'
  | '@configshell/contract-tests';

interface Manifest {
  name: string;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
}

const LAYER: Record<WorkspaceName, number> = {
  '@configshell/test-utils': 0,
  '@configshell/catalog': 1,
  '@configshell/installer': 2,
  '@configshell/mcp': 3,
  server: 3,
  web: 3,
  // Above the adapters on purpose: it exists to compare them, so it is the one
  // workspace allowed to depend on more than one. Test-only; ships nothing.
  '@configshell/contract-tests': 4,
};

/**
 * Edges that must never exist, regardless of layering.
 *
 * Same-layer dependencies are otherwise allowed, so this one is stated
 * outright — it is a security boundary, not an architectural preference.
 *
 * A second edge lived here until `packages/ai` was removed as empty
 * scaffolding: an AI layer emits application ids, never commands, so it must
 * never reach `installer`. Reinstate that rule alongside the workspace when
 * there is AI code to constrain.
 */
const FORBIDDEN_EDGES = [
  {
    from: 'web',
    to: '@configshell/installer',
    why: 'apps/web must reach resolution through the API; command generation must not enter the browser bundle',
  },
];

function layerOf(name: string): number | undefined {
  return (LAYER as Record<string, number>)[name];
}

function manifests(): Manifest[] {
  return ['apps', 'packages'].flatMap((group) =>
    readdirSync(join(REPO_ROOT, group))
      .map((name) => join(REPO_ROOT, group, name, 'package.json'))
      .filter((path) => {
        try {
          readFileSync(path);
          return true;
        } catch {
          return false;
        }
      })
      .map((path) => JSON.parse(readFileSync(path, 'utf8')) as Manifest),
  );
}

function workspaceDeps(manifest: Manifest): string[] {
  return Object.keys({
    ...(manifest.dependencies ?? {}),
    ...(manifest.devDependencies ?? {}),
  }).filter((name) => name.startsWith('@configshell/'));
}

test('every workspace is placed in the layer model', () => {
  // A new package must be assigned a layer deliberately, not default into one.
  for (const manifest of manifests()) {
    assert.ok(
      layerOf(manifest.name) !== undefined,
      `${manifest.name} has no layer — add it to LAYER and justify where it sits`,
    );
  }
});

test('no workspace depends on a higher layer', () => {
  const violations: string[] = [];
  for (const manifest of manifests()) {
    const from = layerOf(manifest.name);
    if (from === undefined) continue;
    for (const dep of workspaceDeps(manifest)) {
      const to = layerOf(dep);
      if (to === undefined) continue;
      if (to > from) violations.push(`${manifest.name} (${from}) -> ${dep} (${to})`);
    }
  }
  assert.deepEqual(violations, [], 'dependency direction is upward somewhere');
});

test('the dependency graph is acyclic', () => {
  const graph = new Map(manifests().map((m) => [m.name, workspaceDeps(m)]));
  const state = new Map<string, 'open' | 'done'>();

  const visit = (name: string, trail: string[]): void => {
    if (state.get(name) === 'done') return;
    assert.ok(state.get(name) !== 'open', `cycle: ${[...trail, name].join(' -> ')}`);
    state.set(name, 'open');
    for (const dep of graph.get(name) ?? []) visit(dep, [...trail, name]);
    state.set(name, 'done');
  };

  for (const name of graph.keys()) visit(name, []);
});

test('the catalog depends on nothing — it is the bottom of the graph', () => {
  const catalog = manifests().find((m) => m.name === '@configshell/catalog');
  assert.ok(catalog);
  assert.deepEqual(workspaceDeps(catalog), [], 'the trusted data package must stay dependency-free');
});

test('forbidden edges do not exist', () => {
  // The two security boundaries that layering alone would not catch, since both
  // would otherwise be legal same-or-lower-layer dependencies.
  const all = manifests();
  for (const edge of FORBIDDEN_EDGES) {
    const manifest = all.find((m) => m.name === edge.from);
    if (!manifest) continue; // the package may not exist yet
    assert.ok(
      !workspaceDeps(manifest).includes(edge.to),
      `${edge.from} must not depend on ${edge.to} — ${edge.why}`,
    );
  }
});

test('only the installer knows package-manager command syntax', () => {
  // The point of the ecosystem abstraction: adding a package manager should
  // touch one package. If `apt install` appears anywhere else, that has broken.
  const forbidden = ['apt-get install', 'dnf install', 'pacman -S', 'zypper install'];
  const allowed = join('packages', 'installer');

  const offenders: string[] = [];
  const walk = (dir: string): void => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (entry.name === 'node_modules' || entry.name === 'dist' || entry.name.startsWith('.')) {
        continue;
      }
      const full = join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full);
        continue;
      }
      if (!/\.(ts|tsx|js)$/.test(entry.name) || entry.name.includes('.test.')) continue;
      if (full.includes(allowed)) continue;

      const source = readFileSync(full, 'utf8')
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/(^|[^:])\/\/.*$/gm, '$1');
      for (const fragment of forbidden) {
        if (source.includes(fragment)) offenders.push(`${full.split(sep).slice(-3).join(sep)}: ${fragment}`);
      }
    }
  };
  for (const group of ['apps', 'packages']) walk(join(REPO_ROOT, group));

  assert.deepEqual(offenders, [], 'package-manager syntax escaped packages/installer');
});
