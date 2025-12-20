---
name: ceb-content
description: |
  Генерация контента для Context Engineering Blog в стиле Context-First Thinking.
  Use when: создание постов для Telegram (@ctxtdev), статей для блога (RU/EN),
  редактирование или улучшение существующего контента о context engineering.
  Triggers: "telegram post", "blog article", "статья", "пост", "контент",
  "context engineering", "напиши пост", "сгенерируй статью".
---

# Context Engineering Blog — Content Generation

## Загрузка контекста

1. Прочитай [references/TLDR.md](references/TLDR.md) — суть стиля
2. Загрузи [references/INDEX.json](references/INDEX.json) и выбери секции по задаче:
   - `telegram_post` → core + telegram
   - `blog_ru` → core + blog_ru + template
   - `blog_en` → core + blog_en
3. Примеры загружай из assets/ только если нужны

## Философия: Context-First Thinking

Каждый пост отвечает на 4 вопроса:

| Этап | Вопрос | Назначение |
|------|--------|------------|
| **Проблема** | Что пытаемся решить? | Крючок |
| **Контекст** | Почему это сложно/важно? | Глубина |
| **Решение** | Как подойти? | Практика |
| **Инсайт** | Что поняли нового? | Ценность |

## Быстрый старт

### Telegram пост

```
[Проблема — наблюдение или боль]

[Контекст — почему это важно]

[Решение или подход]

[Инсайт — что изменилось в понимании]

#contextengineering #llm
```

### Blog статья

```markdown
---
title: "..."
description: "..."
date: YYYY-MM-DD
tags: ["context-engineering", "..."]
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
```

## Чек-листы

### Pre-flight
- [ ] Определена конкретная проблема?
- [ ] Есть контекст (почему важно)?
- [ ] Решение практичное?
- [ ] Есть инсайт?

### Post-flight
- [ ] Telegram: чистый текст + минимум эмодзи?
- [ ] Хештеги в конце?
- [ ] Нет подписи автора?
- [ ] Нет мотивационного тона?

## Платформы

Детальные правила:
- Telegram: [references/TELEGRAM.md](references/TELEGRAM.md)
- Blog RU: [references/BLOG_RU.md](references/BLOG_RU.md)
- Blog EN: [references/BLOG_EN.md](references/BLOG_EN.md)

## Запрещено

- Чрезмерные эмодзи (max 1-2 на пост)
- Подпись автора
- CTA ("подписывайтесь", "читайте больше")
- Мотивационный тон
- Bullet-списки в Telegram (визуальный шум)
