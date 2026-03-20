---
title: "Your AI Agent Can't Tell Which Solution Is Current"
description: "AI agents rewrite code but leave the old version behind. jj's predecessor chains make ghost solutions detectable -- git can't."
date: 2026-03-20
tags:
  - context-engineering
  - jj
  - code-entropy
  - agents
lang: en
canonical_url: https://ctxt.dev/posts/en/jj-supersession-substrate/
---

Last week I asked Claude to add JWT authentication to a project. It found two implementations -- a password-based `login()` from three sessions ago and a newer `authenticate()` with JWT. It built on top of the old one.

The old function compiled. It had tests. It was imported. It was also completely superseded -- I'd rewritten auth two sessions earlier. But nothing in the codebase said "this is the old one, ignore it."

## The ghost solution problem

When you work with AI agents across multiple sessions, a pattern emerges: the agent produces solution A, then in a later session replaces it with solution B. But A stays behind. It compiles, it has tests, it might even be imported somewhere. GitClear measured an [8x increase](https://www.gitclear.com/coding_on_copilot_data_shows_ais_downward_pressure_on_code_quality) in duplicated code blocks in AI-assisted repos by 2024.

I checked 12 AI coding agents. Zero of them track when one solution supersedes another. They can find dead code (unreferenced symbols), but they can't find ghost code -- functions that are structurally alive but semantically replaced.

The difference matters. Dead code is a function nobody calls. Ghost code is a function that _looks_ like the right one to call.

## Why git can't help

Git tracks commits. When you amend, rebase, or squash, the old SHA disappears. Git reflog exists, but it's local, ephemeral, and per-ref -- not per logical change.

If I write `login()` in commit A, then rewrite it in commit B via `git commit --amend`, the connection between A and B is gone. There's no way to ask git: "show me all previous versions of this logical change."

## jj tracks what git forgets

[jj (Jujutsu)](https://jj-vcs.dev/) has a data model that makes supersession tracking structural, not accidental.

Three things matter:

**Change IDs survive rewrites.** Unlike a git SHA, a jj Change ID stays the same across amend, rebase, and squash. The logical identity of "this unit of work" persists.

**Predecessor chains are explicit.** Every rewrite creates an edge: `new_commit → old_commit`. These edges are stored in the operation log, not in a local reflog. They're queryable.

**`jj evolog` exposes the full history.** One command shows every version of a change, with diffs, authors, and timestamps:

```bash
$ jj evolog -r yvxz --no-graph
yvxz c7dc758  2026-03-20  feat: JWT authentication
yvxz e515ca3  2026-03-17  feat: password-based login
```

Same Change ID. Two versions. The predecessor chain tells you: the second one replaced the first.

## From file-level to function-level

jj tracks at file granularity. Knowing that `auth.py` changed between versions is useful, but what I actually need is: "which functions were replaced?"

[py-tree-sitter](https://github.com/tree-sitter/py-tree-sitter) bridges the gap. Parse both versions, extract function definitions, intersect with `changed_ranges()`:

```
jj evolog (JSON) → changed files → tree-sitter function extraction → diff
```

For each predecessor-successor pair, the pipeline answers: which functions were added, removed, or rewritten?

## Scoring supersession

Not every changed function is a ghost. A function that gets a one-line bugfix isn't superseded -- it's maintained. I needed a score that captures "this was replaced, not patched."

Three signals:

```
score = 0.50 × function_overlap    # how much of the function body changed
     + 0.25 × same_author          # same person rewriting their own code
     + 0.25 × recency              # recent changes score higher
```

`function_overlap` comes from tree-sitter: the ratio of modified + removed functions to total functions in the file. High overlap means the rewrite touched most of the logic, not just a parameter.

`same_author` and `recency` come directly from jj's `CommitEvolutionEntry` metadata -- no external data needed.

A score above 0.7 reliably flags ghost solutions in my repos. Below 0.5 is usually a bugfix or minor edit.

## jj-supersede: the tool

I built [jj-supersede](https://github.com/heurema/jj-supersede) to automate this. Python CLI, ~600 lines, uses click + tree-sitter:

```bash
# Check one change's history
$ jj-supersede detect yvxz
Score  Function        File           Old→New
 0.85  login           src/auth.py:10  abc123→def456
 0.72  validate_token  src/auth.py:30  abc123→def456

# Scan all recent changes
$ jj-supersede scan

# JSON for pipelines
$ jj-supersede report --json
```

It supports Python, Rust, JavaScript, and TypeScript. Functions get qualified names (`Class.method`, `outer.inner`) so methods in different classes don't collide.

## Injecting ghost warnings into agent context

Detection alone doesn't help if the agent never sees the results. The last piece is a session-start hook that runs `jj-supersede context` when Claude Code starts a session:

```bash
# In a jj repo with superseded code:
$ jj-supersede context
## Superseded Code (2 ghost functions detected)

- WARNING: src/auth.py:1 `login` superseded (score 1.00, change orqmmqny)
- WARNING: src/auth.py:6 `validate` superseded (score 1.00, change orqmmqny)

Run `jj-supersede detect <change-id>` for details.
```

This gets injected into the agent's system prompt. Now when Claude starts working, it knows which implementations are ghosts before writing a single line.

## What git would need

For git to support this natively, it would need:

1. A stable logical identity that survives rewrites (Change ID equivalent)
2. Explicit predecessor edges stored outside reflog
3. A first-class evolution log command
4. JSON-serializable evolution entries

These are architectural decisions in jj's data model, not features you can bolt on. Git's reflog is the closest analog, and it's local-only, per-ref, and prunable.

## The pipeline

jj-supersede fits into a larger entropy elimination pipeline:

```
jj-supersede scan --json
    → signum CONTRACT phase (generates cleanupObligations)
    → signum EXECUTE (agent removes ghost code)
    → signum RECONCILE (verifies cleanup)
```

The detection layer feeds into [signum](https://github.com/heurema/signum)'s contract-first workflow, where superseded functions become explicit removal obligations -- not suggestions, but tracked cleanup tasks with resolution timestamps.

## Try it

```bash
uv tool install jj-supersede
jj-supersede scan
```

Requires [jj](https://jj-vcs.dev/) and a jj-managed repository. The [session-start hook](https://github.com/heurema/jj-supersede/tree/main/hooks) is optional but recommended for agent workflows.

The code is at [heurema/jj-supersede](https://github.com/heurema/jj-supersede). It's 600 lines of Python, 38 tests, and zero ML -- just predecessor chains and AST diffing.
