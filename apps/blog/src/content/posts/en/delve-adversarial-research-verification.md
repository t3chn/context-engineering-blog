---
title: "Research Agents Lie. The Fix Is Adversarial Verification."
description: "Most AI research tools optimize for coherent synthesis, not factual accuracy. Delve adds a claim-level adversarial verification stage that changes the trust model entirely."
date: 2026-03-10
tags: ["context-engineering", "claude-code", "agents", "deep-research", "verification"]
lang: en
canonical_url: "https://ctxt.dev/posts/en/delve-adversarial-research-verification"
---

You asked an AI research assistant a detailed question and got a confident multi-page answer with citations. Some of those citations don't exist. Several facts contradict each other. The synthesis reads well — it's structured, well-argued, fluent. It's also built on claims no one verified.

This is not an edge case. It's the default behavior of every research agent I've looked at.

## The problem

Research agents optimize for coherence, not correctness. The workflow is always some variation of: gather sources → read and chunk → synthesize. The final output is shaped by what reads well together, not what's actually true.

The failure mode is subtle. You get a report that passes casual inspection. No obvious hallucinations, reasonable citations, plausible numbers. But if you trace the actual claims — "X was released in 2023", "Y's accuracy is 94%", "Z approach outperforms alternatives by 40%" — a significant fraction are wrong, unverifiable, or sourced from a single origin that all the other citations are copying.

This is worse than no research. It produces false confidence. You walk away with a mental model that has errors baked in at the foundation level.

## The landscape

I went through seven OSS research frameworks to understand what they actually do: node-deepresearch, deep-research (dzhng), GPT-Researcher (assafelovic), STORM (Stanford), plus the commercial systems — OpenAI Deep Research, Gemini Deep Research, Perplexity.

Every one of them follows the same pattern: decompose topic → search and fetch → synthesize. Some have multi-step retrieval, some have recursive query expansion, some have beautiful citation formatting. None verify claims adversarially after synthesis.

Perplexity leads on speed and gets 93.9% on SimpleQA. OpenAI and Gemini lead on depth. GPT-Researcher won CMU's DeepResearchGym benchmark. These are real achievements. But the benchmark question is "did the final report contain the right answer?" — not "what percentage of atomic claims in the report are independently verified?"

That's the gap.

## Delve

Delve is a Claude Code plugin built as a pure SKILL.md file. No binaries, no scripts — just orchestration logic and reference prompts. Five stages:

```
SCAN → DECOMPOSE → DIVE → VERIFY → SYNTHESIZE
```

The first three stages are table stakes: scan existing sources and memory, decompose the topic into 2-6 independent sub-questions, dispatch parallel research subagents (2-6 depending on `--depth`) to investigate each one. Standard research pipeline, done well.

The fourth stage is where it differs.

### VERIFY: adversarial claim-level checking

After DIVE completes, before synthesis touches anything, VERIFY runs independently:

**Step 1: Claim extraction.** All dive outputs get decomposed into atomic claims. Not summaries — individual assertions. "X library achieves 94% accuracy on benchmark Y." "Project Z was last updated in 2024." "The approach outperforms alternatives by a factor of 3." Each claim gets a `c_<hash>` identifier and a classification: factual, quantitative, time-sensitive, methodology, opinion.

**Step 2: Adversarial verification.** Independent subagents receive batches of claims. The prompt framing is explicit: find flaws, don't confirm. Crucially, these agents do not see the original research context — no anchoring to the synthesis they're checking. They go look for independent evidence.

```
verdict: "verified" | "contested" | "rejected" | "uncertain"
```

Each verdict includes evidence and sources. Source independence is checked: three blog posts copying the same press release don't count as three confirmations.

**Step 3: Synthesis with explicit provenance.** Contested claims get both sides presented with evidence. Rejected claims are excluded or flagged. If more than 30% of claims are contested, the output is labeled `draft`. The report includes a Methodology section showing which stages ran, how many agents, timing, and the quality verdict.

### Quality model

The output carries two orthogonal labels:

- **Verification status**: `verified` (≥80% claims checked, 0 failed P0) / `partially-verified` / `unverified`
- **Completion status**: `complete` / `incomplete` / `draft` / `synthesis_only` / `no_evidence`

This is honest accounting. If verification was skipped because sources were unavailable, you know. If the report is flagged `draft` because the landscape is contested, you know that too.

### Pipeline diagram

```
/delve "autoresearch landscape" --depth medium

SCAN     [~25s]   → 12 sources found, decision: full-run
DECOMPOSE [~5s]   → 4 sub-questions decomposed
         ↓ HITL checkpoint: approve/edit sub-questions
DIVE     [~4min]  → 4 agents in parallel (background)
         ↓ all P0 completed, coverage 1.0
VERIFY   [~90s]   → 47 claims extracted, 3 agents
         ↓ 42 verified, 4 uncertain, 1 rejected
SYNTHESIZE[~15s]  → report written
         ↓
docs/research/2026-03-10-autoresearch-landscape-a1b2.md
quality: verified / complete
```

### Usage

```bash
/delve "autoresearch landscape" --depth medium
/delve "WASM runtimes for edge" --quick          # scan + synthesize only, ~90s
/delve "security audit approach X" --providers claude  # single-model, sensitive topic
/delve resume                                    # resume interrupted run
/delve status                                    # list recent runs
```

Resume support is file-based with `events.jsonl` as the canonical log. If the orchestrator crashes mid-DIVE, `/delve resume` reuses completed worker outputs and continues from where it stopped.

## The design insight

The standard framing is "research is a retrieval problem." Add more sources, better chunking, smarter query expansion. This produces marginal improvements on the coherence metric while leaving the correctness problem untouched.

Delve treats research as a verification problem. The VERIFY stage adds 40-60% to total run time. The tradeoff is explicit: you get a report where the trust model is different. Not "the AI synthesized this confidently" but "these claims were checked by agents with adversarial prompting and independent access."

That said — an honest admission. Verification quality depends on what's available. Some domains have sparse or low-quality web coverage. Time-sensitive facts from internal systems or paywalled sources may come back `uncertain` regardless of how many agents look. The quality model makes this explicit rather than hiding it behind confident prose.

The `--providers claude` flag handles sensitive topics: single-model mode where external subagent dispatch is blocked. Maximum verification label in that mode is `partially-verified` — same-model verification isn't structurally independent, and the report says so.

## Install

```bash
claude plugin marketplace add heurema/emporium
claude plugin install delve@emporium
```

- GitHub: [github.com/heurema/delve](https://github.com/heurema/delve)
- Plugin page: [skill7.dev/plugins/delve](https://skill7.dev/plugins/delve)
