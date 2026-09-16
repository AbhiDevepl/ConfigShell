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

/** Resolution only — no plan, no commands. */
export function resolveSelectionHandler(req, res) {
  const { applicationIds, environment } = parsePlanRequest(req.body);
  const resolutions = resolveSelection(applicationIds, environment);

  sendData(res, {
    environment,
    resolutions: resolutions.map((resolution) => ({
      applicationId: resolution.application.id,
      outcome: resolution.outcome,
      ...(resolution.outcome === "resolved"
        ? {
            source: {
              method: resolution.source.method,
              identifier: resolution.source.identifier,
              origin: resolution.source.origin,
            },
            reason: resolution.reason,
          }
        : { reason: resolution.reason, explanation: resolution.explanation }),
    })),
  });
}
