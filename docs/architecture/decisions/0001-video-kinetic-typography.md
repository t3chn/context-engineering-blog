# ADR-0001: Video Format — Kinetic Typography

> Status: Accepted
> Date: 2025-12-20

## Context

The Context Engineering Blog needs to create short-form video content (YouTube Shorts, TikTok, Reels) from existing Telegram posts. We need to choose a video format that:

1. Maintains quality (no generic "AI slop")
2. Can be automated
3. Works for technical content
4. Scales well
5. Has distinctive branding

## Decision

We will use **kinetic typography** as the primary video format:

- Text appears on screen synchronized with voice
- Key phrases are emphasized with animation
- No stock footage or generic visuals
- Branded design (dark theme, consistent typography)

### Technical Implementation

- **Composition**: Remotion (React-based video rendering)
- **Voice**: ElevenLabs voice clone with word-level timestamps
- **Animation**: Per-word/phrase animations synced to audio

## Consequences

### Positive

- **Distinctive look**: Not the generic AI video style
- **Content-focused**: Text is the star, not distracting visuals
- **Highly automated**: Same pipeline for all posts
- **Scalable**: Easy to generate many videos
- **Branded**: Consistent visual identity
- **Technical credibility**: Matches our developer audience

### Negative

- **Learning curve**: Remotion requires React knowledge
- **Rendering time**: Video rendering is CPU-intensive
- **Limited variety**: Same format for all videos
- **No face**: Less personal connection than talking-head videos

### Neutral

- Requires ElevenLabs subscription ($22/mo)
- Need to design animation library
- May need to iterate on timing/pacing

## Alternatives Considered

| Alternative | Pros | Cons | Why Rejected |
|-------------|------|------|--------------|
| Stock footage | Easy to implement | Generic, overused | "AI slop" aesthetic |
| AI-generated visuals | Novel, attention-grabbing | Unpredictable quality | Not reliable for brand |
| Screen recordings | Authentic, technical | Time-consuming | Doesn't scale |
| Talking head | Personal connection | Requires filming | User prefers automated |
| FFmpeg templates | Simple, fast | Limited animations | Not flexible enough |

## Related

- Feature: [docs/features/video-shorts.md](../../features/video-shorts.md)
- Decision: [.claude/memory/decisions/video-shorts-pipeline.md](../../../.claude/memory/decisions/video-shorts-pipeline.md)
- Skill: `.claude/skills/ceb-video/` (planned)
