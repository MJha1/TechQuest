import { describe, it, expect, vi } from "vitest";
import request from "supertest";
import { createApp } from "../app.js";
import type { SessionResolver } from "../lib/auth.js";
import type { AIProvider } from "../ai/provider.js";

// A stub AI provider so the route is exercised without any real LLM call.
function stubProvider(complete: AIProvider["complete"]): AIProvider {
  return { name: "stub", available: true, complete: vi.fn(complete) };
}

const authed: SessionResolver = () => ({ userId: "parent_A" });

const VALID_BODY = {
  missionContext: "How Does AI Learn?",
  learningObjective: "AI learns patterns from examples",
  question: "Which helps the AI learn best?",
  attempt: "one photo",
};

describe("POST /api/ai/hint", () => {
  it("requires authentication", async () => {
    const app = createApp({ sessionResolver: () => null });
    const res = await request(app).post("/api/ai/hint").send(VALID_BODY);
    expect(res.status).toBe(401);
  });

  it("returns a hint from the provider", async () => {
    const app = createApp({
      sessionResolver: authed,
      aiProvider: stubProvider(async () => "Think about what the examples have in common."),
    });
    const res = await request(app).post("/api/ai/hint").send(VALID_BODY);
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual({
      hint: "Think about what the examples have in common.",
      source: "ai",
    });
  });

  it("validates the request body", async () => {
    const app = createApp({ sessionResolver: authed, aiProvider: stubProvider(async () => "x") });
    const res = await request(app)
      .post("/api/ai/hint")
      .send({ missionContext: "m" }); // missing required fields
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("returns a safe fallback (200) when the provider fails", async () => {
    const app = createApp({
      sessionResolver: authed,
      aiProvider: stubProvider(async () => {
        throw new Error("llm down");
      }),
    });
    const res = await request(app).post("/api/ai/hint").send(VALID_BODY);
    expect(res.status).toBe(200);
    expect(res.body.data.source).toBe("fallback");
    expect(res.body.data.hint.length).toBeGreaterThan(0);
  });
});

describe("AI activities", () => {
  it("lists the activity catalog (auth required)", async () => {
    expect((await request(createApp({ sessionResolver: () => null })).get("/api/ai/activities")).status).toBe(401);

    const app = createApp({ sessionResolver: authed, aiProvider: stubProvider(async () => "x") });
    const res = await request(app).get("/api/ai/activities");
    expect(res.status).toBe(200);
    expect(res.body.data.map((a: { key: string }) => a.key)).toContain("another_example");
    expect(res.body.data.every((a: { objective: string }) => a.objective.length > 0)).toBe(true);
  });

  it("runs a controlled activity", async () => {
    const app = createApp({
      sessionResolver: authed,
      aiProvider: stubProvider(async () => "A cat and a lion are both examples of animals with whiskers."),
    });
    const res = await request(app)
      .post("/api/ai/activities/another_example")
      .send({ concept: "animals with whiskers" });
    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ activity: "another_example", source: "ai" });
    expect(res.body.data.text.length).toBeGreaterThan(0);
  });

  it("validates the controlled input", async () => {
    const app = createApp({ sessionResolver: authed, aiProvider: stubProvider(async () => "x") });
    const res = await request(app)
      .post("/api/ai/activities/another_example")
      .send({ concept: "", extra: "nope" }); // empty + unknown key
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("404s an unknown activity", async () => {
    const app = createApp({ sessionResolver: authed, aiProvider: stubProvider(async () => "x") });
    const res = await request(app).post("/api/ai/activities/open_chat").send({ message: "hi" });
    expect(res.status).toBe(404);
  });

  it("falls back when the provider fails", async () => {
    const app = createApp({
      sessionResolver: authed,
      aiProvider: stubProvider(async () => {
        throw new Error("down");
      }),
    });
    const res = await request(app)
      .post("/api/ai/activities/should_verify")
      .send({ claim: "The sun is cold." });
    expect(res.status).toBe(200);
    expect(res.body.data.source).toBe("fallback");
  });
});
