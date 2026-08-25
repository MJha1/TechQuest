import { z } from "zod";

/**
 * Domain enums.
 *
 * IMPORTANT: the string values here must stay in sync with the Prisma enums in
 * `packages/db/prisma/schema.prisma`. This package is the browser-safe contract
 * layer, so it cannot import the Prisma client — the values are mirrored here on
 * purpose and both frontend and backend import them from this single place.
 *
 * Each export is both a runtime Zod schema and a TypeScript type of the same
 * name (value + type namespaces), so callers can validate and type off one name.
 */

export const AgeBand = z.enum(["AGE_8_9", "AGE_10_12"]);
export type AgeBand = z.infer<typeof AgeBand>;

export const MissionStepType = z.enum([
  "INTRO",
  "QUESTION",
  "CHOICE",
  "DRAG_DROP",
  "PREDICTION",
  "CHALLENGE",
  "REFLECTION",
  "COMPLETION",
]);
export type MissionStepType = z.infer<typeof MissionStepType>;

export const MissionStatus = z.enum(["LOCKED", "IN_PROGRESS", "COMPLETED"]);
export type MissionStatus = z.infer<typeof MissionStatus>;

export const StepStatus = z.enum(["NOT_STARTED", "IN_PROGRESS", "COMPLETED"]);
export type StepStatus = z.infer<typeof StepStatus>;

export const LearningEventType = z.enum([
  "MISSION_STARTED",
  "STEP_STARTED",
  "STEP_COMPLETED",
  "MISSION_COMPLETED",
  "XP_AWARDED",
  "LEVEL_UP",
  "BADGE_EARNED",
  "STREAK_EXTENDED",
  "AI_FEEDBACK_SERVED",
]);
export type LearningEventType = z.infer<typeof LearningEventType>;

export const FeedbackKind = z.enum([
  "ANSWER_FEEDBACK",
  "MISSION_IDEA",
  "ENCOURAGEMENT",
]);
export type FeedbackKind = z.infer<typeof FeedbackKind>;

export const SafetyVerdict = z.enum(["SAFE", "FLAGGED", "BLOCKED"]);
export type SafetyVerdict = z.infer<typeof SafetyVerdict>;
