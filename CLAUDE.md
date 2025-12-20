# Context Engineering Blog

> Created: 2025-12-20

## AI Memory System

> **CRITICAL**: Read `.claude/memory/INDEX.md` at every session start.

The project uses an AI-persistent memory system for decisions and context:

```
.claude/memory/
├── INDEX.md              # Read first! Memory index
├── decisions/            # Design decisions (permanent)
│   └── video-shorts-pipeline.md
└── context/              # Config state (changeable)
    └── elevenlabs-setup.md (after setup)
```

**After significant work**: Update relevant memory files to persist decisions.

## Beads Workflow

On session start:
1. Read `.claude/memory/INDEX.md`
2. `bd list --status in_progress` — show current task
3. `bd ready` — if no in_progress, pick from ready
4. Track progress via TodoWrite
5. On completion — `bd close <id>` with reason

## Project Overview

Automated system for running a blog and Telegram channel about context engineering.

**Main workflow:**
```
Links + notes → CLI (interactive) → AI processing →
  → Telegram post (RU, short)
  → Blog article (RU + EN, full)
  → Auto-commit & push
  → [--publish] Publish to Telegram
```

## Project Structure

```
context-engineering-blog/
├── .beads/                      # Task tracking
├── CLAUDE.md                    # AI context (this file)
├── apps/
│   ├── blog/                    # Astro site
│   │   ├── src/content/posts/   # Posts (ru/, en/)
│   │   └── astro.config.mjs
│   └── cli/                     # CLI tool
│       ├── src/
│       │   ├── prompts/         # System prompts
│       │   ├── providers/       # AI providers (claude, openai, gemini)
│       │   ├── generators/      # Content generators
│       │   └── publishers/      # TG publishing
│       └── package.json
├── packages/shared/             # Shared types
├── .env.example
└── pnpm-workspace.yaml
```

## Tech Stack

- **Blog**: Astro 4 + Tailwind CSS + MDX
- **CLI**: TypeScript + Node.js + Commander + Inquirer
- **AI**: Claude / OpenAI / Gemini (configurable)
- **Telegram**: grammy
- **Monorepo**: pnpm workspaces

## Content Philosophy: Context-First Thinking

**Format**: Problem → Context → Solution → Insight

Every post answers 4 questions:
1. **Problem** — what's not working?
2. **Context** — why is it important/hard?
3. **Solution** — how to approach it?
4. **Insight** — what changed in understanding?

**Skill**: `.claude/skills/ceb-content/SKILL.md`

### Telegram Posts (@ctxtdev)
- 3-7 short paragraphs, 1-3 lines each
- Plain text + minimal emoji (max 1-2)
- Hashtags at the end (#contextengineering #llm)
- NO author signature
- NO bullet lists
- NO motivational tone

### Blog Articles
- Structured articles: Problem → Context → Solution → Insight
- RU primary → EN translation
- 500-1500 words
- Code examples where appropriate
- Source links at the end

### Video Shorts (In Development)

Automated video generation from Telegram posts.

**Pipeline**: Text → Script (Claude) → Voice (ElevenLabs) → Video (Remotion) → MP4

**Key decisions**:
- Format: Kinetic typography (no stock footage)
- Voice: ElevenLabs voice clone (user's voice)
- Quality: Premium from day 1

**Documentation**:
- Feature: `docs/features/video-shorts.md`
- Decision: `.claude/memory/decisions/video-shorts-pipeline.md`
- ADR: `docs/architecture/decisions/0001-video-kinetic-typography.md`
- Skill: `.claude/skills/ceb-video/` (planned)

**CLI** (planned):
```bash
pnpm cli video -i "post text" -l ru -f shorts
```

## Key Files

| File | Purpose |
|------|---------|
| `.claude/memory/INDEX.md` | AI memory index (read first!) |
| `.claude/memory/decisions/` | Design decisions |
| `.claude/skills/ceb-content/SKILL.md` | Content generation skill |
| `.claude/skills/ceb-content/references/` | Style and platform guides |
| `docs/` | Human-readable documentation |
| `apps/cli/src/prompts/telegram.ts` | TG post generation prompt |
| `apps/cli/src/prompts/blog.ts` | Article generation prompt |
| `apps/cli/src/providers/` | AI providers |
| `apps/blog/src/content/posts/` | Markdown posts |
| `.env` | API keys (DO NOT commit!) |

## Deployment

### URLs
- **Production**: https://ctxt.dev
- **Cloudflare**: https://ctxt-dev-35d.pages.dev
- **GitHub**: https://github.com/t3chn/context-engineering-blog

### Auto-deploy
Every push to `main` automatically deploys to Cloudflare Pages via GitHub Actions.

```bash
# Manual deploy (if needed)
pnpm --filter @ceb/blog build
wrangler pages deploy apps/blog/dist --project-name=ctxt-dev
```

### GitHub Secrets (Settings → Secrets → Actions)
| Secret | Description |
|--------|-------------|
| `CLOUDFLARE_API_TOKEN` | API token with Pages permissions |
| `CLOUDFLARE_ACCOUNT_ID` | `6745078205fd18255ccc6dd791de78cb` |

### Cloudflare Pages
- **Project**: `ctxt-dev`
- **Account**: inskricion@gmail.com
- **Dashboard**: https://dash.cloudflare.com → Pages → ctxt-dev

### Adding a New Domain
1. Cloudflare API or Dashboard → Pages → ctxt-dev → Custom domains
2. Add DNS record:
   ```
   Type: CNAME
   Name: @ (or subdomain)
   Target: ctxt-dev-35d.pages.dev
   Proxy: On
   ```

### Creating Cloudflare API Token
1. https://dash.cloudflare.com/profile/api-tokens
2. Create Token → "Edit Cloudflare Workers" template
3. Permissions: Account/Cloudflare Pages/Edit
4. Add to GitHub: `gh secret set CLOUDFLARE_API_TOKEN`

## Security

### Secret Leak Protection
- **Pre-commit hook**: `.husky/pre-commit` — blocks commits with API keys
- **CI**: `gitleaks-action` scans on every push
- **gitignore**: `.env`, `.env.local` excluded

### Secret Patterns (blocked)
- `sk-ant-*` (Anthropic)
- `sk-*` (OpenAI)
- `AIza*` (Google)
- Telegram bot tokens
- AWS/GitHub tokens

### If a Secret Leaks
1. Immediately rotate the key in the respective service
2. Check git history: `git log -p --all -S 'SECRET_PATTERN'`
3. If in history — use `git filter-branch` or BFG Repo-Cleaner

## Conventions

- Code language: TypeScript (strict mode)
- Style: ESLint + Prettier
- Commits: Conventional Commits (`feat:`, `fix:`, `post:`)
- Branches: main (production), feature/* (development)

## Skills Reference

| Task | Skill |
|------|-------|
| **Content generation** | `.claude/skills/ceb-content` |
| **Video shorts** | `.claude/skills/ceb-video` (planned) |
| Frontend/Astro | `vibe-coder:frontend-design` |
| CLI development | `vibe-coder:cli-tool` |
| Telegram bot | `vibe-coder:telegram-bot` |
| Code review | `vibe-coder:code-review` |
| Testing | `vibe-coder:testing-core` |
