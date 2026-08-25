/**
 * Provider abstraction for the LLM boundary.
 *
 *   React → Express → AI Service → AIProvider → LLM
 *
 * The AI service depends only on this interface, never on a concrete provider,
 * so the underlying model/vendor can be swapped (or mocked in tests) without
 * touching any application code.
 */
export interface AICompletionParams {
  /** System instruction (role, guardrails). */
  system: string;
  /** The user prompt. */
  prompt: string;
  /** Hard cap on generated tokens. */
  maxOutputTokens: number;
  /** Abort signal for timeouts. */
  signal?: AbortSignal;
}

export interface AIProvider {
  /** Short identifier for logs (e.g. "anthropic", "null"). */
  readonly name: string;
  /** Whether the provider is configured to reach a real model. */
  readonly available: boolean;
  /** Run a single completion. Rejects on error/timeout/refusal. */
  complete(params: AICompletionParams): Promise<string>;
}
