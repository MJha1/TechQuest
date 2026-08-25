import { describe, it, expect, vi } from "vitest";
import type { AICompletionParams, AIProvider } from "./provider.js";
import { AI_ACTIVITIES, listActivities, runActivity } from "./activities.js";

function mockProvider(complete: (p: AICompletionParams) => Promise<string>): AIProvider {
  return { name: "mock", available: true, complete: vi.fn(complete) };
}

const EXPECTED_KEYS = ["another_example", "compare_answers", "should_verify", "improve_prompt"];

describe("activity catalog", () => {
  it("exposes exactly the four controlled activities", () => {
    const list = listActivities();
    expect(list.map((a) => a.key).sort()).toEqual([...EXPECTED_KEYS].sort());
  });

  it("every activity has the six required pieces", () => {
    for (const key of EXPECTED_KEYS) {
      const a = AI_ACTIVITIES[key]!;
      expect(a.objective.length).toBeGreaterThan(0); // learning objective
      expect(a.inputSchema).toBeDefined(); // controlled input
      expect(typeof a.buildPrompt).toBe("function"); // prompt template
      expect(a.maxOutputChars).toBeGreaterThan(0); // max output length
      expect(a.fallback.length).toBeGreaterThan(0); // fallback
      expect(a.system).toContain("learning"); // controlled, single-purpose system
    }
  });

  it("has no free-form chat / message input on any activity (not open chat)", () => {
    for (const a of listActivities()) {
      for (const field of a.inputs) {
        expect(field.name).not.toMatch(/message|chat|prompt-free|anything/i);
        expect(field.maxLength).toBeLessThanOrEqual(400); // bounded input
      }
    }
  });
});

describe("runActivity", () => {
  it("builds a prompt from the controlled input and returns the model text", async () => {
    let captured: AICompletionParams | undefined;
    const provider = mockProvider(async (p) => {
      captured = p;
      return "A soccer ball and a basketball are both round.";
    });
    const res = await runActivity(provider, AI_ACTIVITIES.another_example!, { concept: "round things" });

    expect(res).toEqual({
      activity: "another_example",
      text: "A soccer ball and a basketball are both round.",
      source: "ai",
    });
    expect(captured!.prompt).toContain("round things");
  });

  it("truncates an over-long response to the activity's max length", async () => {
    const long = "This example is quite wordy and keeps going. ".repeat(20);
    const provider = mockProvider(async () => long);
    const res = await runActivity(provider, AI_ACTIVITIES.another_example!, { concept: "x" });
    expect(res.source).toBe("ai");
    expect(res.text.length).toBeLessThanOrEqual(AI_ACTIVITIES.another_example!.maxOutputChars);
  });

  it("falls back (never throws) when the provider fails", async () => {
    const provider = mockProvider(async () => {
      throw new Error("boom");
    });
    const res = await runActivity(provider, AI_ACTIVITIES.compare_answers!, {
      question: "q",
      answerA: "a",
      answerB: "b",
    });
    expect(res.source).toBe("fallback");
    expect(res.text.length).toBeGreaterThan(0);
  });

  it("keeps 'compare' from just declaring a winner (guardrail in the prompt)", () => {
    const a = AI_ACTIVITIES.compare_answers!;
    expect(a.system.toLowerCase()).toMatch(/do not just declare a winner|help them think/);
  });

  it("keeps 'improve prompt' from doing the task itself", () => {
    const a = AI_ACTIVITIES.improve_prompt!;
    expect(a.system.toLowerCase()).toMatch(/only give the improved instruction|do not answer/);
  });
});
