import { describe, it, expect, beforeEach, vi } from "vitest";

/**
 * In-memory Prisma fake covering the three models the leaderboard reads, so the
 * parent scoping and ranking are exercised without a database.
 */
type Child = {
  id: string;
  parentId: string;
  nickname: string;
  avatar: string | null;
  level: number;
  xp: number;
  streak: number;
  createdAt: Date;
};
type Mission = { id: string; slug: string; title: string; order: number; isPublished: boolean };
type ChildMission = { childId: string; missionId: string; status: string };

const { store } = vi.hoisted(() => ({
  store: { children: [] as Child[], missions: [] as Mission[], childMissions: [] as ChildMission[] },
}));

vi.mock("@techquest/db", () => ({
  prisma: {
    child: {
      findMany: vi.fn(async ({ where }: { where: { parentId: string } }) =>
        store.children
          .filter((c) => c.parentId === where.parentId)
          .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime()),
      ),
    },
    mission: {
      findMany: vi.fn(async () =>
        store.missions.filter((m) => m.isPublished).sort((a, b) => a.order - b.order),
      ),
    },
    childMission: {
      findMany: vi.fn(
        async ({ where }: { where: { childId: { in: string[] }; status: string } }) =>
          store.childMissions.filter(
            (cm) => where.childId.in.includes(cm.childId) && cm.status === where.status,
          ),
      ),
    },
  },
}));

const { getFamilyLeaderboard } = await import("./leaderboard.service.js");

function child(over: Partial<Child> & { id: string }): Child {
  return {
    parentId: "parent_A",
    nickname: over.id,
    avatar: null,
    level: 1,
    xp: 0,
    streak: 0,
    createdAt: new Date(),
    ...over,
  };
}

beforeEach(() => {
  store.missions = [
    { id: "m1", slug: "how-ai-learns", title: "How AI Learns", order: 1, isPublished: true },
    { id: "m2", slug: "how-youtube-knows", title: "How YouTube Knows", order: 2, isPublished: true },
  ];
  store.children = [
    child({ id: "child_A", nickname: "Nova", xp: 120, level: 2, streak: 3, createdAt: new Date(1) }),
    child({ id: "child_B", nickname: "Pixel", xp: 300, level: 4, streak: 1, createdAt: new Date(2) }),
    child({ id: "child_C", nickname: "Sprocket", xp: 120, level: 2, streak: 0, createdAt: new Date(3) }),
    // A different family — must never appear.
    child({ id: "child_X", parentId: "parent_B", nickname: "Intruder", xp: 9999, createdAt: new Date(4) }),
  ];
  store.childMissions = [
    { childId: "child_B", missionId: "m1", status: "COMPLETED" },
    { childId: "child_B", missionId: "m2", status: "COMPLETED" },
    { childId: "child_A", missionId: "m1", status: "COMPLETED" },
    { childId: "child_A", missionId: "m2", status: "IN_PROGRESS" }, // not counted
  ];
});

describe("getFamilyLeaderboard", () => {
  it("ranks siblings by XP and scopes strictly to the parent", async () => {
    const board = await getFamilyLeaderboard("parent_A", "child_A");

    // Only parent_A's three children — never the other family's child.
    expect(board.entries.map((e) => e.id)).toEqual(["child_B", "child_A", "child_C"]);
    expect(board.entries.some((e) => e.id === "child_X")).toBe(false);

    // Pixel leads (300 XP), then the two 120-XP siblings.
    expect(board.entries[0]).toMatchObject({ id: "child_B", rank: 1, missionsCompleted: 2 });
    // Nova is flagged as the viewer and has one completed mission.
    const nova = board.entries.find((e) => e.id === "child_A")!;
    expect(nova).toMatchObject({ isCurrent: true, missionsCompleted: 1 });
    expect(nova.completedMissionIds).toEqual(["m1"]);
    expect(board.totalMissions).toBe(2);
  });

  it("gives tied learners the same rank (competition ranking)", async () => {
    // Make child_A and child_C a true tie: same xp, level, and completed missions.
    store.childMissions = [
      { childId: "child_B", missionId: "m1", status: "COMPLETED" },
      { childId: "child_B", missionId: "m2", status: "COMPLETED" },
      { childId: "child_A", missionId: "m1", status: "COMPLETED" },
      { childId: "child_C", missionId: "m1", status: "COMPLETED" },
    ];
    const board = await getFamilyLeaderboard("parent_A", "child_A");
    // Pixel is rank 1; child_A and child_C (120 XP / level 2 / 1 mission) share rank 2.
    const a = board.entries.find((e) => e.id === "child_A")!;
    const c = board.entries.find((e) => e.id === "child_C")!;
    expect(a.rank).toBe(2);
    expect(c.rank).toBe(2);
  });

  it("returns a single entry for an only child", async () => {
    store.children = [child({ id: "child_A", nickname: "Nova", xp: 50, createdAt: new Date(1) })];
    store.childMissions = [];
    const board = await getFamilyLeaderboard("parent_A", "child_A");
    expect(board.entries).toHaveLength(1);
    expect(board.entries[0]).toMatchObject({ id: "child_A", rank: 1, isCurrent: true });
  });
});
