import type { Request, Response } from "express";
import { ok } from "@techquest/shared";

/**
 * Returns the authenticated account's id. Mounted behind `requireAuth`, so
 * `req.auth` is guaranteed present here. Exists to exercise the auth pipeline;
 * richer account/child endpoints come later.
 */
export async function getMe(req: Request, res: Response): Promise<void> {
  res.json(ok({ userId: req.auth!.userId }));
}
