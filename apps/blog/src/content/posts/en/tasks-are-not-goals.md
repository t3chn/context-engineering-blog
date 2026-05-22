---
title: "Tasks Are Not Goals"
description: "A task tells an agent what to change. A goal should also carry intent, boundaries, stop conditions, and evidence."
date: 2026-05-22
tags: ["context-engineering", "agents", "workflow", "verification"]
lang: en
---

A task is a useful handle. It is not enough context to delegate work to an agent.

"Fix the export bug" sounds clear until the agent starts filling in the missing parts. Which export path is authoritative? Which user role matters? Is the bug in the API, the UI, the queue, or the data contract? Can the agent touch migrations? Should it preserve the current file format? What counts as proof that the bug is fixed?

A human teammate often carries that context in memory. An agent usually does not. When the task is thin, the agent has to infer the rest from the repo, recent chat, file names, test shape, and whatever it can reach. Some of those inferences will be good. Some will be wrong. The hard part is that both can look equally confident in the final diff.

That is the failure mode I care about: the visible task is real, but the execution boundary is missing.

## The Thin Task

Issue trackers are good at inventory. They are less good at execution context.

A task title usually answers one question:

```text
What movement do we want?
```

For agent work, that is only the first question. The agent also needs to know:

- why this change exists;
- which source of truth wins when files disagree;
- which parts of the system are allowed to change;
- which parts are explicitly out of scope;
- when the agent should stop instead of guessing;
- what evidence proves the result;
- what remains unverified at handoff.

Without those boundaries, a task becomes an invitation to optimize for visible completion. The agent can make a diff, update tests, write a clean summary, and still miss the actual goal.

The signal is real: files changed, tests ran, output exists.

The conclusion is not: this does not prove the goal was satisfied.

## A Goal Carries the Contract

I use "goal" for the small operational contract around a task.

It does not need to be a heavyweight specification. It does need to make the work inspectable before and after execution. A useful goal packet says:

```text
Goal:
Why:
Sources of truth:
Allowed changes:
Out of scope:
Stop if:
Evidence:
Handoff:
```

The value is not in the template. The value is in forcing the missing context to become visible.

Consider a task:

```text
Add CSV export to the customers table.
```

That is not enough. The goal packet might add:

```text
Goal:
Add a CSV export for the existing customers table.

Why:
Support internal account review without giving reviewers database access.

Sources of truth:
The existing customers table columns in the API response are authoritative.
Do not infer private fields from database schema names.

Allowed changes:
Frontend table toolbar, existing API route, tests for exported columns.

Out of scope:
New permissions model, background jobs, analytics events, schema migrations.

Stop if:
The current API response does not include a required field.
Export requires exposing fields that are not already visible in the UI.

Evidence:
Unit test for exported headers and escaping.
Manual browser check on the customers table.
Note any field intentionally excluded.

Handoff:
List files changed, commands run, and what was not tested.
```

Now the agent has something stronger than a task title. It has a boundary for action and a boundary for trust.

## Stop Conditions Are Part of the Work

Agent autonomy gets worse when "continue" is the only default.

Good goal packets include stop conditions because some uncertainty should not be resolved by implementation. If the task crosses authentication, billing, migrations, data retention, destructive operations, or user-owned work, the right move may be to stop and surface the blocker.

This is not a lack of autonomy. It is the form autonomy needs in a shared codebase.

Examples:

- Stop if the fix requires changing a public API contract.
- Stop if existing uncommitted edits overlap the target files.
- Stop if verification depends on a secret or live credential that is not available.
- Stop if the issue requires a migration but the goal did not authorize schema changes.
- Stop if two local documents disagree and neither is marked as authoritative.

These lines look boring. They prevent expensive mistakes.

The same applies to non-goals. "Do not rewrite the table component" is not micromanagement if the real goal is a two-line export fix. "Do not touch billing policy" is not bureaucracy if the task lives near billing code. Boundaries reduce the search space. They also make the final review cheaper, because the reviewer can check whether the agent stayed inside the allowed area.

## Evidence Is the Completion Boundary

The phrase "done" is too vague for agent work.

For a small code change, evidence might be:

- the failing test that reproduced the bug;
- the passing test after the fix;
- the exact command that ran;
- a screenshot for a UI change;
- a file reference for the source of truth;
- a short list of what was not tested.

For a research or documentation task, evidence might be different:

- source URLs;
- local file paths;
- command output;
- version numbers;
- date of observation;
- unresolved claims.

The important part is not the format. The important part is that evidence is named before the agent begins, not invented after the diff exists.

When evidence is defined late, the agent can choose the proof that flatters the output. When evidence is defined early, the output has to meet the goal.

That is the line between "I changed something" and "the goal is satisfied enough to hand off."

## Memory Does Not Replace a Goal

Longer agent memory can help with continuity. It can also hide missing context.

If the agent remembers that "we usually avoid migrations" or "this repo prefers small diffs", that is useful. But memory should not silently supply a permission boundary. If the current goal needs "no migrations", it should say so in the work packet. If the source of truth is a specific file, it should be named. If existing dirty state must be preserved, that is a current constraint, not a personality trait of the repo.

Memory is a hint. A goal is the contract for this run.

This distinction matters when work moves between humans and agents. A human can ask, "Why did it stop here?" The answer should not be "because the agent had a feeling from prior context." It should be visible in the packet:

```text
Stop if verification requires live credentials.
```

or:

```text
Out of scope: schema changes.
```

Inspectable boundaries beat remembered preferences.

## The Shift

I still want tasks. They are the right unit for backlog inventory, triage, and prioritization.

I do not want thin tasks to be the unit of autonomous execution.

For that, the unit should be a goal packet: small enough to write quickly, concrete enough to constrain the agent, and explicit enough to review afterward. It should say what the work is, why it exists, where it can move, where it must stop, and what evidence counts.

This changes the shape of delegation.

Instead of:

```text
Here is a task. Go solve it.
```

the handoff becomes:

```text
Here is the goal.
Here is the boundary.
Here is the source of truth.
Here is when to stop.
Here is the evidence I expect.
```

That does not make agent work perfect. It makes the claim inspectable.

The agent may still fail. The goal may be weak. The evidence may miss an edge case. But the review no longer starts from a polished summary and a diff. It starts from a visible contract:

```text
Did the work stay inside the goal?
Did it stop where it should have stopped?
Does the evidence match the claim?
What risk remains?
```

That is the practical difference between a task and a goal.

## Try One

Take one task you would normally hand to an agent and rewrite it as a goal packet before the agent touches the repo.

If you want a place to compare examples, I keep short field notes and follow-up discussions in [@ctxtdev on Telegram](https://t.me/ctxtdev). A good example is small: one task title, the source of truth, what the agent may change, where it must stop, and what evidence would make the result trustworthy.

For code changes that need a stricter contract-first path, the related tool is [Signum](https://github.com/heurema/signum). It is more than this article requires, but it points in the same direction: do not let the agent guess the definition of done.
