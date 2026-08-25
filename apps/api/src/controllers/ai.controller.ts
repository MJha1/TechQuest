import type { Request, Response } from "express";
import { ok } from "@techquest/shared";
import type { HintRequestInput } from "@techquest/shared";
import { generateHint } from "../services/ai.service.js";
import type { AIProvider } from "../ai/provider.js";

/**
 * POST /api/ai/hint — return a short, age-appropriate hint. The provider is
 * injected on `app.locals` (see createApp), so this controller depends only on
 * the AIProvider abstraction. `generateHint` never throws, so the child always
 * gets a hint (real or fallback).
 */
export async function postHint(req: Request, res: Response): Promise<void> {
  const input = req.validated.body as HintRequestInput;
  const provider = req.app.locals.aiProvider as AIProvider;
  res.json(ok(await generateHint(provider, input)));
}
