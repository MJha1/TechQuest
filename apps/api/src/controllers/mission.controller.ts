import type { Request, Response } from "express";
import { ok } from "@techquest/shared";
import type {
  AnswerStepRequest,
  CompleteMissionRequest,
  StartMissionRequest,
} from "@techquest/shared";
import {
  answerStep,
  completeMission,
  getMissionDetail,
  listChildMissions,
  listMissions,
  startMission,
} from "../services/mission.service.js";

/**
 * Mission engine controllers. Thin: auth/ownership are enforced by middleware
 * and validation by Zod, so these unwrap params/body and call the service.
 * missionId/stepId come from the path; childId (validated + ownership-checked)
 * from the body.
 */

/** Express 5 types route params as string | string[]; normalize to a string. */
const param = (v: string | string[] | undefined): string => (Array.isArray(v) ? v[0]! : v!);

/** GET /api/missions */
export async function getMissions(_req: Request, res: Response): Promise<void> {
  res.json(ok(await listMissions()));
}

/** GET /api/missions/:id */
export async function getMission(req: Request, res: Response): Promise<void> {
  res.json(ok(await getMissionDetail(param(req.params.id))));
}

/** GET /api/children/:childId/missions */
export async function getChildMissions(req: Request, res: Response): Promise<void> {
  res.json(ok(await listChildMissions(req.child!.id)));
}

/** POST /api/missions/:id/start */
export async function postStart(req: Request, res: Response): Promise<void> {
  const { childId } = req.validated.body as StartMissionRequest;
  res.json(ok(await startMission(childId, param(req.params.id))));
}

/** POST /api/missions/:id/steps/:stepId/answer */
export async function postAnswer(req: Request, res: Response): Promise<void> {
  const { childId, response } = req.validated.body as AnswerStepRequest;
  res.json(ok(await answerStep(childId, param(req.params.id), param(req.params.stepId), response)));
}

/** POST /api/missions/:id/complete */
export async function postComplete(req: Request, res: Response): Promise<void> {
  const { childId } = req.validated.body as CompleteMissionRequest;
  res.json(ok(await completeMission(childId, param(req.params.id))));
}
