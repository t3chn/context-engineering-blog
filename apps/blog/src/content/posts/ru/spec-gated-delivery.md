---
title: "Spec-Gated Delivery: почему PR review - неправильный checkpoint доверия для AI-кода"
description: "AI удешевил код. Он не удешевил доверие. Решение - не лучшие ревьюеры, а перенос gate с PR diff на утвержденный intent."
date: 2026-03-06
tags: ["context-engineering", "verification", "agents", "software-delivery"]
lang: ru
---

AI сделал написание кода массово доступным. Доверие к коду дешевле не стало.

Стандартный пайплайн сегодня: issue или промпт, AI пишет код, AI или человек ревьюит PR, merge. Это всегда было несовершенным, но масштабировалось, пока люди писали каждую строку и ревьюер мог восстановить intent. Ломается, когда большая часть diff сгенерирована за секунды, а ревьюеру приходится reverse-engineer-ить intent из результата.

Bottleneck сместился. Генерация дешева. Верификация - нет.

## Ловушка PR Review

PR review - поздний, дорогой, вероятностный checkpoint. К моменту, когда ты смотришь на diff, код существует, тесты существуют, commit message существует. Ты pattern-match-ишь "выглядит ли это правильно" - а не сверяешь со спецификацией того, что "правильно" означает.

Три failure mode компаундятся:

1. **Issue - это не спецификация.** "Add rate limiting" имеет десять валидных реализаций. Ревьюер сравнивает diff с ментальной моделью, а не с shared artifact.

2. **AI ревьюит AI без ground truth - это circular.** Три модели на одном diff дают три мнения. Они ловят баги и стилевые проблемы. Но без формализованной спецификации для проверки они сравнивают diff со своими assumptions - не с верифицированным intent. Multi-model review становится полезным, когда он привязан к конкретной спецификации (что Signum делает в audit-фазе), а не когда заменяет её.

3. **Слабые evidence переживают merge.** После закрытия PR что остается? Review comments, approval checkmarks, linked issues, CI logs. У некоторых команд артефакты богаче - test reports, CODEOWNERS traces, provenance attestations. Но даже в зрелых пайплайнах редко есть единый machine-readable артефакт, связывающий изменение с pre-approved, верифицированным intent с holdout-результатами.

## Сдвиг

Primary trust artifact должен быть не diff. А утвержденная спецификация.

Primary gate должен быть не "выглядит ли это правильно для ревьюера". А "проходит ли это deterministic checks против утвержденного intent".

Primary evidence должен быть не review comments. А signed conformance artifact.

```
Утвержденный intent -> blinded execution -> deterministic verification -> signed evidence -> решение
```

Это не теория. Это операционный паттерн. Кирпичики существуют: typed specs, deterministic test runners, holdout test sets, attestation primitives (DSSE, in-toto, SLSA). Некоторые команды собрали части этого internally. Но нет стандартного открытого стека, который объединяет spec gating, holdout governance и signed conformance evidence в единый delivery pipeline.

## Что проверяет Spec Gate

Spec gate не доказывает, что код корректен в общем случае. Это формальная верификация - другая задача. Он доказывает что-то более узкое и практичное:

- Какой контракт был утвержден, кем, когда
- Какой commit был проверен против него
- Какие deterministic checks были запущены и их результаты
- Какие holdout checks (невидимые для implementing agent) прошли или нет
- Что evidence bundle не был подменен после факта

Trust model зависит от того, кто контролирует verifier, кто запечатывает holdouts, и может ли implementing agent влиять на evidence chain. В случае Signum: holdouts запечатываются при утверждении контракта, engineer agent получает отфильтрованный контракт, и proofpack хеширован против оригинала. Это не делает его tamper-proof во всех threat models, но поднимает планку выше "CI runner сказал pass".

Это proof of conformance + proof of process. Не proof of correctness.

Что явно не доказывается:

- Что спецификация идеальна
- Что holdout checks покрывают все edge cases
- Что нет неизвестных классов дефектов
- Что LLM-judged checks равны формальной верификации

Проговаривать это важно. В момент, когда заявляешь больше, чем доставляешь - продаешь snake oil.

## Holdouts: ключевой механизм

Самая мощная идея в spec-gated delivery - holdout criteria: acceptance checks, которые implementing agent никогда не видит.

Ты пишешь десять acceptance criteria. Три помечаются holdout. Агент получает семь. Реализует, пишет тесты, проходит всё, что видит. Затем CI запускает holdout checks на готовом коде.

Если агент забыл обработать сброс счетчика по истечении окна или пропустил edge case с пустым вводом, holdout ловит это - не потому что ревьюер заметил, а потому что критерий существовал до начала реализации.

Важно: holdout criteria должны быть следствиями visible contract, а не тайно добавленными требованиями. Если visible spec говорит "rate limit POST /api/tokens at 5/min", holdout, проверяющий сброс счетчика после окна - валидная деривация. Holdout, добавляющий новый endpoint - нет, это undisclosed requirement.

Разница между "ревьюер нашел баг" и "автор спецификации предвидел failure mode".

## Честные границы

У spec-gated delivery реальные ограничения:

- **Качество спецификации - потолок.** Плохие спецификации порождают ложную уверенность. Spec gate, пропускающий слабый контракт, хуже отсутствия gate, потому что создает иллюзию верификации.
- **Не всё детерминированно проверяемо.** UX, производительность под реальной нагрузкой, security posture - требуют человеческого суждения или специализированного тулинга. Система должна честно маркировать каждый критерий как `deterministic`, `heuristic` или `manual`.
- **Holdouts требуют domain expertise.** Ценность holdout пропорциональна тому, насколько хорошо он предвидит failure modes. Это человеческий навык.

Moat не в AI code generation. Не в AI review. А в verification and evidence layer: spec quality gates, holdout governance, deterministic verifier mapping, signed conformance artifacts и policy engines, разделяющие доказанное от предполагаемого.

## Почему сейчас

Три зрелых потока сошлись:

1. **AI coding стал mass-market.** Copilot, Claude Code, Cursor - команды генерируют больше кода, чем могут ревьюить.
2. **Contract-driven workflows вышли на рынок.** Kiro, Spec Kit, amp - идея, что спецификации должны предшествовать реализации, уже не академична.
3. **Attestation infrastructure зреет.** SLSA, Sigstore, in-toto дают полезные примитивы для signed provenance. Key management и verifier trust остаются сложными проблемами, но building blocks существуют для команд, готовых инвестировать.

Но нет стандартного открытого стека, собирающего spec gating, holdout governance и signed evidence в единый delivery pipeline, где gate - спецификация, а не diff.

## Что меняется

Когда spec-gated delivery работает, code review перестает быть primary truth и становится вторичным аудитом. PR по-прежнему полезен - для knowledge sharing, обнаружения пробелов в спецификации, менторинга. Но решение о доверии сдвигается раньше: к моменту утверждения спецификации и запечатывания holdouts.

Это главный сдвиг. Не "лучший AI review". Не "больше ревьюеров". Другая trust model целиком.

Формула:

```
Утвержденный intent -> blinded execution -> deterministic verification -> signed evidence -> human/CI решение
```

Если evidence artifact говорит, что код соответствует утвержденной спецификации, включая holdout criteria, которые агент не мог видеть, и attestation chain цел - это более сильный сигнал, чем любое количество review comments.

## Попробуй

Мы встроили это в [Signum](https://github.com/heurema/signum), плагин для Claude Code. Spec quality gate, holdout scenarios, multi-model audit, signed proofpack. Ранний и opinionated.

```bash
claude plugin marketplace add heurema/emporium
claude plugin install signum@emporium
/signum "описание задачи"
```

Интересен не инструмент. Интересен вопрос: если бы ты мог гейтить каждое AI-сгенерированное изменение на pre-approved, детерминированно верифицированной спецификации - ставил бы ты PR review в центр trust model?

## Источники

- [SLSA - Supply-chain Levels for Software Artifacts](https://slsa.dev/) - фреймворк целостности software supply chain
- [in-toto - A framework for securing the software supply chain](https://in-toto.io/)
- [Signum on GitHub](https://github.com/heurema/signum)
- [The Contract Is the Context](/posts/en/signum-contract-first-ai-dev) - предыдущий пост о contract-first pipeline Signum
- [skill7.dev/development/signum](https://skill7.dev/development/signum)
