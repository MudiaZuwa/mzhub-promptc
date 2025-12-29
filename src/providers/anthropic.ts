import type {
  LLMProvider,
  CompletionParams,
  CompletionResult,
  ProviderConfig,
} from "./types.js";

export class AnthropicProvider implements LLMProvider {
  name = "anthropic";
  defaultModel: string;
  private apiKey: string;
  private baseUrl: string;

  constructor(config: ProviderConfig) {
    this.apiKey = config.apiKey || process.env.ANTHROPIC_API_KEY || "";
    this.baseUrl = config.baseUrl || "https://api.anthropic.com/v1";
    this.defaultModel = config.defaultModel || "claude-3-5-sonnet-20241022";
  }

  async complete(params: CompletionParams): Promise<CompletionResult> {
    const response = await fetch(`${this.baseUrl}/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": this.apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: params.model || this.defaultModel,
        max_tokens: params.maxTokens ?? 1024,
        messages: [{ role: "user", content: params.prompt }],
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Anthropic API error: ${response.status} - ${error}`);
    }

    const data = (await response.json()) as {
      content: Array<{ type: string; text: string }>;
      usage: { input_tokens: number; output_tokens: number };
    };

    const textContent = data.content.find((c) => c.type === "text");

    return {
      content: textContent?.text || "",
      usage: {
        inputTokens: data.usage.input_tokens,
        outputTokens: data.usage.output_tokens,
      },
    };
  }
}
