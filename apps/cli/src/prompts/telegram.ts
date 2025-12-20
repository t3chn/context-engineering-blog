import type { PostInput } from "@ceb/shared";

export function buildTelegramPrompt(input: PostInput): string {
  const sources = input.sources?.length
    ? `\n\nИсточники:\n${input.sources.map((s) => `- ${s}`).join("\n")}`
    : "";

  return `Ты — автор Telegram канала о context engineering и LLM.

Создай короткий пост для Telegram на русском языке на основе моих заметок.

## Требования:
- 1-3 абзаца (максимум 4000 символов)
- Нативный стиль для Telegram
- Можно использовать эмодзи, но не перебарщивай
- Хештеги в конце (#contextengineering #llm и т.д.)
- Пост должен быть ценным и информативным
- Не используй заголовки типа "**Заголовок:**"

## Мои заметки:
Заголовок: ${input.title}
Теги: ${input.tags.join(", ")}

${input.content}
${sources}

## Формат ответа:
Верни только текст поста, без дополнительных комментариев.`;
}
