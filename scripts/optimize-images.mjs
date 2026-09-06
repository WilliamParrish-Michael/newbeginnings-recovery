// Optimize DEPLOYED images in public/images (resize max 1600w, recompress ~80%).
// Reads each file into a buffer first (avoids the Windows sharp read+write-same-path lock).
// Leaves logos/vector art and the archive/ backup (full-res originals) untouched.
import sharp from 'sharp';
import { promises as fs } from 'node:fs';
import path from 'node:path';

const ROOT = 'public/images';
const SKIP = /badges|logo|brandmark|dhcs|legitscript|\.svg$/i;
const exts = /\.(jpe?g|png|webp)$/i;
const MAXW = 1600;

async function walk(d){ let out=[]; for(const e of await fs.readdir(d,{withFileTypes:true})){ const p=path.join(d,e.name); if(e.isDirectory()) out=out.concat(await walk(p)); else if(exts.test(e.name)) out.push(p); } return out; }

const files = (await walk(ROOT)).filter(f => !SKIP.test(f));
let done=0, skip=0, before=0, after=0;
async function process(f){
  try{
    const buf = await fs.readFile(f);           // read fully → file handle closed
    const m = await sharp(buf).metadata();
    const stat = await fs.stat(f); before += stat.size;
    if ((m.width||0) <= MAXW && stat.size < 350_000){ skip++; after += stat.size; return; }
    let pipe = sharp(buf).rotate().resize({ width: Math.min(m.width||MAXW, MAXW), withoutEnlargement:true });
    if (m.format==='png') pipe = pipe.png({ compressionLevel:9, quality:82 });
    else if (m.format==='webp') pipe = pipe.webp({ quality:80 });
    else pipe = pipe.jpeg({ quality:80, mozjpeg:true });
    const out = await pipe.toBuffer();
    await fs.writeFile(f, out); after += out.length; done++;
  }catch(e){ console.error('ERR', f, e.message); }
}
// modest concurrency
let i=0; const workers = Array.from({length:4}, async()=>{ while(i<files.length){ await process(files[i++]); } });
await Promise.all(workers);
console.log(`optimized ${done}, skipped ${skip}, of ${files.length}`);
console.log(`size: ${(before/1e6).toFixed(1)}M -> ${(after/1e6).toFixed(1)}M`);
