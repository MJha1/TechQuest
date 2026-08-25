import { describe, it, expect } from "vitest";
import request from "supertest";
import { createApp } from "./app.js";

describe("GET /api/health", () => {
  const app = createApp();

  it("returns the success envelope", async () => {
    const res = await request(app).get("/api/health");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      ok: true,
      data: { status: "ok", service: "TechQuest-api" },
    });
  });

  it("sets a request id and security headers, and hides x-powered-by", async () => {
    const res = await request(app).get("/api/health");
    expect(res.headers["x-request-id"]).toBeTruthy();
    expect(res.headers["x-content-type-options"]).toBe("nosniff");
    expect(res.headers["x-powered-by"]).toBeUndefined();
  });

  it("echoes an inbound request id", async () => {
    const res = await request(app)
      .get("/api/health")
      .set("x-request-id", "trace-123");
    expect(res.headers["x-request-id"]).toBe("trace-123");
  });
});

describe("error format", () => {
  const app = createApp();

  it("returns a NOT_FOUND envelope for unknown routes", async () => {
    const res = await request(app).get("/api/does-not-exist");
    expect(res.status).toBe(404);
    expect(res.body.ok).toBe(false);
    expect(res.body.error.code).toBe("NOT_FOUND");
  });

  it("rejects a body over the size limit with 413", async () => {
    const res = await request(app)
      .post("/api/health")
      .send({ big: "x".repeat(40_000) });
    expect(res.status).toBe(413);
    expect(res.body.error.code).toBe("PAYLOAD_TOO_LARGE");
  });

  it("rejects malformed JSON with 400", async () => {
    const res = await request(app)
      .post("/api/health")
      .set("Content-Type", "application/json")
      .send("{ not valid json");
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });
});

describe("authentication + authorization", () => {
  it("rejects an unauthenticated protected route with 401", async () => {
    const app = createApp();
    const res = await request(app).get("/api/me");
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("UNAUTHORIZED");
  });

  it("allows an authenticated request through", async () => {
    const app = createApp({ sessionResolver: () => ({ userId: "user_123" }) });
    const res = await request(app).get("/api/me");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true, data: { userId: "user_123" } });
  });
});

describe("Better Auth routes (parent signup / login / logout)", () => {
  // Inject a fake handler so we assert the routes reach Better Auth without a DB.
  function appWithFakeAuth() {
    const seen: Array<{ method: string; path: string }> = [];
    const app = createApp({
      authHandler: (req, res) => {
        seen.push({ method: req.method, path: req.path });
        res.status(200).json({ routed: true });
      },
    });
    return { app, seen };
  }

  it("routes parent signup to the Better Auth handler", async () => {
    const { app, seen } = appWithFakeAuth();
    const res = await request(app)
      .post("/api/auth/sign-up/email")
      .send({ email: "parent@example.com", password: "s3cret-passphrase" });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ routed: true });
    expect(seen).toContainEqual({ method: "POST", path: "/api/auth/sign-up/email" });
  });

  it("routes parent login to the Better Auth handler", async () => {
    const { app, seen } = appWithFakeAuth();
    const res = await request(app)
      .post("/api/auth/sign-in/email")
      .send({ email: "parent@example.com", password: "s3cret-passphrase" });
    expect(res.status).toBe(200);
    expect(seen).toContainEqual({ method: "POST", path: "/api/auth/sign-in/email" });
  });

  it("routes parent logout to the Better Auth handler", async () => {
    const { app, seen } = appWithFakeAuth();
    const res = await request(app).post("/api/auth/sign-out");
    expect(res.status).toBe(200);
    expect(seen).toContainEqual({ method: "POST", path: "/api/auth/sign-out" });
  });
});

describe("rate limiting", () => {
  it("returns 429 once the limit is exceeded", async () => {
    const app = createApp({
      enableRateLimit: true,
      rateLimit: { windowMs: 60_000, max: 2 },
    });
    const agent = request(app);

    expect((await agent.get("/api/health")).status).toBe(200);
    expect((await agent.get("/api/health")).status).toBe(200);

    const blocked = await agent.get("/api/health");
    expect(blocked.status).toBe(429);
    expect(blocked.body.error.code).toBe("RATE_LIMITED");
  });
});
