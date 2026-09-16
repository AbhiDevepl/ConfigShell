/**
 * How much of the catalog actually works on a given environment.
 *
 * A supported distribution is not the same as a useful one. ConfigShell can
 * resolve against openSUSE the moment the ecosystem exists, but until catalog
 * entries carry `zypper` identifiers the honest answer for every application is
 * "no verified route here". Publishing that number is better than letting a
 * user pick a distribution and discover an empty plan.
 *
 * Derived, never stored: it is `resolveAll` counted up, so it cannot drift from
 * what the resolver would actually do.
 */

import { APPLICATIONS, type Application, type Environment } from '@configshell/catalog';
import { resolveAll } from './resolve.ts';

export interface CatalogCoverage {
  /** Applications in the catalog. */
  total: number;
  /** Resolve to a command on this environment. */
  installable: number;
  /** Resolve, but the user has to install them by hand. */
  manual: number;
  /** No verified route here. */
  unavailable: number;
}

export function catalogCoverage(
  environment: Environment,
  applications: readonly Application[] = APPLICATIONS,
): CatalogCoverage {
  const resolutions = resolveAll(applications, environment);
  return {
    total: applications.length,
    installable: resolutions.filter((r) => r.outcome === 'resolved').length,
    manual: resolutions.filter((r) => r.outcome === 'manual').length,
    unavailable: resolutions.filter((r) => r.outcome === 'unavailable').length,
  };
}
