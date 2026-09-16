/**
 * Validation for single-application requests.
 *
 * An application may optionally be described *for an environment*, so the
 * environment can arrive as query parameters here. Parsing is delegated to the
 * catalog's own `parseEnvironment`, which is the single definition of what a
 * valid environment is — the server does not keep a second one.
 */

import { parseEnvironment } from "@configshell/catalog";
import { ApiError } from "../utils/response.js";

/**
 * An optional environment from query parameters (`?distro=Ubuntu`).
 *
 * Returns `undefined` when no distro was supplied, which the caller treats as
 * "describe this application generally" rather than as an error.
 */
export function parseOptionalEnvironmentQuery(queryParams) {
  const { distro, architecture } = queryParams;
  if (distro === undefined) return undefined;

  const parsed = parseEnvironment({ distro, architecture });
  if (!parsed.ok) {
    throw ApiError.invalidRequest("Invalid environment.", { errors: parsed.errors });
  }
  return parsed.environment;
}
