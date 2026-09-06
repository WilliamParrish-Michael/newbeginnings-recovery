// One-time migration of the New Beginnings blog from the live WordPress site into
// Astro Content Collections (markdown in src/content/blog/). Run: node scripts/migrate-blog.mjs
// Pulls the client's own posts via the WP REST API, converts HTML→markdown, downloads hero images.
import TurndownService from 'turndown';
import { promises as fs } from 'node:fs';
import path from 'node:path';

const SITE = 'https://newbeginningsrecovery.com';
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36';
const OUT_MD = 'src/content/blog';
const OUT_IMG = 'public/images/blog';

const td = new TurndownService({ headingStyle: 'atx', codeBlockStyle: 'fenced', bulletListMarker: '-' });
// Drop empty/script/style/form noise that Elementor sometimes leaves in content.rendered
td.remove(['script', 'style', 'form', 'noscript']);

const ents = { '&amp;':'&','&#038;':'&','&#38;':'&','&quot;':'"','&#34;':'"','&#039;':"'",'&#39;':"'",'&apos;':"'",
  '&#8217;':'’','&#8216;':'‘','&#8220;':'“','&#8221;':'”','&#8211;':'–','&#8212;':'—','&#8230;':'…','&lt;':'<','&gt;':'>','&nbsp;':' ' };
const decode = s => (s||'').replace(/&[#a-z0-9]+;/gi, m => ents[m] ?? m);
const strip = s => decode((s||'').replace(/<[^>]+>/g,' ')).replace(/\s+/g,' ').trim();
const yaml = s => JSON.stringify(decode(s||'')); // JSON string = valid YAML double-quoted scalar

async function getJSON(url){ const r = await fetch(url, { headers:{ 'User-Agent':UA } }); if(!r.ok) throw new Error('HTTP '+r.status+' '+url); return r.json(); }

async function run(){
  await fs.mkdir(OUT_MD, { recursive:true });
  await fs.mkdir(OUT_IMG, { recursive:true });
  const posts = await getJSON(`${SITE}/wp-json/wp/v2/posts?per_page=100&_embed=wp:featuredmedia`);
  console.log('fetched', posts.length, 'posts');
  let ok=0, imgs=0;
  for (const p of posts){
    const slug = p.slug;
    const title = strip(p.title?.rendered) || slug;
    const description = strip(p.excerpt?.rendered).replace(/\s*Read more.*$/i,'').slice(0,300);
    const pubDate = (p.date || '').slice(0,10);
    let heroImage = '';
    const media = p._embedded?.['wp:featuredmedia']?.[0]?.source_url;
    if (media){
      try{
        const ext = (media.split('?')[0].match(/\.(jpe?g|png|webp|gif)$/i)||['.jpg'])[0].toLowerCase();
        const buf = Buffer.from(await (await fetch(media,{headers:{'User-Agent':UA}})).arrayBuffer());
        await fs.writeFile(path.join(OUT_IMG, slug+ext), buf);
        heroImage = `/images/blog/${slug}${ext}`; imgs++;
      }catch(e){ /* leave heroImage empty */ }
    }
    let body = td.turndown(p.content?.rendered || '').replace(/\n{3,}/g,'\n\n').trim();
    const fm = ['---',
      `title: ${yaml(title)}`,
      `description: ${yaml(description)}`,
      `pubDate: ${pubDate}`,
      heroImage ? `heroImage: ${yaml(heroImage)}` : null,
      'draft: false',
      '---',''].filter(x=>x!==null).join('\n');
    await fs.writeFile(path.join(OUT_MD, slug+'.md'), fm+'\n'+body+'\n');
    ok++;
  }
  console.log(`wrote ${ok} markdown files, ${imgs} hero images`);
}
run().catch(e=>{ console.error('MIGRATION FAILED:', e.message); process.exit(1); });
