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

  // Captured now, before routing. Express rewrites `req.url` when a request
  // enters a mounted router, so reading `req.path` in the `finish` handler
  // reports the path *relative to whatever matched* — `/api/applications`
  // was logged as `/`. `originalUrl` is not rewritten.
  //
  // The query string is dropped rather than logged: it carries the caller's
  // search terms, which are their business.
  const path = req.originalUrl.split("?")[0];

  const startedAt = process.hrtime.bigint();
  res.on("finish", () => {
    const durationMs = Number(process.hrtime.bigint() - startedAt) / 1e6;
    req.log.info("request", {
      method: req.method,
      path,
      status: res.statusCode,
      durationMs: Math.round(durationMs * 100) / 100,
    });
  });

  next();
}
