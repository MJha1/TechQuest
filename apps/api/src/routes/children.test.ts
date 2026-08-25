import { describe, it, expect, beforeEach, vi } from "vitest";
import request from "supertest";
import type { SessionResolver } from "../lib/auth.js";

/**
 * In-memory Prisma fake for the `child` model. Behaves like a tiny table so the
 * ownership scoping (`where: { parentId }`) is genuinely exercised end-to-end,
 * without touching a real database.
 */
type Row = {
  id: string;
  parentId: string;
  nickname: string;
  ageBand: string;
  interests: string[];
  avatar: string | null;
  level: number;
  xp: number;
  streak: number;
  longestStreak: number;
  lastActiveAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

const { store } = vi.hoisted(() => ({ store: { rows: [] as Row[], seq: 0 } }));

function matches(row: Row, where: Record<string, unknown>): boolean {
  return Object.entries(where).every(([k, v]) => (row as Record<string, unknown>)[k] === v);
}

vi.mock("@techquest/db", () => ({
  prisma: {
    child: {
      findMany: vi.fn(async ({ where }: { where: Record<string, unknown> }) =>
        store.rows.filter((r) => matches(r, where)),
      ),
      findFirst: vi.fn(async ({ where }: { where: Record<string, unknown> }) =>
        store.rows.find((r) => matches(r, where)) ?? null,
      ),
      findUnique: vi.fn(async ({ where }: { where: { id: string } }) =>
        store.rows.find((r) => r.id === where.id) ?? null,
      ),
      create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => {
        store.seq += 1;
        const now = new Date();
        const row: Row = {
          id: `child_${store.seq}`,
          parentId: String(data.parentId),
          nickname: String(data.nickname),
          ageBand: String(data.ageBand),
          interests: (data.interests as string[] | undefined) ?? [],
          avatar: (data.avatar as string | null) ?? null,
          level: 1,
          xp: 0,
          streak: 0,
          longestStreak: 0,
          lastActiveAt: null,
          createdAt: now,
          updatedAt: now,
        };
        store.rows.push(row);
        return row;
      }),
      updateMany: vi.fn(
        async ({ where, data }: { where: Record<string, unknown>; data: Partial<Row> }) => {
          const targets = store.rows.filter((r) => matches(r, where));
          for (const r of targets) Object.assign(r, data, { updatedAt: new Date() });
          return { count: targets.length };
        },
      ),
    },
  },
}));

const { createApp } = await import("../app.js");

/** App whose session resolves to a fixed parent (or unauthenticated). */
function appAs(userId?: string) {
  const sessionResolver: SessionResolver = () => (userId ? { userId } : null);
  return createApp({ sessionResolver });
}

beforeEach(() => {
  const now = new Date();
  store.seq = 2;
  store.rows = [
    {
      id: "child_A",
      parentId: "parent_A",
      nickname: "Nova",
      ageBand: "AGE_8_9",
      interests: [],
      avatar: null,
      level: 1,
      xp: 0,
      streak: 0,
      longestStreak: 0,
      lastActiveAt: null,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "child_B",
      parentId: "parent_B",
      nickname: "Pixel",
      ageBand: "AGE_10_11",
      interests: [],
      avatar: null,
      level: 1,
      xp: 0,
      streak: 0,
      longestStreak: 0,
      lastActiveAt: null,
      createdAt: now,
      updatedAt: now,
    },
  ];
});

describe("GET /api/children", () => {
  it("rejects an unauthenticated request with 401", async () => {
    const res = await request(appAs()).get("/api/children");
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("UNAUTHORIZED");
  });

  it("returns only the authenticated parent's own children", async () => {
    const res = await request(appAs("parent_A")).get("/api/children");
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0]).toMatchObject({ id: "child_A", parentId: "parent_A", nickname: "Nova" });
  });
});

describe("POST /api/children", () => {
  it("creates a child owned by the authenticated parent", async () => {
    const res = await request(appAs("parent_A"))
      .post("/api/children")
      .send({ nickname: "Sprocket", ageBand: "AGE_8_9", interests: ["GAMES", "BUILDING"], avatar: "🤖" });
    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({
      parentId: "parent_A",
      nickname: "Sprocket",
      ageBand: "AGE_8_9",
      interests: ["GAMES", "BUILDING"],
      avatar: "🤖",
      level: 1,
      xp: 0,
      streak: 0,
    });

    // It now shows up in that parent's list (and only theirs).
    const list = await request(appAs("parent_A")).get("/api/children");
    expect(list.body.data).toHaveLength(2);
  });

  it("rejects an invalid nickname with 400", async () => {
    const res = await request(appAs("parent_A"))
      .post("/api/children")
      .send({ nickname: "x", ageBand: "AGE_8_9" });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("rejects attempts to set server-owned fields (strict schema) with 400", async () => {
    const res = await request(appAs("parent_A"))
      .post("/api/children")
      .send({ nickname: "Cheat", ageBand: "AGE_8_9", xp: 9999, parentId: "parent_B" });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });
});

describe("GET /api/children/:id (ownership)", () => {
  it("lets a parent read their own child", async () => {
    const res = await request(appAs("parent_A")).get("/api/children/child_A");
    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ id: "child_A", nickname: "Nova" });
  });

  it("forbids Parent A from reading Child B with 403", async () => {
    const res = await request(appAs("parent_A")).get("/api/children/child_B");
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe("FORBIDDEN");
  });

  it("returns 404 for a child that does not exist", async () => {
    const res = await request(appAs("parent_A")).get("/api/children/ghost");
    expect(res.status).toBe(404);
  });

  it("rejects an unauthenticated request with 401", async () => {
    const res = await request(appAs()).get("/api/children/child_A");
    expect(res.status).toBe(401);
  });
});

describe("PATCH /api/children/:id (ownership)", () => {
  it("updates the parent's own child", async () => {
    const res = await request(appAs("parent_A"))
      .patch("/api/children/child_A")
      .send({ nickname: "Nova2" });
    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ id: "child_A", nickname: "Nova2" });
  });

  it("forbids Parent A from updating Child B with 403", async () => {
    const res = await request(appAs("parent_A"))
      .patch("/api/children/child_B")
      .send({ nickname: "Hijack" });
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe("FORBIDDEN");
    // Child B is untouched.
    expect(store.rows.find((r) => r.id === "child_B")?.nickname).toBe("Pixel");
  });

  it("rejects an empty update with 400", async () => {
    const res = await request(appAs("parent_A")).patch("/api/children/child_A").send({});
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });
});
