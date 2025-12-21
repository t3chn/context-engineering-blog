import { interpolate } from "remotion";

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
  entryProgress: number;
  scale: number;
  theme: VideoTheme;
}

export const AnimatedWord: React.FC<AnimatedWordProps> = ({
  word,
  isKeyPhrase,
  entryProgress,
  scale,
  theme,
}) => {
  // Calculate styles based on progress
  const opacity = interpolate(entryProgress, [0, 1], [0, 1]);
  const translateY = interpolate(entryProgress, [0, 1], [30, 0]);

  const color = isKeyPhrase ? theme.accentColor : theme.textColor;
  const fontWeight = isKeyPhrase ? theme.emphasisFontWeight : theme.fontWeight;
  const fontSize = isKeyPhrase ? 72 : 56;

  return (
    <span
      style={{
        display: "inline-block",
        fontFamily: theme.fontFamily,
        fontSize,
        fontWeight,
        color,
        opacity,
        transform: `translateY(${translateY}px) scale(${scale})`,
        textShadow: isKeyPhrase
          ? `0 0 40px ${theme.accentColor}40, 0 4px 20px rgba(0,0,0,0.5)`
          : "0 2px 10px rgba(0,0,0,0.3)",
        letterSpacing: isKeyPhrase ? "0.02em" : "0",
        transition: "color 0.3s ease",
      }}
    >
      {word}
    </span>
  );
};
