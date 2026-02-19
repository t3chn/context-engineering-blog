/**
 * Local proofreader — style guide checks without external API calls.
 * Checks: length, emoji, prohibited patterns, formatting, structure.
 */

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

const PROHIBITED_PHRASES_RU = [
  { pattern: /подпиши/i, desc: "CTA: подпиши" },
  { pattern: /подписывай/i, desc: "CTA: подписывай" },
  { pattern: /читай далее/i, desc: "CTA: читай далее" },
  { pattern: /обязательно попробуй/i, desc: "Мотивационный тон" },
  { pattern: /вы сможете/i, desc: "Мотивационный тон" },
  { pattern: /лучший способ/i, desc: "Промоушн" },
  { pattern: /самый лучший/i, desc: "Промоушн" },
  { pattern: /просто сделай/i, desc: "Снисходительный тон" },
];

const PROHIBITED_PHRASES_EN = [
  { pattern: /subscribe/i, desc: "CTA: subscribe" },
  { pattern: /follow me/i, desc: "CTA: follow me" },
  { pattern: /read more/i, desc: "CTA: read more" },
  { pattern: /click here/i, desc: "CTA: click here" },
  { pattern: /you can do it/i, desc: "Motivational tone" },
  { pattern: /the best way/i, desc: "Promotional language" },
  { pattern: /amazing/i, desc: "Promotional language" },
  { pattern: /incredible/i, desc: "Promotional language" },
  { pattern: /just do/i, desc: "Condescending tone" },
];

const EMOJI_REGEX =
  /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}]/gu;

function detectLanguage(text: string): "ru" | "en" {
  const cyrillic = (text.match(/[а-яА-ЯёЁ]/g) || []).length;
  const latin = (text.match(/[a-zA-Z]/g) || []).length;
  return cyrillic > latin ? "ru" : "en";
}

export async function proofread(
  _apiKey: string,
  text: string,
  _type: "telegram" | "blog_ru" | "blog_en" = "telegram"
): Promise<ProofreadResult> {
  const issues: ProofreadIssue[] = [];
  const lang = detectLanguage(text);
  const lines = text.split("\n").filter((l) => l.trim());

  // 1. Length check for Telegram
  if (_type === "telegram") {
    if (text.length > 800) {
      issues.push({
        type: "format",
        severity: "warning",
        description: `Текст длинный (${text.length} символов, рекомендовано до 800)`,
      });
    }
    if (text.length < 100) {
      issues.push({
        type: "format",
        severity: "warning",
        description: `Текст очень короткий (${text.length} символов)`,
      });
    }
  }

  // 2. Emoji count
  const emojis = text.match(EMOJI_REGEX) || [];
  if (emojis.length > 2) {
    issues.push({
      type: "style",
      severity: "warning",
      description: `Слишком много эмодзи (${emojis.length}, максимум 2)`,
    });
  }

  // 3. Prohibited patterns
  const prohibited = lang === "ru" ? PROHIBITED_PHRASES_RU : PROHIBITED_PHRASES_EN;
  for (const { pattern, desc } of prohibited) {
    if (pattern.test(text)) {
      issues.push({
        type: "style",
        severity: "error",
        description: `Запрещённый паттерн: ${desc}`,
      });
    }
  }

  // 4. Author signature check (last 3 lines)
  const lastLines = lines.slice(-3).join("\n");
  if (/^[\s]*[—–-]{1,3}\s*[A-Za-zА-Яа-яёЁ]/m.test(lastLines)) {
    issues.push({
      type: "format",
      severity: "error",
      description: "Подпись автора в конце (запрещено)",
    });
  }

  // 5. Telegram-specific: bullet lists
  if (_type === "telegram") {
    const bulletLines = lines.filter((l) => /^\s*[•\-*]\s/.test(l));
    if (bulletLines.length > 0) {
      issues.push({
        type: "format",
        severity: "warning",
        description: `Маркированный список в Telegram (${bulletLines.length} строк) — визуальный шум`,
      });
    }
  }

  // 6. Telegram-specific: bold/italic formatting
  if (_type === "telegram") {
    if (/\*\*[^*]+\*\*/.test(text) || /__[^_]+__/.test(text)) {
      issues.push({
        type: "format",
        severity: "suggestion",
        description: "Форматирование (bold/italic) в Telegram — используй plain text",
      });
    }
  }

  // 7. Hashtags at the end
  const hasHashtags = /#[a-zA-Zа-яА-Я]\w*/.test(text);
  if (!hasHashtags) {
    issues.push({
      type: "format",
      severity: "warning",
      description: "Нет хештегов (обязательно: #contextengineering)",
    });
  } else {
    // Check hashtags are at end, not in the middle
    const lastNonEmpty = lines.filter((l) => l.trim()).pop() || "";
    if (!lastNonEmpty.includes("#")) {
      issues.push({
        type: "format",
        severity: "suggestion",
        description: "Хештеги должны быть в конце поста",
      });
    }
  }

  // 8. Long paragraphs for Telegram (>3 lines without break)
  if (_type === "telegram") {
    const paragraphs = text.split(/\n\s*\n/);
    const longParas = paragraphs.filter((p) => p.split("\n").length > 3);
    if (longParas.length > 0) {
      issues.push({
        type: "format",
        severity: "suggestion",
        description: "Длинные абзацы (>3 строк) — разбей для Telegram",
      });
    }
  }

  // 9. Double spaces
  if (/[а-яА-Яa-zA-Z] {2}[а-яА-Яa-zA-Z]/.test(text)) {
    issues.push({
      type: "grammar",
      severity: "suggestion",
      description: "Двойные пробелы между словами",
    });
  }

  const hasErrors = issues.some((i) => i.severity === "error");

  return {
    isApproved: !hasErrors,
    issues,
    correctedText: text,
    thinking: `Local proofread: ${issues.length} issues found (${lang})`,
  };
}

export function formatProofreadResult(result: ProofreadResult): string {
  const lines: string[] = [];

  if (result.isApproved && result.issues.length === 0) {
    lines.push("✓ Текст прошёл проверку");
    return lines.join("\n");
  }

  if (result.isApproved) {
    lines.push("✓ Текст одобрен (есть замечания):");
  } else {
    lines.push("⚠ Найдены проблемы:");
  }

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

  return lines.join("\n");
}
