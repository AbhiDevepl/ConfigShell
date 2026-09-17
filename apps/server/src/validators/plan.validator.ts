/**
 * Validation for the plan endpoint — the API's only request body, and the one
 * place untrusted input can influence something that becomes a shell command.
 *
 * The defence is structural rather than sanitising. A caller supplies
 * **catalog ids and a distribution name, and nothing else**:
 *
 *   - There is no field for a package name, a command, a flag, a URL, or a
 *     repository. No amount of creativity in the request body can introduce
 *     one, because no such field is read.
 *   - Ids are matched against a pattern *and* against the catalog. Only an id
 *     that exists resolves to a source, and only a source's own identifier
 *     reaches command generation.
 *   - The identifier is re-validated once more inside `renderPlan`, which does
 *     not trust this layer either.
 *
 * So a hostile request can, at worst, ask for a plan for applications the
 * catalog already contains. That is not an attack; it is the feature.
 */

import { parseEnvironment } from "@configshell/catalog";
import { ApiError } from "../utils/response.js";
import { findUnknownIds } from "../services/catalog.service.js";
import { APPLICATION_ID_PATTERN, MAX_APPLICATION_ID_LENGTH } from "./catalog.validator.js";

/**
 * Cap on a single selection.
 *
 * The catalog holds 31 applications, so a legitimate request cannot exceed it;
 * the limit exists to bound work per request rather than to constrain users.
 * Raise it when the catalog grows — it should stay comfortably above the
 * catalog size.
 */
const MAX_SELECTION = 200;

function parseApplicationIds(raw: unknown) {
  if (!Array.isArray(raw)) {
    throw ApiError.invalidRequest("applicationIds must be an array of catalog ids.");
  }
  if (raw.length === 0) {
    throw ApiError.invalidRequest("applicationIds must not be empty.");
  }
  if (raw.length > MAX_SELECTION) {
    throw ApiError.tooLarge(`A selection may contain at most ${MAX_SELECTION} applications.`);
  }

  const malformed = raw.filter(
    (id) =>
      typeof id !== "string" ||
      id.length === 0 ||
      id.length > MAX_APPLICATION_ID_LENGTH ||
      !APPLICATION_ID_PATTERN.test(id),
  );
  if (malformed.length > 0) {
    throw ApiError.invalidRequest("applicationIds contains malformed ids.", {
      // Echo back at most a few, truncated, so an error message cannot be used
      // to reflect a large payload.
      malformed: malformed.slice(0, 5).map((id) => String(id).slice(0, 64)),
    });
  }

  // Deduplicate while preserving the caller's order: a selection is a set, and
  // planning the same application twice would produce a duplicated command.
  const ids = [...new Set(raw)];

  // An unknown id is refused rather than skipped. Silently dropping it would
  // hand back a plan that does not match what was asked for.
  const unknown = findUnknownIds(ids);
  if (unknown.length > 0) {
    throw ApiError.unknownApplication(
      "One or more application ids are not in the catalog. Nothing was planned.",
      { unknown },
    );
  }

  return ids;
}

/**
 * Parse a plan request body into `{ applicationIds, environment }`.
 *
 * Unknown top-level fields are ignored rather than rejected, so a client can
 * send a forward-compatible body — but ignored means *ignored*: nothing outside
 * the two fields below has any effect on the plan.
 */
export function parsePlanRequest(body: unknown) {
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    throw ApiError.invalidRequest("Request body must be a JSON object.");
  }

  const { environment, applicationIds } = body as Record<string, unknown>;
  const parsedEnvironment = parseEnvironment(environment ?? {});
  if (!parsedEnvironment.ok) {
    throw ApiError.invalidRequest("Invalid environment.", { errors: parsedEnvironment.errors });
  }

  return {
    applicationIds: parseApplicationIds(applicationIds),
    environment: parsedEnvironment.environment,
  };
}

export { MAX_SELECTION };
