/**
 * Publish Command
 * Publishes text to Telegram with proofreading support
 */

import { Command } from "commander";
import { input, confirm, select } from "@inquirer/prompts";
import { readFileSync } from "fs";
import { loadConfig, getApiKey } from "../config.js";
import { publishToTelegram, validateText } from "../publishers/telegram.js";
import { proofread, formatProofreadResult } from "../reviewers/proofread.js";

export const publishCommand = new Command("publish")
  .description("Publish text to Telegram channel")
  .option("-t, --text <text>", "Text to publish")
  .option("-f, --file <path>", "Path to file with text")
  .option("--channel <id>", "Channel ID (default from .env)")
  .option("--dry-run", "Preview without publishing")
  .option("--no-review", "Skip proofreading step")
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

      // Proofreading step
      let finalText = text;

      if (options.review !== false) {
        console.log("\n🔍 Proofreading with extended thinking...\n");

        try {
          const apiKey = getApiKey("claude");
          const result = await proofread(apiKey, text, "telegram");

          console.log(formatProofreadResult(result));

          if (!result.isApproved && result.issues.length > 0) {
            console.log("\n📝 Исправленный текст:");
            console.log("─".repeat(50));
            console.log(result.correctedText);
            console.log("─".repeat(50));

            const useCorrection = await select({
              message: "Какой текст использовать?",
              choices: [
                { name: "Исправленный", value: "corrected" },
                { name: "Оригинальный", value: "original" },
                { name: "Отмена", value: "cancel" },
              ],
            });

            if (useCorrection === "cancel") {
              console.log("❌ Публикация отменена");
              process.exit(0);
            }

            finalText = useCorrection === "corrected" ? result.correctedText : text;
          } else {
            console.log("\n✓ Текст прошёл проверку");
          }
        } catch (error) {
          console.error("⚠️ Proofreading failed:", (error as Error).message);
          const continueAnyway = await confirm({
            message: "Продолжить без проверки?",
            default: false,
          });
          if (!continueAnyway) {
            process.exit(1);
          }
        }
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

      const shouldPublish = await confirm({
        message: `Опубликовать в ${channelId}?`,
        default: true,
      });

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
