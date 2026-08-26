# TechQuest — MVP Feature List

TechQuest is an interactive technology & AI learning platform for children aged 8–12.
This is a consolidated list of the features shipped in the current MVP.

## 👤 Accounts & Profiles

- **Parent-only authentication** (Better Auth — email + password, session cookies).
- **Children are profiles, not accounts** — created and managed under a parent
  (COPPA / GDPR-K data minimization by design; no child sign-in exists).
- **Multiple child profiles per parent**, each storing only non-identifying data:
  nickname, coarse **age band** (8–9 / 10–11 / 12), a preset avatar, and
  **interests** (Games, Science, Stories, Sports, Art, Building). No real
  name/address/school/phone/location is ever collected.

## 📚 Learning Content — 6 Missions (44 steps)

Multi-step interactive lessons on AI/computing concepts:

1. **How Does AI Learn?** — Examples → Patterns → Prediction
2. **How Does YouTube Know?** — Recommendations
3. **Can AI Be Wrong?** — AI limitations & verification
4. **How Do Computers Follow Instructions?** — Algorithms
5. **Teach the Robot** — Data & rules
6. **Build Your First AI Idea**

Interactive step types: intro, multiple-choice, prediction, **drag-and-drop
ordering**, open challenge, reflection, and completion — emoji-rich and visual
(~7–9 minutes each).

## 🎯 Mission Engine

- Catalog + detail views; start → answer steps → complete.
- **Per-child progress tracking** (mission `LOCKED` / `IN_PROGRESS` / `COMPLETED`,
  per-step status, scores, timestamps).
- **Server-authoritative grading** — correctness, score, and XP are computed on
  the backend; the client can never inject a score.

## 🏆 Gamification

- **XP**: 10 per correct answer, 30 per challenge, 100 per mission; **levels**
  every 100 XP.
- **Daily streaks** (current + longest).
- **5 badges**: First Explorer, Pattern Detective, AI Explorer (3 missions),
  Builder, 3-Day Streak — with an earned + locked showcase.
- XP count-up, progress bars, and celebration animations.

## 🧭 Personalized Recommendations

- **Deterministic "what to do next" engine** (no ML): struggle → practice that
  concept → else next mission → else first mission → else all-done. Every result
  carries an **explainable reason**; interests flavor the examples and the age
  band sets the wording register.

## 🤖 AI-Assisted Learning (bounded & safe)

- Optional **AI hints** on mission steps.
- **4 controlled activities** (not a chatbot): *Another Example*,
  *Compare Answers*, *Should I Verify?*, *Improve a Prompt* — each with a fixed
  prompt template, strict input schema, output validation, a maximum output
  length, and a safe fallback.
- **No free chat, no memory, no tools/browsing/image generation, no personal
  advice.** Provider-abstracted (Anthropic when a key is configured; a safe
  null-provider fallback otherwise). Bounded AI output is audited with a safety
  verdict (Safe / Flagged / Blocked).

## 👪 Parent Features

- **Parent dashboard** (overview across children).
- **Per-child progress** view.
- **Parent feedback** submission.

## 🎨 UX / Frontend

- React SPA served **same-origin** by the API.
- **Light/dark theme** with a persistent toggle (no flash of wrong theme),
  token-driven design system (Inter + Plus Jakarta Sans).
- Visual-first landing page (mascot, a tappable sample mission), personalized for
  a signed-in parent.
- Reduced-motion-safe microinteractions; **code-split routes**;
  **stale-while-revalidate** client cache for instant revisits; a style-guide page.

## 🔒 Platform / Non-Functional

- **Security**: session auth, per-route authorization + **child-ownership guards**
  (Parent A can't reach Child B), Helmet security headers, CORS locked to
  configured origins (credentials enabled), `/api` rate limiting, request-size
  limits, strict **Zod** input validation, request IDs + structured logging, and
  **fail-fast environment validation** at startup.
- **Privacy-by-design** data minimization (non-identifying age bands & interests).
- **Learning-analytics events** (append-only): mission/step started & completed,
  XP awarded, level-up, badge earned, streak extended, AI feedback served.
- Optional **PostHog** product analytics (client-side, build-time).
- **Deployed on Railway** (multi-stage Docker + PostgreSQL, health checks);
  unit tests + **Playwright** end-to-end tests.
