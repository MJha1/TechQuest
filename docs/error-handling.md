# TechQuest — Error Handling

**Last reviewed:** 2026-08-26.

Every failure is caught, mapped to a safe message, and (for children) shown as a single friendly line with a retry — never a stack trace, database error, secret, or infrastructure detail.

## The child-facing message

All errors in the **child** experience render exactly:

> **Oops! Something went wrong.** Let's try again.

Defined once as `CHILD_ERROR` in `apps/web/src/components/ui/error-state.tsx` and used by `ChildHomePage`, `MissionsPage`, `MissionDetailPage`, and `MissionCompletePage`. Parent surfaces use their own calm, non-technical copy.

## How each failure is handled

| Failure | Where it's caught | Result |
|---|---|---|
| **Network failure** (offline, DNS, reset, abort) | `request()` wrapper (`apps/web/src/lib/api.ts`) — `fetch` in a `try/catch` | `ApiRequestError("NETWORK", …)`; child sees the standard message + retry |
| **API failure** (`{ ok: false }` envelope) | `request()` | `ApiRequestError(code, message)` — the backend's messages are already sanitized |
| **Session expiry** (401, or `UNAUTHORIZED` envelope) | `request()` → `onUnauthorized` hook, registered in `App.tsx` | Redirect to `/login` (no loop — skipped if already there) |
| **Missing mission** (404) | `mission.service` throws `notFound`; page `.catch` | Standard child error with retry |
| **Invalid answer** (empty/malformed) | Client gates submission (`canSubmit`); server returns 400 `VALIDATION_ERROR` | Never submitted blank; a rejected submit shows the standard error |
| **AI timeout** | `ai.service` — `AbortController` + per-call timeout | Safe fallback hint; the child always gets usable text, never an error |
| **Database failure** | Central error handler (`middleware/error-handler.ts`) | Generic `500 { code: "INTERNAL", message: "Internal server error" }`; the real error (message + stack) is logged **server-side only** |
| **Non-JSON response** (proxy/gateway error page) | `request()` — `res.json()` in a `try/catch` | Generic `SERVER` error; the response body is never surfaced |

## Never exposed

- **Stack traces / raw errors** — the `request()` wrapper never rethrows a `TypeError`/`SyntaxError`; the server handler logs details and returns a generic 500.
- **Database errors** — Prisma errors fall through to the generic 500; their text never reaches the client.
- **API secrets / infrastructure** — secrets are server-only (see `docs/security.md`); no status codes, hostnames, or internal identifiers appear in any user-facing message.

## Safe retry & idempotency

Retry is a manual, explicit action (the "Try again" button); there is no aggressive auto-retry of writes. Retries are safe because the operations they hit are **idempotent**:

- **Starting a mission** (`ensureChildMission`) resumes existing progress instead of duplicating it.
- **Answering a step** awards XP only on the first correct answer / first challenge completion — repeat submissions award `0`.
- **Completing a mission** awards its XP and badges once; a duplicate completion returns `alreadyCompleted: true` with `xpAwarded: 0` and no new badge.

These guarantees are covered by tests in `apps/api/src/routes/mission.test.ts` (idempotent start, repeat-answer awards 0 XP, duplicate completion awards no XP/badge). The `request()` mappings are covered by `apps/web/src/lib/api.test.ts`.
