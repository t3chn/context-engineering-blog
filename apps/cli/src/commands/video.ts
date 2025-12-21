/**
 * Video Generation Command
 * Generates video shorts from text input
 */

import { Command } from "commander";
import { input, confirm } from "@inquirer/prompts";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import {
  prepareComposition,
  getElevenLabsConfigFromEnv,
  saveAudioToFile,
  generateSimpleScript,
  type VideoFormat,
  type VideoLanguage,
  VIDEO_FORMATS,
} from "@ceb/video-pipeline";

export const videoCommand = new Command("video")
  .description("Generate video shorts from text")
  .option("-i, --input <text>", "Input text for video")
  .option("-l, --lang <language>", "Language (ru, en)", "ru")
  .option("-f, --format <format>", "Video format (shorts, square, landscape)", "shorts")
  .option("-o, --output <path>", "Output path for video")
  .option("--preview", "Preview mode - prepare composition data only")
  .option("--audio-only", "Generate audio file only (skip video rendering)")
  .action(async (options) => {
    try {
      console.log("\n🎬 Video Shorts Generator\n");

      // Get input text
      let text = options.input;
      if (!text) {
        text = await input({
          message: "Введи текст для видео:",
          validate: (v) => (v.trim() ? true : "Text is required"),
        });
      }

      const language = options.lang as VideoLanguage;
      const format = options.format as VideoFormat;

      console.log(`\n📝 Input: ${text.substring(0, 50)}...`);
      console.log(`🌐 Language: ${language}`);
      console.log(`📐 Format: ${format} (${VIDEO_FORMATS[format].width}x${VIDEO_FORMATS[format].height})`);

      // Check ElevenLabs config
      let elevenLabsConfig;
      try {
        elevenLabsConfig = getElevenLabsConfigFromEnv();
        console.log("✓ ElevenLabs configured");
      } catch (error) {
        console.log("⚠️  ElevenLabs not configured - using simple script mode");

        // Generate simple script without voice
        const script = generateSimpleScript(text, language);
        console.log("\n📜 Script segments:");
        script.segments.forEach((seg, i) => {
          const marker = seg.isKeyPhrase ? "★" : "·";
          console.log(`  ${marker} [${seg.emphasisLevel}] ${seg.text}`);
        });

        console.log("\n⚠️  To generate video with voice:");
        console.log("   1. Set ELEVENLABS_API_KEY in .env");
        console.log("   2. Set ELEVENLABS_VOICE_ID in .env");
        console.log("   3. Run this command again");
        return;
      }

      // Prepare output directory
      const monorepoRoot = path.resolve(import.meta.dirname, "../../../..");
      const outputDir = path.join(monorepoRoot, "apps/video/public/generated");
      await mkdir(outputDir, { recursive: true });

      console.log("\n⏳ Generating...\n");

      // Prepare composition data
      const compositionData = await prepareComposition(
        { text, language, format },
        elevenLabsConfig
      );

      console.log("✓ Script generated");
      console.log(`✓ Voice synthesized (${compositionData.voice.durationSeconds.toFixed(1)}s)`);
      console.log(`✓ ${compositionData.voice.wordTimestamps.length} words with timestamps`);

      // Show script segments
      console.log("\n📜 Key phrases:");
      compositionData.script.segments
        .filter((s) => s.isKeyPhrase)
        .forEach((seg) => {
          console.log(`  ★ ${seg.text}`);
        });

      // Save audio if requested
      if (options.audioOnly) {
        const audioPath = options.output || path.join(outputDir, `audio-${Date.now()}.mp3`);
        await saveAudioToFile(compositionData.voice.audioBase64, audioPath);
        console.log(`\n✓ Audio saved: ${audioPath}`);
        return;
      }

      // Preview mode - just show composition data
      if (options.preview) {
        console.log("\n📊 Composition data:");
        console.log(`  Duration: ${compositionData.durationInFrames} frames (${compositionData.voice.durationSeconds.toFixed(1)}s)`);
        console.log(`  Dimensions: ${compositionData.dimensions.width}x${compositionData.dimensions.height}`);
        console.log(`  FPS: ${compositionData.fps}`);

        // Save audio for preview
        const audioPath = path.join(outputDir, "preview-audio.mp3");
        await saveAudioToFile(compositionData.voice.audioBase64, audioPath);
        console.log(`\n✓ Audio saved: ${audioPath}`);

        // Save composition data as JSON
        const dataPath = path.join(outputDir, "preview-data.json");
        await writeFile(dataPath, JSON.stringify(compositionData, null, 2));
        console.log(`✓ Data saved: ${dataPath}`);

        console.log("\n🎬 To preview in Remotion Studio:");
        console.log("   cd apps/video && pnpm studio");
        return;
      }

      // Full render
      const audioPath = path.join(outputDir, `audio-${Date.now()}.mp3`);
      await saveAudioToFile(compositionData.voice.audioBase64, audioPath);

      const dataPath = path.join(outputDir, `data-${Date.now()}.json`);
      await writeFile(dataPath, JSON.stringify(compositionData, null, 2));

      console.log(`\n✓ Audio: ${audioPath}`);
      console.log(`✓ Data: ${dataPath}`);

      console.log("\n🎬 To render video:");
      console.log(`   cd apps/video`);
      console.log(`   pnpm studio  # Preview first`);
      console.log(`   pnpm render KineticTypography out/video.mp4 --props="${dataPath}"`);

      console.log("\n✅ Готово!\n");
    } catch (error) {
      console.error("❌ Error:", error);
      process.exit(1);
    }
  });
