import type { HintRequestInput, HintResult } from "@techquest/shared";
import { env } from "../lib/env.js";
import { logger } from "../lib/logger.js";
import type { AIProvider } from "../ai/provider.js";

/**
 * AI service — the "hint" use case.
 *
 * Responsibilities that make the LLM safe to expose to children:
 *   - a fixed, single-purpose prompt (NOT open chat);
 *   - a timeout (abort the call if the model is slow);
 *   - a maximum response length (validated + truncated);
 *   - output validation (non-empty, whitespace-normalized, prefix-stripped);
 *   - a safe fallback hint on any failure/timeout/empty/refusal;
 *   - error handling that never surfaces a raw model/provider error.
 * The model is instructed to guide, not to reveal the answer.
 */

const MAX_OUTPUT_TOKENS = 150;
const MAX_HINT_CHARS = 240;

/** Shown whenever the model can't produce a usable hint. Never reveals answers. */
const FALLBACK_HINT =
  "Take another look at the examples and think about what they have in common. You're on the right track — give it a try!";

const SYSTEM_PROMPT = [
  "You are a kind, encouraging learning buddy for a child aged 8 to 12.",
  "Give exactly ONE short hint (one or two simple sentences) that gently nudges the child toward working out the answer THEMSELVES.",
  "Rules:",
  "- Never give, state, or spell out the answer.",
  "- Never do the task for them.",
  "- Use simple, friendly, positive words.",
  "- Keep it under 30 words.",
  "- Stay on the mission topic. Do not ask them to go to an adult or the internet.",
].join("\n");

function buildPrompt(input: HintRequestInput): string {
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

/** Normalize + bound the model output. Returns null if unusable. */
function validateHint(raw: string): string | null {
  let text = raw.replace(/\s+/g, " ").trim();
  // Strip a leading "Hint:" style prefix the model sometimes adds.
  text = text.replace(/^(hint|answer)\s*[:\-–]\s*/i, "").trim();
  if (!text) return null;
  if (text.length > MAX_HINT_CHARS) {
    // Prefer to cut at a sentence boundary within the cap, else hard-truncate.
    const capped = text.slice(0, MAX_HINT_CHARS);
    const lastStop = Math.max(capped.lastIndexOf(". "), capped.lastIndexOf("! "), capped.lastIndexOf("? "));
    text = lastStop > 60 ? capped.slice(0, lastStop + 1) : `${capped.trimEnd()}…`;
  }
  return text;
}

/**
 * Generate a hint. Always resolves (never throws) — on any problem it returns
 * the safe fallback, so the child always gets something encouraging.
 */
export async function generateHint(
  provider: AIProvider,
  input: HintRequestInput,
): Promise<HintResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), env.AI_HINT_TIMEOUT_MS);

  try {
    const raw = await provider.complete({
      system: SYSTEM_PROMPT,
      prompt: buildPrompt(input),
      maxOutputTokens: MAX_OUTPUT_TOKENS,
      signal: controller.signal,
    });
    const hint = validateHint(raw);
    if (!hint) return { hint: FALLBACK_HINT, source: "fallback" };
    return { hint, source: "ai" };
  } catch (err) {
    // Log server-side only; the child never sees the technical error.
    logger.warn("ai_hint_failed", {
      provider: provider.name,
      error: err instanceof Error ? err.message : String(err),
    });
    return { hint: FALLBACK_HINT, source: "fallback" };
  } finally {
    clearTimeout(timer);
  }
}
