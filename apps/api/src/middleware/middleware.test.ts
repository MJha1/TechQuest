import { describe, it, expect, vi } from "vitest";
import { z, ZodError } from "zod";
import type { Request, Response } from "express";
import { validate } from "./validate.js";

/** Build a minimal fake Request for unit-testing middleware in isolation. */
function fakeReq(overrides: Partial<Request> = {}): Request {
  return { body: {}, query: {}, params: {}, ...overrides } as Request;
}
const fakeRes = {} as Response;

describe("validate middleware", () => {
  const schema = { body: z.object({ nickname: z.string().min(2) }) };

  it("stores parsed data on req.validated and calls next()", () => {
    const req = fakeReq({ body: { nickname: "Nova" } });
    const next = vi.fn();

    validate(schema)(req, fakeRes, next);

    expect(req.validated.body).toEqual({ nickname: "Nova" });
    expect(next).toHaveBeenCalledWith();
  });

  it("forwards a ZodError to next() on invalid input", () => {
    const req = fakeReq({ body: { nickname: "" } });
    const next = vi.fn();

    validate(schema)(req, fakeRes, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(next.mock.calls.at(0)?.at(0)).toBeInstanceOf(ZodError);
  });
});
