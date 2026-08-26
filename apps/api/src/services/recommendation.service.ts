import { prisma } from "@techquest/db";
import type { AgeBand, Interest, Recommendation } from "@techquest/shared";
import { notFound } from "../lib/http-error.js";
import {
  recommend,
  type MissionPerformance,
  type RecommendationContext,
} from "../lib/recommendation.js";

/**
 * Assembles a child's recommendation context from the database, then defers to
 * the pure, deterministic engine (`lib/recommendation.ts`) for the decision.
 * All the branching/rule logic lives in the engine so it can be unit-tested
 * without a database; this layer is just data-loading + shaping.
 */

// Step types whose correctness is objectively graded (mirrors the mission engine).
const GRADED = new Set(["CHOICE", "PREDICTION", "DRAG_DROP"]);

export async function getChildRecommendation(childId: string): Promise<Recommendation> {
  // All five reads in one parallel batch (was three sequential waterfalls): the
  // step query filters on the mission relation, so nothing depends on the
  // mission ids first. Cuts the recommendation load to a single round-trip.
  const [child, missions, childMissions, steps, childSteps] = await Promise.all([
    prisma.child.findUnique({
      where: { id: childId },
      select: { ageBand: true, interests: true },
    }),
    prisma.mission.findMany({ where: { isPublished: true }, orderBy: { order: "asc" } }),
    prisma.childMission.findMany({ where: { childId } }),
    prisma.missionStep.findMany({
      where: { mission: { isPublished: true } },
      select: { id: true, missionId: true, type: true },
    }),
    prisma.childMissionStep.findMany({
      where: { childId },
      select: { missionStepId: true, isCorrect: true },
    }),
  ]);
  if (!child) throw notFound("Child not found");

  // Graded step ids per mission, and this child's correctness per step.
  const gradedByMission = new Map<string, Set<string>>();
  for (const s of steps) {
    if (!GRADED.has(s.type)) continue;
    const set = gradedByMission.get(s.missionId) ?? new Set<string>();
    set.add(s.id);
    gradedByMission.set(s.missionId, set);
  }
  const correctByStep = new Map<string, boolean | null>(
    childSteps.map((cs) => [cs.missionStepId, cs.isCorrect]),
  );
  const cmByMission = new Map(childMissions.map((cm) => [cm.missionId, cm]));

  const perf: MissionPerformance[] = missions.map((m) => {
    const gradedIds = gradedByMission.get(m.id) ?? new Set<string>();
    let answeredGraded = 0;
    let correctGraded = 0;
    for (const stepId of gradedIds) {
      const isCorrect = correctByStep.get(stepId);
      if (isCorrect === true || isCorrect === false) {
        answeredGraded += 1;
        if (isCorrect === true) correctGraded += 1;
      }
    }
    // The mission engine only ever sets IN_PROGRESS/COMPLETED; treat anything
    // else (LOCKED or no record) as not started for recommendation purposes.
    const raw = cmByMission.get(m.id)?.status;
    const status: MissionPerformance["status"] =
      raw === "COMPLETED" ? "COMPLETED" : raw === "IN_PROGRESS" ? "IN_PROGRESS" : "NOT_STARTED";

    return {
      id: m.id,
      slug: m.slug,
      title: m.title,
      concept: m.concept,
      order: m.order,
      estimatedMinutes: m.estimatedMinutes,
      status,
      answeredGraded,
      correctGraded,
    };
  });

  const ctx: RecommendationContext = {
    ageBand: child.ageBand as AgeBand,
    interests: child.interests as Interest[],
    missions: perf,
  };
  return recommend(ctx);
}
