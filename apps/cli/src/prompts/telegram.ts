import type { PostInput } from "@ceb/shared";
import { readFileSync } from "fs";
import path from "path";

function loadStyleContext(platform: "telegram" | "blog_ru" | "blog_en"): string {
  const skillDir = path.resolve(import.meta.dirname, "../../../../.claude/skills/ceb-content");

  try {
    const tldr = readFileSync(path.join(skillDir, "references/TLDR.md"), "utf-8");

    const platformFile = platform === "telegram"
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

## Философия: Context-First Thinking
Формат: Проблема → Контекст → Решение → Инсайт

## Требования:
- 3-7 коротких абзацев по 1-3 строки
- Чистый текст, минимум эмодзи (max 1-2)
- Хештеги в конце (#contextengineering #llm)
- БЕЗ подписи автора
- БЕЗ bullet-списков
- БЕЗ мотивационного тона

## Мои заметки:
Заголовок: ${input.title}
Теги: ${input.tags.join(", ")}

${input.content}
${sources}

## Формат ответа:
Верни только текст поста, без дополнительных комментариев.`;
}

export { loadStyleContext };
