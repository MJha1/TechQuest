import { describe, it, expect, beforeEach, vi } from "vitest";
import request from "supertest";
import type { SessionResolver } from "../lib/auth.js";
import type { Recommendation } from "@techquest/shared";

/**
 * Route-level test for GET /api/children/:childId/recommendation. The engine and
 * data-loading have their own unit tests; here we verify the wiring and that
 * ownership is enforced on the endpoint. The service is stubbed and the child
 * table is a tiny in-memory fake used only by the ownership middleware.
 */

const { store, recommendMock } = vi.hoisted(() => ({
  store: {
    children: [
      { id: "child_A", parentId: "parent_A" },
      { id: "child_B", parentId: "parent_B" },
    ] as { id: string; parentId: string }[],
  },
  recommendMock: vi.fn(),
}));

vi.mock("@techquest/db", () => ({
  prisma: {
    child: {
      findUnique: vi.fn(async ({ where }: { where: { id: string } }) =>
        store.children.find((c) => c.id === where.id) ?? null,
      ),
    },
  },
}));

vi.mock("../services/recommendation.service.js", () => ({
  getChildRecommendation: recommendMock,
}));

const { createApp } = await import("../app.js");

function appAs(userId?: string) {
  const sessionResolver: SessionResolver = () => (userId ? { userId } : null);
  return createApp({ sessionResolver });
}

const sampleRec: Recommendation = {
  kind: "first_mission",
  reason: "Start your first mission: “How Does AI Learn?”. It's a great place to begin!",
  concept: "Examples → Patterns → Prediction",
  mission: {
    id: "m1",
    slug: "how-ai-learns",
    title: "How Does AI Learn?",
    concept: "Examples → Patterns → Prediction",
    estimatedMinutes: 9,
  },
  activity: null,
  interest: null,
  example: null,
};

beforeEach(() => {
  recommendMock.mockReset();
  recommendMock.mockResolvedValue(sampleRec);
});

describe("GET /api/children/:childId/recommendation", () => {
  it("rejects an unauthenticated request with 401", async () => {
    const res = await request(appAs()).get("/api/children/child_A/recommendation");
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("UNAUTHORIZED");
    expect(recommendMock).not.toHaveBeenCalled();
  });

  it("returns the recommendation for the parent's own child", async () => {
    const res = await request(appAs("parent_A")).get("/api/children/child_A/recommendation");
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.data).toMatchObject({ kind: "first_mission", mission: { id: "m1" } });
    expect(recommendMock).toHaveBeenCalledWith("child_A");
  });

  it("forbids reading another parent's child with 403", async () => {
    const res = await request(appAs("parent_A")).get("/api/children/child_B/recommendation");
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe("FORBIDDEN");
    expect(recommendMock).not.toHaveBeenCalled();
  });

  it("returns 404 for a child that does not exist", async () => {
    const res = await request(appAs("parent_A")).get("/api/children/ghost/recommendation");
    expect(res.status).toBe(404);
    expect(recommendMock).not.toHaveBeenCalled();
  });
});
