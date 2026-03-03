---
title: "The Contract Is the Context: How Signum Makes AI Code Verification Principled"
description: "Why running AI-generated code through more AI reviewers doesn't solve the reliability problem — and what a contract-first pipeline changes about it."
date: 2026-03-03
tags: ["context-engineering", "claude-code", "agents", "verification", "contract-first"]
lang: en
---

The standard response to unreliable AI output is more review. Run the diff through Claude, then Codex, then Gemini. Three models, three perspectives, hope they catch the same thing.

There's a structural problem with this: more review doesn't fix the absence of ground truth. The models are comparing the code against their internal assumptions about what the code _should_ do. When those assumptions are wrong, or incomplete, or different from yours, the review is meaningless — not wrong, but unfalsifiable. You can't tell.

This is a context engineering problem.

## The Missing Context Layer

Every verification process has two components: the artifact being verified and the standard it's measured against. Code review as practiced today is strong on the first and weak on the second. The "standard" is a mental model in the reviewer's head, reconstructed from the task description, comments, naming conventions, and surrounding code. It's implicit, incomplete, and unshared.

This is why code review, human or AI, often reduces to: "does this look like code a competent programmer would write?" That's a style question. The correctness question — "does this satisfy the actual requirements?" — requires a written specification. Without one, you're doing archaeology: reconstructing intent from evidence after the fact.

Context engineering, as a discipline, is about making implicit context explicit and structured so that the system can act on it reliably. For most tasks, this means retrieval, formatting, and injection into the prompt. For verification, it means something different: you need the context to exist _before_ implementation starts, not after. The contract is the context.

## Signum: Contract as Ground Truth

[Signum](https://github.com/heurema/signum) is a Claude Code plugin that enforces a four-phase pipeline:

```
CONTRACT → EXECUTE → AUDIT → PACK
```

The sequence matters more than the phases themselves.

**CONTRACT** comes first. An AI Contractor (Claude Sonnet) takes your task description and turns it into a structured specification: goal, acceptance criteria with verify commands, in-scope/out-of-scope file lists, assumptions, risk level. The spec is graded A–F across six dimensions: testability, negative coverage, clarity, scope boundedness, completeness, boundary cases. Grade D or lower is a hard stop — the pipeline doesn't start until the spec is good enough to be verified against.

The spec then goes to Codex and Gemini for independent validation. Do they see gaps? Contradictions? Criteria that can't be verified? This happens _before implementation begins_, which is when corrections are cheap.

**EXECUTE** is the implementation phase. The Engineer agent — the only agent in the pipeline that writes code — receives `contract-engineer.json`, not `contract.json`. The difference is intentional: the holdout scenarios have been physically removed. More on why this matters below.

**AUDIT** runs after implementation. The Mechanic (a deterministic, zero-LLM component) checks lint, typecheck, and test results against the pre-implementation baseline. Then Claude, Codex, and Gemini review the diff independently in parallel. Holdout scenarios — the ones the Engineer never saw — run against the result.

**PACK** assembles the artifact: `proofpack.json`, a JSON file containing the contract hash, approval timestamp, base commit, implementation diff, and all audit results. It's what CI can gate on.

## Holdout Scenarios: Preventing the Teach-to-the-Test Failure

The hardest problem in AI verification isn't finding bugs. It's preventing the verifier from being contaminated by the implementation.

This is a well-known issue in ML: if you tune your model against the test set, the test scores become meaningless. You've removed the separation between training signal and evaluation. The model hasn't learned the task — it's learned the benchmark.

The same failure mode exists in AI development pipelines. If the implementing agent can see every acceptance criterion, it optimizes for those criteria specifically. It will satisfy the tests you wrote. Whether it satisfies the _intent_ behind them — including edge cases you didn't think to write — is a different question.

Signum handles this with data-level separation. The Contractor generates acceptance criteria, then splits them. Public criteria go into `contract-engineer.json`. Holdout scenarios are removed physically — not hidden behind an instruction, physically absent from the file the Engineer reads. The Engineer implements against the public spec. The holdouts run against the finished result.

Holdout minimums scale with risk level: 0 for low-risk tasks, 2 for medium, 5 for high. The Contractor also generates an execution policy from the contract — which tools the Engineer may use, which bash patterns are denied, which paths are in scope, maximum files changed. Policy violations after execution are `AUTO_BLOCK`.

The Engineer can't optimize for what it can't see. That's the guarantee.

## Repo-Level Invariants: The Permanent Contract

Task-level contracts cover what you're building now. But some correctness properties should never regress, regardless of what any individual task is doing.

Signum supports a `repo-contract.json` file at the project root — a list of invariants that must always hold:

```json
{
  "schemaVersion": "1.0",
  "invariants": [
    { "id": "I-1", "description": "All tests pass", "verify": "pytest -q", "severity": "critical" },
    { "id": "I-2", "description": "No type errors", "verify": "mypy src/", "severity": "critical" },
    {
      "id": "I-3",
      "description": "No lint errors",
      "verify": "ruff check src/",
      "severity": "high"
    }
  ],
  "owner": "human"
}
```

Before EXECUTE begins, Signum runs all invariants and records baseline results. After implementation, it runs them again. Any invariant that was passing before and is failing after is flagged as a regression and triggers `AUTO_BLOCK`, regardless of whether the task-level acceptance criteria passed.

The `"owner": "human"` field is not enforced by software — it's a declaration that this file is a human artifact and should be treated accordingly. The AI pipeline enforces the invariants; the human maintains what they are.

## The Audit Chain: What "Tamper-Evident" Actually Means

`proofpack.json` is described as tamper-evident. That requires some unpacking.

When the user approves the contract (after the Contractor presents it and the external validators sign off), Signum computes the SHA-256 hash of `contract.json` and writes it to `contract-hash.txt` along with the approval timestamp. Before the Engineer runs, the base git commit is recorded. After PACK, the proofpack contains:

```
auditChain: {
  contract_sha256: <hash of the approved contract>,
  approved_at: <ISO 8601 timestamp>,
  base_commit: <git SHA before implementation>
}
```

Anyone who can verify the proofpack can confirm: this contract was what was approved (hash matches), the implementation started from this commit, and these are the audit results that were produced. You can't retroactively change the contract after implementation and claim the proofpack was based on it — the hash won't match.

This matters in a world where AI-generated code will increasingly need to carry provenance. Not just "an AI wrote this" but "an AI implemented this against this contract, the contract was validated by these models, and the implementation was reviewed against these criteria."

## What You Can't Game

The more useful framing of tamper-evidence is: what can the implementing AI _not_ do to get a better outcome?

It can't see holdout scenarios, so it can't optimize for them.

It can't modify the contract after approval without breaking the hash.

It can't skip the mechanic's deterministic checks — lint, typecheck, test regressions don't involve LLMs and can't be argued with.

It can't influence what the parallel auditors see — they receive the diff independently, with no shared context.

What it _can_ do: implement. That's the intended scope. The rest of the pipeline is structured to keep the implementation honest without relying on the implementing agent's self-report.

## Status

Signum v3 is what it says on the tin: an early-stage tool with real ideas behind it. We run it on Signum's own development. That's not a marketing claim — it's the most direct form of commitment we can make. If the pipeline were painful or produced false confidence, we'd know immediately. v3 is the first version where running it on real work produces results we'd act on.

The four-phase structure is stable. The artifact schema will change. The multi-model audit currently requires Codex CLI and Gemini CLI installed separately; not everyone has both. The holdout and policy mechanisms are young — we expect the Contractor's judgment on what constitutes a good holdout to improve with iteration.

The underlying bet: the problem isn't AI code quality. It's the absence of an explicit correctness standard. Given a contract, AI-generated code can be verified rigorously. Without one, all verification is interpretation.

## Sources

- [signum — GitHub](https://github.com/heurema/signum)
- [skill7.dev/development/signum](https://skill7.dev/development/signum)
- [emporium — Plugin Marketplace](https://github.com/heurema/emporium)
- [arbiter — Multi-AI Orchestrator](https://github.com/heurema/arbiter)
- [11 Plugins, One Marketplace: Building an AI Agent Toolkit from Scratch](/posts/en/heurema-ecosystem)
