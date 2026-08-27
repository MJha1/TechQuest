import type { Request, Response } from "express";
import { ok } from "@techquest/shared";
import { getFamilyLeaderboard } from "../services/leaderboard.service.js";

/**
 * GET /api/children/:childId/leaderboard
 *
 * The family leaderboard for the given child. Ownership is enforced by
 * `requireChildOwnership` (which attaches the verified `req.child`), so the
 * standings are scoped to that child's parent — siblings only.
 */
export async function getChildLeaderboard(req: Request, res: Response): Promise<void> {
  res.json(ok(await getFamilyLeaderboard(req.child!.parentId, req.child!.id)));
}
