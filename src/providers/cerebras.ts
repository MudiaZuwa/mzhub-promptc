import type {
  LLMProvider,
  CompletionParams,
  CompletionResult,
  ProviderConfig,
} from "./types.js";

export class CerebrasProvider implements LLMProvider {
  name = "cerebras";
  defaultModel: string;
  private client: any;
  private apiKey: string;

  constructor(config: ProviderConfig) {
    this.apiKey = config.apiKey || process.env.CEREBRAS_API_KEY || "";
    this.defaultModel = config.defaultModel || "llama3.1-8b";
    this.client = null;
  }

  private async ensureClient(): Promise<any> {
    if (!this.client) {
      try {
        const Cerebras = (await import("@cerebras/cerebras_cloud_sdk")).default;
        this.client = new Cerebras({ apiKey: this.apiKey });
      } catch {
        throw new Error(
          "@cerebras/cerebras_cloud_sdk is not installed. Install it with: npm install @cerebras/cerebras_cloud_sdk"
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
      max_completion_tokens: params.maxTokens ?? 1024,
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
