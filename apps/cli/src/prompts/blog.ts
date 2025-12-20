import type { PostInput } from "@ceb/shared";
import { loadStyleContext } from "./telegram.js";

export function buildBlogPromptRu(input: PostInput, slug: string, date: string): string {
  const sources = input.sources?.length
    ? `\n\nИсточники для упоминания:\n${input.sources.map((s) => `- ${s}`).join("\n")}`
    : "";

  const styleContext = loadStyleContext("blog_ru");

  return `Ты — автор технического блога о context engineering.

${styleContext}

---

## Задача
Напиши статью для блога на русском языке.

## Философия: Context-First Thinking
Структура статьи:
- Проблема — что не работает
- Контекст — почему это важно
- Решение — практический подход
- Инсайт — что изменилось в понимании

## Требования:
- Структурированная статья с заголовками (## и ###)
- Технический, но доступный стиль
- Примеры кода где уместно
- Ссылки на источники в конце
- Длина: 500-1500 слов
- БЕЗ мотивационного тона
- БЕЗ подписи автора

## Мои заметки:
Заголовок: ${input.title}
Теги: ${input.tags.join(", ")}

${input.content}
${sources}

## Формат ответа:
Верни статью в формате Markdown с frontmatter:

\`\`\`markdown
---
title: "${input.title}"
description: "[краткое описание для SEO, 1-2 предложения]"
date: ${date}
tags: [${input.tags.map((t) => `"${t}"`).join(", ")}]
lang: ru
---

## Проблема
...

## Контекст
...

## Решение
...

## Инсайт
...

## Источники
- [Название](url)
\`\`\`

Верни только markdown файл, без дополнительных комментариев.`;
}

export function buildBlogPromptEn(ruContent: string, input: PostInput, date: string): string {
  const styleContext = loadStyleContext("blog_en");

  return `You are a translator for a technical blog about context engineering.

${styleContext}

---

## Task
Translate this Russian blog post to English.

## Requirements:
- Natural English, not literal translation
- Keep technical terms accurate
- Same structure: Problem → Context → Solution → Insight
- Preserve markdown formatting and code examples
- Update lang: ru to lang: en in frontmatter
- Keep the same tags
- NO motivational tone
- NO author signature

## Russian article:
${ruContent}

Return only the translated markdown file, no additional comments.`;
}
