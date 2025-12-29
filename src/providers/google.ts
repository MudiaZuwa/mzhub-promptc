import type {
  LLMProvider,
  CompletionParams,
  CompletionResult,
  ProviderConfig,
} from "./types.js";

export class GoogleProvider implements LLMProvider {
  name = "google";
  defaultModel: string;
  private apiKey: string;
  private baseUrl: string;

  constructor(config: ProviderConfig) {
    this.apiKey = config.apiKey || process.env.GOOGLE_API_KEY || "";
    this.baseUrl =
      config.baseUrl || "https://generativelanguage.googleapis.com/v1beta";
    this.defaultModel = config.defaultModel || "gemini-2.0-flash";
  }

  async complete(params: CompletionParams): Promise<CompletionResult> {
    const model = params.model || this.defaultModel;
    const url = `${this.baseUrl}/models/${model}:generateContent?key=${this.apiKey}`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: params.prompt }] }],
        generationConfig: {
          temperature: params.temperature ?? 0.7,
          maxOutputTokens: params.maxTokens ?? 1024,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Google API error: ${response.status} - ${error}`);
    }

    const data = (await response.json()) as {
      candidates: Array<{ content: { parts: Array<{ text: string }> } }>;
      usageMetadata: { promptTokenCount: number; candidatesTokenCount: number };
    };

    return {
      content: data.candidates[0]?.content?.parts[0]?.text || "",
      usage: {
        inputTokens: data.usageMetadata?.promptTokenCount || 0,
        outputTokens: data.usageMetadata?.candidatesTokenCount || 0,
      },
    };
  }
}
