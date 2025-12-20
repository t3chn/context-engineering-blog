# Context Engineering Blog

> Created: 2025-12-20

## Beads Workflow

При старте сессии используй скилл `beads-workflow` для:
1. `bd list --status in_progress` — показать текущую задачу
2. `bd ready` — если нет in_progress, выбрать из ready
3. Отслеживать прогресс через TodoWrite
4. При завершении — `bd close <id>` с причиной

## Project Overview

Автоматизированная система для ведения блога и Telegram канала о context engineering.

**Основной workflow:**
```
Ссылки + заметки → CLI (интерактив) → AI обработка →
  → Пост для Telegram (RU короткий)
  → Статья для блога (RU + EN полная)
  → Auto-commit & push
  → [--publish] Публикация в Telegram
```

## Структура проекта

```
context-engineering-blog/
├── .beads/                      # Task tracking
├── CLAUDE.md                    # AI context (этот файл)
├── apps/
│   ├── blog/                    # Astro сайт
│   │   ├── src/content/posts/   # Посты (ru/, en/)
│   │   └── astro.config.mjs
│   └── cli/                     # CLI инструмент
│       ├── src/
│       │   ├── prompts/         # Системные промпты
│       │   ├── providers/       # AI провайдеры (claude, openai, gemini)
│       │   ├── generators/      # Генераторы контента
│       │   └── publishers/      # Публикация в TG
│       └── package.json
├── packages/shared/             # Общие типы
├── .env.example
└── pnpm-workspace.yaml
```

## Технологии

- **Блог**: Astro 4 + Tailwind CSS + MDX
- **CLI**: TypeScript + Node.js + Commander + Inquirer
- **AI**: Claude / OpenAI / Gemini (выбор через конфиг)
- **Telegram**: grammy
- **Monorepo**: pnpm workspaces

## Content Generation Rules

### Telegram Posts (RU)
- Короткие инсайты (1-3 абзаца, max 4096 символов)
- Нативный стиль для TG
- Эмодзи уместно, но без перебора
- Хештеги в конце (#contextengineering #llm #ai)
- Ссылка на полную статью в блоге

### Blog Articles
- Структурированные статьи с заголовками
- RU основной язык → EN перевод
- Frontmatter: title, date, tags, description, lang
- Код примеры где уместно
- Ссылки на источники

## Key Files

| Файл | Назначение |
|------|------------|
| `apps/cli/src/prompts/telegram.ts` | Промпт для генерации TG постов |
| `apps/cli/src/prompts/blog.ts` | Промпт для генерации статей |
| `apps/cli/src/providers/` | AI провайдеры |
| `apps/blog/src/content/posts/` | Markdown посты |
| `.env` | API ключи (НЕ коммитить!) |

## Conventions

- Язык кода: TypeScript (strict mode)
- Стиль: ESLint + Prettier
- Коммиты: Conventional Commits (`feat:`, `fix:`, `post:`)
- Ветки: main (production), feature/* (разработка)

## Skills Reference

| Задача | Skill |
|--------|-------|
| Frontend/Astro | `vibe-coder:frontend-design` |
| CLI разработка | `vibe-coder:cli-tool` |
| Telegram бот | `vibe-coder:telegram-bot` |
| Code review | `vibe-coder:code-review` |
| Тестирование | `vibe-coder:testing-core` |
