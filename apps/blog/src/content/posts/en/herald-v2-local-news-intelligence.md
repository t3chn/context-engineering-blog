---
title: "Herald v2: Local-First News Intelligence for AI Agents"
description: "How I built a 4-stage news pipeline that clusters articles into stories using title similarity, all in stdlib Python with SQLite."
date: 2026-03-04
tags: ["context-engineering", "claude-code", "agents", "local-first", "python"]
lang: en
---

I wanted my AI agent to know what's happening in tech - without cloud APIs, paid tiers, or data leaving my machine. So I built Herald: a Claude Code plugin that collects RSS and Hacker News, clusters related articles into stories, scores them, and generates a ranked Markdown brief.

v2 is a complete rewrite. Here's how it works.

## The pipeline

Four stages, each a standalone Python module:

```
RSS/Atom feeds ─┐
                 ├─→ articles ─→ stories (clustered) ─→ scored brief
HN Algolia API ─┘
```

**Collect** fetches from adapters (RSS, HN Algolia, optional Tavily). Each source is isolated - one failure doesn't stop others.

**Ingest** deduplicates via URL canonicalization (strip tracking params, normalize hosts, sort query params), UPSERTs into SQLite, tracks cross-source mentions, and assigns topics by keyword matching.

**Cluster** groups articles into stories using title similarity. This is the interesting part - more below.

**Project** generates a Markdown brief with YAML frontmatter, stories grouped by type (release, research, tutorial, opinion, news), scored and ranked.

## Clustering: the core algorithm

The naive approach - exact title matching - misses obvious groups. "Python 3.14 Released" and "Python 3.14 released with great new features" are the same story. But "Python 3.13 Released" and "Python 3.14 Released" are not.

I use `difflib.SequenceMatcher` for title similarity with 4 merge guards. Titles are normalized first - lowercased, stripped of "Show HN:" prefixes, trailing `[pdf]`/`(video)` tags, and extra whitespace:

```python
def _can_merge(article_title, story, db, cfg):
    # Guard 1: title similarity above threshold (default 0.65)
    ratio = SequenceMatcher(None, norm_a, norm_s).ratio()
    if ratio < cfg.threshold:
        return False

    # Guard 2: articles within time window
    if abs(article_collected - story_last_updated) > max_gap:
        return False

    # Guard 3: both titles must have enough words
    if len(words_a) < cfg.min_title_words:
        return False

    # Guard 4: version/number conflict detection
    nums_a = set(re.findall(r"\d+(?:\.\d+)*", norm_a))
    nums_s = set(re.findall(r"\d+(?:\.\d+)*", norm_s))
    if nums_a and nums_s and nums_a != nums_s:
        return False

    return True
```

Guard 4 is the key insight. Without it, SequenceMatcher happily merges "Python 3.13 Released" (ratio 0.88) with "Python 3.14 Released". The number conflict guard catches this - different version strings means different stories.

### Canonical re-election

Each story has a canonical article - the one shown in the brief title. When a higher-scored article joins the story, it replaces the canonical - but only if it beats the current one by a configurable delta (hysteresis). This prevents flip-flopping when scores are close.

```python
canonical_delta = cfg.canonical_delta  # default 0.1
if article_score > current_canonical_score + canonical_delta:
    new_canonical = article_id
```

## Scoring

Two levels: articles and stories.

Article score combines source weight, HN points (linearly scaled, capped at 3.0), keyword density, and a type boost for releases:

```python
def article_score_base(source_weight, points, keyword_density, is_release):
    return (
        source_weight
        + min(points / 500, 3.0)
        + keyword_density * 0.2
        + (0.2 if is_release else 0.0)
    )
```

Story score is the max article score plus coverage (log of source count) and a momentum bonus for recent activity:

```python
def story_score(max_article_score, source_count, has_recent):
    coverage = math.log(max(source_count, 1)) * 0.3
    momentum = 0.2 if has_recent else 0.0
    return max_article_score + coverage + momentum
```

Stories covered by multiple sources rank higher. A story from HN + RSS + blog is more newsworthy than one from a single feed.

## Data model

SQLite with 8 tables. The key relationships:

```
sources → articles → mentions (cross-source tracking)
                  → article_topics
                  → story_articles → stories → story_topics
```

URL canonicalization runs before INSERT - strips `utm_*`, `fbclid`, `ref`, normalizes `www.`, sorts query params, upgrades HTTP to HTTPS. Two articles from different sources pointing to the same URL get deduplicated at ingest, with the second source recorded as a mention.

## What the output looks like

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

Stories grouped by type, sorted by score. Each story shows its articles with links back to the original sources.

## The plugin interface

Herald is a Claude Code plugin. Seven slash commands, one hook:

```
/news-init      → creates ~/.herald/ with config + SQLite DB
/news-add <url> → auto-discovers RSS, adds to config
/news-run       → runs the full pipeline
/news-digest    → prints the latest brief with analysis guide
/news-status    → article/story counts + last run time
```

A `SessionStart` hook checks if a fresh brief exists (< 24h old) and nudges the agent to read it. The agent sees "Fresh news digest available" at session start - no manual trigger needed.

## Design decisions

**stdlib over dependencies.** The clustering algorithm uses `difflib.SequenceMatcher` - no numpy, no sklearn, no embedding models. For news titles (short strings, same language), character-level similarity works well enough and runs in microseconds.

**SQLite over files.** v1 used JSONL files and flat-file dedup indexes. v2 uses SQLite with proper foreign keys, FTS5 for full-text search, and WAL mode. One file, ACID transactions, `ON CONFLICT` for idempotent UPSERTs.

**Monotonic timestamps.** When a late-arriving old article joins a story, `last_updated` must not regress. The fix: `max(current_last_updated, article_collected_at)`. Found this bug during a [multi-model code review](https://github.com/heurema/signum) where Claude, Codex, and Gemini independently audited the same diff.

**Pipeline isolation.** Each collect adapter runs in its own try/except. One RSS feed timing out doesn't block HN. Pipeline status is recorded to `pipeline_runs` table (including errors) so you always know what happened.

## Numbers

- 174 tests, 0.7s on M-series Mac
- ~1200 lines of Python across 10 modules
- 0 external AI API calls required
- Real E2E test: 2 sources (HN + RSS) → 45 articles → 27 stories → scored brief in under 3 seconds

## Try it

```bash
claude plugin marketplace add heurema/emporium
claude plugin install herald@emporium
/news-init
/news-run
```

Source: [github.com/heurema/herald](https://github.com/heurema/herald)

Found a bug? All heurema plugins ship with [Reporter](https://github.com/heurema/reporter) - file issues without leaving Claude Code:

```
claude plugin install reporter@emporium
/report bug
```

Reporter auto-detects the product, attaches environment context, and submits via `gh` CLI.
