---
title: "Git is not for agents"
description: "Why git breaks AI agents and how jj solves every single one of these problems"
date: 2026-02-19
tags: ["context-engineering", "ai-agents", "tools"]
lang: en
---

## Problem

Git was built for humans. Interactive rebase, staging area, detached HEAD — all of it assumes a person at the terminal who understands the context and can make decisions.

An AI agent is not a person. It can't answer `rebase --continue`. It can't pick files in `git add -i`. It can't meaningfully resolve a merge conflict in the middle of a long operation.

Real incidents: Claude Code lost 4 days of work to `reset --hard` (issue #11237). Codex destroyed 9 files with a single command (issue #8643). Copilot gives up on pre-commit hook errors instead of fixing the problem.

## Context

The problem runs deeper than it seems. Git isn't just an inconvenient tool for agents. It's a tool with fundamentally wrong abstractions for automation.

Staging area. For a human — a convenient intermediate zone. For an agent — an extra step that adds nothing and creates a "partially added" state.

Destructive commands without confirmation. `git checkout .` wipes all uncommitted changes. No questions asked. A human knows what they're doing. An agent runs the command from a familiar pattern — and loses work.

Conflicts block workflow. When two parallel agents work in the same repository, merge conflicts stop both of them. Neither can continue until the conflict is resolved.

Hooks break automation. Pre-commit hook with a linter? The agent gets an error, can't commit, and often doesn't understand how to fix the issue within the hook script.

## Solution

jj (Jujutsu) is a next-generation VCS from Google. It runs on top of a git backend (colocated mode) but with a radically different model.

**Working copy = commit.** Every file save is already in history. Losing uncommitted work is impossible by design.

```bash
# In git: forgot to commit → reset --hard → work gone
# In jj: working copy IS a commit. Always.
jj log  # see all changes, including current ones
```

**Operation log — full operation history.** Every action in jj is recorded. Rolling back any operation to any depth — one command.

```bash
jj op log          # history of all operations
jj undo            # undo the last one
jj op restore <id> # restore to any point
```

**Conflicts are data, not blockers.** jj records the conflict directly in the commit. Work continues. The conflict is resolved when convenient, not when git forces you to.

**No staging area.** No `git add`. All changes are automatically in the current commit. One step instead of two.

**Everything is non-interactive.** No prompts, no `--continue`, no editors. Every command is an atomic operation with a predictable result.

**Workspaces for parallel agents.** `jj workspace add` creates an isolated working space with a shared commit graph. Two agents work in parallel without conflicts.

```bash
jj workspace add ../agent-workspace-2
# Two agents, two workspaces, one repository
# Each sees the other's commits but doesn't interfere
```

**Colocated mode — zero risk.** `jj git init --colocate` on any existing git repository. Git and jj work side by side. The team keeps using git, agents use jj.

## Insight

Development tools were built for human convenience. Interactivity, flexibility, visual feedback — all of this gets in the way of automation.

AI agents need different properties: atomic operations, full undo, predictability without dialogue, safety in parallel work.

jj covers 7 out of 11 properties of an ideal VCS for agents. The remaining four (semantic diff, content-addressing, agent metadata, sandbox-first) aren't implemented in any tool yet.

No need to wait for the perfect solution. `jj git init --colocate` — one command, and every git repository becomes safer for agents today.

## Sources

- [Jujutsu VCS](https://jj-vcs.github.io/jj/)
- [Claude Code Issue #11237](https://github.com/anthropics/claude-code/issues/11237)
- [Codex Issue #8643](https://github.com/openai/codex/issues/8643)
- [agentic-jujutsu](https://github.com/agentic-jujutsu)
