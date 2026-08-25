import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { fail, type ApiError } from "@techquest/shared";
import { HttpError } from "../lib/http-error.js";
import { logger } from "../lib/logger.js";

/** Terminal 404 — reached when no route matched. */
export function notFoundHandler(req: Request, _res: Response, next: NextFunction): void {
  next(new HttpError(404, "NOT_FOUND", `Route ${req.method} ${req.path} not found`));
}

function isType(err: unknown, type: string): boolean {
  return typeof err === "object" && err !== null && (err as { type?: string }).type === type;
}

/**
 * Central error handler — the single place that converts any thrown/forwarded
 * error into the shared failure envelope `{ ok: false, error: {...} }`. Known
 * errors map to their status/code; anything unexpected becomes a 500 with a
 * generic message (details are logged, never leaked to the client).
 */
export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (res.headersSent) return next(err);

  let status = 500;
  let apiError: ApiError = { code: "INTERNAL", message: "Internal server error" };

  if (err instanceof HttpError) {
    status = err.status;
    apiError = {
      code: err.code,
      message: err.message,
      ...(err.details !== undefined ? { details: err.details } : {}),
    };
  } else if (err instanceof ZodError) {
    status = 400;
    apiError = { code: "VALIDATION_ERROR", message: "Validation failed", details: err.flatten() };
  } else if (isType(err, "entity.too.large")) {
    status = 413;
    apiError = { code: "PAYLOAD_TOO_LARGE", message: "Request body too large" };
  } else if (isType(err, "entity.parse.failed") || err instanceof SyntaxError) {
    status = 400;
    apiError = { code: "VALIDATION_ERROR", message: "Malformed JSON body" };
  }

  if (status >= 500) {
    logger.error("unhandled_error", {
      id: req.id,
      message: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack : undefined,
    });
  } else {
    logger.debug("request_error", { id: req.id, status, code: apiError.code });
  }

  res.status(status).json(fail(apiError));
}
