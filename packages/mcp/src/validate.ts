/**
 * Argument validation — the untrusted-input boundary for every MCP tool.
 *
 * MCP arguments arrive as arbitrary JSON from a caller this process cannot
 * vouch for. Everything here **rejects rather than coerces**, and every
 * accepted value is checked against a closed set that comes from the catalog
 * rather than from a list maintained here.
 *
 * The structural defence matters more than any single check: there is no tool
 * argument anywhere in this package for a package name, a command, a flag, a
 * URL, or a repository. A caller supplies **catalog ids and a distribution
 * name**, and nothing else can reach command generation, because nothing else
 * is read.
 */

import {
  CATEGORIES,
  DISTROS,
  MAX_APPLICATION_ID_LENGTH,
  findApplication,
  isApplicationIdShape,
  parseEnvironment,
  type Application,
  type Category,
  type Environment,
} from '@configshell/catalog';
import { ToolError } from './errors.ts';

/** Free-text search bound. The query is only ever substring-matched. */
const MAX_QUERY_LENGTH = 100;

/**
 * Cap on one selection. The catalog holds 31 applications, so no legitimate
 * request comes close; the limit bounds work per call rather than constraining
 * anyone.
 */
export const MAX_SELECTION = 200;

/** Cap on commands submitted to `validate_setup`. */
const MAX_COMMANDS = 500;

export function asObject(value: unknown, what = 'arguments'): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw ToolError.invalidArguments(`${what} must be a JSON object.`);
  }
  return value as Record<string, unknown>;
}

export function optionalString(
  value: unknown,
  field: string,
  maxLength: number,
): string | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== 'string') {
    throw ToolError.invalidArguments(`${field} must be a string.`);
  }
  if (value.length > maxLength) {
    throw ToolError.invalidArguments(`${field} must be at most ${maxLength} characters.`);
  }
  return value;
}

export function parseQuery(value: unknown): string | undefined {
  return optionalString(value, 'query', MAX_QUERY_LENGTH);
}

export function parseCategory(value: unknown): Category | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== 'string' || !(CATEGORIES as readonly string[]).includes(value)) {
    throw ToolError.invalidArguments('Unknown category.', { supported: [...CATEGORIES] });
  }
  return value as Category;
}

/**
 * An environment from tool arguments.
 *
 * Delegates to the catalog's own `parseEnvironment`, which is the single
 * definition of what a valid environment is. A caller-supplied `ecosystem` is
 * ignored there and derived from the distribution instead, so no caller can
 * pair "Arch Linux" with "apt" to steer command generation.
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
 * A single application id: checked for shape here, and for existence against
 * the catalog. The two are different answers — a malformed id is a caller bug,
 * an unknown one is a legitimate "no such entry".
 */
export function parseApplicationId(value: unknown): string {
  if (!isApplicationIdShape(value)) {
    throw ToolError.invalidArguments(
      `applicationId must be a lowercase slug of at most ${MAX_APPLICATION_ID_LENGTH} ` +
        `characters, such as "vscode".`,
    );
  }
  return value;
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
  if (value.length === 0) {
    throw ToolError.invalidArguments('applicationIds must not be empty.');
  }
  if (value.length > MAX_SELECTION) {
    throw ToolError.tooLarge(`A selection may contain at most ${MAX_SELECTION} applications.`);
  }

  const malformed = value.filter((id) => !isApplicationIdShape(id));
  if (malformed.length > 0) {
    throw ToolError.invalidArguments('applicationIds contains malformed ids.', {
      // Truncated, so an error cannot be used to reflect a large payload back.
      malformed: malformed.slice(0, 5).map((id) => String(id).slice(0, 64)),
    });
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

/**
 * Commands submitted for validation.
 *
 * These are **compared, never executed and never re-emitted**. They are read
 * only to be checked against commands this process derives itself from the
 * catalog, so a caller cannot use `validate_setup` to launder arbitrary text
 * into a result that looks blessed.
 */
export function parseCommands(value: unknown): string[] {
  if (!Array.isArray(value)) {
    throw ToolError.invalidArguments('commands must be an array of strings.');
  }
  if (value.length > MAX_COMMANDS) {
    throw ToolError.tooLarge(`At most ${MAX_COMMANDS} commands can be validated at once.`);
  }
  if (value.some((command) => typeof command !== 'string' || command.length > 4096)) {
    throw ToolError.invalidArguments(
      'Every command must be a string of at most 4096 characters.',
    );
  }
  return value as string[];
}
