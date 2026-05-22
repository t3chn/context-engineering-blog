import type { PostInput } from "@ceb/shared";
import { existsSync, readFileSync } from "fs";
import path from "path";
import { getPublishingWorkspaceRoot } from "../config.js";

function loadStyleContext(platform: "telegram" | "blog_ru" | "blog_en"): string {
  const workspaceRoot = getPublishingWorkspaceRoot();
  const workspaceFiles =
    platform === "telegram"
      ? [
          "styles/shared-author-posture.md",
          "styles/content-engineering-style-guide.md",
          "styles/telegram-field-notes-style.md",
        ]
      : ["styles/shared-author-posture.md", "styles/content-engineering-style-guide.md"];

  const workspaceContext = workspaceFiles
    .map((file) => path.join(workspaceRoot, file))
    .filter((file) => existsSync(file))
    .map((file) => readFileSync(file, "utf-8"))
    .join("\n\n---\n\n");

  if (workspaceContext) {
    return `# Publishing Workspace Style\n\n${workspaceContext}`;
  }

  const skillDir = path.resolve(import.meta.dirname, "../../../../.claude/skills/ceb-content");

  try {
    const tldr = readFileSync(path.join(skillDir, "references/TLDR.md"), "utf-8");

    const platformFile =
      platform === "telegram"
        ? "references/TELEGRAM.md"
        : platform === "blog_ru"
          ? "references/BLOG_RU.md"
          : "references/BLOG_EN.md";

    const platformGuide = readFileSync(path.join(skillDir, platformFile), "utf-8");

    return `# Style Guide\n\n${tldr}\n\n---\n\n${platformGuide}`;
  } catch {
    // Fallback if skill files not found
    return "";
  }
}

export function buildTelegramPrompt(input: PostInput): string {
  const sources = input.sources?.length
    ? `\n\nИсточники:\n${input.sources.map((s) => `- ${s}`).join("\n")}`
    : "";

  const styleContext = loadStyleContext("telegram");

  return `You write Telegram posts for @ctxtdev about context engineering.

${styleContext}

---

## Task
Create one native Telegram post from my notes.

## Philosophy: Context-First Thinking
Shape: Problem -> Context -> Solution -> Insight

## Requirements
- Default language: English unless my notes explicitly ask for Russian
- 3-7 short paragraphs
- Plain text, minimal emoji
- One post, one job
- Hashtags at the end
- Include #contextengineering
- No author signature
- No bullet lists by default
- No motivational tone
- No em dash, en dash, smart quotes, or ellipsis

## My notes
Title: ${input.title}
Tags: ${input.tags.join(", ")}

${input.content}
${sources}

## Output
Return only the post body.`;
}

export { loadStyleContext };
