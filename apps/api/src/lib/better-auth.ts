import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { fromNodeHeaders, toNodeHandler } from "better-auth/node";
import { prisma } from "@techquest/db";
import type { Request, RequestHandler } from "express";
import { env, corsOrigins } from "./env.js";
import type { AuthUser, SessionResolver } from "./auth.js";

/**
 * Better Auth server instance — parent (account owner) authentication only.
 *
 * Backed by the shared Prisma client against the existing user/session/account/
 * verification tables. Email + password is the single MVP method; children are
 * profiles under a parent, not auth accounts, so no child sign-in exists here.
 *
 * SECURITY: `secret` is read from the environment and stays server-side. Nothing
 * in this module is importable by the frontend bundle.
 */
export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BETTER_AUTH_URL,
  // Only these browser origins may drive the auth flow (cookies/CSRF).
  trustedOrigins: corsOrigins,
  emailAndPassword: {
    enabled: true,
    // No email-delivery provider is wired in the MVP; parents are usable at
    // signup. Verification can be turned on once email sending exists.
    requireEmailVerification: false,
  },
});

/**
 * Express-mountable handler for all `/api/auth/*` requests. Better Auth's node
 * handler expects Node req/res, which Express's req/res are runtime-compatible
 * with; the cast reconciles the (looser) Node types with Express's handler type.
 */
export const authNodeHandler = toNodeHandler(auth) as unknown as RequestHandler;

/**
 * Session resolver backed by Better Auth. Reads the session from the request's
 * cookies/headers and reduces it to the minimal `AuthUser` the app carries on
 * `req.auth`. Returns null (never throws) when there is no valid session.
 */
export function createBetterAuthSessionResolver(
  instance: typeof auth = auth,
): SessionResolver {
  return async (req: Request): Promise<AuthUser | null> => {
    const session = await instance.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });
    return session?.user ? { userId: session.user.id } : null;
  };
}
