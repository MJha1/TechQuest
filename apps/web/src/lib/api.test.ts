import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { listChildren, ApiRequestError, setUnauthorizedHandler } from "./api";

/**
 * The request wrapper must convert EVERY failure into a safe `ApiRequestError`
 * with a friendly message — a network drop, a non-JSON gateway page, a 401, or a
 * `{ ok: false }` envelope — and never leak a raw fetch/JSON error, a status, or
 * server internals. `listChildren` is a representative GET through the wrapper.
 */

function jsonResponse(status: number, body: unknown): Response {
  return { status, json: async () => body } as unknown as Response;
}

beforeEach(() => {
  setUnauthorizedHandler(null);
});
afterEach(() => {
  vi.unstubAllGlobals();
});

describe("api request wrapper", () => {
  it("returns unwrapped data on success", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse(200, { ok: true, data: [{ id: "c1" }] })));
    await expect(listChildren()).resolves.toEqual([{ id: "c1" }]);
  });

  it("maps a network failure to a NETWORK error (no raw error leaks)", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")));
    await expect(listChildren()).rejects.toMatchObject({
      name: "ApiRequestError",
      code: "NETWORK",
    });
  });

  it("maps a non-JSON response to a generic SERVER error", async () => {
    const res = { status: 502, json: async () => { throw new SyntaxError("Unexpected token <"); } } as unknown as Response;
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(res));
    const err = await listChildren().catch((e) => e);
    expect(err).toBeInstanceOf(ApiRequestError);
    expect(err.code).toBe("SERVER");
    expect(err.message).not.toMatch(/token|syntax|502/i); // nothing internal
  });

  it("surfaces a { ok: false } envelope error", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse(404, { ok: false, error: { code: "NOT_FOUND", message: "Child not found" } })));
    await expect(listChildren()).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("invokes the unauthorized handler once on a 401 (session expiry)", async () => {
    const onUnauth = vi.fn();
    setUnauthorizedHandler(onUnauth);
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse(401, { ok: false, error: { code: "UNAUTHORIZED", message: "x" } })));

    const err = await listChildren().catch((e) => e);
    expect(err.code).toBe("UNAUTHORIZED");
    expect(onUnauth).toHaveBeenCalledTimes(1);
  });
});
