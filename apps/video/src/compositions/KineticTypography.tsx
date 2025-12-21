import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, Easing } from "remotion";
import { z } from "zod";
import { AnimatedWord } from "../components/AnimatedWord";

// Zod schema for type validation
const wordTimestampSchema = z.object({
  word: z.string(),
  startTime: z.number(),
  endTime: z.number(),
  charIndex: z.number(),
});

const videoThemeSchema = z.object({
  backgroundColor: z.string(),
  textColor: z.string(),
  accentColor: z.string(),
  fontFamily: z.string(),
  fontWeight: z.number(),
  emphasisFontWeight: z.number(),
});

export const kineticTypographySchema = z.object({
  words: z.array(wordTimestampSchema),
  keyPhrases: z.array(z.string()),
  theme: videoThemeSchema,
  audioSrc: z.string().optional(),
});

export type KineticTypographyProps = z.infer<typeof kineticTypographySchema>;

export const KineticTypography: React.FC<KineticTypographyProps> = ({
  words,
  keyPhrases,
  theme,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const currentTime = frame / fps;

  // Find which words are currently visible
  const visibleWords = words.filter((word) => currentTime >= word.startTime - 0.3);

  // Check if a word is part of a key phrase
  const isKeyPhrase = (word: string): boolean => {
    return keyPhrases.some((phrase) =>
      phrase.toLowerCase().includes(word.toLowerCase())
    );
  };

  // Background animation
  const bgOpacity = interpolate(frame, [0, 30], [0, 1], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: theme.backgroundColor,
        opacity: bgOpacity,
      }}
    >
      {/* Gradient overlay */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `radial-gradient(ellipse at center, transparent 0%, ${theme.backgroundColor} 70%)`,
        }}
      />

      {/* Words container */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: 60,
        }}
      >
        {/* Flowing text layout */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
            alignItems: "center",
            gap: "16px 24px",
            maxWidth: 900,
          }}
        >
          {visibleWords.map((word, index) => {
            const wordStartFrame = word.startTime * fps;
            const isKey = isKeyPhrase(word.word);

            // Entry animation
            const entryProgress = interpolate(
              frame,
              [wordStartFrame - 10, wordStartFrame + 5],
              [0, 1],
              {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
                easing: Easing.out(Easing.cubic),
              }
            );

            // Scale for emphasis
            const scale = isKey
              ? interpolate(
                  frame,
                  [wordStartFrame, wordStartFrame + 10, wordStartFrame + 20],
                  [1, 1.15, 1.05],
                  { extrapolateRight: "clamp" }
                )
              : 1;

            return (
              <AnimatedWord
                key={`${word.word}-${index}`}
                word={word.word}
                isKeyPhrase={isKey}
                entryProgress={entryProgress}
                scale={scale}
                theme={theme}
              />
            );
          })}
        </div>
      </div>

      {/* Bottom gradient */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: 200,
          background: `linear-gradient(to top, ${theme.backgroundColor}, transparent)`,
        }}
      />
    </AbsoluteFill>
  );
};
