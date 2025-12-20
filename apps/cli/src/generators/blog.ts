import type { PostInput, BlogArticle } from "@ceb/shared";
import type { AIProviderInterface } from "../providers/index.js";
import { buildBlogPromptRu, buildBlogPromptEn } from "../prompts/blog.js";
import slugify from "slugify";

function extractMarkdownContent(response: string): string {
  // Remove markdown code block wrapper if present
  const match = response.match(/```markdown\n?([\s\S]*?)\n?```/);
  if (match) {
    return match[1].trim();
  }
  return response.trim();
}

function parseArticle(content: string, lang: "ru" | "en"): BlogArticle {
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);

  if (!frontmatterMatch) {
    throw new Error("Invalid markdown format: missing frontmatter");
  }

  const frontmatter = frontmatterMatch[1];
  const body = frontmatterMatch[2].trim();

  // Parse frontmatter
  const titleMatch = frontmatter.match(/title:\s*"(.+)"/);
  const descMatch = frontmatter.match(/description:\s*"(.+)"/);
  const dateMatch = frontmatter.match(/date:\s*(\d{4}-\d{2}-\d{2})/);
  const tagsMatch = frontmatter.match(/tags:\s*\[(.+)\]/);

  const title = titleMatch?.[1] || "Untitled";
  const description = descMatch?.[1] || "";
  const date = dateMatch?.[1] || new Date().toISOString().split("T")[0];
  const tags = tagsMatch?.[1]
    ? tagsMatch[1]
        .split(",")
        .map((t) => t.trim().replace(/"/g, ""))
        .filter(Boolean)
    : [];

  const slug = slugify(title, { lower: true, strict: true });

  return {
    title,
    description,
    content: body,
    lang,
    tags,
    date,
    slug,
  };
}

export async function generateBlogArticles(
  provider: AIProviderInterface,
  input: PostInput
): Promise<{ ru: BlogArticle; en: BlogArticle }> {
  const date = new Date().toISOString().split("T")[0];
  const slug = slugify(input.title, { lower: true, strict: true });

  // Generate Russian article
  const ruPrompt = buildBlogPromptRu(input, slug, date);
  const ruResponse = await provider.generate(ruPrompt);
  const ruContent = extractMarkdownContent(ruResponse);
  const ruArticle = parseArticle(ruContent, "ru");

  // Generate English translation
  const enPrompt = buildBlogPromptEn(ruContent, input, date);
  const enResponse = await provider.generate(enPrompt);
  const enContent = extractMarkdownContent(enResponse);
  const enArticle = parseArticle(enContent, "en");

  return { ru: ruArticle, en: enArticle };
}
