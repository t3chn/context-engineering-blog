---
title: "Spec-Gated Delivery: Why PR Review Is the Wrong Trust Checkpoint for AI Code"
description: "AI made code cheap. It didn't make trust cheap. The fix isn't better reviewers - it's moving the gate from PR diff to approved intent."
date: 2026-03-06
tags: ["context-engineering", "verification", "agents", "software-delivery"]
lang: en
---

AI made writing code mass-affordable. It did not make trusting code any cheaper.

The standard pipeline today: issue or prompt, AI writes code, AI or human reviews the PR, merge. This was always imperfect, but it scaled when humans wrote every line and the reviewer could reason about intent. It breaks when most of the diff was generated in seconds and the reviewer has to reverse-engineer intent from the output.

The bottleneck moved. Generation is cheap. Verification is not.

## The PR Review Trap

PR review is a late, expensive, probabilistic checkpoint. By the time you're looking at a diff, the code exists, the tests exist, the commit message exists. You're pattern-matching against "does this look right" - not against a specification of what "right" means.

Three failure modes compound:

1. **The issue isn't a spec.** "Add rate limiting" has ten valid implementations. The reviewer is comparing the diff against their mental model, not against a shared artifact.

2. **AI reviewing AI without ground truth is circular.** Running three models on a diff gives you three opinions. They can catch bugs and style issues. But without a formalized spec to check against, they're comparing the diff to their own assumptions - not to verified intent. Multi-model review becomes useful when it's anchored to a concrete spec (what Signum does in its audit phase), not when it replaces one.

3. **Weak evidence survives the merge.** After the PR closes, what remains? Review comments, approval checkmarks, linked issues, CI logs. Some teams have richer artifacts - test reports, CODEOWNERS traces, provenance attestations. But even in mature pipelines, there's rarely a single machine-readable artifact that ties the change to a pre-approved, verified intent with holdout results.

## The Shift

The primary trust artifact should not be a diff. It should be an approved specification.

The primary gate should not be "does this look right to a reviewer." It should be "does this pass deterministic checks against the approved intent."

The primary evidence should not be review comments. It should be a signed conformance artifact.

```
Approved intent -> blinded execution -> deterministic verification -> signed evidence -> decision
```

This isn't a theory. It's an operational pattern. The pieces exist today: typed specs, deterministic test runners, holdout test sets, attestation primitives (DSSE, in-toto, SLSA). Some teams have built parts of this internally. But there's no standard open stack that combines spec gating, holdout governance, and signed conformance evidence into a single delivery pipeline.

## What a Spec Gate Actually Checks

A spec gate doesn't prove code is correct in the general case. That's formal verification, a different problem. It proves something narrower and more useful:

- Which contract was approved, by whom, when
- Which commit was verified against it
- Which deterministic checks ran and their results
- Which holdout checks (invisible to the implementing agent) passed or failed
- That the evidence bundle wasn't tampered with after the fact

The trust model depends on who controls the verifier, who seals the holdouts, and whether the implementing agent can influence the evidence chain. In Signum's case: holdouts are sealed at contract approval time, the engineer agent receives a filtered contract, and the proofpack is hashed against the original. This doesn't make it tamper-proof in all threat models, but it raises the bar beyond "the CI runner said pass."

This is proof of conformance + proof of process. Not proof of correctness.

What it explicitly does not prove:

- That the spec itself is perfect
- That holdout checks cover every edge case
- That no unknown class of defect exists
- That LLM-judged checks equal formal verification

Saying this out loud matters. The moment you claim more than you deliver, you're selling snake oil.

## Holdouts: The Key Mechanism

The most powerful idea in spec-gated delivery is holdout criteria - acceptance checks the implementing agent never sees.

You write ten acceptance criteria. Three are marked holdout. The agent receives seven. It implements, writes tests, passes everything it can see. Then CI runs the holdout checks against the finished code.

If the agent forgot to handle counter reset on window expiry, or missed the edge case where the input is empty, the holdout catches it - not because a reviewer spotted it, but because a criterion existed before implementation started.

Important: holdout criteria must be consequences of the visible contract, not secretly added requirements. If the visible spec says "rate limit POST /api/tokens at 5/min," a holdout that checks counter reset after window expiry is a valid derivation. A holdout that adds a new endpoint is not - that's an undisclosed requirement.

This is the difference between "review found a bug" and "the spec author anticipated the failure mode."

## The Honest Boundaries

Spec-gated delivery has real limits:

- **Spec quality is the ceiling.** Bad specs produce false confidence. A spec gate that passes a weak contract is worse than no gate at all, because it creates an illusion of verification.
- **Not everything is deterministically verifiable.** UX, performance under real load, security posture - these require human judgment or specialized tooling. The system must honestly label each criterion as `deterministic`, `heuristic`, or `manual`.
- **Holdouts require domain expertise to write.** The value of a holdout is proportional to how well it anticipates failure modes. This is a human skill.

The moat is not in AI code generation. It's not in AI review. It's in the verification and evidence layer: spec quality gates, holdout governance, deterministic verifier mapping, signed conformance artifacts, and policy engines that separate what's proven from what's guessed.

## Why Now

Three mature streams converged:

1. **AI coding is mass-market.** Copilot, Claude Code, Cursor - teams generate more code than they can review.
2. **Contract-driven workflows entered the market.** Kiro, Spec Kit, amp - the idea that specs should precede implementation is no longer academic.
3. **Attestation infrastructure is maturing.** SLSA, Sigstore, in-toto provide useful primitives for signed provenance. Key management and verifier trust remain hard problems, but the building blocks exist for teams willing to invest.

But there's no standard open stack that assembles spec gating, holdout governance, and signed evidence into a single delivery pipeline where the spec is the gate, not the diff.

## What Changes

When spec-gated delivery works, code review stops being the primary truth and becomes a secondary audit. The PR is still useful - for knowledge sharing, for catching spec gaps, for mentoring. But the trust decision moves earlier: to the moment the spec is approved and the holdouts are sealed.

This is the most important shift. Not "better AI review." Not "more reviewers." A different trust model entirely.

The formula:

```
Approved intent -> blinded execution -> deterministic verification -> signed evidence -> human/CI decision
```

If the evidence artifact says the code conforms to the approved spec, including holdout criteria the agent couldn't see, and the attestation chain is intact - that's a stronger signal than any number of review comments.

## Try It

We built this into [Signum](https://github.com/heurema/signum), a Claude Code plugin. Spec quality gate, holdout scenarios, multi-model audit, signed proofpack. It's early and opinionated.

```bash
claude plugin marketplace add heurema/emporium
claude plugin install signum@emporium
/signum "your task description"
```

The interesting part isn't the tool. It's the question: if you could gate every AI-generated change on a pre-approved, deterministically verified spec - would you still put PR review at the center of your trust model?

## Sources

- [SLSA - Supply-chain Levels for Software Artifacts](https://slsa.dev/) - framework for software supply chain integrity
- [in-toto - A framework for securing the software supply chain](https://in-toto.io/)
- [Signum on GitHub](https://github.com/heurema/signum)
- [The Contract Is the Context](/posts/en/signum-contract-first-ai-dev) - previous post on Signum's contract-first pipeline
- [skill7.dev/development/signum](https://skill7.dev/development/signum)
