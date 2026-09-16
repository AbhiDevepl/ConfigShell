/**
 * The stdio transport.
 *
 * MCP's stdio transport is newline-delimited JSON on stdin/stdout. Two rules
 * matter and both are load-bearing:
 *
 * 1. **A message must not contain an embedded newline**, since newlines frame
 *    them. `JSON.stringify` escapes them inside strings, so this holds as long
 *    as nothing else writes to stdout.
 * 2. **Nothing but protocol messages may go to stdout.** Diagnostics go to
 *    stderr. A stray `console.log` anywhere in the process would corrupt the
 *    stream, which is why this file is the only place that writes to stdout.
 */

import type { Interface } from 'node:readline';
import { handleMessage, type JsonRpcResponse } from './protocol.ts';

export interface ServerIo {
  /** Emit one framed message. */
  send: (response: JsonRpcResponse) => void;
  /** Diagnostics. Never stdout. */
  log: (message: string) => void;
}

/**
 * Process one raw line.
 *
 * A line that is not JSON is a parse error, which by JSON-RPC convention is
 * reported against a null id. Blank lines are ignored rather than treated as
 * errors — they are a normal artefact of line-based framing.
 */
export function handleLine(line: string, io: ServerIo): void {
  const trimmed = line.trim();
  if (trimmed === '') return;

  let message: unknown;
  try {
    message = JSON.parse(trimmed);
  } catch {
    io.send({
      jsonrpc: '2.0',
      id: null,
      error: { code: -32700, message: 'Parse error: message is not valid JSON.' },
    });
    return;
  }

  const response = handleMessage(message);
  if (response !== null) io.send(response);
}

/** Wire a readline interface to the handler. Used by `bin.ts`. */
export function serve(input: Interface, io: ServerIo): void {
  input.on('line', (line) => {
    try {
      handleLine(line, io);
    } catch (cause) {
      // The handler is not supposed to throw; if it does, the server stays up
      // rather than taking the client's session down with it.
      io.log(`unhandled error: ${cause instanceof Error ? cause.message : String(cause)}`);
      io.send({
        jsonrpc: '2.0',
        id: null,
        error: { code: -32603, message: 'Internal error.' },
      });
    }
  });
}
