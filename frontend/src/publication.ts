// Publication details shown in Settings. Presentation only.
//
// Both values are empty until the publisher provides them. While a value is
// empty its link is not shown. A production EAS build refuses to start until
// both are filled in (scripts/check-publication.cjs).

/** Public page of the privacy policy, e.g. "https://…/confidentialite". */
export const PRIVACY_POLICY_URL = "";

/** Dedicated support address, e.g. "assistance@…". */
export const SUPPORT_EMAIL = "";

export const APP_VERSION_LABEL = "Roundr · Version 1.0.0";

export function supportMailUrl(email: string = SUPPORT_EMAIL) {
  return `mailto:${email}?subject=${encodeURIComponent("Roundr 1.0.0 — assistance")}`;
}
