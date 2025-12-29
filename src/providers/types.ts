export interface CompletionParams {
  prompt: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  responseFormat?: "text" | "json";
}

export interface CompletionResult {
  content: string;
  usage: {
    inputTokens: number;
    outputTokens: number;
  };
}

export interface LLMProvider {
  name: string;
  defaultModel: string;
  complete(params: CompletionParams): Promise<CompletionResult>;
}

export interface ProviderConfig {
  apiKey?: string;
  baseUrl?: string;
  defaultModel?: string;
}
