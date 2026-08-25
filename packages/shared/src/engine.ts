import type { MissionStatus, StepStatus, MissionStepType } from "./enums.js";
import type { Mission } from "./domain.js";

/**
 * Mission-engine response contracts (types only).
 *
 * These are the shapes the API returns and the web renderer consumes — one
 * definition for both sides. Step `content` is `unknown` here because it is
 * data-driven per `MissionStepType` and, crucially, is *sanitized* server-side
 * (answer keys removed) before it reaches the browser.
 */

/** A mission step as served to the client — content has answer keys stripped. */
export interface ServedStep {
  id: string;
  missionId: string;
  order: number;
  type: MissionStepType;
  title: string | null;
  content: unknown;
  xpReward: number;
}

/** A mission plus its ordered, sanitized steps. */
export interface MissionDetail extends Mission {
  steps: ServedStep[];
}

/** One child's progress on one step. */
export interface ChildStepState {
  missionStepId: string;
  status: StepStatus;
  isCorrect: boolean | null;
  attempts: number;
  response: unknown | null;
  completedAt: string | null;
}

/** Full state of a child working through a mission (used by start/resume). */
export interface ChildMissionState {
  mission: MissionDetail;
  status: MissionStatus;
  score: number | null;
  startedAt: string | null;
  completedAt: string | null;
  steps: ChildStepState[];
}

/** A mission summary joined with a child's progress (mission list per child). */
export interface ChildMissionSummary {
  mission: Mission;
  totalSteps: number;
  completedSteps: number;
  progress: {
    status: MissionStatus;
    score: number | null;
    startedAt: string | null;
    completedAt: string | null;
  } | null;
}

/** A child's gamification snapshot, returned with every reward. */
export interface ChildStats {
  xp: number;
  level: number;
  streak: number;
}

/** Result of grading a submitted step answer. */
export interface AnswerResult {
  /** true/false for graded steps; null for open-ended/acknowledge steps. */
  correct: boolean | null;
  /** Post-answer explanation/reveal text, when the step has one. */
  feedback: string | null;
  /** XP the backend awarded for this submission (0 if none). */
  xpAwarded: number;
  step: ChildStepState;
  child: ChildStats;
}

/** Result of completing a mission (idempotent). */
export interface CompleteResult {
  status: MissionStatus;
  /** Mission slug (stable, non-identifying) — handy for analytics. */
  missionSlug: string;
  score: number;
  completedAt: string | null;
  /** XP awarded by this call (0 when the mission was already complete). */
  xpAwarded: number;
  /** True when the mission was already complete before this call. */
  alreadyCompleted: boolean;
  /** Slugs of badges newly earned by this completion. */
  badges: string[];
  child: ChildStats;
}

/** A badge and whether the child has earned it (badge showcase). */
export interface BadgeView {
  slug: string;
  name: string;
  description: string;
  icon: string | null;
}
export interface BadgeStatus {
  badge: BadgeView;
  earned: boolean;
  earnedAt: string | null;
}
