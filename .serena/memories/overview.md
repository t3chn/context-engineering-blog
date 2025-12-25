# Project Overview

> Last updated: 2025-12-25

## Purpose

Automated system for running a blog and Telegram channel (@ctxtdev) about context engineering for AI/LLM applications.

## Architecture

```
context-engineering-blog/
├── apps/
│   ├── blog/          # Astro 4 static site (ctxt.dev)
│   ├── cli/           # Content generation CLI
│   └── video/         # Remotion video generation
├── packages/
│   └── shared/        # Shared TypeScript types
└── .claude/
    ├── memory/        # AI decision memory
    └── skills/        # Claude Code skills
```

## Key Flows

### Content Pipeline

```
Input (links/notes) → CLI → AI Processing →
  → Telegram post (RU, short format)
  → Blog article (RU + EN, full)
  → Auto-commit & deploy
```

### Video Pipeline (In Development)

```
Text → Script (Claude) → Voice (ElevenLabs) → Video (Remotion) → MP4
```

## Tech Stack

- **Runtime**: Bun 1.1.45+
- **Blog**: Astro 4 + Tailwind + MDX
- **CLI**: TypeScript + Commander + Inquirer
- **AI**: Claude / OpenAI / Gemini (switchable)
- **Video**: Remotion (kinetic typography)
- **Voice**: ElevenLabs (voice clone)
- **Deploy**: Cloudflare Pages (auto via GitHub Actions)

## Important Patterns

### Content Philosophy

Every post follows: Problem → Context → Solution → Insight

### Telegram Style

- 3-7 short paragraphs
- Plain text, minimal emoji
- NO bullet lists, NO signatures

## Entry Points

| Task             | Start Here                     |
| ---------------- | ------------------------------ |
| Generate content | `apps/cli/src/commands/`       |
| Edit blog        | `apps/blog/src/content/posts/` |
| Video generation | `apps/video/src/`              |
| AI prompts       | `apps/cli/src/prompts/`        |
