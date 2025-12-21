/**
 * Video Pipeline
 * Main entry point for video generation
 */

// Types
export type {
  VideoLanguage,
  VideoFormat,
  VideoInput,
  ScriptSegment,
  VideoScript,
  CharacterTimestamp,
  WordTimestamp,
  VoiceSynthesisResult,
  VideoCompositionData,
  VideoGenerationOptions,
  VideoGenerationResult,
  ElevenLabsConfig,
  VideoTheme,
} from "./types.js";

export { VIDEO_FORMATS, DEFAULT_THEME } from "./types.js";

// ElevenLabs
export {
  synthesizeSpeech,
  saveAudioToFile,
  getVoices,
  getVoiceInfo,
  createElevenLabsClient,
} from "./elevenlabs.js";

// Script Generator
export { generateScript, generateSimpleScript } from "./script-generator.js";

// Pipeline functions
import type {
  VideoInput,
  VideoCompositionData,
  ElevenLabsConfig,
} from "./types.js";
import { VIDEO_FORMATS } from "./types.js";
import { generateScript } from "./script-generator.js";
import { synthesizeSpeech } from "./elevenlabs.js";

/**
 * Prepares composition data for Remotion rendering
 */
export async function prepareComposition(
  input: VideoInput,
  elevenLabsConfig: ElevenLabsConfig,
  options: { fps?: number; anthropicApiKey?: string } = {}
): Promise<VideoCompositionData> {
  const fps = options.fps ?? 30;

  // Generate script with key phrases
  const script = await generateScript(
    input.text,
    input.language,
    options.anthropicApiKey
  );

  // Synthesize voice with timestamps
  const voice = await synthesizeSpeech(script.fullText, elevenLabsConfig);

  // Calculate duration in frames
  const durationInFrames = Math.ceil(voice.durationSeconds * fps);

  return {
    script,
    voice,
    format: input.format,
    dimensions: VIDEO_FORMATS[input.format],
    fps,
    durationInFrames,
  };
}

/**
 * Gets ElevenLabs config from environment variables
 */
export function getElevenLabsConfigFromEnv(): ElevenLabsConfig {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  const voiceId = process.env.ELEVENLABS_VOICE_ID;

  if (!apiKey) {
    throw new Error("ELEVENLABS_API_KEY environment variable is required");
  }

  if (!voiceId) {
    throw new Error("ELEVENLABS_VOICE_ID environment variable is required");
  }

  return {
    apiKey,
    voiceId,
  };
}
