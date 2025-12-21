/**
 * ElevenLabs Voice Synthesis Client
 * Handles text-to-speech with word-level timestamps
 */

import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";
import type {
  ElevenLabsConfig,
  VoiceSynthesisResult,
  CharacterTimestamp,
  WordTimestamp,
} from "./types.js";

/** Default ElevenLabs configuration */
const DEFAULT_CONFIG = {
  modelId: "eleven_multilingual_v2",
  outputFormat: "mp3_44100_128",
} as const;

/**
 * Pronunciation map for Russian TTS
 * Converts English terms to Cyrillic phonetic spelling
 */
const RU_PRONUNCIATION_MAP: Record<string, string> = {
  "Context Engineering": "Контекст Инжиниринг",
  "Context": "Контекст",
  "Engineering": "Инжиниринг",
  "Prompt": "Промпт",
  "AI": "Эй-Ай",
  "LLM": "Эл-Эл-Эм",
  "API": "Эй-Пи-Ай",
};

// Reverse mapping for display (Cyrillic word → Original)
const RU_DISPLAY_MAP: Record<string, string> = {
  "Контекст": "Context",
  "Инжиниринг": "Engineering",
  "Промпт": "Prompt",
  "Эй-Ай": "AI",
  "Эл-Эл-Эм": "LLM",
  "Эй-Пи-Ай": "API",
};

/**
 * Applies pronunciation fixes for Russian TTS
 * Replaces English terms with Cyrillic phonetic equivalents
 */
function applyRuPronunciation(text: string): string {
  let result = text;
  // Apply longer phrases first to avoid partial replacements
  const sortedKeys = Object.keys(RU_PRONUNCIATION_MAP).sort((a, b) => b.length - a.length);
  for (const key of sortedKeys) {
    result = result.replace(new RegExp(key, "gi"), RU_PRONUNCIATION_MAP[key]);
  }
  return result;
}

/**
 * Converts Cyrillic pronunciation words back to original English for display
 */
function reverseRuPronunciation(word: string): string {
  return RU_DISPLAY_MAP[word] || word;
}

/**
 * Creates an ElevenLabs client with the provided configuration
 */
export function createElevenLabsClient(config: ElevenLabsConfig) {
  const client = new ElevenLabsClient({
    apiKey: config.apiKey,
  });

  return {
    client,
    config: {
      ...DEFAULT_CONFIG,
      ...config,
    },
  };
}

/**
 * Converts character timestamps to word timestamps
 * Groups characters into words based on spaces
 */
function characterTimestampsToWords(
  text: string,
  charTimestamps: Array<{ character: string; start_time: number; end_time: number }>
): WordTimestamp[] {
  const words: WordTimestamp[] = [];
  let currentWord = "";
  let wordStartTime = 0;
  let wordEndTime = 0;
  let charIndex = 0;
  let wordCharIndex = 0;

  for (let i = 0; i < charTimestamps.length; i++) {
    const { character, start_time, end_time } = charTimestamps[i];
    const isWordBoundary = /\s/.test(character);

    if (isWordBoundary) {
      if (currentWord.length > 0) {
        words.push({
          word: currentWord,
          startTime: wordStartTime,
          endTime: wordEndTime,
          charIndex: wordCharIndex,
        });
        currentWord = "";
      }
      charIndex++;
    } else {
      if (currentWord.length === 0) {
        wordStartTime = start_time;
        wordCharIndex = charIndex;
      }
      currentWord += character;
      wordEndTime = end_time;
      charIndex++;
    }
  }

  if (currentWord.length > 0) {
    words.push({
      word: currentWord,
      startTime: wordStartTime,
      endTime: wordEndTime,
      charIndex: wordCharIndex,
    });
  }

  return words;
}

/**
 * Synthesizes speech from text with timestamps
 * @param language - Optional language for pronunciation fixes ('ru' applies Cyrillic phonetics)
 */
export async function synthesizeSpeech(
  text: string,
  config: ElevenLabsConfig,
  language?: "ru" | "en"
): Promise<VoiceSynthesisResult> {
  const { client, config: fullConfig } = createElevenLabsClient(config);

  // Apply pronunciation fixes for Russian
  const processedText = language === "ru" ? applyRuPronunciation(text) : text;

  const response = await client.textToSpeech.convertWithTimestamps(
    fullConfig.voiceId,
    {
      text: processedText,
      modelId: fullConfig.modelId,
    }
  );

  const audioBase64 = response.audioBase64 ?? "";
  const alignment = response.alignment;

  const characterTimestamps: CharacterTimestamp[] = [];

  if (alignment?.characters && alignment?.characterStartTimesSeconds && alignment?.characterEndTimesSeconds) {
    for (let i = 0; i < alignment.characters.length; i++) {
      characterTimestamps.push({
        character: alignment.characters[i],
        startTime: alignment.characterStartTimesSeconds[i],
        endTime: alignment.characterEndTimesSeconds[i],
      });
    }
  }

  const rawCharTimestamps = characterTimestamps.map(ct => ({
    character: ct.character,
    start_time: ct.startTime,
    end_time: ct.endTime,
  }));

  // Use processedText for word extraction (matches what ElevenLabs received)
  const rawWordTimestamps = characterTimestampsToWords(processedText, rawCharTimestamps);

  // For Russian, convert Cyrillic words back to original English for display
  const wordTimestamps = language === "ru"
    ? rawWordTimestamps.map(wt => ({
        ...wt,
        word: reverseRuPronunciation(wt.word),
      }))
    : rawWordTimestamps;

  const durationSeconds =
    characterTimestamps.length > 0
      ? characterTimestamps[characterTimestamps.length - 1].endTime
      : 0;

  return {
    audioBase64,
    format: "mp3",
    characterTimestamps,
    wordTimestamps,
    durationSeconds,
  };
}

/**
 * Saves audio to file
 */
export async function saveAudioToFile(
  audioBase64: string,
  outputPath: string
): Promise<void> {
  const { writeFile } = await import("node:fs/promises");
  const buffer = Buffer.from(audioBase64, "base64");
  await writeFile(outputPath, buffer);
}

/**
 * Gets available voices from ElevenLabs
 */
export async function getVoices(apiKey: string) {
  const client = new ElevenLabsClient({ apiKey });
  const response = await client.voices.getAll();
  return response.voices;
}

/**
 * Gets voice info by ID
 */
export async function getVoiceInfo(apiKey: string, voiceId: string) {
  const client = new ElevenLabsClient({ apiKey });
  return await client.voices.get(voiceId);
}
