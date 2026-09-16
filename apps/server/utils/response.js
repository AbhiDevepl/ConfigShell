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
  /**
   * @param {number} status HTTP status
   * @param {string} code one of `ErrorCodes`
   * @param {string} message human-readable, safe to return
   * @param {unknown} [details] structured, also safe to return
   */
  constructor(status, code, message, details) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }

  static invalidRequest(message, details) {
    return new ApiError(400, ErrorCodes.INVALID_REQUEST, message, details);
  }

  static unknownApplication(message, details) {
    return new ApiError(422, ErrorCodes.UNKNOWN_APPLICATION, message, details);
  }

  static notFound(message, details) {
    return new ApiError(404, ErrorCodes.NOT_FOUND, message, details);
  }

  static tooLarge(message, details) {
    return new ApiError(413, ErrorCodes.REQUEST_TOO_LARGE, message, details);
  }
}

export function sendData(res, data, status = 200) {
  res.status(status).json({ data });
}

/**
 * @param {import("express").Response} res
 * @param {{ status: number, code: string, message: string, details?: unknown }} error
 */
export function sendError(res, { status, code, message, details }) {
  res.status(status).json({
    error: { code, message, ...(details === undefined ? {} : { details }) },
  });
}
