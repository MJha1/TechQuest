import type { Request, Response } from "express";
import { ok } from "@techquest/shared";
import { getParentDashboard } from "../services/parent.service.js";

/** GET /api/parent/dashboard — educational summary for the authenticated parent. */
export async function getDashboard(req: Request, res: Response): Promise<void> {
  res.json(ok(await getParentDashboard(req.auth!.userId)));
}
