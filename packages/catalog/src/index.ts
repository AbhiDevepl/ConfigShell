/**
 * Public API of the shared application catalog.
 *
 * This package is the single source of truth for application metadata. The web
 * app reads from it; it must not keep its own competing copy.
 */

export {
  CATEGORIES,
  DISTROS,
  INSTALL_METHODS,
  type Application,
  type Category,
  type Distro,
  type InstallMethod,
  type InstallationSource,
  type RepositoryOrigin,
} from './types.ts';

export { APPLICATIONS } from './applications.ts';
export { validateCatalog, assertValidCatalog } from './validate.ts';
