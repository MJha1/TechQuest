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

/** A controlled AI learning activity's public description (catalog entry). */
export interface ActivityInfo {
  key: string;
  title: string;
  /** What the child is meant to learn from this activity. */
  objective: string;
  /** The controlled inputs the activity accepts. */
  inputs: { name: string; label: string; maxLength: number }[];
}

/** Response from POST /api/ai/activities/:activity. */
export interface ActivityResult {
  activity: string;
  text: string;
  source: "ai" | "fallback";
}
