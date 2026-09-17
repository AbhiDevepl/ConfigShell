/**
 * API server entry point.
 *
 * The only file that binds a port. The application itself lives in `app.js`,
 * which is what tests import.
 *
 * Run it with `pnpm --filter server start`. The process is executed through
 * `tsx` so it can import the workspace's TypeScript packages
 * (`@configshell/catalog`, `@configshell/installer`) directly — see
 * `apps/server/README.md` for why there is no build step.
 */

import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { logger } from "./utils/logger.js";

const app = createApp();

const server = app.listen(env.port, () => {
  logger.info("server listening", { port: env.port, nodeEnv: env.nodeEnv });
});

/**
 * Shut down cleanly on a signal so in-flight requests finish and the process
 * does not have to be killed. Nothing here holds a connection pool or a lock —
 * there is no database — so this is simply closing the listener.
 */
for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => {
    logger.info("shutting down", { signal });
    server.close(() => process.exit(0));
  });
}
