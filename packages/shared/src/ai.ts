/**
 * AI feature contracts (types only).
 */

/** Response from POST /api/ai/hint. */
export interface HintResult {
  /** A short, age-appropriate hint that guides without giving the answer. */
  hint: string;
  /** Where the hint came from — the model, or the safe canned fallback. */
  source: "ai" | "fallback";
}
