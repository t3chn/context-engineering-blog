---
title: "Your AI Spec Is Already Stale"
description: "When agents read project.intent.md as ground truth, stale specs become execution bugs. Here's how I caught real drift in two projects."
date: 2026-03-20
tags:
  - context-engineering
  - claude-code
  - agents
  - specs
lang: en
canonical_url: https://ctxt.dev/posts/en/spec-drift-living-intent/
---

I maintain 12 Claude Code plugins. Each has a `project.intent.md` -- a structured spec that tells the agent what the project does, what it doesn't do, and who it's for. The agent reads it at the start of every task.

Last week I ran a reverse diff -- code signals vs. existing spec -- on two projects. Both had drift. One had been wrong for three versions.

## The problem with specs in AI-assisted codebases

Traditional docs debt is annoying but survivable. A stale README means a developer spends 10 extra minutes figuring things out. They have context, judgment, and access to `git log`.

An AI agent reading a stale spec has none of that. It treats the spec as ground truth. If `project.intent.md` says the scoring formula is `source_weight + keyword_density * 0.2 + release_boost`, the agent will write code that assumes those variables exist. Even if the actual implementation changed to `source_weight + min(points/500, 3.0)` two versions ago.

This isn't docs debt. It's an execution bug hiding in plain text.

## What I found

### Herald: v1 ghosts in a v2 codebase

Herald is a news digest plugin. It went through a major rewrite from v1 (JSONL pipeline) to v2 (SQLite pipeline). The `project.intent.md` was generated from v1 docs and never updated.

I ran the code scanner against the existing spec. The diff:

**Scoring formula -- wrong since v2.0:**
```
EXISTING (glossary):
  source_weight + keyword_density * 0.2 + release_boost

ACTUAL CODE (herald/scoring.py):
  source_weight + min(points/500, 3.0)
  Story-level: max_article_score + coverage + momentum
```

The `keyword_density` variable doesn't exist in v2. An agent writing a scoring-related feature would reference a ghost API.

**Deduplication -- wrong threshold:**
```
EXISTING (glossary):
  Jaccard trigram title similarity at threshold 0.85

ACTUAL CODE (herald/cluster.py):
  SequenceMatcher with threshold 0.65
```

Not just a different number -- a different algorithm. Jaccard trigrams vs. Python's `SequenceMatcher`. An agent tuning dedup behavior would look for the wrong function.

**Pipeline orchestration -- dead reference:**
```
EXISTING (glossary):
  "run.sh orchestrator acquires POSIX lockfile, calls collect.py then analyze.py"

ACTUAL CODE (herald/cli.py):
  herald.cli run → pipeline.py → collect → ingest → cluster → project
  No run.sh. No lockfile. No analyze.py.
```

Three of three architectural facts in the glossary were stale. The agent would reference files that don't exist.

### Delve: missing shipped features

Delve is a deep research orchestrator. Its `project.intent.md` was 3 days old -- written at v0.7, now at v0.8.1. Two shipped features were missing:

```
ADDED to Core Capabilities:
  + Token-efficient pipeline with trafilatura-based content extraction
    (45-60% input token reduction)
  + Stage 0.5 CONTEXTUALIZE: local context enrichment before web SCAN
```

Plus two entire sections were absent:

```
ADDED sections:
  + Success Criteria (derived from quality thresholds in reference.md)
  + Personas (3 user types inferred from README usage patterns)
```

An agent scoping a new feature for Delve wouldn't know about CONTEXTUALIZE. It might re-implement local context enrichment from scratch, duplicating a shipped capability.

## Why AI makes this worse

In a human-only workflow, specs rot slowly. Developers write code, docs lag behind, someone eventually updates the README. The feedback loop is months.

With AI agents, the loop compresses. An agent can ship 5 features in a day. Each feature may add capabilities, change interfaces, or remove dead code. The spec was accurate at 9 AM and wrong by 5 PM.

The multiplier effect: agents don't just read stale specs -- they write code that assumes the stale spec is correct, which then gets reviewed by another agent that also reads the stale spec. Confirmation bias at machine speed.

## The reverse diff

The fix isn't "update your docs more often." That's aspirational advice that doesn't scale. The fix is a machine-readable reverse diff: scan the code, derive what the spec should say, compare it to what it actually says.

Here's what the diff output looks like:

```
SECTION: Goal
STATUS: UNCHANGED
REASON: Fresh derivation semantically matches existing content.

SECTION: Core Capabilities
STATUS: UPDATED
EXISTING: 6 items
PROPOSED: 8 items (+2 new capabilities from shipped commits)
EVIDENCE: git log afe0e42, 90e5ded
CONFIDENCE: high

SECTION: Non-Goals
STATUS: UNCHANGED
REASON: All 5 items still supported by docs/how-it-works.md Limitations.

SECTION: Success Criteria
STATUS: ADDED
REASON: Section absent from existing intent; quality thresholds in reference.md.

SECTION: Personas
STATUS: ADDED
REASON: Section absent; 3 user types inferred from README usage patterns.
```

Each section is classified independently: `UNCHANGED`, `UPDATED`, `ADDED`, or `REMOVED`. The developer reviews per-section, not per-file. Unchanged sections are auto-accepted -- you only see what actually drifted.

The key design decision: **when in doubt, UNCHANGED beats UPDATED.** If the existing content contains facts not derivable from code signals -- manual edits, domain knowledge, judgment calls -- the system preserves them. It only flags drift it can prove from code.

## What this means for your projects

If you use `CLAUDE.md`, `project.intent.md`, agent instructions, or any structured context that an AI reads as ground truth:

1. **Treat spec accuracy as a correctness property**, not a hygiene task. A wrong spec is a wrong input to every agent session.

2. **Automate the reverse direction.** You probably have CI that checks code against specs (tests, linting, contracts). You probably don't have anything that checks specs against code. That's the gap.

3. **Diff semantically, not textually.** A cosmetic reword shouldn't trigger a review. A missing capability should. The scanner needs to understand what matters.

4. **Run it after shipping, not before.** The spec drifts after the code ships, not before. Check intent freshness as a post-deploy step, not a pre-commit hook.

## The implementation

I built this as `--actualize` mode in [Signum](https://github.com/heurema/signum)'s `/signum init` command. It reuses the same scanner that bootstraps new projects -- same signal hierarchy, same evidence tracking -- but produces a diff instead of a full rewrite.

The scanner reads authoritative docs, README, package manifests, git history, and entrypoints. The synthesizer compares each section against existing intent and classifies it. The command presents changes one section at a time and writes only what you accept.

```
/signum init --actualize
```

It's a Claude Code plugin. The scanner is deterministic (bash, no LLM). The diff is LLM-produced (semantic comparison, not byte-level). The write is human-confirmed (no auto-apply).

---

I caught 6 factual errors in Herald's glossary and 2 missing capabilities in Delve's intent. Both had been accurate when written. Both drifted within days.

If your agents read structured context, check when it was last verified -- not when it was last edited.

Source: [github.com/heurema/signum](https://github.com/heurema/signum) (v4.11.0)
