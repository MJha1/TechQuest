import type { NextFunction, Request, Response } from "express";
import { env } from "../lib/env.js";
import { logger } from "../lib/logger.js";

/**
 * Logs one line per completed request with method, path, status, duration and
 * request id. Silent under NODE_ENV=test to keep test output clean.
 */
export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  if (env.NODE_ENV === "test") return next();

  const start = process.hrtime.bigint();
  res.on("finish", () => {
    const durationMs = Number(process.hrtime.bigint() - start) / 1e6;
    logger.info("request", {
      id: req.id,
      method: req.method,
      path: req.originalUrl,
      status: res.statusCode,
      durationMs: Math.round(durationMs),
    });
  });
  next();
}
