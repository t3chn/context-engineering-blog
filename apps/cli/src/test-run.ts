import { config } from "dotenv";
config();

import type { PostInput } from "@ceb/shared";
import { loadConfig } from "./config.js";
import { createProvider } from "./providers/index.js";
import { generateTelegramPost } from "./generators/telegram.js";
import { generateBlogArticles } from "./generators/blog.js";
import { publishToTelegram } from "./publishers/telegram.js";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

async function main() {
  const cfg = loadConfig();
  console.log(`\n🚀 Test run with provider: ${cfg.aiProvider}\n`);

  const testInput: PostInput = {
    title: "Context Engineering: первые шаги",
    content: `
Сегодня начал изучать context engineering.

Ключевые инсайты:
- Context engineering — это не просто промпт, это система управления информацией для LLM
- Важно думать о структуре контекста: что включить, в каком порядке, как форматировать
- Большие контекстные окна (100K+ токенов) требуют нового подхода к организации данных

Источники:
https://docs.anthropic.com/en/docs/build-with-claude/prompt-caching
https://www.anthropic.com/research/building-effective-agents
    `.trim(),
    tags: ["context-engineering", "llm", "anthropic"],
    sources: [
      "https://docs.anthropic.com/en/docs/build-with-claude/prompt-caching",
      "https://www.anthropic.com/research/building-effective-agents",
    ],
  };

  const provider = createProvider(cfg.aiProvider);

  console.log("⏳ Генерирую Telegram пост...\n");
  const telegramPost = await generateTelegramPost(provider, testInput);

  console.log("--- Telegram Post ---");
  console.log(telegramPost);
  console.log("---------------------\n");

  console.log("⏳ Генерирую статьи для блога...\n");
  const articles = await generateBlogArticles(provider, testInput);

  console.log("✓ RU статья:", articles.ru.title);
  console.log("✓ EN статья:", articles.en.title);

  // Save files - resolve from monorepo root (2 levels up from cli/src)
  const monorepoRoot = path.resolve(import.meta.dirname, "../../..");
  const blogDir = path.join(monorepoRoot, "apps/blog/src/content/posts");
  await mkdir(path.join(blogDir, "ru"), { recursive: true });
  await mkdir(path.join(blogDir, "en"), { recursive: true });

  const ruPath = path.join(blogDir, "ru", `${articles.ru.slug}.md`);
  const enPath = path.join(blogDir, "en", `${articles.en.slug}.md`);

  await writeFile(ruPath, `---
title: "${articles.ru.title}"
description: "${articles.ru.description}"
date: ${articles.ru.date}
tags: [${articles.ru.tags.map(t => `"${t}"`).join(", ")}]
lang: ru
---

${articles.ru.content}`);

  await writeFile(enPath, `---
title: "${articles.en.title}"
description: "${articles.en.description}"
date: ${articles.en.date}
tags: [${articles.en.tags.map(t => `"${t}"`).join(", ")}]
lang: en
---

${articles.en.content}`);

  console.log(`\n✓ Saved: ${ruPath}`);
  console.log(`✓ Saved: ${enPath}`);

  // Publish to Telegram
  const shouldPublish = process.argv.includes("--publish");

  if (shouldPublish) {
    try {
      await publishToTelegram(cfg.telegram.botToken, cfg.telegram.channelId, telegramPost);
      console.log(`\n✓ Опубликовано в ${cfg.telegram.channelId}`);
    } catch (err) {
      console.error("\n❌ Ошибка публикации:", err);
    }
  } else {
    console.log("\n💡 Добавь --publish чтобы опубликовать в Telegram");
  }

  console.log("\n✅ Готово!\n");
}

main().catch(console.error);
