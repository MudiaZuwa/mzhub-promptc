import type {
  LLMProvider,
  CompletionParams,
  CompletionResult,
  ProviderConfig,
} from "./types.js";

export class OllamaProvider implements LLMProvider {
  name = "ollama";
  defaultModel: string;
  private baseUrl: string;

  constructor(config: ProviderConfig = {}) {
    this.baseUrl = config.baseUrl || "http://localhost:11434";
    this.defaultModel = config.defaultModel || "llama3.2";
  }

  async complete(params: CompletionParams): Promise<CompletionResult> {
    const response = await fetch(`${this.baseUrl}/api/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: params.model || this.defaultModel,
        prompt: params.prompt,
        stream: false,
        options: {
          temperature: params.temperature ?? 0.7,
          num_predict: params.maxTokens ?? 1024,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Ollama API error: ${response.status} - ${error}`);
    }

    const data = (await response.json()) as {
      response: string;
      prompt_eval_count?: number;
      eval_count?: number;
    };

    return {
      content: data.response,
      usage: {
        inputTokens: data.prompt_eval_count || 0,
        outputTokens: data.eval_count || 0,
      },
    };
  }
}
