/**
 * Validation for catalog reads.
 *
 * Query parameters are untrusted input. Everything here rejects rather than
 * coerces, and every accepted value is checked against a closed set from the
 * catalog — so a caller cannot invent a category or smuggle a pattern into a
 * filter.
 */

import {
  APPLICATION_ID_PATTERN,
  CATEGORIES,
  CATEGORY_DEFINITIONS,
  MAX_APPLICATION_ID_LENGTH,
  type Category,
} from "@configshell/catalog";
import { ApiError } from "../utils/response.js";

/**
 * Upper bound on free-text search. Not a security boundary on its own — the
 * query is only ever used for substring matching, never interpolated anywhere —
 * but an unbounded string has no legitimate use and costs work to match.
 */
const MAX_QUERY_LENGTH = 100;

// Application-id shape comes from the catalog package, which is where that rule
// belongs — the catalog validator enforces the same pattern on its own data.

/**
 * Resolves a category name or slug to a typed catalog Category.
 */
function parseCategory(value: unknown): Category | undefined {
  if (typeof value !== "string") return undefined;
  const exact = (CATEGORIES as readonly string[]).find((c) => c === value);
  if (exact) return exact as Category;
  const match = (CATEGORIES as readonly string[]).find(
    (c) => c.toLowerCase() === value.toLowerCase(),
  );
  if (match) return match as Category;
  const byId = CATEGORY_DEFINITIONS.find((d) => d.id === value.toLowerCase());
  if (byId) return byId.name;
  return undefined;
}

export function parseSearchQuery(queryParams: { query?: unknown; category?: unknown }) {
  const { query, category } = queryParams;

  if (query !== undefined && typeof query !== "string") {
    throw ApiError.invalidRequest("query must be a string.");
  }
  if (typeof query === "string" && query.length > MAX_QUERY_LENGTH) {
    throw ApiError.invalidRequest(`query must be at most ${MAX_QUERY_LENGTH} characters.`);
  }

  let resolvedCategory: Category | undefined;
  if (category !== undefined) {
    resolvedCategory = parseCategory(category);
    if (!resolvedCategory) {
      throw ApiError.invalidRequest("Unknown category.", { supported: [...CATEGORIES] });
    }
  }

  return { query, category: resolvedCategory };
}

/**
 * A path-parameter application id.
 *
 * Validated for *shape* here and for *existence* by the service. The two are
 * different answers: a malformed id is a client bug (400), while a well-formed
 * id that is not in the catalog is a legitimate 404.
 */
export function parseApplicationId(raw: unknown) {
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

/** Role ids use the same slug shape as application ids. */
export function parseRoleId(raw: unknown) {
  if (typeof raw !== "string" || raw.length === 0) {
    throw ApiError.invalidRequest("A role id is required.");
  }
  if (raw.length > MAX_APPLICATION_ID_LENGTH || !APPLICATION_ID_PATTERN.test(raw)) {
    throw ApiError.invalidRequest(
      "Malformed role id. Expected a lowercase slug such as 'web-developer'.",
    );
  }
  return raw;
}

export { APPLICATION_ID_PATTERN, MAX_APPLICATION_ID_LENGTH, MAX_QUERY_LENGTH };
