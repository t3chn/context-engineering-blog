import { config as dotenvConfig } from "dotenv";
import type { AIProvider, Config } from "@ceb/shared";

dotenvConfig();

function getEnv(key: string, defaultValue?: string): string {
  const value = process.env[key];
  if (!value && !defaultValue) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value || defaultValue!;
}

function getEnvBool(key: string, defaultValue: boolean): boolean {
  const value = process.env[key];
  if (!value) return defaultValue;
  return value.toLowerCase() === "true";
}

export function loadConfig(): Config {
  const provider = (process.env.AI_PROVIDER || "claude") as AIProvider;

  return {
    aiProvider: provider,
    telegram: {
      botToken: getEnv("TELEGRAM_BOT_TOKEN", ""),
      channelId: getEnv("TELEGRAM_CHANNEL_ID", ""),
    },
    git: {
      autoCommit: getEnvBool("GIT_AUTO_COMMIT", true),
      autoPush: getEnvBool("GIT_AUTO_PUSH", true),
    },
    blogUrl: getEnv("BLOG_URL", "https://context-engineering.blog"),
  };
}

export function getApiKey(provider: AIProvider): string {
  const keys: Record<AIProvider, string> = {
    claude: "ANTHROPIC_API_KEY",
    openai: "OPENAI_API_KEY",
    gemini: "GOOGLE_AI_API_KEY",
  };
  return getEnv(keys[provider]);
}
