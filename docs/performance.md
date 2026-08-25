# TechQuest — Performance Notes

**Last reviewed:** 2026-08-26. Primary target: a 1440×900 desktop.

This records the performance audit, the changes made (each with a measured or clear benefit), and — importantly — what was **deliberately not** optimized, to avoid premature complexity.

---

## Frontend

### Bundle size — code-split + lazy analytics (biggest win)

The app shipped as a **single 802 kB (250 kB gzip)** JS bundle: every page was eagerly imported, so a first-time visitor to the public landing page downloaded the entire authenticated app plus the PostHog SDK.

Two changes:

1. **Route code-splitting** (`apps/web/src/routes.tsx`) — every page except the public landing page is `React.lazy()`-loaded behind a `Suspense` fallback. The landing page stays eager for an instant first paint (it's the marketing entry); the mission player, parent dashboard, onboarding, etc. now load on navigation as their own chunks.
2. **Lazy analytics** (`apps/web/src/lib/analytics.ts`) — PostHog (~160 kB) is loaded via **dynamic `import()`** inside `initAnalytics()`, only when `VITE_POSTHOG_KEY` is set. It is non-critical for first paint; events fired before it loads are queued on the load promise, so nothing is dropped.

| | Initial JS | gzip |
|---|---|---|
| Before | 802 kB | 250 kB |
| After route-split | 702 kB | 223 kB |
| After lazy analytics | **437 kB** | **135 kB** |

Net: **~46% smaller initial download**, and the entry no longer trips Vite's 500 kB warning. Pages and the analytics SDK are cached separately, so navigation and repeat visits benefit too.

### Rendering / unnecessary re-renders

- `ChildContext` already memoizes its context value (`useMemo`) and callbacks (`useCallback`), so consumers don't re-render on unrelated state changes — verified, left as-is.
- No global state library; state is local or in the single memoized context. No re-render hot spots were found worth restructuring. **Not changed** (no clear benefit).

### API calls

- Child home fetches missions and badges **in parallel** (`Promise.all`) rather than sequentially — already correct.
- The child list is fetched once by `ChildProvider` and reused (membership there is also the ownership check). No redundant re-fetching. **Not changed.**

### Images

- There are **no raster images**. Avatars are emoji, icons are tree-shaken inline SVG (lucide), and the one webfont (Fredoka) loads with `display=swap`. Nothing to optimize.

### Lazy loading

- Routes and the analytics SDK are now lazy (above). No below-the-fold imagery to defer.

---

## Backend

### Database queries & N+1

Two **child-facing hot-path N+1s** were found and fixed (both in `apps/api/src/services/mission.service.ts`):

- **`listChildMissions`** (child home + mission list) looped over missions issuing 2 queries each (~13 sequential queries). Rewritten to **3 bulk, parallel queries** that are grouped in memory. On the high-latency dev DB this cut the endpoint from ~15 s to ~9 s; the win is the query *count*, which dominates at any latency.
- **`ensureChildMission`** (mission start) inserted step rows **one-by-one** (~8 sequential `INSERT`s). Replaced with a single **`createMany`**. Besides being faster, one statement is more robust than a long insert sequence over a flaky connection.

**Deliberately NOT optimized** (would be premature — clear-benefit test not met):

- **`getParentDashboard`** loops per child (2 queries/child). A parent has a handful of children and this surface is loaded infrequently; at production query latency the difference is negligible. Documented here to revisit **if** a parent could ever have many children.
- **`evaluateBadges`** loops over eligible badges (**≤ 5**) with one lookup each, only on mission completion / streak change (rare). Not worth bulk-loading.

### Payload size

- Mission detail serves the mission plus its 6–10 steps with **answer keys stripped** (`sanitizeContent` removes `correct`, `solution`, `explanation`, etc.) — a few KB, and smaller than the raw seed content. No pagination needed at this scale.
- All responses use the compact `{ ok, data }` envelope. No over-fetching found.

### API response time

Measured against the shared **remote serverless (Neon) DB from a dev machine**, per-query latency is ~1–2 s (network RTT + serverless cold starts), so multi-query endpoints take several seconds *here*. This is an **environment artifact, not the code** — co-located with the DB these are sub-second. The audit therefore optimized query **count** (above), which is what we control, rather than chasing wall-clock numbers that don't reflect production.

---

## Mission flow

- **Initial load (`POST …/start`)** — was the `ensureChildMission` N+1; now one `createMany`. Correct and faster.
- **Step transitions** — advancing between steps is **pure client-side state** (`setIndex`); there is **no** network request per step, so transitions are instant. No change needed.
- **Answer submission (`POST …/answer`)** — grades server-side and records progress in a short, necessary sequence of dependent queries (read step → grade → upsert progress → award XP). Badge evaluation runs only when a streak actually advances. Left as-is: the queries are dependent (can't be parallelized) and the path is already minimal.

---

## Principles applied

- **Measure first.** Bundle numbers are from `vite build`; query counts from reading the services and live timing.
- **Only clear-benefit changes.** The bundle split and the two hot-path N+1 fixes each have a concrete, universal benefit. Low-N loops and infrequent surfaces were left alone on purpose.
- **No premature optimization.** No caching layers, no denormalization, no query-plan tuning were added — there's no evidence they're needed at current scale, and they would add complexity and failure modes.
