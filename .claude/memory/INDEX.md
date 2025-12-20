# AI Memory Index

> **CRITICAL**: Read this file at every session start.
> Last updated: 2025-12-20

## Quick Reference

| Key | Value |
|-----|-------|
| Primary language | RU |
| Secondary language | EN (translation) |
| Voice provider | ElevenLabs (voice clone) |
| Video composition | Remotion |
| Telegram channel | @ctxtdev |
| Blog URL | https://ctxt.dev |

## Active Features

### Content Generation
- Skill: `.claude/skills/ceb-content/`
- CLI: `pnpm cli` (interactive)
- Platforms: Telegram (RU), Blog (RU/EN)

### Video Shorts (In Development)
- Decision: [video-shorts-pipeline](decisions/video-shorts-pipeline.md)
- Context: [elevenlabs-setup](context/elevenlabs-setup.md) (after setup)
- Skill: `.claude/skills/ceb-video/` (planned)

## Session Checklist

Before starting work:
- [ ] Read this INDEX.md
- [ ] Check `bd ready` for pending tasks
- [ ] Review relevant decision files if modifying features

After completing work:
- [ ] Update relevant memory files if decisions changed
- [ ] Run `bd sync` to commit task changes
- [ ] Push to remote

## Documentation Map

```
.claude/
├── memory/
│   ├── INDEX.md          ← YOU ARE HERE
│   ├── decisions/        ← Design decisions (permanent)
│   └── context/          ← Config state (changeable)
├── skills/
│   ├── ceb-content/      ← Content generation
│   └── ceb-video/        ← Video shorts (planned)

docs/
├── README.md             ← Human documentation hub
├── features/             ← Feature documentation
└── architecture/         ← ADRs and system design
```

## Principles

1. **Document before building** — decisions in memory/, ADRs in docs/
2. **Quality first** — premium tools over cheap alternatives
3. **Context-First Thinking** — Problem → Context → Solution → Insight
4. **Persistence** — all decisions documented for future sessions
