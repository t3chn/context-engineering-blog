import type { APIContext } from "astro";
import { getCollection } from "astro:content";

export async function GET(_context: APIContext) {
  const allPosts = await getCollection("posts", ({ data }) => !data.draft);

  // Sort by date descending
  allPosts.sort((a, b) => b.data.date.getTime() - a.data.date.getTime());

  const ruPosts = allPosts.filter((p) => p.data.lang === "ru");
  const enPosts = allPosts.filter((p) => p.data.lang === "en");

  const formatPost = (post: (typeof allPosts)[number]) => {
    const slug = post.id; // e.g. "ru/hello-world" or "en/hello-world"
    const url = `https://ctxt.dev/posts/${slug}`;
    return `- [${post.data.title}](${url}): ${post.data.description}`;
  };

  const lines: string[] = [
    "# ctxt.dev — Context Engineering Blog",
    "",
    "> Blog about context engineering — structuring information for LLM and AI development. Practice, not theory.",
    "",
  ];

  if (enPosts.length > 0) {
    lines.push("## Posts (EN)");
    lines.push(...enPosts.map(formatPost));
    lines.push("");
  }

  if (ruPosts.length > 0) {
    lines.push("## Posts (RU)");
    lines.push(...ruPosts.map(formatPost));
    lines.push("");
  }

  lines.push("## Links");
  lines.push("- RSS (EN): https://ctxt.dev/rss.xml");
  lines.push("- RSS (RU): https://ctxt.dev/ru/rss.xml");
  lines.push("- Telegram: https://t.me/ctxtdev");
  lines.push("");

  return new Response(lines.join("\n"), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}
