---
name: ceb-video
description: Generate kinetic typography video shorts from text
tools: [Bash, Read, Write, Edit]
---

# Video Shorts Generation

Generate professional kinetic typography videos from text input using ElevenLabs voice synthesis and Remotion rendering.

## Quick Start

```bash
# Generate preview (audio + props)
pnpm cli video -i "Your text here" -l ru --preview

# Full render with audio
cd apps/video
pnpm render KineticTypography out/video.mp4 --props="public/generated/render-props.json"
```

## Pipeline

1. **Script Generation** — Claude extracts key phrases
2. **Voice Synthesis** — ElevenLabs TTS with timestamps
3. **Video Render** — Remotion kinetic typography

## Options

| Flag | Description | Default |
|------|-------------|---------|
| `-i, --input` | Input text | (required) |
| `-l, --lang` | Language (ru, en) | ru |
| `-f, --format` | Format (shorts, square, landscape) | shorts |
| `--preview` | Preview mode (no render) | false |
| `--audio-only` | Generate audio only | false |

## Output Formats

| Format | Resolution | Aspect |
|--------|------------|--------|
| shorts | 1080x1920 | 9:16 |
| square | 1080x1080 | 1:1 |
| landscape | 1920x1080 | 16:9 |

## Configuration

Required environment variables:
```env
ELEVENLABS_API_KEY=sk_...
ELEVENLABS_VOICE_ID=HWXiZb49yQCdHTLArDVC
```

## File Locations

| File | Purpose |
|------|---------|
| `apps/video/public/generated/preview-audio.mp3` | Generated audio |
| `apps/video/public/generated/render-props.json` | Remotion props |
| `apps/video/out/video.mp4` | Rendered video |

## Workflow

### 1. Generate from Telegram post
```bash
pnpm cli video -i "Context Engineering — это новый подход..." -l ru --preview
```

### 2. Preview in Remotion Studio
```bash
cd apps/video && pnpm studio
```

### 3. Render final video
```bash
pnpm render KineticTypography out/video.mp4 --props="public/generated/render-props.json"
```

### 4. Upload to platforms
Output is ready for YouTube Shorts, TikTok, Instagram Reels.

## Troubleshooting

### No audio in video
Ensure `audioSrc` in props points to valid path:
- For studio: `http://localhost:3000/generated/preview-audio.mp3`
- For render: `generated/preview-audio.mp3`

### Voice synthesis fails
Check ElevenLabs API key and voice ID in `.env`

### Slow render
Use `--concurrency` flag or reduce frame count
