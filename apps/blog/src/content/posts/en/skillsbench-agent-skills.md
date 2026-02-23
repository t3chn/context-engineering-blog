---
title: "First Agent Skills Benchmark: What Works, What Doesn't, and Why Context Matters"
description: "Analyzing SkillsBench — the first systematic benchmark for Agent Skills. 7,308 trajectories, critical review, and why skills are context engineering for agents."
date: 2026-02-23
tags: ["context-engineering", "agents", "skills", "benchmark"]
lang: en
---

Everyone who works with AI agents writes instructions for them. CLAUDE.md, .cursorrules, system prompts — call them what you want. Some people write 50 lines, some write 500. Everyone has strong opinions. Nobody had data.

Until February 2026.

## Problem

Agent Skills are procedural instructions that shape how an agent operates: what tools to use, how to structure output, what conventions to follow. They are, in essence, context engineering for agents — the same discipline as RAG and prompt design, applied at the behavioral level.

The problem: there was no systematic benchmark. No one had measured whether Skills actually improve agent performance, which formats work best, or whether models can write their own.

SkillsBench (Li et al., arXiv:2602.12670, Feb 2026) is the first attempt.

## Context

The numbers are real:

```
84 tasks × 11 domains × 7 agent-model configs = 7,308 trajectories
Agents: Claude Code, Gemini CLI, Codex CLI
Conditions: no skills / curated skills / self-generated skills
Headline result: +16.2pp with the right skills
```

Eleven domains include Software Engineering, Healthcare, Finance, Legal, and others. The cross-domain coverage is important — it lets you see where Skills help most and where they don't.

Our trust assessment: **6/10 (MEDIUM-LOW)**. The data is real; the interpretation needs scrutiny.

## Findings

### What holds up

**Self-generated skills don't help — at least in this benchmark.** Average delta: -1.3pp. This is the most robust result in the paper. When you ask a model to write its own procedural guidance, it produces something that either doesn't help or actively hurts. Models are good at many things. Structuring effective operational context for themselves is not one of them. Human curation is not a nice-to-have — it's load-bearing.

**2-3 skills outperform 4+.** Context dilution is real. More skills means more noise, more potential for conflicting instructions, more cognitive overhead for the agent. The optimal range is narrow.

**Detailed > Comprehensive.** Concise stepwise instructions with one working example beat exhaustive documentation. Comprehensive skills in the benchmark actively hurt performance: -2.9pp. This is a direct parallel to RAG: a focused 3-paragraph document often beats a 30-page dump.

**Domain dependence is large.** Healthcare: +51.9pp. Software Engineering: +4.5pp. The pattern makes sense — Skills help most where pretrained knowledge is weakest. For domains well-represented in training data, Skills add less. For specialized or low-resource domains, they can be transformative.

### Why Trust Is 6/10

**Selection bias in the headline number.** The benchmark uses top-quartile Skills (score ≥9/12) against an ecosystem mean of 6.2/12. The +16.2pp is the ceiling for well-written Skills, not the average. A realistic estimate for typical Skills in the wild: +5-10pp.

**Harness confounding.** Claude Code was trained on the Agent Skills specification. You cannot cleanly separate the effect of a Skill from the model's training alignment with that Skill's format. Claude Code's +23.3pp might be 50%+ a training effect. The paper doesn't control for this.

**No baselines.** There is no comparison with RAG, few-shot examples, tool documentation, or length-matched controls. We don't know if a well-written Skill outperforms simply providing the same information in a different format. "Skills work" and "this format of context works" are different claims.

**Ecological validity.** All evaluations are containerized, terminal-only, single-session. Real multi-agent workflows — cross-session memory, agent handoffs, parallel task execution — are not represented. The benchmark measures something real, but not the full picture.

## Our Experiment

One of the paper's implicit questions: can the right Skill compensate for a less capable model? We tested this directly.

Task: review commit b094d77 in the argus project — 925 lines across 12 files, Python/Bash/Markdown.

Setup: sonnet + code-review Skill vs opus baseline.

```
                        Sonnet + Skill    Opus (raw)
Findings total          7                 13
Critical (total)        3                 1
Security-critical       2                 0
Convention violations   1                 0
Cost                    ~$0.15            ~$0.70
```

Sonnet + skill found two critical path traversal vulnerabilities (pool_dir, case_id) that opus missed entirely. Both caught the shared race condition (PID write after mkdir). Sonnet also caught a CLAUDE.md convention violation — awareness that came directly from the skill's context about project conventions.

Opus produced more findings by volume (DRY violations, missing session log, release ownership), but missed the security-critical bugs.

Cost delta: 5x cheaper. Quality on the metric that matters at a security gate: better.

This is not a general claim that sonnet beats opus. It's a specific claim: for structured review tasks with a well-targeted Skill, sonnet is sufficient and the cost difference is real.

## Insight

Skills are context engineering for agents. The same principles that govern RAG and prompt design apply here:

- **Structure matters more than volume** — Detailed > Comprehensive, same as a focused document > a dump
- **Diminishing returns are sharp** — 2-3 skills > 4+, same as 2-3 relevant chunks > 20
- **Human curation is irreplaceable** — models can't structure their own operational context, same as models can't reliably curate their own retrieval
- **Target your domain** — Skills help most where pretrained knowledge is weakest, same as retrieval helps most where parametric knowledge is absent

The paper is an important first attempt. The methodology is sound enough to extract signal. But the headline number (+16.2pp) requires context: it's the ceiling for top-quartile Skills, not the expected value for average ones.

The honest takeaway: well-written Skills help. Poorly-written ones — especially self-generated ones — hurt. The optimum is narrow (2-3 skills, concise, stepwise, with examples). And the benefit is largest where it's least obvious: specialized domains where you might assume the model already knows enough.

Just like any context.

## Sources

- [SkillsBench — Li et al., arXiv:2602.12670](https://arxiv.org/abs/2602.12670)
- [Anthropic Claude Sonnet 4.6](https://www.anthropic.com/news/claude-sonnet-4-6)
- [Anthropic Claude Opus 4.6](https://www.anthropic.com/claude/opus)
