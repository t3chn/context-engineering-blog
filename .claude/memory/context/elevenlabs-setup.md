# ElevenLabs Setup

> Created: 2025-12-21
> Status: Configured

## Configuration

```env
ELEVENLABS_API_KEY=sk_...  # Set in .env
ELEVENLABS_VOICE_ID=HWXiZb49yQCdHTLArDVC
```

## Voice Details

- **Voice ID**: `HWXiZb49yQCdHTLArDVC`
- **Model**: `eleven_multilingual_v2`
- **Languages**: RU, EN (multilingual)
- **Plan**: Creator ($22/mo)

## Usage

```bash
# Generate audio only
pnpm cli video -i "text" -l ru --audio-only

# Generate with preview data
pnpm cli video -i "text" -l ru --preview

# Full pipeline (when Remotion render ready)
pnpm cli video -i "text" -l ru
```

## API Permissions Required

- Text-to-Speech (required)
- Voices Read (required)

## Tested

- [x] API key valid
- [x] Voice ID valid
- [x] Text-to-speech with timestamps working
- [x] Multilingual v2 model working
- [x] Audio file generation working
