/**
 * Script Generator
 * Uses Claude to extract key phrases and create video script
 */

import Anthropic from "@anthropic-ai/sdk";
import type { VideoScript, VideoLanguage, ScriptSegment } from "./types.js";

const SYSTEM_PROMPT = `You are a video script analyzer. Your task is to analyze text and identify key phrases that should be emphasized in a kinetic typography video.

For each input text, you will:
1. Identify the most important phrases (3-7 per short video)
2. Assign emphasis levels (1-3, where 3 is highest)
3. Split the text into segments where each segment is either a key phrase or regular text

Rules:
- Key phrases should be impactful, memorable statements
- Emphasis level 3: Main message, thesis, or call-to-action
- Emphasis level 2: Supporting arguments, important examples
- Emphasis level 1: Regular text that still needs some visual attention

Respond ONLY with valid JSON in this exact format:
{
  "segments": [
    {"text": "segment text", "isKeyPhrase": true/false, "emphasisLevel": 1|2|3}
  ]
}`;

interface ClaudeResponse {
  segments: Array<{
    text: string;
    isKeyPhrase: boolean;
    emphasisLevel: 1 | 2 | 3;
  }>;
}

/**
 * Generates a video script from input text
 */
export async function generateScript(
  text: string,
  language: VideoLanguage,
  apiKey?: string
): Promise<VideoScript> {
  const client = new Anthropic({
    apiKey: apiKey || process.env.ANTHROPIC_API_KEY,
  });

  const languageHint = language === "ru"
    ? "The text is in Russian. Identify phrases in Russian."
    : "The text is in English.";

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 2048,
    messages: [
      {
        role: "user",
        content: `${languageHint}\n\nAnalyze this text and identify key phrases for a kinetic typography video:\n\n${text}`,
      },
    ],
    system: SYSTEM_PROMPT,
  });

  // Extract text content from response
  const content = response.content[0];
  if (content.type !== "text") {
    throw new Error("Unexpected response type from Claude");
  }

  // Parse JSON response
  let parsed: ClaudeResponse;
  try {
    // Extract JSON from potential markdown code blocks
    let jsonText = content.text;
    const jsonMatch = jsonText.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonText = jsonMatch[1].trim();
    }
    parsed = JSON.parse(jsonText);
  } catch (error) {
    throw new Error(`Failed to parse script response: ${content.text}`);
  }

  // Validate segments
  const segments: ScriptSegment[] = parsed.segments.map((seg) => ({
    text: seg.text,
    isKeyPhrase: Boolean(seg.isKeyPhrase),
    emphasisLevel: ([1, 2, 3].includes(seg.emphasisLevel) ? seg.emphasisLevel : 1) as 1 | 2 | 3,
  }));

  // Reconstruct full text from segments
  const fullText = segments.map((s) => s.text).join(" ");

  return {
    originalText: text,
    segments,
    fullText,
    language,
  };
}

/**
 * Translates text from one language to another
 */
export async function translateText(
  text: string,
  fromLang: VideoLanguage,
  toLang: VideoLanguage,
  apiKey?: string
): Promise<string> {
  if (fromLang === toLang) return text;

  const client = new Anthropic({
    apiKey: apiKey || process.env.ANTHROPIC_API_KEY,
  });

  const langNames = { ru: "Russian", en: "English" };

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 2048,
    messages: [
      {
        role: "user",
        content: `Translate the following text from ${langNames[fromLang]} to ${langNames[toLang]}. Keep the same tone and style. Only return the translated text, nothing else.\n\nText:\n${text}`,
      },
    ],
  });

  const content = response.content[0];
  if (content.type !== "text") {
    throw new Error("Unexpected response type from Claude");
  }

  return content.text.trim();
}

/**
 * Simple script generation without AI (fallback)
 * Splits text into sentences, marks first and last as key phrases
 */
export function generateSimpleScript(
  text: string,
  language: VideoLanguage
): VideoScript {
  // Split by sentence endings
  const sentences = text
    .split(/(?<=[.!?])\s+/)
    .filter((s) => s.trim().length > 0);

  const segments: ScriptSegment[] = sentences.map((sentence, index) => {
    const isFirst = index === 0;
    const isLast = index === sentences.length - 1;
    const isKeyPhrase = isFirst || isLast;

    return {
      text: sentence.trim(),
      isKeyPhrase,
      emphasisLevel: isFirst ? 3 : isLast ? 2 : 1,
    };
  });

  return {
    originalText: text,
    segments,
    fullText: text,
    language,
  };
}
