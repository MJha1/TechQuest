import { describe, it, expect, beforeEach, vi } from "vitest";
import request from "supertest";
import type { SessionResolver } from "../lib/auth.js";

/**
 * In-memory Prisma fake covering the models the mission engine touches. Each
 * model is a tiny table supporting the scalar-`where` operations the service
 * uses (findFirst/findUnique/findMany/create/update/count), so grading, XP, and
 * idempotency are exercised end-to-end without a real database.
 */
type Row = Record<string, unknown> & { id: string };

const h = vi.hoisted(() => {
  const store = {
    child: [] as Row[],
    mission: [] as Row[],
    missionStep: [] as Row[],
    childMission: [] as Row[],
    childMissionStep: [] as Row[],
    learningEvent: [] as Row[],
  };

  const matches = (row: Row, where: Record<string, unknown> = {}) =>
    Object.entries(where).every(([k, v]) => {
      if (v !== null && typeof v === "object") return true; // ignore nested (unused)
      return row[k] === v;
    });

  const model = (rows: Row[], prefix: string) => {
    let seq = 0;
    return {
      findFirst: async ({ where }: { where?: Record<string, unknown> } = {}) =>
        rows.find((r) => matches(r, where)) ?? null,
      findUnique: async ({ where }: { where: { id: string } }) =>
        rows.find((r) => r.id === where.id) ?? null,
      findMany: async ({
        where,
        orderBy,
      }: { where?: Record<string, unknown>; orderBy?: Record<string, "asc" | "desc"> } = {}) => {
        let out = rows.filter((r) => matches(r, where));
        if (orderBy) {
          const [k, dir] = Object.entries(orderBy)[0]!;
          out = [...out].sort((a, b) => {
            const av = a[k] as number | string;
            const bv = b[k] as number | string;
            return (av > bv ? 1 : av < bv ? -1 : 0) * (dir === "desc" ? -1 : 1);
          });
        }
        return out;
      },
      create: async ({ data }: { data: Record<string, unknown> }) => {
        seq += 1;
        const row: Row = {
          id: `${prefix}_${seq}`,
          createdAt: new Date(),
          updatedAt: new Date(),
          ...data,
        } as Row;
        rows.push(row);
        return row;
      },
      update: async ({ where, data }: { where: { id: string }; data: Record<string, unknown> }) => {
        const row = rows.find((r) => r.id === where.id)!;
        Object.assign(row, data, { updatedAt: new Date() });
        return row;
      },
      count: async ({ where }: { where?: Record<string, unknown> } = {}) =>
        rows.filter((r) => matches(r, where)).length,
    };
  };

  const prisma = {
    child: model(store.child, "child"),
    mission: model(store.mission, "mission"),
    missionStep: model(store.missionStep, "step"),
    childMission: model(store.childMission, "cm"),
    childMissionStep: model(store.childMissionStep, "cms"),
    learningEvent: model(store.learningEvent, "ev"),
  };

  return { store, prisma };
});

vi.mock("@techquest/db", () => ({ prisma: h.prisma }));

const { createApp } = await import("../app.js");

function appAs(userId?: string) {
  const sessionResolver: SessionResolver = () => (userId ? { userId } : null);
  return createApp({ sessionResolver });
}

const now = () => new Date();

function seed() {
  for (const rows of Object.values(h.store)) rows.length = 0;

  h.store.child.push(
    { id: "child_A", parentId: "parent_A", nickname: "Nova", ageBand: "AGE_8_9", avatar: null, level: 1, xp: 0, streak: 0, longestStreak: 0, lastActiveAt: null, createdAt: now(), updatedAt: now() },
    { id: "child_B", parentId: "parent_B", nickname: "Pix", ageBand: "AGE_10_12", avatar: null, level: 1, xp: 0, streak: 0, longestStreak: 0, lastActiveAt: null, createdAt: now(), updatedAt: now() },
  );

  h.store.mission.push(
    { id: "m1", slug: "m1", title: "Mission One", subtitle: null, concept: "c", description: null, order: 1, estimatedMinutes: 8, isPublished: true, createdAt: now(), updatedAt: now() },
    { id: "m2", slug: "m2", title: "Draft", subtitle: null, concept: "c", description: null, order: 2, estimatedMinutes: 8, isPublished: false, createdAt: now(), updatedAt: now() },
  );

  h.store.missionStep.push(
    { id: "s_intro", missionId: "m1", order: 1, type: "INTRO", title: "Intro", content: { heading: "h", body: "b" }, xpReward: 10, createdAt: now(), updatedAt: now() },
    { id: "s_choice", missionId: "m1", order: 2, type: "CHOICE", title: "Pick", content: { prompt: "p", options: [{ id: "a", label: "A", correct: false }, { id: "b", label: "B", correct: true }], explanation: "because B" }, xpReward: 10, createdAt: now(), updatedAt: now() },
    { id: "s_drag", missionId: "m1", order: 3, type: "DRAG_DROP", title: "Sort", content: { prompt: "p", items: [], targets: [], solution: { "1": "cats", "2": "dogs" } }, xpReward: 10, createdAt: now(), updatedAt: now() },
    { id: "s_q", missionId: "m1", order: 4, type: "QUESTION", title: "Explain", content: { prompt: "p", sampleAnswer: "sa" }, xpReward: 10, createdAt: now(), updatedAt: now() },
    { id: "s_done", missionId: "m1", order: 5, type: "COMPLETION", title: "Done", content: { heading: "h", body: "b" }, xpReward: 30, createdAt: now(), updatedAt: now() },
  );
}

const childOf = (id: string) => h.store.child.find((c) => c.id === id)!;

beforeEach(seed);

// ── Catalog / reads ───────────────────────────────────────────────────────────

describe("GET /api/missions", () => {
  it("lists only published missions (no steps)", async () => {
    const res = await request(appAs("parent_A")).get("/api/missions");
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].id).toBe("m1");
    expect(res.body.data[0].steps).toBeUndefined();
  });

  it("requires authentication", async () => {
    const res = await request(appAs()).get("/api/missions");
    expect(res.status).toBe(401);
  });
});

describe("GET /api/missions/:id", () => {
  it("returns steps with answer keys stripped (no self-grading)", async () => {
    const res = await request(appAs("parent_A")).get("/api/missions/m1");
    expect(res.status).toBe(200);
    const choice = res.body.data.steps.find((s: { id: string }) => s.id === "s_choice");
    const drag = res.body.data.steps.find((s: { id: string }) => s.id === "s_drag");
    // options present but "correct" flags removed; drag "solution" removed.
    expect(choice.content.options.map((o: { correct?: boolean }) => o.correct)).toEqual([undefined, undefined]);
    expect(drag.content.solution).toBeUndefined();
  });
});

describe("GET /api/children/:childId/missions", () => {
  it("returns each mission with the child's (initially empty) progress", async () => {
    const res = await request(appAs("parent_A")).get("/api/children/child_A/missions");
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0]).toMatchObject({ totalSteps: 5, completedSteps: 0, progress: null });
  });

  it("forbids access to another parent's child", async () => {
    const res = await request(appAs("parent_B")).get("/api/children/child_A/missions");
    expect(res.status).toBe(403);
  });
});

// ── Start / resume ────────────────────────────────────────────────────────────

describe("POST /api/missions/:id/start", () => {
  it("starts a mission and creates progress rows", async () => {
    const res = await request(appAs("parent_A")).post("/api/missions/m1/start").send({ childId: "child_A" });
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe("IN_PROGRESS");
    expect(res.body.data.steps).toHaveLength(5);
    expect(h.store.childMission).toHaveLength(1);
  });

  it("is idempotent and resumes prior progress (no duplicate mission)", async () => {
    const agent = appAs("parent_A");
    await request(agent).post("/api/missions/m1/start").send({ childId: "child_A" });
    await request(agent)
      .post("/api/missions/m1/steps/s_choice/answer")
      .send({ childId: "child_A", response: { optionId: "b" } });

    const resume = await request(agent).post("/api/missions/m1/start").send({ childId: "child_A" });
    expect(h.store.childMission).toHaveLength(1); // not duplicated
    const step = resume.body.data.steps.find((s: { missionStepId: string }) => s.missionStepId === "s_choice");
    expect(step).toMatchObject({ status: "COMPLETED", isCorrect: true });
  });

  it("rejects a body that smuggles server-owned fields", async () => {
    const res = await request(appAs("parent_A"))
      .post("/api/missions/m1/start")
      .send({ childId: "child_A", xp: 9999 });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("forbids starting a mission for another parent's child", async () => {
    const res = await request(appAs("parent_B")).post("/api/missions/m1/start").send({ childId: "child_A" });
    expect(res.status).toBe(403);
  });

  it("requires authentication", async () => {
    const res = await request(appAs()).post("/api/missions/m1/start").send({ childId: "child_A" });
    expect(res.status).toBe(401);
  });
});

// ── Answers (backend grading) ─────────────────────────────────────────────────

describe("POST /api/missions/:id/steps/:stepId/answer", () => {
  it("grades a correct choice and awards XP", async () => {
    const res = await request(appAs("parent_A"))
      .post("/api/missions/m1/steps/s_choice/answer")
      .send({ childId: "child_A", response: { optionId: "b" } });
    expect(res.status).toBe(200);
    expect(res.body.data.correct).toBe(true);
    expect(res.body.data.xpAwarded).toBe(10);
    expect(res.body.data.child.xp).toBe(10);
    expect(childOf("child_A").xp).toBe(10);
  });

  it("grades an incorrect choice and awards no XP", async () => {
    const res = await request(appAs("parent_A"))
      .post("/api/missions/m1/steps/s_choice/answer")
      .send({ childId: "child_A", response: { optionId: "a" } });
    expect(res.status).toBe(200);
    expect(res.body.data.correct).toBe(false);
    expect(res.body.data.xpAwarded).toBe(0);
    expect(childOf("child_A").xp).toBe(0);
  });

  it("grades a drag-drop against the stored solution", async () => {
    const res = await request(appAs("parent_A"))
      .post("/api/missions/m1/steps/s_drag/answer")
      .send({ childId: "child_A", response: { placements: { "1": "cats", "2": "dogs" } } });
    expect(res.body.data.correct).toBe(true);
    expect(res.body.data.xpAwarded).toBe(10);
  });

  it("accepts an open-ended answer (correct = null) and awards XP", async () => {
    const res = await request(appAs("parent_A"))
      .post("/api/missions/m1/steps/s_q/answer")
      .send({ childId: "child_A", response: { text: "lots of cat photos" } });
    expect(res.body.data.correct).toBeNull();
    expect(res.body.data.xpAwarded).toBe(10);
  });

  it("does not re-award XP when re-answering a step", async () => {
    const agent = appAs("parent_A");
    await request(agent).post("/api/missions/m1/steps/s_choice/answer").send({ childId: "child_A", response: { optionId: "b" } });
    const again = await request(agent).post("/api/missions/m1/steps/s_choice/answer").send({ childId: "child_A", response: { optionId: "b" } });
    expect(again.body.data.xpAwarded).toBe(0);
    expect(childOf("child_A").xp).toBe(10);
  });

  it("returns 404 for a step that is not part of the mission", async () => {
    const res = await request(appAs("parent_A"))
      .post("/api/missions/m1/steps/does-not-exist/answer")
      .send({ childId: "child_A", response: { optionId: "b" } });
    expect(res.status).toBe(404);
  });

  it("forbids answering for another parent's child", async () => {
    const res = await request(appAs("parent_B"))
      .post("/api/missions/m1/steps/s_choice/answer")
      .send({ childId: "child_A", response: { optionId: "b" } });
    expect(res.status).toBe(403);
  });
});

// ── Completion (idempotent) ───────────────────────────────────────────────────

describe("POST /api/missions/:id/complete", () => {
  it("completes a mission, computes the score, and awards a one-time bonus", async () => {
    const agent = appAs("parent_A");
    await request(agent).post("/api/missions/m1/start").send({ childId: "child_A" });
    await request(agent).post("/api/missions/m1/steps/s_choice/answer").send({ childId: "child_A", response: { optionId: "b" } });

    const res = await request(agent).post("/api/missions/m1/complete").send({ childId: "child_A" });
    expect(res.status).toBe(200);
    expect(res.body.data.alreadyCompleted).toBe(false);
    expect(res.body.data.status).toBe("COMPLETED");
    expect(res.body.data.score).toBe(50); // 1 of 2 graded steps correct
    expect(res.body.data.xpAwarded).toBe(50);
    expect(childOf("child_A").xp).toBe(60); // 10 (choice) + 50 (bonus)
  });

  it("is idempotent — a duplicate completion awards nothing more", async () => {
    const agent = appAs("parent_A");
    await request(agent).post("/api/missions/m1/steps/s_choice/answer").send({ childId: "child_A", response: { optionId: "b" } });
    await request(agent).post("/api/missions/m1/complete").send({ childId: "child_A" });
    const xpAfterFirst = childOf("child_A").xp;

    const dup = await request(agent).post("/api/missions/m1/complete").send({ childId: "child_A" });
    expect(dup.body.data.alreadyCompleted).toBe(true);
    expect(dup.body.data.xpAwarded).toBe(0);
    expect(childOf("child_A").xp).toBe(xpAfterFirst);
    expect(h.store.childMission).toHaveLength(1);
  });

  it("forbids completing for another parent's child", async () => {
    const res = await request(appAs("parent_B")).post("/api/missions/m1/complete").send({ childId: "child_A" });
    expect(res.status).toBe(403);
  });
});
