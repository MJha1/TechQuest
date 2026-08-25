import posthog from "posthog-js";
import type { AgeBand } from "@techquest/shared";

/**
 * Central, typed analytics abstraction (PostHog).
 *
 * The rest of the app never touches PostHog directly — it calls `track(event,
 * props)` with a compile-time-checked event name and property shape. This keeps
 * the event catalog in one place and makes privacy enforceable:
 *
 *  - No child PII is ever sent. We never pass nicknames, full names, emails, or
 *    avatars. Children are referenced only by a pseudonymous id (`childRef`),
 *    and parents by their pseudonymous account id (`userRef`) — both opaque cuids.
 *  - Age is sent only as a coarse band (AGE_8_9 / AGE_10_11 / AGE_12), never a birth date.
 *  - Autocapture, pageview capture, and session recording are disabled so no
 *    DOM text (which could contain a nickname) is ever collected.
 *  - `sanitize_properties` strips any accidentally-included PII key as a backstop.
 *
 * Analytics is a no-op unless `VITE_POSTHOG_KEY` is configured, so dev and tests
 * never send events.
 */

// ── Event catalog ─────────────────────────────────────────────────────────────

export type AnalyticsCategory =
  | "Acquisition"
  | "Activation"
  | "Engagement"
  | "Retention"
  | "Learning"
  | "Parent Value";

/** Property shape for each event. Only pseudonymous / non-identifying data. */
export interface EventPropertyMap {
  // Acquisition
  landing_viewed: Record<string, never>;
  cta_clicked: { cta: string };
  signup_started: Record<string, never>;
  signup_completed: { userRef: string };
  // Activation
  child_created: { childRef: string; ageBand: AgeBand; interestCount: number };
  // Retention
  child_home_viewed: { childRef: string };
  // Engagement
  mission_viewed: { missionSlug: string };
  mission_started: { childRef: string; missionSlug: string };
  question_answered: {
    childRef: string;
    missionSlug: string;
    stepType: string;
    correct: boolean | null;
  };
  hint_requested: { childRef: string; missionSlug: string; stepType: string };
  challenge_started: { childRef: string; missionSlug: string };
  challenge_completed: { childRef: string; missionSlug: string };
  // Learning
  mission_completed: { childRef: string; missionSlug: string; score: number };
  badge_earned: { childRef: string; badgeSlug: string };
  // Parent Value
  parent_dashboard_viewed: Record<string, never>;
  progress_viewed: Record<string, never>;
  feedback_submitted: { rating: string; hasComment: boolean };
}

export type AnalyticsEvent = keyof EventPropertyMap;

/** Each event's product-analytics category. */
export const EVENT_CATEGORY: Record<AnalyticsEvent, AnalyticsCategory> = {
  landing_viewed: "Acquisition",
  cta_clicked: "Acquisition",
  signup_started: "Acquisition",
  signup_completed: "Acquisition",
  child_created: "Activation",
  child_home_viewed: "Retention",
  mission_viewed: "Engagement",
  mission_started: "Engagement",
  question_answered: "Engagement",
  hint_requested: "Engagement",
  challenge_started: "Engagement",
  challenge_completed: "Engagement",
  mission_completed: "Learning",
  badge_earned: "Learning",
  parent_dashboard_viewed: "Parent Value",
  progress_viewed: "Parent Value",
  feedback_submitted: "Parent Value",
};

// ── Runtime ──────────────────────────────────────────────────────────────────

let enabled = false;

/** Keys we refuse to send even if a caller accidentally includes them. */
const PII_KEYS = new Set(["nickname", "name", "email", "fullName", "avatar", "firstName", "lastName"]);

function stripPii(props: Record<string, unknown>): Record<string, unknown> {
  const clean: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(props)) {
    if (!PII_KEYS.has(k)) clean[k] = v;
  }
  return clean;
}

/** Initialize PostHog once, at app startup. No-op without a configured key. */
export function initAnalytics(): void {
  if (enabled) return;
  const key = import.meta.env.VITE_POSTHOG_KEY as string | undefined;
  if (!key) return;

  posthog.init(key, {
    api_host: (import.meta.env.VITE_POSTHOG_HOST as string) ?? "https://us.i.posthog.com",
    autocapture: false, // never capture DOM text (could contain a nickname)
    capture_pageview: false, // we send explicit, typed events instead
    disable_session_recording: true,
    person_profiles: "identified_only",
    sanitize_properties: (props) => stripPii(props ?? {}),
  });
  enabled = true;
}

/** Identify the parent by their pseudonymous account id (never email/name). */
export function identifyParent(userRef: string): void {
  if (enabled) posthog.identify(userRef);
}

/** Clear identity (e.g. on logout). */
export function resetAnalytics(): void {
  if (enabled) posthog.reset();
}

type NoProps = Record<string, never>;
type TrackArgs<E extends AnalyticsEvent> = EventPropertyMap[E] extends NoProps
  ? [event: E]
  : [event: E, props: EventPropertyMap[E]];

/**
 * Track a typed event. The event name fixes the allowed property shape, so it is
 * impossible to attach an undocumented (or PII) field at a call site.
 */
export function track<E extends AnalyticsEvent>(...args: TrackArgs<E>): void {
  const [event, props] = args as [E, EventPropertyMap[E] | undefined];
  if (!enabled) return;
  posthog.capture(event, {
    ...stripPii((props ?? {}) as Record<string, unknown>),
    category: EVENT_CATEGORY[event],
  });
}
