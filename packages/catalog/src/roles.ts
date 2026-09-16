/**
 * Role / use-case presets (PRD §15).
 *
 * A preset is a **curated list of catalog ids** and nothing else — no scoring,
 * no heuristics, and emphatically no model. Picking "Web Developer" selects a
 * fixed, reviewable set of applications that a contributor can argue with in a
 * pull request, which is the whole point: a recommendation nobody can inspect
 * is worse than no recommendation.
 *
 * Presets are a *starting point*, never a decision. The user sees exactly what
 * was chosen and can add or remove anything (PRD §19).
 *
 * ## Why these roles and not the PRD's full list
 *
 * PRD §15 also names *AI/ML Developer*, *Designer* and *Video Editor*. The
 * catalog has no applications that would honestly serve them — no Python
 * toolchain, no Inkscape or Krita, no Kdenlive — so those roles are **omitted
 * rather than filled with loosely related entries**. It is the same rule the
 * catalog applies to package identifiers: absence means "not verified yet", and
 * a thin preset would be worse than none. Add the applications first, then the
 * role.
 */

import { APPLICATIONS } from './applications.ts';
import type { Application } from './types.ts';

export interface Role {
  /** Stable lowercase slug. */
  id: string;
  name: string;
  /** One line, in the user's terms — what they do, not what they install. */
  description: string;
  /**
   * Applications selected when the role is chosen. Every id must exist in the
   * catalog; `validateRoles` enforces it.
   */
  recommended: readonly string[];
  /**
   * Offered alongside, unselected. The distinction is honest rather than
   * decorative: `recommended` is "you almost certainly want this for this kind
   * of work", `optional` is "plenty of people doing this want it".
   */
  optional: readonly string[];
}

export const ROLES: readonly Role[] = [
  {
    id: 'general',
    name: 'General use',
    description: 'Browsing, email, media and everyday desktop tasks.',
    recommended: ['firefox', 'vlc', 'thunderbird', 'flameshot'],
    optional: ['gimp', 'timeshift', 'telegram-desktop', 'discord', 'gparted'],
  },
  {
    id: 'student',
    name: 'Student',
    description: 'Coursework, note-taking, reading and the occasional group call.',
    recommended: ['firefox', 'vscode', 'git', 'vlc', 'thunderbird'],
    optional: ['gimp', 'flameshot', 'zoom', 'obs-studio', 'timeshift'],
  },
  {
    id: 'developer',
    name: 'Developer',
    description: 'General software development — editor, version control, terminal tools.',
    recommended: ['git', 'vscode', 'curl', 'htop', 'neovim'],
    optional: ['docker', 'github-cli', 'dbeaver', 'firefox', 'flameshot'],
  },
  {
    id: 'web-developer',
    name: 'Web developer',
    description: 'Front-end and full-stack work — Node.js, browsers, API and database tools.',
    recommended: ['git', 'vscode', 'nodejs', 'firefox', 'curl'],
    optional: ['docker', 'postman', 'insomnia', 'dbeaver', 'github-cli', 'google-chrome'],
  },
  {
    id: 'devops',
    name: 'DevOps',
    description: 'Containers, servers and system tooling.',
    recommended: ['git', 'docker', 'curl', 'htop', 'neovim'],
    optional: ['github-cli', 'vscode', 'timeshift', 'gparted'],
  },
] as const;

/** One role by id. `undefined` for an unknown id. */
export function findRole(id: string): Role | undefined {
  return ROLES.find((role) => role.id === id);
}

/**
 * The applications a role names, in catalog order.
 *
 * Returns catalog entries rather than ids so a caller never has to look them up
 * again — and so an id that has fallen out of the catalog cannot silently
 * become an empty card in the UI.
 */
export function applicationsForRole(
  role: Role,
  which: 'recommended' | 'optional' | 'all' = 'recommended',
): readonly Application[] {
  const ids = new Set(
    which === 'all' ? [...role.recommended, ...role.optional] : role[which],
  );
  return APPLICATIONS.filter((application) => ids.has(application.id));
}

/**
 * Check preset integrity. Same contract as `validateCatalog`: returns every
 * problem rather than throwing on the first.
 *
 * The check that matters is that **every id resolves against the catalog**. A
 * preset naming an application that does not exist would silently shrink a
 * user's selection, which is exactly the kind of quiet wrongness this project
 * tries not to ship.
 */
export function validateRoles(
  roles: readonly Role[] = ROLES,
  applications: readonly Application[] = APPLICATIONS,
): string[] {
  const errors: string[] = [];
  const catalogIds = new Set(applications.map((application) => application.id));
  const seenIds = new Set<string>();
  const idPattern = /^[a-z0-9]+(-[a-z0-9]+)*$/;

  for (const role of roles) {
    if (!idPattern.test(role.id)) {
      errors.push(`${role.id || '(empty id)'}: role id must be a lowercase slug`);
    }
    if (seenIds.has(role.id)) {
      errors.push(`${role.id}: duplicate role id`);
    }
    seenIds.add(role.id);

    if (role.name.trim() === '') errors.push(`${role.id}: empty name`);
    if (role.description.trim() === '') errors.push(`${role.id}: empty description`);
    if (role.recommended.length === 0) {
      errors.push(`${role.id}: a role must recommend at least one application`);
    }

    const seenInRole = new Set<string>();
    for (const [listName, list] of [
      ['recommended', role.recommended],
      ['optional', role.optional],
    ] as const) {
      for (const applicationId of list) {
        if (!catalogIds.has(applicationId)) {
          errors.push(`${role.id} → ${listName}: "${applicationId}" is not in the catalog`);
        }
        if (seenInRole.has(applicationId)) {
          errors.push(
            `${role.id}: "${applicationId}" appears in both recommended and optional`,
          );
        }
        seenInRole.add(applicationId);
      }
    }
  }

  return errors;
}
