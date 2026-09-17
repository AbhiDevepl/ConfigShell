/**
 * Catalog access.
 *
 * The server owns **no application data**. Everything here delegates to
 * `@configshell/catalog`, which is the single source of truth — the same module
 * the web app compiles into its bundle. If an application is missing, it is
 * missing from the catalog, not from a copy that drifted.
 *
 * There is deliberately no database. The catalog is Git-managed structured data
 * (PRD §33): version-controlled, reviewable in a pull request, and validated in
 * CI. A database would add an operational dependency and a second place for the
 * truth to live, in exchange for nothing this API needs.
 */

import { catalogCoverage } from "@configshell/installer";
import {
  APPLICATIONS,
  ARCHITECTURES,
  ROLES,
  CATEGORIES,
  DISTROS,
  ECOSYSTEM_DISTROS,
  OPERATING_SYSTEMS,
  PACKAGE_ECOSYSTEMS,
  createEnvironment,
  ecosystemForDistro,
  familyForDistro,
  findApplication,
  findRole,
  validateRoles,
  searchApplications,
  validateCatalog,
  type Application,
  type Category,
  type Role,
} from "@configshell/catalog";

/** @param {{ query?: string, category?: Category }} [options] */
export function listApplications(options: { query?: string; category?: Category } = {}) {
  return searchApplications({ query: options.query, category: options.category });
}

export function getApplication(id: string): Application | undefined {
  return findApplication(id);
}

/** Which of these ids are not in the catalog. Order-preserving, deduplicated. */
export function findUnknownIds(ids: string[]) {
  return [...new Set(ids)].filter((id) => findApplication(id) === undefined);
}

/** Catalog entries for ids, in the order given. Throws on an unknown id. */
export function getApplications(ids: string[]): Application[] {
  return ids.map((id) => {
    const application = findApplication(id);
    if (!application) throw new Error(`unknown application id: ${id}`);
    return application;
  });
}

export function getCategories() {
  return [...CATEGORIES];
}

/**
 * Everything a client needs to build an environment selector without hardcoding
 * the supported values. Keeps the web app, a future CLI and any other consumer
 * from drifting out of sync with the catalog.
 */
export function getSupportedEnvironments() {
  return {
    operatingSystems: [...OPERATING_SYSTEMS],
    // Coverage is computed by the resolver rather than stored, so it cannot
    // drift from what a plan would actually produce. A supported distribution
    // is not the same as a well-covered one, and a caller is entitled to know
    // the difference before picking one.
    distros: DISTROS.map((distro) => ({
      distro,
      family: familyForDistro(distro),
      ecosystem: ecosystemForDistro(distro),
      coverage: catalogCoverage(createEnvironment(distro)),
    })),
    ecosystems: PACKAGE_ECOSYSTEMS.map((ecosystem) => ({
      ecosystem,
      distros: [...ECOSYSTEM_DISTROS[ecosystem]],
    })),
    architectures: [...ARCHITECTURES],
    /** Recorded but not acted on — the catalog holds no per-architecture data. */
    architectureAffectsResolution: false,
  };
}

/**
 * Role / use-case presets (PRD §15).
 *
 * Curated catalog ids, nothing more — no scoring, no model. Returned whole so a
 * client can show what a preset contains *before* the user commits to it.
 */
export function getRoles() {
  return ROLES.map((role) => ({
    id: role.id,
    name: role.name,
    description: role.description,
    recommended: [...role.recommended],
    optional: [...role.optional],
  }));
}

export function getRole(id: string): Role | undefined {
  return findRole(id);
}

/** Counts, computed from the data rather than maintained by hand. */
export function getCatalogStats() {
  const sources = APPLICATIONS.flatMap((app) => app.installation);
  const tally = (key: "method" | "origin") =>
    sources.reduce<Record<string, number>>((acc, source) => {
      acc[source[key]] = (acc[source[key]] ?? 0) + 1;
      return acc;
    }, {});

  return {
    applications: APPLICATIONS.length,
    installationSources: sources.length,
    byMethod: tally("method"),
    byOrigin: tally("origin"),
    categories: CATEGORIES.length,
    roles: ROLES.length,
    withVerification: APPLICATIONS.filter((app) => app.verify !== undefined).length,
  };
}

/**
 * Catalog integrity, for the health endpoint.
 *
 * The catalog is trusted data that reaches command generation, so "is it still
 * valid" is a liveness question, not a build-time one.
 */
export function checkCatalogIntegrity() {
  const errors = validateCatalog(APPLICATIONS);
  // Presets name catalog ids, so a preset pointing at a removed application is
  // the same class of problem as an invalid entry: trusted data gone stale.
  const roleErrors = validateRoles();
  return {
    valid: errors.length === 0 && roleErrors.length === 0,
    errorCount: errors.length + roleErrors.length,
  };
}
