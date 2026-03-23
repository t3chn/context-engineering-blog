---
title: "My AI Agent Said 'Done.' It Skipped an Entire Acceptance Criterion."
description: The hardest bug was not in the code. It was in the trust model between the engineer agent and the orchestrator.
date: 2026-03-23
tags:
  - context-engineering
  - claude-code
  - verification
  - trust-boundary
canonical_url: https://ctxt.dev/posts/en/signum-trust-boundary/
lang: en
---

Last week, our pipeline produced a proofpack with `decision: HUMAN_REVIEW`. The contract had 10 acceptance criteria. The engineer agent created all the new files, build passed, tests passed, three independent reviewers ran. Everything looked correct — except AC18.3, which required rewriting an existing endpoint's response schema. The engineer never touched `health.go`. The pipeline said SUCCESS.

That should have been impossible.

## Why "SUCCESS" was wrong

The pipeline had four verification layers: mechanic checks (lint, typecheck, tests), holdout scenarios (blind tests the engineer never sees), multi-model code review (Claude + Codex + Gemini), and a synthesizer that combines everything into a final verdict.

The engineer agent has its own repair loop — three attempts to make all acceptance criteria pass. It runs verify commands for each AC, fixes failures, retries. After three attempts, it reports status to the orchestrator.

Here is the gap: the orchestrator checked `execute_log.json` for `status: SUCCESS` and moved on. It trusted the engineer's self-reported status. The engineer reported success because its verify command for AC18.3 was `grep freshness_ms health.go` — a presence check, not a behavioral check. The string did not exist, the grep failed silently, and the engineer moved on without implementing the criterion.

We had review. We had iteration. We had a proof artifact. What we did not have was independent boundary verification.

## The missing trust boundary

The pattern is familiar. A developer says "tests pass" and pushes to main. CI runs the same tests — independently. The developer's claim and the verification live in different trust domains. If CI only checked the developer's test output file instead of running tests itself, nobody would trust it.

Our pipeline had exactly this flaw. The engineer agent both implemented the code and reported whether it succeeded. The orchestrator consumed that report without re-running the checks. The implementer was grading its own homework.

This is not specific to Signum. If your workflow lets a coding agent say "done" and your pipeline checks artifacts emitted by that same agent without independent re-execution, you have the same trust problem. It does not matter how many reviewers you add downstream — reviewers audit the code that exists, not the code that should exist.

## What we changed: boundary verification

The fix was not another reviewer or another retry. It was a trust boundary — a deterministic verifier that runs after the engineer finishes and before the audit begins. The verifier:

1. Captures a cryptographic snapshot of the workspace before execution starts
2. After the engineer finishes, independently re-runs every acceptance criterion's verify command via a sandboxed DSL runner
3. Checks scope integrity: are all promised files present? Are there out-of-scope modifications?
4. Writes an append-only receipt with per-AC evidence, artifact hashes, and a chain linking back to the pre-execution snapshot
5. Gates the transition to audit: if any visible AC lacks independent evidence, the pipeline blocks

The orchestrator no longer reads the engineer's `execute_log.json` to decide whether ACs passed. It reads the receipt. The receipt is written by a verifier that shares no state with the engineer. The engineer cannot influence what the receipt contains.

Each repair iteration in the audit loop also runs boundary verification before the candidate proceeds to review. The receipt chain is append-only — iteration 2's receipt references iteration 1's hash, making the full sequence tamper-evident.

## What it catches

Three failure modes that previously passed silently:

- **Skipped criteria.** The engineer claims success but never touched the relevant file. The verifier runs the AC's check and finds no evidence.
- **Vacuous verification.** The verify command is too weak (a grep for a string that could appear anywhere). On medium and high risk contracts, the verifier classifies the evidence strength and blocks on exit-only checks.
- **Scope drift.** The engineer modifies files outside the contract's scope, or promises a new file but never creates it. The snapshot diff catches both.

## What it does not prove

Boundary verification is not semantic verification. It confirms that each acceptance criterion's check command returned zero. It does not confirm the implementation is correct in a deeper sense.

Some limitations are fundamental:

- A well-crafted but subtly wrong implementation can still pass all verify commands. The receipt proves the check ran and passed, not that the check was sufficient.
- Manual acceptance criteria (where no automated check exists) skip the verifier entirely. The receipt marks them as unverified — the synthesizer cannot issue AUTO_OK if manual ACs exist.
- Stricter verification means more false blocks. A flaky verify command will halt the pipeline even when the implementation is correct.

The receipt chain closes the trust gap between claiming and proving. It does not close the gap between proving and being right.

## The broader question

Every AI coding workflow has a version of this problem. The agent generates code, runs checks, reports results. At some point, a human or a system must decide: is this done?

The answer depends on what evidence you require. Self-reported status is the weakest. Test results are stronger but can be gamed by weak tests. Independent re-execution against a pre-declared contract is stronger still — but only as strong as the contract itself.

Two questions worth asking about your own workflow:

1. **Who verifies your acceptance criteria — the same agent that implemented them, or an independent process?**
2. **Would you accept more false blocks in exchange for fewer false successes?**

We chose more false blocks. The alternative was worse.

---

*Signum is an open-source Claude Code plugin for contract-first AI development. The receipt chain shipped in [v4.15.1](https://github.com/heurema/signum). The bug described here is [issue #10](https://github.com/heurema/signum/issues/10).*
