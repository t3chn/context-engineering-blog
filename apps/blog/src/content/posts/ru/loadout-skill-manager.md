---
title: "Loadout: менеджер зависимостей для AI-скиллов"
description: "Как решить проблему дрейфа skills в AI-агентах. Manifest + lock + symlinks — паттерн из пакетных менеджеров для управления контекстом."
date: 2025-01-22
tags: ["context-engineering", "agents", "skills", "tooling"]
lang: ru
---

## Проблема

Скиллы для AI-агентов дрейфуют.

Типичный сценарий: есть центральный репозиторий со skills для Codex CLI или Claude Code. Начинаешь новый проект — копируешь нужные skills в `.codex/skills/`. Через месяц работы они неузнаваемы: локальные правки, адаптации под проект, исправления багов.

Проблемы накапливаются:

- Улучшения не возвращаются в источник
- Разные проекты расходятся
- Нет способа обновить skill без потери локальных изменений
- Каждый клиент (Codex vs Claude) — своя структура и UX

Это та же проблема, которую решают npm, cargo и poetry для кода. Только для skills её никто не решал.

## Контекст

Почему это важно для context engineering?

Skills — это исполняемый контекст. Не просто текст для модели, а инструкции, которые агент выполняет автономно. Качество skills напрямую влияет на качество работы агента.

Когда skills дрейфуют:

- Теряется консистентность между проектами
- Невозможно воспроизвести результат ("у меня работало")
- Улучшения изолируются вместо распространения

Пакетные менеджеры решили эту проблему для кода десятилетия назад. Паттерн manifest + lock обеспечивает:

- Декларативность: что хотим vs что имеем
- Воспроизводимость: pinned версии
- Обновляемость: upgrade без потери контроля

## Решение

### Manifest + Lock

Loadout использует знакомый паттерн:

**Manifest** (`loadout.json`) — что хотим:

```json
{
  "schema_version": 1,
  "primary_source": "primary",
  "sources": {
    "primary": {
      "url": "https://github.com/acme/skills",
      "ref": "main"
    }
  },
  "targets": {
    "codex": { "skills": ["pdf-processing", "code-review"] },
    "claude": { "skills": ["pdf-processing"] }
  }
}
```

**Lock** (`loadout.lock.json`) — что имеем (pinned):

```json
{
  "schema_version": 1,
  "sources": {
    "primary": { "pinned_sha": "0123456789abc..." }
  }
}
```

Оба файла коммитятся в git. Воспроизводимость гарантирована.

### Symlinks вместо копий

Ключевое решение — не копировать skills, а создавать symlinks:

```
.codex/skills/_loadout__pdf-processing → .codex/.loadout/sources/primary/codex/pdf-processing
```

Почему это важно:

- Правишь skill в проекте → правишь в клоне source repo
- `git push` из клона → улучшения возвращаются в источник
- Нет дрейфа: один источник правды

Source repo клонируется в `.codex/.loadout/sources/` (gitignored). Symlinks — managed, с префиксом `_loadout__` для изоляции от ручных skills.

### Multi-source с trust gate

Можно подключать сторонние источники:

```bash
loadout source add contrib --url https://github.com/community/skills --ref main
loadout source trust contrib --yes  # Явное подтверждение
loadout add --target codex contrib:special-formatter
```

Новые sources по умолчанию untrusted. Операции блокируются с ошибкой `SOURCE_UNTRUSTED` до явного подтверждения. Supply-chain safety из коробки.

### Agent-first UX

Loadout спроектирован для агентов, не для людей:

- JSON output по умолчанию (машиночитаемо)
- Нет интерактивных промптов (все inputs через args)
- Идемпотентные операции (запуск дважды = запуск один раз)
- Стабильные error codes (`SKILL_NOT_FOUND`, `SOURCE_UNTRUSTED`)
- Детерминистический поиск (лексический scoring, не LLM)

```bash
# Поиск skills
loadout suggest --target codex --query "pdf" --limit 10

# Добавление
loadout add --target codex pdf-processing image-processing

# Статус
loadout status --target codex
```

Агент вызывает CLI, парсит JSON, показывает пользователю отформатированный результат. Протокол описан в Agent Playbook.

## Инсайт

Dependency management — решённая проблема. npm, cargo, poetry работают десятилетиями. Паттерн manifest + lock + resolver универсален.

Skills для AI-агентов — те же dependencies. Они влияют на поведение системы, должны версионироваться и обновляться контролируемо.

Loadout не изобретает новое. Он применяет проверенный паттерн к новой области: управление контекстом для AI-агентов.

Интересный момент: symlinks вместо копий. В отличие от классических пакетных менеджеров, skills часто нужно дорабатывать на месте. Symlink позволяет редактировать и сразу пушить улучшения обратно в source. Это не баг — это фича.

Когда смотришь на проблему дрейфа skills как на проблему dependency management, решение становится очевидным. Manifest декларирует intent. Lock фиксирует state. Symlinks обеспечивают flow улучшений в обе стороны.

## Источники

- [Loadout на GitHub](https://github.com/t3chn/loadout)
