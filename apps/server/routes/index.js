/**
 * API routing table.
 *
 * Every route the server answers is listed here, which is the point: a reader
 * should be able to see the entire surface in one screen and confirm that
 * nothing executes, nothing writes, and nothing accepts free text destined for
 * a shell.
 *
 *   GET  /health                      liveness + catalog integrity
 *   GET  /api/health                  the same handler, reachable under /api
 *   GET  /api/applications            browse / search / filter
 *   GET  /api/applications/:id        one entry, optionally resolved for a distro
 *   GET  /api/catalog/categories      supported categories
 *   GET  /api/catalog/environments    supported distributions and ecosystems
 *   GET  /api/catalog/roles           deterministic role/use-case presets
 *   GET  /api/catalog/roles/:id       one preset
 *   GET  /api/catalog/stats           counts, computed from the data
 *   POST /api/plan                    selection + environment → plan + commands
 *   POST /api/plan/resolve            selection + environment → resolutions only
 *
 * Not mounted, and not implemented: anything AI-related. `ai.routes.js`,
 * `ai.controller.js` and `ai.service.js` remain empty placeholders that record
 * the intended shape — see docs/ai.md. MCP is likewise out of scope here; it is
 * a separate integration layer over the same installer package (docs/mcp.md).
 */

import { Router } from "express";
import { healthHandler } from "../controllers/health.controller.js";
import { appsRouter } from "./apps.routes.js";
import { catalogRouter } from "./catalog.routes.js";
import { planRouter } from "./plan.routes.js";

export const apiRouter = Router();

// Also served at `/api/health`, not only at `/health`. The top-level path is the
// conventional one for a liveness probe; the `/api` one is what a browser can
// reach through a single proxy rule, so the web app can check whether the API is
// up without a second entry in its dev proxy.
apiRouter.get("/health", healthHandler);

apiRouter.use("/applications", appsRouter);
apiRouter.use("/catalog", catalogRouter);
apiRouter.use("/plan", planRouter);
