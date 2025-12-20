import { Bot } from "grammy";

export async function publishToTelegram(
  botToken: string,
  channelId: string,
  text: string
): Promise<void> {
  if (!botToken || !channelId) {
    throw new Error("Telegram bot token and channel ID are required for publishing");
  }

  const bot = new Bot(botToken);

  await bot.api.sendMessage(channelId, text, {
    parse_mode: "HTML",
    disable_web_page_preview: false,
  });
}
