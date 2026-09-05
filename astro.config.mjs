import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// Static-first marketing site. The intake form will POST to a server-side /
// BAA-covered endpoint (added later) — never to a third-party tag — so no PHI
// touches analytics/ad scripts. Set the real domain here at cut-over.
// Staging on GitHub Pages serves under /<repo>/. At cut-over to the real domain,
// set base back to '/' (or drop it) — the url() helper makes links follow either.
const STAGING = process.env.STAGING !== 'false';
export default defineConfig({
  site: STAGING ? 'https://williamparrish-michael.github.io' : 'https://newbeginningsrecovery.com',
  base: STAGING ? '/newbeginnings-recovery/' : '/',
  build: { format: 'directory' },
  compressHTML: true,
  // Generates sitemap-index.xml + sitemap-0.xml from every built page. When the
  // PHI intake form ships on a noindex page, exclude it here via `filter`.
  integrations: [sitemap()],
});
