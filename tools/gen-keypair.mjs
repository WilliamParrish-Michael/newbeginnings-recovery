// Generate the intake keypair. RUN THIS ONCE, on a machine you control.
//   node tools/gen-keypair.mjs
//
// - Paste the PUBLIC key into src/lib/site.ts -> intake.publicKey (safe to commit).
// - Keep the PRIVATE key OFFLINE and SECRET. Never commit it, never put it on the
//   server, never paste it into the site. It is the only thing that can decrypt
//   submissions; if you lose it, past submissions are unrecoverable.
import _sodium from 'libsodium-wrappers';

await _sodium.ready;
const sodium = _sodium;
const kp = sodium.crypto_box_keypair();
const pub = sodium.to_base64(kp.publicKey, sodium.base64_variants.ORIGINAL);
const priv = sodium.to_base64(kp.privateKey, sodium.base64_variants.ORIGINAL);

console.log('\n=== New Beginnings intake keypair ===\n');
console.log('PUBLIC KEY  (put in src/lib/site.ts -> intake.publicKey):\n');
console.log('  ' + pub + '\n');
console.log('PRIVATE KEY (keep OFFLINE + SECRET — never commit, never deploy):\n');
console.log('  ' + priv + '\n');
console.log('Store the private key in a password manager / offline vault. You will paste it');
console.log('into tools/decrypt.mjs (via the NBR_PRIVATE_KEY env var) to read submissions.\n');
