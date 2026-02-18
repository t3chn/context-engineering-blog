---
title: "Which model for which agent: metrics over intuition"
description: "Research on Claude model selection for multi-agent teams. Why Opus can be cheaper than Sonnet, and Haiku is dangerous for agentic tasks."
date: 2026-02-18
tags: ["context-engineering", "agents", "models", "claude-code"]
lang: en
---

## Problem

You spin up a team of three agents. One gets opus, another sonnet, the third haiku. Why that assignment? Because "opus is smart, haiku is cheap." Intuition instead of data.

We collected benchmarks, studied routing patterns across real systems, and found several counterintuitive results. The main one: model selection isn't about "smarter/cheaper." It's about task context.

## Context

When you work with a single model, there's no choice to make. When you run five parallel agents, every wrong assignment compounds. Opus on "count files in a directory" is wasted money. Haiku on "plan the architecture" is wasted time and tokens on rework.

The problem deepens because benchmarks don't reflect agentic reality. SWE-bench measures GitHub issue resolution, but not tool-call reliability across a 50-step loop. That's where models break differently.

We researched three dimensions: Anthropic's benchmarks, routing patterns in existing systems (oh-my-claudecode, claude-flow, RouteLLM), and practical failure modes per model in agent workflows.

## Solution

### Sonnet 4.6 ≈ Opus 4.6 on most agentic tasks

This is the main surprise from the benchmarks. On tasks relevant to coding agents, the gap is minimal:

```
OSWorld (desktop control):       Sonnet 72.5% vs Opus 72.7%
SWE-bench (GitHub issues):       Sonnet 79.6% vs Opus 80.8%
TAU-bench retail (agentic):      Sonnet 91.7% vs Opus 91.9%
GDPVal (office tasks, Elo):      Sonnet 1633  vs Opus 1606
```

Sonnet actually outperforms Opus on GDPVal and MCP Atlas (tool orchestration: 61.3% vs 59.5%). Opus leads convincingly only on deep reasoning: GPQA Diamond 91.3% vs 74.1%, ARC-AGI-2 68.8% vs 58.3%.

### Opus can be cheaper than Sonnet

The most counterintuitive finding. Opus uses 48-76% fewer tokens than Sonnet on complex tasks. Where Sonnet generates 500 tokens, Opus solves the same task in ~120.

At prices of $25 (Opus output) vs $15 (Sonnet output) per million tokens: if Opus uses half the tokens, the total cost is roughly equal. Factor in Opus solving more often on the first attempt (no retry loops), and it can come out cheaper on hard problems.

This only holds for reasoning-heavy tasks: architecture, review, planning. On mechanical tasks, Opus is just more expensive with no upside.

### Haiku is dangerous for agentic tasks

Haiku 4.5 has a confirmed bug (GitHub issue #10029): the model enters infinite tool-call loops. It calls `read_file` on the same file repeatedly, ignoring feedback that says "this tool was already called." The model fails to update its internal state based on tool results.

Additional problems:

- First-try tool success: 87% for Haiku vs 94% for Sonnet
- Reliability degrades past 75 conversation turns
- No adaptive thinking (can't dynamically scale reasoning depth)
- Planning output is 3-4x less detailed than Sonnet's

Haiku is safe for exactly one class of tasks: stateless single-step operations. Count lines, find a file, format text. Anything requiring state across tool calls needs Sonnet at minimum.

### Static routing wins

oh-my-claudecode, claude-flow, and practically every production system uses the same pattern: model is assigned by agent role, not by per-request analysis.

```
Haiku  → retrieval, formatting (mechanical)
Sonnet → implementation, research, debugging (volume)
Opus   → architecture, review, planning (judgment)
```

Dynamic routers exist (RouteLLM, Martian, Not Diamond) that analyze each request and select a model. They cut costs 40-85% while maintaining 95% quality. But they require training data and infrastructure. For agent teams of 3-5, static routing is simpler and sufficient.

An interesting finding from Anthropic's C-compiler project (16 agents, 100K lines of code, ~2,000 sessions): they used Opus for all 16 agents. No model routing at all. Specialization was by function (lexer, parser, optimizer), not by model tier.

### Three rules for selection

Does the task require judgment (correctness, trade-offs, architecture)? **Opus.**

Does the task require volume (reading, writing, coding, research)? **Sonnet.**

Is the task purely mechanical and single-step? **Haiku.**

When in doubt — **Sonnet**. Haiku fails silently, Opus is overkill. Sonnet covers ~90% of agent tasks with the best reliability-to-cost ratio.

## Insight

Model selection is a context engineering task. Not "which model is smarter," but "what context will this agent receive and what's expected of it."

The AgentIF benchmark (Tsinghua, EMNLP 2025) showed: even the best models follow fewer than 30% of complex agent instructions perfectly. The difference between Sonnet and Opus against that backdrop is noise. What actually determines the outcome is task decomposition quality, prompt clarity, and proper agent responsibility boundaries.

A model is a resource. Like CPU time or memory. Allocate it by task requirements, not by name prestige.

## Sources

- [Anthropic Sonnet 4.6](https://www.anthropic.com/news/claude-sonnet-4-6)
- [Anthropic Opus 4.6](https://www.anthropic.com/claude/opus)
- [Haiku tool loop bug — GitHub #10029](https://github.com/anthropics/claude-code/issues/10029)
- [RouteLLM — LMSYS](https://lmsys.org/blog/2024-07-01-routellm/)
- [oh-my-claudecode agents](https://github.com/Yeachan-Heo/oh-my-claudecode/blob/main/AGENTS.md)
- [Anthropic C-compiler case study](https://www.anthropic.com/engineering/building-c-compiler)
- [AgentIF benchmark — Tsinghua](https://keg.cs.tsinghua.edu.cn/persons/xubin/papers/AgentIF.pdf)
