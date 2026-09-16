/**
 * The environment model: what a user's system is, expressed as validated data.
 *
 * Resolution is a pure function of `(application, environment)`. This module
 * owns the second half of that pair — constructing one, validating untrusted
 * input into one, and deriving an ecosystem from a distribution.
 *
 * Scope note: nothing here *detects* anything. An `Environment` is always built
 * from an explicit choice. Real system detection belongs to the local agent,
 * which does not exist (see docs/agent.md).
 */

import {
  ARCHITECTURES,
  DISTROS,
  DISTRO_FAMILIES,
  ECOSYSTEM_DISTROS,
  OPERATING_SYSTEMS,
  PACKAGE_ECOSYSTEMS,
  type Architecture,
  type Distro,
  type DistroFamily,
  type Environment,
  type OperatingSystem,
  type PackageEcosystem,
} from './types.ts';

/**
 * Distribution → native package ecosystem, inverted from `ECOSYSTEM_DISTROS` so
 * the mapping is written down exactly once.
 */
const DISTRO_ECOSYSTEM: Record<Distro, PackageEcosystem> = Object.fromEntries(
  PACKAGE_ECOSYSTEMS.flatMap((ecosystem) =>
    ECOSYSTEM_DISTROS[ecosystem].map((distro) => [distro, ecosystem] as const),
  ),
) as Record<Distro, PackageEcosystem>;

/** The package manager a distribution ships with. Total over `Distro`. */
export function ecosystemForDistro(distro: Distro): PackageEcosystem {
  return DISTRO_ECOSYSTEM[distro];
}

/** The lineage a distribution belongs to. Total over `Distro`. */
export function familyForDistro(distro: Distro): DistroFamily {
  return DISTRO_FAMILIES[distro];
}

/** The distributions a package ecosystem applies to. */
export function distrosForEcosystem(ecosystem: PackageEcosystem): readonly Distro[] {
  return ECOSYSTEM_DISTROS[ecosystem];
}

export function isOperatingSystem(value: unknown): value is OperatingSystem {
  return typeof value === 'string' && (OPERATING_SYSTEMS as readonly string[]).includes(value);
}

export function isDistro(value: unknown): value is Distro {
  return typeof value === 'string' && (DISTROS as readonly string[]).includes(value);
}

export function isArchitecture(value: unknown): value is Architecture {
  return typeof value === 'string' && (ARCHITECTURES as readonly string[]).includes(value);
}

/**
 * Build an environment from a distribution. Family and ecosystem are always
 * derived, never passed in, so an `Environment` cannot hold a combination that
 * contradicts itself.
 */
export function createEnvironment(distro: Distro, architecture?: Architecture): Environment {
  return {
    os: 'linux',
    distro,
    family: familyForDistro(distro),
    ecosystem: ecosystemForDistro(distro),
    ...(architecture ? { architecture } : {}),
  };
}

/** A field-level problem with untrusted environment input. */
export interface EnvironmentInputError {
  field: 'os' | 'distro' | 'architecture';
  message: string;
}

export type ParsedEnvironment =
  | { ok: true; environment: Environment }
  | { ok: false; errors: readonly EnvironmentInputError[] };

/**
 * Validate untrusted input (an HTTP body, a CLI flag, a query string) into an
 * `Environment`.
 *
 * Rejects rather than coerces, and reports every problem at once instead of
 * stopping at the first. A caller-supplied `ecosystem` is **ignored on purpose**
 * — it is derived from the distribution, so it cannot be used to smuggle in a
 * mismatched pair such as "Arch Linux with apt".
 */
export function parseEnvironment(input: unknown): ParsedEnvironment {
  const errors: EnvironmentInputError[] = [];

  if (typeof input !== 'object' || input === null || Array.isArray(input)) {
    return { ok: false, errors: [{ field: 'distro', message: 'environment must be an object' }] };
  }

  const raw = input as Record<string, unknown>;

  // `os` defaults to the only supported value rather than being required, so a
  // Linux-only caller need not repeat it. An explicit wrong value is an error.
  if (raw.os !== undefined && !isOperatingSystem(raw.os)) {
    errors.push({
      field: 'os',
      message: `unsupported operating system; expected one of: ${OPERATING_SYSTEMS.join(', ')}`,
    });
  }

  if (!isDistro(raw.distro)) {
    errors.push({
      field: 'distro',
      message:
        raw.distro === undefined
          ? 'distro is required'
          : `unknown distribution; expected one of: ${DISTROS.join(', ')}`,
    });
  }

  if (raw.architecture !== undefined && !isArchitecture(raw.architecture)) {
    errors.push({
      field: 'architecture',
      message: `unknown architecture; expected one of: ${ARCHITECTURES.join(', ')}`,
    });
  }

  if (errors.length > 0) return { ok: false, errors };

  return {
    ok: true,
    environment: createEnvironment(
      raw.distro as Distro,
      raw.architecture as Architecture | undefined,
    ),
  };
}
