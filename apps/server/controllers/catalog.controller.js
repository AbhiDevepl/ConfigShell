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
  getSupportedEnvironments,
} from "../services/catalog.service.js";
import { sendData } from "../utils/response.js";

export function listCategories(_req, res) {
  sendData(res, { categories: getCategories() });
}

export function listEnvironments(_req, res) {
  sendData(res, getSupportedEnvironments());
}

export function getStats(_req, res) {
  sendData(res, getCatalogStats());
}
