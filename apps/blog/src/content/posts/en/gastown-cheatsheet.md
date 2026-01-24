---
title: "Gas Town: Multi-Agent Orchestrator Cheatsheet"
description: "Reference guide for Gas Town — a system for parallel management of 20-30 Claude Code agents. Commands, concepts, workflows."
date: 2026-01-24
tags: ["context-engineering", "agents", "tooling", "claude-code"]
lang: en
---

Gas Town is an orchestrator by Steve Yegge for parallel management of dozens of Claude Code agents. Built on Git worktrees and Beads for state persistence across restarts.

## Terminology (Mad Max universe)

| Term           | What it is                                                    | Analogy      |
| -------------- | ------------------------------------------------------------- | ------------ |
| **Mayor** 🎩   | Main coordinator. Tell it what to build — it distributes work | PM/Tech Lead |
| **Polecat** 🦨 | Worker agent. Spawns, completes task, disappears              | Junior Dev   |
| **Rig** 🏗️     | Project container. Wraps git repo + manages agents            | Project      |
| **Crew** 👤    | Your personal workspace inside a Rig                          | Workspace    |
| **Convoy** 🚚  | Batch of tasks (beads) assigned to agents                     | Sprint/Batch |
| **Town** 🏘️    | Root directory (~gt/) containing all projects                 | Monorepo     |
| **Hook** 🪝    | Git worktree for persistent agent state storage               | State Store  |
| **Refinery**   | Merge operations coordinator                                  | CI/CD        |
| **Witness**    | Monitors issues, fixes problems                               | QA           |
| **Deacon**     | Maintenance operations                                        | DevOps       |

## Installation

```bash
# Prerequisites
brew install go@1.23 git sqlite3 tmux
# Beads (task tracking)
# follow instructions at https://github.com/steveyegge/beads

# Gas Town
brew tap steveyegge/gastown && brew install gt

# Initialize
gt install ~/gt --git
cd ~/gt

# Add project
gt rig add myproject https://github.com/you/repo.git

# Create workspace
gt crew add yourname --rig myproject

# Start Mayor
gt mayor attach
```

## Key Commands

### Workspace

```bash
gt install <path>           # Initialize Town
gt rig add <name> <repo>    # Add project
gt rig list                 # List projects
gt crew add <name> --rig <rig>  # Create Crew
```

### Agents

```bash
gt agents                   # Active agents
gt mayor attach             # Start Mayor session
gt mayor start --agent auggie  # Mayor with specific runtime
gt prime                    # Context recovery (inside session)
gt sling <bead-id> <rig>    # Assign task to agent
gt sling <id> <rig> --agent cursor  # With specific runtime
```

### Convoy (task batches)

```bash
gt convoy create <name> [issues]  # Create convoy
gt convoy list                    # List convoys
gt convoy show [id]               # Convoy details
gt convoy add <convoy-id> <issue-id...>  # Add issues
```

### Configuration

```bash
gt config show                    # Current settings
gt config agent set <name> "<cmd>"  # Add agent
gt config default-agent <name>    # Default runtime
```

### Beads Integration

```bash
bd formula list         # List formulas
bd cook <formula>       # Execute formula
bd mol pour <formula>   # Create trackable instance
bd mol list             # Active instances
```

## Workflows

### Via Mayor (recommended)

```bash
gt mayor attach
# Describe to Mayor what you want to build
# It creates convoy, distributes work to Polecats
# Monitor via gt convoy list
```

Mayor abstracts complexity. You talk to one "expert", it manages the army.

### Manual mode

```bash
# Create convoy
gt convoy create feature-x issue-1 issue-2

# Assign work
gt sling issue-1 myproject
gt sling issue-2 myproject

# Monitor
gt convoy show
gt agents
```

## Supported Runtimes

Built-in: `claude`, `gemini`, `codex`, `cursor`, `auggie`, `amp`

Configure in `settings/config.json` of each rig.

For Codex, add to `~/.codex/config.toml`:

```toml
project_doc_fallback_filenames = ["CLAUDE.md"]
```

## Warnings

### Cost

Expect 10x token costs vs regular Claude Code session. 60 minutes ≈ $100.

### YOLO mode

Gas Town operates autonomously:

- Pushes branches to GitHub
- Creates PRs
- May merge PRs even with failing tests

### Safety

For production codebases, guard rails are needed. Keep force-push ready.

## Architectural Principles

### GUPP (Git Up, Pull, Push)

Deterministic handoffs via git, not LLM decisions about phase transitions.

### External State

Beads stores task tracking outside agent's context window. No pollution from role prompts.

### Git Isolation

Each agent = its own Git worktree. No shared-state corruption from crashes.

### Parallel Execution

Tasks run in parallel across 20-30 instances, not sequential phases.

## Known Issues

- Auto-merge broken tests into main
- Unpredictable code deletion ("murderous Deacon")
- Force pushes required for recovery
- High token burn rate

Gas Town is powerful but raw. Suitable for new projects with proper safeguards, not for established repositories.

## Sources

- [Gas Town GitHub](https://github.com/steveyegge/gastown)
- [Steve Yegge — Welcome to Gas Town](https://steve-yegge.medium.com/welcome-to-gas-town-4f25ee16dd04)
- [DoltHub — A Day in Gas Town](https://www.dolthub.com/blog/2026-01-15-a-day-in-gas-town/)
- [GasTown and the Two Kinds of Multi-Agent](https://paddo.dev/blog/gastown-two-kinds-of-multi-agent/)
