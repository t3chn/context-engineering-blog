---
title: "11 Plugins, One Marketplace: Building an AI Agent Toolkit from Scratch"
description: "How I built a plugin ecosystem for Claude Code — from scattered scripts to a full lifecycle with scaffolding, quality gates, multi-AI review, and one-command install."
date: 2026-03-02
tags: ["context-engineering", "claude-code", "plugins", "agents", "open-source"]
lang: en
---

## Problem

AI agent tools are scattered. A CLAUDE.md snippet here, a bash script there, a command copied from someone's repo with no version, no tests, no way to verify it does what it claims. Each tool works in isolation. No lifecycle: create, test, publish, discover, install. No trust: you paste a skill from the internet and hope it doesn't hallucinate its way through your codebase.

I kept hitting the same wall: I'd build a useful command for Claude Code, then need it in another project. Copy-paste. Drift. Two months later, three incompatible copies. The core problem isn't any single tool — it's the absence of infrastructure around them.

## Context

Claude Code has a plugin system. A `plugin.json` manifest, a `.claude-plugin/` directory structure, marketplace registration via `marketplace.json`. The primitives are there: skills, commands, hooks, agents, MCP servers. Anthropic built the runtime. What's missing is the tooling layer on top.

The gap is familiar from every ecosystem: npm existed before create-react-app. PyPI existed before cookiecutter. The package manager ships first, the developer experience ships later. Claude Code is in that "later" phase now.

[heurema](https://github.com/heurema) is the attempt to fill that gap. The philosophy: "Craft, not conjuring." Stdlib-first, minimal dependencies, quality gates before publish, no magic. Every plugin passes `ruff + mypy --strict + pytest` before it ships. If it can't be tested, it doesn't ship.

## Solution — The Ecosystem

### The Marketplace: emporium

[emporium](https://github.com/heurema/emporium) is the single entry point. One command to add the marketplace, one command per plugin:

```bash
# Add the marketplace (once)
claude plugin marketplace add heurema/emporium

# Install any plugin
claude plugin install signum@emporium
claude plugin install herald@emporium
claude plugin install arbiter@emporium
```

Under the hood it's a `marketplace.json` mapping plugin names to their GitHub repos. No registry server, no authentication, no build step. Git repos all the way down.

Currently 11 plugins across four categories: development pipeline, productivity, trading signals, and creative tools.

### Development Pipeline

These four plugins cover the full loop from "I have a task" to "it's reviewed, tested, and shipped."

**[signum](https://github.com/heurema/signum)** — Evidence-driven development pipeline. Takes a task description and runs it through four phases: CONTRACT (scope lock) -> EXECUTE (implementation with repair loop) -> AUDIT (parallel multi-model review) -> PACK (artifact generation). The audit phase is the interesting part: Claude Opus, Codex, and Gemini review the diff independently. Critical findings from any model block the merge. Important findings require 2+ models to agree. Every AI finding is validated against the actual diff — if the model cites a line that doesn't exist, the finding is discarded as hallucination.

```bash
/signum"Add rate limiting to the API endpoint"
```

**[arbiter](https://github.com/heurema/arbiter)** — Multi-AI orchestrator. Routes tasks to Codex CLI and Gemini CLI from inside Claude Code. The `panel` mode runs both in parallel and formats a side-by-side comparison. The `quorum` mode runs a formal two-round vote (APPROVE/BLOCK/NEEDS_INFO) with a deterministic policy and adversarial tiebreaker. The `diverge` mode is the most unusual: three independent implementations in isolated git worktrees with different strategy hints (minimal, refactor, redesign), presented as an anonymized decision matrix.

```bash
/arbiter panel "Should we use WebSockets or SSE for real-time updates?"
/arbiter quorum "Is this migration safe to run in production?"
/arbiter diverge "Implement the caching layer"
```

**[anvil](https://github.com/heurema/anvil)** — Plugin dev/test toolkit. Scaffolds new plugins from templates, runs 6-layer validation (schema, structure, hooks, conventions, consistency, install docs), and tests hooks with fixtures. Includes an AI code reviewer agent that checks against a 21-point checklist and returns APPROVE or REQUEST CHANGES.

```bash
/anvil:new my-plugin
/anvil:check ./my-plugin
/anvil:test ./my-plugin
```

**[forge](https://github.com/heurema/forge)** — Plugin lifecycle manager. Where anvil focuses on dev/test, forge handles the full lifecycle: scaffold from Jinja2 templates, verify quality gates, register in both the workspace registry and the emporium marketplace. Five commands covering the path from `forge-new` to `forge-register`.

```bash
/forge-new awesome-plugin
/forge-verify
/forge-register
```

### Productivity

**[herald](https://github.com/heurema/herald)** — Daily news digest. Zero API keys, fully local. Sets up RSS feeds by topic (ai-engineering, rust, devops, security, etc.), fetches from RSS + Hacker News, runs 3-layer deduplication (URL hash, normalization, title similarity), scores by keyword relevance, and delivers the top 10 stories directly in Claude Code. A SessionStart hook notifies you when a fresh digest is ready.

```bash
/news init ai-engineering
/news digest
```

**[reporter](https://github.com/heurema/reporter)** — Bug/feature reporter. Auto-detects which heurema product you're working with (via git remote, plugin.json, or pyproject.toml), walks you through a focused issue template, silently attaches environment context (OS, shell, Claude Code version), and submits via `gh` CLI. If `gh` isn't available, copies the issue body to clipboard and prints the GitHub URL.

```bash
/report bug
/report feature
```

### Trading Signals

**[oracle](https://github.com/forgequant/oracle)** — Options volatility signals. Pulls data from Deribit (no API keys needed for public data) and computes: risk reversal (IV skew), put/call ratio, DVOL modifier, term structure ratio. Outputs a weighted direction score with a confidence formula that degrades under high volatility or backwardation. Caches snapshots with freshness decay.

```bash
/deribit --asset BTC
```

**[sentinel](https://github.com/forgequant/sentinel)** — Sentiment aggregator. Four independent sources in a unified signal format: Fear & Greed index (with 30-day z-score and 90-day percentile), CryptoPanic + RSS news scanning, Polymarket prediction markets, and LunarCrush social intelligence. First three work without API keys; LunarCrush is an optional premium upgrade.

```bash
/feargreed
/polymarket
/news-scanner
```

### Creative

**[genesis](https://github.com/heurema/genesis)** — Memetic algorithm for startup ideas. Three AI personas (generator, critic, arbiter) run evolutionary rounds: GENERATE -> CRITIQUE -> SELECT -> REFINE. Eight scoring dimensions with four strategies (bootstrapper, growth, moat, uniform). Hard constraint enforcement (budget, timeline, skills, solo-mode) eliminates unviable ideas before expensive refinement. Fresh variate injections on round 2+ prevent convergence.

```bash
/genesis "Developer productivity tools" --rounds 3 --strategy bootstrapper
```

**[glyph](https://github.com/heurema/glyph)** — Terminal demo GIF generator. Describe what you want the demo to show, and it generates a synthetic asciicast recording with realistic typing timing — no real commands executed. Built-in PII audit blocks output containing home paths, emails, API keys, or secrets. Seeded RNG for reproducible results. Themes: Monokai default and amber retro CRT.

```bash
/glyph "Show installing the plugin and running the first command"
```

### Reference

**[teams-field-guide](https://github.com/heurema/teams-field-guide)** — The field guide for Claude Code multi-agent systems. Seven orchestration patterns, custom agent configuration, cost optimization via model distribution, known bugs with workarounds, and coverage of 26+ ecosystem projects. Not a plugin in the traditional sense — it's documentation distributed as a plugin for discoverability.

### Quality Gates

Every plugin in the ecosystem passes the same gates:

- **ruff** — linting and formatting
- **mypy --strict** — full type checking
- **pytest** — test coverage
- **forge verify** — pre-publish quality gate (structure, manifest, conventions)
- **anvil check** — 6-layer validation with JSON report
- **signum audit** — adversarial multi-model review for non-trivial changes

The forge -> anvil -> signum pipeline means a plugin is validated at three levels before it reaches the marketplace: lifecycle compliance, structural correctness, and code quality under adversarial review.

## Insight

Plugin ecosystems compound. herald delivers news that informs trading decisions made with oracle and sentinel signals. reporter files bugs found during signum reviews. forge scaffolds new plugins that anvil validates. Each tool makes the others more useful.

The real moat isn't any single plugin. It's the lifecycle: `forge-new` -> develop -> `anvil:check` -> `forge-verify` -> `forge-register` -> discoverable in emporium. Any individual tool can be replicated. The pipeline connecting them is harder to copy because it encodes decisions about quality, trust, and distribution.

Open source AI tooling has a trust problem. Anyone can publish a skill that claims to "optimize your codebase." Does it? Has it been tested? Does it pass type checking? Is the review automated or just vibes? The answer for most tools today is: unknown. The bet behind heurema is that trust infrastructure — quality gates, adversarial review, verified manifests — matters more than any individual clever prompt.

Eleven plugins, one marketplace, zero API keys required for the core tools. That's the starting point, not the finish line.

## Sources

- [emporium — Plugin Marketplace](https://github.com/heurema/emporium)
- [signum — Development Pipeline](https://github.com/heurema/signum)
- [arbiter — Multi-AI Orchestrator](https://github.com/heurema/arbiter)
- [anvil — Plugin Dev Toolkit](https://github.com/heurema/anvil)
- [forge — Plugin Lifecycle Manager](https://github.com/heurema/forge)
- [herald — News Digest](https://github.com/heurema/herald)
- [reporter — Bug/Feature Reporter](https://github.com/heurema/reporter)
- [oracle — Options Volatility Signals](https://github.com/forgequant/oracle)
- [sentinel — Sentiment Stack](https://github.com/forgequant/sentinel)
- [genesis — Memetic Ideation](https://github.com/heurema/genesis)
- [glyph — Terminal Demo GIFs](https://github.com/heurema/glyph)
- [teams-field-guide — Multi-Agent Guide](https://github.com/heurema/teams-field-guide)
- [skill7.dev — Plugin Directory](https://skill7.dev)
