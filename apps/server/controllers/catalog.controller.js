/**
 * Catalog endpoints.
 *
 * Controllers stay thin on purpose: validate, call a service, send. No catalog
 * data is defined here, and no decision about installation is made here — both
 * belong to packages that are typechecked and tested independently of HTTP.
 */

import {
  getCatalogStats,
  getCategories,
  getRole,
  getRoles,
  getSupportedEnvironments,
} from "../services/catalog.service.js";
import { parseRoleId } from "../validators/catalog.validator.js";
import { ApiError, sendData } from "../utils/response.js";

export function listCategories(_req, res) {
  sendData(res, { categories: getCategories() });
}

export function listEnvironments(_req, res) {
  sendData(res, getSupportedEnvironments());
}

export function getStats(_req, res) {
  sendData(res, getCatalogStats());
}

/**
 * Role presets. Deterministic and catalog-driven — see `packages/catalog`'s
 * `roles.ts` for why they are curated lists rather than anything cleverer.
 */
export function listRoles(_req, res) {
  sendData(res, { roles: getRoles() });
}

export function getRoleHandler(req, res) {
  const id = parseRoleId(req.params.id);
  const role = getRole(id);
  if (!role) throw ApiError.notFound(`No role with id "${id}".`);
  sendData(res, { role });
}
