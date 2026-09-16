/**
 * Public API of the shared application catalog.
 *
 * This package is the single source of truth for application metadata. The web
 * app reads from it; it must not keep its own competing copy.
 */

export {
  ARCHITECTURES,
  CATEGORIES,
  DISTROS,
  ECOSYSTEM_DISTROS,
  INSTALL_METHODS,
  OPERATING_SYSTEMS,
  PACKAGE_ECOSYSTEMS,
  type Application,
  type Architecture,
  type Category,
  type Distro,
  type Environment,
  type InstallMethod,
  type InstallationSource,
  type OperatingSystem,
  type PackageEcosystem,
  type RepositoryOrigin,
  type Verification,
} from './types.ts';

export {
  createEnvironment,
  distrosForEcosystem,
  ecosystemForDistro,
  isArchitecture,
  isDistro,
  isOperatingSystem,
  parseEnvironment,
  type EnvironmentInputError,
  type ParsedEnvironment,
} from './environment.ts';

export { APPLICATIONS } from './applications.ts';
export { validateCatalog, assertValidCatalog } from './validate.ts';

/** Look up one application by id. Returns `undefined` for an unknown id. */
export { findApplication, searchApplications } from './query.ts';
