// Central facility facts. Single source of truth for NAP consistency (an audit item).
// NOTE: the live site shows TWO phone numbers — (760) 762-3605 on the homepage/header
// and (760) 924-9419 on interior pages. Using the homepage number site-wide pending
// the client's confirmation of the correct primary line.
export const site = {
  name: 'New Beginnings Recovery',
  // Legal entity name used in notices/agreements. CONFIRM the exact registered
  // entity + suffix (LLC / Inc.) and any DBA with counsel before launch.
  legalName: 'New Beginnings Recovery', // [confirm registered legal entity]
  phone: '(760) 762-3605',
  phoneHref: 'tel:+17607623605',
  email: 'info@newbeginningsrecovery.com',
  addressLine: '34620 Via Josefina, Rancho Mirage, CA 92270',
  license: 'DHCS License #330232AP · Exp. 07/31/2027',
  serviceArea: 'Rancho Mirage · Palm Springs · Cathedral City · Indio · Coachella Valley',

  // Jurisdiction for Terms governing-law + §1557/CMIA references.
  governingState: 'California',
  county: 'Riverside County',

  // TTY / relay line shown on the ADA disability-communication contact. 711 is the
  // free national telecommunications relay; replace with a dedicated TTY line if one exists.
  tty: '711',

  // Compliance contact. Defaults to the main line/email as a placeholder — before
  // launch, set a named person and (recommended) a dedicated privacy@ mailbox.
  // NOTE: New Beginnings is private-pay and NOT a federal-funding recipient, so it is
  // NOT an ACA Section 1557 covered entity — no §1557 Coordinator / OCR-complaint
  // apparatus is required. The obligations that DO apply are HIPAA (NPP), the ADA
  // (disability communication aids, funding-independent), and California law (Unruh,
  // CCPA/CMIA). If the facility ever accepts Medi-Cal/Medicare/grants, add the full
  // §1557 scaffold back (Nondiscrimination Notice + top-15-language Language Assistance).
  privacyOfficer: {
    title: 'Privacy Officer',
    phone: '(760) 762-3605',
    phoneHref: 'tel:+17607623605',
    email: 'info@newbeginningsrecovery.com', // recommend: privacy@newbeginningsrecovery.com
  },

  // Intake delivery — CallTrackingMetrics FormReactor.
  // The form POSTs submissions to a CTM FormReactor webhook; CTM stores the lead under a
  // signed BAA and ties it to call-tracking/attribution. Admissions reads leads in CTM.
  // Set up: CTM → Settings → FormReactors → New FormReactor → copy the generated URL
  //   (format: https://app.calltrackingmetrics.com/api/v1/formreactor/FRT-XXXXXXXX)
  // Until formReactorUrl is set, every intake form renders the phone-only fallback, so we
  // never ship a form that transmits PHI to an unconfigured destination.
  // NOTE: confirm the CTM plan includes HIPAA + a signed BAA before going live.
  intake: {
    formReactorUrl: '', // paste the CTM FormReactor webhook URL — leave '' to keep the phone fallback
  },
};
