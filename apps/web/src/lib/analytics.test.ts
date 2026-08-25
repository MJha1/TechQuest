import { describe, it, expect, vi, afterAll } from "vitest";
import posthog from "posthog-js";
import {
  track,
  initAnalytics,
  identifyParent,
  EVENT_CATEGORY,
  type AnalyticsEvent,
} from "./analytics";

vi.mock("posthog-js", () => ({
  default: { init: vi.fn(), capture: vi.fn(), identify: vi.fn(), reset: vi.fn() },
}));

const init = posthog.init as unknown as ReturnType<typeof vi.fn>;
const capture = posthog.capture as unknown as ReturnType<typeof vi.fn>;
const identify = posthog.identify as unknown as ReturnType<typeof vi.fn>;

afterAll(() => vi.unstubAllEnvs());

describe("event catalog", () => {
  it("categorizes all 17 tracked events", () => {
    const events = Object.keys(EVENT_CATEGORY) as AnalyticsEvent[];
    expect(events).toHaveLength(17);
    const categories = new Set(Object.values(EVENT_CATEGORY));
    expect(categories).toEqual(
      new Set(["Acquisition", "Activation", "Engagement", "Retention", "Learning", "Parent Value"]),
    );
    expect(EVENT_CATEGORY.landing_viewed).toBe("Acquisition");
    expect(EVENT_CATEGORY.child_created).toBe("Activation");
    expect(EVENT_CATEGORY.mission_completed).toBe("Learning");
    expect(EVENT_CATEGORY.parent_dashboard_viewed).toBe("Parent Value");
  });
});

describe("analytics runtime", () => {
  // These run in order; `enabled` is module state.
  it("is a no-op before initialization", () => {
    track("landing_viewed");
    expect(capture).not.toHaveBeenCalled();
  });

  it("initializes PostHog with privacy-safe options", () => {
    vi.stubEnv("VITE_POSTHOG_KEY", "phc_test");
    initAnalytics();
    expect(init).toHaveBeenCalledWith(
      "phc_test",
      expect.objectContaining({
        autocapture: false,
        capture_pageview: false,
        disable_session_recording: true,
      }),
    );
  });

  it("captures typed events tagged with their category", () => {
    capture.mockClear();
    track("mission_completed", { childRef: "child_x", missionSlug: "how-ai-learns", score: 100 });
    expect(capture).toHaveBeenCalledWith(
      "mission_completed",
      expect.objectContaining({
        childRef: "child_x",
        missionSlug: "how-ai-learns",
        score: 100,
        category: "Learning",
      }),
    );
  });

  it("never sends PII, even if a caller includes it", () => {
    capture.mockClear();
    // @ts-expect-error — nickname is not a valid property; also stripped at runtime.
    track("child_created", { childRef: "child_x", ageBand: "AGE_8_9", nickname: "RealName" });
    const props = capture.mock.calls[0]![1] as Record<string, unknown>;
    expect(props).not.toHaveProperty("nickname");
    expect(props.childRef).toBe("child_x");
  });

  it("identifies the parent pseudonymously", () => {
    identifyParent("user_abc");
    expect(identify).toHaveBeenCalledWith("user_abc");
  });
});
