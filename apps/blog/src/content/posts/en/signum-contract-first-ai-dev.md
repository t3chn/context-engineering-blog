---
title: "The Contract Is the Context: How Signum Makes AI Code Verification Principled"
description: "Why running AI-generated code through more AI reviewers doesn't solve the reliability problem — and what a contract-first pipeline changes about it."
date: 2026-03-03
tags: ["context-engineering", "claude-code", "agents", "verification", "contract-first"]
lang: en
---

You can review an AI diff with three models and still have zero ground truth. They'll tell you what looks "reasonable", not what's correct.

The failure mode isn't "bad code". It's unfalsifiable intent: the requirement never became something you can run. You approved an implementation that satisfies your assumptions. The edge cases you didn't think to specify weren't caught, because there was nothing to catch them against. Two months later a bug report shows up.

This is a context engineering problem.

## The Missing Context Layer

Every verification process needs two things: the artifact being verified and the standard it's measured against. Code review as practiced today is strong on the first and weak on the second. The "standard" lives in the reviewer's head — reconstructed from the task description, comments, and surrounding code. Implicit, incomplete, unshared.

Context engineering is about making implicit context explicit. For verification, this means the standard must exist _before_ implementation starts, not after. The contract is the context. Without one, all review is interpretation.

## Signum: Contract as Ground Truth

[Signum](https://github.com/heurema/signum) is a Claude Code plugin that enforces a four-phase pipeline:

```
CONTRACT → EXECUTE → AUDIT → PACK
```

**CONTRACT** comes first. You describe your task in plain language. The Contractor agent (Claude Sonnet) formalizes it into `contract.json`:

```json
{
  "goal": "Add rate limiting to POST /api/tokens — max 5 requests per minute per IP",
  "acceptanceCriteria": [
    {
      "id": "AC1",
      "description": "Requests over the limit return 429 with Retry-After header",
      "verify": "pytest tests/test_rate_limit.py -k test_429_response",
      "holdout": false
    },
    {
      "id": "AC2",
      "description": "Rate limit counter resets after the window expires",
      "verify": "pytest tests/test_rate_limit.py -k test_window_reset",
      "holdout": true
    }
  ],
  "inScope": ["src/api/tokens.py", "tests/test_rate_limit.py"],
  "riskLevel": "medium"
}
```

The spec is graded A–F across six dimensions (testability, negative coverage, clarity, scope, completeness, boundary cases). Grade D is a hard stop — the pipeline doesn't proceed until the spec is verifiable.

**EXECUTE**: The Engineer agent receives `contract-engineer.json` — the contract with `holdout: true` criteria physically removed. It implements against the visible spec. It can't optimize for what it can't see.

**AUDIT**: The Mechanic (deterministic, zero-LLM) runs lint, typecheck, and tests against pre-implementation baseline. Then Claude, Codex, and Gemini review the diff independently in parallel. The holdout criteria — `AC2` in the example above — run against the finished result. If the Engineer forgot to reset the counter on window expiry, this is where it gets caught, automatically, against a criterion it never saw.

**PACK**: `proofpack.json` — contract SHA-256, approval timestamp, base commit, diff, audit results. CI gates on it.

## What Signum Blocks

Before implementation can start, Signum rejects:

- Acceptance criteria without a `verify` command (can't be tested = not a criterion)
- Vague scope ("modify the auth module" without file-level specificity)
- Risky assumptions flagged by external validators (Codex + Gemini review the spec for gaps)
- Specs grading below D — missing boundary cases, negative coverage, or clarity

After implementation, AUTO_BLOCK on:

- Policy violations (too many files changed, denied bash patterns in the diff)
- Repo invariant regressions (if `pytest -q` was passing before, it must pass after)
- Holdout failures

## Repo-Level Invariants: The Permanent Contract

Task-level contracts cover what you're building now. `repo-contract.json` covers what must always hold:

```json
{
  "invariants": [
    { "id": "I-1", "description": "All tests pass", "verify": "pytest -q", "severity": "critical" },
    { "id": "I-2", "description": "No type errors", "verify": "mypy src/", "severity": "critical" }
  ],
  "owner": "human"
}
```

Signum captures baseline before EXECUTE, re-runs after. Any regression is AUTO_BLOCK, regardless of task-level results. The `"owner": "human"` field declares this file is a human artifact. The AI enforces it; you define it.

## The Audit Chain

At user approval, Signum hashes `contract.json` (SHA-256) and records the timestamp. Before the Engineer runs, the base commit is captured. The resulting proofpack ties: approved contract → base commit → implementation diff → audit results. You can't retroactively swap the contract and claim the proofpack was built against it.

This matters as AI-generated code increasingly needs provenance. Not "an AI wrote this" — "an AI implemented this against _this_ contract, validated before implementation, with _these_ audit results."

## Install

```bash
# Add the marketplace (once)
claude plugin marketplace add heurema/emporium

# Install Signum
claude plugin install signum@emporium

# Optional: external model CLIs for multi-model audit
# https://github.com/openai/codex
# https://github.com/google-gemini/gemini-cli
```

Then run:

```
/signum "add rate limiting to the API endpoint"
```

Signum grades your spec, shows the contract for approval, runs the Engineer with holdouts removed, audits from multiple angles, and produces `proofpack.json`.

## Status

**Works today:** Four-phase pipeline, spec quality gate, holdout scenarios, repo-level invariants, audit chain, proofpack.

**Requires:** Claude Code v2.1+, `git`, `jq`, `python3`. Multi-model audit additionally requires [Codex CLI](https://github.com/openai/codex) and [Gemini CLI](https://github.com/google-gemini/gemini-cli) — Signum degrades gracefully if either is absent.

**In flux:** Artifact schemas (proofpack, contract) will change. Contractor judgment on holdout quality improves with use.

We run Signum on Signum's own development. v3 is the first version we'd stake our own projects on.

## Feedback

Signum is early and actively developed. If it blocks you incorrectly, misses an edge case, or the contract grading feels off, file it directly from Claude Code — no context switching required.

Install [Reporter](https://github.com/heurema/reporter):

```bash
claude plugin install reporter@emporium
```

Then: `/report bug` or `/report feature` or `/report question`

Reporter auto-detects you're working on a heurema product, attaches environment context (OS, shell, Claude Code version), previews the issue before submitting, and falls back to clipboard if `gh` isn't available.

## Sources

- [signum on GitHub](https://github.com/heurema/signum)
- [skill7.dev/development/signum](https://skill7.dev/development/signum)
- [emporium — plugin marketplace](https://github.com/heurema/emporium)
- [reporter — issue filing from Claude Code](https://github.com/heurema/reporter)
- [11 Plugins, One Marketplace: Building an AI Agent Toolkit from Scratch](/posts/en/heurema-ecosystem)
