import { config as dotenvConfig } from "dotenv";
import { execFileSync } from "child_process";
import { existsSync, readFileSync } from "fs";
import { homedir } from "os";
import { resolve } from "path";
import type { AIProvider, Config } from "@ceb/shared";

// Load .env from monorepo root
dotenvConfig({ path: resolve(process.cwd(), ".env") });
dotenvConfig({ path: resolve(process.cwd(), "../../.env") }); // fallback for cli dir

const DEFAULT_PUBLISHING_WORKSPACE_ROOT =
  "~/.local/share/punk/publishing/projects/context-engineering-blog";
const DEFAULT_TELEGRAM_KEYCHAIN_SERVICE = "punk-publishing/context-engineering-blog/telegram";

interface TelegramSecretConfig {
  service: string;
  botTokenAccount: string;
  chatIdAccount: string;
}

export function expandHome(value: string): string {
  if (value === "~") return homedir();
  if (value.startsWith("~/")) return resolve(homedir(), value.slice(2));
  return value;
}

export function getPublishingWorkspaceRoot(): string {
  return expandHome(process.env.CEB_PUBLISHING_WORKSPACE || DEFAULT_PUBLISHING_WORKSPACE_ROOT);
}

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

function tomlString(text: string, key: string): string | undefined {
  const match = text.match(new RegExp(`^${key}\\s*=\\s*"([^"]*)"`, "m"));
  return match?.[1];
}

function loadTelegramSecretConfig(): TelegramSecretConfig {
  const configPath = resolve(getPublishingWorkspaceRoot(), "channels/telegram.toml");
  if (!existsSync(configPath)) {
    return {
      service: DEFAULT_TELEGRAM_KEYCHAIN_SERVICE,
      botTokenAccount: "bot_token",
      chatIdAccount: "chat_id",
    };
  }

  const text = readFileSync(configPath, "utf-8");
  return {
    service: tomlString(text, "service") || DEFAULT_TELEGRAM_KEYCHAIN_SERVICE,
    botTokenAccount: tomlString(text, "bot_token_account") || "bot_token",
    chatIdAccount: tomlString(text, "chat_id_account") || "chat_id",
  };
}

function keychainGet(service: string, account: string): string | undefined {
  try {
    return execFileSync("security", ["find-generic-password", "-a", account, "-s", service, "-w"], {
      encoding: "utf-8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trimEnd();
  } catch {
    return undefined;
  }
}

function loadTelegramCredentials(): { botToken: string; channelId: string } {
  const secrets = loadTelegramSecretConfig();
  return {
    botToken:
      process.env.TELEGRAM_BOT_TOKEN || keychainGet(secrets.service, secrets.botTokenAccount) || "",
    channelId:
      process.env.TELEGRAM_CHANNEL_ID || keychainGet(secrets.service, secrets.chatIdAccount) || "",
  };
}

export function loadConfig(): Config {
  const provider = (process.env.AI_PROVIDER || "claude") as AIProvider;
  const telegram = loadTelegramCredentials();

  return {
    aiProvider: provider,
    telegram,
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
