/**
 * Application endpoints: browse the catalog, and look one application up.
 */

import { presentResolution, resolve } from "@configshell/installer";
import { getApplication, listApplications } from "../services/catalog.service.js";
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
 * source would be used, why, and what was rejected — presented in the same
 * shape `POST /api/plan` uses, so a client that can read one resolution can
 * read them all. Without it, just the catalog entry, because resolution is
 * meaningless without an environment.
 */
export function getApplicationHandler(req, res) {
  const id = parseApplicationId(req.params.id);
  const environment = parseOptionalEnvironmentQuery(req.query);

  const application = getApplication(id);
  if (!application) {
    throw ApiError.notFound(`No application with id "${id}".`);
  }

  sendData(res, {
    application,
    ...(environment
      ? { resolution: presentResolution(resolve(application, environment)) }
      : {}),
  });
}
