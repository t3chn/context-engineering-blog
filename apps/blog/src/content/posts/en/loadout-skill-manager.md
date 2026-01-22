---
title: "Loadout: Dependency Management for AI Skills"
description: "How to solve skill drift in AI agents. Manifest + lock + symlinks — a pattern from package managers applied to context management."
date: 2025-01-22
tags: ["context-engineering", "agents", "skills", "tooling"]
lang: en
---

## Problem

Skills for AI agents drift.

Typical scenario: you have a central repository with skills for Codex CLI or Claude Code. Start a new project — copy the skills you need into `.codex/skills/`. A month later they're unrecognizable: local edits, project-specific adaptations, bug fixes.

Problems accumulate:

- Improvements don't flow back to the source
- Different projects diverge
- No way to update a skill without losing local changes
- Each client (Codex vs Claude) has its own structure and UX

This is the same problem that npm, cargo, and poetry solve for code. But for skills, no one had solved it.

## Context

Why does this matter for context engineering?

Skills are executable context. Not just text for the model, but instructions the agent executes autonomously. Skill quality directly affects agent quality.

When skills drift:

- Consistency across projects is lost
- Results become unreproducible ("it worked on my machine")
- Improvements get isolated instead of spreading

Package managers solved this problem for code decades ago. The manifest + lock pattern provides:

- Declarativeness: what we want vs what we have
- Reproducibility: pinned versions
- Upgradability: update without losing control

## Solution

### Manifest + Lock

Loadout uses a familiar pattern:

**Manifest** (`loadout.json`) — what we want:

```json
{
  "schema_version": 1,
  "primary_source": "primary",
  "sources": {
    "primary": {
      "url": "https://github.com/acme/skills",
      "ref": "main"
    }
  },
  "targets": {
    "codex": { "skills": ["pdf-processing", "code-review"] },
    "claude": { "skills": ["pdf-processing"] }
  }
}
```

**Lock** (`loadout.lock.json`) — what we have (pinned):

```json
{
  "schema_version": 1,
  "sources": {
    "primary": { "pinned_sha": "0123456789abc..." }
  }
}
```

Both files are committed to git. Reproducibility guaranteed.

### Symlinks Instead of Copies

The key decision — don't copy skills, create symlinks:

```
.codex/skills/_loadout__pdf-processing → .codex/.loadout/sources/primary/codex/pdf-processing
```

Why this matters:

- Edit a skill in your project → you're editing the source repo clone
- `git push` from the clone → improvements flow back to source
- No drift: single source of truth

The source repo is cloned into `.codex/.loadout/sources/` (gitignored). Symlinks are managed, prefixed with `_loadout__` for isolation from manual skills.

### Multi-source with Trust Gate

You can add third-party sources:

```bash
loadout source add contrib --url https://github.com/community/skills --ref main
loadout source trust contrib --yes  # Explicit confirmation
loadout add --target codex contrib:special-formatter
```

New sources are untrusted by default. Operations fail with `SOURCE_UNTRUSTED` error until explicitly confirmed. Supply-chain safety out of the box.

### Agent-first UX

Loadout is designed for agents, not humans:

- JSON output by default (machine-readable)
- No interactive prompts (all inputs via args)
- Idempotent operations (running twice = running once)
- Stable error codes (`SKILL_NOT_FOUND`, `SOURCE_UNTRUSTED`)
- Deterministic search (lexical scoring, not LLM)

```bash
# Search for skills
loadout suggest --target codex --query "pdf" --limit 10

# Add skills
loadout add --target codex pdf-processing image-processing

# Check status
loadout status --target codex
```

The agent calls the CLI, parses JSON, shows the user a formatted result. The protocol is described in the Agent Playbook.

## Insight

Dependency management is a solved problem. npm, cargo, poetry have worked for decades. The manifest + lock + resolver pattern is universal.

Skills for AI agents are the same dependencies. They affect system behavior, need versioning, and controlled updates.

Loadout doesn't invent anything new. It applies a proven pattern to a new domain: context management for AI agents.

An interesting detail: symlinks instead of copies. Unlike traditional package managers, skills often need local modifications. A symlink lets you edit and immediately push improvements back to the source. This isn't a bug — it's a feature.

When you look at skill drift as a dependency management problem, the solution becomes obvious. Manifest declares intent. Lock captures state. Symlinks enable bidirectional flow of improvements.

## Sources

- [Loadout on GitHub](https://github.com/t3chn/loadout)
