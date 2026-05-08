---
title: "Signum Can Now Be Installed in Codex App as a Plugin"
description: "What changes when a contract-first agent workflow becomes an installable Codex App plugin, not just a Claude Code command."
date: 2026-05-08
tags: ["context-engineering", "codex", "agents", "verification", "signum"]
lang: en
canonical_url: https://ctxt.dev/posts/en/signum-codex-app-plugin/
---

AI-agent workflows have a boring but important problem: a good process often lives inside one runtime.

Signum started as a Claude Code plugin. That was the right first layer: slash command, local artifacts, contract-first pipeline, proofpack. But the principle is not Claude-specific. If an agent writes code in Codex App, it needs the same context: contract before implementation, verification after implementation, proof in files instead of "looks done" in chat.

The latest Signum changes close that distribution gap: Signum can now be added to Codex App through the Plugins UI.

## What changed

Signum now ships a complete Codex App install surface:

```text
.codex-plugin/plugin.json
.agents/plugins/marketplace.json
platforms/codex/.codex-plugin/plugin.json
platforms/codex/SKILL.md
platforms/codex/assets/signum-icon.png
```

This is not a README instruction that says "copy this prompt". Codex gets a plugin manifest, marketplace metadata, a skill entrypoint, and UI metadata for the plugin card.

The install path is:

```text
Plugins -> Add marketplace

Source: heurema/signum
Git ref: main
Sparse paths: leave blank
```

After that, `Heurema` appears in the Plugins source dropdown, and `Signum` is available inside it.

For pinned installs, the docs point at `v4.21.5` or a newer release tag. For sparse checkout, include `.agents/plugins` and `platforms/codex`; include `.codex-plugin` only for direct local-folder installs.

## Why this is not just a port

The weak way to move an agent workflow between runtimes is to copy a long system prompt and hope the model remembers how to use it.

Signum does something else. The Codex skill describes a workflow contract, not an answer style:

```text
CONTRACT -> EXECUTE -> AUDIT -> PACK
```

The core rule stays the same: define correctness before code is written.

In this mode, Codex becomes the orchestrator. It should:

- stop if the contract is too weak;
- keep artifacts under `.signum/contracts/<contractId>/`;
- run deterministic checks before model review;
- treat external reviewer tools as optional evidence, not trust anchors;
- say explicitly when a claim could not be verified.

For the user, this matters more than "the plugin exists in the UI". Installation reduces adoption cost, but the value comes from a different layer: the workflow now sits next to the agent that actually executes the task.

## Metadata is now part of the release surface

Signum added a dedicated guardrail:

```bash
bash tests/test-codex-plugin-metadata.sh
```

On the current checkout, it passes 37 out of 37 checks.

The test does not only check that files exist. It validates that:

- the direct manifest is named `signum`;
- the version matches release metadata;
- the direct plugin points at `./platforms/codex/`;
- the marketplace plugin points at non-empty `./platforms/codex`;
- the marketplace source is named `heurema`, with display name `Heurema`;
- install policy is `AVAILABLE`;
- authentication policy is `ON_INSTALL`;
- icon paths resolve;
- the Codex skill actually declares the contract-first pipeline and canonical artifact root.

This is the right boundary for plugin distribution. If marketplace metadata breaks, the user never reaches the workflow. That means metadata needs tests the same way code does.

## What this changes for context engineering

Context engineering is often reduced to prompt design. This is a useful counterexample.

Context for an agent is not only instruction text. It is the install path, manifest, marketplace entry, skill boundary, artifact layout, validation script, and docs saying the same thing.

When the same workflow is available in Claude Code and Codex App, the idea becomes easier to test honestly. If Signum only works where its author manually configured the environment, it is a local habit. If it can be installed through a plugin surface and checked with a metadata test, it is closer to a reusable capability.

The difference is small, but practical:

- less manual setup;
- less hidden knowledge in the author's head;
- less risk that Codex receives stale or partial instructions;
- more chance that the proofpack workflow stays reproducible.

## Insight

An agent workflow becomes a product not when it has a polished explanation.

It becomes a product when it has an install boundary, testable metadata, and a clear runtime contract.

Signum in Codex App is that kind of step. Not a new model trick, not a new reviewer, not another layer of confidence. Just a less fragile way to deliver contract-first verification to the place where the agent already works.

## Sources

- [Signum README](https://github.com/heurema/signum)
- [Signum Quickstart](https://github.com/heurema/signum/blob/main/QUICKSTART.md)
- [Signum changelog](https://github.com/heurema/signum/blob/main/CHANGELOG.md)
- [Codex plugin metadata test](https://github.com/heurema/signum/blob/main/tests/test-codex-plugin-metadata.sh)
