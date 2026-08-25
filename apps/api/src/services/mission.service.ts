import { prisma } from "@techquest/db";
import type {
  Mission as DbMission,
  MissionStep as DbStep,
  ChildMission as DbChildMission,
  ChildMissionStep as DbChildStep,
} from "@techquest/db";
import type {
  AnswerResult,
  ChildMissionState,
  ChildMissionSummary,
  ChildStepState,
  CompleteResult,
  Mission,
  MissionDetail,
  ServedStep,
} from "@techquest/shared";
import { badRequest, notFound } from "../lib/http-error.js";

/**
 * TechQuest mission engine.
 *
 * Data-driven: missions and their steps are seeded content; nothing about an
 * individual mission is hardcoded here — the engine grades and progresses any
 * mission by its step `type`. Rules:
 *   - The BACKEND determines correctness by comparing the submitted response to
 *     the answer stored in the step content. The client never sends correctness,
 *     score, or XP, and the answer keys are stripped from content before it is
 *     served (see `sanitizeContent`).
 *   - XP is awarded once per step (on the first successful completion) and once
 *     per mission (a completion bonus). Mission completion is idempotent.
 */

const XP_PER_LEVEL = 100;
const MISSION_COMPLETION_BONUS_XP = 50;

// Steps whose correctness is objectively checkable against stored content.
const GRADED = new Set(["CHOICE", "PREDICTION", "DRAG_DROP"]);
// Steps that require a free-text/open response but aren't objectively graded.
const OPEN_ENDED = new Set(["QUESTION", "CHALLENGE", "REFLECTION"]);
// INTRO / COMPLETION are acknowledge-only (no response required).

type Content = Record<string, unknown>;
const asContent = (c: unknown): Content => (c && typeof c === "object" ? (c as Content) : {});

function levelForXp(xp: number): number {
  return 1 + Math.floor(Math.max(0, xp) / XP_PER_LEVEL);
}

const iso = (d: Date | null | undefined): string | null => (d ? d.toISOString() : null);

// ── Serialization (Date → ISO, and answer-key stripping) ──────────────────────

function serializeMission(m: DbMission): Mission {
  return {
    id: m.id,
    slug: m.slug,
    title: m.title,
    subtitle: m.subtitle,
    concept: m.concept,
    description: m.description,
    order: m.order,
    estimatedMinutes: m.estimatedMinutes,
    isPublished: m.isPublished,
    createdAt: m.createdAt.toISOString(),
    updatedAt: m.updatedAt.toISOString(),
  };
}

/**
 * Remove anything that would let the browser self-grade: `correct` flags on
 * options, the drag-drop `solution`, and reveal/explanation/sampleAnswer text
 * (those are returned by the answer endpoint AFTER a submission instead).
 */
function sanitizeContent(type: string, content: unknown): Content {
  const c: Content = { ...asContent(content) };
  if ((type === "CHOICE" || type === "PREDICTION") && Array.isArray(c.options)) {
    c.options = (c.options as Content[]).map(({ correct: _correct, ...rest }) => rest);
  }
  delete c.solution;
  delete c.explanation;
  delete c.reveal;
  delete c.sampleAnswer;
  return c;
}

function serializeServedStep(s: DbStep): ServedStep {
  return {
    id: s.id,
    missionId: s.missionId,
    order: s.order,
    type: s.type,
    title: s.title,
    content: sanitizeContent(s.type, s.content),
    xpReward: s.xpReward,
  };
}

function serializeChildStep(cs: DbChildStep): ChildStepState {
  return {
    missionStepId: cs.missionStepId,
    status: cs.status,
    isCorrect: cs.isCorrect,
    attempts: cs.attempts,
    response: (cs.response as unknown) ?? null,
    completedAt: iso(cs.completedAt),
  };
}

// ── Grading ───────────────────────────────────────────────────────────────────

interface Grade {
  gradeable: boolean;
  isCorrect: boolean | null;
  feedback: string | null;
}

function isEmptyResponse(response: unknown): boolean {
  if (response === null || response === undefined) return true;
  if (typeof response === "string") return response.trim() === "";
  if (Array.isArray(response)) return response.length === 0;
  if (typeof response === "object") return Object.keys(response as object).length === 0;
  return false;
}

/** Compare a submitted answer to the step's stored answer. Server-authoritative. */
function gradeStep(step: DbStep, response: unknown): Grade {
  const content = asContent(step.content);

  if (step.type === "CHOICE" || step.type === "PREDICTION") {
    const options = Array.isArray(content.options) ? (content.options as Content[]) : [];
    const chosen =
      typeof response === "string"
        ? response
        : (response as Content | null)?.optionId;
    const picked = options.find((o) => o.id === chosen);
    return {
      gradeable: true,
      isCorrect: picked ? picked.correct === true : false,
      feedback: (content.explanation as string) ?? (content.reveal as string) ?? null,
    };
  }

  if (step.type === "DRAG_DROP") {
    const solution = asContent(content.solution) as Record<string, string>;
    const raw = (response as Content | null) ?? {};
    const placements = asContent(
      "placements" in raw ? raw.placements : raw,
    ) as Record<string, string>;
    const keys = Object.keys(solution);
    const isCorrect =
      keys.length > 0 &&
      Object.keys(placements).length === keys.length &&
      keys.every((k) => placements[k] === solution[k]);
    return { gradeable: true, isCorrect, feedback: (content.explanation as string) ?? null };
  }

  // Open-ended / acknowledge: not objectively graded.
  return {
    gradeable: false,
    isCorrect: null,
    feedback:
      (content.successCriteria as string) ??
      (content.sampleAnswer as string) ??
      (content.reveal as string) ??
      null,
  };
}

// ── XP ────────────────────────────────────────────────────────────────────────

async function awardXp(childId: string, currentXp: number, delta: number) {
  const xp = currentXp + delta;
  return prisma.child.update({
    where: { id: childId },
    data: { xp, level: levelForXp(xp), lastActiveAt: new Date() },
  });
}

// ── Catalog reads ─────────────────────────────────────────────────────────────

/** All published missions (summaries, ordered). */
export async function listMissions(): Promise<Mission[]> {
  const rows = await prisma.mission.findMany({
    where: { isPublished: true },
    orderBy: { order: "asc" },
  });
  return rows.map(serializeMission);
}

/** A single published mission with its sanitized steps. */
export async function getMissionDetail(missionId: string): Promise<MissionDetail> {
  const mission = await prisma.mission.findFirst({
    where: { id: missionId, isPublished: true },
  });
  if (!mission) throw notFound("Mission not found");
  const steps = await prisma.missionStep.findMany({
    where: { missionId },
    orderBy: { order: "asc" },
  });
  return { ...serializeMission(mission), steps: steps.map(serializeServedStep) };
}

/** Every published mission joined with a child's progress. */
export async function listChildMissions(childId: string): Promise<ChildMissionSummary[]> {
  const missions = await prisma.mission.findMany({
    where: { isPublished: true },
    orderBy: { order: "asc" },
  });
  const childMissions = await prisma.childMission.findMany({ where: { childId } });

  const summaries: ChildMissionSummary[] = [];
  for (const mission of missions) {
    const cm = childMissions.find((x) => x.missionId === mission.id) ?? null;
    const steps = await prisma.missionStep.findMany({ where: { missionId: mission.id } });
    const childSteps = cm
      ? await prisma.childMissionStep.findMany({ where: { childMissionId: cm.id } })
      : [];
    summaries.push({
      mission: serializeMission(mission),
      totalSteps: steps.length,
      completedSteps: childSteps.filter((s) => s.status === "COMPLETED").length,
      progress: cm
        ? {
            status: cm.status,
            score: cm.score,
            startedAt: iso(cm.startedAt),
            completedAt: iso(cm.completedAt),
          }
        : null,
    });
  }
  return summaries;
}

// ── Progress mutations ────────────────────────────────────────────────────────

/** Find a child's mission record, creating it (and its step rows) if missing. */
async function ensureChildMission(childId: string, missionId: string): Promise<DbChildMission> {
  const existing = await prisma.childMission.findFirst({ where: { childId, missionId } });
  if (existing) return existing;

  const cm = await prisma.childMission.create({
    data: { childId, missionId, status: "IN_PROGRESS", startedAt: new Date() },
  });
  const steps = await prisma.missionStep.findMany({
    where: { missionId },
    orderBy: { order: "asc" },
  });
  for (const s of steps) {
    await prisma.childMissionStep.create({
      data: {
        childId,
        childMissionId: cm.id,
        missionStepId: s.id,
        status: "NOT_STARTED",
        attempts: 0,
      },
    });
  }
  await prisma.learningEvent.create({
    data: { childId, missionId, type: "MISSION_STARTED" },
  });
  return cm;
}

async function buildChildMissionState(
  childId: string,
  mission: DbMission,
): Promise<ChildMissionState> {
  const steps = await prisma.missionStep.findMany({
    where: { missionId: mission.id },
    orderBy: { order: "asc" },
  });
  const cm = await prisma.childMission.findFirst({
    where: { childId, missionId: mission.id },
  });
  const childSteps = cm
    ? await prisma.childMissionStep.findMany({ where: { childMissionId: cm.id } })
    : [];
  return {
    mission: { ...serializeMission(mission), steps: steps.map(serializeServedStep) },
    status: cm?.status ?? "IN_PROGRESS",
    score: cm?.score ?? null,
    startedAt: iso(cm?.startedAt),
    completedAt: iso(cm?.completedAt),
    steps: childSteps.map(serializeChildStep),
  };
}

/** Start or resume a mission for a child (idempotent — never duplicates). */
export async function startMission(
  childId: string,
  missionId: string,
): Promise<ChildMissionState> {
  const mission = await prisma.mission.findFirst({
    where: { id: missionId, isPublished: true },
  });
  if (!mission) throw notFound("Mission not found");
  await ensureChildMission(childId, missionId);
  return buildChildMissionState(childId, mission);
}

/** Submit an answer to a step; the backend grades it and records progress. */
export async function answerStep(
  childId: string,
  missionId: string,
  stepId: string,
  response: unknown,
): Promise<AnswerResult> {
  const mission = await prisma.mission.findFirst({
    where: { id: missionId, isPublished: true },
  });
  if (!mission) throw notFound("Mission not found");

  const step = await prisma.missionStep.findFirst({ where: { id: stepId } });
  if (!step || step.missionId !== missionId) {
    throw notFound("Step not found in this mission");
  }

  const needsResponse = GRADED.has(step.type) || OPEN_ENDED.has(step.type);
  if (needsResponse && isEmptyResponse(response)) {
    throw badRequest("A response is required for this step");
  }

  const cm = await ensureChildMission(childId, missionId);
  const grade = gradeStep(step, response);

  const prior = await prisma.childMissionStep.findFirst({
    where: { childId, missionStepId: stepId },
  });

  // Award once: for graded steps on the first correct answer; for open/acknowledge
  // steps on first completion.
  const alreadyEarned = GRADED.has(step.type)
    ? prior?.isCorrect === true
    : prior?.status === "COMPLETED";
  const earns = !alreadyEarned && (GRADED.has(step.type) ? grade.isCorrect === true : true);
  const xpAwarded = earns ? step.xpReward : 0;

  let cs: DbChildStep;
  if (prior) {
    cs = await prisma.childMissionStep.update({
      where: { id: prior.id },
      data: {
        status: "COMPLETED",
        response: response as never,
        isCorrect: grade.isCorrect,
        attempts: prior.attempts + 1,
        completedAt: prior.completedAt ?? new Date(),
      },
    });
  } else {
    cs = await prisma.childMissionStep.create({
      data: {
        childId,
        childMissionId: cm.id,
        missionStepId: stepId,
        status: "COMPLETED",
        response: response as never,
        isCorrect: grade.isCorrect,
        attempts: 1,
        completedAt: new Date(),
      },
    });
  }

  const child = await prisma.child.findFirst({ where: { id: childId } });
  let xp = child?.xp ?? 0;
  let level = child?.level ?? 1;
  if (earns && child) {
    const updated = await awardXp(childId, child.xp, xpAwarded);
    xp = updated.xp;
    level = updated.level;
    await prisma.learningEvent.create({
      data: { childId, missionId, missionStepId: stepId, type: "XP_AWARDED", payload: { xp: xpAwarded } },
    });
  }

  return {
    correct: grade.isCorrect,
    feedback: grade.feedback,
    xpAwarded,
    step: serializeChildStep(cs),
    child: { xp, level },
  };
}

/** Complete a mission. Idempotent: a second call awards no further XP. */
export async function completeMission(
  childId: string,
  missionId: string,
): Promise<CompleteResult> {
  const mission = await prisma.mission.findFirst({
    where: { id: missionId, isPublished: true },
  });
  if (!mission) throw notFound("Mission not found");

  const cm = await ensureChildMission(childId, missionId);
  const child = await prisma.child.findFirst({ where: { id: childId } });
  const currentXp = child?.xp ?? 0;
  const currentLevel = child?.level ?? 1;

  if (cm.status === "COMPLETED") {
    return {
      status: "COMPLETED",
      score: cm.score ?? 0,
      completedAt: iso(cm.completedAt),
      xpAwarded: 0,
      alreadyCompleted: true,
      child: { xp: currentXp, level: currentLevel },
    };
  }

  // Score = share of graded steps answered correctly.
  const steps = await prisma.missionStep.findMany({ where: { missionId } });
  const gradedCount = steps.filter((s) => GRADED.has(s.type)).length;
  const childSteps = await prisma.childMissionStep.findMany({
    where: { childMissionId: cm.id },
  });
  const correct = childSteps.filter((s) => s.isCorrect === true).length;
  const score = gradedCount === 0 ? 100 : Math.round((correct / gradedCount) * 100);

  const updatedCm = await prisma.childMission.update({
    where: { id: cm.id },
    data: { status: "COMPLETED", score, completedAt: new Date() },
  });

  let xp = currentXp;
  let level = currentLevel;
  if (child) {
    const updated = await awardXp(childId, child.xp, MISSION_COMPLETION_BONUS_XP);
    xp = updated.xp;
    level = updated.level;
  }
  await prisma.learningEvent.create({
    data: { childId, missionId, type: "MISSION_COMPLETED", payload: { score } },
  });

  return {
    status: "COMPLETED",
    score,
    completedAt: iso(updatedCm.completedAt),
    xpAwarded: MISSION_COMPLETION_BONUS_XP,
    alreadyCompleted: false,
    child: { xp, level },
  };
}
