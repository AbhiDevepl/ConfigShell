/**
 * Application endpoints: browse the catalog, and look one application up.
 */

import { listApplications } from "../services/catalog.service.js";
import { describeApplication } from "../services/app.service.js";
import { parseApplicationId, parseSearchQuery } from "../validators/catalog.validator.js";
import { parseOptionalEnvironmentQuery } from "../validators/app.validator.js";
import { ApiError, sendData } from "../utils/response.js";

export function listApplicationsHandler(req, res) {
  const { query, category } = parseSearchQuery(req.query);
  const applications = listApplications({ query, category });
  sendData(res, { applications, total: applications.length });
}

/**
 * One application.
 *
 * With `?distro=…` it also returns the resolution for that environment — which
 * source would be used, why, and what was rejected. Without it, just the
 * catalog entry, because resolution is meaningless without an environment.
 */
export function getApplicationHandler(req, res) {
  const id = parseApplicationId(req.params.id);
  const environment = parseOptionalEnvironmentQuery(req.query);

  const described = describeApplication(id, environment);
  if (!described) {
    throw ApiError.notFound(`No application with id "${id}".`);
  }

  sendData(res, described);
}
