/**
 * Video Generation Command
 * Generates video shorts from text input
 */

import { Command } from "commander";
import { input, confirm } from "@inquirer/prompts";
import { writeFile, mkdir } from "fs/promises";
import { spawnSync } from "child_process";
import path from "path";
import {
  prepareComposition,
  getElevenLabsConfigFromEnv,
  saveAudioToFile,
  generateSimpleScript,
  translateText,
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
  .option("--translate", "Also generate translated version (ru→en or en→ru)")
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

      // Check ElevenLabs config (pass language for voice selection)
      let elevenLabsConfig;
      try {
        elevenLabsConfig = getElevenLabsConfigFromEnv(language);
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

        // Save Remotion-compatible props
        const remotionProps = {
          words: compositionData.voice.wordTimestamps,
          keyPhrases: compositionData.script.segments
            .filter((s) => s.isKeyPhrase)
            .map((s) => s.text),
          theme: {
            backgroundColor: "#0a0a0a",
            textColor: "#ffffff",
            accentColor: "#3b82f6",
            fontFamily: "Inter, system-ui, sans-serif",
            fontWeight: 400,
            emphasisFontWeight: 700,
          },
          audioSrc: "http://localhost:3000/generated/preview-audio.mp3",
        };
        const propsPath = path.join(outputDir, "preview-props.json");
        await writeFile(propsPath, JSON.stringify(remotionProps, null, 2));
        console.log(`✓ Props saved: ${propsPath}`);

        console.log("\n🎬 To preview in Remotion Studio:");
        console.log("   cd apps/video && pnpm studio");
        return;
      }

      // Full render
      const timestamp = Date.now();
      const audioPath = path.join(outputDir, `audio-${timestamp}.mp3`);
      await saveAudioToFile(compositionData.voice.audioBase64, audioPath);

      // Create Remotion-compatible props
      const remotionProps = {
        words: compositionData.voice.wordTimestamps,
        keyPhrases: compositionData.script.segments
          .filter((s) => s.isKeyPhrase)
          .map((s) => s.text),
        theme: {
          backgroundColor: "#0a0a0a",
          textColor: "#ffffff",
          accentColor: "#3b82f6",
          fontFamily: "Inter, system-ui, sans-serif",
          fontWeight: 400,
          emphasisFontWeight: 700,
        },
        audioSrc: `generated/audio-${timestamp}.mp3`,
      };
      const propsPath = path.join(outputDir, `props-${timestamp}.json`);
      await writeFile(propsPath, JSON.stringify(remotionProps, null, 2));

      console.log(`\n✓ Audio: ${audioPath}`);
      console.log(`✓ Props: ${propsPath}`);

      // Determine output path
      const videoDir = path.join(monorepoRoot, "apps/video");
      const outputPath = options.output || path.join(videoDir, "out", `video-${timestamp}.mp4`);
      await mkdir(path.dirname(outputPath), { recursive: true });

      console.log("\n🎬 Rendering video...\n");

      // Run Remotion render using spawnSync (safe, no shell injection)
      const propsRelative = path.relative(videoDir, propsPath);
      const outputRelative = path.relative(videoDir, outputPath);

      const result = spawnSync("pnpm", [
        "render",
        "KineticTypography",
        outputRelative,
        `--props=${propsRelative}`,
      ], {
        cwd: videoDir,
        stdio: "inherit",
      });

      if (result.status === 0) {
        console.log(`\n✅ Video ready: ${outputPath}`);
      } else {
        console.error("\n❌ Render failed. Try manually:");
        console.log(`   cd apps/video`);
        console.log(`   pnpm render KineticTypography "${outputRelative}" --props="${propsRelative}"`);
        process.exit(1);
      }

      // Generate translated version if requested
      if (options.translate) {
        const targetLang: VideoLanguage = language === "ru" ? "en" : "ru";
        console.log(`\n🌐 Translating to ${targetLang.toUpperCase()}...`);

        const translatedText = await translateText(text, language, targetLang);
        console.log(`✓ Translated: ${translatedText.substring(0, 50)}...`);

        // Get voice config for target language (uses native voice if available)
        const translatedElevenLabsConfig = getElevenLabsConfigFromEnv(targetLang);

        // Generate translated video
        const translatedTimestamp = Date.now();
        const translatedComposition = await prepareComposition(
          { text: translatedText, language: targetLang, format },
          translatedElevenLabsConfig
        );

        console.log(`✓ Voice synthesized (${translatedComposition.voice.durationSeconds.toFixed(1)}s)`);

        const translatedAudioPath = path.join(outputDir, `audio-${translatedTimestamp}-${targetLang}.mp3`);
        await saveAudioToFile(translatedComposition.voice.audioBase64, translatedAudioPath);

        const translatedProps = {
          words: translatedComposition.voice.wordTimestamps,
          keyPhrases: translatedComposition.script.segments
            .filter((s) => s.isKeyPhrase)
            .map((s) => s.text),
          theme: {
            backgroundColor: "#0a0a0a",
            textColor: "#ffffff",
            accentColor: "#3b82f6",
            fontFamily: "Inter, system-ui, sans-serif",
            fontWeight: 400,
            emphasisFontWeight: 700,
          },
          audioSrc: `generated/audio-${translatedTimestamp}-${targetLang}.mp3`,
        };
        const translatedPropsPath = path.join(outputDir, `props-${translatedTimestamp}-${targetLang}.json`);
        await writeFile(translatedPropsPath, JSON.stringify(translatedProps, null, 2));

        const translatedOutputPath = path.join(videoDir, "out", `video-${translatedTimestamp}-${targetLang}.mp4`);
        const translatedPropsRelative = path.relative(videoDir, translatedPropsPath);
        const translatedOutputRelative = path.relative(videoDir, translatedOutputPath);

        console.log(`\n🎬 Rendering ${targetLang.toUpperCase()} video...\n`);

        const translatedResult = spawnSync("pnpm", [
          "render",
          "KineticTypography",
          translatedOutputRelative,
          `--props=${translatedPropsRelative}`,
        ], {
          cwd: videoDir,
          stdio: "inherit",
        });

        if (translatedResult.status === 0) {
          console.log(`\n✅ ${targetLang.toUpperCase()} video ready: ${translatedOutputPath}`);
        } else {
          console.error(`\n⚠️ ${targetLang.toUpperCase()} render failed`);
        }
      }

      console.log("\n✅ Готово!\n");
    } catch (error) {
      console.error("❌ Error:", error);
      process.exit(1);
    }
  });
