/**
 * Validation for catalog reads.
 *
 * Query parameters are untrusted input. Everything here rejects rather than
 * coerces, and every accepted value is checked against a closed set from the
 * catalog — so a caller cannot invent a category or smuggle a pattern into a
 * filter.
 */

import { CATEGORIES } from "@configshell/catalog";
import { ApiError } from "../utils/response.js";

/**
 * Upper bound on free-text search. Not a security boundary on its own — the
 * query is only ever used for substring matching, never interpolated anywhere —
 * but an unbounded string has no legitimate use and costs work to match.
 */
const MAX_QUERY_LENGTH = 100;

/** Application ids are lowercase slugs; the catalog enforces the same shape. */
const APPLICATION_ID_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const MAX_APPLICATION_ID_LENGTH = 64;

/**
 * Narrowing guard rather than a bare `includes` check, so the value that leaves
 * this module is typed as a catalog `Category` instead of a `string` that
 * happens to have been checked.
 *
 * @param {unknown} value
 * @returns {value is import("@configshell/catalog").Category}
 */
function isCategory(value) {
  return typeof value === "string" && /** @type {readonly string[]} */ (CATEGORIES).includes(value);
}

export function parseSearchQuery(queryParams) {
  const { query, category } = queryParams;

  if (query !== undefined && typeof query !== "string") {
    throw ApiError.invalidRequest("query must be a string.");
  }
  if (typeof query === "string" && query.length > MAX_QUERY_LENGTH) {
    throw ApiError.invalidRequest(`query must be at most ${MAX_QUERY_LENGTH} characters.`);
  }

  if (category !== undefined && !isCategory(category)) {
    throw ApiError.invalidRequest("Unknown category.", { supported: [...CATEGORIES] });
  }

  return { query, category };
}

/**
 * A path-parameter application id.
 *
 * Validated for *shape* here and for *existence* by the service. The two are
 * different answers: a malformed id is a client bug (400), while a well-formed
 * id that is not in the catalog is a legitimate 404.
 */
export function parseApplicationId(raw) {
  if (typeof raw !== "string" || raw.length === 0) {
    throw ApiError.invalidRequest("An application id is required.");
  }
  if (raw.length > MAX_APPLICATION_ID_LENGTH || !APPLICATION_ID_PATTERN.test(raw)) {
    throw ApiError.invalidRequest(
      "Malformed application id. Expected a lowercase slug such as 'vscode'.",
    );
  }
  return raw;
}

export { APPLICATION_ID_PATTERN, MAX_APPLICATION_ID_LENGTH, MAX_QUERY_LENGTH };
