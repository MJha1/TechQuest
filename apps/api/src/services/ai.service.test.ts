import { describe, it, expect, vi, afterEach } from "vitest";
import type { HintRequestInput } from "@techquest/shared";
import type { AICompletionParams, AIProvider } from "../ai/provider.js";
import { generateHint } from "./ai.service.js";
import { env } from "../lib/env.js";

const INPUT: HintRequestInput = {
  missionContext: "How Does AI Learn?",
  learningObjective: "AI learns patterns from examples to make predictions",
  question: "Which helps the AI learn best?",
  attempt: "one photo",
};

function mockProvider(complete: (p: AICompletionParams) => Promise<string>): AIProvider {
  return { name: "mock", available: true, complete: vi.fn(complete) };
}

afterEach(() => vi.useRealTimers());

describe("generateHint", () => {
  it("returns the model's hint on success", async () => {
    const provider = mockProvider(async () => "Think about how many examples help you spot a pattern.");
    const res = await generateHint(provider, INPUT);
    expect(res).toEqual({
      hint: "Think about how many examples help you spot a pattern.",
      source: "ai",
    });
  });

  it("instructs the model NOT to give the answer", async () => {
    let captured: AICompletionParams | undefined;
    const provider = mockProvider(async (p) => {
      captured = p;
      return "Look for what the examples have in common.";
    });
    await generateHint(provider, INPUT);
    expect(captured!.system.toLowerCase()).toMatch(/never give|do not give|without giving/);
    expect(captured!.maxOutputTokens).toBeGreaterThan(0);
    expect(captured!.signal).toBeInstanceOf(AbortSignal);
  });

  it("truncates an over-long response to the max length", async () => {
    const long = "This is a very wordy hint. ".repeat(40); // ~1080 chars
    const provider = mockProvider(async () => long);
    const res = await generateHint(provider, INPUT);
    expect(res.source).toBe("ai");
    expect(res.hint.length).toBeLessThanOrEqual(240);
  });

  it("falls back when the model returns an empty string", async () => {
    const provider = mockProvider(async () => "   ");
    const res = await generateHint(provider, INPUT);
    expect(res.source).toBe("fallback");
    expect(res.hint.length).toBeGreaterThan(0);
  });

  it("falls back (never throws) when the provider errors", async () => {
    const provider = mockProvider(async () => {
      throw new Error("provider exploded");
    });
    const res = await generateHint(provider, INPUT);
    expect(res.source).toBe("fallback");
  });

  it("falls back when the provider exceeds the timeout", async () => {
    vi.useFakeTimers();
    // Provider only settles when its abort signal fires.
    const provider = mockProvider(
      (p) =>
        new Promise((_resolve, reject) => {
          p.signal?.addEventListener("abort", () => reject(new Error("aborted")));
        }),
    );
    const promise = generateHint(provider, INPUT);
    await vi.advanceTimersByTimeAsync(env.AI_HINT_TIMEOUT_MS + 50);
    const res = await promise;
    expect(res.source).toBe("fallback");
  });
});
