import rateLimit from "express-rate-limit";
import { tooManyRequests } from "../lib/http-error.js";

/**
 * Builds a rate limiter that funnels rejections through the central error
 * handler, so a 429 uses the same failure envelope as every other error.
 */
export function createRateLimiter(opts: { windowMs: number; max: number }) {
  return rateLimit({
    windowMs: opts.windowMs,
    max: opts.max,
    standardHeaders: true,
    legacyHeaders: false,
    // We control the trust-proxy setting explicitly in app.ts.
    validate: false,
    handler: (_req, _res, next) => next(tooManyRequests()),
  });
}
