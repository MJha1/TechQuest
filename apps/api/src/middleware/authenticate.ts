import type { NextFunction, Request, Response } from "express";
import { defaultSessionResolver, type SessionResolver } from "../lib/auth.js";

/**
 * Non-enforcing authentication: resolves the session and attaches it to
 * `req.auth` (null when unauthenticated). It never rejects — route guards
 * (`requireAuth`, etc.) decide whether a given route requires a session.
 */
export function authenticate(resolver: SessionResolver = defaultSessionResolver) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      req.auth = (await resolver(req)) ?? null;
      next();
    } catch (err) {
      next(err);
    }
  };
}
