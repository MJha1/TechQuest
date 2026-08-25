import { Router } from "express";
import { requireAuth } from "../middleware/authorize.js";
import { getMe } from "../controllers/me.controller.js";

export const meRouter = Router();

meRouter.get("/", requireAuth, getMe);
