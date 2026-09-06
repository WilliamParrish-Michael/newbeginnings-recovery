// Decrypt intake submissions, offline, with your private key.
//   NBR_PRIVATE_KEY=<base64 private key> node tools/decrypt.mjs <file-or-dir>
//
// Example:
//   NBR_PRIVATE_KEY=... node tools/decrypt.mjs ./intake-data
//
// Run this ONLY on a machine you control. Never put the private key on the server.
import _sodium from 'libsodium-wrappers';
import { promises as fs } from 'node:fs';
import path from 'node:path';

const target = process.argv[2];
const privB64 = process.env.NBR_PRIVATE_KEY;
if (!target || !privB64) {
  console.error('Usage: NBR_PRIVATE_KEY=<base64> node tools/decrypt.mjs <file-or-dir>');
  process.exit(1);
}

await _sodium.ready;
const sodium = _sodium;
const priv = sodium.from_base64(privB64, sodium.base64_variants.ORIGINAL);
// crypto_box_seal_open needs both keys; derive the public key from the private key.
const pub = sodium.crypto_scalarmult_base(priv);

async function decryptFile(file) {
  const raw = JSON.parse(await fs.readFile(file, 'utf8'));
  const sealed = sodium.from_base64(raw.ciphertext, sodium.base64_variants.ORIGINAL);
  const opened = sodium.crypto_box_seal_open(sealed, pub, priv);
  if (!opened) throw new Error('decryption failed (wrong key?)');
  return { file: path.basename(file), formType: raw.formType, ts: raw.ts, data: JSON.parse(sodium.to_string(opened)) };
}

const stat = await fs.stat(target);
const files = stat.isDirectory()
  ? (await fs.readdir(target)).filter((f) => f.endsWith('.json')).map((f) => path.join(target, f))
  : [target];

for (const f of files.sort()) {
  try {
    const r = await decryptFile(f);
    console.log('\n─── ' + r.formType + '  ·  ' + r.ts + '  (' + r.file + ') ───');
    for (const [k, v] of Object.entries(r.data)) console.log('  ' + k + ': ' + v);
  } catch (e) {
    console.error('  ! ' + path.basename(f) + ': ' + e.message);
  }
}
console.log('');
