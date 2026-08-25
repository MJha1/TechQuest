# TechQuest Analytics

TechQuest uses **PostHog** for product analytics, accessed only through a central,
typed abstraction: [`apps/web/src/lib/analytics.ts`](../apps/web/src/lib/analytics.ts).
Application code never calls PostHog directly — it calls `track(event, props)` with
a compile-time-checked event name and property shape.

## Privacy principles

Children are learners, not account holders, so we are deliberately careful:

- **No child PII is ever sent.** We never transmit nicknames, full names, emails,
  avatars, or birth dates.
- **Pseudonymous identifiers only.** A child is referenced by an opaque id
  (`childRef`), a parent by their opaque account id (`userRef`). Both are cuids
  with no personal meaning. The parent is `identify()`-ed by `userRef` only.
- **Age is coarse.** Only the age *band* (`AGE_8_9` / `AGE_10_12`) is sent.
- **No incidental capture.** Autocapture, automatic pageviews, and session
  recording are all **disabled**, so no on-screen text (which could contain a
  nickname) is ever collected. Events are explicit and typed.
- **Backstop.** `sanitize_properties` strips known PII keys (`nickname`, `name`,
  `email`, `avatar`, …) from every payload, even if a caller adds one by mistake.
- **Opt-out by default in non-prod.** Analytics is a no-op unless
  `VITE_POSTHOG_KEY` is configured, so dev and tests send nothing.

Every event automatically carries a `category` property (below).

## Events

### Acquisition

| Event | Trigger | Properties | Purpose |
|---|---|---|---|
| `landing_viewed` | Landing page mounts | — | Top-of-funnel traffic. |
| `cta_clicked` | A landing-page CTA is clicked | `cta` (which button) | CTA effectiveness across the page. |
| `signup_started` | Signup page mounts | — | Signup funnel entry; measure drop-off before submit. |
| `signup_completed` | Parent account created successfully | `userRef` | Conversion to account; anchors the acquisition funnel. |

### Activation

| Event | Trigger | Properties | Purpose |
|---|---|---|---|
| `child_created` | A learner profile is created | `childRef`, `ageBand` | First activation step; age mix of learners. |

### Retention

| Event | Trigger | Properties | Purpose |
|---|---|---|---|
| `child_home_viewed` | Child home dashboard mounts | `childRef` | Return visits / habit formation (first view is also the activation signal). |

### Engagement

| Event | Trigger | Properties | Purpose |
|---|---|---|---|
| `mission_viewed` | A mission is opened from the list | `missionSlug` | Interest per mission; viewed→started funnel. |
| `mission_started` | The mission player starts/resumes a mission | `childRef`, `missionSlug` | Depth of engagement; which missions get played. |
| `question_answered` | A graded/open step is answered | `childRef`, `missionSlug`, `stepType`, `correct` | Step-level interaction and difficulty (`correct` is `true`/`false`/`null`). |
| `hint_requested` | The child reveals a hint | `childRef`, `missionSlug`, `stepType` | Where learners get stuck. |
| `challenge_started` | A challenge step becomes current | `childRef`, `missionSlug` | Challenge engagement funnel. |
| `challenge_completed` | A challenge step is submitted | `childRef`, `missionSlug` | Challenge completion vs. start. |

### Learning

| Event | Trigger | Properties | Purpose |
|---|---|---|---|
| `mission_completed` | A mission is finished (first time) | `childRef`, `missionSlug`, `score` | Core learning outcome; completion rate + score distribution. |
| `badge_earned` | A badge is newly awarded on completion | `childRef`, `badgeSlug` | Milestone achievement; motivator effectiveness. |

### Parent Value

| Event | Trigger | Properties | Purpose |
|---|---|---|---|
| `parent_dashboard_viewed` | Parent dashboard mounts | — | Parent engagement with progress reporting. |
| `progress_viewed` | Parent progress page mounts | — | Interest in detailed progress. |
| `feedback_submitted` | Parent submits product feedback | `rating`, `hasComment` | Parent satisfaction (no comment text is sent — only the rating and whether a comment was left). |

## Where events fire

| Event | Source |
|---|---|
| `landing_viewed` | `pages/LandingPage.tsx` |
| `signup_started`, `signup_completed` | `pages/SignupPage.tsx` |
| `child_created` | `pages/CreateChildPage.tsx` |
| `child_home_viewed` | `pages/ChildHomePage.tsx` |
| `mission_viewed` | `pages/MissionsPage.tsx` |
| `mission_started`, `question_answered`, `hint_requested`, `challenge_started`, `challenge_completed` | `pages/MissionDetailPage.tsx` (+ `components/mission/MissionSidePanel.tsx` for hints) |
| `mission_completed`, `badge_earned` | `pages/MissionCompletePage.tsx` |
| `parent_dashboard_viewed` | `pages/ParentDashboardPage.tsx` |
| `progress_viewed` | `pages/ParentProgressPage.tsx` |
| Parent identify (`userRef`) | `components/RequireParent.tsx` |

## Configuration

Set in the web app's environment (see `apps/web/.env.example`):

```
VITE_POSTHOG_KEY="phc_..."                 # empty disables analytics
VITE_POSTHOG_HOST="https://us.i.posthog.com"
```

## Adding an event

1. Add the event and its property type to `EventPropertyMap` in `analytics.ts`.
2. Add its category to `EVENT_CATEGORY`.
3. Call `track("your_event", { ... })` at the trigger site.
4. Document it in the table above.

The property type must contain only pseudonymous / non-identifying fields.
