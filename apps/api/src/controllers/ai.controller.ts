import type { Request, Response } from "express";
import { ok } from "@techquest/shared";
import type { HintRequestInput } from "@techquest/shared";
import { generateHint } from "../services/ai.service.js";
import { AI_ACTIVITIES, listActivities, runActivity } from "../ai/activities.js";
import { notFound } from "../lib/http-error.js";
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

/** GET /api/ai/activities — the catalog of controlled learning activities. */
export async function getActivities(_req: Request, res: Response): Promise<void> {
  res.json(ok(listActivities()));
}

/** POST /api/ai/activities/:activity — run one controlled learning activity. */
export async function postActivity(req: Request, res: Response): Promise<void> {
  const raw = req.params.activity;
  const key = Array.isArray(raw) ? raw[0] : raw;
  const activityDef = key ? AI_ACTIVITIES[key] : undefined;
  if (!activityDef) throw notFound("Unknown activity");

  // Validate the body against THIS activity's controlled input schema. A ZodError
  // propagates to the central handler as a 400 VALIDATION_ERROR.
  const input = activityDef.inputSchema.parse(req.body);
  const provider = req.app.locals.aiProvider as AIProvider;
  res.json(ok(await runActivity(provider, activityDef, input)));
}
