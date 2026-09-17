/**
 * /api/applications — browse the catalog and look up a single entry.
 */

import { Router } from "express";
import {
  getApplicationHandler,
  listApplicationsHandler,
} from "../controllers/app.controller.js";

export const appsRouter = Router();

appsRouter.get("/", listApplicationsHandler);
appsRouter.get("/:id", getApplicationHandler);
