import type { PostInput } from "@ceb/shared";
import { readFileSync } from "fs";
import path from "path";

function loadStyleContext(platform: "telegram" | "blog_ru" | "blog_en"): string {
  const skillDir = path.resolve(import.meta.dirname, "../../../../.claude/skills/ceb-content");

  try {
    const tldr = readFileSync(path.join(skillDir, "references/TLDR.md"), "utf-8");

    const platformFile =
      platform === "telegram"
        ? "references/TELEGRAM.md"
        : platform === "blog_ru"
          ? "references/BLOG_RU.md"
          : "references/BLOG_EN.md";

    const platformGuide = readFileSync(path.join(skillDir, platformFile), "utf-8");

    return `# Style Guide\n\n${tldr}\n\n---\n\n${platformGuide}`;
  } catch {
    // Fallback if skill files not found
    return "";
  }
}

export function buildTelegramPrompt(input: PostInput): string {
  const sources = input.sources?.length
    ? `\n\nИсточники:\n${input.sources.map((s) => `- ${s}`).join("\n")}`
    : "";

  const styleContext = loadStyleContext("telegram");

  return `Ты — автор Telegram канала @ctxtdev о context engineering.

${styleContext}

---

## Задача
Создай пост для Telegram на основе моих заметок.

## Роль канала
Telegram для @ctxtdev — это field-notes layer.
Он должен быть раньше, короче и резче, чем блог.
По умолчанию это НЕ пересказ статьи и НЕ article trailer.

## Decision rule
У поста должна быть ровно одна работа:
- Signal — одно жёсткое наблюдение, обычно без ссылки
- Cut — одно решение / architectural reversal, ссылка optional
- Build note — одно конкретное изменение или lesson learned, ссылка optional
- Dispatch — один payoff из новой статьи + одна ссылка

Если заметки явно не про запуск статьи, НЕ делай Dispatch.

## Требования:
- 3-6 коротких абзацев по 1-3 строки
- один пост = одна идея
- Чистый текст, минимум эмодзи (max 1-2)
- default длина 350-650 символов, можно до 900 если иначе теряется смысл
- максимум 1 ссылка, и только если она реально добавляет value
- хештеги в конце (#contextengineering + optional second tag)
- БЕЗ подписи автора
- БЕЗ bullet-списков
- БЕЗ мотивационного тона
- НЕ начинать с фраз вроде "Сегодня изучил", "Новый пост", "Thoughts on"
- Начинать с tension, проблемы, observation или contradiction
- Писать на том же языке, что и основная заметка, если явно не сказано иначе

## Мои заметки:
Заголовок: ${input.title}
Теги: ${input.tags.join(", ")}

${input.content}
${sources}

## Формат ответа:
Верни только текст поста, без дополнительных комментариев.`;
}

export { loadStyleContext };
