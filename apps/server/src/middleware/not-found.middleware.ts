/**
 * Terminal 404 handler.
 *
 * Mounted after every route so an unmatched path produces the same error
 * envelope as everything else, rather than Express's default HTML page.
 */

import { ApiError } from "../utils/response.js";

export function notFoundMiddleware(req, _res, next) {
  next(ApiError.notFound(`No route matches ${req.method} ${req.path}.`));
}
