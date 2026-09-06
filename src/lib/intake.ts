// Client-side end-to-end encryption for intake submissions.
//
// The visitor's browser encrypts the whole submission to the facility's PUBLIC key
// using a libsodium "sealed box" (crypto_box_seal) — anonymous-sender public-key
// encryption. The resulting ciphertext can only be opened by the holder of the
// matching PRIVATE key (kept offline by the facility). The endpoint that receives
// the POST therefore never sees plaintext PHI.
//
// This module is imported only by the intake-form island, so libsodium is bundled
// (self-hosted) and loaded only on the pages that actually have a form.
import _sodium from 'libsodium-wrappers';

export interface IntakeResult { ok: boolean; error?: string }

/** Encrypt a submission object to the facility public key and POST the ciphertext. */
export async function submitEncrypted(
  payload: Record<string, unknown>,
  opts: { publicKeyB64: string; endpoint: string; formType: string },
): Promise<IntakeResult> {
  try {
    if (!opts.publicKeyB64 || !opts.endpoint) {
      return { ok: false, error: 'Secure intake is not configured yet — please call us.' };
    }
    await _sodium.ready;
    const sodium = _sodium;

    const publicKey = sodium.from_base64(opts.publicKeyB64, sodium.base64_variants.ORIGINAL);
    const plaintext = sodium.from_string(JSON.stringify(payload));
    const sealed = sodium.crypto_box_seal(plaintext, publicKey);
    const ciphertext = sodium.to_base64(sealed, sodium.base64_variants.ORIGINAL);

    // Only non-PHI metadata travels in the clear: a form label and a timestamp.
    const res = await fetch(opts.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ v: 1, formType: opts.formType, ts: new Date().toISOString(), ciphertext }),
    });
    if (!res.ok) return { ok: false, error: `Submission failed (${res.status}).` };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: 'Could not encrypt or send your message. Please call us instead.' };
  }
}
