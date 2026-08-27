import { prisma } from "@techquest/db";
import type { FamilyLeaderboard, LeaderboardEntry } from "@techquest/shared";

/**
 * Family leaderboard — the standings of all of one parent's children (siblings).
 *
 * Scoped strictly to `parentId`, so a child only ever sees learners under their
 * own parent — the same tenancy boundary the rest of the app enforces (there is
 * no cross-family data here). Only non-identifying gameplay data is returned:
 * nickname, preset avatar, and aggregate stats.
 *
 * Ranked by XP, then missions completed, then level, then nickname; ties on
 * (xp, missions, level) share a rank. Everything is computed server-side.
 */
export async function getFamilyLeaderboard(
  parentId: string,
  currentChildId: string,
): Promise<FamilyLeaderboard> {
  const [children, missions] = await Promise.all([
    prisma.child.findMany({ where: { parentId }, orderBy: { createdAt: "asc" } }),
    prisma.mission.findMany({ where: { isPublished: true }, orderBy: { order: "asc" } }),
  ]);

  const siblingIds = children.map((c) => c.id);
  const completed = siblingIds.length
    ? await prisma.childMission.findMany({
        where: { childId: { in: siblingIds }, status: "COMPLETED" },
        select: { childId: true, missionId: true },
      })
    : [];

  const publishedIds = new Set(missions.map((m) => m.id));
  const completedByChild = new Map<string, string[]>();
  for (const cm of completed) {
    if (!publishedIds.has(cm.missionId)) continue; // ignore unpublished/removed
    const list = completedByChild.get(cm.childId) ?? [];
    list.push(cm.missionId);
    completedByChild.set(cm.childId, list);
  }

  const rows = children.map((c) => {
    const done = completedByChild.get(c.id) ?? [];
    return {
      id: c.id,
      nickname: c.nickname,
      avatar: c.avatar,
      level: c.level,
      xp: c.xp,
      streak: c.streak,
      missionsCompleted: done.length,
      completedMissionIds: done,
      isCurrent: c.id === currentChildId,
    };
  });

  rows.sort(
    (a, b) =>
      b.xp - a.xp ||
      b.missionsCompleted - a.missionsCompleted ||
      b.level - a.level ||
      a.nickname.localeCompare(b.nickname),
  );

  const entries: LeaderboardEntry[] = [];
  rows.forEach((r, i) => {
    const prev = i > 0 ? rows[i - 1] : undefined;
    const prevEntry = i > 0 ? entries[i - 1] : undefined;
    const tie =
      prev !== undefined &&
      prev.xp === r.xp &&
      prev.missionsCompleted === r.missionsCompleted &&
      prev.level === r.level;
    // Standard competition ranking: a tie inherits the previous rank.
    const rank = tie && prevEntry ? prevEntry.rank : i + 1;
    entries.push({ ...r, rank });
  });

  return {
    scope: "family",
    currentChildId,
    totalMissions: missions.length,
    missions: missions.map((m) => ({ id: m.id, slug: m.slug, title: m.title, order: m.order })),
    entries,
  };
}
