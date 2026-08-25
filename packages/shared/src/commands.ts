import { z } from "zod";
import { AgeBand, FeedbackKind } from "./enums.js";
import { JsonSchema } from "./json.js";

/**
 * Request/command schemas — the validated inputs the API accepts.
 *
 * These are intentionally stricter than the domain schemas: `.strict()` rejects
 * unknown keys, and ids/lengths are bounded. Server-controlled fields (ids from
 * the session/route, xp, level, timestamps) are never accepted from the client.
 */

const cuid = z.string().cuid();
const nickname = z.string().trim().min(2).max(20);
const avatar = z.string().trim().max(64);

// ── Parent account (auth) ─────────────────────────────────────────────────────

// Credentials for parent signup/login. The API delegates auth to Better Auth;
// this schema is the shared client-side validation contract for the forms, so
// the same rules live in exactly one place.
export const ParentCredentialsSchema = z
  .object({
    email: z.string().trim().email(),
    password: z.string().min(8, "Use at least 8 characters").max(128),
  })
  .strict();
export type ParentCredentialsInput = z.infer<typeof ParentCredentialsSchema>;

// ── Children ──────────────────────────────────────────────────────────────────

// Only the minimum, non-identifying fields. parentId comes from the session.
export const CreateChildSchema = z
  .object({
    nickname,
    ageBand: AgeBand,
    avatar: avatar.optional(),
  })
  .strict();
export type CreateChildInput = z.infer<typeof CreateChildSchema>;

export const UpdateChildSchema = z
  .object({
    nickname: nickname.optional(),
    ageBand: AgeBand.optional(),
    avatar: avatar.optional(),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field is required",
  });
export type UpdateChildInput = z.infer<typeof UpdateChildSchema>;

// ── Mission engine requests ───────────────────────────────────────────────────
// missionId/stepId travel in the route path; only childId (+ a step response)
// come in the body. These are `.strict()` and deliberately DO NOT accept score,
// xp, or isCorrect — the backend computes all of those. The child is identified
// by childId and authorized by requireChildOwnership.

// childId is a non-empty string here (not a strict cuid): the real gate is
// requireChildOwnership, which 403/404s an id that isn't the parent's own child.
const childId = z.string().min(1);

export const StartMissionRequestSchema = z.object({ childId }).strict();
export type StartMissionRequest = z.infer<typeof StartMissionRequestSchema>;

export const AnswerStepRequestSchema = z
  .object({ childId, response: JsonSchema })
  .strict();
export type AnswerStepRequest = z.infer<typeof AnswerStepRequestSchema>;

export const CompleteMissionRequestSchema = z.object({ childId }).strict();
export type CompleteMissionRequest = z.infer<typeof CompleteMissionRequestSchema>;

// ── Missions & progress (generic, legacy) ─────────────────────────────────────

export const StartMissionSchema = z.object({ missionId: cuid }).strict();
export type StartMissionInput = z.infer<typeof StartMissionSchema>;

export const SubmitAnswerSchema = z
  .object({
    missionStepId: cuid,
    response: JsonSchema,
    timeSpentMs: z.number().int().nonnegative().max(3_600_000).optional(),
  })
  .strict();
export type SubmitAnswerInput = z.infer<typeof SubmitAnswerSchema>;

export const CompleteMissionSchema = z
  .object({
    missionId: cuid,
    score: z.number().int().min(0).max(100).optional(),
  })
  .strict();
export type CompleteMissionInput = z.infer<typeof CompleteMissionSchema>;

// ── Bounded AI ────────────────────────────────────────────────────────────────
// Both requests are narrow by design (no open-ended chat): fixed shapes, small
// bounded free-text, always tied to a specific mission step.

export const FeedbackRequestSchema = z
  .object({
    missionId: cuid,
    missionStepId: cuid,
    kind: FeedbackKind,
    submission: JsonSchema,
  })
  .strict();
export type FeedbackRequestInput = z.infer<typeof FeedbackRequestSchema>;

export const AIHintRequestSchema = z
  .object({
    missionId: cuid,
    missionStepId: cuid,
    question: z.string().trim().min(1).max(200).optional(),
  })
  .strict();
export type AIHintRequestInput = z.infer<typeof AIHintRequestSchema>;

// Request for the AI hint endpoint (POST /api/ai/hint). All fields are bounded
// so the endpoint stays a narrow, single-purpose helper — not an open chat.
export const HintRequestSchema = z
  .object({
    missionContext: z.string().trim().min(1).max(200),
    learningObjective: z.string().trim().min(1).max(300),
    question: z.string().trim().min(1).max(500),
    attempt: z.string().trim().max(500).optional().default(""),
  })
  .strict();
export type HintRequestInput = z.infer<typeof HintRequestSchema>;
