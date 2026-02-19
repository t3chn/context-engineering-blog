/**
 * Publish Command
 * Publishes text to Telegram with proofreading support
 */

import { Command } from "commander";
import { input, confirm } from "@inquirer/prompts";
import { readFileSync } from "fs";
import { loadConfig } from "../config.js";
import { publishToTelegram, validateText } from "../publishers/telegram.js";
import { proofread, formatProofreadResult } from "../reviewers/proofread.js";

export const publishCommand = new Command("publish")
  .description("Publish text to Telegram channel")
  .option("-t, --text <text>", "Text to publish")
  .option("-f, --file <path>", "Path to file with text")
  .option("--channel <id>", "Channel ID (default from .env)")
  .option("--dry-run", "Preview without publishing")
  .option("--no-review", "Skip proofreading step")
  .option("-y, --yes", "Auto-confirm without prompting")
  .action(async (options) => {
    try {
      console.log("\n📢 Telegram Publisher\n");

      const config = loadConfig();

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
          message: "Введи текст для публикации:",
          validate: (v) => (v.trim() ? true : "Text is required"),
        });
      }

      // Normalize escaped newlines from CLI arguments
      // Shell passes \n as literal backslash+n, not actual newline
      text = text.replace(/\\n/g, "\n");

      // Validate text
      const validation = validateText(text);
      if (!validation.valid) {
        console.error(`❌ ${validation.error}`);
        process.exit(1);
      }

      console.log(`\n📝 Text length: ${text.length} chars`);
      console.log("─".repeat(50));
      console.log(text);
      console.log("─".repeat(50));

      // Proofreading step (local checks, no API)
      let finalText = text;

      if (options.review !== false) {
        console.log("\n🔍 Проверка по стайл-гайду...\n");

        const result = await proofread("", text, "telegram");
        console.log(formatProofreadResult(result));

        if (!result.isApproved) {
          if (!options.yes) {
            const continueAnyway = await confirm({
              message: "Продолжить с ошибками?",
              default: false,
            });
            if (!continueAnyway) {
              console.log("❌ Публикация отменена");
              process.exit(0);
            }
          } else {
            console.log("\n⚠️ Есть ошибки, но -y флаг — продолжаю");
          }
        }

        finalText = text;
      }

      // Dry run mode
      if (options.dryRun) {
        console.log("\n🔍 Dry run mode - not publishing");
        console.log("\n📝 Final text:");
        console.log("─".repeat(50));
        console.log(finalText);
        console.log("─".repeat(50));
        process.exit(0);
      }

      // Confirm before publishing
      const channelId = options.channel || config.telegram.channelId;

      let shouldPublish = options.yes;
      if (!shouldPublish) {
        shouldPublish = await confirm({
          message: `Опубликовать в ${channelId}?`,
          default: true,
        });
      }

      if (!shouldPublish) {
        console.log("❌ Публикация отменена");
        process.exit(0);
      }

      // Publish
      console.log("\n📤 Publishing...");

      const result = await publishToTelegram(config.telegram.botToken, channelId, finalText);

      if (result.success) {
        console.log(`✓ Опубликовано в ${channelId}`);
        if (result.messageId) {
          console.log(`  Message ID: ${result.messageId}`);
        }
      } else {
        console.error(`❌ Ошибка: ${result.error}`);
        process.exit(1);
      }
    } catch (error) {
      console.error("❌ Error:", (error as Error).message);
      process.exit(1);
    }
  });
