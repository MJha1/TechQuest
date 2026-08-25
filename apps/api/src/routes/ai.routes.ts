import { Router } from "express";
import { HintRequestSchema } from "@techquest/shared";
import { requireAuth } from "../middleware/authorize.js";
import { validate } from "../middleware/validate.js";
import { postHint } from "../controllers/ai.controller.js";

/**
 * AI routes. Authenticated (parent session) + strict, bounded input — a narrow
 * single-purpose hint endpoint, deliberately NOT an open child chatbot. The
 * provider API key stays server-side; the client only ever sees the hint text.
 */
export const aiRouter = Router();

aiRouter.post("/hint", requireAuth, validate({ body: HintRequestSchema }), postHint);
