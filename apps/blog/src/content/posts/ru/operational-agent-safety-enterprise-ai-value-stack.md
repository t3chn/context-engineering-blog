---
title: "Operational Agent Safety и enterprise value stack для AI"
description: "Agent safety в enterprise всё больше похожа на инфраструктурную гигиену: узкие identities, approvals, connector boundaries, verification и recovery paths."
date: 2026-05-05
tags: ["context-engineering", "agents", "security", "enterprise-ai"]
lang: ru
---

Самый полезный enterprise-фрейм для agent safety сейчас не абстрактный AI risk.

Это инфраструктурная гигиена для агентов, которые пользуются инструментами.

Как только агент может читать файлы, вызывать connectors, обновлять тикеты, запускать jobs, отправлять сообщения или трогать production data, главный вопрос меняется. Уже недостаточно спрашивать: "модель достаточно умная?" Нужно спрашивать: от чьего имени действует агент, что он может трогать, когда нужен human approval, как мы проверяем результат и как восстанавливаемся, если действие оказалось неправильным?

Именно эта поверхность будет важнее всего для enterprise deployments в 2026.

## Problem

Многие agent deployments начинаются с model-first мышления.

Выбрать модель. Добавить tools. Подключить Slack, GitHub, Google Drive, Jira, email, cloud APIs. Потом попросить агента делать полезную работу.

Опасная часть в том, что это выглядит как product integration, но ведет себя как infrastructure. Connector token может читать слишком много. Write-capable integration может изменить не ту систему. Prompt injection может повлиять на tool call. Слишком широкая cloud identity может превратить локальную ошибку в production incident. Backup path может принадлежать той же identity, которая нанесла ущерб.

Enterprise failure mode редко звучит как "у модели было странное мнение". Обычно всё проще:

- identity была слишком широкой
- connector boundary был неясным
- approval threshold был слишком низким
- verification layer поверил отчету самого агента
- recovery path не был изолирован

Это обычная systems engineering проблема. Агенты просто ускоряют ошибку.

## Context

Официальные рекомендации model providers и cloud providers сходятся к одной форме.

Anthropic в материалах Claude Code делает акцент на read-only defaults, permissions, sandboxing, hooks, MCP controls и telemetry. OpenAI в guidance для agents и apps говорит про approvals, structured outputs, app RBAC, connector controls и compliance logs. Cloud guidance от AWS, Google Cloud и Azure снова и снова возвращается к least privilege, workload identities, manual approvals для sensitive changes и protected recovery paths.

Паттерн устойчивый: policy, approval, verification и recovery должны жить вне reasoning loop самой модели.

Экономика говорит о том же. Enterprise AI value не появляется только от выбора модели. Дифференциаторы ближе к workflow redesign, senior ownership, validation processes, KPI tracking, technology foundations и implementation capacity. Поэтому вокруг серьезного enterprise adoption так много AI services, forward-deployed engineering и systems integration.

Модель является частью stack. Но не всем stack.

## Solution

Практический enterprise agent stack требует пять контролей до production trust.

### 1. Узкие workload identities

Не давайте агенту platform-wide token.

Нужна отдельная identity на workflow, environment и class of action. Read-only analysis agent не должен делить identity с deployment agent. Staging workflow не должен переиспользовать production credentials. Connector для поиска документов не должен одновременно отправлять внешние сообщения.

Short-lived credentials и workload federation лучше static secrets. Fine-grained tokens лучше omnibus tokens. Policy-as-code лучше ручных исключений, спрятанных в admin console.

Первый safety-вопрос для любого агента: какой identity он пользуется, когда действует?

### 2. Tiered approval policy

Approvals должны зависеть от действия, а не применяться ко всему подряд.

Если каждое безопасное действие требует подтверждения, операторы учатся нажимать approve автоматически. Если ни одно рискованное действие не требует подтверждения, агент становится тихим change engine.

Более рабочая матрица простая:

- reads внутри sandbox обычно могут выполняться автоматически
- writes внутри объявленного scope могут выполняться после verification
- destructive actions требуют approval
- production deployment требует approval
- external communication требует approval
- privileged role activation требует approval
- finance, legal и customer-impacting actions требуют approval

Это надежнее, чем спрашивать, "доверяем ли мы модели". Trust здесь не чувство. Это policy boundary.

### 3. Connector isolation

Каждый connector нужно считать отдельной trust zone.

У connector должен быть purpose, permission set, network boundary там, где это нужно, и audit trail. Read-capable и write-capable connectors лучше разделять. Knowledge retrieval не должен автоматически означать action authority. Plugin не должен наследовать доверие только потому, что основной агент доверенный.

Практическое правило: one connector, one boundary, one job.

Если агент может искать файлы, обновлять тикеты, отправлять сообщения и деплоить код через одну credential surface, blast radius уже слишком большой.

### 4. Verification before side effects

Agent output не является evidence.

Verification layer не должен спрашивать у агента, получилось ли у него. Он должен независимо проверить результат.

Хорошая verification начинается с малого:

- schema checks
- allowed-path checks
- dry-runs
- tests
- policy hooks
- diff review для risk changes
- receipts для tool calls и решений

Для coding agents это значит: implementer не должен сам оценивать свою работу. Для business-process agents это значит: tool call не становится корректным только потому, что модель уверенно его объяснила.

### 5. Recovery paths, которые агент не может уничтожить

Recovery - это safety control, а не ops appendix.

Identity, которая выполняет production work, не должна владеть backup deletion, retention shortening или recovery-vault administration. Если одна compromised agent identity может повредить primary state и стереть backups, система не agent-safe.

Более сильный паттерн: isolated backup authority, immutable или guarded vaults, restore drills и понятные rollback procedures.

Agent systems ошибаются быстро. Recovery должен быть медленнее, уже и сложнее для tampering.

## Enterprise value stack

Это меняет то, как enterprise стоит думать про AI investment.

В ближайшей перспективе выигрывать будут не команды, которые гонятся за каждым benchmark movement. Выигрывать будут команды, которые строят надежный operating loop вокруг моделей:

```text
model -> policy -> approval -> connector boundary -> verification -> receipt -> recovery
```

Модель создает candidate actions. Окружающая система решает, разрешены ли эти действия, одобрены ли они, корректны ли они, наблюдаемы ли они и можно ли их откатить.

Это и есть enterprise value stack.

Эта же оптика объясняет developer-tooling market. Claude Code важен не только потому, что модель способная, а потому что вокруг продукта накапливаются permissions, sandboxing, MCP, SDKs, observability и workflow controls. PlugMem интересен, потому что memory выносится за пределы raw context window в структурированный module. RunTrim интересен, потому что ставит control layer перед coding-agent runs.

Сигнал категории один и тот же: ценность не только в model intelligence. Ценность в системе вокруг агента.

## Practical roadmap

Для первого production agent pilot порядок должен быть консервативным.

Первый месяц:

- инвентаризировать agents, tools, connectors и identities
- сделать новых agents read-only by default
- разделить read и write connectors
- требовать approval для destructive actions
- включить central logging

Первый квартал:

- заменить long-lived secrets на workload identities или fine-grained tokens
- добавить verification gates перед writes
- изолировать high-risk connectors
- определить approval matrix
- описать restore paths

Второй квартал:

- добавить backup isolation
- провести restore drills
- ревьюить permissions drift
- добавить cost и adoption telemetry
- измерять human review load и rework reduction

Только после этого model optimization становится главным рычагом.

## Insight

Agent safety всё меньше похожа на исследовательский лозунг и всё больше похожа на production infrastructure.

Полезный вопрос не в том, рискованны ли agents вообще. Полезный вопрос в том, есть ли у конкретного агента narrow identity, явные approval thresholds, isolated connectors, independent verification, полные logs и recovery path, который он не может уничтожить.

Это минимальный бар для enterprise agent work.

Сильные команды не будут считать это бюрократией. Они будут считать это тем, что позволяет агентам делать реальную работу, не превращая каждое действие в упражнение на доверие.

## Sources

- [Claude Code](https://github.com/anthropics/claude-code)
- [Claude Code docs](https://code.claude.com/docs/en/overview)
- [Claude Code changelog](https://code.claude.com/docs/en/changelog)
- [Claude Code sandboxing](https://www.anthropic.com/engineering/claude-code-sandboxing)
- [RunTrim repo](https://github.com/michelpronkk-oss/rtrim)
- [RunTrim site](https://www.runtrim.com/)
- [PlugMem repo](https://github.com/TIMAN-group/PlugMem)
- [PlugMem paper](https://arxiv.org/abs/2603.03296)
- [PlugMem OpenReview entry](https://openreview.net/forum?id=J74M9PYORo)
- [Sequoia talk with Boris Cherny](https://www.youtube.com/watch?v=SlGRN8jh2RI)
