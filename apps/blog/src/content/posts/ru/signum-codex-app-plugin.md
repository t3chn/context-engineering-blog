---
title: "Signum теперь устанавливается в Codex App как плагин"
description: "Что меняется, когда contract-first workflow становится не только Claude Code плагином, но и installable Codex App плагином."
date: 2026-05-08
tags: ["context-engineering", "codex", "agents", "verification", "signum"]
lang: ru
---

У AI-agent workflow есть скучная, но важная проблема: хороший процесс часто живет только в одном runtime.

Signum начинался как Claude Code plugin. Это было правильно для первого слоя: slash command, локальные артефакты, contract-first pipeline, proofpack. Но сам принцип не привязан к Claude Code. Если агент пишет код в Codex App, ему нужен тот же контекст: контракт до реализации, проверка после реализации, доказательства в файлах, а не "кажется, готово" в чате.

Последние изменения в Signum закрывают именно этот distribution gap: Signum теперь можно добавить в Codex App через Plugins UI.

## Что добавилось

В репозитории Signum появился полноценный Codex App install surface:

```text
.codex-plugin/plugin.json
.agents/plugins/marketplace.json
platforms/codex/.codex-plugin/plugin.json
platforms/codex/SKILL.md
platforms/codex/assets/signum-icon.png
```

Это не просто README-инструкция "скопируй prompt". Codex получает plugin manifest, marketplace metadata, skill entrypoint и UI metadata для карточки плагина.

Установка выглядит так:

```text
Plugins -> Add marketplace

Source: heurema/signum
Git ref: main
Sparse paths: leave blank
```

После этого в Plugins source dropdown появляется `Heurema`, а внутри него доступен `Signum`.

Для pinned installs документация указывает `v4.21.5` или более новый release tag. Для sparse checkout нужны `.agents/plugins` и `platforms/codex`; `.codex-plugin` нужен только для direct local-folder install.

## Почему это не просто порт

Плохой способ переносить agent workflow между runtime'ами - копировать длинный system prompt и надеяться, что модель вспомнит, как им пользоваться.

Signum делает другое. Codex skill описывает не стиль ответа, а workflow contract:

```text
CONTRACT -> EXECUTE -> AUDIT -> PACK
```

Ключевое правило осталось тем же: сначала определить correctness, потом писать код.

Codex в этом режиме становится orchestrator. Он должен:

- остановиться, если контракт слишком слабый;
- держать артефакты в `.signum/contracts/<contractId>/`;
- запускать deterministic checks до model review;
- считать внешние reviewer tools optional evidence, а не trust anchor;
- явно сказать, если claim не удалось проверить.

Для пользователя это важнее, чем сам факт "плагин появился в UI". Установка меняет adoption cost, но полезность держится на другом: workflow теперь находится рядом с агентом, который реально исполняет задачу.

## Проверка стала частью release surface

В Signum добавили отдельный guardrail:

```bash
bash tests/test-codex-plugin-metadata.sh
```

На текущем checkout он проходит 37 проверок из 37.

Проверяется не только наличие файлов. Тест валидирует, что:

- direct manifest называется `signum`;
- версия совпадает с release metadata;
- direct plugin указывает на `./platforms/codex/`;
- marketplace plugin указывает на non-empty `./platforms/codex`;
- marketplace source называется `heurema`, а display name - `Heurema`;
- install policy выставлена как `AVAILABLE`;
- authentication policy выставлена как `ON_INSTALL`;
- icon paths резолвятся;
- Codex skill действительно описывает contract-first pipeline и canonical artifact root.

Это правильная грань для plugin distribution. Если marketplace metadata сломана, пользователь не дойдет до самого workflow. Значит metadata нужно тестировать так же, как код.

## Что меняется для Context Engineering

Обычно context engineering обсуждают как prompt design. Здесь хороший контрпример.

Контекст для агента - это не только инструкция. Это install path, manifest, marketplace entry, skill boundary, artifact layout, validation script и docs, которые говорят одинаково.

Когда один и тот же workflow доступен в Claude Code и Codex App, появляется более честная проверка идеи. Если Signum работает только там, где автор вручную настроил окружение, это локальная привычка. Если его можно установить через plugin surface и проверить metadata тестом, это уже reusable capability.

Разница маленькая, но практичная:

- меньше ручной настройки;
- меньше скрытого знания в голове автора;
- меньше риска, что Codex получит устаревшую или неполную инструкцию;
- больше шансов, что proofpack workflow будет воспроизводимым.

## Инсайт

Agent workflow становится продуктом не тогда, когда у него появляется красивое описание.

Он становится продуктом, когда у него есть install boundary, проверяемая metadata и понятный runtime contract.

Signum в Codex App - это такой шаг. Не новый model trick, не новый reviewer, не еще один слой уверенности. Просто менее хрупкий способ доставить contract-first verification туда, где агент уже работает.

## Sources

- [Signum README](https://github.com/heurema/signum)
- [Signum Quickstart](https://github.com/heurema/signum/blob/main/QUICKSTART.md)
- [Signum changelog](https://github.com/heurema/signum/blob/main/CHANGELOG.md)
- [Codex plugin metadata test](https://github.com/heurema/signum/blob/main/tests/test-codex-plugin-metadata.sh)
