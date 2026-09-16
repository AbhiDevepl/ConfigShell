/**
 * The Express application.
 *
 * Exported as a factory and kept separate from `index.js`, which is the only
 * file that binds a port. That split is what lets tests exercise the real app
 * without starting a listener or picking a port.
 *
 * ## What this server is
 *
 * A read-only planning API over the trusted catalog. It answers two kinds of
 * question — "what is in the catalog?" and "given this environment and this
 * selection, what should I run?" — and it has no other capabilities.
 *
 * ## What it is not, permanently
 *
 * It does not execute commands. There is no `child_process` import in this
 * application, and adding one would be a change to the security model rather
 * than a feature: a server that ran package-manager commands on a user's behalf
 * would be remote sudo. Execution belongs to a local agent on the user's own
 * machine, with local re-validation and per-step confirmation (docs/agent.md).
 *
 * It also has no database, no authentication and no sessions, because nothing
 * here needs one. The catalog is Git-managed data compiled into the process,
 * and every endpoint is a pure function of the request.
 */

import express from "express";

import { apiRouter } from "./routes/index.js";
import { healthHandler } from "./controllers/health.controller.js";
import { errorMiddleware } from "./middleware/error.middleware.js";
import { notFoundMiddleware } from "./middleware/not-found.middleware.js";
import { requestContextMiddleware } from "./middleware/request-context.middleware.js";

/**
 * Maximum request body.
 *
 * The largest legitimate body is an array of catalog ids; 16 kB is far more
 * than a selection of every application in the catalog needs, and it bounds
 * what an unauthenticated caller can make the process parse.
 */
const MAX_BODY_SIZE = "16kb";

export function createApp() {
  const app = express();

  // Do not advertise the framework. Cheap, and there is no reason to.
  app.disable("x-powered-by");

  // Express's default is to decode `?a[b]=c` into nested objects. Every query
  // parameter this API reads is a flat string, so the simple parser is both
  // sufficient and one less shape to validate against.
  app.set("query parser", "simple");

  app.use(requestContextMiddleware);
  app.use(express.json({ limit: MAX_BODY_SIZE }));

  app.get("/health", healthHandler);
  app.use("/api", apiRouter);

  app.use(notFoundMiddleware);
  app.use(errorMiddleware);

  return app;
}

export { MAX_BODY_SIZE };
