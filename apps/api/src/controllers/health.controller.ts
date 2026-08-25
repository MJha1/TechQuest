import type { Request, Response } from "express";
import { ok } from "@techquest/shared";
import { getHealthStatus } from "../services/health.service.js";

/** Thin controller: delegates to the service, wraps the result in the envelope. */
export async function getHealth(_req: Request, res: Response): Promise<void> {
  const data = await getHealthStatus();
  res.json(ok(data));
}
