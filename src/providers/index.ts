import { OpenAIProvider } from "./openai.js";
import { AnthropicProvider } from "./anthropic.js";
import { GoogleProvider } from "./google.js";
import { OllamaProvider } from "./ollama.js";
import { GroqProvider } from "./groq.js";
import { CerebrasProvider } from "./cerebras.js";
import type { LLMProvider, ProviderConfig } from "./types.js";

export type ProviderName =
  | "openai"
  | "anthropic"
  | "google"
  | "ollama"
  | "groq"
  | "cerebras";

export function createProvider(
  name: ProviderName,
  config: ProviderConfig = {}
): LLMProvider {
  switch (name) {
    case "openai":
      return new OpenAIProvider(config);
    case "anthropic":
      return new AnthropicProvider(config);
    case "google":
      return new GoogleProvider(config);
    case "ollama":
      return new OllamaProvider(config);
    case "groq":
      return new GroqProvider(config);
    case "cerebras":
      return new CerebrasProvider(config);
    default:
      throw new Error(`Unknown provider: ${name}`);
  }
}

export { OpenAIProvider } from "./openai.js";
export { AnthropicProvider } from "./anthropic.js";
export { GoogleProvider } from "./google.js";
export { OllamaProvider } from "./ollama.js";
export { GroqProvider } from "./groq.js";
export { CerebrasProvider } from "./cerebras.js";
export type {
  LLMProvider,
  CompletionParams,
  CompletionResult,
  ProviderConfig,
} from "./types.js";
