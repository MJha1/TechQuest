# TechQuest — Security & Child-Privacy Audit

**Last reviewed:** 2026-08-25 · **Scope:** the code in this repository (apps/web, apps/api, packages/db, packages/shared).

TechQuest teaches technology and AI to children aged 8–12. **A parent is the only account holder; a child is a profile under that account, never an authentication identity.** This document records the security and child-privacy controls that exist in the codebase, how each was verified, the known limitations, and — importantly — the areas that require **professional legal and privacy review**.

> **This is an engineering self-assessment, not a legal opinion.** It does **not** claim compliance with COPPA, GDPR/GDPR-K, the UK Age Appropriate Design Code, or any other law or standard. See [Areas requiring professional review](#areas-requiring-professional-legal--privacy-review).

---

## Design principles

1. **Data minimization for children.** We collect only a nickname, a coarse age band, optional interest categories, and a preset avatar. No real name, birth date, email, photo, address, school, or geolocation.
2. **A child is never an account.** There is no child login, password, or session. Only a parent authenticates.
3. **The server is authoritative.** Correctness, score, XP, level, and streak are computed server-side; the client cannot assert them.
4. **The AI is a bounded learning tool, not a chatbot.** Every AI feature is single-purpose with a fixed prompt and strict, length-limited input. There is no open-ended child chat.
5. **Secrets stay on the server.** API keys and the auth secret never enter the browser bundle.
6. **Fail closed and quiet.** Errors return a generic message to the client; details are logged server-side only. Children see only friendly, non-technical states.

---

## Requested guarantees — status & evidence

| Requirement | Status | Evidence |
|---|---|---|
| Parent A cannot access Parent B's child | **Enforced** | `requireChildOwnership` on every child-scoped route; service reads scoped by `parentId` |
| Secrets are not exposed | **Enforced** | `.env` gitignored; secret scan clean; only non-secret `VITE_` vars in client |
| API keys are server-side only | **Enforced** | `ANTHROPIC_API_KEY` read in `AnthropicProvider`; client receives output text only |
| Unnecessary child information is not collected | **Enforced** | `Child` model + `.strict()` schemas reject extra/PII fields |
| Analytics contain no unnecessary personal info | **Enforced** | Pseudonymous ids only; PII stripped; autocapture/recording off |
| LLM requests contain no unnecessary child info | **Enforced (with a documented caveat)** | Prompts carry mission content + the child's own answer text; no id/nickname/age/parent — see [AI](#7-ai) |
| No unrestricted child AI chat exists | **Enforced** | Fixed prompts, strict bounded inputs, no free-form `message` field |
| Error messages do not expose internal details | **Enforced** | Central error handler returns generic 500; child UI shows friendly states only |

---

## Area-by-area review

### 1. Authentication
- **Better Auth** (email + password), parent accounts only — `apps/api/src/lib/better-auth.ts`. Children have no credentials.
- **Signing secret** comes from `BETTER_AUTH_SECRET` and stays server-side. Startup **hard-fails in production** if it is left at the insecure dev default — `apps/api/src/lib/env.ts` (`superRefine`).
- **Password policy:** minimum 8 characters (`ParentCredentialsSchema`, `packages/shared/src/commands.ts`).
- **Brute-force protection:** the rate limiter covers `/api/auth/*` (mounted ahead of the auth handler in `app.ts`).
- **Known limitations:** email verification is disabled (`requireEmailVerification: false`) because no email provider is wired in the MVP; there is no password-reset or MFA yet. **Enable verification + reset before a public launch.**

### 2. Authorization
- **Two-tier guards** (`apps/api/src/middleware/authorize.ts`): `requireAuth` gates every protected route; `requireChildOwnership(key, source)` verifies the target child belongs to the signed-in parent, reading the child id from the path *or* the request body.
- **No enumeration:** a non-existent child returns **404**, a child owned by another parent returns **403** — a probing parent cannot tell which ids exist.
- **Defense in depth:** the data layer also scopes reads/writes by `parentId` (`children.service.ts` uses `findFirst`/`updateMany` with `parentId`), so a missed guard would still not leak another parent's data.
- **Every child-scoped endpoint is covered:** `GET/PATCH /api/children/:id`, `GET /api/children/:childId/{missions,badges,recommendation}`, and `POST /api/missions/:id/{start,steps/:stepId/answer,complete}` (childId in the strict body). Parent dashboard and feedback derive the parent from the **session**, never the body.

### 3. Database
- **Neon PostgreSQL over TLS** (`sslmode=require`), accessed through Prisma. Connection strings are server-side only and gitignored.
- **Minimal child record** (`packages/db/prisma/schema.prisma`, `model Child`): `nickname`, `ageBand` (coarse enum), `interests` (category enum array), optional preset `avatar`, and server-owned progression (`level/xp/streak`). No real name, DOB, email, photo, or contact data.
- **Cascade deletes:** deleting a parent (`User`) cascades to their children and all child progress/events (`onDelete: Cascade`), which supports honoring account/data-deletion requests.
- **Known limitations:** encryption-at-rest is whatever Neon provides by default; backup, retention, and deletion-SLA policies are **not** defined in code and need an operational + legal decision.

### 4. API
- **Strict validation:** request bodies are parsed with Zod `.strict()` schemas that reject unknown keys (so a client cannot smuggle a real name, `xp`, or `parentId`) and bound string lengths — `packages/shared/src/commands.ts`, `middleware/validate.ts`.
- **Hardening:** `helmet()` security headers, CORS restricted to an allow-list with credentials, a request body-size limit (`BODY_LIMIT`, default 32 kb), and IP rate limiting on `/api` — `app.ts`, `middleware/security.ts`, `middleware/rate-limit.ts`.
- **Server-authoritative:** grading, score, and XP are computed in `mission.service.ts`; the client never sends correctness or points.
- **Note (accepted):** validation failures return `details: err.flatten()` — this reflects the *caller's own* input (field names + messages), not internal structure, and is standard for form APIs.

### 5. Frontend
- **No secrets in the bundle.** The only client env vars are `VITE_API_URL`, `VITE_POSTHOG_KEY` (a PostHog *project* key, public by design), and `VITE_POSTHOG_HOST` — `apps/web/src/lib/config.ts`, `analytics.ts`.
- **Children never see internals.** Child-facing pages catch API failures and render a friendly `ErrorState`, **discarding the error object** (`.catch(() => setError(true))` in `ChildHomePage`, `MissionsPage`, `MissionDetailPage`). No database ids, technical errors, API details, parent information, or system terminology are shown to a child.
- **No `console.*` logging** in web source (nothing leaks to the browser console).

### 6. Analytics
- **One typed abstraction** over PostHog — `apps/web/src/lib/analytics.ts`. Application code cannot attach an undocumented or PII field at a call site.
- **Pseudonymous only:** children are referenced by an opaque `childRef` (cuid), parents by `userRef`. Age is sent only as a coarse band; `child_created` sends `interestCount` (a number), never the categories or the nickname.
- **No incidental capture:** autocapture, automatic pageviews, and session recording are all disabled; `sanitize_properties` strips known PII keys as a backstop; analytics is a **no-op** without a configured key. Full catalog in [`docs/analytics.md`](./analytics.md).

### 7. AI
- **Provider abstraction** (`ai/provider.ts`) with a single Anthropic implementation. The **API key lives only in `AnthropicProvider`** and never leaves the server; the client receives generated text only.
- **Bounded, single-purpose features:** a hint endpoint and four controlled activities (`another_example`, `compare_answers`, `should_verify`, `improve_prompt`). Each has a **strict, length-limited input schema** and a **fixed system prompt**. There is deliberately **no free-form `message` field** anywhere — no open child chat.
- **Safeguards** (`services/ai.service.ts`): request timeout, max output tokens, max output characters, output validation, a safe fallback on any failure/timeout/empty/refusal, and errors logged **server-side only** (the child always gets safe text).
- **What reaches the LLM:** mission context, the learning objective, the question, and **the child's own typed attempt/answer** (bounded, e.g. ≤500 chars). **No nickname, age band, child id, or parent information is sent.**
- **Documented caveat:** because a child's free-text answer is passed to the model, that text *could* incidentally contain personal information the child chooses to type. It is bounded and never solicited, but this data flow to a third-party sub-processor (Anthropic) must be covered by a data-processing agreement and disclosed in the privacy policy. See [Areas requiring professional review](#areas-requiring-professional-legal--privacy-review).

### 8. Logging
- **Structured JSON logs** (`lib/logger.ts`): one request line (method, path, status, duration, request id) and, for 5xx, the error message + stack **server-side only**. The client always gets a generic message.
- **No sensitive data logged:** no request bodies, no secrets, no nicknames. Paths may contain a child cuid, which is pseudonymous, not personal data. Logging is silent under `NODE_ENV=test`.

### 9. Cookies
- The session cookie is managed by **Better Auth**, which applies `HttpOnly`, a `SameSite` policy, and `Secure` in production by default. There is no custom cookie handling in app code.
- **Action for production:** confirm `Secure` + an appropriate `SameSite` value for the **cross-origin** deployment (web and API on different origins) so the session cookie is sent correctly and safely. This is a deployment/config verification, not a code change.

### 10. Local storage
- The browser stores exactly **one** value: `techquest.activeChildId`, an opaque child cuid used to remember which learner is active — `apps/web/src/context/ChildContext.tsx`. **No PII and no tokens** are stored; reads/writes are wrapped in `try/catch` for private-mode safety.

### 11. Environment variables
- All config is **validated at startup** (`lib/env.ts`); invalid config fails fast. Secrets (`BETTER_AUTH_SECRET`, `ANTHROPIC_API_KEY`, DB URLs) are **server-side only**.
- `.env` files are **gitignored**; `.env.example` files contain placeholders and guidance only. A secret scan of tracked files found **no committed secrets**. Production refuses to start with the dev-default auth secret.

### 12. Third-party integrations
| Vendor | Role | Data it can see |
|---|---|---|
| **Neon** | PostgreSQL host | All stored data (minimal child profiles, parent accounts, progress) |
| **Anthropic** | LLM provider | Mission text + the child's bounded answer text (no identifiers) |
| **PostHog** | Product analytics | Pseudonymous events (no names/emails/DOB) |
| **Better Auth** | Auth library (self-hosted) | Runs in our process against our DB; not an external data recipient |

Each external processor must be enumerated in the privacy policy and covered by a data-processing agreement. See below.

---

## Areas requiring professional legal / privacy review

The controls above are **engineering measures**. The following require qualified legal/privacy counsel and are **out of scope for this repository** — TechQuest does **not** assert compliance with any of them:

- **Children's privacy law:** COPPA (US), GDPR / GDPR-K (EU), the UK Age Appropriate Design Code, and equivalents elsewhere — including **verifiable parental consent**, lawful basis, a published **privacy policy**, and **data-subject / deletion rights** workflows.
- **Data retention & deletion:** define and document retention periods, deletion SLAs, and backup handling (not currently specified in code).
- **Sub-processor agreements & data transfers:** DPAs with Neon, Anthropic, and PostHog, plus international data-transfer mechanisms (these vendors are US-hosted).
- **AI data flow:** whether passing a child's free-text answers to an LLM sub-processor is acceptable under the chosen legal basis, and the vendors' own training/retention terms for that text.
- **Cookie / consent obligations** per jurisdiction.
- **Operational security not visible in code:** encryption-at-rest guarantees, key management, backups, incident-response plan, and independent penetration testing.

---

## How this was verified

Each control was checked by reading the referenced source files and by running the automated test suite (authorization/ownership, validation, AI fallback/bounds, analytics PII-stripping) plus targeted live checks against the database. This is a point-in-time review of the code as of the date above; re-review after any change to authentication, authorization, the AI boundary, analytics, or the data model.

To report a vulnerability, see [`/SECURITY.md`](../SECURITY.md).
