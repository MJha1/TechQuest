import { describe, it, expect } from "vitest";
import {
  xpForAnswer,
  potentialXp,
  levelForXp,
  xpProgress,
  computeStreak,
  earnedBadgeSlugs,
  XP_CORRECT_ANSWER,
  XP_CHALLENGE,
  XP_MISSION_COMPLETE,
} from "./gamification.js";

const day = (iso: string) => new Date(iso);

describe("XP rules", () => {
  it("uses the specified values", () => {
    expect(XP_CORRECT_ANSWER).toBe(10);
    expect(XP_CHALLENGE).toBe(30);
    expect(XP_MISSION_COMPLETE).toBe(100);
  });

  it("awards 10 for a correct graded answer, 0 for wrong", () => {
    expect(xpForAnswer("CHOICE", true)).toBe(10);
    expect(xpForAnswer("PREDICTION", true)).toBe(10);
    expect(xpForAnswer("DRAG_DROP", true)).toBe(10);
    expect(xpForAnswer("CHOICE", false)).toBe(0);
  });

  it("awards 30 for a challenge regardless of correctness", () => {
    expect(xpForAnswer("CHALLENGE", null)).toBe(30);
  });

  it("awards 0 for acknowledge / open-ended steps", () => {
    expect(xpForAnswer("INTRO", null)).toBe(0);
    expect(xpForAnswer("QUESTION", null)).toBe(0);
    expect(xpForAnswer("REFLECTION", null)).toBe(0);
    expect(xpForAnswer("COMPLETION", null)).toBe(0);
  });

  it("reports potential XP for the UI", () => {
    expect(potentialXp("CHOICE")).toBe(10);
    expect(potentialXp("CHALLENGE")).toBe(30);
    expect(potentialXp("REFLECTION")).toBe(0);
  });
});

describe("levels", () => {
  it("starts at level 1 and adds a level every 100 XP", () => {
    expect(levelForXp(0)).toBe(1);
    expect(levelForXp(99)).toBe(1);
    expect(levelForXp(100)).toBe(2);
    expect(levelForXp(250)).toBe(3);
    expect(levelForXp(-5)).toBe(1);
  });

  it("reports progress into the current level", () => {
    expect(xpProgress(150)).toEqual({ level: 2, intoLevel: 50, perLevel: 100 });
  });
});

describe("streaks", () => {
  const base = { streak: 0, longestStreak: 0, lastActiveAt: null };

  it("starts a streak on first activity", () => {
    const r = computeStreak(base, day("2026-08-25T10:00:00Z"));
    expect(r).toMatchObject({ streak: 1, longestStreak: 1, incremented: true });
  });

  it("does not change on a second activity the same day", () => {
    const prev = { streak: 2, longestStreak: 2, lastActiveAt: day("2026-08-25T08:00:00Z") };
    const r = computeStreak(prev, day("2026-08-25T20:00:00Z"));
    expect(r.streak).toBe(2);
    expect(r.incremented).toBe(false);
  });

  it("increments on the next day", () => {
    const prev = { streak: 2, longestStreak: 2, lastActiveAt: day("2026-08-25T08:00:00Z") };
    const r = computeStreak(prev, day("2026-08-26T09:00:00Z"));
    expect(r.streak).toBe(3);
    expect(r.longestStreak).toBe(3);
    expect(r.incremented).toBe(true);
  });

  it("resets to 1 after a gap, keeping the longest", () => {
    const prev = { streak: 5, longestStreak: 5, lastActiveAt: day("2026-08-25T08:00:00Z") };
    const r = computeStreak(prev, day("2026-08-28T09:00:00Z"));
    expect(r.streak).toBe(1);
    expect(r.longestStreak).toBe(5);
    expect(r.incremented).toBe(true);
  });
});

describe("badges", () => {
  it("awards First Explorer on the first completed mission", () => {
    expect(earnedBadgeSlugs({ completedCount: 1, completedSlugs: new Set(), streak: 0 })).toContain(
      "first-explorer",
    );
  });

  it("awards Pattern Detective for the patterns mission", () => {
    const slugs = earnedBadgeSlugs({
      completedCount: 1,
      completedSlugs: new Set(["how-ai-learns"]),
      streak: 0,
    });
    expect(slugs).toContain("pattern-detective");
  });

  it("awards AI Explorer after three missions", () => {
    expect(earnedBadgeSlugs({ completedCount: 3, completedSlugs: new Set(), streak: 0 })).toContain(
      "ai-explorer",
    );
    expect(earnedBadgeSlugs({ completedCount: 2, completedSlugs: new Set(), streak: 0 })).not.toContain(
      "ai-explorer",
    );
  });

  it("awards Builder for the build mission", () => {
    expect(
      earnedBadgeSlugs({ completedCount: 1, completedSlugs: new Set(["build-your-first-ai-idea"]), streak: 0 }),
    ).toContain("builder");
  });

  it("awards the 3-Day Streak badge at a streak of 3", () => {
    expect(earnedBadgeSlugs({ completedCount: 0, completedSlugs: new Set(), streak: 3 })).toContain(
      "three-day-streak",
    );
    expect(earnedBadgeSlugs({ completedCount: 0, completedSlugs: new Set(), streak: 2 })).not.toContain(
      "three-day-streak",
    );
  });
});
