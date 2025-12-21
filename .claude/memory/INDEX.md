# AI Memory Index

> **Read this file at every session start**

## Active Decisions

- [Video Shorts Pipeline](decisions/video-shorts-pipeline.md) — kinetic typography, ElevenLabs, Remotion
- [Bun Runtime](decisions/adr-0002-bun-runtime.md) — native TypeScript execution

## Context (Current State)

- [ElevenLabs Setup](context/elevenlabs-setup.md) — voice clone config

## Quick Reference

| Key | Value |
|-----|-------|
| Voice ID | `HWXiZb49yQCdHTLArDVC` |
| Voice Model | `eleven_multilingual_v2` |
| Primary Language | RU |
| Video Format | 1080x1920 (shorts) |
| FPS | 30 |

## Video Pipeline

```bash
# Generate video from text
pnpm cli video -i "text" -l ru --preview

# Render with audio
cd apps/video
pnpm render KineticTypography out/video.mp4 --props="public/generated/render-props.json"
```

## Packages

| Package | Purpose |
|---------|---------|
| `@ceb/video-pipeline` | ElevenLabs TTS, script generation |
| `@ceb/video` | Remotion compositions |
| `@ceb/cli` | CLI commands including `video` |
