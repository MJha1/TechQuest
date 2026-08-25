import { z } from "zod";
import {
  AgeBand,
  FeedbackKind,
  LearningEventType,
  MissionStatus,
  MissionStepType,
  SafetyVerdict,
  StepStatus,
} from "./enums.js";
import { JsonSchema } from "./json.js";

/**
 * Domain entities as they cross the API (JSON wire format).
 *
 * Timestamps are ISO-8601 strings here — the backend serializes Prisma `Date`
 * values to strings on the way out, and the frontend consumes them as strings.
 * These schemas are the shared contract; there are no separate frontend/backend
 * copies.
 */

const isoDate = z.string().datetime();

// ── Content ─────────────────────────────────────────────────────────────────

export const MissionStepSchema = z.object({
  id: z.string(),
  missionId: z.string(),
  order: z.number().int().positive(),
  type: MissionStepType,
  title: z.string().nullable(),
  content: JsonSchema,
  xpReward: z.number().int().nonnegative(),
  createdAt: isoDate,
  updatedAt: isoDate,
});
export type MissionStep = z.infer<typeof MissionStepSchema>;

export const MissionSchema = z.object({
  id: z.string(),
  slug: z.string(),
  title: z.string(),
  subtitle: z.string().nullable(),
  concept: z.string(),
  description: z.string().nullable(),
  order: z.number().int(),
  estimatedMinutes: z.number().int().positive(),
  isPublished: z.boolean(),
  createdAt: isoDate,
  updatedAt: isoDate,
});
export type Mission = z.infer<typeof MissionSchema>;

/** A mission together with its ordered steps (mission-detail responses). */
export const MissionWithStepsSchema = MissionSchema.extend({
  steps: z.array(MissionStepSchema),
});
export type MissionWithSteps = z.infer<typeof MissionWithStepsSchema>;

// ── Learner ─────────────────────────────────────────────────────────────────

export const ChildSchema = z.object({
  id: z.string(),
  parentId: z.string(),
  nickname: z.string(),
  ageBand: AgeBand,
  avatar: z.string().nullable(),
  level: z.number().int(),
  xp: z.number().int(),
  streak: z.number().int(),
  longestStreak: z.number().int(),
  lastActiveAt: isoDate.nullable(),
  createdAt: isoDate,
  updatedAt: isoDate,
});
export type Child = z.infer<typeof ChildSchema>;

// ── Progress ────────────────────────────────────────────────────────────────

export const StepProgressSchema = z.object({
  id: z.string(),
  childId: z.string(),
  childMissionId: z.string(),
  missionStepId: z.string(),
  status: StepStatus,
  response: JsonSchema.nullable(),
  isCorrect: z.boolean().nullable(),
  attempts: z.number().int().nonnegative(),
  completedAt: isoDate.nullable(),
  createdAt: isoDate,
  updatedAt: isoDate,
});
export type StepProgress = z.infer<typeof StepProgressSchema>;

export const MissionProgressSchema = z.object({
  id: z.string(),
  childId: z.string(),
  missionId: z.string(),
  status: MissionStatus,
  score: z.number().int().nullable(),
  startedAt: isoDate.nullable(),
  completedAt: isoDate.nullable(),
  createdAt: isoDate,
  updatedAt: isoDate,
  steps: z.array(StepProgressSchema).optional(),
});
export type MissionProgress = z.infer<typeof MissionProgressSchema>;

// ── Rewards ─────────────────────────────────────────────────────────────────

export const BadgeSchema = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
  description: z.string(),
  icon: z.string().nullable(),
  criteria: JsonSchema.nullable(),
  createdAt: isoDate,
  updatedAt: isoDate,
});
export type Badge = z.infer<typeof BadgeSchema>;

/** A badge a child has earned (badge + when it was earned). */
export const EarnedBadgeSchema = BadgeSchema.extend({ earnedAt: isoDate });
export type EarnedBadge = z.infer<typeof EarnedBadgeSchema>;

// ── Analytics & AI audit ──────────────────────────────────────────────────────

export const LearningEventSchema = z.object({
  id: z.string(),
  childId: z.string(),
  missionId: z.string().nullable(),
  missionStepId: z.string().nullable(),
  type: LearningEventType,
  payload: JsonSchema.nullable(),
  createdAt: isoDate,
});
export type LearningEvent = z.infer<typeof LearningEventSchema>;

export const FeedbackSchema = z.object({
  id: z.string(),
  childId: z.string(),
  missionId: z.string().nullable(),
  missionStepId: z.string().nullable(),
  kind: FeedbackKind,
  inputSummary: z.string().nullable(),
  content: z.string(),
  model: z.string().nullable(),
  safety: SafetyVerdict,
  promptTokens: z.number().int().nullable(),
  completionTokens: z.number().int().nullable(),
  createdAt: isoDate,
});
export type Feedback = z.infer<typeof FeedbackSchema>;
