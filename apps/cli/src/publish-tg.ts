import { config } from "dotenv";
config();

import type { PostInput } from "@ceb/shared";
import { loadConfig } from "./config.js";
import { createProvider } from "./providers/index.js";
import { generateTelegramPost } from "./generators/telegram.js";
import { publishToTelegram } from "./publishers/telegram.js";

async function main() {
  const cfg = loadConfig();
  console.log(`\n🚀 Telegram post generator (${cfg.aiProvider})\n`);

  const postInput: PostInput = {
    title: "Context Engineering: первые шаги",
    content: `
Проблема: промпты перестали работать стабильно.
Один и тот же промпт даёт разные результаты. Добавление деталей ухудшает ситуацию.

Prompt engineering фокусируется на формулировке запроса.
Но модель принимает решения на основе ВСЕГО контекста.

Context engineering — инженерный подход к организации информации:
- Что включить в контекст
- В каком порядке
- Как структурировать

Решение: вместо улучшения промпта — структурируем контекст.
Инструкции краткие, данные с метаданными, примеры конкретные, constraints явные.

Инсайт: context engineering — это не про LLM. Это про организацию информации.
Те же принципы работают для людей. Разница — у LLM нет здравого смысла для восполнения пробелов.

Этот блог — исследование того, как структурировать контекст. Практика, не теория.
    `.trim(),
    tags: ["context-engineering", "llm"],
    sources: [
      "https://www.anthropic.com/research/building-effective-agents",
    ],
  };

  const provider = createProvider(cfg.aiProvider);

  console.log("⏳ Генерирую Telegram пост...\n");
  const telegramPost = await generateTelegramPost(provider, postInput);

  console.log("--- Telegram Post ---");
  console.log(telegramPost);
  console.log("---------------------\n");

  const shouldPublish = process.argv.includes("--publish");

  if (shouldPublish) {
    try {
      await publishToTelegram(cfg.telegram.botToken, cfg.telegram.channelId, telegramPost);
      console.log(`✓ Опубликовано в ${cfg.telegram.channelId}`);
    } catch (err) {
      console.error("❌ Ошибка публикации:", err);
    }
  } else {
    console.log("💡 Добавь --publish чтобы опубликовать в Telegram");
  }
}

main().catch(console.error);
