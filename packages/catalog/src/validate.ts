import {
  CATEGORIES,
  DISTROS,
  INSTALL_METHODS,
  type Application,
  type Distro,
  type InstallMethod,
  type InstallationSource,
} from './types.ts';

const ORIGINS = new Set(['distro', 'vendor', 'community']);

/**
 * Which distributions each package manager can even apply to. Guards against
 * entries like "dnf on Arch Linux", which would sail past a plain enum check.
 */
const METHOD_DISTROS: Partial<Record<InstallMethod, readonly Distro[]>> = {
  apt: ['Ubuntu', 'Debian'],
  dnf: ['Fedora'],
  pacman: ['Arch Linux'],
};

const ID_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

function validateSource(
  source: InstallationSource,
  appId: string,
  seenSources: Set<string>,
  errors: string[],
): void {
  const where = `${appId} → ${source.method}`;

  if (!INSTALL_METHODS.includes(source.method)) {
    errors.push(`${where}: unknown installation method "${source.method}"`);
  }

  const key = `${source.method}:${source.identifier}`;
  if (seenSources.has(key)) {
    errors.push(`${where}: duplicate installation identifier "${source.identifier}"`);
  }
  seenSources.add(key);

  if (source.identifier.trim() === '') {
    errors.push(`${where}: empty installation identifier`);
  }

  if (!ORIGINS.has(source.origin)) {
    errors.push(`${where}: unknown origin "${source.origin}"`);
  }

  const allowedDistros = METHOD_DISTROS[source.method];
  if (allowedDistros) {
    if (!source.distros || source.distros.length === 0) {
      errors.push(`${where}: distro-specific method must list the distros it is verified for`);
    }
    for (const distro of source.distros ?? []) {
      if (!DISTROS.includes(distro)) {
        errors.push(`${where}: unknown distribution "${distro}"`);
      } else if (!allowedDistros.includes(distro)) {
        errors.push(`${where}: ${source.method} does not apply to ${distro}`);
      }
    }
  } else if (source.distros) {
    errors.push(`${where}: ${source.method} is distribution-agnostic and must not list distros`);
  }

  if (source.url !== undefined && !isValidHttpsUrl(source.url)) {
    errors.push(`${where}: malformed url "${source.url}"`);
  }
}

function isValidHttpsUrl(value: string): boolean {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return false;
  }
  return url.protocol === 'https:' && url.hostname.includes('.');
}

/**
 * Checks catalog integrity. Returns every problem found rather than throwing on
 * the first, so a bad entry doesn't hide the ones after it.
 */
export function validateCatalog(applications: readonly Application[]): string[] {
  const errors: string[] = [];
  const seenIds = new Set<string>();
  const seenNames = new Set<string>();

  for (const app of applications) {
    if (!ID_PATTERN.test(app.id)) {
      errors.push(`${app.id || '(empty id)'}: id must be a lowercase slug`);
    }
    if (seenIds.has(app.id)) {
      errors.push(`${app.id}: duplicate application id`);
    }
    seenIds.add(app.id);

    const nameKey = app.name.trim().toLowerCase();
    if (seenNames.has(nameKey)) {
      errors.push(`${app.id}: duplicate application name "${app.name}"`);
    }
    seenNames.add(nameKey);

    if (app.name.trim() === '') {
      errors.push(`${app.id}: empty name`);
    }
    if (app.description.trim() === '') {
      errors.push(`${app.id}: empty description`);
    }
    if (!CATEGORIES.includes(app.category)) {
      errors.push(`${app.id}: unknown category "${app.category}"`);
    }
    if (!isValidHttpsUrl(app.homepage)) {
      errors.push(`${app.id}: malformed homepage "${app.homepage}"`);
    }

    const seenSources = new Set<string>();
    for (const source of app.installation) {
      validateSource(source, app.id, seenSources, errors);
    }
  }

  return errors;
}

export function assertValidCatalog(applications: readonly Application[]): void {
  const errors = validateCatalog(applications);
  if (errors.length > 0) {
    throw new Error(`Invalid catalog:\n  ${errors.join('\n  ')}`);
  }
}
