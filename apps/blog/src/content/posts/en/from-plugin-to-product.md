---
title: "From Plugin to Product: How Herald Became Sift and Why the Data Model Changed Everything"
description: "A local news plugin worked until it didn't. The fix was a different data model, language, and delivery surface."
date: 2026-03-10
tags: ["context-engineering", "agents", "golang", "architecture", "saas"]
lang: en
canonical_url: https://ctxt.dev/posts/en/from-plugin-to-product
---

Herald was a Python plugin that collected RSS feeds and Hacker News, clustered articles by title similarity, and generated Markdown briefs. It ran locally, required zero API keys, and did exactly what it was supposed to do.

Then we tried to make it useful for real work.

## What Broke

Herald's core assumption was that articles are the primary unit. You collect articles, deduplicate by URL, cluster by title similarity, score by source weight and recency, and project a Markdown brief. This works for a developer reading morning news.

It doesn't work when:

- An agent needs to know whether "Coinbase lists TOKEN" and "TOKEN now available on Coinbase" are the same real-world fact
- You need confidence levels, not just scores - how many independent sources confirm this event?
- The system must update when new evidence arrives, not just when the next cron runs
- A downstream automation needs typed fields (`assets: ["BTC"]`, `event_type: "listing"`) instead of parsing Markdown

The fundamental problem: Herald modeled content. The world it was trying to represent contained events.

## Articles vs Events

In Herald, the main object was a `Story` - a cluster of articles with similar titles:

```
Story: "Python 3.14 Released"
  - Article from HN (score: 342)
  - Article from Simon Willison's blog
  - Article from Python.org
```

The cluster was the output. The articles were the atoms.

In Sift, the main object is an `Event` - a structured fact pattern with provenance:

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

The event is the truth. The articles that support it are evidence. This distinction matters because:

1. **Events can be updated.** When a new article confirms or contradicts an event, the confidence score changes. Herald's stories were frozen after clustering.
2. **Events have typed metadata.** `assets`, `topics`, `event_type` are queryable fields, not bag-of-words extracted from titles.
3. **Events separate importance from confidence.** A rumor about a Bitcoin ETF approval is high-importance but low-confidence. Herald couldn't express this - a story was either in the brief or it wasn't.

## JSON as Truth, Markdown as Projection

Herald's output was a Markdown file. That was the product. Agents read Markdown, humans read Markdown, done.

Sift inverts this. The canonical record is a typed JSON event. Everything else is a projection:

- The human digest? A Markdown rendering of the top events in a time window.
- The agent context? The same JSON, filtered by asset and topic.
- The WebSocket stream? Push notifications when an event is upserted.
- The `llms.txt`? A static slice for LLM-friendly discovery.

This isn't theoretical purity. It's operational: when the API returns an event, the browser workspace and the CLI both render from the same record. There's no "browser version" and "agent version" of the truth.

## Python to Go

Herald was ~1,200 lines of Python. Sift is ~7,000 lines of Go. The rewrite wasn't about performance benchmarks.

Three things drove the language change:

1. **Single binary deployment.** Sift Pro is a hosted service running on a Linux node. `go build` produces one binary. No virtualenv, no pip, no runtime. The systemd unit file is trivial.

2. **Shared pipeline.** The same Go packages (`internal/pipeline`, `internal/event`, `internal/ingest`) power both the local `sift` CLI and the hosted `siftd` server. In Python, sharing code between a CLI tool and an async web server meant fighting import paths and event loops.

3. **Concurrency for real-time.** Sift's hosted mode runs a scheduler, HTTP API, and WebSocket broadcaster in one process. Go's goroutines and channels made this straightforward. Python's asyncio could do it, but the cognitive overhead was higher for a small team.

The trade-off: Go's type system caught things earlier but made rapid prototyping slower. Herald's first version was built in a day. Sift's v0 took a week.

## Local Free + Hosted Pro

Herald was local-only by design. Sift keeps a local tier and adds a hosted one.

**Sift Free** (local CLI):
- SQLite storage under `~/.sift/`
- User-controlled sync schedule
- Same event model, same digest projections
- Full ownership of your data

**Sift Pro** ($5/mo):
- Hosted Postgres store with 30-day retention
- Autonomous sync every 5 minutes
- Authenticated REST API (`/v1/events`, `/v1/digests`)
- WebSocket stream for real-time updates
- Zitadel-backed accounts

The split matters because the free tier is a real product, not a crippled teaser. A developer who wants local crypto news intelligence gets it. A developer who wants always-on event delivery for their agents pays for the hosted runtime.

## What Agents Actually Need

The deeper lesson from Herald to Sift is about what agents need from a news system.

Herald gave agents Markdown. It was human-readable, which seemed like a feature. But agents don't need prose. They need:

- **Typed records** they can filter without parsing natural language
- **Confidence signals** so they can decide whether to act on a report
- **Stable IDs** so they can reference events across sessions
- **Push delivery** so they don't poll for updates
- **Provenance** so they can trace a claim to its sources

This is a context engineering problem. The question isn't "what text do I feed the model." It's "what structured context does the agent need to make a decision."

Herald's Markdown brief was a human projection pretending to be agent context. Sift's JSON events are agent context that happens to have a human projection.

## The Provenance Rule

One principle from Sift's manifesto drove more design decisions than any other: no claim without provenance.

Every event tracks which sources contributed to it. The `source_cluster_size` field tells you how many independent sources confirmed the event. The `confidence_score` is derived from source agreement, not from a language model's guess.

This means Sift can honestly say: "7 sources reported this ETF milestone, confidence 0.93" vs "1 blog mentioned this rumor, confidence 0.41." Herald couldn't distinguish these - both would appear as stories with different scores, but the scoring didn't separate importance from evidence quality.

The practical impact: downstream agents can set thresholds. "Only act on events with confidence > 0.8 and source_cluster_size > 3." That's a policy an automation can enforce. "Only act on stories with score > 50" is a guess.

## What Stayed the Same

Not everything changed. The core insight from Herald survived intact: clustering related reports into a single unit is the most valuable transformation in a news pipeline. Whether you call it a story or an event, deduplication-by-meaning is what turns 45 articles into 27 actionable items.

The scoring formula changed, but the principle didn't: source weight matters, recency matters, cross-source confirmation matters.

And the local-first instinct survived. Sift Pro exists because some users need it, not because local-first was wrong. The free CLI proves the data model works without a cloud dependency.

## Try It

Sift is live at [skill7.dev/sift](https://skill7.dev/sift). The local CLI is open source.

Herald remains available as a Claude Code plugin for developers who want configurable, multi-topic news intelligence without accounts or subscriptions.

## Sources

- [Sift on skill7.dev](https://skill7.dev/sift)
- [Herald v2: Local-First News Intelligence for AI Agents](/posts/en/herald-v2-local-news-intelligence)
- [Herald on GitHub](https://github.com/heurema/herald)
