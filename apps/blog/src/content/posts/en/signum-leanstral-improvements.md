---
title: "How a Formal Verifier Inspired 6 Improvements to Code Audit"
description: "Mistral's Leanstral -- an agent for Lean 4 -- suggested concrete patterns for Signum: policy scanner, typed diagnostics, parallel repair lanes."
date: 2026-03-17
tags: ["context-engineering", "claude-code", "signum", "verification", "agents"]
lang: en
---

The morning digest surfaced Leanstral -- Mistral's open-source agent for formal verification in Lean 4. A 119B parameter model with only 6.5B active, solving theorem proving tasks at 1/92 the cost of Claude Opus.

I don't need Lean 4 itself. But the agent's architecture proved useful: multi-attempt proof search, diagnostic feedback loops, structured verification -- patterns that transfer directly to code audit. In one day, I implemented six of them in Signum v4.9.0.

## What I Took from Leanstral

Leanstral works through the `lean-lsp-mcp` MCP server, which gives the agent access to Lean 4's Language Server Protocol. Five phases: Discovery (find proof holes) -> Analysis (extract subgoals) -> Retrieval (search Mathlib) -> Synthesis (try tactics) -> Diagnostic Feedback (error -> correction).

Three patterns translated to Signum:

**1. `lean_verify` -- verification as a separate step.** Lean checks not just "does it compile" but "are axioms used correctly." In Signum, the analogue became a policy scanner -- deterministic grep on the diff before LLM review.

**2. `lean_multi_attempt` -- parallel attempts.** Lean substitutes multiple tactics at one position and compares goal states. In Signum -- parallel repair lanes with different fix strategies.

**3. Diagnostic feedback loop -- structured feedback.** Lean LSP returns typed errors, not raw text. In Signum -- typed diagnostics from mechanic instead of a flat boolean.

## Policy Scanner: grep Instead of LLM

The cheapest improvement. Between mechanic (lint/typecheck/tests) and code review, Step 3.1.3 appeared -- `lib/policy-scanner.sh`. A bash script, 195 lines, zero LLM cost.

Scans only addition lines in unified diff. 12 patterns in three categories:

- **Security** (CRITICAL): `eval`, `subprocess.call` with `shell=True`, `innerHTML`, SQL injection via concatenation, weak crypto (`md5`, `sha1`)
- **Unsafe** (MINOR): `TODO`/`FIXME`/`HACK`, `console.log`, `debugger`
- **Dependency** (MAJOR): new entries in `package.json`, `Cargo.toml`, `pyproject.toml`, `go.mod` -- manifest files only

A CRITICAL policy finding triggers AUTO_BLOCK in the synthesizer -- same as mechanic regressions.

Three design decisions via arbiter panel (Codex + Gemini, 3/3 consensus):

1. **Fail-closed** on missing patch (exit 1, not exit 0). A missing patch is a pipeline integrity failure, not "zero findings."
2. **Manifest-only** for dependency patterns. Without filename filtering, you catch READMEs, tests, comments.
3. **Curated sinks** instead of generic `exec`/`print`. A short list of high-signal calls beats broad regexes with low precision.

## Typed Diagnostics: Structured Mechanic Output

Before v4.9, the mechanic report was flat: `{lint: {status, exitCode, regression}, tests: {...}, hasRegressions: bool}`. The Engineer in repair mode received it as a blob.

Now `lib/mechanic-parser.sh` produces a hybrid format: summary per check always + per-file findings when the runner supports structured output.

```json
{
  "checks": [
    {"id": "tsc", "category": "typecheck", "status": "fail",
     "baseline_status": "pass", "regression": true, "count": 3,
     "findings_available": true}
  ],
  "findings": [
    {"check_id": "tsc", "file": "src/foo.ts", "line": 42,
     "code": "TS2322", "message": "Type 'X' is not assignable to 'Y'",
     "origin": "structured"}
  ]
}
```

`origin` is the key field. `"structured"` = JSON output (ruff, eslint). `"stable_text"` = parseable text (tsc, mypy). `"none"` = summary only. Gating and regression detection use summary. Findings are repair hints for the engineer, not source of truth.

Claude Opus caught a critical bug on the very first review: `|| true` after command substitution masked the exit code, making regression detection completely broken for all 8 runners. One token broke the entire mechanic phase. Iterative repair fixed it in one iteration.

## Parallel Repair Lanes

The most complex feature. Previously the repair loop was sequential: one fix attempt -> audit -> next attempt. Now Step 3.6.2 spawns two Engineer agents in parallel git worktrees:

- **Lane A**: "Fix with minimal targeted changes. Patch only the specific lines."
- **Lane B**: "Fix by addressing the root cause. May touch more files."

Both receive the same `repair_brief.json`. Both work in isolated worktrees, seeded from the current best candidate. After completion:

1. Mechanic + holdout on each lane
2. Score using the `iterationScore` formula
3. Full review panel on winner only
4. If winner gets MAJOR+ -- also review the runner-up

Inspired by `lean_multi_attempt`, which substitutes multiple tactics at one position and compares remaining subgoals. Same principle: explore solution space, select best, verify once.

## The Other Three

**Dynamic strategy injection.** The Contractor classifies task type (bugfix/feature/refactor/security) via keyword scan and generates `implementationStrategy` in the contract. The Engineer reads it as a process guide: bugfix -> "reproduce bug with test first," security -> "find all occurrences, not just the reported one." Informational only -- doesn't block the pipeline.

**Context retrieval.** New Step 3.2.0 before code review gathers: git history (last commit per file), issue refs (ID + title), project.intent.md. All injected into the Claude reviewer only -- Codex and Gemini remain adversarially isolated. Goal: reduce false positives through context about "why the code is this way."

**Approval UX.** Small but noticeable: replacing fragmented bash echo blocks with markdown-first display during contract approval. Goal is never truncated, table is compact, warnings are grouped.

## The Process

Every feature went through the full pipeline: arbiter panel -> signum contract -> engineer -> 3-model audit -> iterative repair -> proofpack. Of six runs, only one got AUTO_OK on the first pass (dynamic strategy -- the simplest). The rest required 2-3 iterations.

The general pattern: the Engineer's first pass satisfies all ACs, but code review finds bugs -- from `|| true` exit code masking to race conditions on shared paths in parallel worktrees. Iterative repair fixes them in 1-2 iterations. The system works as designed: not gatekeeping, but a convergence loop.

The full day: 7 commits, ~1,900 lines, 5 arbiter panels (Codex + Gemini, 4 of 5 unanimous), 15+ multi-model review rounds. Started from one line in the morning digest.
