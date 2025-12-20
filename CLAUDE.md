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

## Content Philosophy: Context-First Thinking

**Формат**: Проблема → Контекст → Решение → Инсайт

Каждый пост отвечает на 4 вопроса:
1. **Проблема** — что не работает?
2. **Контекст** — почему это важно/сложно?
3. **Решение** — как подойти?
4. **Инсайт** — что изменилось в понимании?

**Skill**: `.claude/skills/ceb-content/SKILL.md`

### Telegram Posts (@ctxtdev)
- 3-7 коротких абзацев по 1-3 строки
- Чистый текст + минимум эмодзи (max 1-2)
- Хештеги в конце (#contextengineering #llm)
- БЕЗ подписи автора
- БЕЗ bullet-списков
- БЕЗ мотивационного тона

### Blog Articles
- Структурированные статьи: Проблема → Контекст → Решение → Инсайт
- RU основной → EN перевод
- 500-1500 слов
- Код примеры где уместно
- Ссылки на источники в конце

## Key Files

| Файл | Назначение |
|------|------------|
| `.claude/skills/ceb-content/SKILL.md` | Skill для генерации контента |
| `.claude/skills/ceb-content/references/` | Гайды по стилю и платформам |
| `apps/cli/src/prompts/telegram.ts` | Промпт для генерации TG постов |
| `apps/cli/src/prompts/blog.ts` | Промпт для генерации статей |
| `apps/cli/src/providers/` | AI провайдеры |
| `apps/blog/src/content/posts/` | Markdown посты |
| `.env` | API ключи (НЕ коммитить!) |

## Deployment

### URLs
- **Production**: https://ctxt.dev
- **Cloudflare**: https://ctxt-dev-35d.pages.dev
- **GitHub**: https://github.com/t3chn/context-engineering-blog

### Автодеплой
Каждый push в `main` автоматически деплоит на Cloudflare Pages через GitHub Actions.

```bash
# Ручной деплой (если нужно)
pnpm --filter @ceb/blog build
wrangler pages deploy apps/blog/dist --project-name=ctxt-dev
```

### GitHub Secrets (Settings → Secrets → Actions)
| Secret | Описание |
|--------|----------|
| `CLOUDFLARE_API_TOKEN` | API токен с правами Pages |
| `CLOUDFLARE_ACCOUNT_ID` | `6745078205fd18255ccc6dd791de78cb` |

### Cloudflare Pages
- **Project**: `ctxt-dev`
- **Account**: inskricion@gmail.com
- **Dashboard**: https://dash.cloudflare.com → Pages → ctxt-dev

### Добавление нового домена
1. Cloudflare API или Dashboard → Pages → ctxt-dev → Custom domains
2. Добавить DNS запись:
   ```
   Type: CNAME
   Name: @ (или subdomain)
   Target: ctxt-dev-35d.pages.dev
   Proxy: On
   ```

### Создание API токена Cloudflare
1. https://dash.cloudflare.com/profile/api-tokens
2. Create Token → "Edit Cloudflare Workers" template
3. Permissions: Account/Cloudflare Pages/Edit
4. Добавить в GitHub: `gh secret set CLOUDFLARE_API_TOKEN`

## Security

### Защита от утечки секретов
- **Pre-commit hook**: `.husky/pre-commit` — блокирует коммиты с API ключами
- **CI**: `gitleaks-action` сканирует на каждый push
- **gitignore**: `.env`, `.env.local` исключены

### Паттерны секретов (блокируются)
- `sk-ant-*` (Anthropic)
- `sk-*` (OpenAI)
- `AIza*` (Google)
- Telegram bot tokens
- AWS/GitHub tokens

### Если секрет утёк
1. Немедленно ротировать ключ в соответствующем сервисе
2. Проверить git history: `git log -p --all -S 'SECRET_PATTERN'`
3. Если в истории — использовать `git filter-branch` или BFG Repo-Cleaner

## Conventions

- Язык кода: TypeScript (strict mode)
- Стиль: ESLint + Prettier
- Коммиты: Conventional Commits (`feat:`, `fix:`, `post:`)
- Ветки: main (production), feature/* (разработка)

## Skills Reference

| Задача | Skill |
|--------|-------|
| **Генерация контента** | `.claude/skills/ceb-content` |
| Frontend/Astro | `vibe-coder:frontend-design` |
| CLI разработка | `vibe-coder:cli-tool` |
| Telegram бот | `vibe-coder:telegram-bot` |
| Code review | `vibe-coder:code-review` |
| Тестирование | `vibe-coder:testing-core` |
