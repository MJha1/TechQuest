import type { Request } from "express";

/**
 * Authentication primitives.
 *
 * A `SessionResolver` turns an incoming request into an authenticated user (or
 * null). This is the seam where Better Auth will be wired in a later task — the
 * default resolver returns no session, so nothing is authenticated until that
 * integration lands. Tests inject their own resolver.
 */
export interface AuthUser {
  userId: string;
}

export type SessionResolver = (
  req: Request,
) => Promise<AuthUser | null> | AuthUser | null;

/** Placeholder resolver — always unauthenticated until Better Auth is wired. */
export const defaultSessionResolver: SessionResolver = async () => null;
