import { z } from "zod";

/**
 * Shared API response contract used by every endpoint. One definition for both
 * the Express backend (constructs responses) and the React frontend (consumes
 * them) — no duplicate response types on either side.
 */

export const ErrorCode = z.enum([
  "VALIDATION_ERROR",
  "UNAUTHORIZED",
  "FORBIDDEN",
  "NOT_FOUND",
  "CONFLICT",
  "PAYLOAD_TOO_LARGE",
  "RATE_LIMITED",
  "AI_UNAVAILABLE",
  "INTERNAL",
]);
export type ErrorCode = z.infer<typeof ErrorCode>;

export const ApiErrorSchema = z.object({
  code: ErrorCode,
  message: z.string(),
  details: z.unknown().optional(),
});
export type ApiError = z.infer<typeof ApiErrorSchema>;

/** Health payload returned by the API's `/health` endpoint. */
export const HealthSchema = z.object({
  status: z.literal("ok"),
  service: z.string().min(1),
});
export type Health = z.infer<typeof HealthSchema>;

// ── Response envelope ─────────────────────────────────────────────────────────

export interface ApiSuccess<T> {
  ok: true;
  data: T;
}
export interface ApiFailure {
  ok: false;
  error: ApiError;
}
export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

/** Build a Zod schema for a success envelope wrapping `data`. */
export const apiSuccessSchema = <T extends z.ZodTypeAny>(data: T) =>
  z.object({ ok: z.literal(true), data });

export const apiFailureSchema = z.object({
  ok: z.literal(false),
  error: ApiErrorSchema,
});

/** Build a Zod schema for a full response envelope wrapping `data`. */
export const apiResponseSchema = <T extends z.ZodTypeAny>(data: T) =>
  z.union([apiSuccessSchema(data), apiFailureSchema]);

// ── Constructors (backend convenience) ────────────────────────────────────────

export const ok = <T>(data: T): ApiSuccess<T> => ({ ok: true, data });
export const fail = (error: ApiError): ApiFailure => ({ ok: false, error });
