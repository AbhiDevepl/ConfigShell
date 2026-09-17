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

import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import type { Express, NextFunction, Request, Response } from "express";

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

/**
 * @param {Options} [options] `webDist` overrides where the built web app is
 *   looked for, which is what lets the tests cover both the "a build exists"
 *   and "it does not" paths without depending on whether one happens to be
 *   present. `null` disables static serving outright.
 */
export interface Options {
  webDist?: string | null;
}

export function createApp(options: Options = {}) {
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

  serveBuiltWebApp(app, options.webDist === undefined ? defaultWebDist() : options.webDist);

  app.use(notFoundMiddleware);
  app.use(errorMiddleware);

  return app;
}

/**
 * Serve the built web app, when there is one.
 *
 * The web app calls this API for anything the resolver decides, so in
 * production the two have to share an origin. Serving the build from here is
 * the simplest way to get that: one process, one port, no proxy to configure
 * and no CORS story. `pnpm build && pnpm start` then serves the whole product.
 *
 * Absent in development — `pnpm dev` runs Vite separately and proxies `/api`
 * here — and absent before a build, where this is simply a no-op and the API
 * still works on its own.
 *
 * Static files are mounted **after** `/health` and `/api`, so an API route can
 * never be shadowed by a file, and the SPA fallback explicitly skips `/api` so
 * an unknown endpoint still returns the JSON error envelope rather than HTML.
 */
function defaultWebDist() {
  return resolve(dirname(fileURLToPath(import.meta.url)), "..", "..", "web", "dist");
}

function serveBuiltWebApp(app: Express, distDir: string | null) {
  if (!distDir || !existsSync(distDir)) return;

  app.use(express.static(distDir));

  app.use((req: Request, res: Response, next: NextFunction) => {
    if (req.method !== "GET" && req.method !== "HEAD") return next();
    if (req.path === "/health" || req.path.startsWith("/api")) return next();
    res.sendFile(join(distDir, "index.html"));
  });
}

export { MAX_BODY_SIZE };
