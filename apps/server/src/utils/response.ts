/**
 * The API's response shape, in one place.
 *
 * Every success is `{ data }` and every failure is `{ error: { code, message } }`,
 * so a client can branch on the envelope without special-casing endpoints.
 *
 * Error codes are a closed set. They are part of the contract — a client may
 * switch on `code`, and it should never have to parse `message`, which exists
 * for humans and may be reworded.
 */

import type { Response } from "express";

export const ErrorCodes = {
  /** Malformed request: wrong shape, wrong type, unknown enum value. */
  INVALID_REQUEST: "INVALID_REQUEST",
  /** Well-formed, but names something that does not exist in the catalog. */
  UNKNOWN_APPLICATION: "UNKNOWN_APPLICATION",
  /** No such route. */
  NOT_FOUND: "NOT_FOUND",
  /** Request exceeded a documented limit (body size, selection size). */
  REQUEST_TOO_LARGE: "REQUEST_TOO_LARGE",
  /** A bug on our side. Never carries internal detail to the client. */
  INTERNAL: "INTERNAL",
};

/** An error that is safe to show a caller. Anything else becomes INTERNAL. */
export class ApiError extends Error {
  status: number;
  code: string;
  details: unknown;

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }

  static invalidRequest(message: string, details?: unknown) {
    return new ApiError(400, ErrorCodes.INVALID_REQUEST, message, details);
  }

  static unknownApplication(message: string, details?: unknown) {
    return new ApiError(422, ErrorCodes.UNKNOWN_APPLICATION, message, details);
  }

  static notFound(message: string, details?: unknown) {
    return new ApiError(404, ErrorCodes.NOT_FOUND, message, details);
  }

  static tooLarge(message: string, details?: unknown) {
    return new ApiError(413, ErrorCodes.REQUEST_TOO_LARGE, message, details);
  }
}

export function sendData(res: Response, data: unknown, status = 200) {
  res.status(status).json({ data });
}

export function sendError(
  res: Response,
  error: { status: number; code: string; message: string; details?: unknown },
) {
  res.status(error.status).json({
    error: {
      code: error.code,
      message: error.message,
      ...(error.details === undefined ? {} : { details: error.details }),
    },
  });
}
