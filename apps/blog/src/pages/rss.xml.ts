import rss from "@astrojs/rss";
import { getCollection } from "astro:content";
import type { APIContext } from "astro";

export async function GET(context: APIContext) {
  const posts = await getCollection("posts");
  const ruPosts = posts
    .filter((p) => p.data.lang === "ru" && !p.data.draft)
    .sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());

  return rss({
    title: "ctxt.dev — Context Engineering",
    description: "Блог о context engineering, структуризации информации для LLM и AI-разработке",
    site: context.site!,
    items: ruPosts.map((post) => ({
      title: post.data.title,
      pubDate: post.data.date,
      description: post.data.description,
      link: `/posts/${post.id}/`,
    })),
  });
}
