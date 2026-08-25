import { Router } from "express";
import { HintRequestSchema } from "@techquest/shared";
import { requireAuth } from "../middleware/authorize.js";
import { validate } from "../middleware/validate.js";
import { getActivities, postActivity, postHint } from "../controllers/ai.controller.js";

/**
 * AI routes. Authenticated (parent session) + strict, bounded input — narrow,
 * single-purpose learning tools, deliberately NOT an open child chatbot. The
 * provider API key stays server-side; the client only ever sees the output text.
 */
export const aiRouter = Router();

aiRouter.post("/hint", requireAuth, validate({ body: HintRequestSchema }), postHint);

// Controlled AI learning activities (catalog + run-one).
aiRouter.get("/activities", requireAuth, getActivities);
aiRouter.post("/activities/:activity", requireAuth, postActivity);
