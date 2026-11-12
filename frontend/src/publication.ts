// Publication details shown in Settings. Presentation only.
//
// If a value is emptied its link is not shown, and a production EAS build
// refuses to start (scripts/check-publication.cjs).
// The policy page is published from docs/publication/site (gh-pages branch).

/** Public page of the privacy policy (GitHub Pages). */
export const PRIVACY_POLICY_URL = "https://bledenovan01-bit.github.io/Roundr/confidentialite/";

/** Official support address. */
export const SUPPORT_EMAIL = "roundrsupport@gmail.com";

export const APP_VERSION_LABEL = "Roundr · Version 1.0.0";

export function supportMailUrl(email: string = SUPPORT_EMAIL) {
  return `mailto:${email}?subject=${encodeURIComponent("Roundr 1.0.0 — assistance")}`;
}
