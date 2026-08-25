import { randomUUID } from "node:crypto";
import type { NextFunction, Request, Response } from "express";

/**
 * Assigns a correlation id to every request (honoring an inbound
 * `x-request-id` if present and sane) and echoes it back on the response, so a
 * single request can be traced across logs and clients.
 */
export function requestId(req: Request, res: Response, next: NextFunction): void {
  const inbound = req.header("x-request-id");
  const id = inbound && inbound.length > 0 && inbound.length <= 128 ? inbound : randomUUID();
  req.id = id;
  res.setHeader("x-request-id", id);
  next();
}
