import type { Request, Response } from "express";
import { ok } from "@techquest/shared";
import type { ParentFeedbackInput } from "@techquest/shared";
import { createParentFeedback } from "../services/feedback.service.js";

/** POST /api/feedback — record a parent's rating (+ optional comment). */
export async function postFeedback(req: Request, res: Response): Promise<void> {
  const input = req.validated.body as ParentFeedbackInput;
  const result = await createParentFeedback(req.auth!.userId, input);
  res.status(201).json(ok(result));
}
