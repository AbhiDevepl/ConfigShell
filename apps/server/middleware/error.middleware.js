/**
 * Error handling (PRD §24, §40).
 *
 * The one rule: a client learns what it needs to fix its request and nothing
 * about the inside of the server. `ApiError`s were constructed with a
 * caller-safe message and are returned as-is; anything else is a bug, and it is
 * logged in full and returned as an opaque 500.
 *
 * Express recognises an error handler by its four-parameter signature, so
 * `next` must stay in the list even though it is unused.
 */

import { ApiError, ErrorCodes, sendError } from "../utils/response.js";
import { logger } from "../utils/logger.js";

// eslint-disable-next-line no-unused-vars -- Express detects error handlers by arity.
export function errorMiddleware(error, req, res, next) {
  const log = req.log ?? logger;

  // A body that failed to parse, or one over the size limit, arrives here from
  // express.json() rather than from our own validation.
  if (error?.type === "entity.too.large") {
    return sendError(res, {
      status: 413,
      code: ErrorCodes.REQUEST_TOO_LARGE,
      message: "Request body is too large.",
    });
  }
  if (error instanceof SyntaxError && "body" in error) {
    return sendError(res, {
      status: 400,
      code: ErrorCodes.INVALID_REQUEST,
      message: "Request body is not valid JSON.",
    });
  }

  if (error instanceof ApiError) {
    log.warn("request rejected", {
      status: error.status,
      code: error.code,
      path: req.originalUrl,
    });
    return sendError(res, {
      status: error.status,
      code: error.code,
      message: error.message,
      details: error.details,
    });
  }

  // Unexpected. Log everything; tell the caller nothing.
  log.error("unhandled error", { path: req.originalUrl, method: req.method, error });
  return sendError(res, {
    status: 500,
    code: ErrorCodes.INTERNAL,
    message: "Internal server error.",
  });
}
