import { describe, it, expect } from "vitest";
import type { AgeBand, Interest } from "@techquest/shared";
import {
  recommend,
  MASTERY_ACCURACY,
  type MissionPerformance,
  type RecommendationContext,
} from "./recommendation.js";

/**
 * Unit tests for the deterministic recommendation engine. These exercise the
 * pure rule logic directly — no database — so each rule and its priority is
 * pinned down explicitly.
 */

// A tiny mission catalog covering the concept-keyword branches used for picking
// a practice activity.
function catalog(): MissionPerformance[] {
  return [
    mission({ id: "m1", slug: "how-ai-learns", title: "How Does AI Learn?", concept: "Examples → Patterns → Prediction", order: 1 }),
    mission({ id: "m2", slug: "how-youtube-knows", title: "How YouTube Knows", concept: "Recommendations", order: 2 }),
    mission({ id: "m3", slug: "can-ai-be-wrong", title: "Can AI Be Wrong?", concept: "AI limitations and verification", order: 3 }),
    mission({ id: "m4", slug: "build-your-first-ai-idea", title: "Build Your First AI Idea", concept: "Problem → User → Input → AI → Output", order: 6 }),
  ];
}

function mission(over: Partial<MissionPerformance> & Pick<MissionPerformance, "id" | "slug" | "title" | "concept" | "order">): MissionPerformance {
  return {
    estimatedMinutes: 8,
    status: "NOT_STARTED",
    answeredGraded: 0,
    correctGraded: 0,
    ...over,
  };
}

function ctx(over: Partial<RecommendationContext> = {}): RecommendationContext {
  return { ageBand: "AGE_10_11", interests: [], missions: catalog(), ...over };
}

describe("recommendation engine — first mission", () => {
  it("recommends the first mission for a brand-new child", () => {
    const rec = recommend(ctx());
    expect(rec.kind).toBe("first_mission");
    expect(rec.mission?.id).toBe("m1");
    expect(rec.reason).toMatch(/first mission/i);
  });

  it("is deterministic (same input → same output)", () => {
    const a = recommend(ctx());
    const b = recommend(ctx());
    expect(a).toEqual(b);
  });

  it("sorts by mission order regardless of input order", () => {
    const shuffled = [...catalog()].reverse();
    const rec = recommend(ctx({ missions: shuffled }));
    expect(rec.mission?.id).toBe("m1");
  });
});

describe("recommendation engine — completion → next mission", () => {
  it("recommends the next unfinished mission after a completion", () => {
    const missions = catalog();
    missions[0] = { ...missions[0]!, status: "COMPLETED", answeredGraded: 4, correctGraded: 4 };
    const rec = recommend(ctx({ missions }));
    expect(rec.kind).toBe("next_mission");
    expect(rec.mission?.id).toBe("m2");
    expect(rec.reason).toContain("How Does AI Learn?"); // names the finished mission
  });

  it("resumes an in-progress mission (once earlier ones are done well)", () => {
    const missions = catalog();
    missions[0] = { ...missions[0]!, status: "COMPLETED", answeredGraded: 2, correctGraded: 2 };
    missions[1] = { ...missions[1]!, status: "IN_PROGRESS", answeredGraded: 1, correctGraded: 1 };
    const rec = recommend(ctx({ missions }));
    expect(rec.kind).toBe("next_mission");
    expect(rec.mission?.id).toBe("m2");
    expect(rec.reason).toMatch(/pick up/i);
  });
});

describe("recommendation engine — struggle → practice concept", () => {
  it("recommends practicing the concept a child struggled with", () => {
    const missions = catalog();
    // Answered 4 graded steps, only 1 correct → 25% < 70% threshold.
    missions[0] = { ...missions[0]!, status: "IN_PROGRESS", answeredGraded: 4, correctGraded: 1 };
    const rec = recommend(ctx({ missions }));
    expect(rec.kind).toBe("practice_concept");
    expect(rec.concept).toBe("Examples → Patterns → Prediction");
    expect(rec.activity?.key).toBe("another_example");
    expect(rec.activity?.concept).toBe("Examples → Patterns → Prediction");
    expect(rec.mission?.id).toBe("m1"); // the struggled mission, for replay
  });

  it("prioritizes struggle over moving on to the next mission", () => {
    const missions = catalog();
    missions[0] = { ...missions[0]!, status: "COMPLETED", answeredGraded: 4, correctGraded: 4 };
    // Completed m2 but poorly (2/4 = 50%).
    missions[1] = { ...missions[1]!, status: "COMPLETED", answeredGraded: 4, correctGraded: 2 };
    const rec = recommend(ctx({ missions }));
    expect(rec.kind).toBe("practice_concept");
    expect(rec.concept).toBe("Recommendations");
  });

  it("shores up the EARLIEST weak concept first", () => {
    const missions = catalog();
    missions[1] = { ...missions[1]!, status: "COMPLETED", answeredGraded: 3, correctGraded: 1 }; // weak, order 2
    missions[2] = { ...missions[2]!, status: "COMPLETED", answeredGraded: 3, correctGraded: 1 }; // weak, order 3
    const rec = recommend(ctx({ missions }));
    expect(rec.concept).toBe("Recommendations"); // order 2 wins
  });

  it("does not flag a concept at exactly the mastery threshold", () => {
    const missions = catalog();
    // 7/10 = 0.7 == threshold → NOT struggled (strictly less than).
    missions[0] = { ...missions[0]!, status: "COMPLETED", answeredGraded: 10, correctGraded: 7 };
    const rec = recommend(ctx({ missions }));
    expect(rec.kind).toBe("next_mission");
    expect(MASTERY_ACCURACY).toBe(0.7);
  });

  it("picks a verification activity for a verification concept", () => {
    const missions = catalog();
    missions[2] = { ...missions[2]!, status: "IN_PROGRESS", answeredGraded: 2, correctGraded: 0 };
    const rec = recommend(ctx({ missions }));
    expect(rec.activity?.key).toBe("should_verify");
  });

  it("picks a prompt-improvement activity for a design concept", () => {
    const missions = catalog();
    missions[3] = { ...missions[3]!, status: "IN_PROGRESS", answeredGraded: 2, correctGraded: 0 };
    const rec = recommend(ctx({ missions }));
    expect(rec.activity?.key).toBe("improve_prompt");
  });
});

describe("recommendation engine — all complete", () => {
  it("celebrates when every mission is finished and mastered", () => {
    const missions = catalog().map((m) => ({
      ...m,
      status: "COMPLETED" as const,
      answeredGraded: 4,
      correctGraded: 4,
    }));
    const rec = recommend(ctx({ missions }));
    expect(rec.kind).toBe("all_complete");
    expect(rec.mission).toBeNull();
    expect(rec.activity).toBeNull();
  });
});

describe("recommendation engine — interest preference", () => {
  it("adds no example when the child has no interests", () => {
    const rec = recommend(ctx({ interests: [] }));
    expect(rec.interest).toBeNull();
    expect(rec.example).toBeNull();
  });

  it("flavors the example with a selected interest", () => {
    const rec = recommend(ctx({ interests: ["SPORTS"] }));
    expect(rec.interest).toBe("SPORTS");
    expect(rec.example).toMatch(/sports/i);
  });

  it("picks the first interest in canonical order when several are selected", () => {
    // SCIENCE comes before SPORTS in the canonical order.
    const rec = recommend(ctx({ interests: ["SPORTS", "SCIENCE"] }));
    expect(rec.interest).toBe("SCIENCE");
  });

  it("uses a simpler register for younger children", () => {
    const young = recommend(ctx({ ageBand: "AGE_8_9", interests: ["GAMES"] }));
    const older = recommend(ctx({ ageBand: "AGE_12", interests: ["GAMES"] }));
    expect(young.example).not.toBe(older.example);
    expect(young.example).toBeTruthy();
    expect(older.example).toBeTruthy();
  });

  it("keeps interest as flavor only — it never changes the chosen mission", () => {
    const withInterest = recommend(ctx({ interests: ["ART"] }));
    const without = recommend(ctx({ interests: [] }));
    expect(withInterest.kind).toBe(without.kind);
    expect(withInterest.mission?.id).toBe(without.mission?.id);
  });
});

// Type sanity: the exported context/perf types accept the enums we expect.
describe("types", () => {
  it("accepts every age band and interest", () => {
    const bands: AgeBand[] = ["AGE_8_9", "AGE_10_11", "AGE_12"];
    const interests: Interest[] = ["GAMES", "SCIENCE", "STORIES", "SPORTS", "ART", "BUILDING"];
    for (const ageBand of bands) {
      const rec = recommend(ctx({ ageBand, interests }));
      expect(rec.reason).toBeTruthy();
    }
    expect(interests).toHaveLength(6);
  });
});
