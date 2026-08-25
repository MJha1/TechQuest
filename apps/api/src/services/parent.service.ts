import { prisma } from "@techquest/db";
import type {
  ParentActivityItem,
  ParentChildDashboard,
  ParentDashboard,
} from "@techquest/shared";

/**
 * Parent dashboard data — an educational, non-gamified summary of each of the
 * parent's children: progress, concepts learned, recent activity, and at-home
 * conversation prompts. Everything is computed here, server-side.
 */

type Content = Record<string, unknown>;
const asContent = (c: unknown): Content => (c && typeof c === "object" ? (c as Content) : {});

/** Turn a raw learning event into a parent-friendly line (or null to skip). */
function humanizeEvent(
  type: string,
  payload: Content,
  missionTitle: string | undefined,
  badgeName: string | undefined,
): string | null {
  switch (type) {
    case "MISSION_COMPLETED":
      return missionTitle ? `Completed “${missionTitle}”` : "Completed a mission";
    case "MISSION_STARTED":
      return missionTitle ? `Started “${missionTitle}”` : "Started a mission";
    case "BADGE_EARNED":
      return badgeName ? `Earned the “${badgeName}” badge` : "Earned a badge";
    default:
      return null; // XP/step events are too granular for the parent view
  }
}

export async function getParentDashboard(parentId: string): Promise<ParentDashboard> {
  const [children, missions, completionSteps, badges] = await Promise.all([
    prisma.child.findMany({ where: { parentId }, orderBy: { createdAt: "asc" } }),
    prisma.mission.findMany({ where: { isPublished: true }, orderBy: { order: "asc" } }),
    prisma.missionStep.findMany({ where: { type: "COMPLETION" } }),
    prisma.badge.findMany({}),
  ]);

  const missionById = new Map(missions.map((m) => [m.id, m]));
  const badgeNameBySlug = new Map(badges.map((b) => [b.slug, b.name]));
  // Parent-facing content lives on each mission's COMPLETION step.
  const parentContentByMission = new Map(
    completionSteps.map((s) => {
      const c = asContent(s.content);
      return [s.missionId, { summary: c.parentSummary as string | undefined, prompt: c.homePrompt as string | undefined }];
    }),
  );

  const dashboards: ParentChildDashboard[] = [];

  for (const child of children) {
    const childMissions = await prisma.childMission.findMany({ where: { childId: child.id } });
    const completedIds = childMissions.filter((cm) => cm.status === "COMPLETED").map((cm) => cm.missionId);
    // Completed missions, in catalog order.
    const completedMissions = missions.filter((m) => completedIds.includes(m.id));

    const learningMinutes = completedMissions.reduce((sum, m) => sum + m.estimatedMinutes, 0);
    const conceptsLearned = completedMissions.map((m) => m.concept);

    const whatLearned = completedMissions
      .map((m) => ({ mission: m.title, summary: parentContentByMission.get(m.id)?.summary }))
      .filter((x): x is { mission: string; summary: string } => Boolean(x.summary));

    const tryAtHome = completedMissions
      .map((m) => ({ mission: m.title, prompt: parentContentByMission.get(m.id)?.prompt }))
      .filter((x): x is { mission: string; prompt: string } => Boolean(x.prompt));

    // Recent activity (most recent meaningful events first).
    const events = await prisma.learningEvent.findMany({
      where: { childId: child.id },
      orderBy: { createdAt: "desc" },
    });
    const recentActivity: ParentActivityItem[] = [];
    for (const e of events) {
      const payload = asContent(e.payload);
      const label = humanizeEvent(
        e.type,
        payload,
        e.missionId ? missionById.get(e.missionId)?.title : undefined,
        typeof payload.badge === "string" ? badgeNameBySlug.get(payload.badge) : undefined,
      );
      if (label) recentActivity.push({ label, at: e.createdAt.toISOString() });
      if (recentActivity.length >= 6) break;
    }

    // Recommended next: the first not-yet-completed mission, with its prompt.
    const next = missions.find((m) => !completedIds.includes(m.id)) ?? null;
    const recommended = next
      ? {
          title: next.title,
          concept: next.concept,
          estimatedMinutes: next.estimatedMinutes,
          prompt: parentContentByMission.get(next.id)?.prompt ?? null,
        }
      : null;

    dashboards.push({
      id: child.id,
      nickname: child.nickname,
      ageBand: child.ageBand as ParentChildDashboard["ageBand"],
      avatar: child.avatar,
      level: child.level,
      xp: child.xp,
      streak: child.streak,
      missionsCompleted: completedIds.length,
      totalMissions: missions.length,
      learningMinutes,
      conceptsLearned,
      recentActivity,
      whatLearned,
      tryAtHome,
      recommended,
    });
  }

  return { children: dashboards };
}
