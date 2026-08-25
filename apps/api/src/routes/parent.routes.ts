import { Router } from "express";
import { requireAuth } from "../middleware/authorize.js";
import { getDashboard } from "../controllers/parent.controller.js";

/**
 * Parent routes. Parent-authenticated; the dashboard is scoped to the signed-in
 * parent's own children (no childId needed — it comes from the session).
 */
export const parentRouter = Router();

parentRouter.get("/dashboard", requireAuth, getDashboard);
