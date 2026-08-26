# TechQuest — MVP Feature List

TechQuest is an interactive technology & AI learning platform for children aged 8–12.
This is a consolidated list of the features shipped in the current MVP.

_Last updated: 2026-08-26. Live in production on Railway._

## 👤 Accounts & Profiles

- **Parent-only authentication** (Better Auth — email + password, session cookies)
  with **sign-out** from the parent area.
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

- **Parent dashboard** — an overview across all children (level, XP, streak,
  missions completed, learning time, concepts, recent activity, what they
  learned, and at-home conversation prompts).
- **Progress report** — a per-learner view of activity, XP, level (with an
  XP-to-next bar), day streak, missions completed, and a recent-activity feed.
- **Parent feedback** submission.
- **Two-way navigation** between the parent and child spaces: a shield-marked
  **"Exit to parent"** control in the child top bar, and a **"Back to <child>"**
  link (with the child's avatar) on the dashboard.

## ✨ Engagement & Motion

A consistent, playful, reduced-motion-safe visual language across the kid-facing
journey — designed to make learning AI feel like an adventure:

- **Missions catalog**: each mission has its own **character emoji** and
  theme-aware color; characters bob at rest and wiggle + sparkle on hover; the
  recommended next mission wears a pulsing **"✦ Start here"** ring; completed
  missions celebrate with a 🎉 pop.
- **In-mission rewards**: a **confetti burst** and a floating **"+N XP"** on
  correct answers; the chosen answer turns green (or gently shakes when wrong);
  each step **rises in** as the child advances.
- **Mission complete**: confetti and an animated **level-progress bar** toward
  the next level, plus badge-unlock pops.
- **Child home**: mission **characters** as hero visuals, staggered card
  entrances, and popped-in badges.
- **Onboarding & auth**: a bobbing robot mascot and floating decor on the
  signup / login / create-child shell, plus a **live avatar preview** and
  delightful, tactile pickers when creating a learner.

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
- **Deployed on Railway** (multi-stage Docker + PostgreSQL, pre-deploy migrations,
  health checks); unit tests + **Playwright** end-to-end tests.
