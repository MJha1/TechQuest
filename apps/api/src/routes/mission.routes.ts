import { Router } from "express";
import {
  AnswerStepRequestSchema,
  CompleteMissionRequestSchema,
  StartMissionRequestSchema,
} from "@techquest/shared";
import { requireAuth, requireChildOwnership } from "../middleware/authorize.js";
import { validate } from "../middleware/validate.js";
import {
  getMission,
  getMissions,
  postAnswer,
  postComplete,
  postStart,
} from "../controllers/mission.controller.js";

/**
 * Mission engine routes.
 *
 * Reads (catalog + detail) need a parent session. Mutations additionally carry
 * childId in the (validated, strict) body and are gated by requireChildOwnership
 * on that body field — so a parent can only progress their own child, and the
 * body can never smuggle score/xp/correctness.
 */
export const missionsRouter = Router();

missionsRouter.get("/", requireAuth, getMissions);
missionsRouter.get("/:id", requireAuth, getMission);

missionsRouter.post(
  "/:id/start",
  requireAuth,
  validate({ body: StartMissionRequestSchema }),
  requireChildOwnership("childId", "body"),
  postStart,
);

missionsRouter.post(
  "/:id/steps/:stepId/answer",
  requireAuth,
  validate({ body: AnswerStepRequestSchema }),
  requireChildOwnership("childId", "body"),
  postAnswer,
);

missionsRouter.post(
  "/:id/complete",
  requireAuth,
  validate({ body: CompleteMissionRequestSchema }),
  requireChildOwnership("childId", "body"),
  postComplete,
);
