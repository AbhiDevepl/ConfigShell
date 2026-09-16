/**
 * The trust policy: which installation source ConfigShell prefers, and why.
 *
 * This encodes PRD §22's hierarchy explicitly rather than leaving the choice to
 * whichever source happens to come first in the catalog. "Which source did you
 * pick, and why" is a user-trust question, so the answer is a documented,
 * tested function — and every decision it makes carries a note the UI can show.
 */

import type { Environment, InstallMethod, InstallationSource } from '@configshell/catalog';

/**
 * Whether a source needs a third-party repository added before it will install.
 *
 * **Derived, not stored.** For a native package manager, `origin: 'vendor'`
 * already means "published in the vendor's own repository" — the catalog's own
 * definition. If the distribution shipped it, the origin would be `'distro'`.
 * So the predicate is exact, and adding a `requiresRepositorySetup` field to
 * all 31 catalog entries would record something already implied by two fields
 * next to it.
 *
 * **Provisional (Q1, docs/TechnicalAudit.md §9).** Today these sources are
 * skipped and the user is sent to the vendor's instructions. If ConfigShell
 * later generates repository-setup steps, this is the one place that decides
 * what counts, and a catalog field can replace the derivation without touching
 * the resolver's shape.
 */
export function requiresRepositorySetup(source: InstallationSource): boolean {
  return isNativeEcosystemMethod(source.method) && source.origin === 'vendor';
}

/** Is this method a distribution's own package manager (as opposed to an add-on)? */
export function isNativeEcosystemMethod(method: InstallMethod): boolean {
  return method === 'apt' || method === 'dnf' || method === 'pacman';
}

/**
 * Does this step need root?
 *
 * Flatpak is the one exception, and only because ConfigShell always renders it
 * as a `--user` install (see `commands.ts`). Change that and this must change
 * with it — which is why both live behind named functions rather than a string
 * check on the generated command.
 */
export function isPrivilegedMethod(method: InstallMethod): boolean {
  switch (method) {
    case 'apt':
    case 'dnf':
    case 'pacman':
    case 'snap':
      return true;
    case 'flatpak':
    case 'official':
      return false;
  }
}

/**
 * Preference tiers, best first. PRD §22:
 *
 *     Official distribution repository
 *             ↓
 *     Official package repository
 *             ↓
 *     Official application source
 *             ↓
 *     Other explicitly trusted source
 *
 * Mapped onto the catalog's `method` × `origin` model. Flatpak is preferred
 * over Snap within a tier for one concrete reason: ConfigShell installs
 * Flatpaks with `--user`, so that route needs no root at all.
 */
const TIERS: readonly {
  rank: number;
  matches: (source: InstallationSource, environment: Environment) => boolean;
  note: string;
}[] = [
  {
    rank: 0,
    matches: (s, env) => s.method === env.ecosystem && s.origin === 'distro',
    note: "in the distribution's own repositories",
  },
  {
    rank: 1,
    matches: (s) => s.method === 'flatpak' && s.origin === 'vendor',
    note: 'published on Flathub by the application vendor',
  },
  {
    rank: 2,
    matches: (s) => s.method === 'snap' && s.origin === 'vendor',
    note: 'published on the Snap Store by the application vendor',
  },
  {
    rank: 3,
    matches: (s) => s.method === 'flatpak' && s.origin === 'distro',
    note: "published on Flathub by the distribution's vendor",
  },
  {
    rank: 4,
    matches: (s) => s.method === 'snap' && s.origin === 'distro',
    note: "published on the Snap Store by the distribution's vendor",
  },
  {
    rank: 5,
    matches: (s) => s.method === 'flatpak' && s.origin === 'community',
    note: 'packaged on Flathub by a third party, not the vendor',
  },
  {
    rank: 6,
    matches: (s) => s.method === 'snap' && s.origin === 'community',
    note: 'packaged on the Snap Store by a third party, not the vendor',
  },
];

/** Why a source was excluded outright, or `null` if it was not. */
export function exclusionNote(source: InstallationSource, environment: Environment): string | null {
  if (isNativeEcosystemMethod(source.method)) {
    if (source.method !== environment.ecosystem) {
      return `${source.method} is not ${environment.distro}'s package manager`;
    }
    if (source.distros && !source.distros.includes(environment.distro)) {
      return `not verified for ${environment.distro}`;
    }
    if (requiresRepositorySetup(source)) {
      return `needs ${source.identifier}'s vendor repository to be added first`;
    }
  }
  if (source.method === 'official') {
    return 'a manual download from the vendor, not a package';
  }
  return null;
}

/**
 * Rank a source for this environment. Lower is better; `null` is excluded.
 *
 * Total over the catalog's model: every method/origin combination either
 * matches a tier or is excluded with a reason.
 */
export function rankSource(
  source: InstallationSource,
  environment: Environment,
): { rank: number | null; note: string } {
  const excluded = exclusionNote(source, environment);
  if (excluded !== null) return { rank: null, note: excluded };

  for (const tier of TIERS) {
    if (tier.matches(source, environment)) {
      return { rank: tier.rank, note: tier.note };
    }
  }

  // Unreachable for the current model, but a new method/origin pair must fail
  // closed rather than silently becoming the most-preferred source.
  return { rank: null, note: 'no trust tier covers this source' };
}
