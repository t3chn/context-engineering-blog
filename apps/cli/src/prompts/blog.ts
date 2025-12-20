import type { PostInput } from "@ceb/shared";

export function buildBlogPromptRu(input: PostInput, slug: string, date: string): string {
  const sources = input.sources?.length
    ? `\n\nИсточники для упоминания:\n${input.sources.map((s) => `- ${s}`).join("\n")}`
    : "";

  return `Ты — автор технического блога о context engineering и LLM.

Напиши статью для блога на русском языке на основе моих заметок.

## Требования:
- Структурированная статья с заголовками (## и ###)
- Информативный и технический стиль
- Примеры кода где уместно
- Ссылки на источники в конце
- Длина: 500-1500 слов

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

[содержание статьи]
\`\`\`

Верни только markdown файл, без дополнительных комментариев.`;
}

export function buildBlogPromptEn(ruContent: string, input: PostInput, date: string): string {
  return `You are a translator for a technical blog about context engineering and LLMs.

Translate this Russian blog post to English. Keep the same structure, code examples, and markdown formatting.

## Russian article:
${ruContent}

## Requirements:
- Natural English, not literal translation
- Keep technical terms accurate
- Preserve markdown structure and frontmatter
- Update lang: ru to lang: en in frontmatter
- Keep the same tags (transliterate if needed)

Return only the translated markdown file, no additional comments.`;
}
