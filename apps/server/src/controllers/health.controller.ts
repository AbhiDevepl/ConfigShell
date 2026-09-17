/**
 * Health endpoint (PRD §40).
 *
 * Reports liveness *and* catalog integrity. The catalog is trusted data that
 * feeds command generation, so "is the catalog still valid" is a genuine
 * readiness question rather than a build-time one — a process serving an
 * invalid catalog should not be considered healthy.
 *
 * Deliberately free of anything sensitive: no versions of dependencies, no
 * paths, no environment variables, no host information.
 */

import type { Request, Response } from "express";

import { checkCatalogIntegrity } from "../services/catalog.service.js";
import { sendData } from "../utils/response.js";

export function healthHandler(_req: Request, res: Response) {
  const catalog = checkCatalogIntegrity();
  const status = catalog.valid ? "ok" : "degraded";

  sendData(
    res,
    {
      status,
      uptimeSeconds: Math.round(process.uptime()),
      catalog,
      /** Stated explicitly: this process plans and validates, never executes. */
      capabilities: { plansInstallations: true, executesCommands: false },
    },
    catalog.valid ? 200 : 503,
  );
}