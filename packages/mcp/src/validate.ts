/**
 * Business-rule validation for MCP tool arguments.
 *
 * **Shape is not checked here.** Argument types, string lengths, the catalog-id
 * pattern and array bounds are declared on the Zod schemas in `tools.ts`: the
 * SDK enforces them before a handler runs, and — the part that matters — it
 * publishes them in the JSON Schema every client reads. A host can see what a
 * valid id looks like instead of discovering it from an error.
 *
 * What is left here is what a schema cannot express: does this id exist in the
 * trusted catalog, is the selection deduplicated, and how does a distribution
 * become a validated `Environment`.
 *
 * The structural defence is unchanged and lives in the schemas: there is no
 * tool argument anywhere for a package name, a command, a flag, a URL or a
 * repository. A caller supplies **catalog ids and a distribution name**, and
 * nothing else can reach command generation, because nothing else is read.
 */

import {
  DISTROS,
  findApplication,
  parseEnvironment,
  type Application,
  type Environment,
} from '@configshell/catalog';
import { ToolError } from './errors.ts';

/**
 * An environment from tool arguments.
 *
 * Delegates to the catalog's own `parseEnvironment`, which is the single
 * definition of what a valid environment is. A caller-supplied `ecosystem` is
 * ignored there and derived from the distribution instead, so no caller can
 * pair "Arch Linux" with "apt" to steer command generation — a second line of
 * defence behind the schema, which rejects the unknown field outright.
 */
export function parseEnvironmentArgument(value: unknown): Environment {
  const parsed = parseEnvironment(value ?? {});
  if (!parsed.ok) {
    throw ToolError.invalidArguments('Invalid environment.', {
      errors: parsed.errors.map((error) => ({ field: error.field, message: error.message })),
      supportedDistros: [...DISTROS],
    });
  }
  return parsed.environment;
}

/**
 * A selection of application ids.
 *
 * Deduplicated while preserving caller order, and **an unknown id refuses the
 * whole call**. Silently dropping one would hand back a plan that does not
 * match what was asked for, which is the kind of quiet wrongness that is worse
 * than an error.
 */
export function parseApplicationIds(value: unknown): string[] {
  if (!Array.isArray(value)) {
    throw ToolError.invalidArguments('applicationIds must be an array of catalog ids.');
  }

  const ids = [...new Set(value as string[])];

  const unknown = ids.filter((id) => findApplication(id) === undefined);
  if (unknown.length > 0) {
    throw ToolError.unknownApplication(
      'One or more application ids are not in the catalog. Nothing was planned.',
      { unknown },
    );
  }
  return ids;
}

/** Catalog entries for validated ids, in the order given. */
export function applicationsFor(ids: readonly string[]): Application[] {
  return ids.map((id) => {
    const application = findApplication(id);
    // Unreachable: `parseApplicationIds` already refused unknown ids.
    if (!application) throw ToolError.unknownApplication(`Unknown application id: ${id}`);
    return application;
  });
}
