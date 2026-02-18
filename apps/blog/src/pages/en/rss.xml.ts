import rss from "@astrojs/rss";
import { getCollection } from "astro:content";
import type { APIContext } from "astro";

export async function GET(context: APIContext) {
  const posts = await getCollection("posts");
  const enPosts = posts
    .filter((p) => p.data.lang === "en" && !p.data.draft)
    .sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());

  return rss({
    title: "ctxt.dev — Context Engineering (EN)",
    description:
      "Blog about context engineering, structuring information for LLMs and AI development",
    site: context.site!,
    items: enPosts.map((post) => ({
      title: post.data.title,
      pubDate: post.data.date,
      description: post.data.description,
      link: `/posts/${post.id}/`,
    })),
  });
}
