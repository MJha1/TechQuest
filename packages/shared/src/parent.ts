import type { AgeBand } from "./enums.js";

/**
 * Parent dashboard contracts (types only).
 *
 * The parent view is educational and calm — progress, concepts, and at-home
 * conversation prompts — deliberately not gamified. Values are computed
 * server-side; the frontend only renders them.
 */

/** One humanized recent event (mission started/completed, badge earned). */
export interface ParentActivityItem {
  label: string;
  /** ISO timestamp. */
  at: string;
}

/** A completed mission's parent-facing takeaway. */
export interface ParentLearned {
  mission: string;
  summary: string;
}

/** An at-home conversation prompt tied to a mission. */
export interface ParentHomePrompt {
  mission: string;
  prompt: string;
}

/** A single child's dashboard, as the parent sees it. */
export interface ParentChildDashboard {
  /** Child id — used only for the "enter learning space" action, never shown. */
  id: string;
  nickname: string;
  ageBand: AgeBand;
  avatar: string | null;
  level: number;
  xp: number;
  streak: number;
  missionsCompleted: number;
  totalMissions: number;
  /** Estimated learning time in minutes (sum of completed missions). */
  learningMinutes: number;
  conceptsLearned: string[];
  recentActivity: ParentActivityItem[];
  whatLearned: ParentLearned[];
  tryAtHome: ParentHomePrompt[];
  recommended: {
    title: string;
    concept: string;
    estimatedMinutes: number;
    prompt: string | null;
  } | null;
}

export interface ParentDashboard {
  children: ParentChildDashboard[];
}
