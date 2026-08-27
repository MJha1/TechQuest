/**
 * Group leaderboard contracts.
 *
 * Phase 1 is the FAMILY scope: a leaderboard among one parent's own children
 * (siblings), computed server-side. It exposes only non-identifying, gameplay
 * data — nickname, preset avatar, and aggregate stats — never age, interests,
 * responses, or any PII. (Cross-family "circles" arrive in a later phase and
 * will reuse these shapes with `scope: "circle"`.)
 */

/** One learner's standing in a leaderboard. */
export interface LeaderboardEntry {
  /** Child id (opaque). */
  id: string;
  nickname: string;
  /** Preset avatar id, never an uploaded photo. */
  avatar: string | null;
  level: number;
  xp: number;
  streak: number;
  missionsCompleted: number;
  /** Ids of the published missions this learner has completed (for the board). */
  completedMissionIds: string[];
  /** 1-based rank; ties (same xp, missions, level) share a rank. */
  rank: number;
  /** True for the learner viewing the board (their own row). */
  isCurrent: boolean;
}

/** A mission column shown on the completion board. */
export interface LeaderboardMission {
  id: string;
  slug: string;
  title: string;
  order: number;
}

/** The family leaderboard payload for a child's group view. */
export interface FamilyLeaderboard {
  scope: "family";
  /** The viewing child's id (their row is flagged `isCurrent`). */
  currentChildId: string;
  totalMissions: number;
  /** Published missions in catalog order (columns for the completion board). */
  missions: LeaderboardMission[];
  /** Entries sorted by rank (best first). */
  entries: LeaderboardEntry[];
}
