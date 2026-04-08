---
title: "AI Agents Need Permission Boundaries, Not Personalities"
description: "Most agent runtimes add more roles. punk starts from a harder premise: trust comes from boundaries, durable state, and proof."
date: 2026-04-08
tags: ["contextengineering", "agents", "architecture", "verification"]
lang: en
canonical_url: https://ctxt.dev/posts/en/ai-agents-need-permission-boundaries/
---

Most agent tooling mistakes coordination for reliability. It gives you more
roles, more agents, more orchestration, and more shell theater. The demo gets
more impressive. The system does not necessarily get easier to trust.

That tradeoff used to be tolerable when humans still carried the real model of
the work in their heads. A messy runtime could end in a decent result because a
human operator could reconstruct intent, inspect the diff, and override weak
process with judgment. That stops scaling once generation becomes cheap, fast,
and constant. The bottleneck is no longer code generation. It is trust.

That is why the most interesting agent systems are not the ones with the most
personalities. They are the ones that make planning, execution, and
verification legible as different kinds of authority.

That is the bet behind [specpunk](https://github.com/heurema/specpunk), now
being reset into `punk`. The project is explicit about the reset. It is not
polishing a launched product. It is rebuilding around a stricter shape: one
CLI, one vocabulary, one runtime, and three hard modes - `plot`, `cut`, and
`gate`. That matters because those modes are not style presets. They are
permission boundaries.

## The coordination trap

A lot of agent tooling still assumes that better software delivery comes from
adding more orchestration surfaces. The pattern usually looks familiar:

- one agent plans
- another agent implements
- another agent reviews
- a shell coordinates them
- a chat transcript becomes the history of what happened

This can produce useful work. It can also produce confidence theater.
Coordination is not the same thing as ground truth.

If the runtime cannot answer four basic questions, it is not a trust system
yet:

1. What exactly was approved?
2. What actually ran?
3. What state is authoritative now?
4. What proof exists for the final decision?

More agents do not answer those questions. More roles do not answer those
questions. A fancier shell does not answer those questions. At best, those
things improve throughput or ergonomics. At worst, they multiply ambiguity.
That is the trap: agent runtimes optimize for visible activity instead of
enforceable structure.

## What trustworthy agent work actually needs

If you strip away the theater, trustworthy agent work needs a smaller set of
primitives than most tools expose:

- approved intent
- bounded execution
- durable work state
- a clear decision surface
- proof-bearing artifacts

That list is more important than any model roster. An agent can be brilliant
and still untrustworthy if it is allowed to plan, mutate, and self-validate
inside one fuzzy surface. The failure mode is not only bad code. It is
unfalsifiable process.

A human operator should not have to reconstruct the truth by reading prompts,
shell chatter, and commit residue. The runtime should already have a durable
answer. This is where `punk` starts from a stronger premise than most agent
systems:

> the shape of the runtime matters more than the number of agents inside it.

## Why `punk` resets the shape

The `specpunk` docs are unusually clear about what is being built. `punk` is
becoming a local-first engineering runtime with one CLI, one vocabulary, one
artifact chain, and one state truth.

The canonical object chain in the docs is:

```text
Project
  -> Goal
    -> Feature
      -> Contract
        -> Task
          -> Run
            -> Receipt
            -> DecisionObject
            -> Proofpack
```

That is already a different product claim from "we coordinate a bunch of coding
agents for you." The center is not the agent. The center is the artifact
chain.

That choice has consequences. It means the runtime is trying to preserve
continuity across attempts, retries, verification steps, and future
inspection. A `Feature` survives beyond one implementation pass. A `Contract`
is explicit. A `Run` is one concrete attempt. A `DecisionObject` is written
only by `gate`. A `Proofpack` is the final audit bundle. This is a reliability
architecture, not a chat architecture.

## Substrate first, shell second

The strongest idea in the current `punk` design is the split between two
layers:

- a correctness substrate
- an operator shell

The substrate owns durable truth:

- project identity
- goal intake
- contract
- scope
- workspace isolation
- run state
- decision objects
- proof artifacts
- the ledger

The shell owns ergonomics:

- `punk init`
- `punk start`
- `punk go --fallback-staged`
- summaries
- blocked and recovery UX
- generated repo-local guidance

This may sound obvious, but most agent systems blur these two layers almost
immediately. The shell becomes a hidden policy engine. Safety semantics leak
into prompts. Output formatting starts pretending to be state. Eventually
nobody can tell whether a behavior is enforced by the runtime or merely
suggested by the interface.

`punk` is trying to stop that drift early. The rule in the architecture docs is
simple and important: the shell may compose substrate operations, but it must
not become a second source of truth. That is the kind of rule that keeps a tool
honest as it grows.

## `plot`, `cut`, and `gate` are not vibes

The three canonical modes in `punk` are easy to misunderstand if you have seen
too many agent UIs. `plot`, `cut`, and `gate` are not there to make the tool
feel cinematic. They exist to separate authority.

- `plot` shapes work, inspects the repo, drafts and refines contracts
- `cut` executes bounded changes in an isolated VCS context
- `gate` verifies results, writes the final decision, and emits proof

The docs explicitly say these are hard permission boundaries, not tone
presets. That is a serious design choice.

A lot of agent failures come from collapsing these phases into a single
conversational loop. The same surface interprets intent, changes code, judges
its own result, and narrates success. Even when the final answer sounds
careful, the trust boundary is weak because the roles are merged at the runtime
level.

`punk` moves in the opposite direction. Only `gate` writes the final
`DecisionObject`. Only approved contracts should reach `cut`. The event log and
derived views hold runtime truth, not the shell summary. That is what
permission boundaries look like in practice: not "agent A is the planner" and
"agent B is the reviewer," but real authority boundaries and real artifact
ownership.

## Durable work state matters more than chat history

Another strong thread in the design is the work ledger idea. Most agent
sessions leave behind a bad form of memory:

- shell logs
- chat transcripts
- commits
- maybe a branch name
- maybe a PR

That is enough until something blocks, fails, gets superseded, or needs to
continue later. Then everybody starts asking the same questions: what is the
active contract, what was the latest run, did verification block or escalate,
and what should happen next?

If the only answer is "read the last few screens of terminal output," the
runtime is weak. The `punk` docs push toward a `WorkLedgerView` that can answer
those questions directly. That is the right instinct. Agents do not only need
context to act. Operators need durable work state to continue. Again, the move
is the same: replace inference with explicit structure.

## Why the one-face shell still matters

None of this means the UX should be ugly. In fact, the `punk` docs make another
smart move: they argue for a one-face operator shell. The normal user should be
able to give a plain goal and get back one concise progress or blocker summary
plus one obvious next step.

That is good design, but the key is what comes underneath it. A clean shell is
valuable only if it sits on top of a substrate that already knows what is
authoritative. Otherwise one-face UX becomes a prettier way to hide ambiguity.
That is why the substrate-versus-shell split matters so much. `punk` is not
rejecting ergonomics. It is refusing to let ergonomics pretend to be truth.

## A better shape for agent engineering

The most interesting thing about `punk` is not that it might someday
orchestrate multiple models, run councils, or improve skills through eval
loops. The interesting thing is the order of operations.

Before any higher-level feature, the project is trying to get the runtime shape
right:

- one vocabulary
- explicit artifact chain
- bounded modes
- durable state
- proof before acceptance

That is the right order. If you get the shape wrong, every later feature
inherits ambiguity. Councils become opinion aggregators instead of structured
advisory mechanisms. Skills become prompt folklore instead of evidence-backed
overlays. Shell UX becomes theater instead of control.

If you get the shape right, those later layers have something solid to attach
to. That is why `punk` is worth paying attention to even in a rebuild phase. It
is making an architectural claim that more agent tooling should make
explicitly:

> reliability does not come from adding more agent personalities. It comes
> from enforcing boundaries between intent, execution, verification, and
> proof.

More agents do not create ground truth. More roles do not create safety. If
planning, execution, and verification are not separated by hard boundaries, the
runtime scales ambiguity, not trust. That is the real reason this design reset
matters.

## Sources

- [specpunk on GitHub](https://github.com/heurema/specpunk)
- [punk Vision](https://github.com/heurema/specpunk/blob/main/docs/product/VISION.md)
- [punk Architecture](https://github.com/heurema/specpunk/blob/main/docs/product/ARCHITECTURE.md)
- [punk CLI](https://github.com/heurema/specpunk/blob/main/docs/product/CLI.md)
- [Specpunk Identity and Layering](https://github.com/heurema/specpunk/blob/main/docs/research/2026-04-03-specpunk-identity-and-layering.md)
- [Specpunk One-Face Operator Shell](https://github.com/heurema/specpunk/blob/main/docs/research/2026-04-03-specpunk-one-face-operator-shell.md)
- [Specpunk Work Ledger](https://github.com/heurema/specpunk/blob/main/docs/research/2026-04-03-specpunk-work-ledger.md)
