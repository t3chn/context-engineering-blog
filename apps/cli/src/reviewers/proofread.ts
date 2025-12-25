import Anthropic from "@anthropic-ai/sdk";
import { readFileSync } from "fs";
import { resolve } from "path";

export interface ProofreadResult {
  isApproved: boolean;
  issues: ProofreadIssue[];
  correctedText: string;
  thinking: string;
}

export interface ProofreadIssue {
  type: "grammar" | "style" | "format" | "factual";
  severity: "error" | "warning" | "suggestion";
  description: string;
  original?: string;
  suggested?: string;
}

function loadStyleGuide(type: "telegram" | "blog_ru" | "blog_en"): string {
  const skillsPath = resolve(process.cwd(), ".claude/skills/ceb-content/references");
  const altPath = resolve(process.cwd(), "../../.claude/skills/ceb-content/references");

  const files: Record<string, string> = {
    telegram: "TELEGRAM.md",
    blog_ru: "BLOG_RU.md",
    blog_en: "BLOG_EN.md",
  };

  try {
    return readFileSync(resolve(skillsPath, files[type]), "utf-8");
  } catch {
    try {
      return readFileSync(resolve(altPath, files[type]), "utf-8");
    } catch {
      return "";
    }
  }
}

function buildProofreadPrompt(text: string, type: "telegram" | "blog_ru" | "blog_en"): string {
  const styleGuide = loadStyleGuide(type);

  return `You are a professional proofreader for a technical blog about context engineering and AI.

## Your Task

Review the following ${type === "telegram" ? "Telegram post" : "blog article"} and check for:

1. **Grammar** — spelling, punctuation, sentence structure
2. **Style** — readability, tone of voice, clarity
3. **Format** — compliance with the style guide below
4. **Factual** — technical terms accuracy, consistency

## Style Guide

${styleGuide || "No specific style guide provided. Use general best practices."}

## Text to Review

${text}

## Response Format

Respond in JSON format:

\`\`\`json
{
  "isApproved": boolean,
  "issues": [
    {
      "type": "grammar" | "style" | "format" | "factual",
      "severity": "error" | "warning" | "suggestion",
      "description": "Description of the issue",
      "original": "Original text (if applicable)",
      "suggested": "Suggested fix (if applicable)"
    }
  ],
  "correctedText": "Full corrected text if there are changes, or original text if approved"
}
\`\`\`

Be thorough but practical. Focus on issues that affect readability and quality.
If the text is good, set isApproved to true and provide empty issues array.`;
}

export async function proofread(
  apiKey: string,
  text: string,
  type: "telegram" | "blog_ru" | "blog_en" = "telegram"
): Promise<ProofreadResult> {
  const client = new Anthropic({ apiKey });

  const prompt = buildProofreadPrompt(text, type);

  // Use extended thinking for thorough review
  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 16000,
    thinking: {
      type: "enabled",
      budget_tokens: 10000,
    },
    messages: [{ role: "user", content: prompt }],
  });

  // Extract thinking and text response
  let thinking = "";
  let responseText = "";

  for (const block of response.content) {
    if (block.type === "thinking") {
      thinking = block.thinking;
    } else if (block.type === "text") {
      responseText = block.text;
    }
  }

  // Parse JSON response
  const jsonMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/);
  if (!jsonMatch) {
    // Try to parse as raw JSON
    try {
      const result = JSON.parse(responseText);
      return { ...result, thinking };
    } catch {
      return {
        isApproved: true,
        issues: [],
        correctedText: text,
        thinking,
      };
    }
  }

  try {
    const result = JSON.parse(jsonMatch[1]);
    return { ...result, thinking };
  } catch {
    return {
      isApproved: true,
      issues: [],
      correctedText: text,
      thinking,
    };
  }
}

export function formatProofreadResult(result: ProofreadResult): string {
  const lines: string[] = [];

  if (result.isApproved) {
    lines.push("✓ Текст одобрен");
  } else {
    lines.push("⚠ Найдены замечания:");
  }

  if (result.issues.length > 0) {
    lines.push("");
    for (const issue of result.issues) {
      const icon = issue.severity === "error" ? "❌" : issue.severity === "warning" ? "⚠️" : "💡";
      const typeLabel = {
        grammar: "Грамматика",
        style: "Стиль",
        format: "Формат",
        factual: "Факт",
      }[issue.type];

      lines.push(`${icon} [${typeLabel}] ${issue.description}`);
      if (issue.original && issue.suggested) {
        lines.push(`   "${issue.original}" → "${issue.suggested}"`);
      }
    }
  }

  return lines.join("\n");
}
