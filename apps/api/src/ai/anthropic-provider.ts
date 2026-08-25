import Anthropic from "@anthropic-ai/sdk";
import type { AICompletionParams, AIProvider } from "./provider.js";

/**
 * Anthropic (Claude) provider — one concrete implementation of `AIProvider`.
 *
 * The API key is read from the server environment and lives only here; it never
 * leaves the backend. `maxRetries: 0` keeps latency bounded so a slow/failed
 * call surfaces quickly and the AI service can fall back.
 */
export class AnthropicProvider implements AIProvider {
  readonly name = "anthropic";
  readonly available = true;
  private readonly client: Anthropic;

  constructor(
    private readonly opts: { apiKey: string; model: string; timeoutMs: number },
  ) {
    this.client = new Anthropic({ apiKey: opts.apiKey, maxRetries: 0 });
  }

  async complete({ system, prompt, maxOutputTokens, signal }: AICompletionParams): Promise<string> {
    const res = await this.client.messages.create(
      {
        model: this.opts.model,
        max_tokens: maxOutputTokens,
        system,
        messages: [{ role: "user", content: prompt }],
      },
      { timeout: this.opts.timeoutMs, signal },
    );

    // A safety refusal is treated as "no usable output" so the caller falls back.
    if (res.stop_reason === "refusal") {
      throw new Error("model refused the request");
    }

    return res.content
      .filter((block): block is Anthropic.TextBlock => block.type === "text")
      .map((block) => block.text)
      .join(" ")
      .trim();
  }
}
