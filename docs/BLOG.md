# Blog — how it works & how to edit (no public login)

The blog is built with **Astro Content Collections**: every post is a markdown file in
`src/content/blog/`, and the site is statically generated. There is **no login page on
newbeginningsrecovery.com** — editing happens off the public site, which is why sites like this
appear to have an always-updated blog with no visible admin.

## Structure
- Posts: `src/content/blog/<slug>.md` (frontmatter + markdown body). Schema in `src/content/config.ts`.
- Hero images: `public/images/blog/<slug>.<ext>` (referenced as `heroImage:` in frontmatter).
- Pages: `src/pages/blog/index.astro` (listing) and `src/pages/blog/[slug].astro` (post).
- Frontmatter fields: `title`, `description`, `pubDate` (YYYY-MM-DD), `heroImage` (optional), `draft` (optional).

## Ways to update it (pick one)
1. **Agency / developer commits markdown** — simplest. Add/edit a `.md` file, commit, push; the
   GitHub Pages build regenerates the site. No CMS, no login anywhere.
2. **Git-based CMS for the client** (recommended if the client self-edits): add **Keystatic** or
   **TinaCMS** or **Decap CMS**. The editor UI authenticates through **GitHub OAuth** (or the CMS
   provider), saves posts as markdown to this repo, and a GitHub Action rebuilds the site. The
   "login" is GitHub's — there is still no `/login` on the public domain.
   - Keystatic: `@keystatic/core` + `@keystatic/astro`, GitHub mode (needs a GitHub App) or local mode.
   - Decap: a `/admin` route + a small OAuth broker (e.g. a Netlify/Cloudflare function).
3. **Headless CMS** (Sanity/Contentful/Storyblok): author in the CMS's own dashboard; pull content
   at build. More moving parts; only if the client wants a richer editor.

## Migration
Posts were migrated from the old WordPress site via `scripts/migrate-blog.mjs` (WP REST API →
markdown, hero images downloaded). To re-run or pull new posts: `node scripts/migrate-blog.mjs`.

**Known follow-up:** inline (in-body) images in migrated posts still point at the live WordPress
URLs. They render now, but should be localized (downloaded into `public/images/blog/` and rewritten)
before the old WordPress site is retired, or those in-body images will break. Hero images are
already localized.
