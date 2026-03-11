---
title: "Environment is context: security auditing for AI agent workstations"
description: We carefully design prompts and tools but rarely audit the environment
  where the agent actually runs. Sentinel makes that measurable.
date: 2026-03-11
tags:
  - contextengineering
  - claudecode
  - security
  - agents
  - devtools
canonical_url: https://ctxt.dev/posts/en/sentinel-environment-security-audit
lang: en
devto_id: 3338087
devto_url: https://dev.to/t3chn/environment-is-context-security-auditing-for-ai-agent-workstations-1li8
hashnode_id: 69b118f23ff0e6a00d3e5c3b
hashnode_url: https://t3chn.hashnode.dev/environment-is-context-security-auditing-for-ai-agent-workstations
---

We talk a lot about prompts, tools, and evals. But almost nobody audits the environment where the AI agent actually runs.

The agent sees your `.env` files. Your `.mcp.json` with hardcoded tokens. Your `settings.json` with `"permissions": "allow"`. Your plugins, hooks, configs. All of this is operational context, and it directly determines what the agent can do. If an API key sits in plaintext - the agent will read it. If no `PreToolUse` hook is configured - any Bash command runs unfiltered. If `.claudeignore` is missing - the agent reads every file in the project.

These are not hypothetical risks. This is the default configuration.

## The attack surface nobody measures

Run a mental audit of your workstation:

**Secrets.** How many `.env` files do your projects have? Are they in `.gitignore`? Any secrets in git history? When you launch Claude Code, the shell already contains `ANTHROPIC_API_KEY`, `AWS_SECRET_ACCESS_KEY`, `GITHUB_TOKEN` - the agent can run `printenv` and see everything.

**MCP servers.** Open `.mcp.json`. Tokens right there in JSON? Server versions unpinned? No `allowedTools` to restrict available tools? Every MCP server is a child process that inherits all environment variables.

**Hooks.** Is there a `PreToolUse` hook filtering dangerous Bash commands? What about subagents? Claude Code doesn't inherit parent hooks in subagents - that's a documented bug, not a feature.

**Trust boundaries.** Do you have `.claudeignore`? Is permission mode `default` or `acceptEdits`? How many plugins are installed and which ones have `hooks`?

Each of these questions is binary: yes or no, safe or not. They can be checked deterministically, without an LLM, without interpretation.

## Environment as context

In context engineering, we turn the implicit into the explicit. Prompts, instructions, tools - everything becomes structured context that shapes agent behavior.

But the runtime environment is also context. When an agent launches in a shell with `direnv`-loaded secrets, it gets access not because you designed it that way, but because nobody checked. When an MCP server starts without `allowedTools`, the agent gets access to every tool - not because it's needed, but because that's the default.

Workstation security posture is implicit context. And as long as it's implicit, you can't manage it.

## Sentinel: deterministic audit

[Sentinel](https://github.com/heurema/sentinel) is a Claude Code plugin that runs 18 checks across six categories:

| Category | Checks | What it looks for                                                                               |
| -------- | ------ | ----------------------------------------------------------------------------------------------- |
| secrets  | 5      | Plaintext keys, `.env` without `.gitignore`, secrets in git history, runtime env vars, dotfiles |
| mcp      | 3      | Tokens in `.mcp.json`, missing `allowedTools`, unpinned server versions                         |
| plugins  | 3      | Registry drift, scope leakage, unverified plugins                                               |
| hooks    | 2      | Missing `PreToolUse` guard, subagent hook gap                                                   |
| trust    | 3      | No `.claudeignore`, broad permissions, injection surface                                        |
| config   | 2      | Insecure defaults, stale sessions                                                               |

Each check is a standalone POSIX sh script outputting JSON. No LLM. No heuristics. `grep` finds a plaintext token in `.mcp.json` - or it doesn't. `stat` checks file permissions - 600 or not. Results are reproducible.

```
LOAD > VALIDATE > PLAN > RUN > NORMALIZE > ASSESS > PERSIST > RENDER
```

Output is a JSON report and a terminal scorecard:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  sentinel audit - run_20260311T120000Z
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Category     Score   Checks
  secrets       40/100  ██░░░░░░░░  2/5 pass
  mcp           67/100  ██████░░░░  2/3 pass
  plugins      100/100  ██████████  3/3 pass
  hooks          0/100  ░░░░░░░░░░  0/2 pass
  trust         60/100  ██████░░░░  2/3 pass
  config        50/100  █████░░░░░  1/2 pass

  Total: 47/100    Verdict: FAIL
  Reliability: 1.00 (18/18 checks ran)
```

Two independent metrics: **score** (0-100) for security posture, **reliability** (0.0-1.0) for how much of the audit actually ran. A score of 95 with reliability 0.4 is not trustworthy.

## What I found

The first sentinel run on my workstation scored 47 out of 100. Real findings:

- 8 plaintext `.env` files with API keys across 4 work contexts
- `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, and 12 more secrets accessible via `printenv` in the current shell
- 3 MCP servers with tokens in `.mcp.json`
- Zero `PreToolUse` hooks - any Bash command runs without filtering
- Missing `.claudeignore` in several projects

None of these were accidental. This is the result of standard setup: install Claude Code, add MCP servers, start working. Environment security is not what you think about during installation.

## Remediation: not just finding, but fixing

`/sentinel-fix <run_id>` walks through each FAIL/WARN finding and shows:

1. **What** - problem description with redacted evidence
2. **Why** - risk explanation
3. **How** - specific command to fix

Commands come from the check registry, not generated by an LLM. `sentinel-fix` never auto-executes - it only suggests. Risk badge for each action: `safe`, `caution`, `dangerous`.

After fixing, run `/sentinel-diff` to compare reports. Each finding has a stable `finding_id` (SHA-256 of `check_id|category|evidence_paths`), enabling tracking: new issues, resolved issues, status changes.

## What this means for context engineering

We spend effort ensuring the agent gets the right system prompt, the right tools, the right documentation. But the runtime environment is context too - just unmanaged. A plaintext secret in `.env` is not a security problem in a vacuum. It's implicit context that determines what the agent _can_ do, beyond what it's _supposed_ to do.

A security audit for the AI workstation is not paranoia. It's the same practice as dependency checking, linting, CI pipelines. There just wasn't a tool for this new class of risks.

## Install

```bash
claude plugin add heurema/sentinel
```

Then:

```
/sentinel              # full audit
/sentinel --deep       # audit + LLM risk explanation
/sentinel-fix <run_id> # guided remediation
/sentinel-diff         # compare with previous audit
```

## Links

- [sentinel on GitHub](https://github.com/heurema/sentinel)
- [skill7.dev/devtools/sentinel](https://skill7.dev/devtools/sentinel)
- [Contract is context: Signum](/posts/en/signum-contract-first-ai-dev) - AI code verification
- [11 plugins, one marketplace: the heurema ecosystem](/posts/en/heurema-ecosystem)
