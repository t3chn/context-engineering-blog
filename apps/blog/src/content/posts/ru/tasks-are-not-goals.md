---
title: "Tasks Are Not Goals"
description: "Задача говорит агенту, что изменить. Цель должна также нести intent, границы, stop conditions и evidence."
date: 2026-05-22
tags: ["context-engineering", "agents", "workflow", "verification"]
lang: ru
---

Задача - полезная ручка. Но это еще не достаточный контекст, чтобы отдавать работу агенту.

"Почини export bug" звучит понятно ровно до момента, когда агент начинает заполнять пропуски сам. Какой export path считается source of truth? Какая роль пользователя важна? Баг в API, UI, очереди или data contract? Можно ли трогать migrations? Нужно ли сохранять текущий формат файла? Что будет доказательством, что баг действительно исправлен?

Человек часто держит этот контекст в голове. Агент обычно нет. Когда задача тонкая, агент достраивает недостающее из repo, последнего чата, имен файлов, формы тестов и всего, до чего может дотянуться. Часть выводов будет правильной. Часть - нет. Проблема в том, что в итоговом diff оба варианта могут выглядеть одинаково уверенно.

Вот failure mode, который меня волнует: видимая задача реальна, но execution boundary отсутствует.

## Тонкая задача

Issue tracker хорошо работает как inventory. Он хуже работает как execution context.

Обычный task title отвечает на один вопрос:

```text
Какое движение мы хотим?
```

Для агентной работы этого мало. Агенту также нужно знать:

- зачем существует изменение;
- какой source of truth побеждает, если файлы расходятся;
- какие части системы можно менять;
- что явно out of scope;
- когда нужно остановиться, а не угадывать;
- какое evidence доказывает результат;
- что остается непроверенным в handoff.

Без этих границ задача превращается в приглашение оптимизировать visible completion. Агент может сделать diff, обновить тесты, написать аккуратный summary и все равно промахнуться мимо цели.

Сигнал реален: файлы изменены, тесты запущены, output есть.

Вывод не доказан: это еще не значит, что цель удовлетворена.

## Цель несет контракт

Я использую слово "goal" для маленького операционного контракта вокруг задачи.

Это не обязана быть тяжелая спецификация. Но goal должен делать работу inspectable до и после выполнения. Полезный goal packet говорит:

```text
Goal:
Why:
Sources of truth:
Allowed changes:
Out of scope:
Stop if:
Evidence:
Handoff:
```

Ценность не в шаблоне. Ценность в том, что недостающий контекст приходится вынести наружу.

Например, задача:

```text
Add CSV export to the customers table.
```

Этого недостаточно. Goal packet может добавить:

```text
Goal:
Add a CSV export for the existing customers table.

Why:
Support internal account review without giving reviewers database access.

Sources of truth:
The existing customers table columns in the API response are authoritative.
Do not infer private fields from database schema names.

Allowed changes:
Frontend table toolbar, existing API route, tests for exported columns.

Out of scope:
New permissions model, background jobs, analytics events, schema migrations.

Stop if:
The current API response does not include a required field.
Export requires exposing fields that are not already visible in the UI.

Evidence:
Unit test for exported headers and escaping.
Manual browser check on the customers table.
Note any field intentionally excluded.

Handoff:
List files changed, commands run, and what was not tested.
```

Теперь у агента есть не только task title. У него есть граница действия и граница доверия.

## Stop conditions - часть работы

Agent autonomy становится хуже, когда единственный default - продолжать.

Хороший goal packet содержит stop conditions, потому что часть неопределенности нельзя решать реализацией. Если задача пересекает authentication, billing, migrations, data retention, destructive operations или чужие незакоммиченные изменения, правильное действие может быть остановиться и явно показать blocker.

Это не недостаток автономности. Это форма автономности, которая нужна в shared codebase.

Примеры:

- Stop if fix requires changing a public API contract.
- Stop if existing uncommitted edits overlap the target files.
- Stop if verification depends on a secret or live credential that is not available.
- Stop if the issue requires a migration but the goal did not authorize schema changes.
- Stop if two local documents disagree and neither is marked as authoritative.

Такие строки выглядят скучно. Они предотвращают дорогие ошибки.

То же самое относится к non-goals. "Do not rewrite the table component" - не micromanagement, если реальная цель в двухстрочном export fix. "Do not touch billing policy" - не бюрократия, если задача живет рядом с billing code. Границы уменьшают search space. Еще они удешевляют review, потому что reviewer может проверить, остался ли агент внутри разрешенной области.

## Evidence - граница завершения

Фраза "готово" слишком расплывчата для агентной работы.

Для маленького code change evidence может быть таким:

- failing test, который воспроизвел баг;
- passing test после фикса;
- точная команда, которая запускалась;
- screenshot для UI-изменения;
- file reference для source of truth;
- короткий список того, что не проверялось.

Для research или documentation задачи evidence будет другим:

- source URLs;
- local file paths;
- command output;
- version numbers;
- date of observation;
- unresolved claims.

Формат вторичен. Важно, чтобы evidence было названо до начала работы, а не придумано после появления diff.

Если evidence определяется поздно, агент может выбрать proof, который лучше всего поддерживает уже сделанный output. Если evidence определяется заранее, output должен встретиться с целью.

Это граница между "я что-то изменил" и "цель достаточно удовлетворена для handoff".

## Memory не заменяет goal

Более длинная agent memory помогает с continuity. Она также может прятать отсутствующий контекст.

Если агент помнит, что "в этом repo обычно избегают migrations" или "здесь предпочитают small diffs", это полезно. Но memory не должна молча подставлять permission boundary. Если в текущей работе нельзя делать migrations, это должно быть написано в goal packet. Если source of truth - конкретный файл, его нужно назвать. Если existing dirty state нельзя трогать, это current constraint, а не черта характера repo.

Memory - подсказка. Goal - контракт на этот run.

Это важно, когда работа переходит между людьми и агентами. Человек может спросить: "Почему здесь остановились?" Ответ не должен быть "потому что агент почувствовал это из старого контекста". Ответ должен быть виден в packet:

```text
Stop if verification requires live credentials.
```

или:

```text
Out of scope: schema changes.
```

Inspectable boundaries лучше remembered preferences.

## Сдвиг

Мне все еще нужны tasks. Это нормальная единица для backlog inventory, triage и prioritization.

Я не хочу, чтобы тонкие tasks были единицей autonomous execution.

Для этого лучше подходит goal packet: достаточно маленький, чтобы его быстро написать; достаточно конкретный, чтобы ограничить агента; достаточно явный, чтобы потом проверить. Он должен говорить, что делаем, зачем это существует, где можно двигаться, где нужно остановиться и какое evidence считается достаточным.

Это меняет форму delegation.

Вместо:

```text
Here is a task. Go solve it.
```

handoff становится таким:

```text
Here is the goal.
Here is the boundary.
Here is the source of truth.
Here is when to stop.
Here is the evidence I expect.
```

Это не делает агентную работу идеальной. Это делает claim inspectable.

Агент все еще может ошибиться. Goal может быть слабым. Evidence может пропустить edge case. Но review больше не начинается с polished summary и diff. Оно начинается с видимого контракта:

```text
Did the work stay inside the goal?
Did it stop where it should have stopped?
Does the evidence match the claim?
What risk remains?
```

Вот практическая разница между task и goal.

## Попробуй на одной задаче

Возьми одну задачу, которую обычно отдал бы агенту, и перепиши ее как goal packet до того, как агент тронет repo.

Если хочется сравнить живые примеры, короткие заметки и продолжение разборов я веду в [@ctxtdev в Telegram](https://t.me/ctxtdev). Хороший пример маленький: один task title, source of truth, что агенту можно менять, где он должен остановиться и какое evidence сделает результат достаточно доверенным.

Для code changes, где нужен более строгий contract-first путь, рядом лежит [Signum](https://github.com/heurema/signum). Это больше, чем требуется этой статье, но направление то же: не давать агенту угадывать definition of done.
