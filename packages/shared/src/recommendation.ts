import type { Interest } from "./enums.js";

/**
 * Recommendation contract (types only).
 *
 * The recommendation is produced by a deterministic, rule-based engine — no
 * machine learning. Given the same child data it always returns the same result,
 * and every result carries a plain-language `reason` so the suggestion is fully
 * explainable to a parent or child.
 */

export type RecommendationKind =
  | "practice_concept" // the child struggled with a concept → practice it
  | "next_mission" // the child completed a mission → the next one
  | "first_mission" // no progress yet → start at the beginning
  | "all_complete"; // everything finished and mastered

/** A mission the child can start, continue, or replay. */
export interface RecommendedMission {
  id: string;
  slug: string;
  title: string;
  concept: string;
  estimatedMinutes: number;
}

/** A controlled AI learning activity to reinforce a specific concept. */
export interface RecommendedActivity {
  /** AI activity key (mirrors the /api/ai/activities registry). */
  key: string;
  title: string;
  /** The concept the activity should reinforce. */
  concept: string;
}

export interface Recommendation {
  kind: RecommendationKind;
  /** Kid-friendly explanation of WHY this was recommended (always present). */
  reason: string;
  /** The concept in focus (the struggled concept, or the mission's concept). */
  concept: string | null;
  /** A mission to start / continue / replay (null for all-complete). */
  mission: RecommendedMission | null;
  /** A practice activity — only set for `practice_concept`. */
  activity: RecommendedActivity | null;
  /** The interest used to flavor the example, if the child selected any. */
  interest: Interest | null;
  /** An interest-related example/framing (null when the child has no interests). */
  example: string | null;
}
