import { freeCarouselViews } from "../src/features/free-live-state";
import { matchPages } from "../src/features/match-presentation";
import { APP_VERSION_LABEL, supportMailUrl } from "../src/publication";
import type { Session } from "../src/domain/types";

const builtin = (
  process as unknown as { getBuiltinModule: (id: string) => any }
).getBuiltinModule;
const assert = builtin("assert/strict"),
  fs = builtin("fs"),
  path = builtin("path");
const root = path.join(path.dirname(process.argv[1]), "..");
const source = (file: string): string => fs.readFileSync(path.join(root, file), "utf8");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const check = require("./check-publication.cjs") as {
  read: () => { url?: string; email?: string };
  problems: (v: { url?: string; email?: string }) => string[];
};

// 1. Music card: unchanged where it exists, absent where it does not (Android).
const session = (mode: string, stage: string) =>
  ({ mode, live: { stage } }) as unknown as Session;
assert.deepEqual(matchPages(session("classique", "period")), ["digital", "ring", "music"]);
assert.deepEqual(matchPages(session("classique", "period"), false), ["digital", "ring"]);
assert.deepEqual(matchPages(session("maracana", "period"), false), ["digital", "ring", "next"]);
assert.deepEqual(matchPages(session("cup", "period"), false), ["digital", "ring", "tournament"]);
assert.deepEqual(matchPages(session("classique", "ready"), false), ["digital", "ring"]);
for (const stage of ["running", "paused", "waiting", "ended"]) {
  assert.deepEqual([...freeCarouselViews(stage)], ["numeric", "analog", "circular", "music"]);
  assert.deepEqual([...freeCarouselViews(stage, false)], ["numeric", "analog", "circular"]);
}
assert.match(source("src/music/availability.ts"), /Platform\.OS !== "android"/);
assert.match(source("src/components/lovable/match-ui.tsx"), /matchPages\(session, MUSIC_CARD_AVAILABLE\)/);
assert.match(source("src/features/lovable-free-live.tsx"), /freeCarouselViews\(stage, MUSIC_CARD_AVAILABLE\)/);

// 2. Settings: support by e-mail, privacy policy link, version label.
const settings = source("src/features/lovable-settings.tsx");
assert.doesNotMatch(settings, /github\.com/, "support no longer opens GitHub");
assert.doesNotMatch(settings, /Signaler un problème|Envoyer un retour|Roundr V0/);
assert.match(settings, /label="Contacter l'assistance"/);
assert.match(settings, /label="Politique de confidentialité"/);
assert.match(settings, /\{SUPPORT_EMAIL \? \(/, "no dead button while the address is unknown");
assert.match(settings, /\{PRIVACY_POLICY_URL \? \(/, "no dead link while the page is not online");
assert.equal(APP_VERSION_LABEL, "Roundr · Version 1.0.0");
assert.equal(
  supportMailUrl("aide@example.org"),
  "mailto:aide@example.org?subject=Roundr%201.0.0%20%E2%80%94%20assistance",
);
assert.equal(JSON.parse(source("app.json")).expo.version, "1.0.0", "label matches the published version");

// 3. A production build cannot start without the publisher details.
assert.deepEqual(check.problems({ url: "https://roundr.example/confidentialite", email: "aide@example.org" }), []);
assert.equal(check.problems({ url: "", email: "" }).length, 2);
assert.equal(check.problems({ url: "http://roundr.example", email: "aide@example.org" }).length, 1, "https only");
assert.equal(check.problems({ url: "https://roundr.example", email: "aide" }).length, 1);
assert.equal(check.problems({}).length, 1, "missing constants are reported");
const current = check.read();
assert.deepEqual(check.problems(current), [], "publisher details are complete");
assert.equal(current.email, "roundrsupport@gmail.com");
assert.equal(current.url, "https://bledenovan01-bit.github.io/Roundr/confidentialite/");
// The published page and the app must name the same contact.
const page = source("../docs/publication/site/confidentialite/index.html");
assert.match(page, /mailto:roundrsupport@gmail.com/);
assert.match(page, /Dénovan Blé EI/, "the publisher is named");
assert.match(page, /CNIL/, "the complaint route is stated");
assert.match(page, /GitHub, Inc./, "the host of the page is named");
assert.doesNotMatch(page, /[[^]]*(compléter|éditeur|adresse)[^]]*]/i, "no placeholder left on the public page");
assert.doesNotMatch(page, /<script|googletagmanager|analytics/i, "the policy page itself tracks nothing");
for (const file of ["index.html", "assistance/index.html", "confidentialite/index.html", "style.css", ".nojekyll"])
  assert.ok(fs.existsSync(path.join(root, "../docs/publication/site", file)), file);
const scripts = JSON.parse(source("package.json")).scripts;
assert.equal(scripts["eas-build-pre-install"], "node scripts/check-publication.cjs");
assert.match(source("scripts/check-publication.cjs"), /EAS_BUILD_PROFILE === "production"/);

console.log("✓ Publication: Android music card, support and privacy links, version label, production guard");
