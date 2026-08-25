import type { HintRequestInput, HintResult } from "@techquest/shared";
import { env } from "../lib/env.js";
import { logger } from "../lib/logger.js";
import type { AIProvider } from "../ai/provider.js";

/**
 * AI service — shared safeguards for every AI feature (hints + controlled
 * activities). These make the LLM safe to expose to children:
 *   - a timeout (abort a slow model call);
 *   - a maximum response length (validated + truncated);
 *   - output validation (non-empty, whitespace-normalized);
 *   - a safe fallback on any failure/timeout/empty/refusal;
 *   - error handling that never surfaces a raw model/provider error.
 * Every feature uses a fixed, single-purpose prompt — never open chat.
 */

const HINT_MAX_TOKENS = 150;
const HINT_MAX_CHARS = 240;

const FALLBACK_HINT =
  "Take another look at the examples and think about what they have in common. You're on the right track — give it a try!";

const HINT_SYSTEM = [
  "You are a kind, encouraging learning buddy for a child aged 8 to 12.",
  "Give exactly ONE short hint (one or two simple sentences) that gently nudges the child toward working out the answer THEMSELVES.",
  "Rules:",
  "- Never give, state, or spell out the answer.",
  "- Never do the task for them.",
  "- Use simple, friendly, positive words.",
  "- Keep it under 30 words.",
  "- Stay on the mission topic. Do not ask them to go to an adult or the internet.",
].join("\n");

/** Whitespace-normalize, reject empty, and cap length at a sentence boundary. */
export function normalizeAndCap(raw: string, maxChars: number): string | null {
  let text = raw.replace(/\s+/g, " ").trim();
  if (!text) return null;
  if (text.length > maxChars) {
    const capped = text.slice(0, maxChars);
    const lastStop = Math.max(capped.lastIndexOf(". "), capped.lastIndexOf("! "), capped.lastIndexOf("? "));
    text = lastStop > 60 ? capped.slice(0, lastStop + 1) : `${capped.trimEnd()}…`;
  }
  return text;
}

export interface RunTextParams {
  system: string;
  prompt: string;
  maxOutputTokens: number;
  /** Validate + shape the raw model output. Return null to trigger the fallback. */
  validate: (raw: string) => string | null;
  fallback: string;
}

/**
 * Run one bounded text generation with a timeout and a guaranteed fallback.
 * Always resolves (never throws) — the caller always gets usable text.
 */
export async function runAiText(
  provider: AIProvider,
  params: RunTextParams,
): Promise<{ text: string; source: "ai" | "fallback" }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), env.AI_HINT_TIMEOUT_MS);
  try {
    const raw = await provider.complete({
      system: params.system,
      prompt: params.prompt,
      maxOutputTokens: params.maxOutputTokens,
      signal: controller.signal,
    });
    const text = params.validate(raw);
    return text ? { text, source: "ai" } : { text: params.fallback, source: "fallback" };
  } catch (err) {
    // Logged server-side only; the child never sees the technical error.
    logger.warn("ai_call_failed", {
      provider: provider.name,
      error: err instanceof Error ? err.message : String(err),
    });
    return { text: params.fallback, source: "fallback" };
  } finally {
    clearTimeout(timer);
  }
}

// ── Hint ──────────────────────────────────────────────────────────────────────

function buildHintPrompt(input: HintRequestInput): string {
  const attempt = input.attempt?.trim() ? input.attempt.trim() : "(they haven't tried yet)";
  return [
    "A child is working on a learning mission and asked for a hint.",
    `Mission: ${input.missionContext}`,
    `What they are learning: ${input.learningObjective}`,
    `The question they are on: ${input.question}`,
    `Their attempt so far: ${attempt}`,
    "",
    "Give one short, friendly hint that guides them toward the answer without giving it away.",
  ].join("\n");
}

/** Generate a hint. Always resolves — returns the safe fallback on any problem. */
export async function generateHint(
  provider: AIProvider,
  input: HintRequestInput,
): Promise<HintResult> {
  const { text, source } = await runAiText(provider, {
    system: HINT_SYSTEM,
    prompt: buildHintPrompt(input),
    maxOutputTokens: HINT_MAX_TOKENS,
    validate: (raw) => {
      const t = normalizeAndCap(raw, HINT_MAX_CHARS);
      if (!t) return null;
      return t.replace(/^(hint|answer)\s*[:\-–]\s*/i, "").trim() || null;
    },
    fallback: FALLBACK_HINT,
  });
  return { hint: text, source };
}
