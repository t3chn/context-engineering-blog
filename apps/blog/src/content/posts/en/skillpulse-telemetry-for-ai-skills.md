---
title: "Skillpulse: Your AI Skills Are Flying Blind Without Telemetry"
description: "A PostToolUse hook that logs every skill activation to local JSONL. No existing tool tracks whether the model actually follows a skill's instructions."
date: 2026-03-11
tags: ["context-engineering", "claude-code", "agents", "telemetry", "local-first"]
lang: en
---

You install 16 skills. You see them fire. But here's the question nobody asks: **did the model actually follow them?**

I reviewed every telemetry tool in the Claude Code ecosystem -- built-in OTel, claude_telemetry, claude-code-otel, even the skills.sh platform metrics. None of them track skill adherence. They tell you a skill was loaded, but not whether the model executed its instructions.

So I built skillpulse.

## The gap

Claude Code's built-in OpenTelemetry (via `CLAUDE_CODE_ENABLE_TELEMETRY=1`) captures general metrics: session duration, tokens, cost, tool calls. With `OTEL_LOG_TOOL_DETAILS=1`, it even records `skill_name` in tool result events. But that's a load signal, not a follow signal.

The difference matters. A skill can load successfully and be completely ignored by the model. Without tracking adherence, you're optimizing in the dark.

| Tool             |   Tracks loading   | Tracks following  |
| ---------------- | :----------------: | :---------------: |
| Built-in OTel    |        Yes         |        No         |
| claude_telemetry |         No         |        No         |
| claude-code-otel |         No         |        No         |
| skills.sh        | Install count only |        No         |
| **skillpulse**   |      **Yes**       | **Yes (planned)** |

## How it works

Skillpulse is a `PostToolUse` hook that fires on every `Skill` tool call. It writes one JSONL line per activation:

```json
{
  "skill_id": "signum:signum",
  "timestamp": "2026-03-11T08:48:18Z",
  "session_id": "20260311_114818_93074",
  "loaded": true,
  "followed": null,
  "plugin_name": "skillpulse"
}
```

The implementation is 60 lines of bash. Some design choices:

**2-second watchdog.** PostToolUse hooks run synchronously -- a hung hook blocks the entire session. Skillpulse spawns a self-kill watchdog that sends SIGKILL after 2 seconds. In practice, the hook finishes in <50ms.

**Skill-only filter.** PostToolUse fires for every tool call -- Read, Write, Bash, everything. Skillpulse checks `tool_name == "Skill"` and exits immediately for anything else. Zero overhead on non-skill calls.

**Append-only JSONL.** No database, no rotation, no config. One file at `~/.local/share/emporium/activation.jsonl`. Survives crashes, easy to inspect, trivial to back up.

## What I learned from 4 entries

Yes, four. Skillpulse was created on March 4th and then... not installed. Classic. I fixed that today.

But even 4 entries told me something useful:

```
Skill                       Acts  Sess  Load%  Age
-----------------------------------------------------
herald:news-digest             2     2  100%   7d
arbiter                        1     1  100%   7d
signum:signum                  1     1  100%   7d
```

Three skills account for all activations. I have 16 installed. That's an 81% dormancy rate. Most of my skills are dead weight consuming context tokens.

## The aggregator

A 90-line Python script reads the JSONL and produces per-skill stats:

```bash
python3 scripts/aggregate.py          # table output
python3 scripts/aggregate.py --json   # for pipelines
```

No dependencies. Reads timestamps, groups by skill_id, computes frequency, unique sessions, loaded rate, and days since last activation.

## Where this is going

Skillpulse is Phase 1 of a larger pipeline I'm calling EvoSkill -- skills that improve themselves based on usage data.

The pipeline:

```
skillpulse (log)
    |
aggregator (stats)
    |
bench (test against tasks)
    |
evolver (propose improvements)
```

The `followed` field is currently null -- it needs tool-pattern fingerprinting to determine if the model executed a skill's expected behavior. That's the hard part, and I'm deliberately deferring it until I have enough activation data to validate the approach.

Some things I'm explicitly skipping at my current scale (<20 sessions/week, 16 skills):

- **Hotelling T-squared drift detection** -- need 50+ trajectories per skill
- **Bayesian calibration** -- need labeled outcome data
- **Hierarchical routing** -- relevant at 50+ skills
- **Automated gates** -- human review is my gate for now

The research backing this is in [EvoSkill](https://arxiv.org/abs/2603.02766), [AutoSkill](https://arxiv.org/abs/2603.01145), and the [ASI drift framework](https://arxiv.org/abs/2601.04170).

## Try it

```bash
claude mcp add-json skillpulse '{"source": {"source": "url", "url": "https://github.com/heurema/skillpulse.git"}}'
```

Source: [github.com/heurema/skillpulse](https://github.com/heurema/skillpulse)

All data stays local. MIT licensed. Zero dependencies beyond bash and jq.
