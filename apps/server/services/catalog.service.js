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

import {
  APPLICATIONS,
  ARCHITECTURES,
  CATEGORIES,
  DISTROS,
  ECOSYSTEM_DISTROS,
  OPERATING_SYSTEMS,
  PACKAGE_ECOSYSTEMS,
  ecosystemForDistro,
  findApplication,
  searchApplications,
  validateCatalog,
} from "@configshell/catalog";

/** @typedef {import("@configshell/catalog").Application} Application */

/** @param {{ query?: string, category?: import("@configshell/catalog").Category }} [options] */
export function listApplications(options = {}) {
  return searchApplications({ query: options.query, category: options.category });
}

/** @returns {Application | undefined} */
export function getApplication(id) {
  return findApplication(id);
}

/** Which of these ids are not in the catalog. Order-preserving, deduplicated. */
export function findUnknownIds(ids) {
  return [...new Set(ids)].filter((id) => findApplication(id) === undefined);
}

/** Catalog entries for ids, in the order given. Throws on an unknown id. */
export function getApplications(ids) {
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
    distros: DISTROS.map((distro) => ({ distro, ecosystem: ecosystemForDistro(distro) })),
    ecosystems: PACKAGE_ECOSYSTEMS.map((ecosystem) => ({
      ecosystem,
      distros: [...ECOSYSTEM_DISTROS[ecosystem]],
    })),
    architectures: [...ARCHITECTURES],
    /** Recorded but not acted on — the catalog holds no per-architecture data. */
    architectureAffectsResolution: false,
  };
}

/** Counts, computed from the data rather than maintained by hand. */
export function getCatalogStats() {
  const sources = APPLICATIONS.flatMap((app) => app.installation);
  const tally = (key) =>
    sources.reduce((acc, source) => {
      acc[source[key]] = (acc[source[key]] ?? 0) + 1;
      return acc;
    }, {});

  return {
    applications: APPLICATIONS.length,
    installationSources: sources.length,
    byMethod: tally("method"),
    byOrigin: tally("origin"),
    categories: CATEGORIES.length,
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
  return { valid: errors.length === 0, errorCount: errors.length };
}
