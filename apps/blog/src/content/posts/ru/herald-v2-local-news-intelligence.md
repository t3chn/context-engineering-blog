---
title: "Herald v2: локальная новостная разведка для AI-агентов"
description: "Как я собрал 4-стадийный пайплайн новостей, который кластеризует статьи в истории по схожести заголовков - stdlib Python + SQLite."
date: 2026-03-04
tags: ["context-engineering", "claude-code", "agents", "local-first", "python"]
lang: ru
---

Я хотел, чтобы мой AI-агент знал, что происходит в технологиях - без облачных API, платных тарифов и утечки данных. Поэтому я сделал Herald: плагин для Claude Code, который собирает RSS и Hacker News, кластеризует связанные статьи в истории, скорит их и генерирует ранжированный Markdown-дайджест.

v2 - полная переписка с нуля. Вот как это работает.

## Пайплайн

Четыре стадии, каждая - отдельный Python-модуль:

```
RSS/Atom feeds ─┐
                 ├─→ articles ─→ stories (clustered) ─→ scored brief
HN Algolia API ─┘
```

**Collect** забирает данные через адаптеры (RSS, HN Algolia, опционально Tavily). Каждый источник изолирован - падение одного не блокирует остальные.

**Ingest** дедуплицирует через каноникализацию URL (убирает трекинг-параметры, нормализует хосты, сортирует query params), делает UPSERT в SQLite, трекает кросс-источниковые упоминания и назначает топики по ключевым словам.

**Cluster** группирует статьи в истории по схожести заголовков. Самая интересная часть - подробнее ниже.

**Project** генерирует Markdown-дайджест с YAML frontmatter, истории сгруппированы по типу (release, research, tutorial, opinion, news), отсортированы по скору.

## Кластеризация: основной алгоритм

Наивный подход - точное совпадение заголовков - пропускает очевидные группы. "Python 3.14 Released" и "Python 3.14 released with great new features" - одна история. Но "Python 3.13 Released" и "Python 3.14 Released" - нет.

Я использую `difflib.SequenceMatcher` для схожести заголовков с 4 защитными фильтрами. Заголовки сначала нормализуются - приводятся к нижнему регистру, убираются префиксы "Show HN:", трейлинг `[pdf]`/`(video)`, лишние пробелы:

```python
def _can_merge(article_title, story, db, cfg):
    # Guard 1: схожесть заголовка выше порога (default 0.65)
    ratio = SequenceMatcher(None, norm_a, norm_s).ratio()
    if ratio < cfg.threshold:
        return False

    # Guard 2: статьи в пределах временного окна
    if abs(article_collected - story_last_updated) > max_gap:
        return False

    # Guard 3: оба заголовка должны быть достаточно длинными
    if len(words_a) < cfg.min_title_words:
        return False

    # Guard 4: конфликт версий/номеров
    nums_a = set(re.findall(r"\d+(?:\.\d+)*", norm_a))
    nums_s = set(re.findall(r"\d+(?:\.\d+)*", norm_s))
    if nums_a and nums_s and nums_a != nums_s:
        return False

    return True
```

Guard 4 - ключевой инсайт. Без него SequenceMatcher радостно мерджит "Python 3.13 Released" (ratio 0.88) с "Python 3.14 Released". Конфликт номеров версий ловит это - разные версии значат разные истории.

### Переизбрание канонической статьи

У каждой истории есть каноническая статья - та, чей заголовок показывается в дайджесте. Когда статья с более высоким скором присоединяется к истории, она заменяет каноническую - но только если обгоняет текущую на настраиваемую дельту (гистерезис). Это предотвращает постоянные переключения при близких скорах.

```python
canonical_delta = cfg.canonical_delta  # default 0.1
if article_score > current_canonical_score + canonical_delta:
    new_canonical = article_id
```

## Скоринг

Два уровня: статьи и истории.

Скор статьи комбинирует вес источника, очки HN (линейно масштабированные, cap 3.0), плотность ключевых слов и буст для релизов:

```python
def article_score_base(source_weight, points, keyword_density, is_release):
    return (
        source_weight
        + min(points / 500, 3.0)
        + keyword_density * 0.2
        + (0.2 if is_release else 0.0)
    )
```

Скор истории - максимальный скор статьи плюс покрытие (логарифм количества источников) и бонус momentum за свежую активность:

```python
def story_score(max_article_score, source_count, has_recent):
    coverage = math.log(max(source_count, 1)) * 0.3
    momentum = 0.2 if has_recent else 0.0
    return max_article_score + coverage + momentum
```

Истории, покрытые несколькими источниками, ранжируются выше. История из HN + RSS + блог более значима, чем из одного фида.

## Модель данных

SQLite с 8 таблицами. Ключевые связи:

```
sources → articles → mentions (cross-source tracking)
                  → article_topics
                  → story_articles → stories → story_topics
```

Каноникализация URL выполняется перед INSERT - убирает `utm_*`, `fbclid`, `ref`, нормализует `www.`, сортирует query params, апгрейдит HTTP на HTTPS. Две статьи из разных источников на один URL дедуплицируются при ingest, второй источник записывается как упоминание.

## Как выглядит результат

```markdown
---
generated_at: 2026-03-04T12:48:51Z
story_count: 25
period_hours: 24
---
## News

### MacBook Pro with M5 Pro and M5 Max
2.11 · 1 source
- [MacBook Pro with M5 Pro and M5 Max](https://apple.com/newsroom/...)

### TikTok will not introduce end-to-end encryption
1.06 · 1 source
- [TikTok will not introduce...](https://bbc.com/news/articles/...)
```

Истории сгруппированы по типу, отсортированы по скору. Каждая история показывает свои статьи со ссылками на оригинальные источники.

## Интерфейс плагина

Herald - плагин для Claude Code. Семь slash-команд, один хук:

```
/news-init      → создаёт ~/.herald/ с конфигом + SQLite DB
/news-add <url> → автоматически находит RSS, добавляет в конфиг
/news-run       → запускает полный пайплайн
/news-digest    → выводит последний дайджест с гайдом по анализу
/news-status    → количество статей/историй + время последнего запуска
```

Хук `SessionStart` проверяет наличие свежего дайджеста (< 24ч) и подсказывает агенту прочитать его. Агент видит "Fresh news digest available" при старте сессии - никаких ручных триггеров.

## Дизайн-решения

**stdlib вместо зависимостей.** Алгоритм кластеризации использует `difflib.SequenceMatcher` - без numpy, sklearn, embedding-моделей. Для новостных заголовков (короткие строки, один язык) посимвольная схожесть работает достаточно хорошо и за микросекунды.

**SQLite вместо файлов.** v1 использовал JSONL и flat-file дедупликацию. v2 - SQLite с foreign keys, FTS5 для полнотекстового поиска и WAL mode. Один файл, ACID-транзакции, `ON CONFLICT` для идемпотентных UPSERT.

**Монотонные таймстампы.** Когда поздно пришедшая старая статья присоединяется к истории, `last_updated` не должен регрессировать. Фикс: `max(current_last_updated, article_collected_at)`. Нашёл этот баг при [мультимодельном код-ревью](https://github.com/heurema/signum), где Claude, Codex и Gemini независимо аудитили один diff.

**Изоляция пайплайна.** Каждый адаптер collect работает в своём try/except. Таймаут одного RSS-фида не блокирует HN. Статус пайплайна записывается в таблицу `pipeline_runs` (включая ошибки) - всегда знаешь, что произошло.

## Цифры

- 174 теста, 0.7с на M-series Mac
- ~1200 строк Python в 10 модулях
- 0 внешних AI API вызовов
- Реальный E2E тест: 2 источника (HN + RSS) → 45 статей → 27 историй → скоринг + дайджест за 3 секунды

## Попробуй

```bash
claude plugin marketplace add heurema/emporium
claude plugin install herald@emporium
/news-init
/news-run
```

Исходники: [github.com/heurema/herald](https://github.com/heurema/herald)

Нашёл баг? Все плагины heurema поставляются с [Reporter](https://github.com/heurema/reporter) - файлишь issue не выходя из Claude Code:

```
claude plugin install reporter@emporium
/report bug
```

Reporter автоматически определяет продукт, собирает контекст окружения и отправляет через `gh` CLI.
