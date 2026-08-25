import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Request, Response } from "express";
import { HttpError } from "../lib/http-error.js";

// Mock the shared Prisma client so ownership checks are deterministic and never
// touch a real database. `vi.hoisted` lets the mock factory reference the spy.
const { findUnique } = vi.hoisted(() => ({ findUnique: vi.fn() }));
vi.mock("@techquest/db", () => ({
  prisma: { child: { findUnique } },
}));

const { requireAuth, requireChildOwnership } = await import("./authorize.js");

function fakeReq(overrides: Partial<Request> = {}): Request {
  return { auth: null, params: {}, ...overrides } as Request;
}
const res = {} as Response;

/** Runs a middleware and returns the argument passed to next() (undefined = ok). */
async function run(
  mw: (req: Request, res: Response, next: (err?: unknown) => void) => unknown,
  req: Request,
): Promise<unknown> {
  const next = vi.fn();
  await mw(req, res, next);
  expect(next).toHaveBeenCalledTimes(1);
  return next.mock.calls.at(0)?.at(0);
}

beforeEach(() => {
  findUnique.mockReset();
});

describe("requireAuth", () => {
  it("passes an authenticated request through", async () => {
    const err = await run(requireAuth, fakeReq({ auth: { userId: "parent_A" } }));
    expect(err).toBeUndefined();
  });

  it("rejects an unauthenticated request with 401", async () => {
    const err = await run(requireAuth, fakeReq({ auth: null }));
    expect(err).toBeInstanceOf(HttpError);
    expect((err as HttpError).status).toBe(401);
  });
});

describe("requireChildOwnership", () => {
  const guard = requireChildOwnership();

  it("allows a parent to access their own child", async () => {
    findUnique.mockResolvedValue({ id: "child_A", parentId: "parent_A" });
    const req = fakeReq({ auth: { userId: "parent_A" }, params: { childId: "child_A" } });

    const err = await run(guard, req);

    expect(err).toBeUndefined();
    expect(req.child).toEqual({ id: "child_A", parentId: "parent_A" });
  });

  it("forbids Parent A from accessing Child B (cross-parent access) with 403", async () => {
    // Child B belongs to Parent B.
    findUnique.mockResolvedValue({ id: "child_B", parentId: "parent_B" });
    const req = fakeReq({ auth: { userId: "parent_A" }, params: { childId: "child_B" } });

    const err = await run(guard, req);

    expect(err).toBeInstanceOf(HttpError);
    expect((err as HttpError).status).toBe(403);
    expect((err as HttpError).code).toBe("FORBIDDEN");
    expect(req.child).toBeUndefined();
  });

  it("rejects an unauthenticated request with 401 before querying", async () => {
    const req = fakeReq({ auth: null, params: { childId: "child_A" } });

    const err = await run(guard, req);

    expect((err as HttpError).status).toBe(401);
    expect(findUnique).not.toHaveBeenCalled();
  });

  it("returns 404 for a child that does not exist", async () => {
    findUnique.mockResolvedValue(null);
    const req = fakeReq({ auth: { userId: "parent_A" }, params: { childId: "ghost" } });

    const err = await run(guard, req);

    expect((err as HttpError).status).toBe(404);
  });

  it("returns 400 when the child id route param is missing", async () => {
    const req = fakeReq({ auth: { userId: "parent_A" }, params: {} });

    const err = await run(guard, req);

    expect((err as HttpError).status).toBe(400);
    expect(findUnique).not.toHaveBeenCalled();
  });
});
