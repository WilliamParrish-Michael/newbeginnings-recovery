import { defineCollection, z } from 'astro:content';

// Blog posts live as markdown in src/content/blog/ — no CMS login on the public
// site. Edit by committing markdown (agency) or via a git-based CMS that
// authenticates through GitHub (see server/README or the blog CMS notes).
const blog = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string().optional().default(''),
    pubDate: z.coerce.date(),
    heroImage: z.string().optional(),
    draft: z.boolean().optional().default(false),
  }),
});

export const collections = { blog };
