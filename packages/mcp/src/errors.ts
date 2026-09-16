/**
 * Tool-level errors.
 *
 * Separate from the JSON-RPC transport on purpose: a tool decides *what* went
 * wrong, and the transport decides how to say it on the wire. That split is
 * what lets the tools be tested without speaking the protocol.
 *
 * Every message here is written to be safe to hand back to an untrusted caller:
 * it says what was wrong with the request and nothing about the inside of this
 * process — no paths, no stack traces, no environment.
 */

/** Closed set. A caller may switch on `code`; `message` is for humans. */
export type ToolErrorCode =
  /** Malformed arguments: wrong shape, wrong type, unknown enum value. */
  | 'INVALID_ARGUMENTS'
  /** Well-formed, but names something the catalog does not contain. */
  | 'UNKNOWN_APPLICATION'
  /** Well-formed, but no such catalog entry / role / tool. */
  | 'NOT_FOUND'
  /** A documented limit was exceeded. */
  | 'TOO_LARGE';

export class ToolError extends Error {
  constructor(
    readonly code: ToolErrorCode,
    message: string,
    readonly details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = 'ToolError';
  }

  static invalidArguments(message: string, details?: Record<string, unknown>): ToolError {
    return new ToolError('INVALID_ARGUMENTS', message, details);
  }

  static unknownApplication(message: string, details?: Record<string, unknown>): ToolError {
    return new ToolError('UNKNOWN_APPLICATION', message, details);
  }

  static notFound(message: string, details?: Record<string, unknown>): ToolError {
    return new ToolError('NOT_FOUND', message, details);
  }

  static tooLarge(message: string, details?: Record<string, unknown>): ToolError {
    return new ToolError('TOO_LARGE', message, details);
  }
}
