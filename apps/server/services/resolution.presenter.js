/**
 * One wire shape for a resolution, shared by every endpoint that returns one.
 *
 * `@configshell/installer`'s `Resolution` is a domain type: it carries the whole
 * `Application` and the whole `InstallationSource` on every entry, plus the
 * policy's internal rank integer. That is right for the resolver and wrong for
 * an HTTP response — it is verbose, it leaks an internal ordering detail, and
 * repeating the application object inside its own resolution is noise.
 *
 * This module exists because the flattening was previously done in
 * `plan.service.js` only, so `POST /api/plan` and `GET /api/applications/:id`
 * returned *different shapes for the same concept*. A client that handled one
 * could not read the other. One presenter, one shape.
 *
 * The same field names are used by the MCP adapter (`packages/mcp`), so a
 * resolution reads identically however it was requested.
 */

/**
 * Flatten a resolution for the wire.
 *
 * `considered` is included deliberately: a user — or a model explaining the
 * choice to one — is entitled to see which sources were rejected and why, not
 * just which one won.
 *
 * @param {import("@configshell/installer").Resolution} resolution
 */
export function presentResolution(resolution) {
  const base = {
    applicationId: resolution.application.id,
    applicationName: resolution.application.name,
    outcome: resolution.outcome,
    considered: resolution.considered.map((candidate) => ({
      method: candidate.source.method,
      identifier: candidate.source.identifier,
      origin: candidate.source.origin,
      // `eligible`, not the internal rank integer: a consumer needs to know
      // whether a source could be used here and why, not where it sits in the
      // policy's ordering.
      eligible: candidate.rank !== null,
      note: candidate.note,
    })),
  };

  if (resolution.outcome === "resolved") {
    return {
      ...base,
      source: {
        method: resolution.source.method,
        identifier: resolution.source.identifier,
        origin: resolution.source.origin,
      },
      reason: resolution.reason,
    };
  }

  return {
    ...base,
    reason: resolution.reason,
    explanation: resolution.explanation,
    ...(resolution.outcome === "manual" && resolution.url ? { url: resolution.url } : {}),
  };
}
