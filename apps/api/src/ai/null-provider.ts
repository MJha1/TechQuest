import type { AIProvider } from "./provider.js";

/**
 * No-op provider used when no LLM is configured (e.g. `ANTHROPIC_API_KEY` unset,
 * as in local dev and tests). It always rejects, so the AI service returns its
 * safe fallback hint — the feature degrades gracefully rather than erroring.
 */
export class NullAIProvider implements AIProvider {
  readonly name = "null";
  readonly available = false;

  async complete(): Promise<string> {
    throw new Error("AI provider is not configured");
  }
}
