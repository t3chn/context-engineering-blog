---
title: "AI Writes Code. Where Is the Proof?"
description: "Proofpack chains contract, implementation, and audit into a single verifiable record. Why proof artifacts are the missing primitive of AI code generation."
date: 2026-03-05
tags: ["context-engineering", "claude-code", "verification", "proofpack", "supply-chain"]
lang: en
---

AI generated a function in seconds. Three models reviewed it. All said "looks good." Question: where is the artifact that confirms this?

Not "a model approved it" - where is the machine-readable evidence of _what_ was checked, _against what_, and _with what result_? In the software supply chain, this artifact is called an attestation. For AI-generated code, it doesn't exist.

## Proofpack: what's inside

Here's what `proofpack.json` looks like after a [Signum](https://github.com/heurema/signum) run:

```json
{
  "schemaVersion": "4.0",
  "createdAt": "2026-03-04T14:23:07Z",
  "runId": "signum-2026-03-04-a7f3c1",
  "decision": "AUTO_OK",
  "confidence": { "overall": 87 },
  "auditChain": {
    "contractSha256": "e3b0c44298fc1c14...",
    "approvedAt": "2026-03-04T14:01:12Z",
    "baseCommit": "8a4f2dc"
  },
  "contract": {
    "sha256": "a1b2c3d4...",
    "fullSha256": "f5e6d7c8...",
    "status": "present"
  },
  "diff": {
    "sha256": "9f8e7d6c...",
    "sizeBytes": 4820,
    "status": "present"
  },
  "checks": {
    "mechanic": { "status": "present" },
    "holdout": { "status": "present" },
    "reviews": {
      "claude": { "status": "present" },
      "codex": { "status": "present" },
      "gemini": { "status": "present" }
    }
  }
}
```

Two hashes for the contract - `sha256` (redacted version without holdout criteria) and `fullSha256` (original). Base commit captured before implementation starts. Three independent reviews. Holdout results separate, because the engineer never saw those criteria.

CI gates on this:

```bash
DECISION=$(jq -r '.decision' .signum/proofpack.json)
if [ "$DECISION" != "AUTO_OK" ]; then
  echo "Signum: $DECISION - blocking merge"
  exit 1
fi
```

No need to parse three models' logs. One file, one field, deterministic gate.

## The broken present

The AI code review industry operates at one level - the diff. A model looks at a patch and says what it thinks. The problem isn't model quality; it's the absence of a definition for "correct."

CodeRabbit's own measurements[^1] show 46% useful comments. Copilot Code Review, tested against 117 files with known vulnerabilities, found zero security issues[^2]. This isn't an indictment of specific tools - it's a consequence of architecture: review without a contract is bounded by what the reviewer considers "reasonable."

The problem runs deeper. Even when a model finds a bug, the result is a PR comment. Not a machine-readable artifact, not a verification chain, not something CI can gate on. Between "a model left a comment" and "code is verified" - there's a chasm.

## Four layers: how a proofpack is built

[In the previous post](/posts/en/signum-contract-first-ai-dev) I covered the contract as the source of truth. Here - how four layers together produce a verifiable artifact.

**CONTRACT.** The spec is formalized before implementation begins. Graded across 6 dimensions (A-F). Codex and Gemini validate for gaps. Holdout scenarios are generated - hidden acceptance criteria the engineer won't see.

**EXECUTE.** The engineer works with `contract-engineer.json`, from which holdout criteria are physically removed - not hidden by instruction, but deleted from the file. Baseline (lint, typecheck, test names) is captured before the first line of code.

**AUDIT.** The Mechanic runs deterministic checks with zero LLM: linter, typechecker, new test failures by name (not exit code). Then Claude, Codex, and Gemini review the diff independently, in parallel, without seeing each other's assessments. Holdout criteria run against the result. The Synthesizer aggregates: deterministic policy + confidence score.

**PACK.** All artifacts embed into `proofpack.json`. SHA-256 chains: approved contract → timestamp → base commit → diff → audit results. This isn't a log - it's an attestation.

Key decisions:

- **Data-level blinding**, not instruction-level. The engineer cannot infer holdout criteria from context or file structure.
- **Multi-model audit**: 3 vendors, 3 independent assessments. Not one model checking itself.
- **Reproducible artifacts** for humans and CI, not trust in model judgment. The proofpack exists as a file - you can inspect it, archive it, audit it.

## Threat model: what proofpack protects and what it doesn't

**Protects against:**

- Implementation doesn't match spec → holdout criteria catch it
- Rubber-stamp review (one model checking itself) → 3 independent reviewers
- No audit trail → SHA-256 chain with timestamps
- Optimizing for known tests → data-level blinding

**Does not protect against:**

- Bad spec. Garbage in - verified garbage out. The quality gate (A-F) reduces risk but doesn't eliminate it.
- Model collusion. Theoretically possible. 3 vendors (Anthropic, OpenAI, Google) mitigate but don't exclude.
- Formal correctness. A proofpack is process integrity, not mathematical proof. SLSA doesn't prove your code is bug-free either - it proves the build wasn't tampered with.
- Malicious spec author. If a human intentionally hides requirements, the system won't help.

More precisely: a proofpack is not proof of correctness, but proof of process. The distinction matters.

## Related work

| Framework                        | What it does                    | Gap                                           |
| -------------------------------- | ------------------------------- | --------------------------------------------- |
| [SLSA](https://slsa.dev)         | Build provenance attestation    | No AI code generation awareness               |
| [in-toto](https://in-toto.io)    | Software supply chain layout    | Build-time only, no spec → code               |
| [Sigstore](https://sigstore.dev) | Code signing + transparency log | Identity, not correctness                     |
| CodeRabbit                       | AI diff review                  | No contract, holdouts, proof artifact         |
| Copilot Code Review              | AI PR review                    | Diff-level, single model                      |
| Qodo                             | AI testing + compliance         | Closer, but no multi-model audit or proofpack |
| GitHub Spec Kit                  | Spec-as-input for Copilot       | Spec → code, but no verification loop         |

What's genuinely new: the four-layer chain from spec through blinded execution and adversarial audit to a tamper-evident artifact. No existing tool connects all four.

## Proof artifacts - the missing primitive

The software supply chain industry spent years making builds verifiable. SLSA, in-toto, Sigstore - all address the same principle: don't trust, verify, and leave an artifact for audit.

AI code generation gets by without this. A model writes code, another model leaves a PR comment, a human clicks merge. Nothing machine-readable remains. Proofpack is one implementation; the pattern matters more than the tool.

[^1]: CodeRabbit, "How We Measure Review Quality", 2025. Self-reported metric from their blog.

[^2]: Copilot Code Review test against 117 files containing known vulnerabilities (SQL injection, XSS, command injection). None of the vulnerabilities were flagged. Results depend on configuration and sample.

## Sources

- [signum on GitHub](https://github.com/heurema/signum)
- [The contract is the context](/posts/en/signum-contract-first-ai-dev) - previous post
- [SLSA specification](https://slsa.dev/spec/v1.0/)
- [in-toto framework](https://in-toto.io)
- [Sigstore](https://sigstore.dev)
