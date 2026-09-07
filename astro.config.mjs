import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// Static-first marketing site. The intake form POSTs to a CallTrackingMetrics
// FormReactor (BAA-covered) — never to a third-party analytics/ad tag — so no PHI
// touches analytics scripts. Set the real domain here at cut-over.
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
  // Preserve SEO from the old WordPress URLs: forward each retired URL to its
  // rebuild route (static redirect pages for the GitHub Pages / static host).
  redirects: {
    '/medical-detox-in-rancho-mirage-palm-springs/': '/programs/medical-detox/',
    '/residential-rehab-in-palm-springs-rancho-mirage/': '/programs/residential/',
    '/alcohol-detox-coachella-valley/': '/programs/alcohol-detox/',
    '/drug-detox-coachella-valley/': '/programs/drug-detox/',
    '/alcohol-rehab-in-the-coachella-valley/': '/programs/residential/',
    '/drug-rehab-in-the-coachella-valley/': '/programs/residential/',
    '/addiction-treatment-programs-in-rancho-mirage-palm-springs/': '/programs/',
    '/contact-new-beginnings-recovery/': '/contact/',
    '/verify-your-insurance/': '/verify-insurance/',
    '/thank-you-for-verifying-your-insurance/': '/verify-insurance/',
    '/wellness-services-in-rancho-mirage-palm-springs/': '/wellness/',
    '/mindfulness/': '/wellness/mindfulness/',
    '/nutrition-counseling/': '/wellness/nutrition-counseling/',
    '/ayurveda-mindfulness/': '/wellness/ayurveda/',
    '/family-support-in-addiction-recovery/': '/family/',
    '/about-us/': '/about/',
    '/meet-our-team/': '/about/team/',
  },
  markdown: { rehypePlugins: [rehypeBaseUrl] },
  // Generates sitemap-index.xml + sitemap-0.xml from every built page. When the
  // PHI intake form ships on a noindex page, exclude it here via `filter`.
  integrations: [sitemap()],
});
