import {
  CATEGORIES,
  DISTROS,
  ECOSYSTEM_DISTROS,
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
 *
 * This is `ECOSYSTEM_DISTROS` itself, not a copy: a distribution-specific
 * install method *is* a native package ecosystem, and the mapping is owned by
 * `types.ts` so adding a distribution is a one-line change in one file.
 */
const METHOD_DISTROS: Partial<Record<InstallMethod, readonly Distro[]>> = ECOSYSTEM_DISTROS;

/**
 * The shape of a catalog id. Exported because every consumer that accepts an id
 * from outside — the API server, the MCP layer — has to check it, and three
 * copies of the same regex is three chances for them to drift apart.
 */
export const APPLICATION_ID_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

/** Upper bound on an id, so an unbounded string is rejected before matching. */
export const MAX_APPLICATION_ID_LENGTH = 64;

/** Shape only — says nothing about whether the catalog contains it. */
export function isApplicationIdShape(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    value.length > 0 &&
    value.length <= MAX_APPLICATION_ID_LENGTH &&
    APPLICATION_ID_PATTERN.test(value)
  );
}

const ID_PATTERN = APPLICATION_ID_PATTERN;

/**
 * What may appear in a verification binary name.
 *
 * Strict on purpose. This value is interpolated into a generated shell command
 * (`command -v <binary>`), so it is the one field in the catalog with a direct
 * path to a shell. Anything outside this alphabet — a space, a quote, `;`,
 * `$`, a backtick — is rejected here, at the data boundary, before command
 * generation ever sees it. Command generation re-checks it anyway.
 */
const BINARY_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._+-]*$/;

/**
 * What may appear in an installation identifier.
 *
 * The same alphabet as `BINARY_PATTERN`, and for the same reason: an identifier
 * is interpolated into a generated command, so it is the *other* field in the
 * catalog with a direct path to a shell. It covers every identifier form the
 * catalog uses — package names (`docker-ce`, `docker.io`), reverse-DNS Flatpak
 * application IDs (`org.mozilla.firefox`) and Snap names (`sublime-text`) — and
 * nothing else. No whitespace, no quotes, no shell metacharacter, and no
 * leading `-`, which would read as a flag rather than a package.
 *
 * Checking it here is defence in depth, not the only defence: `renderPlan` in
 * `@configshell/installer` re-validates against the same alphabet immediately
 * before interpolation and refuses to build a command otherwise. But an
 * identifier that only fails *there* fails at plan time, as a thrown error on a
 * user's request, long after the bad data was committed. Catching it at the data
 * boundary makes it a validation failure — visible to `validateCatalog`, to the
 * catalog test suite, and to the `/health` integrity check, which is where a
 * catalog-integrity problem should surface.
 */
const IDENTIFIER_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._+-]*$/;

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

  if (typeof source.identifier !== 'string' || source.identifier.trim() === '') {
    errors.push(`${where}: empty installation identifier`);
  } else if (!IDENTIFIER_PATTERN.test(source.identifier)) {
    errors.push(
      `${where}: identifier "${source.identifier}" is not a plain package name. ` +
        `It is interpolated into a generated command and must match ${String(IDENTIFIER_PATTERN)}.`,
    );
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

    if (app.verify !== undefined) {
      const binary = app.verify.binary;
      if (typeof binary !== 'string' || binary.trim() === '') {
        errors.push(`${app.id}: verify.binary must be a non-empty string`);
      } else if (!BINARY_PATTERN.test(binary)) {
        errors.push(
          `${app.id}: verify.binary "${binary}" is not a plain executable name. ` +
            `It is interpolated into a generated command and must match ${String(BINARY_PATTERN)}.`,
        );
      }
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
