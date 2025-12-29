import type {
  LLMProvider,
  CompletionParams,
  CompletionResult,
  ProviderConfig,
} from "./types.js";

export class GroqProvider implements LLMProvider {
  name = "groq";
  defaultModel: string;
  private apiKey: string;
  private baseUrl: string;

  constructor(config: ProviderConfig) {
    this.apiKey = config.apiKey || process.env.GROQ_API_KEY || "";
    this.baseUrl = config.baseUrl || "https://api.groq.com/openai/v1";
    this.defaultModel = config.defaultModel || "llama-3.3-70b-versatile";
  }

  async complete(params: CompletionParams): Promise<CompletionResult> {
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: params.model || this.defaultModel,
        messages: [{ role: "user", content: params.prompt }],
        temperature: params.temperature ?? 0.7,
        max_tokens: params.maxTokens ?? 1024,
        response_format:
          params.responseFormat === "json"
            ? { type: "json_object" }
            : undefined,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Groq API error: ${response.status} - ${error}`);
    }

    const data = (await response.json()) as {
      choices: Array<{ message: { content: string } }>;
      usage: { prompt_tokens: number; completion_tokens: number };
    };

    return {
      content: data.choices[0].message.content,
      usage: {
        inputTokens: data.usage.prompt_tokens,
        outputTokens: data.usage.completion_tokens,
      },
    };
  }
}
