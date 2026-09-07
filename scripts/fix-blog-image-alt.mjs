// Add alt text to inline blog images that migrated with empty alt (![](...)).
// Derives readable alt from the filename; falls back to a generic facility alt for
// hash/numeric social-image names. Run: node scripts/fix-blog-image-alt.mjs
import { promises as fs } from 'node:fs';
import path from 'node:path';

const dir = 'src/content/blog';
const FALLBACK = 'New Beginnings Recovery — Rancho Mirage, California';
const files = (await fs.readdir(dir)).filter(f => f.endsWith('.md'));

function altFromName(url) {
  let base = decodeURIComponent(url.split('/').pop() || '');
  base = base.replace(/\.[a-z0-9]+$/i, '');            // ext
  base = base.replace(/-\d{2,4}x\d{2,4}$/i, '');        // -WxH
  base = base.replace(/-\d{1,3}$/i, '');                // trailing -NNN sequence
  base = base.replace(/-e\d{6,}$/i, '');                // WP edit hash suffix
  const words = base.replace(/[_-]+/g, ' ').trim();
  const digits = (words.replace(/\D/g, '').length) / Math.max(words.length, 1);
  // mostly-digits or social-id style => fallback
  if (digits > 0.4 || /^\d/.test(words) || words.length < 4) return FALLBACK;
  return words.replace(/\s+/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

let changed = 0, imgs = 0;
for (const f of files) {
  const p = path.join(dir, f);
  let md = await fs.readFile(p, 'utf8'); const orig = md;
  md = md.replace(/!\[\]\((\/images\/blog\/[^)]+)\)/g, (m, url) => { imgs++; return `![${altFromName(url)}](${url})`; });
  if (md !== orig) { await fs.writeFile(p, md); changed++; }
}
console.log(`added alt to ${imgs} inline images across ${changed} posts`);
