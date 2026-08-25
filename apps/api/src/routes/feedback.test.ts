import { describe, it, expect, beforeEach, vi } from "vitest";
import request from "supertest";
import type { SessionResolver } from "../lib/auth.js";

type Row = { id: string; parentId: string; rating: string; comment: string | null; createdAt: Date };
const { store } = vi.hoisted(() => ({ store: { rows: [] as Row[] } }));

vi.mock("@techquest/db", () => ({
  prisma: {
    parentFeedback: {
      create: vi.fn(async ({ data }: { data: { parentId: string; rating: string; comment: string | null } }) => {
        const row: Row = {
          id: `f_${store.rows.length + 1}`,
          parentId: data.parentId,
          rating: data.rating,
          comment: data.comment ?? null,
          createdAt: new Date(),
        };
        store.rows.push(row);
        return row;
      }),
    },
  },
}));

const { createApp } = await import("../app.js");
const appAs = (userId?: string) => {
  const sessionResolver: SessionResolver = () => (userId ? { userId } : null);
  return createApp({ sessionResolver });
};

beforeEach(() => {
  store.rows.length = 0;
});

describe("POST /api/feedback", () => {
  it("requires authentication", async () => {
    const res = await request(appAs()).post("/api/feedback").send({ rating: "good" });
    expect(res.status).toBe(401);
  });

  it("stores the rating, comment, and parent id from the session", async () => {
    const res = await request(appAs("parent_A"))
      .post("/api/feedback")
      .send({ rating: "loved_it", comment: "More animal missions please!" });
    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({ rating: "loved_it", comment: "More animal missions please!" });
    expect(store.rows).toHaveLength(1);
    expect(store.rows[0]).toMatchObject({ parentId: "parent_A", rating: "loved_it" });
    expect(store.rows[0]!.createdAt).toBeInstanceOf(Date);
  });

  it("accepts a rating with no comment", async () => {
    const res = await request(appAs("parent_A")).post("/api/feedback").send({ rating: "okay" });
    expect(res.status).toBe(201);
    expect(res.body.data.comment).toBeNull();
  });

  it("rejects an invalid rating", async () => {
    const res = await request(appAs("parent_A")).post("/api/feedback").send({ rating: "amazing" });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("rejects an over-long comment", async () => {
    const res = await request(appAs("parent_A"))
      .post("/api/feedback")
      .send({ rating: "good", comment: "x".repeat(501) });
    expect(res.status).toBe(400);
  });

  it("rejects unknown fields (no extra data collected)", async () => {
    const res = await request(appAs("parent_A"))
      .post("/api/feedback")
      .send({ rating: "good", email: "parent@example.com" });
    expect(res.status).toBe(400);
  });
});
