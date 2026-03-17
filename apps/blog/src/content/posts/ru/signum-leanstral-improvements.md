---
title: "Как формальный верификатор вдохновил 6 улучшений кодового аудита"
description: "Leanstral от Mistral -- агент для Lean 4 -- подсказал конкретные паттерны для Signum: policy scanner, typed diagnostics, параллельные repair lanes."
date: 2026-03-17
tags: ["context-engineering", "claude-code", "signum", "verification", "agents"]
lang: ru
---

Утренний дайджест принёс Leanstral -- open-source агент от Mistral для формальной верификации на Lean 4. Модель на 119B параметров, из которых активны только 6.5B, решает задачи доказательства теорем за 1/92 стоимости Claude Opus.

Сам Lean 4 мне не нужен. Но архитектура агента оказалась полезной: multi-attempt proof search, diagnostic feedback loop, structured verification -- паттерны, которые напрямую переносятся на кодовый аудит. За день я реализовал шесть из них в Signum v4.9.0.

## Что взял из Leanstral

Leanstral работает через MCP-сервер `lean-lsp-mcp`, который даёт агенту доступ к Language Server Protocol Lean 4. Пять фаз: Discovery (найти proof holes) -> Analysis (извлечь subgoals) -> Retrieval (поиск по Mathlib) -> Synthesis (подставить тактику) -> Diagnostic Feedback (ошибка -> корректировка).

Три паттерна оказались полезны для Signum:

**1. `lean_verify` -- верификация как отдельный шаг.** Lean проверяет не только "компилируется ли", но и "корректно ли используются аксиомы". В Signum аналогом стал policy scanner -- детерминистический grep на diff до LLM-ревью.

**2. `lean_multi_attempt` -- параллельные попытки.** Lean подставляет несколько тактик на одну позицию и сравнивает goal states. В Signum -- параллельные repair lanes с разными стратегиями фикса.

**3. Diagnostic feedback loop -- structured обратная связь.** Lean LSP возвращает типизированные ошибки, а не raw text. В Signum -- typed diagnostics от mechanic вместо flat boolean.

## Policy scanner: grep вместо LLM

Самое дешёвое улучшение. Между mechanic (lint/typecheck/tests) и code review появился Step 3.1.3 -- `lib/policy-scanner.sh`. Bash-скрипт, 195 строк, zero LLM cost.

Сканирует только addition lines в unified diff. 12 паттернов в трёх категориях:

- **Security** (CRITICAL): `eval`, `subprocess.call` с `shell=True`, `innerHTML`, SQL injection через конкатенацию, weak crypto (`md5`, `sha1`)
- **Unsafe** (MINOR): `TODO`/`FIXME`/`HACK`, `console.log`, `debugger`
- **Dependency** (MAJOR): новые записи в `package.json`, `Cargo.toml`, `pyproject.toml`, `go.mod` -- только в manifest-файлах

CRITICAL policy finding триггерит AUTO_BLOCK в synthesizer -- наравне с mechanic regressions.

Три дизайн-решения принял через arbiter panel (Codex + Gemini, 3/3 консенсус):

1. **Fail-closed** на missing patch (exit 1, не exit 0). Отсутствие патча -- pipeline integrity failure, а не "zero findings".
2. **Manifest-only** для dependency patterns. Без фильтра по имени файла ловятся README, тесты, комментарии.
3. **Curated sinks** вместо generic `exec`/`print`. Short list high-signal вызовов лучше, чем широкие regex с низким precision.

## Typed diagnostics: structured mechanic output

До v4.9 mechanic report был flat: `{lint: {status, exitCode, regression}, tests: {...}, hasRegressions: bool}`. Engineer в repair mode получал это как blob.

Теперь `lib/mechanic-parser.sh` выдаёт hybrid формат: summary per check всегда + per-file findings когда runner поддерживает structured output.

```json
{
  "checks": [
    {"id": "tsc", "category": "typecheck", "status": "fail",
     "baseline_status": "pass", "regression": true, "count": 3,
     "findings_available": true}
  ],
  "findings": [
    {"check_id": "tsc", "file": "src/foo.ts", "line": 42,
     "code": "TS2322", "message": "Type 'X' is not assignable to 'Y'",
     "origin": "structured"}
  ]
}
```

`origin` -- ключевое поле. `"structured"` = JSON output (ruff, eslint). `"stable_text"` = парсабельный текст (tsc, mypy). `"none"` = только summary. Gating и regression detection -- по summary. Findings -- repair hints для engineer, не source of truth.

Claude Opus поймал критический баг в первом же ревью: `|| true` после command substitution маскировал exit code, делая regression detection полностью нерабочей для всех 8 runners. Один символ ломал всю mechanic фазу. Iterative repair починил за одну итерацию.

## Parallel repair lanes

Самая сложная фича. Раньше repair loop -- последовательный: одна попытка фикса -> аудит -> следующая попытка. Теперь Step 3.6.2 спавнит два Engineer агента параллельно в git worktrees:

- **Lane A**: "Fix with minimal targeted changes. Patch only the specific lines."
- **Lane B**: "Fix by addressing the root cause. May touch more files."

Оба получают один `repair_brief.json`. Оба работают в изолированных worktrees, seeded от текущего best candidate. После завершения:

1. Mechanic + holdout на каждом lane
2. Score по формуле `iterationScore`
3. Full review panel только на winner
4. Если winner получает MAJOR+ -- review ещё и на runner-up

Вдохновлено `lean_multi_attempt`, который подставляет несколько тактик на одну позицию и сравнивает оставшиеся subgoals. Тот же принцип: explore solution space, select best, verify once.

## Остальные три

**Dynamic strategy injection.** Contractor классифицирует тип задачи (bugfix/feature/refactor/security) через keyword scan и генерирует `implementationStrategy` в контракте. Engineer читает как process guide: bugfix -> "reproduce bug with test first", security -> "find all occurrences, not just reported one". Informational only -- не блокирует pipeline.

**Context retrieval.** Новый Step 3.2.0 перед code review собирает: git history (последний коммит per file), issue refs (ID + title), project.intent.md. Всё это инжектится только в Claude reviewer -- Codex и Gemini остаются adversarially isolated. Цель: уменьшить false positives за счёт контекста "почему код такой".

**Approval UX.** Мелочь, но заметная: замена фрагментированных bash echo блоков на markdown-first display при утверждении контракта. Goal больше не обрезается, таблица компактная, warnings сгруппированы.

## Процесс

Каждая фича прошла через полный pipeline: arbiter panel -> signum contract -> engineer -> 3-model audit -> iterative repair -> proofpack. Из шести запусков только один получил AUTO_OK с первого прохода (dynamic strategy -- самая простая). Остальные потребовали 2-3 итерации.

Общий паттерн: первый проход Engineer'а проходит все AC, но code review находит баги -- от `|| true` маскировки exit code до race condition на shared paths в параллельных worktrees. Iterative repair чинит их за 1-2 итерации. Система работает как задумано: не gatekeeping, а convergence loop.

Весь день: 7 коммитов, ~1900 строк, 5 arbiter panels (Codex + Gemini, 4 из 5 -- unanimous consensus), 15+ multi-model review rounds. Начало -- одна строка из утреннего дайджеста.
