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

childrenRouter.get("/:id", requireAuth, requireChildOwnership("id"), getChild);

childrenRouter.patch(
  "/:id",
  requireAuth,
  requireChildOwnership("id"),
  validate({ body: UpdateChildSchema }),
  updateChild,
);
