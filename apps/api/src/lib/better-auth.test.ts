import { describe, it, expect, vi } from "vitest";
import type { Request } from "express";
import { createBetterAuthSessionResolver } from "./better-auth.js";

/** Builds a fake auth instance whose getSession returns a canned value. */
function fakeAuth(session: unknown) {
  const getSession = vi.fn().mockResolvedValue(session);
  return { auth: { api: { getSession } } as never, getSession };
}

const req = { headers: { cookie: "better-auth.session_token=abc" } } as Request;

describe("createBetterAuthSessionResolver", () => {
  it("reduces a valid session to { userId }", async () => {
    const { auth, getSession } = fakeAuth({ user: { id: "parent_A" }, session: {} });
    const resolve = createBetterAuthSessionResolver(auth);

    const result = await resolve(req);

    expect(result).toEqual({ userId: "parent_A" });
    // Reads the session from the request headers (cookies).
    expect(getSession).toHaveBeenCalledWith(
      expect.objectContaining({ headers: expect.anything() }),
    );
  });

  it("returns null when there is no session", async () => {
    const { auth } = fakeAuth(null);
    const resolve = createBetterAuthSessionResolver(auth);

    expect(await resolve(req)).toBeNull();
  });
});
