import { env } from "../lib/env.js";
import type { AIProvider } from "./provider.js";
import { AnthropicProvider } from "./anthropic-provider.js";
import { NullAIProvider } from "./null-provider.js";

export type { AIProvider, AICompletionParams } from "./provider.js";
export { AnthropicProvider } from "./anthropic-provider.js";
export { NullAIProvider } from "./null-provider.js";

/**
 * Choose the provider from configuration — the single place the concrete
 * provider is selected. Anywhere else in the app depends only on `AIProvider`.
 */
export function createDefaultAIProvider(): AIProvider {
  if (!env.ANTHROPIC_API_KEY) return new NullAIProvider();
  return new AnthropicProvider({
    apiKey: env.ANTHROPIC_API_KEY,
    model: env.AI_MODEL,
    timeoutMs: env.AI_HINT_TIMEOUT_MS,
  });
}
