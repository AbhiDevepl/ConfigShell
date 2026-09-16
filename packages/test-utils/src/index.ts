/**
 * Helpers for the structural safety tests.
 *
 * Three workspaces assert the same class of property — that a package contains
 * no way to execute a command, no package-manager vocabulary, no filesystem or
 * socket access. Each did it by walking its own source tree and stripping its
 * own comments, so the walk existed three times.
 *
 * **Test-only.** Nothing here ships; no workspace depends on it outside
 * `devDependencies`.
 */

import assert from 'node:assert/strict';
import { readdirSync } from 'node:fs';
import { join, sep } from 'node:path';

/**
 * Every source file under `dir`, recursively, as absolute paths.
 *
 * Throws if the walk finds nothing: a structural test whose scan came back
 * empty would assert over no files and pass vacuously, which is worse than
 * failing.
 *
 * @param matches decides which filenames count as source — each workspace has
 *   its own extensions and its own test-file convention to exclude.
 */
export function sourceFiles(dir: string, matches: (name: string) => boolean): string[] {
  const entries = readdirSync(dir, { recursive: true, encoding: 'utf8' }).filter(
    (entry) =>
      // `recursive` descends into node_modules and dotfile directories.
      !entry.split(sep).some((part) => part === 'node_modules' || part.startsWith('.')) &&
      matches(entry),
  );

  assert.ok(entries.length > 0, `expected source files under ${dir}, found none`);
  return entries.map((entry) => join(dir, entry));
}

/**
 * Remove comments so a scan can tell code from prose about the code.
 *
 * These tests forbid fragments like `child_process` that the files themselves
 * legitimately discuss in their own documentation. A check that cannot tell the
 * two apart is not much of a guarantee.
 */
export function stripComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
}
