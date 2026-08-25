import type {
  AgeBand,
  Interest,
  Recommendation,
  RecommendedActivity,
} from "@techquest/shared";

/**
 * Deterministic recommendation engine (pure, no I/O, no ML).
 *
 * Given a child's age band, interests, and per-mission performance, it returns
 * exactly one recommendation by applying a fixed, ordered set of rules. The same
 * input always yields the same output, and every result carries an explainable
 * `reason`. This module is intentionally free of Prisma/Express so it can be
 * unit-tested in isolation; the service layer supplies the data.
 *
 * Rules, in priority order:
 *   1. Struggle    — if the child is under-performing on a concept, recommend a
 *                    practice ACTIVITY for that concept (earliest weak concept
 *                    first, so foundations are shored up before moving on).
 *   2. Completion  — else if they've finished a mission, recommend the NEXT one.
 *   3. First       — else (no progress) recommend the FIRST mission.
 *   4. All done    — else everything is complete and mastered.
 *
 * Interests never change WHICH mission/activity is chosen — they only add an
 * example "flavored" toward a selected interest, matching the rule "prefer
 * examples related to that interest." Age band selects the wording register.
 */

/** A graded step is answered "well enough" for a concept at ≥ this accuracy. */
export const MASTERY_ACCURACY = 0.7;

/** One mission's content + this child's measured performance on it. */
export interface MissionPerformance {
  id: string;
  slug: string;
  title: string;
  concept: string;
  order: number;
  estimatedMinutes: number;
  status: "COMPLETED" | "IN_PROGRESS" | "NOT_STARTED";
  /** Number of gradeable steps the child has answered (isCorrect is known). */
  answeredGraded: number;
  /** Of those, how many were correct. */
  correctGraded: number;
}

export interface RecommendationContext {
  ageBand: AgeBand;
  interests: Interest[];
  /** All published missions with this child's performance. Any order; the engine sorts by `order`. */
  missions: MissionPerformance[];
}

/** Accuracy on graded steps, or null if the child hasn't answered any yet. */
function accuracy(m: MissionPerformance): number | null {
  return m.answeredGraded > 0 ? m.correctGraded / m.answeredGraded : null;
}

/** A concept is "struggled" when the child answered graded steps but fell short. */
function struggled(m: MissionPerformance): boolean {
  const acc = accuracy(m);
  return acc !== null && acc < MASTERY_ACCURACY;
}

// ── Concept → practice activity (mirrors the /api/ai/activities registry) ──────
// Keyword-based so it keeps working as new missions/concepts are added.

const ANOTHER_EXAMPLE = { key: "another_example", title: "Ask for another example" };
const SHOULD_VERIFY = { key: "should_verify", title: "Should you double-check this?" };
const IMPROVE_PROMPT = { key: "improve_prompt", title: "Make your instruction clearer" };

/** Pick the activity that best reinforces a concept. */
function activityForConcept(concept: string): { key: string; title: string } {
  const c = concept.toLowerCase();
  if (/(verif|wrong|limitation|check|mistake)/.test(c)) return SHOULD_VERIFY;
  if (/(problem|input|output|prompt|instruction|design)/.test(c)) return IMPROVE_PROMPT;
  return ANOTHER_EXAMPLE;
}

// ── Interests → example framing (age-aware) ────────────────────────────────────
// The child sees an example "flavored" toward one of their interests. When
// several are selected we use the first in the canonical enum order, so the
// choice is stable and explainable.

const INTEREST_LABEL: Record<Interest, string> = {
  GAMES: "games",
  SCIENCE: "science",
  STORIES: "stories",
  SPORTS: "sports",
  ART: "art",
  BUILDING: "building",
};

/** A short, interest-themed example hook, in two age registers. */
const INTEREST_HOOK: Record<Interest, { young: string; older: string }> = {
  GAMES: {
    young: "think about how a game learns which levels you like best",
    older: "think about how a game recommends your next challenge from how you play",
  },
  SCIENCE: {
    young: "think about sorting bugs and leaves into groups, like a little scientist",
    older: "think about running an experiment and spotting a pattern in the results",
  },
  STORIES: {
    young: "think about guessing what happens next in a story",
    older: "think about how a story app suggests the next book you'll enjoy",
  },
  SPORTS: {
    young: "think about learning a new move by watching it lots of times",
    older: "think about how a coach studies past games to predict the next play",
  },
  ART: {
    young: "think about mixing colors until you find the pattern you like",
    older: "think about how a drawing app suggests a color from what you've used",
  },
  BUILDING: {
    young: "think about following steps to build with blocks",
    older: "think about designing instructions so someone else can build it too",
  },
};

const INTEREST_ORDER: Interest[] = [
  "GAMES",
  "SCIENCE",
  "STORIES",
  "SPORTS",
  "ART",
  "BUILDING",
];

/** The interest to use (first selected in canonical order), or null. */
function pickInterest(interests: Interest[]): Interest | null {
  return INTEREST_ORDER.find((i) => interests.includes(i)) ?? null;
}

/** Build the interest-flavored example sentence, or null when no interest. */
function buildExample(ageBand: AgeBand, interest: Interest | null): string | null {
  if (!interest) return null;
  const register = ageBand === "AGE_8_9" ? "young" : "older";
  const hook = INTEREST_HOOK[interest][register];
  return `Since you like ${INTEREST_LABEL[interest]}, ${hook}.`;
}

// ── The engine ─────────────────────────────────────────────────────────────────

export function recommend(ctx: RecommendationContext): Recommendation {
  const missions = [...ctx.missions].sort((a, b) => a.order - b.order);
  const interest = pickInterest(ctx.interests);
  const example = buildExample(ctx.ageBand, interest);

  // Rule 1 — struggle: the earliest concept the child under-performed on.
  const weak = missions.find(struggled);
  if (weak) {
    const activity = activityForConcept(weak.concept);
    const recommendedActivity: RecommendedActivity = { ...activity, concept: weak.concept };
    return {
      kind: "practice_concept",
      reason:
        `“${weak.concept}” looked a little tricky in “${weak.title}”. ` +
        `Let's practice it with a quick activity before moving on.`,
      concept: weak.concept,
      mission: toRecommendedMission(weak),
      activity: recommendedActivity,
      interest,
      example,
    };
  }

  const anyCompleted = missions.some((m) => m.status === "COMPLETED");
  const nextUnfinished = missions.find((m) => m.status !== "COMPLETED");

  // Rule 2 — completion: nothing to shore up, so move forward.
  if (anyCompleted && nextUnfinished) {
    const lastCompleted = [...missions].reverse().find((m) => m.status === "COMPLETED")!;
    const verb = nextUnfinished.status === "IN_PROGRESS" ? "Pick up" : "Next up";
    return {
      kind: "next_mission",
      reason:
        `Great work finishing “${lastCompleted.title}”! ` +
        `${verb}: “${nextUnfinished.title}”.`,
      concept: nextUnfinished.concept,
      mission: toRecommendedMission(nextUnfinished),
      activity: null,
      interest,
      example,
    };
  }

  // Rule 3 — first mission: brand-new learner (no completions, nothing weak).
  if (nextUnfinished) {
    return {
      kind: "first_mission",
      reason: `Start your first mission: “${nextUnfinished.title}”. It's a great place to begin!`,
      concept: nextUnfinished.concept,
      mission: toRecommendedMission(nextUnfinished),
      activity: null,
      interest,
      example,
    };
  }

  // Rule 4 — everything complete and mastered.
  return {
    kind: "all_complete",
    reason: "You've completed every mission — amazing work! New adventures are on the way.",
    concept: null,
    mission: null,
    activity: null,
    interest,
    example,
  };
}

function toRecommendedMission(m: MissionPerformance) {
  return {
    id: m.id,
    slug: m.slug,
    title: m.title,
    concept: m.concept,
    estimatedMinutes: m.estimatedMinutes,
  };
}
