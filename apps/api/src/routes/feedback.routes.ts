import { Router } from "express";
import { ParentFeedbackSchema } from "@techquest/shared";
import { requireAuth } from "../middleware/authorize.js";
import { validate } from "../middleware/validate.js";
import { postFeedback } from "../controllers/feedback.controller.js";

/**
 * Parent feedback. Authenticated (the parent id comes from the session, never
 * the body) + strict, bounded input.
 */
export const feedbackRouter = Router();

feedbackRouter.post("/", requireAuth, validate({ body: ParentFeedbackSchema }), postFeedback);
