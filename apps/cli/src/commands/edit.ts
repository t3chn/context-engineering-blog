/**
 * Edit Command
 * Edits an existing Telegram message
 */

import { Command } from "commander";
import { input, confirm } from "@inquirer/prompts";
import { readFileSync } from "fs";
import { loadConfig } from "../config.js";
import { editMessage, validateText } from "../publishers/telegram.js";

export const editCommand = new Command("edit")
  .description("Edit an existing Telegram message")
  .requiredOption("-m, --message-id <id>", "Message ID to edit")
  .option("-t, --text <text>", "New text for the message")
  .option("-f, --file <path>", "Path to file with new text")
  .option("--channel <id>", "Channel ID (default from .env)")
  .option("--dry-run", "Preview without editing")
  .option("-y, --yes", "Auto-confirm without prompting")
  .action(async (options) => {
    try {
      console.log("\n✏️  Telegram Message Editor\n");

      const config = loadConfig();
      const messageId = parseInt(options.messageId, 10);

      if (isNaN(messageId)) {
        console.error("❌ Invalid message ID");
        process.exit(1);
      }

      // Get text from options, file, or interactive input
      let text = options.text;

      if (!text && options.file) {
        try {
          text = readFileSync(options.file, "utf-8").trim();
          console.log(`📄 Loaded from: ${options.file}`);
        } catch {
          console.error(`❌ Cannot read file: ${options.file}`);
          process.exit(1);
        }
      }

      if (!text) {
        text = await input({
          message: "Введи новый текст:",
          validate: (v) => (v.trim() ? true : "Text is required"),
        });
      }

      // Normalize escaped newlines
      text = text.replace(/\\n/g, "\n");

      // Validate text
      const validation = validateText(text);
      if (!validation.valid) {
        console.error(`❌ ${validation.error}`);
        process.exit(1);
      }

      console.log(`\n📝 New text (${text.length} chars):`);
      console.log("─".repeat(50));
      console.log(text);
      console.log("─".repeat(50));

      // Dry run mode
      if (options.dryRun) {
        console.log("\n🔍 Dry run mode - not editing");
        process.exit(0);
      }

      // Confirm before editing
      const channelId = options.channel || config.telegram.channelId;

      let shouldEdit = options.yes;
      if (!shouldEdit) {
        shouldEdit = await confirm({
          message: `Редактировать сообщение ${messageId} в ${channelId}?`,
          default: true,
        });
      }

      if (!shouldEdit) {
        console.log("❌ Редактирование отменено");
        process.exit(0);
      }

      // Edit
      console.log("\n✏️  Editing...");

      const result = await editMessage(config.telegram.botToken, channelId, messageId, text);

      if (result.success) {
        console.log(`✓ Сообщение ${messageId} отредактировано`);
      } else {
        console.error(`❌ Ошибка: ${result.error}`);
        process.exit(1);
      }
    } catch (error) {
      console.error("❌ Error:", (error as Error).message);
      process.exit(1);
    }
  });
