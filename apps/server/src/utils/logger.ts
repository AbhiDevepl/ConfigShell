/**
 * Structured logging (PRD §40).
 *
 * One JSON object per line on stdout/stderr, which is what log collectors
 * expect and what stays greppable when there is no collector. No dependency:
 * the whole surface is four levels and a child logger, and a logging library
 * would be more code than this.
 *
 * What is deliberately NOT logged, per PRD §40:
 *   - secrets of any kind (the server holds none — there are no API keys, no
 *     database URL and no auth, by design)
 *   - request bodies, which for this API are a user's application selection
 *   - raw system information about a caller's machine
 *
 * The only environment data that reaches a log line is the distribution the
 * caller explicitly asked to plan for, which is the one field needed to make
 * a resolution decision explicable after the fact.
 */

const LEVELS = { info: 20, warn: 30, error: 40 };

const activeLevel = () => (process.env.NODE_ENV === "test" ? LEVELS.error : LEVELS.info);

/**
 * Turn an Error into something JSON.stringify can represent. Stack traces are
 * kept out of production output: they are useful locally and are noise (and a
 * mild information leak) in a deployed log.
 */
function serialiseError(error) {
  if (!(error instanceof Error)) return { message: String(error) };
  return {
    name: error.name,
    message: error.message,
    ...(process.env.NODE_ENV === "production" ? {} : { stack: error.stack }),
  };
}

/**
 * @param {"info"|"warn"|"error"} level
 * @param {string} message
 * @param {Record<string, unknown> & { error?: unknown }} [context]
 */
function write(level, message, context = {}) {
  if (LEVELS[level] < activeLevel()) return;

  const { error, ...rest } = context;
  const line = {
    time: new Date().toISOString(),
    level,
    message,
    ...rest,
    ...(error === undefined ? {} : { error: serialiseError(error) }),
  };

  const serialised = JSON.stringify(line);
  if (level === "error" || level === "warn") {
    process.stderr.write(`${serialised}\n`);
  } else {
    process.stdout.write(`${serialised}\n`);
  }
}

function make(base = {}) {
  return {
    info: (message, context) => write("info", message, { ...base, ...context }),
    warn: (message, context) => write("warn", message, { ...base, ...context }),
    error: (message, context) => write("error", message, { ...base, ...context }),
    /** A logger that stamps every line with extra fields — e.g. a request id. */
    child: (fields) => make({ ...base, ...fields }),
  };
}

export const logger = make();
