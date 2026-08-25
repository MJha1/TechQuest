import type { NextFunction, Request, RequestHandler, Response } from "express";
import { prisma } from "@techquest/db";
import { badRequest, forbidden, notFound, unauthorized } from "../lib/http-error.js";

/**
 * Authorization guards. `authenticate` must run earlier in the chain so
 * `req.auth` is populated before any of these execute.
 */

/** Require an authenticated parent account. */
export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  if (!req.auth) return next(unauthorized());
  next();
}

/**
 * Require that the authenticated parent owns the child named by a route param.
 *
 * This is the core tenancy boundary: Parent A may operate Child A but must never
 * reach Child B. It looks the child up and compares `child.parentId` against the
 * session's `userId`:
 *   - no session            → 401 UNAUTHORIZED
 *   - missing/empty param    → 400 VALIDATION_ERROR
 *   - child does not exist    → 404 NOT_FOUND
 *   - child owned by another → 403 FORBIDDEN
 *
 * On success it attaches the verified child to `req.child` so downstream
 * handlers don't re-query, and calls `next()`.
 *
 * @param key    the child-id field name (default `"childId"`).
 * @param source where to read it from: the route `"params"` (default) or the
 *               request `"body"` (for POST routes that carry childId in the body).
 */
export function requireChildOwnership(
  key = "childId",
  source: "params" | "body" = "params",
): RequestHandler {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.auth) return next(unauthorized());

      const raw = source === "body"
        ? (req.body as Record<string, unknown> | undefined)?.[key]
        : req.params[key];
      const childId = Array.isArray(raw) ? raw[0] : raw;
      if (!childId || typeof childId !== "string") {
        return next(badRequest(`Missing ${source} field: ${key}`));
      }

      const child = await prisma.child.findUnique({
        where: { id: childId },
        select: { id: true, parentId: true },
      });

      // Return 404 (not 403) for a nonexistent child so we don't leak which
      // ids exist to a probing parent.
      if (!child) return next(notFound("Child not found"));
      if (child.parentId !== req.auth.userId) {
        return next(forbidden("You do not have access to this child"));
      }

      req.child = { id: child.id, parentId: child.parentId };
      next();
    } catch (err) {
      next(err);
    }
  };
}
