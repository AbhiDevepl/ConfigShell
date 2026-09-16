/**
 * Read-only queries over the catalog.
 *
 * Lives here rather than in a consumer so the web app, the API server and any
 * future CLI all answer "which applications match this?" the same way. Pure
 * functions over the passed-in list — no I/O, no module-level state, and the
 * catalog is never mutated.
 */

import { APPLICATIONS } from './applications.ts';
import type { Application, Category } from './types.ts';

/**
 * One application by id. `undefined` for an unknown id — callers decide whether
 * that is a 404, a validation error, or a skipped entry.
 */
export function findApplication(id: string): Application | undefined {
  return APPLICATIONS.find((app) => app.id === id);
}

export interface SearchOptions {
  /** Free text matched against id, name, description and category. */
  query?: string;
  /** Exact category filter, applied in addition to `query`. */
  category?: Category;
}

/**
 * Search and filter, preserving catalog order so results are deterministic.
 *
 * Matching is a case-insensitive substring over id, name, description and
 * category. `id` is included so `vscode` finds Visual Studio Code — the web
 * app's current search does not check it, and that gap is a known one.
 * Aliases and tags are a separate, later catalog addition (PRD §14); nothing
 * here pretends they exist.
 */
export function searchApplications(options: SearchOptions = {}): readonly Application[] {
  const query = options.query?.trim().toLowerCase() ?? '';
  const { category } = options;

  return APPLICATIONS.filter((app) => {
    if (category !== undefined && app.category !== category) return false;
    if (query === '') return true;
    return (
      app.id.toLowerCase().includes(query) ||
      app.name.toLowerCase().includes(query) ||
      app.description.toLowerCase().includes(query) ||
      app.category.toLowerCase().includes(query)
    );
  });
}
