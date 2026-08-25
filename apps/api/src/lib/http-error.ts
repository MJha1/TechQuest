import type { ErrorCode } from "@techquest/shared";

/**
 * Typed HTTP error. Services/controllers throw these; the central error handler
 * turns them into the shared failure envelope. Carrying `status` + `code`
 * together keeps HTTP status and the machine-readable error code consistent.
 */
export class HttpError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: ErrorCode,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "HttpError";
  }
}

export const badRequest = (message: string, details?: unknown) =>
  new HttpError(400, "VALIDATION_ERROR", message, details);
export const unauthorized = (message = "Authentication required") =>
  new HttpError(401, "UNAUTHORIZED", message);
export const forbidden = (message = "You do not have access to this resource") =>
  new HttpError(403, "FORBIDDEN", message);
export const notFound = (message = "Resource not found") =>
  new HttpError(404, "NOT_FOUND", message);
export const conflict = (message: string) =>
  new HttpError(409, "CONFLICT", message);
export const payloadTooLarge = (message = "Request body too large") =>
  new HttpError(413, "PAYLOAD_TOO_LARGE", message);
export const tooManyRequests = (message = "Too many requests, please slow down") =>
  new HttpError(429, "RATE_LIMITED", message);
export const internal = (message = "Internal server error") =>
  new HttpError(500, "INTERNAL", message);
