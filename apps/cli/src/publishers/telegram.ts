import { Bot } from "grammy";
import { existsSync } from "fs";
import { join } from "path";

const MAX_MESSAGE_LENGTH = 4096;
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

export interface PublishOptions {
  parseMode?: "HTML" | "Markdown" | "MarkdownV2" | null;
  disablePreview?: boolean;
  retries?: number;
}

export interface PublishResult {
  success: boolean;
  messageId?: number;
  error?: string;
}

/**
 * Escape special HTML characters for Telegram
 */
export function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/**
 * Validate ctxt.dev blog links in text
 * - Must use /posts/ru/ or /posts/en/ format (not /ru/posts/)
 * - Post slug must exist on disk
 */
function validateBlogLinks(text: string): { valid: boolean; error?: string } {
  // Find all ctxt.dev URLs
  const urlRegex = /https?:\/\/ctxt\.dev\/([^\s)>\]]+)/g;
  const matches = text.matchAll(urlRegex);

  for (const match of matches) {
    const path = match[1];

    // Check for wrong URL format (/ru/posts/ instead of /posts/ru/)
    if (path.match(/^(ru|en)\/posts\//)) {
      const correctedPath = path.replace(/^(ru|en)\/posts\//, "posts/$1/");
      return {
        valid: false,
        error: `Invalid blog URL format: https://ctxt.dev/${path}\n   Correct format: https://ctxt.dev/${correctedPath}`,
      };
    }

    // If it's a blog post URL, validate the post exists
    const postMatch = path.match(/^posts\/(ru|en)\/([^/]+)\/?$/);
    if (postMatch) {
      const [, lang, slug] = postMatch;
      // Try to find the posts directory (works from repo root or apps/cli)
      const possiblePaths = [
        join(process.cwd(), "apps/blog/src/content/posts", lang, `${slug}.md`),
        join(process.cwd(), "../blog/src/content/posts", lang, `${slug}.md`),
        join(process.cwd(), "../../apps/blog/src/content/posts", lang, `${slug}.md`),
      ];

      const postExists = possiblePaths.some((p) => existsSync(p));
      if (!postExists) {
        return {
          valid: false,
          error: `Blog post not found: https://ctxt.dev/${path}\n   Expected file: posts/${lang}/${slug}.md`,
        };
      }
    }
  }

  return { valid: true };
}

/**
 * Validate text before publishing
 */
export function validateText(text: string): { valid: boolean; error?: string } {
  if (!text || text.trim().length === 0) {
    return { valid: false, error: "Text is empty" };
  }

  if (text.length > MAX_MESSAGE_LENGTH) {
    return {
      valid: false,
      error: `Text too long: ${text.length} chars (max ${MAX_MESSAGE_LENGTH})`,
    };
  }

  // Validate blog links
  const linkValidation = validateBlogLinks(text);
  if (!linkValidation.valid) {
    return linkValidation;
  }

  return { valid: true };
}

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Publish text to Telegram channel with retry logic
 */
export async function publishToTelegram(
  botToken: string,
  channelId: string,
  text: string,
  options: PublishOptions = {}
): Promise<PublishResult> {
  // Validate credentials
  if (!botToken || !channelId) {
    return {
      success: false,
      error: "Telegram bot token and channel ID are required",
    };
  }

  // Validate text
  const validation = validateText(text);
  if (!validation.valid) {
    return { success: false, error: validation.error };
  }

  const { parseMode = null, disablePreview = false, retries = MAX_RETRIES } = options;

  // Escape HTML if using HTML parse mode
  const processedText = parseMode === "HTML" ? escapeHtml(text) : text;

  const bot = new Bot(botToken);

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const result = await bot.api.sendMessage(channelId, processedText, {
        parse_mode: parseMode ?? undefined,
        disable_web_page_preview: disablePreview,
      });

      return {
        success: true,
        messageId: result.message_id,
      };
    } catch (error) {
      lastError = error as Error;

      // Don't retry on certain errors
      const errorMessage = lastError.message.toLowerCase();
      if (
        errorMessage.includes("chat not found") ||
        errorMessage.includes("bot was blocked") ||
        errorMessage.includes("not enough rights")
      ) {
        break;
      }

      // Wait before retry
      if (attempt < retries) {
        await sleep(RETRY_DELAY_MS * attempt);
      }
    }
  }

  return {
    success: false,
    error: lastError?.message || "Unknown error",
  };
}

/**
 * Delete a message from Telegram channel
 */
export async function deleteMessage(
  botToken: string,
  channelId: string,
  messageId: number
): Promise<{ success: boolean; error?: string }> {
  if (!botToken || !channelId) {
    return { success: false, error: "Telegram bot token and channel ID are required" };
  }

  const bot = new Bot(botToken);

  try {
    await bot.api.deleteMessage(channelId, messageId);
    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Edit a message in Telegram channel
 */
export async function editMessage(
  botToken: string,
  channelId: string,
  messageId: number,
  text: string,
  options: PublishOptions = {}
): Promise<PublishResult> {
  if (!botToken || !channelId) {
    return { success: false, error: "Telegram bot token and channel ID are required" };
  }

  const validation = validateText(text);
  if (!validation.valid) {
    return { success: false, error: validation.error };
  }

  const { parseMode = null, disablePreview = false } = options;
  const processedText = parseMode === "HTML" ? escapeHtml(text) : text;

  const bot = new Bot(botToken);

  try {
    await bot.api.editMessageText(channelId, messageId, processedText, {
      parse_mode: parseMode ?? undefined,
      disable_web_page_preview: disablePreview,
    });

    return { success: true, messageId };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Legacy function for backward compatibility
 */
export async function publish(botToken: string, channelId: string, text: string): Promise<void> {
  const result = await publishToTelegram(botToken, channelId, text);
  if (!result.success) {
    throw new Error(result.error);
  }
}
