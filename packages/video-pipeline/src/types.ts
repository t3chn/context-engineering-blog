/**
 * Video Pipeline Types
 * Types for the video shorts generation pipeline
 */

/** Supported languages for video content */
export type VideoLanguage = "ru" | "en";

/** Video format presets */
export type VideoFormat = "shorts" | "square" | "landscape";

/** Video format configurations */
export const VIDEO_FORMATS: Record<VideoFormat, { width: number; height: number }> = {
  shorts: { width: 1080, height: 1920 },   // 9:16 vertical
  square: { width: 1080, height: 1080 },   // 1:1 square
  landscape: { width: 1920, height: 1080 }, // 16:9 horizontal
};

/** Input for video generation */
export interface VideoInput {
  /** Source text (Telegram post or custom text) */
  text: string;
  /** Language of the content */
  language: VideoLanguage;
  /** Video format preset */
  format: VideoFormat;
  /** Optional title for the video */
  title?: string;
}

/** Script segment with timing */
export interface ScriptSegment {
  /** Text content of the segment */
  text: string;
  /** Whether this is a key phrase to emphasize */
  isKeyPhrase: boolean;
  /** Visual emphasis level (1-3) */
  emphasisLevel: 1 | 2 | 3;
}

/** Generated video script */
export interface VideoScript {
  /** Original input text */
  originalText: string;
  /** Segmented script for animation */
  segments: ScriptSegment[];
  /** Full text for TTS */
  fullText: string;
  /** Language */
  language: VideoLanguage;
}

/** Character-level timestamp from ElevenLabs */
export interface CharacterTimestamp {
  /** The character */
  character: string;
  /** Start time in seconds */
  startTime: number;
  /** End time in seconds */
  endTime: number;
}

/** Word-level timestamp (derived from character timestamps) */
export interface WordTimestamp {
  /** The word */
  word: string;
  /** Start time in seconds */
  startTime: number;
  /** End time in seconds */
  endTime: number;
  /** Character index in the full text */
  charIndex: number;
}

/** Voice synthesis result */
export interface VoiceSynthesisResult {
  /** Audio data as base64 */
  audioBase64: string;
  /** Audio format */
  format: "mp3";
  /** Character-level timestamps */
  characterTimestamps: CharacterTimestamp[];
  /** Word-level timestamps (derived) */
  wordTimestamps: WordTimestamp[];
  /** Total duration in seconds */
  durationSeconds: number;
}

/** Combined data for video composition */
export interface VideoCompositionData {
  /** Video script */
  script: VideoScript;
  /** Voice synthesis result */
  voice: VoiceSynthesisResult;
  /** Video format */
  format: VideoFormat;
  /** Video dimensions */
  dimensions: { width: number; height: number };
  /** Frame rate */
  fps: number;
  /** Total duration in frames */
  durationInFrames: number;
}

/** Video generation options */
export interface VideoGenerationOptions {
  /** Output file path */
  outputPath: string;
  /** Video format */
  format: VideoFormat;
  /** Frame rate (default: 30) */
  fps?: number;
  /** Preview mode (don't render, just return composition data) */
  preview?: boolean;
}

/** Video generation result */
export interface VideoGenerationResult {
  /** Path to the generated video */
  outputPath: string;
  /** Duration in seconds */
  durationSeconds: number;
  /** Video format used */
  format: VideoFormat;
  /** Dimensions */
  dimensions: { width: number; height: number };
}

/** ElevenLabs configuration */
export interface ElevenLabsConfig {
  /** API key */
  apiKey: string;
  /** Voice ID for cloned voice */
  voiceId: string;
  /** Model ID (default: eleven_multilingual_v2) */
  modelId?: string;
  /** Output format (default: mp3_44100_128) */
  outputFormat?: string;
}

/** Video theme configuration */
export interface VideoTheme {
  /** Background color */
  backgroundColor: string;
  /** Primary text color */
  textColor: string;
  /** Accent color for emphasis */
  accentColor: string;
  /** Font family for display text */
  fontFamily: string;
  /** Font weight for regular text */
  fontWeight: number;
  /** Font weight for emphasized text */
  emphasisFontWeight: number;
}

/** Default dark theme */
export const DEFAULT_THEME: VideoTheme = {
  backgroundColor: "#0a0a0a",
  textColor: "#ffffff",
  accentColor: "#3b82f6",
  fontFamily: "Inter, system-ui, sans-serif",
  fontWeight: 400,
  emphasisFontWeight: 700,
};
