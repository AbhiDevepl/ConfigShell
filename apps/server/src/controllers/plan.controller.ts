/**
 * Setup-plan endpoints.
 *
 * These are the only endpoints that accept a request body, and the only ones
 * whose output becomes something a user will paste into a terminal. Both facts
 * are handled in `validators/plan.validator.js` and in the installer package's
 * command generation; this controller adds no logic of its own beyond logging
 * what was planned.
 *
 * Nothing here executes anything. See `services/plan.service.js` for why that
 * boundary is permanent rather than pending.
 */

import { presentResolution } from "@configshell/installer";
import { createSetupPlan, resolveSelection } from "../services/plan.service.js";
import { parsePlanRequest } from "../validators/plan.validator.js";
import { sendData } from "../utils/response.js";

export function createPlanHandler(req, res) {
  const { applicationIds, environment } = parsePlanRequest(req.body);
  const plan = createSetupPlan(applicationIds, environment);

  // Log the shape of the decision, not the selection itself: enough to explain
  // a resolution after the fact, without recording what a user chose to install.
  req.log?.info("plan generated", {
    distro: environment.distro,
    ecosystem: environment.ecosystem,
    ...plan.summary,
  });

  sendData(res, plan);
}

/**
 * Resolution only — no plan, no commands.
 *
 * Flattened with the installer's own `presentResolution`, the same function
 * `GET /api/applications/:id?distro=…` and the MCP tools use. It previously
 * shaped the response inline here, which made this the one endpoint that
 * described a resolution differently from every other: no `applicationName`,
 * and no `considered` — so a caller could see *which* source won but not which
 * were rejected or why, on the endpoint whose entire purpose is explaining
 * resolution. One flattener, one shape.
 */
export function resolveSelectionHandler(req, res) {
  const { applicationIds, environment } = parsePlanRequest(req.body);
  const resolutions = resolveSelection(applicationIds, environment);

  sendData(res, {
    environment,
    resolutions: resolutions.map(presentResolution),
  });
}
