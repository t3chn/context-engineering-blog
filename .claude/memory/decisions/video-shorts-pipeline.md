# Decision: Video Shorts Pipeline

> Created: 2025-12-20
> Status: Implemented

## Context

The Context Engineering Blog needs video content for YouTube Shorts, TikTok, and Instagram Reels. Current content is text-only (Telegram posts, blog articles). Video format reaches wider audience and repurposes existing content.

## Problem

How to automate video creation from Telegram posts while maintaining high quality?

## Constraints

1. **Quality first** — no generic "AI slop"
2. **Branded** — distinctive style, not generic
3. **Automated** — minimal manual work per video
4. **Bilingual** — RU primary, EN translation
5. **Scalable** — reuse existing content

## Decision

### Chosen Approach: Custom Pipeline with Premium Tools

| Component | Choice | Rationale |
|-----------|--------|-----------|
| **Runtime** | Bun (1.1.45+) | Native TypeScript, faster startup, simpler toolchain |
| **Voice** | ElevenLabs voice clone | User's voice, best quality, automated |
| **Video** | Remotion (React) | Full control, professional animations |
| **Format** | Kinetic typography | No stock footage, scales well |
| **Script** | Claude API | Extract key phrases from posts |

### Rejected Alternatives

| Alternative | Why Rejected |
|-------------|--------------|
| Edge TTS | Lower quality, robotic sound |
| FFmpeg templates | Less flexible, harder to brand |
| Stock footage | Generic look, overused |
| ShortGPT | Less control over quality |

## Pipeline Architecture

```
Input: Telegram Post (text)
           │
           ▼
┌─────────────────────────┐
│ 1. Script Generation    │  Claude extracts key phrases
│    (Claude API)         │  Generates timing markers
└─────────────────────────┘
           │
           ▼
┌─────────────────────────┐
│ 2. Voice Synthesis      │  ElevenLabs voice clone
│    (ElevenLabs)         │  Returns: audio.mp3 + timestamps
└─────────────────────────┘
           │
           ▼
┌─────────────────────────┐
│ 3. Video Composition    │  Remotion renders video
│    (Remotion)           │  Kinetic typography + brand styling
└─────────────────────────┘
           │
           ▼
Output: MP4 (1080x1920, 9:16)
```

## File Structure

```
packages/video-pipeline/    # Core logic
  src/
    index.ts
    elevenlabs.ts           # TTS client
    script-generator.ts     # AI script generation
    types.ts

apps/video/                 # Remotion project
  src/
    Root.tsx
    compositions/
      KineticTypography.tsx
    components/
      AnimatedWord.tsx
      Background.tsx

apps/cli/src/commands/
  video.ts                  # CLI command

.claude/skills/ceb-video/   # AI skill
  SKILL.md
  references/
```

## Quality Standards

### Voice
- Natural intonation
- Clear pronunciation
- No robotic artifacts
- Consistent volume

### Video
- Smooth animations (60fps preferred, 30fps minimum)
- Readable text timing (not too fast)
- Professional transitions
- Branded color scheme (dark theme)

### Content
- Key phrases highlighted
- Logical flow
- Appropriate pacing
- No filler content

## Costs

| Service | Cost | Justification |
|---------|------|---------------|
| ElevenLabs Creator | $22/mo | Premium voice quality |
| Remotion | Free | Open source |
| Claude API | Usage-based | Already in use for content |

## Success Metrics

- [x] Generate MP4 from text input
- [x] Voice sounds natural (user's voice)
- [x] Animations are smooth and professional
- [x] End-to-end time < 5 minutes per video
- [x] Output ready for direct upload

## Implementation Timeline

1. **Phase 0** (Day 1): Documentation ← Current
2. **Phase 1** (Day 1): ElevenLabs voice clone setup
3. **Phase 2** (Day 2): Package structure
4. **Phase 3** (Day 2-3): Remotion composition
5. **Phase 4** (Day 3): CLI integration
6. **Phase 5** (Day 4): Skill & polish

## Related Documents

- ADR: [0001-video-kinetic-typography](../../../docs/architecture/decisions/0001-video-kinetic-typography.md)
- ADR: [0002-bun-runtime](../../../docs/architecture/decisions/0002-bun-runtime.md)
- Feature: [video-shorts](../../../docs/features/video-shorts.md)
- Context: [elevenlabs-setup](../context/elevenlabs-setup.md) (after setup)
