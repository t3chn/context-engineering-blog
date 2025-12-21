import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

interface VideoTheme {
  backgroundColor: string;
  textColor: string;
  accentColor: string;
  fontFamily: string;
  fontWeight: number;
  emphasisFontWeight: number;
}

interface AnimatedWordProps {
  word: string;
  isKeyPhrase: boolean;
  emphasisLevel: 1 | 2 | 3;
  wordStartFrame: number;
  theme: VideoTheme;
}

// Hormozi-style color coding
const EMPHASIS_COLORS = {
  3: "#FFD700", // Gold/Yellow - main theme words
  2: "#00FF88", // Green - action/important
  1: "#FFFFFF", // White - regular
};

export const AnimatedWord: React.FC<AnimatedWordProps> = ({
  word,
  isKeyPhrase,
  emphasisLevel,
  wordStartFrame,
  theme,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Spring animation for natural movement
  const springConfig = {
    fps,
    damping: 12,
    stiffness: 100,
    mass: 0.5,
  };

  // Entry animation with spring
  const entrySpring = spring({
    frame: frame - wordStartFrame + 10,
    ...springConfig,
  });

  // Scale pulse for key phrases
  const scalePulse = isKeyPhrase
    ? spring({
        frame: frame - wordStartFrame,
        fps,
        damping: 8,
        stiffness: 150,
        mass: 0.3,
      })
    : 1;

  // Calculate styles
  const opacity = interpolate(entrySpring, [0, 1], [0, 1], {
    extrapolateRight: "clamp",
  });

  const translateY = interpolate(entrySpring, [0, 1], [50, 0], {
    extrapolateRight: "clamp",
  });

  const translateX = interpolate(entrySpring, [0, 1], [-20, 0], {
    extrapolateRight: "clamp",
  });

  // Slight rotation for dynamic feel
  const rotate = interpolate(entrySpring, [0, 0.5, 1], [-5, 2, 0], {
    extrapolateRight: "clamp",
  });

  // Scale with bounce effect
  const baseScale = interpolate(entrySpring, [0, 1], [0.5, 1], {
    extrapolateRight: "clamp",
  });
  const scale = isKeyPhrase ? baseScale * (0.9 + scalePulse * 0.25) : baseScale;

  // Color based on emphasis level
  const color = isKeyPhrase ? EMPHASIS_COLORS[emphasisLevel] : theme.textColor;
  const fontWeight = isKeyPhrase ? theme.emphasisFontWeight : theme.fontWeight;
  const fontSize = emphasisLevel === 3 ? 80 : emphasisLevel === 2 ? 68 : 56;

  // Glow effect intensity based on emphasis
  const glowIntensity = emphasisLevel === 3 ? 60 : emphasisLevel === 2 ? 40 : 0;
  const glowColor = EMPHASIS_COLORS[emphasisLevel];

  return (
    <span
      style={{
        display: "inline-block",
        fontFamily: "'Montserrat', sans-serif",
        fontSize,
        fontWeight,
        color,
        opacity,
        transform: `translateY(${translateY}px) translateX(${translateX}px) scale(${scale}) rotate(${rotate}deg)`,
        textShadow: isKeyPhrase
          ? `0 0 ${glowIntensity}px ${glowColor}80, 0 0 ${glowIntensity * 2}px ${glowColor}40, 0 4px 20px rgba(0,0,0,0.7)`
          : "0 2px 10px rgba(0,0,0,0.5)",
        letterSpacing: isKeyPhrase ? "0.03em" : "0.01em",
        textTransform: isKeyPhrase ? "uppercase" : "none",
        // Stroke effect for level 3
        WebkitTextStroke: emphasisLevel === 3 ? "1px rgba(0,0,0,0.3)" : "none",
      }}
    >
      {word}
    </span>
  );
};
