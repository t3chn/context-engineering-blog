# Kinetic Typography Reference

## Animation Principles

### Word Timing
- Words appear 0.3s before their start time (anticipation)
- Entry animation: 15 frames (~0.5s)
- Scale emphasis: 10 frames up, 10 frames settle

### Key Phrase Treatment
- Scale: 1.0 → 1.15 → 1.05 (pop effect)
- Color: accent color (`#3b82f6`)
- Font weight: bold (700)

### Regular Words
- Scale: 1.0 (no change)
- Color: text color (`#ffffff`)
- Font weight: normal (400)

## Visual Style

### Theme
```typescript
{
  backgroundColor: "#0a0a0a",
  textColor: "#ffffff",
  accentColor: "#3b82f6",
  fontFamily: "Inter, system-ui, sans-serif",
  fontWeight: 400,
  emphasisFontWeight: 700,
}
```

### Layout
- Centered container
- Max width: 900px
- Padding: 60px
- Word gap: 16px vertical, 24px horizontal
- Flex wrap for natural text flow

### Effects
- Radial gradient overlay (center → edges)
- Bottom gradient fade
- Background opacity fade-in (30 frames)

## Code Examples

### AnimatedWord Component
```tsx
const AnimatedWord = ({ word, isKeyPhrase, entryProgress, scale, theme }) => (
  <div style={{
    opacity: entryProgress,
    transform: `scale(${scale}) translateY(${(1 - entryProgress) * 20}px)`,
    color: isKeyPhrase ? theme.accentColor : theme.textColor,
    fontWeight: isKeyPhrase ? theme.emphasisFontWeight : theme.fontWeight,
  }}>
    {word}
  </div>
);
```

### Entry Animation
```tsx
const entryProgress = interpolate(
  frame,
  [wordStartFrame - 10, wordStartFrame + 5],
  [0, 1],
  { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) }
);
```

### Scale Emphasis
```tsx
const scale = isKey
  ? interpolate(frame, [start, start + 10, start + 20], [1, 1.15, 1.05], { extrapolateRight: "clamp" })
  : 1;
```

## Best Practices

1. **Pacing** — Don't show words too fast; give 0.3s lead time
2. **Emphasis** — Limit to 3-5 key phrases per video
3. **Contrast** — Ensure text is readable on background
4. **Timing** — Sync with audio timestamps exactly
5. **Transitions** — Use easing functions for smooth motion
