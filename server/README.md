# Secure intake — self-hosted, end-to-end encrypted

How the New Beginnings Recovery intake / insurance-verification forms handle PHI.

## How it works

1. **In the visitor's browser**, the form encrypts the whole submission to the facility's
   **public key** using a libsodium *sealed box* (`crypto_box_seal`). Plaintext never leaves
   the device except as ciphertext.
2. The browser POSTs only the **ciphertext** (plus non-PHI metadata: a form label and a
   timestamp) to `server/intake-endpoint.mjs`, which you host.
3. The **endpoint stores ciphertext it cannot read** and sends a *non-PHI* "new submission"
   notification. It never has the private key, so it can never see PHI.
4. **You** decrypt submissions later, offline, with `tools/decrypt.mjs` and the private key.

Because the endpoint only ever holds ciphertext, the PHI/BAA surface is minimized — but treat
the hosting infrastructure as handling PHI and put the safeguards below in place anyway.

## One-time setup

1. **Generate the keypair** on a machine you control:
   ```
   node tools/gen-keypair.mjs
   ```
   - Paste the **public key** into `src/lib/site.ts` → `intake.publicKey` (safe to commit).
   - Store the **private key** offline and secret (password manager / offline vault).
     Never commit it, never put it on the server. If lost, submissions are unrecoverable.

2. **Deploy the endpoint** (`server/intake-endpoint.mjs`) to infrastructure you control, over
   HTTPS, with these env vars:
   - `ALLOWED_ORIGIN` = your exact site origin, e.g. `https://newbeginningsrecovery.com`
   - `DATA_DIR` = a writable directory on encrypted storage (e.g. `/var/intake-data`)
   - `NOTIFY_WEBHOOK` = optional; a URL to receive a NON-PHI "new submission" ping
   - `PORT` = as needed behind your TLS terminator / reverse proxy
   It is pure Node (no dependencies): `node server/intake-endpoint.mjs`.

3. **Point the site at it**: set `src/lib/site.ts` → `intake.endpoint` to the deployed URL
   (e.g. `https://api.newbeginningsrecovery.com/intake`). Rebuild and deploy the site.
   Until BOTH `publicKey` and `endpoint` are set, every form renders the phone-only fallback.

## Reading submissions

```
NBR_PRIVATE_KEY=<base64 private key> node tools/decrypt.mjs /var/intake-data
```
Run only on a machine you control. Never place the private key on the server.

## HIPAA / BAA checklist (New Beginnings is a covered entity)

- [ ] **Sign a BAA** with the infrastructure provider hosting the endpoint (AWS, Google Cloud,
      Azure, and Cloudflare all offer BAAs on eligible plans) before it goes live.
- [ ] **HTTPS/TLS only** to the endpoint; HSTS on the API host; modern ciphers.
- [ ] **Encrypted storage at rest** for `DATA_DIR`; restrict file permissions (the endpoint
      writes `0600`) and OS access to the box.
- [ ] **No PHI in logs or notifications** — the notification is intentionally non-PHI; keep it that way.
- [ ] **Access control + audit** on the server and on wherever you run `decrypt.mjs`.
- [ ] **Retention + deletion** schedule for decrypted data and stored ciphertext.
- [ ] **The form page stays pixel-free** — no Meta/Google/ad tags on `/verify-insurance/` or
      `/contact/`. (The site already gates analytics behind consent and keeps intake pages clean.)
- [ ] **42 CFR Part 2**: substance-use intake data has heightened consent/redisclosure rules —
      confirm handling with counsel.
- [ ] **Rotate keys** if the private key is ever exposed (generate a new pair; old ciphertext
      stays readable only with the old private key).

*Practitioner guidance, not legal advice — have counsel review the intake flow before launch.*
