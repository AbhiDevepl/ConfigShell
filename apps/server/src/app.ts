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

import { createMcpHttpHandler } from "@configshell/mcp";
import { env } from "./config/env.js";
import { apiRouter } from "./routes/index.js";
import { healthHandler } from "./controllers/health.controller.js";
import { errorMiddleware } from "./middleware/error.middleware.js";
import { notFoundMiddleware } from "./middleware/not-found.middleware.js";
import { requestContextMiddleware } from "./middleware/request-context.middleware.js";
import { logger } from "./utils/logger.js";

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
  /**
   * Where to mount the MCP endpoint. Defaults to `env.mcpPath` (`/mcp`).
   * `null` disables it, which is what the API tests use so that the MCP
   * transport is not constructed for every unrelated HTTP assertion.
   */
  mcpPath?: string | null;
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

  // The MCP endpoint is mounted BEFORE the JSON body parser on purpose: the
  // SDK's transport reads the raw request stream itself, and an already-
  // consumed body would hang it. Mounting it first also means no API route or
  // static file can ever shadow it.
  mountMcpEndpoint(app, options.mcpPath === undefined ? env.mcpPath : options.mcpPath);

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

/**
 * Mount the MCP server over Streamable HTTP.
 *
 * This is the remote half of the MCP layer: the same `createConfigShellServer()`
 * that `packages/mcp/src/bin.ts` serves over stdio to a local client, reached
 * here over HTTPS by a remote AI host. One server definition, one tool surface,
 * two transports — the alternative would be two implementations drifting apart.
 *
 * The handler is stateless, so nothing is stored between requests and any
 * instance can serve any request. That is what makes this safe behind a
 * load balancer and on serverless infrastructure.
 *
 * The path is configuration (`MCP_PATH`), never a literal in business logic.
 */
function mountMcpEndpoint(app: Express, mcpPath: string | null): void {
  if (!mcpPath) return;

  const { handler } = createMcpHttpHandler({
    // stderr only. This process may also be serving stdio elsewhere, and
    // stdout there carries protocol messages.
    onError: (error) => logger.error("mcp transport error", { message: error.message }),
  });

  app.all(mcpPath, (req: Request, res: Response) => {
    void handler(req, res);
  });
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
