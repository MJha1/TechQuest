import { Router } from "express";
import { CreateChildSchema, UpdateChildSchema } from "@techquest/shared";
import { requireAuth, requireChildOwnership } from "../middleware/authorize.js";
import { validate } from "../middleware/validate.js";
import {
  createChild,
  getChild,
  listChildren,
  updateChild,
} from "../controllers/children.controller.js";
import {
  getChildMissions,
  getChildBadges,
  getChildRecommendationHandler,
} from "../controllers/mission.controller.js";
import { getChildLeaderboard } from "../controllers/leaderboard.controller.js";

/**
 * Child (learner) routes. Ownership is enforced on EVERY endpoint:
 *  - collection routes are scoped to `req.auth.userId` in the service;
 *  - item routes (`/:id`) additionally run `requireChildOwnership("id")`,
 *    which 403s when Parent A reaches Child B.
 */
export const childrenRouter = Router();

childrenRouter.get("/", requireAuth, listChildren);

childrenRouter.post(
  "/",
  requireAuth,
  validate({ body: CreateChildSchema }),
  createChild,
);

// A child's missions with progress (ownership-gated).
childrenRouter.get(
  "/:childId/missions",
  requireAuth,
  requireChildOwnership("childId"),
  getChildMissions,
);

// A child's badges (earned + locked), for the showcase.
childrenRouter.get(
  "/:childId/badges",
  requireAuth,
  requireChildOwnership("childId"),
  getChildBadges,
);

// A deterministic "what should I do next?" recommendation (ownership-gated).
childrenRouter.get(
  "/:childId/recommendation",
  requireAuth,
  requireChildOwnership("childId"),
  getChildRecommendationHandler,
);

// The family leaderboard (this child's siblings), ownership-gated so the
// standings are scoped to the child's own parent.
childrenRouter.get(
  "/:childId/leaderboard",
  requireAuth,
  requireChildOwnership("childId"),
  getChildLeaderboard,
);

childrenRouter.get("/:id", requireAuth, requireChildOwnership("id"), getChild);

childrenRouter.patch(
  "/:id",
  requireAuth,
  requireChildOwnership("id"),
  validate({ body: UpdateChildSchema }),
  updateChild,
);
