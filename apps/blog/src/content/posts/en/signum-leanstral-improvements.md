---

title: "What a Formal Verification Agent Taught Me About Code Audit"
description: "Studying Mistral's Leanstral -- an agent for Lean 4 theorem proving -- led to concrete improvements in Signum, a multi-model code audit pipeline."
date: 2026-03-17
tags: ["context-engineering", "claude-code", "signum", "verification", "agents"]
lang: en
hashnode_id: 69b940120095f937d162353e
hashnode_url: "https://t3chn.hashnode.dev/what-a-formal-verification-agent-taught-me-about-code-audit"
---

The morning digest surfaced [Leanstral](https://mistral.ai/news/leanstral) -- Mistral's open-source agent for formal verification in Lean 4. A mixture-of-experts model (119B total, 6.5B active per token) that scores within 80% of Claude Opus on the FLTEval theorem-proving benchmark at a fraction of the cost.

I don't need Lean 4. But the agent's architecture proved useful: multi-attempt proof search, diagnostic feedback loops, structured verification. Three of these patterns transferred well to my code audit pipeline. The other three improvements came from the same design session.

**A word on Signum.** [Signum](https://github.com/heurema/signum) is a plugin for Claude Code that turns feature requests into verifiable artifacts. It works in four phases: a Contractor agent writes a contract (spec + acceptance criteria), an Engineer agent implements it, three independent AI models audit the result (Claude for semantics, Codex for security, Gemini for performance), and a Synthesizer produces a final verdict. The pipeline iterates: if the audit finds issues, the Engineer gets a repair brief and tries again. The output is a proofpack -- a self-contained bundle of contract, diff, review findings, and decision.

## Three Patterns from Leanstral

Leanstral works through an [MCP server](https://github.com/oOo0oOo/lean-lsp-mcp) that connects the agent to Lean 4's Language Server Protocol. Its five-phase loop -- discover proof gaps, analyze subgoals, search the library for relevant lemmas, synthesize a tactic, check diagnostics -- is a structured generate-verify cycle. Three elements mapped to Signum:

**1. Verification before review.** Lean doesn't just check "does the proof compile" -- it verifies that the proof actually type-checks under the kernel. In Signum, the analogue became a policy scanner: a deterministic grep on the diff that runs *before* the LLM reviewers, catching security and unsafe patterns at zero token cost.

**2. Parallel attempts.** Lean's `multi_attempt` tool substitutes several tactics at one position and compares the resulting goal states. In Signum, this became parallel repair lanes -- two Engineer agents working in isolated git worktrees with different fix strategies.

**3. Typed diagnostics.** Lean LSP returns structured error objects (file, line, message, severity), not raw text. In Signum, the mechanic phase now returns a hybrid format with typed findings instead of a flat "regressions: true/false" boolean.

## Policy Scanner

The cheapest improvement. Between the mechanic step (lint, typecheck, tests) and the multi-model code review, a new bash script scans the unified diff for known dangerous patterns. 195 lines, zero LLM cost.

It scans only addition lines. 12 patterns in three categories:

- **Security** (blocks the pipeline): `eval`, subprocess with `shell=True`, `innerHTML`, SQL string concatenation, weak crypto
- **Unsafe** (flagged for review): `TODO`/`FIXME`/`HACK` markers, debug statements
- **Dependency** (flagged for review): new entries in package managers -- but only when the file is actually a manifest (`package.json`, `Cargo.toml`, etc.), not a README or test fixture

Three design decisions came from asking Codex (GPT) and Gemini independently, then comparing answers -- a process I call an "arbiter panel" (all three models -- Claude, Codex, Gemini -- agreed on each):

1. **Fail-closed** on missing input. If the diff file doesn't exist, the scanner exits with an error rather than silently producing zero findings.
2. **Manifest-only filtering** for dependency patterns. Without it, any JSON key-value pair in any file triggers a false positive.
3. **Curated sinks** over broad regexes. A short list of known-dangerous calls (`subprocess.call`, `child_process.spawn`) beats a generic pattern that matches harmless calls like `db.query()`.

## Typed Diagnostics

Before this change, the mechanic report was a flat summary: lint passed or failed, tests passed or failed, regressions yes or no. The Engineer agent in repair mode received this as a blob and had to guess which file and line to fix.

Now the mechanic produces a hybrid format: always a summary per check, plus per-file findings when the runner supports structured output. Each finding carries an `origin` field -- `"structured"` for JSON output (ruff, eslint), `"stable_text"` for parseable text (tsc, mypy), or `"none"` for summary only. The pipeline gates on the summary; findings are hints, not source of truth.

An aside on catching bugs with the pipeline itself: Claude Opus found a critical issue on the very first review of this feature. A `|| true` after a command substitution silently masked the exit code, making the return value always zero. Regression detection was dead for all eight supported runners. One token. The iterative repair loop fixed it in a single pass -- exactly the kind of convergence the system is built for.

## Parallel Repair Lanes

The most complex change. Previously, the repair loop was sequential: one Engineer attempt, audit, next attempt. Now it spawns two Engineers in parallel, each in an isolated git worktree:

- **Lane A**: "Fix with minimal targeted changes. Patch only the flagged lines."
- **Lane B**: "Fix by addressing the root cause. May touch more files."

Both receive the same repair brief. After both complete, the pipeline runs lightweight checks (lint, typecheck, tests, hidden validation scenarios) on each lane, scores them, and sends only the winner through the full three-model review. If the winner still has serious findings, the runner-up also gets reviewed before the iteration is declared failed.

Same principle as Lean's `multi_attempt`: explore the solution space in parallel, select the best candidate, verify once.

## Three More Changes

These came from the same design session but aren't directly Leanstral-inspired:

**Dynamic strategy injection.** The Contractor agent now classifies the task type (bugfix, feature, refactor, security) via keyword scan and generates a strategy hint in the contract. The Engineer reads it as a process guide -- "reproduce bug with a test first" for bugfixes, "find all occurrences of the pattern, not just the reported one" for security fixes. Informational only; it doesn't block the pipeline.

**Context retrieval for reviewers.** A new pre-review step gathers git history (last commit per modified file), issue references (parsed from the goal text), and the project's intent document. This context is injected only into the Claude reviewer -- Codex and Gemini remain isolated (goal + diff only), preserving their value as independent validators. The intent is to reduce false positives by giving the semantic reviewer context about *why* the code looks the way it does.

**Approval UX.** A small fix: the contract approval display now uses markdown formatting instead of fragmented bash output. The goal text is never truncated, the summary is a compact table, and warnings are grouped.

## What I Learned

Each feature went through the full pipeline: design panel, contract, implementation, three-model audit, iterative repair. Of six runs, only one passed on the first attempt (the simplest change). The rest required two to three iterations.

The pattern that emerged: the Engineer's first pass satisfies all acceptance criteria, but code review surfaces real bugs -- exit code masking, race conditions on shared file paths, missing field mappings. The iterative loop fixes them in one or two passes. In this sample of six changes, the system behaved as intended: not a gatekeeping checkpoint, but a convergence loop.

The full session: 7 commits, roughly 1,900 lines of changes, 5 design panels, over 15 multi-model review rounds. It started from one line in a morning news digest.
