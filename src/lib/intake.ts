// Intake submission → CallTrackingMetrics FormReactor.
//
// The form POSTs directly to a CTM FormReactor webhook URL. CTM ingests the lead,
// stores it under a signed BAA, and ties it to call-tracking/attribution; admissions
// reads leads inside CTM. Because CTM is the BAA-covered destination, no client-side
// encryption is needed — the connection is HTTPS and PHI never touches analytics/ads.
//
// FormReactor accepts a standard set of fields (caller_name, phone_number, email,
// country_code); any other fields are captured as custom fields. We POST
// x-www-form-urlencoded to avoid a CORS preflight (FormReactor is designed to receive
// posts from external web forms, e.g. Jotform/Elementor).

export interface IntakeResult { ok: boolean; error?: string }

// Map our form field names → CTM standard field names. Anything not listed here is
// forwarded as-is and lands in CTM as a custom field.
const STANDARD: Record<string, string> = {
  fullName: 'caller_name',
  name: 'caller_name',
  phone: 'phone_number',
  email: 'email',
};

/** POST an intake submission to the CTM FormReactor webhook. */
export async function submitToCTM(
  payload: Record<string, unknown>,
  opts: { formReactorUrl: string; formType: string },
): Promise<IntakeResult> {
  if (!opts.formReactorUrl) {
    return { ok: false, error: 'Online intake is not configured yet — please call us.' };
  }
  try {
    const body = new URLSearchParams();
    body.set('country_code', '1'); // US default; CTM expects a country code with the number
    body.set('form_type', opts.formType);
    for (const [k, v] of Object.entries(payload)) {
      if (v == null || v === '') continue;
      body.set(STANDARD[k] ?? k, String(v));
    }
    const res = await fetch(opts.formReactorUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });
    if (!res.ok) return { ok: false, error: `Submission failed (${res.status}). Please call us.` };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: 'Could not send your message. Please call us instead.' };
  }
}
