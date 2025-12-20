// Shared types for Context Engineering Blog

export interface PostInput {
  /** Raw notes/links from user */
  content: string;
  /** Post title */
  title: string;
  /** Tags for the post */
  tags: string[];
  /** Source links */
  sources?: string[];
}

export interface GeneratedPost {
  /** Telegram post content (short, RU) */
  telegram: {
    text: string;
    lang: "ru";
  };
  /** Blog article (full, both languages) */
  blog: {
    ru: BlogArticle;
    en: BlogArticle;
  };
}

export interface BlogArticle {
  /** Article title */
  title: string;
  /** Meta description */
  description: string;
  /** Full content in markdown */
  content: string;
  /** Language */
  lang: "ru" | "en";
  /** Tags */
  tags: string[];
  /** Publication date (ISO string) */
  date: string;
  /** Slug for URL */
  slug: string;
}

export type AIProvider = "claude" | "openai" | "gemini";

export interface Config {
  aiProvider: AIProvider;
  telegram: {
    botToken: string;
    channelId: string;
  };
  git: {
    autoCommit: boolean;
    autoPush: boolean;
  };
  blogUrl: string;
}
