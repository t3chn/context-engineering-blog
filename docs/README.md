# Context Engineering Blog — Documentation

> Human-readable documentation for the project.
> For AI-persistent memory, see `.claude/memory/`.

## Quick Links

| Topic | Link |
|-------|------|
| Project overview | [CLAUDE.md](../CLAUDE.md) |
| Content generation | [.claude/skills/ceb-content/](../.claude/skills/ceb-content/SKILL.md) |
| Video shorts | [features/video-shorts.md](features/video-shorts.md) |
| Architecture decisions | [architecture/decisions/](architecture/decisions/) |

## Documentation Structure

```
docs/
├── README.md                 ← YOU ARE HERE
├── features/                 ← Feature documentation
│   └── video-shorts.md       ← Video generation feature
└── architecture/
    └── decisions/            ← Architecture Decision Records (ADRs)
        ├── template.md       ← ADR template
        └── 0001-*.md         ← Individual decisions
```

## Features

### Content Generation
Automated content pipeline from notes to published posts.
- **Telegram posts**: Short-form RU content for @ctxtdev
- **Blog articles**: Long-form RU/EN articles for ctxt.dev
- **Skill**: `.claude/skills/ceb-content/`

### Video Shorts (In Development)
Automated video creation from Telegram posts.
- **Format**: YouTube Shorts, TikTok, Reels
- **Style**: Kinetic typography, branded design
- **Voice**: ElevenLabs voice clone
- **Docs**: [features/video-shorts.md](features/video-shorts.md)

## Architecture Decisions

We use Architecture Decision Records (ADRs) to document significant decisions.

| ADR | Decision |
|-----|----------|
| [0001](architecture/decisions/0001-video-kinetic-typography.md) | Video format: kinetic typography |

## Contributing

1. **New feature**: Create `docs/features/{feature-name}.md`
2. **Architecture decision**: Create ADR in `docs/architecture/decisions/`
3. **AI memory**: Update `.claude/memory/` for session persistence

## Style Guide

- Use present tense ("Add feature" not "Added feature")
- Include code examples where helpful
- Link to related documents
- Keep documentation up-to-date with code changes
