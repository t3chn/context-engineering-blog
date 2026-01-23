#!/usr/bin/env node

import { Command } from "commander";
import { input, editor, confirm } from "@inquirer/prompts";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import type { PostInput, AIProvider } from "@ceb/shared";
import { loadConfig } from "./config.js";
import { createProvider } from "./providers/index.js";
import { generateTelegramPost } from "./generators/telegram.js";
import { generateBlogArticles } from "./generators/blog.js";
import { publishToTelegram } from "./publishers/telegram.js";
import { autoCommitAndPush } from "./git.js";
import { videoCommand } from "./commands/video.js";
import { publishCommand } from "./commands/publish.js";
import { editCommand } from "./commands/edit.js";

const program = new Command();

program.name("ceb").description("Context Engineering Blog CLI").version("0.1.0");

program
  .option("-p, --provider <provider>", "AI provider (claude, openai, gemini)")
  .option("--publish", "Publish to Telegram after generation")
  .action(async (options) => {
    try {
      const config = loadConfig();
      const provider = (options.provider as AIProvider) || config.aiProvider;

      console.log(`\n🚀 Context Engineering Blog CLI\n`);
      console.log(`Using AI provider: ${provider}\n`);

      // Interactive input
      const content = await editor({
        message: "Что изучил сегодня? (вставь ссылки и заметки)",
        postfix: ".md",
      });

      if (!content.trim()) {
        console.log("❌ No content provided");
        process.exit(1);
      }

      const title = await input({
        message: "Заголовок поста:",
        validate: (v) => (v.trim() ? true : "Title is required"),
      });

      const tagsInput = await input({
        message: "Теги (через запятую):",
        default: "context-engineering, llm",
      });

      const tags = tagsInput
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      // Extract sources from content
      const urlRegex = /https?:\/\/[^\s]+/g;
      const sources = content.match(urlRegex) || [];

      const postInput: PostInput = {
        content,
        title,
        tags,
        sources,
      };

      // Create AI provider
      const aiProvider = createProvider(provider);

      console.log("\n⏳ Генерирую...\n");

      // Generate content
      const [telegramPost, blogArticles] = await Promise.all([
        generateTelegramPost(aiProvider, postInput),
        generateBlogArticles(aiProvider, postInput),
      ]);

      console.log("✓ Telegram пост (RU)");
      console.log("✓ Блог статья (RU)");
      console.log("✓ Блог статья (EN)");

      // Preview
      console.log("\n--- Telegram Post Preview ---\n");
      console.log(telegramPost);
      console.log("\n-----------------------------\n");

      // Save files - resolve from monorepo root
      const monorepoRoot = path.resolve(import.meta.dirname, "../../..");
      const blogDir = path.join(monorepoRoot, "apps/blog/src/content/posts");
      const ruDir = path.join(blogDir, "ru");
      const enDir = path.join(blogDir, "en");

      await mkdir(ruDir, { recursive: true });
      await mkdir(enDir, { recursive: true });

      const ruPath = path.join(ruDir, `${blogArticles.ru.slug}.md`);
      const enPath = path.join(enDir, `${blogArticles.en.slug}.md`);

      const ruContent = `---
title: "${blogArticles.ru.title}"
description: "${blogArticles.ru.description}"
date: ${blogArticles.ru.date}
tags: [${blogArticles.ru.tags.map((t) => `"${t}"`).join(", ")}]
lang: ru
---

${blogArticles.ru.content}`;

      const enContent = `---
title: "${blogArticles.en.title}"
description: "${blogArticles.en.description}"
date: ${blogArticles.en.date}
tags: [${blogArticles.en.tags.map((t) => `"${t}"`).join(", ")}]
lang: en
---

${blogArticles.en.content}`;

      await writeFile(ruPath, ruContent);
      await writeFile(enPath, enContent);

      console.log(`✓ Saved: ${ruPath}`);
      console.log(`✓ Saved: ${enPath}`);

      // Publish to Telegram
      const shouldPublish =
        options.publish ||
        (await confirm({
          message: "Опубликовать в Telegram?",
          default: false,
        }));

      if (shouldPublish) {
        try {
          await publishToTelegram(
            config.telegram.botToken,
            config.telegram.channelId,
            telegramPost
          );
          console.log(`✓ Опубликовано в ${config.telegram.channelId}`);
        } catch (error) {
          console.error("❌ Ошибка публикации в Telegram:", error);
        }
      }

      // Git operations
      await autoCommitAndPush([ruPath, enPath], title, process.cwd(), config.git);

      console.log("\n✅ Готово!\n");
    } catch (error) {
      console.error("❌ Error:", error);
      process.exit(1);
    }
  });

// Add subcommands
program.addCommand(videoCommand);
program.addCommand(publishCommand);
program.addCommand(editCommand);

program.parse();
