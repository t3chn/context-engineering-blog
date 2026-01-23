---
title: "Evoidea: A Memetic Algorithm for Ideas"
description: "Applying evolutionary algorithms to startup idea generation with AI agents"
date: 2026-01-23
tags: ["context-engineering", "ai-agents", "ideation"]
lang: en
---

## Problem

Brainstorming startup ideas is chaotic. Ideas get lost or forgotten. There's no systematic way to evaluate and compare them. It's hard to improve weak spots without losing what works. Constraints like budget, timeline, and skills are often ignored.

It usually goes like this: you jot down 20 ideas on a napkin, pick the "most interesting" one by gut feeling, and a week later realize it doesn't account for your actual resources.

## Context

Memetic algorithms are evolutionary algorithms for ideas. Just as genetic algorithms work with genes, memetic algorithms work with memes — units of cultural information.

The principle is simple:

1. **Generate** — create a diverse population of ideas
2. **Critique** — evaluate each on multiple criteria
3. **Select** — best survive, weak ones go to archive
4. **Refine** — improve winners by addressing their weak points

LLMs are well-suited for each stage. They can generate ideas, critique them against given criteria, and suggest improvements. The remaining task is connecting this into a loop.

## Solution

[Evoidea](https://github.com/t3chn/evoidea) is a Claude Code skill + Rust CLI implementing the memetic cycle:

```
GENERATE → CRITIQUE → SELECT → REFINE → repeat
```

Running via Claude Code:

```bash
/evoidea "Build developer productivity tools" --rounds 3 --population 6
```

With constraints:

```bash
/evoidea "SaaS for freelancers" --budget 1000 --timeline 4 --solo --no crypto,hardware
```

Each idea is evaluated on 8 criteria:

- feasibility
- speed_to_value
- differentiation
- market_size
- distribution
- moats
- risk
- clarity

Constraints work as hard filters — any idea violating even one gets score = 0 and "eliminated" status.

Output is structured JSON with full evolution history:

```
runs/<run_id>/
├── config.json    # run parameters
├── state.json     # population + scores
├── history.ndjson # event log
└── final.json     # winner + stop reason
```

You can export the winner to landing page format:

```bash
evoidea export --run-id run-20260123-181141
```

## Insight

The evolutionary approach to ideas works because it eliminates two main problems with brainstorming:

**Attachment to the first idea.** When you come up with an idea yourself, you defend it. The algorithm is emotionless — weak ideas go to archive, strong ones evolve.

**Ignoring constraints.** It's easy to dream about a $10M startup when you have a $500 budget and 4 weeks. Hard filters bring you back to reality before you waste time developing an unviable idea.

The context engineering here is that the LLM receives not just "come up with an idea," but full context: current population, scoring history, criteria, constraints. This allows the model to make informed decisions at each stage.

## Sources

- [Evoidea on GitHub](https://github.com/t3chn/evoidea)
- [Memetic Algorithms](https://en.wikipedia.org/wiki/Memetic_algorithm)
