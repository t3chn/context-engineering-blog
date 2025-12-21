import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Audio,
  staticFile,
  Easing,
} from "remotion";
import { loadFont } from "@remotion/google-fonts/BebasNeue";
import { z } from "zod";

// Load premium font
const { fontFamily: bebasNeue } = loadFont();

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

// Single word display - the core of kinetic typography
const SingleWord: React.FC<{
  word: string;
  isKeyPhrase: boolean;
  emphasisLevel: 1 | 2 | 3;
  wordFrame: number;
  durationFrames: number;
  fps: number;
}> = ({ word, isKeyPhrase, emphasisLevel, wordFrame, durationFrames, fps }) => {
  // Entry animation - fast scale pop
  const entryProgress = spring({
    frame: wordFrame,
    fps,
    config: {
      damping: 15,
      stiffness: 200,
      mass: 0.5,
    },
  });

  // Exit animation - quick fade out (handle short words)
  const minDuration = Math.max(1, durationFrames);
  const exitStart = Math.max(0, minDuration - 5);
  const exitProgress = exitStart >= minDuration ? 1 : interpolate(
    wordFrame,
    [exitStart, minDuration],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  // Scale animation
  const scale = interpolate(entryProgress, [0, 1], [0.3, 1]) * exitProgress;

  // Opacity
  const opacity = interpolate(entryProgress, [0, 0.5, 1], [0, 0.8, 1]) * exitProgress;

  // Subtle y movement
  const translateY = interpolate(entryProgress, [0, 1], [30, 0]);

  // Color based on emphasis
  const colors = {
    3: "#FFD700", // Gold - primary keywords
    2: "#00D4AA", // Teal - secondary
    1: "#FFFFFF", // White - regular
  };

  const color = isKeyPhrase ? colors[emphasisLevel] : "#FFFFFF";

  // Glow for key phrases
  const glowIntensity = isKeyPhrase ? 0.6 : 0;
  const glowColor = colors[emphasisLevel];

  // Calculate font size based on word length
  const baseFontSize = 140;
  const fontSize = word.length > 10 ? baseFontSize * 0.7 :
                   word.length > 7 ? baseFontSize * 0.85 :
                   baseFontSize;

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transform: `scale(${scale}) translateY(${translateY}px)`,
        opacity,
      }}
    >
      <span
        style={{
          fontFamily: bebasNeue,
          fontSize,
          fontWeight: 400,
          color,
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          textShadow: glowIntensity > 0
            ? `0 0 30px ${glowColor}${Math.round(glowIntensity * 255).toString(16).padStart(2, '0')},
               0 0 60px ${glowColor}${Math.round(glowIntensity * 0.5 * 255).toString(16).padStart(2, '0')},
               0 0 100px ${glowColor}${Math.round(glowIntensity * 0.3 * 255).toString(16).padStart(2, '0')}`
            : "none",
          textAlign: "center",
          maxWidth: "90%",
          lineHeight: 1.1,
        }}
      >
        {word}
      </span>
    </div>
  );
};

// Minimal animated background
const MinimalBackground: React.FC<{ frame: number }> = ({ frame }) => {
  // Subtle gradient rotation
  const gradientAngle = (frame * 0.3) % 360;

  // Subtle pulse
  const pulse = Math.sin(frame * 0.05) * 0.02 + 1;

  return (
    <>
      {/* Base gradient */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `
            radial-gradient(ellipse at 50% 30%,
              rgba(30, 30, 50, 1) 0%,
              rgba(10, 10, 20, 1) 50%,
              rgba(5, 5, 10, 1) 100%
            )
          `,
        }}
      />

      {/* Subtle corner accents */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "40%",
          height: "30%",
          background: `radial-gradient(ellipse at top left, rgba(255, 215, 0, 0.03) 0%, transparent 70%)`,
          transform: `scale(${pulse})`,
          transformOrigin: "top left",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: 0,
          right: 0,
          width: "40%",
          height: "30%",
          background: `radial-gradient(ellipse at bottom right, rgba(0, 212, 170, 0.03) 0%, transparent 70%)`,
          transform: `scale(${pulse})`,
          transformOrigin: "bottom right",
        }}
      />

      {/* Subtle noise texture overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0.02,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />
    </>
  );
};

// Opening flash hook
const OpeningFlash: React.FC<{ frame: number }> = ({ frame }) => {
  const flashOpacity = interpolate(frame, [0, 2, 8, 20], [0.8, 0.6, 0.2, 0], {
    extrapolateRight: "clamp",
  });

  if (frame > 20) return null;

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: "radial-gradient(circle at center, rgba(255, 255, 255, 0.9) 0%, transparent 50%)",
        opacity: flashOpacity,
        pointerEvents: "none",
      }}
    />
  );
};

// Progress bar at bottom
const ProgressBar: React.FC<{ progress: number }> = ({ progress }) => {
  return (
    <div
      style={{
        position: "absolute",
        bottom: 60,
        left: "10%",
        width: "80%",
        height: 3,
        backgroundColor: "rgba(255, 255, 255, 0.1)",
        borderRadius: 2,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          width: `${progress * 100}%`,
          height: "100%",
          background: "linear-gradient(90deg, #FFD700, #00D4AA)",
          borderRadius: 2,
          transition: "width 0.1s ease-out",
        }}
      />
    </div>
  );
};

export const KineticTypography: React.FC<KineticTypographyProps> = ({
  words,
  keyPhrases,
  theme,
  audioSrc,
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const currentTime = frame / fps;

  // Find current word based on time
  const getCurrentWordIndex = () => {
    for (let i = words.length - 1; i >= 0; i--) {
      if (currentTime >= words[i].startTime) {
        return i;
      }
    }
    return -1;
  };

  const currentWordIndex = getCurrentWordIndex();
  const currentWord = currentWordIndex >= 0 ? words[currentWordIndex] : null;

  // Calculate frame within current word
  const wordFrame = currentWord
    ? Math.max(0, frame - Math.floor(currentWord.startTime * fps))
    : 0;

  // Duration of current word in frames
  const wordDurationFrames = currentWord
    ? Math.floor((currentWord.endTime - currentWord.startTime) * fps)
    : 30;

  // Check if word is a key phrase
  const getEmphasisLevel = (word: string): { isKey: boolean; level: 1 | 2 | 3 } => {
    const wordLower = word.toLowerCase();
    for (let i = 0; i < keyPhrases.length; i++) {
      const phrase = keyPhrases[i].toLowerCase();
      if (phrase.includes(wordLower) || wordLower.includes(phrase.split(" ")[0])) {
        const level = i === 0 ? 3 : 2;
        return { isKey: true, level: level as 1 | 2 | 3 };
      }
    }
    return { isKey: false, level: 1 };
  };

  // Progress through video
  const progress = frame / durationInFrames;

  return (
    <AbsoluteFill>
      {/* Background */}
      <MinimalBackground frame={frame} />

      {/* Opening flash */}
      <OpeningFlash frame={frame} />

      {/* Audio track */}
      {audioSrc && (
        <Audio src={audioSrc.startsWith("http") ? audioSrc : staticFile(audioSrc)} />
      )}

      {/* Current word display */}
      {currentWord && (
        <SingleWord
          key={`${currentWord.word}-${currentWordIndex}`}
          word={currentWord.word}
          {...getEmphasisLevel(currentWord.word)}
          wordFrame={wordFrame}
          durationFrames={wordDurationFrames}
          fps={fps}
        />
      )}

      {/* Progress bar */}
      <ProgressBar progress={progress} />

      {/* Vignette */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `
            radial-gradient(ellipse at center, transparent 50%, rgba(0, 0, 0, 0.4) 100%)
          `,
          pointerEvents: "none",
        }}
      />
    </AbsoluteFill>
  );
};
