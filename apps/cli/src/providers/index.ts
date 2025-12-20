import type { AIProvider } from "@ceb/shared";
import type { AIProviderInterface } from "./base.js";
import { ClaudeProvider } from "./claude.js";
import { OpenAIProvider } from "./openai.js";
import { GeminiProvider } from "./gemini.js";
import { getApiKey } from "../config.js";

export function createProvider(provider: AIProvider): AIProviderInterface {
  const apiKey = getApiKey(provider);

  switch (provider) {
    case "claude":
      return new ClaudeProvider(apiKey);
    case "openai":
      return new OpenAIProvider(apiKey);
    case "gemini":
      return new GeminiProvider(apiKey);
    default:
      throw new Error(`Unknown provider: ${provider}`);
  }
}

export type { AIProviderInterface };
