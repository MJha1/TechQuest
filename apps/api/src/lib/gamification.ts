import type { MissionStepType } from "@techquest/shared";

/**
 * Gamification rules — the single, server-side source of truth for XP, levels,
 * streaks, and badges. Every function here is PURE (no I/O), so the rules are
 * exhaustively unit-testable and the client can never influence a score: the
 * backend computes rewards from what actually happened, never from the request.
 *
 * XP:
 *   - Correct answer (a graded step answered correctly) = 10 XP
 *   - Challenge completed                                = 30 XP
 *   - Mission completed                                  = 100 XP
 */
export const XP_CORRECT_ANSWER = 10;
export const XP_CHALLENGE = 30;
export const XP_MISSION_COMPLETE = 100;
export const XP_PER_LEVEL = 100;

const GRADED: MissionStepType[] = ["CHOICE", "PREDICTION", "DRAG_DROP"];

/** XP a single step submission is worth, given the backend's correctness verdict. */
export function xpForAnswer(type: MissionStepType, isCorrect: boolean | null): number {
  if (type === "CHALLENGE") return XP_CHALLENGE;
  if (GRADED.includes(type) && isCorrect === true) return XP_CORRECT_ANSWER;
  return 0;
}

/** Max XP a step can award — shown in the UI as its potential reward. */
export function potentialXp(type: MissionStepType): number {
  if (type === "CHALLENGE") return XP_CHALLENGE;
  if (GRADED.includes(type)) return XP_CORRECT_ANSWER;
  return 0;
}

/** Level from total XP. Linear: a new level every XP_PER_LEVEL, starting at 1. */
export function levelForXp(totalXp: number): number {
  return Math.floor(Math.max(0, totalXp) / XP_PER_LEVEL) + 1;
}

/** Level + how far into the current level (for progress bars). */
export function xpProgress(totalXp: number): {
  level: number;
  intoLevel: number;
  perLevel: number;
} {
  return {
    level: levelForXp(totalXp),
    intoLevel: Math.max(0, totalXp) % XP_PER_LEVEL,
    perLevel: XP_PER_LEVEL,
  };
}

// ── Streaks ───────────────────────────────────────────────────────────────────

export interface StreakState {
  streak: number;
  longestStreak: number;
  lastActiveAt: Date | null;
}
export interface StreakResult {
  streak: number;
  longestStreak: number;
  lastActiveAt: Date;
  /** Whether this activity advanced (or started/reset) the streak day count. */
  incremented: boolean;
}

/** Calendar day index (UTC) — streaks count distinct days, not 24h windows. */
function dayIndex(d: Date): number {
  return Math.floor(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()) / 86_400_000);
}

/**
 * Advance a streak for activity happening at `now`:
 *   - first ever activity → streak 1
 *   - same calendar day    → unchanged
 *   - the next day         → +1
 *   - a gap of 2+ days     → reset to 1
 */
export function computeStreak(prev: StreakState, now: Date): StreakResult {
  if (!prev.lastActiveAt) {
    return { streak: 1, longestStreak: Math.max(prev.longestStreak, 1), lastActiveAt: now, incremented: true };
  }
  const diff = dayIndex(now) - dayIndex(prev.lastActiveAt);

  let streak: number;
  let incremented: boolean;
  if (diff <= 0) {
    streak = prev.streak;
    incremented = false;
  } else if (diff === 1) {
    streak = prev.streak + 1;
    incremented = true;
  } else {
    streak = 1;
    incremented = true;
  }
  return {
    streak,
    longestStreak: Math.max(prev.longestStreak, streak),
    lastActiveAt: now,
    incremented,
  };
}

// ── Badges ────────────────────────────────────────────────────────────────────

export interface BadgeContext {
  /** Number of missions the child has completed. */
  completedCount: number;
  /** Slugs of completed missions. */
  completedSlugs: Set<string>;
  /** Current streak length in days. */
  streak: number;
}

interface BadgeRule {
  slug: string;
  earned: (ctx: BadgeContext) => boolean;
}

/** Award rules, evaluated server-side against real progress. */
export const BADGE_RULES: readonly BadgeRule[] = [
  { slug: "first-explorer", earned: (c) => c.completedCount >= 1 },
  { slug: "pattern-detective", earned: (c) => c.completedSlugs.has("how-ai-learns") },
  { slug: "ai-explorer", earned: (c) => c.completedCount >= 3 },
  { slug: "builder", earned: (c) => c.completedSlugs.has("build-your-first-ai-idea") },
  { slug: "three-day-streak", earned: (c) => c.streak >= 3 },
];

/** Slugs of every badge the child currently qualifies for. */
export function earnedBadgeSlugs(ctx: BadgeContext): string[] {
  return BADGE_RULES.filter((r) => r.earned(ctx)).map((r) => r.slug);
}
