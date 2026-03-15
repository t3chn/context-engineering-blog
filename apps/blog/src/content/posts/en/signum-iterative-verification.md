---
title: "One Pass Isn't Enough: How Signum Learned to Fix Its Own Code"
description: "AI code verification as a loop, not a gate. Iterative audit, contract self-critique, and shared context across tasks in Signum v4.6."
date: 2026-03-15
tags: ["context-engineering", "claude-code", "verification", "iterative-audit", "agents"]
lang: en
---

The first version of Signum ran in a single pass: CONTRACT → EXECUTE → AUDIT → PACK. If the audit found a problem — block. Human deals with it.

An honest process, but a limited one. Imagine code review where the reviewer can only comment and the author can't fix anything. The finding goes back to the queue, context is lost, the cycle restarts from scratch. Signum v4.6 closes this gap: the pipeline now loops at three levels — code, contract, and project context — before producing the final proofpack.

## The problem: one-shot verification

In [previous posts](/posts/en/signum-contract-first-ai-dev) I covered the contract as ground truth and [proofpack as a verification artifact](/posts/en/signum-proofpack-ai-proof). The architecture worked: spec → blinded implementation → multi-model audit → proof artifact. But production use revealed a pattern.

Most audit findings in our early runs weren't architectural issues. They were a missed edge case in error handling. A forgotten `null` check. A test that doesn't cover one of the acceptance criteria. Things the engineer agent could fix in seconds — if it got the chance.

Instead, Signum issued `AUTO_BLOCK`, a human looked at the finding, restarted the pipeline. Full contract rebuild, full implementation, full audit — for a bug that's a one-line fix.

## Loop 1: code — iterative audit

Signum v4.6 adds a repair loop that bridges AUDIT and EXECUTE. When the audit finds MAJOR or CRITICAL findings, instead of blocking, it sends the engineer back to fix:

```
AUDIT → findings → re-enter EXECUTE (repair) → AUDIT → ... → PACK
```

After the first audit pass (mechanic + Claude + Codex + Gemini), if there are actionable findings, the engineer agent receives `repair_brief.json`:

```json
{
  "iteration": 1,
  "findings": [
    {
      "id": "F-1",
      "severity": "MAJOR",
      "file": "src/api/tokens.py",
      "line": 42,
      "description": "Missing error response when rate limit storage is unavailable",
      "source": "codex"
    }
  ]
}
```

Important: `repair_brief.json` contains only observed defect symptoms from visible criteria and deterministic checks. Holdout failures are reported as behavioral observations ("function returns 200 when 429 expected") without revealing the hidden acceptance criteria. The data-level blinding from the original contract remains intact — the engineer never sees raw holdout text.

The engineer fixes. The full audit reruns — not on the repair diff, but on the entire implementation from baseline. Then PACK produces the final proofpack as before.

Key decisions:

**Best-of-N, not last-of-N.** The pipeline stores each iteration's artifacts in `.signum/iterations/NN/`. If iteration 3 is worse than iteration 2 (the repair broke something else), Signum rolls back to the best candidate. No blind faith that the latest fix is the best one.

**Diff progression.** On the first pass, reviewers see the full patch. On pass 2+, they see the full patch plus the iteration delta with an instruction to focus on what changed in the repair. This saves tokens and reduces noise. If the delta exceeds 80% of the full patch — fallback to full-diff-only (the repair is too large to review incrementally).

**Early stop.** If two consecutive iterations show no improvement — stop. Maximum 20 iterations (configurable via `SIGNUM_AUDIT_MAX_ITERATIONS`). In practice, convergence happens in 2-3 passes.

**Finding fingerprints.** Each finding gets a fingerprint based on file, line range, and issue type. Between iterations, Signum classifies every finding as resolved, persisting, or new. The synthesizer uses this to evaluate actual progress — not just "fewer findings" but "which specific issues were fixed and which appeared."

**Hallucination filtering.** If a reviewer cites a line that doesn't exist in the diff or references a file outside scope, the finding is discarded. This is the same mechanism described in the [ecosystem post](/posts/en/heurema-ecosystem): every AI finding is validated against the actual diff before it enters the repair loop.

## Loop 2: contract — self-critique

The code loop fixes implementation. But what if the problem is upstream — in the contract itself? A perfect implementation of a flawed spec is still a failure.

For medium and high-risk tasks, the contractor now runs a 4-pass self-critique before showing the contract to the human:

1. **Ambiguity review** — scans goal, acceptance criteria, and scope for ambiguous phrasing
2. **Missing-input review** — checks for missing preconditions, records clarification decisions
3. **Contradiction review** — detects contradictions between goal, scope, and risk level
4. **Coverage review** — reconstructs the goal from acceptance criteria, checks coverage, documents assumption provenance

Maximum 2 auto-revision rounds. If the verdict remains `"no-go"` after round 2 — escalation to human. Low-risk tasks skip all 4 passes entirely.

The result is written to the contract:

```json
{
  "readinessForPlanning": {
    "verdict": "go",
    "summary": "All ambiguities resolved. AC3 coverage gap closed in round 1."
  },
  "ambiguityCandidates": [...],
  "contradictionsFound": [],
  "clarificationDecisions": [...]
}
```

The human sees both the verdict and the full path to it. Not "the contractor decided the contract is good" — but what problems were found and how they were resolved.

## Loop 3: project — shared context across contracts

The code loop iterates within a single task. The contract loop iterates within a single spec. But previous Signum versions treated contracts in isolation. Each task — a separate universe. In a real project, tasks are connected: they touch the same files, depend on the same decisions, use the same terminology.

Three new layers:

**Project intent.** A `project.intent.md` file at the project root — goal, capabilities, non-goals, personas. The contractor reads it before generating a contract. Project non-goals become scope constraints on the contract. For medium and high-risk tasks, missing intent is a blocking question.

**Glossary.** `project.glossary.json` defines canonical terms and forbidden synonyms. `glossary_check` scans contracts for alias usage, `terminology_consistency_check` catches synonym proliferation across active contracts. Both are WARN, not block.

**Cross-contract coherence.** `overlap_check` detects inScope overlap between active contracts (two contracts touching the same file — conflict?). `assumption_check` flags contradictions in assumptions across related contracts. `adr_check` warns when relevant ADRs exist but aren't referenced in the contract.

Plus **upstream staleness detection**: the contractor hashes the contents of `project.intent.md` and the glossary at contract creation. If upstream files change by execution time — warning (or block, if `stalenessPolicy: "block"` is configured).

## Architecture v4.6.1: checks as standalone scripts

A bonus from the latest refactoring: 6 inline checks that lived inside the orchestrator are now extracted into standalone testable scripts in `lib/`:

```
lib/glossary-check.sh      — forbidden synonym scan
lib/terminology-check.sh   — cross-contract term proliferation
lib/overlap-check.sh       — inScope overlap detection
lib/assumption-check.sh    — assumption contradiction detection
lib/adr-check.sh           — ADR relevance check
lib/staleness-check.sh     — upstream artifact staleness
```

All scripts: JSON stdout, stderr for diagnostics, exit 0 for any check result (non-zero only for infrastructure errors). The orchestrator calls scripts and decides whether to block or warn. Separation of concerns: the script checks, the orchestrator decides.

## What this changes

Signum v3 answered "is this correct?" with a binary yes/no. v4.6 answers "can this be made correct?" — and if yes, does it.

In our early runs, a significant share of tasks that v3 blocked with AUTO_BLOCK, v4.6 brings to AUTO_OK in 2-3 iterations without human involvement. The tasks that still block tend to be real spec or architecture problems — exactly what should escalate to a human.

Verification isn't a gate at the end of the pipeline. It's a loop. The same principle as human code review: finding → fix → re-check. The difference is that AI can run this loop in seconds, not days.

## Sources

- [signum on GitHub](https://github.com/heurema/signum)
- [The Contract Is the Context](/posts/en/signum-contract-first-ai-dev) — first post in series
- [AI Writes Code. Where's the Proof?](/posts/en/signum-proofpack-ai-proof) — second post in series
- [skill7.dev/development/signum](https://skill7.dev/development/signum)
- [emporium — plugin marketplace](https://github.com/heurema/emporium)
