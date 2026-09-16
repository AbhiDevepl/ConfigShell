/**
 * /api/catalog — facts about the catalog itself rather than its entries.
 *
 * Kept separate from `/api/applications` so a client can discover the supported
 * categories, distributions and ecosystems without hardcoding them.
 */

import { Router } from "express";
import { getStats, listCategories, listEnvironments } from "../controllers/catalog.controller.js";

export const catalogRouter = Router();

catalogRouter.get("/categories", listCategories);
catalogRouter.get("/environments", listEnvironments);
catalogRouter.get("/stats", getStats);
