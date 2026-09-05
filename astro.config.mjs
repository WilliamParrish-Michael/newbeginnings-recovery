import { defineConfig } from 'astro/config';

// Static-first marketing site. The intake form will POST to a server-side /
// BAA-covered endpoint (added later) — never to a third-party tag — so no PHI
// touches analytics/ad scripts. Set the real domain here at cut-over.
export default defineConfig({
  site: 'https://newbeginningsrecovery.com',
  build: { format: 'directory' },
  compressHTML: true,
});
