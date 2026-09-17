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

import type { NextFunction, Request, Response } from "express";

import { randomUUID } from "node:crypto";
import { logger, type Logger } from "../utils/logger.js";

/**
 * Fields this middleware stamps onto every request, declared globals so that
 * controllers (a different module, importing only this one transitively via
 * `app.ts`) see `req.id` and `req.log` as real fields.
 *
 * Declared here rather than in a `.d.ts`: contract tests import `server/app`
 * into their own program, and a stand-alone declaration file is only picked up
 * by a project whose `include` covers it — so the augmentation would silently
 * vanish in their typecheck. A module that is imported is always in the program.
 */
declare global {
  namespace Express {
    interface Request {
      id: string;
      log?: Logger;
    }
  }
}

export function requestContextMiddleware(req: Request, res: Response, next: NextFunction) {
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
    req.log?.info("request", {
      method: req.method,
      path,
      status: res.statusCode,
      durationMs: Math.round(durationMs * 100) / 100,
    });
  });

  next();
}