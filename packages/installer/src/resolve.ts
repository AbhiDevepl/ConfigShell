/**
 * Resolution: given an application and an environment, which installation
 * source should be used — and why.
 *
 * A pure function over data the caller supplies. No I/O, no catalog lookup by
 * side effect, no execution. Every outcome is explicit; nothing is dropped.
 */

import type { Application, Environment, InstallationSource } from '@configshell/catalog';
import { exclusionNote, rankSource, requiresRepositorySetup } from './policy.ts';
import type { ConsideredSource, Resolution } from './types.ts';

function describe(source: InstallationSource): string {
  return `${source.method} · ${source.identifier}`;
}

/**
 * Resolve one application against one environment.
 *
 * Always returns a resolution — `resolved`, `manual`, or `unavailable`. There
 * is no "not found" hole and no exception: an application with no route is a
 * normal, expected answer that the user is entitled to see stated plainly.
 */
export function resolve(application: Application, environment: Environment): Resolution {
  const considered: ConsideredSource[] = application.installation.map((source) => {
    const { rank, note } = rankSource(source, environment);
    return { source, rank, note };
  });

  const usable = considered
    .filter((c): c is ConsideredSource & { rank: number } => c.rank !== null)
    .sort((a, b) => a.rank - b.rank);

  const best = usable[0];
  if (best) {
    return {
      outcome: 'resolved',
      application,
      source: best.source,
      reason: `Chose ${describe(best.source)} — ${best.note}.`,
      considered,
    };
  }

  // Nothing installable. Distinguish "you can still do this by hand" from
  // "there is genuinely nothing here", because they are different answers.
  if (application.installation.length === 0) {
    return {
      outcome: 'unavailable',
      application,
      reason: 'no-verified-source',
      explanation:
        `No installation source has been verified for ${application.name} yet. ` +
        `That means nothing has been checked — not that it cannot be installed.`,
      considered,
    };
  }

  const repoSetup = application.installation.find(
    (source) => source.method === environment.ecosystem && requiresRepositorySetup(source),
  );
  if (repoSetup) {
    return {
      outcome: 'manual',
      application,
      reason: 'repository-setup-required',
      url: repoSetup.url,
      explanation:
        `${application.name} is available for ${environment.distro} as \`${repoSetup.identifier}\`, ` +
        `but only from the vendor's own repository, which has to be added to your system first. ` +
        `ConfigShell does not generate repository-setup commands${
          repoSetup.url ? " — follow the vendor's instructions" : ''
        }.`,
      considered,
    };
  }

  const official = application.installation.find((source) => source.method === 'official');
  if (official) {
    return {
      outcome: 'manual',
      application,
      reason: 'official-download-only',
      url: official.url,
      explanation:
        `${application.name} is distributed as a download from the vendor rather than through ` +
        `a package manager, so there is no command to generate.`,
      considered,
    };
  }

  return {
    outcome: 'unavailable',
    application,
    reason: 'no-source-for-environment',
    explanation:
      `${application.name} has verified sources, but none of them apply to ${environment.distro}. ` +
      `Absence here means "not verified", not "impossible".`,
    considered,
  };
}

/** Resolve a selection, preserving the order it was given in. */
export function resolveAll(
  applications: readonly Application[],
  environment: Environment,
): readonly Resolution[] {
  return applications.map((application) => resolve(application, environment));
}

/** Convenience re-export so callers need not reach into `policy.ts`. */
export { exclusionNote, rankSource, requiresRepositorySetup };
