// Rewrite migrated blog posts' internal links from the old WordPress URLs to the
// rebuild's routes, and strip the live domain so links are root-relative (the rehype
// base-url plugin then adds the base path at build time). Run: node scripts/fix-blog-links.mjs
import { promises as fs } from 'node:fs';
import path from 'node:path';

const DOMAIN = 'https://newbeginningsrecovery.com';
// old live path -> new rebuild route
const MAP = {
  '/medical-detox-in-rancho-mirage-palm-springs/': '/programs/medical-detox/',
  '/residential-rehab-in-palm-springs-rancho-mirage/': '/programs/residential/',
  '/alcohol-detox-coachella-valley/': '/programs/alcohol-detox/',
  '/drug-detox-coachella-valley/': '/programs/drug-detox/',
  '/alcohol-rehab-in-the-coachella-valley/': '/programs/residential/',
  '/drug-rehab-in-the-coachella-valley/': '/programs/residential/',
  '/addiction-treatment-programs-in-rancho-mirage-palm-springs/': '/programs/',
  '/contact-new-beginnings-recovery/': '/contact/',
  '/verify-your-insurance/': '/verify-insurance/',
  '/wellness-services-in-rancho-mirage-palm-springs/': '/wellness/',
  '/family-support-in-addiction-recovery/': '/family/',
  '/about-us/': '/about/',
  '/meet-our-team/': '/about/team/',
  '/mindfulness/': '/wellness/mindfulness/',
  '/nutrition-counseling/': '/wellness/nutrition-counseling/',
  '/ayurveda-mindfulness/': '/wellness/ayurveda/',
};

const dir = 'src/content/blog';
const files = (await fs.readdir(dir)).filter(f => f.endsWith('.md'));
let changed = 0, links = 0;
for (const f of files) {
  const p = path.join(dir, f);
  let md = await fs.readFile(p, 'utf8'); const orig = md;
  // 1) map known old page URLs (domain-qualified) -> new route
  for (const [oldPath, newPath] of Object.entries(MAP)) {
    md = md.split(DOMAIN + oldPath).join(newPath);
  }
  // 2) strip the live domain from any remaining internal links (blog/resources/virtual-tour/
  //    thank-you/home) so they become root-relative; leave image paths (already local) + external alone
  md = md.replace(new RegExp(DOMAIN.replace(/[.]/g, '\\.') + '(/[^)\\s"\'>]*)', 'g'), '$1');
  if (md !== orig) { links += (orig.match(/newbeginningsrecovery\.com/g) || []).length; await fs.writeFile(p, md); changed++; }
}
console.log(`rewrote internal links in ${changed} posts`);
// report any residual live-domain refs (should be 0 for links; images were localized earlier)
