---
title: "От плагина к продукту: как Herald стал Sift и почему модель данных изменила всё"
description: "Локальный новостной плагин для AI-агентов работал, пока не перестал. Решение - другая модель данных, язык и surface."
date: 2026-03-10
tags: ["context-engineering", "agents", "golang", "architecture", "saas"]
lang: ru
canonical_url: https://ctxt.dev/posts/ru/from-plugin-to-product
---

Herald был Python-плагином, который собирал RSS-ленты и Hacker News, кластеризовал статьи по похожести заголовков и генерировал Markdown-дайджесты. Работал локально, не требовал API-ключей и делал ровно то, для чего создавался.

Потом мы попытались использовать его для реальной работы.

## Что сломалось

Базовое допущение Herald - статьи как primary unit. Собираешь статьи, дедуплицируешь по URL, кластеризуешь по похожести заголовков, скоришь по весу источника и свежести, проецируешь Markdown-дайджест. Работает для разработчика, читающего утренние новости.

Не работает когда:

- Агенту нужно знать, являются ли "Coinbase листит TOKEN" и "TOKEN теперь доступен на Coinbase" одним и тем же фактом реального мира
- Нужны уровни уверенности, а не просто скоры - сколько независимых источников подтверждают событие?
- Система должна обновляться при появлении новых evidence, а не только по крону
- Downstream-автоматизации нужны типизированные поля (`assets: ["BTC"]`, `event_type: "listing"`) вместо парсинга Markdown

Фундаментальная проблема: Herald моделировал контент. Мир, который он пытался представить, содержал события.

## Статьи vs События

В Herald главным объектом была `Story` - кластер статей с похожими заголовками:

```
Story: "Python 3.14 Released"
  - Статья с HN (score: 342)
  - Статья из блога Simon Willison
  - Статья с Python.org
```

Кластер был результатом. Статьи - атомами.

В Sift главный объект - `Event` - структурированный факт-паттерн с provenance:

```json
{
  "event_id": "evt_2026030801",
  "title": "Bitcoin ETF daily inflow hits $1.2B record",
  "event_type": "market_milestone",
  "assets": ["BTC"],
  "topics": ["etf", "institutional"],
  "importance_score": 0.87,
  "confidence_score": 0.93,
  "source_cluster_size": 7,
  "published_at": "2026-03-08T14:22:00Z"
}
```

Событие - это truth. Статьи, поддерживающие его - evidence. Различие важно потому что:

1. **События обновляемы.** Когда новая статья подтверждает или опровергает событие, confidence score меняется. Story в Herald замораживались после кластеризации.
2. **У событий типизированные метаданные.** `assets`, `topics`, `event_type` - queryable поля, а не bag-of-words из заголовков.
3. **События разделяют importance и confidence.** Слух о Bitcoin ETF approval - high-importance, но low-confidence. Herald не мог это выразить - story либо попадала в дайджест, либо нет.

## JSON как truth, Markdown как projection

Output Herald - Markdown-файл. Это и был продукт. Агенты читают Markdown, люди читают Markdown, готово.

Sift инвертирует это. Каноническая запись - типизированное JSON-событие. Всё остальное - проекция:

- Человеческий дайджест? Markdown-рендер топ-событий за временное окно.
- Контекст для агента? Тот же JSON, отфильтрованный по asset и topic.
- WebSocket-стрим? Push-нотификации при upsert события.
- `llms.txt`? Статический срез для LLM-friendly discovery.

Это не теоретическая чистота. Это операционно: когда API возвращает событие, браузерный workspace и CLI оба рендерят из одной записи. Нет "браузерной версии" и "агентской версии" truth.

## Python в Go

Herald - ~1200 строк Python. Sift - ~7000 строк Go. Переписывание не ради бенчмарков.

Три причины смены языка:

1. **Single binary deployment.** Sift Pro - hosted-сервис на Linux-ноде. `go build` дает один бинарник. Без virtualenv, без pip, без runtime. Systemd unit-файл тривиален.

2. **Shared pipeline.** Одни и те же Go-пакеты (`internal/pipeline`, `internal/event`, `internal/ingest`) работают и в локальном `sift` CLI, и в hosted `siftd` сервере. В Python шаринг кода между CLI и async web server означал борьбу с import paths и event loops.

3. **Concurrency для real-time.** Hosted-режим Sift запускает scheduler, HTTP API и WebSocket broadcaster в одном процессе. Goroutines и channels делают это straightforward. Asyncio Python мог бы, но cognitive overhead выше для маленькой команды.

Trade-off: type system Go ловит раньше, но замедляет rapid prototyping. Первая версия Herald была за день. V0 Sift занял неделю.

## Local Free + Hosted Pro

Herald - local-only by design. Sift сохраняет локальный tier и добавляет hosted.

**Sift Free** (локальный CLI):
- SQLite-хранилище в `~/.sift/`
- Пользовательское расписание sync
- Та же event model, те же digest projections
- Полное владение данными

**Sift Pro** ($5/мес):
- Hosted Postgres store с 30-дневным retention
- Автономный sync каждые 5 минут
- Аутентифицированный REST API (`/v1/events`, `/v1/digests`)
- WebSocket-стрим для real-time обновлений
- Zitadel-backed аккаунты

Split важен потому что free tier - реальный продукт, а не урезанный teaser. Разработчик, которому нужна локальная крипто-аналитика - получает её. Разработчик, которому нужна always-on event delivery для агентов - платит за hosted runtime.

## Что на самом деле нужно агентам

Глубокий урок перехода от Herald к Sift - о том, что агентам нужно от новостной системы.

Herald давал агентам Markdown. Это было human-readable, что казалось фичей. Но агентам не нужна проза. Им нужны:

- **Типизированные записи** для фильтрации без парсинга natural language
- **Сигналы уверенности** для принятия решений о действиях
- **Стабильные ID** для ссылок на события между сессиями
- **Push-доставка** без поллинга
- **Provenance** для трассировки claim к источникам

Это задача context engineering. Вопрос не "какой текст скормить модели". А "какой структурированный контекст нужен агенту для принятия решения".

Markdown-дайджест Herald был человеческой проекцией, притворяющейся агентским контекстом. JSON-события Sift - агентский контекст, у которого есть человеческая проекция.

## Правило provenance

Один принцип из манифеста Sift повлиял на больше дизайн-решений, чем любой другой: no claim without provenance.

Каждое событие отслеживает, какие источники внесли вклад. Поле `source_cluster_size` говорит, сколько независимых источников подтвердили событие. `confidence_score` вычисляется из source agreement, а не из предположения языковой модели.

Это значит Sift может честно сказать: "7 источников сообщили об этом ETF milestone, confidence 0.93" vs "1 блог упомянул этот слух, confidence 0.41". Herald не мог их различить - оба появились бы как stories с разными скорами, но scoring не разделял importance и evidence quality.

Практический эффект: downstream-агенты могут выставлять пороги. "Действуй только по событиям с confidence > 0.8 и source_cluster_size > 3". Это policy, которую автоматизация может enforce. "Действуй по stories со score > 50" - это guess.

## Что осталось прежним

Не всё изменилось. Ключевой инсайт Herald выжил: кластеризация связанных репортов в единый unit - самая ценная трансформация в news pipeline. Неважно как называть - story или event - deduplication-by-meaning превращает 45 статей в 27 actionable items.

Формула скоринга изменилась, принцип нет: source weight важен, recency важен, cross-source confirmation важен.

И local-first инстинкт выжил. Sift Pro существует потому что некоторым пользователям нужен, а не потому что local-first был неправильным. Free CLI доказывает, что data model работает без cloud dependency.

## Попробуй

Sift доступен на [skill7.dev/sift](https://skill7.dev/sift). Локальный CLI open source.

Herald остается доступным как Claude Code плагин для разработчиков, которым нужна configurable, multi-topic news intelligence без аккаунтов и подписок.

## Источники

- [Sift на skill7.dev](https://skill7.dev/sift)
- [Herald v2: Local-First News Intelligence for AI Agents](/posts/en/herald-v2-local-news-intelligence)
- [Herald on GitHub](https://github.com/heurema/herald)
