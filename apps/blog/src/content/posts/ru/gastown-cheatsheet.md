---
title: "Gas Town: шпаргалка по мульти-агентному оркестратору"
description: "Справочник по Gas Town — системе параллельного управления 20-30 Claude Code агентами. Команды, концепции, воркфлоу."
date: 2026-01-24
tags: ["context-engineering", "agents", "tooling", "claude-code"]
lang: ru
---

Gas Town — оркестратор от Steve Yegge для параллельного управления десятками Claude Code агентов. Построен на Git worktrees и Beads для сохранения состояния между перезапусками.

## Терминология (Mad Max universe)

| Термин         | Что это                                                           | Аналог       |
| -------------- | ----------------------------------------------------------------- | ------------ |
| **Mayor** 🎩   | Главный координатор. Говоришь ему что строить — он раздаёт работу | PM/Tech Lead |
| **Polecat** 🦨 | Воркер-агент. Появляется, делает задачу, исчезает                 | Junior Dev   |
| **Rig** 🏗️     | Контейнер проекта. Оборачивает git repo + управляет агентами      | Project      |
| **Crew** 👤    | Твоё персональное рабочее пространство внутри Rig                 | Workspace    |
| **Convoy** 🚚  | Пачка задач (beads), назначенных агентам                          | Sprint/Batch |
| **Town** 🏘️    | Корневая директория (~gt/) со всеми проектами                     | Monorepo     |
| **Hook** 🪝    | Git worktree для персистентного хранения состояния агента         | State Store  |
| **Refinery**   | Координатор merge-операций                                        | CI/CD        |
| **Witness**    | Мониторит проблемы, фиксит issues                                 | QA           |
| **Deacon**     | Maintenance операции                                              | DevOps       |

## Установка

```bash
# Prerequisites
brew install go@1.23 git sqlite3 tmux
# Beads (task tracking)
# следуй инструкциям https://github.com/steveyegge/beads

# Gas Town
brew tap steveyegge/gastown && brew install gt

# Инициализация
gt install ~/gt --git
cd ~/gt

# Добавить проект
gt rig add myproject https://github.com/you/repo.git

# Создать workspace
gt crew add yourname --rig myproject

# Запустить Mayor
gt mayor attach
```

## Ключевые команды

### Workspace

```bash
gt install <path>           # Инициализация Town
gt rig add <name> <repo>    # Добавить проект
gt rig list                 # Список проектов
gt crew add <name> --rig <rig>  # Создать Crew
```

### Агенты

```bash
gt agents                   # Активные агенты
gt mayor attach             # Запустить Mayor сессию
gt mayor start --agent auggie  # Mayor с конкретным runtime
gt prime                    # Восстановление контекста (внутри сессии)
gt sling <bead-id> <rig>    # Назначить задачу агенту
gt sling <id> <rig> --agent cursor  # С конкретным runtime
```

### Convoy (пачки задач)

```bash
gt convoy create <name> [issues]  # Создать convoy
gt convoy list                    # Список convoys
gt convoy show [id]               # Детали convoy
gt convoy add <convoy-id> <issue-id...>  # Добавить issues
```

### Конфигурация

```bash
gt config show                    # Текущие настройки
gt config agent set <name> "<cmd>"  # Добавить агента
gt config default-agent <name>    # Default runtime
```

### Beads интеграция

```bash
bd formula list         # Список формул
bd cook <formula>       # Выполнить формулу
bd mol pour <formula>   # Создать trackable instance
bd mol list             # Активные instances
```

## Воркфлоу

### Через Mayor (рекомендуется)

```bash
gt mayor attach
# Описываешь Mayor'у что хочешь построить
# Он создаёт convoy, раздаёт работу Polecats
# Следишь через gt convoy list
```

Mayor абстрагирует сложность. Ты говоришь с одним "экспертом", он управляет армией.

### Manual режим

```bash
# Создать convoy
gt convoy create feature-x issue-1 issue-2

# Назначить работу
gt sling issue-1 myproject
gt sling issue-2 myproject

# Мониторить
gt convoy show
gt agents
```

## Поддерживаемые runtimes

Встроенные: `claude`, `gemini`, `codex`, `cursor`, `auggie`, `amp`

Настройка в `settings/config.json` каждого rig.

Для Codex добавить в `~/.codex/config.toml`:

```toml
project_doc_fallback_filenames = ["CLAUDE.md"]
```

## Предупреждения

### Стоимость

Ожидай 10x стоимость токенов vs обычная Claude Code сессия. 60 минут ≈ $100.

### YOLO mode

Gas Town работает автономно:

- Пушит branches в GitHub
- Создаёт PR
- Может мержить PR даже с failing tests

### Безопасность

Для production codebases нужны guard rails. Держи force-push наготове.

## Архитектурные принципы

### GUPP (Git Up, Pull, Push)

Детерминированные handoffs через git, не LLM-решения о переходах фаз.

### External State

Beads хранит task tracking вне context window агента. Нет pollution от role prompts.

### Git Isolation

Каждый агент = свой Git worktree. Нет shared-state corruption от крашей.

### Parallel Execution

Задачи выполняются параллельно через 20-30 инстансов, не последовательные фазы.

## Известные проблемы

- Auto-merge broken tests в main
- Непредсказуемое удаление кода ("murderous Deacon")
- Требуются force pushes для recovery
- Высокий token burn rate

Gas Town — мощный, но сырой. Подходит для новых проектов с правильными safeguards, не для established repositories.

## Источники

- [Gas Town GitHub](https://github.com/steveyegge/gastown)
- [Steve Yegge — Welcome to Gas Town](https://steve-yegge.medium.com/welcome-to-gas-town-4f25ee16dd04)
- [DoltHub — A Day in Gas Town](https://www.dolthub.com/blog/2026-01-15-a-day-in-gas-town/)
- [GasTown and the Two Kinds of Multi-Agent](https://paddo.dev/blog/gastown-two-kinds-of-multi-agent/)
