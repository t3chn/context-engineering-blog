---
title: "AI-агентам нужны permission boundaries, а не личности"
description: "Большинство agent runtimes добавляют роли. punk исходит из другой идеи: доверие строится на boundaries, durable state и proof."
date: 2026-04-08
tags: ["contextengineering", "agents", "architecture", "verification"]
lang: ru
canonical_url: https://ctxt.dev/posts/ru/ai-agents-need-permission-boundaries/
---

## Проблема

Большинство agent tools путают orchestration с reliability. Они добавляют
новые роли, новых агентов, новые coordinator surfaces и больше shell theater.
Демо выглядит убедительнее. Саму систему доверять легче не становится.

Пока основную часть работы писал человек, это было терпимо. Оператор всё ещё
держал реальную модель задачи в голове, мог восстановить intent по diff и
докомпенсировать слабый процесс собственным judgment. Но как только генерация
кода стала дешёвой, быстрой и постоянной, эта страховка перестала масштабироваться.

Теперь bottleneck - не generation. Bottleneck - trust.

Именно поэтому самые интересные agent runtimes сегодня - не те, у которых
больше personalities. Интересны те, которые делают planning, execution и
verification разными типами authority.

В этом и состоит ставка [specpunk](https://github.com/heurema/specpunk),
который сейчас переформатируется в `punk`.

Проект прямо говорит, что это design reset, а не полировка уже запущенного
продукта. Он собирается заново вокруг более жёсткой формы: one CLI, one
vocabulary, one runtime и три canonical modes - `plot`, `cut`, `gate`.

И это важно потому, что эти modes - не style presets. Это permission
boundaries.

## Контекст

У многих agent systems базовая интуиция до сих пор одна и та же: лучшее
software delivery получится, если добавить больше orchestration surfaces.
Обычно схема выглядит знакомо:

- один агент планирует
- второй имплементирует
- третий ревьюит
- shell координирует
- chat transcript становится историей работы

Такой pipeline действительно может производить полезный output. Но он так же
легко производит confidence theater. Coordination - не то же самое, что ground
truth.

Если runtime не может ответить на четыре простых вопроса, это ещё не trust
system:

1. Что именно было approved?
2. Что реально запускалось?
3. Какое состояние authoritative сейчас?
4. Какой proof существует для финального decision?

Количество агентов не отвечает на эти вопросы. Количество ролей тоже.
Формально красивый shell - тоже нет. В лучшем случае эти вещи улучшают
throughput и ergonomics. В худшем - просто умножают ambiguity.

В этом и ловушка. Agent runtime оптимизирует видимую активность, а не
enforceable structure.

Если убрать theater, то trustworthy agent work требует более простого набора
примитивов, чем обычно показывают такие инструменты:

- approved intent
- bounded execution
- durable work state
- clear decision surface
- proof-bearing artifacts

Этот список важнее любого model roster. Агент может быть очень сильным и при
этом совершенно ненадёжным, если ему разрешено планировать, менять код и
валидировать собственный результат внутри одной размытой поверхности. Проблема
тут не только в bad code. Проблема в unfalsifiable process.

Человек-оператор не должен восстанавливать truth по prompts, shell chatter и
commit residue. У runtime уже должен быть на это явный ответ.

Именно здесь `punk` стартует с более сильной идеи, чем многие agent systems:

> Важнее shape of the runtime, чем число агентов внутри него.

## Решение

`specpunk` интересен не потому, что координирует каких-то особенных агентов.
Он интересен тем, что пытается зафиксировать правильную форму runtime.

В docs у проекта есть canonical object chain:

```text
Project
  -> Goal
    -> Feature
      -> Contract
        -> Task
          -> Run
            -> Receipt
            -> DecisionObject
            -> Proofpack
```

Это уже совершенно другой product claim, чем "мы управляем для вас swarm of
coding agents". Центр системы здесь не агент. Центр - artifact chain.

Такой выбор сразу меняет архитектурные последствия. Runtime пытается сохранить
continuity между попытками, retries, verification steps и дальнейшей
inspectability. `Feature` переживает одну implementation pass. `Contract`
явный. `Run` - это одна конкретная попытка. `DecisionObject` пишет только
`gate`. `Proofpack` становится финальным audit bundle.

Это architecture for reliability, а не architecture for chat.

Самая сильная идея текущего `punk` design - это split между двумя слоями:

- correctness substrate
- operator shell

Substrate владеет durable truth:

- project identity
- goal intake
- contract
- scope
- workspace isolation
- run state
- decision objects
- proof artifacts
- ledger

Shell владеет ergonomics:

- `punk init`
- `punk start`
- `punk go --fallback-staged`
- summaries
- blocked / recovery UX
- generated repo-local guidance

На словах это кажется очевидным, но большинство agent systems начинают
размывать эту границу почти сразу. Shell постепенно превращается в скрытый
policy engine. Safety semantics утекают в prompts. Формат ответа начинает
притворяться state. В итоге уже невозможно понять, какое поведение реально
enforced by the runtime, а какое просто предлагается интерфейсом.

`punk` пытается остановить этот drift заранее. Правило в architecture docs
простое и важное: shell может композиционно собирать substrate operations, но
не имеет права становиться second source of truth.

Именно такие правила удерживают инструмент честным по мере роста.

### `plot`, `cut`, `gate` как реальные boundaries

Три canonical modes легко неправильно прочитать, если привык к agent UIs.
`plot`, `cut` и `gate` нужны не для того, чтобы система выглядела cinematic.
Они разделяют authority.

- `plot` shape'ит work, inspect'ит repo, draft/refine'ит contracts
- `cut` выполняет bounded changes в isolated VCS context
- `gate` проверяет result, пишет final decision и выпускает proof

Docs прямо говорят: это hard permission boundaries, а не tone presets.

Это серьёзный architectural choice. Очень многие agent failures появляются как
раз тогда, когда planning, mutation и self-verification сливаются в один
conversation loop. Одна и та же поверхность интерпретирует intent, меняет код,
судит собственный результат и рассказывает историю успеха. Даже если финальный
ответ звучит аккуратно, trust boundary там слабая, потому что authority merged
at runtime level.

`punk` движется в обратную сторону. Только `gate` пишет final
`DecisionObject`. Только approved contracts должны попадать в `cut`. Event log
и derived views хранят runtime truth, а не shell summary. Вот как выглядят
permission boundaries на практике: не "agent A planner, agent B reviewer", а
реальные boundaries authority и ownership artifacts.

### Durable work state важнее, чем chat history

Ещё одна сильная линия в дизайне - work ledger. Большинство agent sessions
оставляют после себя плохую форму памяти:

- shell logs
- chat transcripts
- commits
- иногда branch name
- иногда PR

Этого хватает ровно до первого block, failure, supersession или handoff. После
этого все задают одни и те же вопросы: какой contract активен, какой был
последний run, verification blocked or escalated, и что делать дальше?

Если единственный ответ - "почитай последние экраны терминала", runtime слабый.
`punk` толкает систему к `WorkLedgerView`, который должен отвечать на эти
вопросы напрямую. Это правильное направление. Agents действительно нужен
контекст, чтобы действовать. Но операторам нужен durable work state, чтобы
работу продолжать.

И здесь снова повторяется тот же паттерн: inference заменяется explicit
structure.

## Инсайт

Важно не перепутать этот тезис с отказом от ergonomics. В `punk` docs есть ещё
одна сильная идея: one-face operator shell. Нормальный пользователь должен
уметь дать plain goal и получить в ответ один concise progress or blocker
summary плюс один obvious next step.

Это хороший UX. Но ценность такого shell определяется тем, что находится под
ним. Чистый shell полезен только тогда, когда underneath already exists a
substrate that knows what is authoritative. Иначе one-face UX превращается в
просто более красивый способ скрыть ambiguity.

Поэтому split между substrate и shell так важен. `punk` не отвергает
ergonomics. Он не позволяет ergonomics притворяться truth.

Самое интересное в `punk` - не то, что он когда-нибудь сможет orchestration
multiple models, councils или skill improvement through eval loops. Интересен
порядок операций. До любых higher-level features проект сначала пытается
зафиксировать runtime shape:

- one vocabulary
- explicit artifact chain
- bounded modes
- durable state
- proof before acceptance

Это правильный порядок. Если shape выбран неверно, все последующие фичи
унаследуют ambiguity. Councils превратятся в opinion aggregators вместо
structured advisory mechanisms. Skills станут prompt folklore вместо
evidence-backed overlays. Shell UX станет theater вместо control.

Если же shape выбран правильно, у всех следующих слоёв появляется что-то
твёрдое, к чему можно attach'иться.

Именно поэтому за `punk` интересно следить уже сейчас, даже в стадии rebuild.
Проект делает architectural claim, который стоило бы делать явно куда большему
числу agent tools:

> Надёжность приходит не от новых agent personalities. Она приходит от чётких
> boundaries между intent, execution, verification и proof.

Больше агентов не создаёт ground truth. Больше ролей не создаёт safety. Если
planning, execution и verification не разделены hard boundaries, runtime
масштабирует не trust, а ambiguity.

В этом и состоит настоящий смысл этого design reset.

## Источники

- [specpunk on GitHub](https://github.com/heurema/specpunk)
- [punk Vision](https://github.com/heurema/specpunk/blob/main/docs/product/VISION.md)
- [punk Architecture](https://github.com/heurema/specpunk/blob/main/docs/product/ARCHITECTURE.md)
- [punk CLI](https://github.com/heurema/specpunk/blob/main/docs/product/CLI.md)
- [Specpunk Identity and Layering](https://github.com/heurema/specpunk/blob/main/docs/research/2026-04-03-specpunk-identity-and-layering.md)
- [Specpunk One-Face Operator Shell](https://github.com/heurema/specpunk/blob/main/docs/research/2026-04-03-specpunk-one-face-operator-shell.md)
- [Specpunk Work Ledger](https://github.com/heurema/specpunk/blob/main/docs/research/2026-04-03-specpunk-work-ledger.md)
