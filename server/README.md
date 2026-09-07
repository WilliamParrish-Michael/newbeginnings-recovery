# Secure intake — CallTrackingMetrics FormReactor

How the New Beginnings Recovery intake / insurance-verification forms deliver submissions.

## How it works

1. The visitor fills out the form on the static site.
2. On submit, the browser POSTs the fields over HTTPS directly to a **CTM FormReactor
   webhook URL** (`https://app.calltrackingmetrics.com/api/v1/formreactor/FRT…`).
3. **CTM ingests the lead**, stores it under a signed BAA, and ties it to call-tracking /
   marketing attribution. Admissions reads and works the lead **inside CTM**.
4. PHI never touches email in plaintext and never touches analytics/ad scripts — CTM is the
   single BAA-covered destination, which keeps the PHI/BAA surface small.

There is no self-hosted server to run: CTM is the destination. This directory is docs only.

## One-time setup

1. **Confirm the CTM plan includes HIPAA + sign the BAA.** CallTrackingMetrics stores lead
   data, so a BAA is required before any real submission flows through it.
2. In CTM: **Settings → FormReactors → New FormReactor.** Configure the response you want
   (e.g. instant click-to-call to an agent, or just log the lead + notify).
3. **Copy the generated FormReactor URL** and paste it into `src/lib/site.ts` →
   `intake.formReactorUrl`. Rebuild and deploy. Until it is set, every form renders the
   phone-only fallback (so we never ship a form pointing at an unconfigured destination).
4. **Map fields in CTM.** The form sends CTM standard fields `caller_name`, `phone_number`,
   `email`, `country_code`; all other fields (insurance, message, reason, `form_type`,
   `consent`) arrive as custom fields — map them to CTM custom fields as desired.

## HIPAA / BAA checklist (New Beginnings is a covered entity)

- [ ] **Signed BAA with CallTrackingMetrics** in place before go-live.
- [ ] **HTTPS only** for the form page and the FormReactor POST (both are already HTTPS).
- [ ] **No PHI in email** — notifications from CTM should be non-PHI ("new lead — log in");
      the readable PHI lives in the CTM dashboard behind login, not in an inbox.
- [ ] **Access control + audit** on the CTM account: unique logins per staff member, MFA,
      least-privilege roles, and use CTM's activity log.
- [ ] **Retention + deletion** policy for leads inside CTM.
- [ ] **The form page stays pixel-free** — no Meta/Google/ad tags on `/verify-insurance/` or
      `/contact/`. (The site gates analytics behind consent and keeps intake pages clean.)
- [ ] **42 CFR Part 2**: substance-use intake data has heightened consent/redisclosure rules —
      confirm CTM handling and any downstream routing with counsel.
- [ ] **Downstream integrations**: if CTM forwards leads onward (CRM, email, Zapier), every
      hop that receives PHI needs its own BAA. Keep the chain BAA-covered end to end.

## If CORS ever blocks the direct POST

FormReactor is built to receive posts from external web forms, so the browser POST should
work cross-origin. If a specific FormReactor config rejects it, add a tiny serverless relay
(on BAA-covered infra) that receives the form and forwards to the FormReactor URL server-side.

*Practitioner guidance, not legal advice — have counsel review the intake flow before launch.*
