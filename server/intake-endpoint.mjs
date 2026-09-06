// Self-hosted intake endpoint — receives END-TO-END-ENCRYPTED submissions.
//
// The browser has already sealed each submission to the facility's public key
// (libsodium crypto_box_seal), so THIS SERVER NEVER SEES PLAINTEXT PHI. It only
// stores opaque ciphertext and fires a non-PHI "new submission" notification.
// You decrypt later, offline, with tools/decrypt.mjs and your private key.
//
// Deploy this on infrastructure you control, over HTTPS, with a signed BAA in place
// (see README.md). Pure Node — no dependencies, no libsodium needed here.
//
//   Env:
//     PORT             port to listen on (default 8787)
//     ALLOWED_ORIGIN   exact site origin allowed to POST (CORS), e.g. https://newbeginningsrecovery.com
//     DATA_DIR         directory to write ciphertext files (default ./intake-data)
//     NOTIFY_WEBHOOK   optional https URL to POST a NON-PHI "new submission" ping to
import http from 'node:http';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const PORT = Number(process.env.PORT || 8787);
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || '';
const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), 'intake-data');
const NOTIFY_WEBHOOK = process.env.NOTIFY_WEBHOOK || '';
const MAX_BYTES = 64 * 1024; // reject anything larger than 64 KB

function cors(res, origin) {
  // Only reflect the configured origin; never use "*". If unset, deny cross-origin.
  if (ALLOWED_ORIGIN && origin === ALLOWED_ORIGIN) {
    res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

async function notify(meta) {
  if (!NOTIFY_WEBHOOK) return;
  try {
    await fetch(NOTIFY_WEBHOOK, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      // NON-PHI only: never include the ciphertext or any field values here.
      body: JSON.stringify({ text: `New encrypted ${meta.formType} submission received ${meta.ts}. Decrypt to view.` }),
    });
  } catch { /* notification is best-effort */ }
}

const server = http.createServer((req, res) => {
  const origin = req.headers.origin || '';
  cors(res, origin);
  if (req.method === 'OPTIONS') { res.writeHead(204); return res.end(); }
  if (req.method !== 'POST' || req.url !== '/intake') { res.writeHead(404); return res.end('Not found'); }
  if (ALLOWED_ORIGIN && origin && origin !== ALLOWED_ORIGIN) { res.writeHead(403); return res.end('Forbidden'); }

  let size = 0; const chunks = [];
  req.on('data', (c) => {
    size += c.length;
    if (size > MAX_BYTES) { res.writeHead(413); res.end('Too large'); req.destroy(); return; }
    chunks.push(c);
  });
  req.on('end', async () => {
    try {
      const body = JSON.parse(Buffer.concat(chunks).toString('utf8'));
      const { v, formType, ts, ciphertext } = body || {};
      if (v !== 1 || typeof ciphertext !== 'string' || !ciphertext) { res.writeHead(400); return res.end('Bad request'); }
      const safeType = String(formType || 'intake').replace(/[^a-z0-9-]/gi, '').slice(0, 40) || 'intake';
      const stamp = new Date().toISOString().replace(/[:.]/g, '-');
      const id = crypto.randomBytes(6).toString('hex');
      await fs.mkdir(DATA_DIR, { recursive: true, mode: 0o700 });
      const file = path.join(DATA_DIR, `${stamp}_${safeType}_${id}.json`);
      // Store ciphertext only. It is unreadable without the offline private key.
      await fs.writeFile(file, JSON.stringify({ v, formType: safeType, ts: ts || stamp, ciphertext }), { mode: 0o600 });
      await notify({ formType: safeType, ts: ts || stamp });
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true }));
    } catch {
      res.writeHead(400); res.end('Bad request');
    }
  });
});

server.listen(PORT, () => console.log(`intake endpoint listening on :${PORT} (POST /intake)`));
