import type {
  LLMProvider,
  CompletionParams,
  CompletionResult,
  ProviderConfig,
} from "./types.js";

export class GroqProvider implements LLMProvider {
  name = "groq";
  defaultModel: string;
  private client: any;

  constructor(config: ProviderConfig) {
    const apiKey = config.apiKey || process.env.GROQ_API_KEY || "";
    this.defaultModel = config.defaultModel || "llama-3.3-70b-versatile";

    // Dynamic import to avoid requiring groq-sdk if not used
    this.client = null;
    this.initClient(apiKey);
  }

  private async initClient(apiKey: string) {
    try {
      const Groq = (await import("groq-sdk")).default;
      this.client = new Groq({ apiKey });
    } catch {
      // Will throw on complete() if SDK not installed
    }
  }

  private async ensureClient(): Promise<any> {
    if (!this.client) {
      try {
        const Groq = (await import("groq-sdk")).default;
        this.client = new Groq({
          apiKey: process.env.GROQ_API_KEY || "",
        });
      } catch {
        throw new Error(
          "groq-sdk is not installed. Install it with: npm install groq-sdk"
        );
      }
    }
    return this.client;
  }

  async complete(params: CompletionParams): Promise<CompletionResult> {
    const client = await this.ensureClient();

    const response = await client.chat.completions.create({
      model: params.model || this.defaultModel,
      messages: [{ role: "user", content: params.prompt }],
      temperature: params.temperature ?? 0.7,
      max_tokens: params.maxTokens ?? 1024,
      response_format:
        params.responseFormat === "json" ? { type: "json_object" } : undefined,
    });

    return {
      content: response.choices[0].message.content || "",
      usage: {
        inputTokens: response.usage?.prompt_tokens || 0,
        outputTokens: response.usage?.completion_tokens || 0,
      },
    };
  }
}
