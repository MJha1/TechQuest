import { prisma } from "@techquest/db";
import type { Child as DbChild } from "@techquest/db";
import type { BadgeStatus, ChildStats } from "@techquest/shared";
import { computeStreak, earnedBadgeSlugs, levelForXp } from "../lib/gamification.js";

/**
 * DB-facing gamification: applies the pure rules from lib/gamification to a
 * child's stored stats. All XP/level/streak/badge changes flow through here, so
 * they are always server-computed and idempotent.
 */

export const toStats = (c: DbChild): ChildStats => ({ xp: c.xp, level: c.level, streak: c.streak });

/**
 * Record activity for a child: add `xpDelta`, recompute level, and advance the
 * daily streak — in a single write. Safe to call on every answer; a second call
 * the same day leaves the streak unchanged.
 */
export async function applyActivity(
  childId: string,
  xpDelta: number,
  now: Date = new Date(),
): Promise<{ child: DbChild; streakIncremented: boolean } | null> {
  const child = await prisma.child.findFirst({ where: { id: childId } });
  if (!child) return null;

  const xp = child.xp + xpDelta;
  const streak = computeStreak(
    { streak: child.streak, longestStreak: child.longestStreak, lastActiveAt: child.lastActiveAt },
    now,
  );
  const updated = await prisma.child.update({
    where: { id: childId },
    data: {
      xp,
      level: levelForXp(xp),
      streak: streak.streak,
      longestStreak: streak.longestStreak,
      lastActiveAt: streak.lastActiveAt,
    },
  });
  return { child: updated, streakIncremented: streak.incremented };
}

/**
 * Evaluate every badge rule against the child's current progress and award any
 * they now qualify for. Idempotent — a badge is never granted twice. Returns the
 * slugs newly awarded by this call.
 */
export async function evaluateBadges(childId: string): Promise<string[]> {
  const completed = await prisma.childMission.findMany({
    where: { childId, status: "COMPLETED" },
  });
  const missions = await prisma.mission.findMany({});
  const slugById = new Map(missions.map((m) => [m.id, m.slug]));
  const completedSlugs = new Set(
    completed.map((c) => slugById.get(c.missionId)).filter((s): s is string => Boolean(s)),
  );
  const child = await prisma.child.findFirst({ where: { id: childId } });

  const eligible = earnedBadgeSlugs({
    completedCount: completed.length,
    completedSlugs,
    streak: child?.streak ?? 0,
  });

  const awarded: string[] = [];
  for (const slug of eligible) {
    const badge = await prisma.badge.findFirst({ where: { slug } });
    if (!badge) continue;
    const existing = await prisma.childBadge.findFirst({
      where: { childId, badgeId: badge.id },
    });
    if (!existing) {
      await prisma.childBadge.create({ data: { childId, badgeId: badge.id } });
      await prisma.learningEvent.create({
        data: { childId, type: "BADGE_EARNED", payload: { badge: slug } },
      });
      awarded.push(slug);
    }
  }
  return awarded;
}

/** Every badge, flagged with whether this child has earned it (for display). */
export async function listChildBadges(childId: string): Promise<BadgeStatus[]> {
  const [badges, owned] = await Promise.all([
    prisma.badge.findMany({}),
    prisma.childBadge.findMany({ where: { childId } }),
  ]);
  const ownedByBadgeId = new Map(owned.map((o) => [o.badgeId, o]));
  return badges.map((b) => {
    const own = ownedByBadgeId.get(b.id);
    return {
      badge: { slug: b.slug, name: b.name, description: b.description, icon: b.icon },
      earned: Boolean(own),
      earnedAt: own ? own.earnedAt.toISOString() : null,
    };
  });
}
