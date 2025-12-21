# Feature: Video Shorts

> Status: In Development
> Created: 2025-12-20

## Overview

Automated video generation from Telegram posts for YouTube Shorts, TikTok, and Instagram Reels.

## Goals

1. **Repurpose content** — turn existing posts into videos
2. **Quality first** — professional output, not AI slop
3. **Automation** — minimal manual work per video
4. **Brand consistency** — distinctive visual style

## User Flow

```
1. User has a Telegram post
2. Run: pnpm cli video -i "post text"
3. System generates video
4. Output: MP4 ready for upload
```

## Technical Architecture

### Pipeline

```
Telegram Post
      │
      ▼
┌─────────────────┐
│ Script Generator│  Claude API
│                 │  Extracts key phrases
└─────────────────┘
      │
      ▼
┌─────────────────┐
│ Voice Synthesis │  ElevenLabs
│                 │  User's cloned voice
└─────────────────┘
      │
      ▼
┌─────────────────┐
│ Video Renderer  │  Remotion
│                 │  Kinetic typography
└─────────────────┘
      │
      ▼
   MP4 Output
```

### Components

| Component | Technology | Purpose |
|-----------|------------|---------|
| Runtime | Bun 1.1.45+ | Native TypeScript, fast startup |
| CLI | Commander.js | User interface |
| Script Generator | Claude API | Extract key phrases |
| Voice Synthesis | ElevenLabs | Text-to-speech with timestamps |
| Video Renderer | Remotion | React-based video composition |

### File Structure

```
packages/video-pipeline/
├── src/
│   ├── index.ts
│   ├── elevenlabs.ts
│   ├── script-generator.ts
│   └── types.ts

apps/video/
├── remotion.config.ts
└── src/
    ├── Root.tsx
    ├── compositions/
    │   └── KineticTypography.tsx
    └── components/
        ├── AnimatedWord.tsx
        └── Background.tsx
```

## Video Format

| Property | Value |
|----------|-------|
| Resolution | 1080 x 1920 (9:16) |
| Frame rate | 30 fps |
| Duration | 30-60 seconds |
| Format | MP4 (H.264) |

## Visual Style

### Kinetic Typography
- Words appear synchronized with voice
- Key phrases emphasized
- Smooth transitions
- Professional timing

### Brand Elements
- Dark theme background
- Accent color highlights
- Consistent typography
- No stock footage

## Voice

### ElevenLabs Voice Clone
- User's actual voice (cloned)
- Natural intonation
- Multilingual support (RU/EN)
- Word-level timestamps for sync

## CLI Usage

```bash
# Generate video from text
bun cli video -i "Prompt engineering — это маркетинг..."

# Specify language
bun cli video -i "text" -l ru

# Preview in Remotion Studio
bun cli video -i "text" --preview

# Output to specific path
bun cli video -i "text" -o ./output/video.mp4

# Remotion studio (development)
bunx remotionb studio apps/video
```

## Configuration

### Environment Variables

```env
ELEVENLABS_API_KEY=sk_...
ELEVENLABS_VOICE_ID=...
```

### Video Config

```typescript
interface VideoConfig {
  format: 'shorts' | 'square' | 'landscape';
  theme: 'dark' | 'light';
  accentColor: string;
  font: string;
}
```

## Quality Checklist

- [ ] Voice sounds natural (not robotic)
- [ ] Words are readable (not too fast)
- [ ] Animations are smooth
- [ ] Audio levels are professional
- [ ] Branding is consistent

## Related Documents

- Decision: [.claude/memory/decisions/video-shorts-pipeline.md](../../.claude/memory/decisions/video-shorts-pipeline.md)
- ADR: [../architecture/decisions/0001-video-kinetic-typography.md](../architecture/decisions/0001-video-kinetic-typography.md)
- ADR: [../architecture/decisions/0002-bun-runtime.md](../architecture/decisions/0002-bun-runtime.md)
- Skill: `.claude/skills/ceb-video/` (planned)
