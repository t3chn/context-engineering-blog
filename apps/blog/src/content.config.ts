import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const posts = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/posts" }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.coerce.date(),
    updatedAt: z.coerce.date().optional(),
    author: z.string().optional().default("ctxt.dev"),
    tags: z.array(z.string()).default([]),
    lang: z.enum(["ru", "en"]),
    draft: z.boolean().default(false),
  }),
});

export const collections = { posts };
