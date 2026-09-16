/**
 * Per-request logging context.
 *
 * Attaches a request id and a child logger to `req`, and logs one line when the
 * response finishes. The id lets a report ("the plan endpoint 500'd") be traced
 * to the exact request without any other correlation.
 *
 * A caller-supplied `X-Request-Id` is deliberately NOT trusted: it would let a
 * caller write arbitrary text into the server's logs, and the value is used for
 * nothing but correlation.
 */

import { randomUUID } from "node:crypto";
import { logger } from "../utils/logger.js";

export function requestContextMiddleware(req, res, next) {
  const requestId = randomUUID();
  req.id = requestId;
  req.log = logger.child({ requestId });
  res.setHeader("X-Request-Id", requestId);

  const startedAt = process.hrtime.bigint();
  res.on("finish", () => {
    const durationMs = Number(process.hrtime.bigint() - startedAt) / 1e6;
    // The path only — never the query string or body, which carry the caller's
    // selection.
    req.log.info("request", {
      method: req.method,
      path: req.path,
      status: res.statusCode,
      durationMs: Math.round(durationMs * 100) / 100,
    });
  });

  next();
}
