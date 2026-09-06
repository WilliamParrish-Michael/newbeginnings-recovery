// URGENT one-time capture of the live WordPress site before it is taken down.
// 1) Localizes blog in-body images (downloads + rewrites the markdown to local paths)
// 2) Backs up the ENTIRE WP media library to archive/wp-media/ (originals)
// 3) Archives the raw HTML of every structural page to archive/pages/
// Run: node scripts/capture-live-site.mjs
import { promises as fs } from 'node:fs';
import path from 'node:path';

const SITE = 'https://newbeginningsrecovery.com';
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36';
const H = { headers: { 'User-Agent': UA } };
const stripSize = u => u.replace(/-\d+x\d+(\.[a-z]+)$/i, '$1');

async function dl(url, dest) {
  try { const r = await fetch(url, H); if (!r.ok) return false; await fs.writeFile(dest, Buffer.from(await r.arrayBuffer())); return true; }
  catch { return false; }
}
async function pool(items, n, fn) { let i = 0, ok = 0; const w = async () => { while (i < items.length) { const j = i++; if (await fn(items[j])) ok++; } }; await Promise.all(Array.from({ length: n }, w)); return ok; }

// 1) Blog in-body image localization
async function blogInline() {
  const dir = 'src/content/blog';
  await fs.mkdir('public/images/blog/inline', { recursive: true });
  const files = (await fs.readdir(dir)).filter(f => f.endsWith('.md'));
  const toGet = new Map(); // fullResUrl -> localName
  const rewrites = [];
  for (const f of files) {
    let md = await fs.readFile(path.join(dir, f), 'utf8');
    const urls = [...new Set([...md.matchAll(/https?:\/\/newbeginningsrecovery\.com\/wp-content\/uploads\/[^\s)"'>]+\.(?:jpe?g|png|webp|gif)/gi)].map(m => m[0]))];
    for (const u of urls) {
      const full = stripSize(u);
      const name = decodeURIComponent(full.split('/').pop());
      toGet.set(full, name);
      md = md.split(u).join('/images/blog/inline/' + name);
    }
    rewrites.push([path.join(dir, f), md]);
  }
  const got = await pool([...toGet.entries()], 8, ([full, name]) => dl(full, 'public/images/blog/inline/' + name));
  for (const [p, md] of rewrites) await fs.writeFile(p, md);
  console.log(`blog in-body images: downloaded ${got}/${toGet.size}, rewrote ${files.length} posts`);
}

// 2) Full media library backup
async function mediaLibrary() {
  await fs.mkdir('archive/wp-media', { recursive: true });
  let page = 1, all = [], batch;
  do {
    const r = await fetch(`${SITE}/wp-json/wp/v2/media?per_page=100&page=${page}&_fields=source_url,mime_type`, H);
    if (!r.ok) break; batch = await r.json(); all.push(...batch); page++;
  } while (batch.length === 100 && page <= 20);
  const imgs = all.filter(m => /^image\//.test(m.mime_type || '') && m.source_url);
  const got = await pool(imgs, 8, m => dl(m.source_url, 'archive/wp-media/' + decodeURIComponent(m.source_url.split('/').pop())));
  console.log(`media library: backed up ${got}/${imgs.length} images (of ${all.length} media items)`);
}

// 3) Structural page HTML archive
async function pagesHtml() {
  await fs.mkdir('archive/pages', { recursive: true });
  const slugs = ['', 'meet-our-team', 'mindfulness', 'nutrition-counseling', 'ayurveda-mindfulness',
    'drug-detox-coachella-valley', 'alcohol-detox-coachella-valley', 'drug-rehab-in-the-coachella-valley',
    'alcohol-rehab-in-the-coachella-valley', 'addiction-treatment-programs-in-rancho-mirage-palm-springs',
    'medical-detox-in-rancho-mirage-palm-springs', 'about-us', 'family-support-in-addiction-recovery',
    'wellness-services-in-rancho-mirage-palm-springs', 'residential-rehab-in-palm-springs-rancho-mirage',
    'verify-your-insurance', 'virtual-tour', 'resources', 'contact-new-beginnings-recovery', 'sitemap'];
  const got = await pool(slugs, 6, async (s) => {
    try { const r = await fetch(SITE + '/' + (s ? s + '/' : ''), H); if (!r.ok) return false; await fs.writeFile('archive/pages/' + (s || 'home') + '.html', await r.text()); return true; } catch { return false; }
  });
  console.log(`structural pages archived: ${got}/${slugs.length}`);
}

console.log('Capturing live site before takedown…');
await blogInline();
await mediaLibrary();
await pagesHtml();
console.log('Done.');
