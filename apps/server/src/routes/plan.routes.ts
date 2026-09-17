/**
 * /api/plan — turn a selection plus an environment into a reviewable setup plan
 * and the commands that go with it.
 *
 * `POST` rather than `GET` because the input is a selection, not an identifier.
 * It is still a **pure read**: nothing is stored, nothing is mutated, and
 * nothing is executed. The same request always produces the same plan.
 */

import { Router } from "express";
import { createPlanHandler, resolveSelectionHandler } from "../controllers/plan.controller.js";

export const planRouter = Router();

planRouter.post("/", createPlanHandler);
planRouter.post("/resolve", resolveSelectionHandler);
