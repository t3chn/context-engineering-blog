---
title: 'Switching AI CLIs Without Losing 32 Skills: Why I Built nex'
description: A Rust CLI that makes your AI agent skills portable across Claude Code,
  Codex, and Gemini. One command to install, one command to switch.
date: 2026-03-17
tags:
- aiagents
- claudecode
- rust
- cli
- opensource
- devtools
lang: en
canonical_url: https://ctxt.dev/context-engineering-blog/nex-cross-cli-skill-portability
devto_id: 3362698
devto_url: https://dev.to/t3chn/switching-ai-clis-without-losing-32-skills-why-i-built-nex-6e4
hashnode_id: 69b930fd628abacc18e3948b
hashnode_url: https://t3chn.hashnode.dev/switching-ai-clis-without-losing-32-skills-why-i-built-nex
---

I use three AI coding CLIs daily: Claude Code, Codex CLI, and Gemini CLI. Each has plugins, skills, and custom workflows I've built over months. When I wanted to try Codex as my primary tool for a week, the migration looked like this:

- Manually recreate 32 symlinks
- Adapt plugin layouts to each CLI's format
- Track which version is installed where
- Hope nothing drifts while I'm not looking

I built nex to make this a one-liner.

## The problem: skills are trapped

AI coding agents are converging on similar concepts  - skills (reusable instructions), plugins (tools + hooks), and agents (autonomous workers). But each CLI implements them differently:

| Concept | Claude Code | Codex CLI | Gemini CLI |
|---------|-------------|-----------|------------|
| Skills | `.claude/skills/SKILL.md` | `.agents/skills/SKILL.md` | `.gemini/skills/SKILL.md` |
| Plugins | marketplace + `.claude-plugin/` | `AGENTS.md` tree-walk | `gemini-extension.json` |
| Config | `settings.json` per profile | `config.toml` with profiles | `settings.json` |
| Discovery | marketplace clone + cache | directory scan | `context.fileName` |

The skill format (SKILL.md with YAML frontmatter) is actually the same across all three  - thanks to the [Agent Skills](https://agentskills.io) open standard. But the discovery and installation mechanics are completely different.

If you've built 12 custom plugins with skills, agents, and hooks, switching your primary CLI means rebuilding your entire setup. That's vendor lock-in through installation friction, not through format incompatibility.

## What nex does

nex is a Rust CLI (~5000 LOC) that manages the installation layer. It doesn't change how skills work  - it handles where they live.

```
$ nex install signum
  Installing signum v4.8.0...
  [OK] Claude Code  ~/.claude/plugins/signum
  [OK] Codex        ~/.agents/skills/signum
  [OK] Gemini       ~/.agents/skills/signum
  Installed for 3 platforms.
```

One command, all three CLIs get the skill.

### Seeing everything at once

Before nex, I had no single view of what was installed where:

```
$ nex list
PLUGIN           VERSION    EMPORIUM   CC     CODEX  DEV
────────────────────────────────────────────────────────
signum           4.8.0      v4.8.0     ✓      ✓       -
herald           2.1.0      v2.1.0     ✓       -      dev→~/...
delve            0.8.1      v0.8.1     ✓       -      dev→~/...
arbiter          0.3.0      v0.3.0     ✓       -      dev→~/...
...
```

32 plugins visible across all platforms. Previously nex could only see 1.

### Drift detection

Version drift between platforms is silent and dangerous. `nex check` catches it:

```
$ nex check
PLUGIN           EMPORIUM     CC CACHE     CODEX      STATUS
──────────────────────────────────────────────────────────────
herald           v2.1.0       v2.0.0        -          UPDATE ↑
signum           v4.8.0       v4.8.0       linked     OK
delve            v0.8.1       v0.8.1        -          OK (dev override)
```

### Profiles as desired state

The killer feature: TOML profiles that declare which skills should be active per CLI.

```toml
# ~/.nex/profiles/work.toml
[plugins]
enable = ["signum", "herald", "delve", "arbiter", "content-ops",
          "anvil", "forge", "genesis", "glyph", "reporter", "sentinel"]

[dev]
herald = "~/personal/skill7/devtools/herald"
delve = "~/personal/skill7/devtools/delve"

[platforms]
claude-code = true
codex = true
gemini = true
```

```
$ nex profile apply work
  [OK] signum  - Codex/Gemini symlink exists
  [NEW] herald  - symlink created
  [NEW] delve  - symlink created
  ...
  Profile 'work' applied and set as active.
```

Switching from Claude Code to Codex as primary? `nex profile apply work` ensures all your skills are there.

## Architecture: layered source of truth

The hardest design decision was ownership. Who owns the plugin state?

Each platform already tracks its own installations internally. Claude Code has `installed_plugins.json`. Codex discovers skills by scanning directories. Gemini reads extension configs. If nex tried to be the single source of truth for everything, it would constantly fight with the platforms' own state management.

Instead, nex uses a layered model:

```
┌─────────────────────────────────┐
│            nex CLI              │
│  Catalog │ Profiles │ Adapters  │
└────┬─────┴────┬─────┴──┬──┬──┬─┘
     │          │        │  │  │
     ▼          ▼        ▼  ▼  ▼
  emporium   ~/.nex/    CC Cdx Gem
  (catalog)  profiles  (ro)(rw)(rw)
```

- **Layer 1: Catalog**  - nex owns the emporium marketplace (our plugin registry). It's the source of truth for what versions exist.
- **Layer 2: Platform runtime**  - each CLI owns its own state. nex reads Claude Code state (read-only, never writes to CC files), and manages Codex/Gemini symlinks directly.
- **Layer 3: Profiles**  - nex owns the desired state. Profiles declare intent; `nex profile apply` reconciles reality.

This design came from an arbiter panel where I asked Codex and Gemini for their recommendation. Both proposed "layered SSoT" independently. The key insight from Codex: "Don't pick one global source of truth. Pick a source of truth per layer."

## Release automation

When I release a new version of a plugin, I don't want to manually update versions, changelogs, tags, and marketplace refs. `nex release` handles the full pipeline:

```
$ nex release patch --execute
  [OK] BUMP        .claude-plugin/plugin.json
  [OK] CHANGELOG   inserted [2.1.0] section
  [OK] DOCS        README.md version updated
  [OK] COMMIT      "release: v2.1.0"
  [OK] TAG         v2.1.0
  [OK] PUSH        origin/main
  [OK] PROPAGATE   emporium marketplace ref → v2.1.0
```

Nine stages, dry-run by default. The `DOCS` stage (new in v0.9.0) auto-generates changelog entries from `git log` and syncs SKILL.md descriptions with plugin.json.

## Health monitoring

`nex doctor` runs 11 checks across all platforms:

```
$ nex doctor
  [OK]   signum
  [WARN] herald  emporium_drift: emporium=v2.1.0 but CC cache=v2.0.0
  [WARN] signum  duplicate: found in 3 locations: dev symlink, emporium cache, nex-devtools
```

It catches duplicates, stale symlinks, orphan caches, version drift, and deprecated marketplace artifacts.

## What I learned

**Read-only integration is the right default.** My first instinct was to have nex write directly to Claude Code's `installed_plugins.json`. An arbiter panel (Codex + Gemini) convinced me otherwise: writing to another tool's internal state creates race conditions and breaks on format changes. Read-only + filesystem discovery is more resilient.

**Profiles are more useful than auto-sync.** I initially wanted nex to automatically keep all platforms in sync. But different contexts need different skill sets. My `work` profile has 11 plugins; `personal` has 2. Explicit profiles are better than implicit mirroring.

**The skill format war is already over.** SKILL.md with YAML frontmatter works in Claude Code, Codex, Gemini, and 20+ other tools. The installation layer is the real fragmentation  - and that's what nex fixes.

## Try it

nex is open source (MIT), written in Rust, and works on macOS and Linux.

```bash
# Install
cargo install --git https://github.com/heurema/nex

# Or download binary
curl -L https://github.com/heurema/nex/releases/latest/download/nex-$(uname -m)-apple-darwin -o nex
chmod +x nex && mv nex ~/.local/bin/

# Get started
nex list              # see all plugins across platforms
nex check             # detect version drift
nex doctor            # health check
nex status            # cross-platform overview
```

GitHub: [heurema/nex](https://github.com/heurema/nex)
