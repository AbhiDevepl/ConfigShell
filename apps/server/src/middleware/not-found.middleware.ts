/**
 * Terminal 404 handler.
 *
 * Mounted after every route so an unmatched path produces the same error
 * envelope as everything else, rather than Express's default HTML page.
 */

import type { NextFunction, Request, Response } from "express";

import { ApiError } from "../utils/response.js";

export function notFoundMiddleware(req: Request, _res: Response, next: NextFunction) {
  next(ApiError.notFound(`No route matches ${req.method} ${req.path}.`));
}