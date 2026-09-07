import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// Static-first marketing site. The intake form will POST to a server-side /
// BAA-covered endpoint (added later) — never to a third-party tag — so no PHI
// touches analytics/ad scripts. Set the real domain here at cut-over.
// Staging on GitHub Pages serves under /<repo>/. At cut-over to the real domain,
// set base back to '/' (or drop it) — the url() helper makes links follow either.
const STAGING = process.env.STAGING !== 'false';
const BASE = STAGING ? '/newbeginnings-recovery/' : '/';

// Prefix the site base onto root-relative links/images inside markdown content
// (blog posts). Page components use the url() helper; markdown can't, so this makes
// in-content /… links and /images/… work on both staging (/newbeginnings-recovery/)
// and the real domain (/). External and already-prefixed links are left alone.
function rehypeBaseUrl() {
  const base = BASE.replace(/\/$/, '');
  const walk = (node) => {
    if (node.type === 'element' && node.properties) {
      for (const a of ['href', 'src']) {
        const v = node.properties[a];
        if (typeof v === 'string' && v.startsWith('/') && !v.startsWith('//') && !v.startsWith(base + '/')) {
          node.properties[a] = base + v;
        }
      }
    }
    (node.children || []).forEach(walk);
  };
  return (tree) => walk(tree);
}

export default defineConfig({
  site: STAGING ? 'https://williamparrish-michael.github.io' : 'https://newbeginningsrecovery.com',
  base: BASE,
  build: { format: 'directory' },
  compressHTML: true,
  markdown: { rehypePlugins: [rehypeBaseUrl] },
  // Generates sitemap-index.xml + sitemap-0.xml from every built page. When the
  // PHI intake form ships on a noindex page, exclude it here via `filter`.
  integrations: [sitemap()],
});
