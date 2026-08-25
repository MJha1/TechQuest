import { describe, it, expect, beforeEach, vi } from "vitest";
import request from "supertest";
import type { SessionResolver } from "../lib/auth.js";

type Row = Record<string, unknown> & { id: string };

const h = vi.hoisted(() => {
  const store = {
    child: [] as Row[],
    mission: [] as Row[],
    missionStep: [] as Row[],
    childMission: [] as Row[],
    learningEvent: [] as Row[],
    badge: [] as Row[],
  };
  const matches = (row: Row, where: Record<string, unknown> = {}) =>
    Object.entries(where).every(([k, v]) => (v !== null && typeof v === "object" ? true : row[k] === v));
  const model = (rows: Row[]) => ({
    findFirst: async ({ where }: { where?: Record<string, unknown> } = {}) => rows.find((r) => matches(r, where)) ?? null,
    findMany: async ({ where, orderBy }: { where?: Record<string, unknown>; orderBy?: Record<string, "asc" | "desc"> } = {}) => {
      let out = rows.filter((r) => matches(r, where));
      if (orderBy) {
        const [k, dir] = Object.entries(orderBy)[0]!;
        out = [...out].sort((a, b) => {
          const av = a[k] as number | string | Date;
          const bv = b[k] as number | string | Date;
          return (av > bv ? 1 : av < bv ? -1 : 0) * (dir === "desc" ? -1 : 1);
        });
      }
      return out;
    },
  });
  const prisma = {
    child: model(store.child),
    mission: model(store.mission),
    missionStep: model(store.missionStep),
    childMission: model(store.childMission),
    learningEvent: model(store.learningEvent),
    badge: model(store.badge),
  };
  return { store, prisma };
});

vi.mock("@techquest/db", () => ({ prisma: h.prisma }));

const { createApp } = await import("../app.js");
const appAs = (userId?: string) => {
  const sessionResolver: SessionResolver = () => (userId ? { userId } : null);
  return createApp({ sessionResolver });
};

const at = (n: number) => new Date(2026, 0, 1, 0, 0, n);

beforeEach(() => {
  for (const rows of Object.values(h.store)) rows.length = 0;

  h.store.child.push(
    { id: "child_A", parentId: "parent_A", nickname: "Nova", ageBand: "AGE_8_9", avatar: "🦊", level: 2, xp: 180, streak: 1, longestStreak: 1, lastActiveAt: at(5), createdAt: at(0), updatedAt: at(5) },
    { id: "child_B", parentId: "parent_B", nickname: "Pix", ageBand: "AGE_10_11", avatar: null, level: 1, xp: 0, streak: 0, longestStreak: 0, lastActiveAt: null, createdAt: at(0), updatedAt: at(0) },
  );
  h.store.mission.push(
    { id: "m1", slug: "how-ai-learns", title: "How AI Learns", subtitle: null, concept: "Examples → Patterns → Prediction", description: null, order: 1, estimatedMinutes: 9, isPublished: true, createdAt: at(0), updatedAt: at(0) },
    { id: "m2", slug: "how-youtube-knows", title: "How YouTube Knows", subtitle: null, concept: "Recommendations", description: null, order: 2, estimatedMinutes: 7, isPublished: true, createdAt: at(0), updatedAt: at(0) },
  );
  h.store.missionStep.push(
    { id: "s1_done", missionId: "m1", order: 9, type: "COMPLETION", title: "Done", content: { heading: "h", body: "b", parentSummary: "AI can find patterns in examples and use those patterns to make predictions.", homePrompt: "Can AI make mistakes? Why?" }, xpReward: 30, createdAt: at(0), updatedAt: at(0) },
    { id: "s2_done", missionId: "m2", order: 6, type: "COMPLETION", title: "Done", content: { heading: "h", body: "b", parentSummary: "Apps recommend by learning what you like.", homePrompt: "Why does the app show similar videos?" }, xpReward: 30, createdAt: at(0), updatedAt: at(0) },
  );
  h.store.childMission.push(
    { id: "cm1", childId: "child_A", missionId: "m1", status: "COMPLETED", score: 100, startedAt: at(1), completedAt: at(4), createdAt: at(1), updatedAt: at(4) },
  );
  h.store.badge.push({ id: "b_first", slug: "first-explorer", name: "First Explorer", description: "d", icon: "🧭", criteria: null, createdAt: at(0), updatedAt: at(0) });
  h.store.learningEvent.push(
    { id: "e1", childId: "child_A", missionId: "m1", missionStepId: null, type: "MISSION_STARTED", payload: null, createdAt: at(1) },
    { id: "e2", childId: "child_A", missionId: "m1", missionStepId: null, type: "MISSION_COMPLETED", payload: { score: 100 }, createdAt: at(4) },
    { id: "e3", childId: "child_A", missionId: null, missionStepId: null, type: "BADGE_EARNED", payload: { badge: "first-explorer" }, createdAt: at(4) },
    { id: "e4", childId: "child_A", missionId: "m1", missionStepId: "s1", type: "XP_AWARDED", payload: { xp: 10 }, createdAt: at(2) },
  );
});

describe("GET /api/parent/dashboard", () => {
  it("requires authentication", async () => {
    const res = await request(appAs()).get("/api/parent/dashboard");
    expect(res.status).toBe(401);
  });

  it("returns an educational summary of the parent's own child", async () => {
    const res = await request(appAs("parent_A")).get("/api/parent/dashboard");
    expect(res.status).toBe(200);
    expect(res.body.data.children).toHaveLength(1);

    const c = res.body.data.children[0];
    expect(c).toMatchObject({
      nickname: "Nova",
      level: 2,
      xp: 180,
      streak: 1,
      missionsCompleted: 1,
      totalMissions: 2,
      learningMinutes: 9,
    });
    expect(c.conceptsLearned).toContain("Examples → Patterns → Prediction");
    expect(c.whatLearned).toContainEqual({
      mission: "How AI Learns",
      summary: "AI can find patterns in examples and use those patterns to make predictions.",
    });
    expect(c.tryAtHome).toContainEqual({
      mission: "How AI Learns",
      prompt: "Can AI make mistakes? Why?",
    });
    // Recent activity is humanized and excludes granular XP events (4 events
    // seeded, but the XP_AWARDED one is not surfaced → 3 shown).
    expect(c.recentActivity).toHaveLength(3);
    const labels = c.recentActivity.map((a: { label: string }) => a.label);
    expect(labels.some((l: string) => /completed .*how ai learns/i.test(l))).toBe(true);
    expect(labels.some((l: string) => /earned .*first explorer.*badge/i.test(l))).toBe(true);
    // Recommended next is the first unfinished mission.
    expect(c.recommended).toMatchObject({ title: "How YouTube Knows" });
  });

  it("scopes the dashboard to the signed-in parent", async () => {
    const res = await request(appAs("parent_B")).get("/api/parent/dashboard");
    expect(res.body.data.children).toHaveLength(1);
    expect(res.body.data.children[0].nickname).toBe("Pix");
    expect(res.body.data.children[0].missionsCompleted).toBe(0);
  });
});
