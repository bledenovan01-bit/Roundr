const assert = require("node:assert/strict");
import { defaultConfig, defaultTeams } from "../src/domain/defaults";
import * as S from "../src/domain/session";
import { elapsedMs } from "../src/chrono/engine";
import { sessionShareText } from "../src/features/share-summary";

const fs = require("node:fs"), path = require("node:path");
const root = path.join(path.dirname(process.argv[1]), "..");
const source = (file: string): string => fs.readFileSync(path.join(root, file), "utf8");

const memory = new Map<string, string>();
const storage = {
  async getAllKeys() { return [...memory.keys()]; },
  async getItem(key: string) { return memory.get(key) ?? null; },
  async setItem(key: string, value: string) { memory.set(key, value); },
  async removeItem(key: string) { memory.delete(key); },
  async multiGet(keys: string[]) { return keys.map((k) => [k, memory.get(k) ?? null]); },
  async multiSet(pairs: [string, string][]) { for (const [k, v] of pairs) memory.set(k, v); },
  async multiRemove(keys: string[]) { for (const k of keys) memory.delete(k); },
};
(globalThis as any).__roundrTestModules = {
  "@react-native-async-storage/async-storage": storage,
  "react": { useSyncExternalStore: () => {} },
  "@/src/audio/sounds": { playSound: async () => {} },
  "@/src/haptics": { selectionAsync: async () => {} },
};
const Theme = require("../src/visual/lovable") as typeof import("../src/visual/lovable");
const req = require("node:module").createRequire(process.argv[1]);
const loadPrefs = () => {
  delete req.cache[req.resolve("../src/store/preferences")];
  return req("../src/store/preferences") as typeof import("../src/store/preferences");
};

(async () => {
  // 1. Two complete palettes with the same roles; dark is the reference and the default.
  assert.deepEqual(Object.keys(Theme.palettes.light).sort(), Object.keys(Theme.palettes.dark).sort());
  assert.equal(Theme.themeName(), "dark");
  assert.equal(Theme.lovable.background, "#020909");
  assert.equal(Theme.palettes.dark.primary, "#6ce182");
  for (const [role, value] of Object.entries(Theme.palettes.light)) assert.ok(/^#[0-9a-f]{6}$|^rgba\(/.test(value), role);
  // The logo ball keeps its green in both themes.
  assert.equal(Theme.brand.ball, "#6ce182");
  assert.equal(Theme.brand.ink, "#020909");
  assert.equal(Theme.brand.paper, "#edf3f0");

  // 2. Contrast of the light theme: text and commands stay readable (WCAG AA, 4.5:1).
  const luminance = (hex: string) => {
    const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  };
  const contrast = (a: string, b: string) => { const [x, y] = [luminance(a), luminance(b)].sort((m, n) => n - m); return (x + 0.05) / (y + 0.05); };
  for (const name of ["dark", "light"] as const) {
    const p = Theme.palettes[name];
    assert.ok(contrast(p.foreground, p.background) >= 7, `${name}: text on page`);
    assert.ok(contrast(p.foreground, p.card) >= 7, `${name}: text on card`);
    assert.ok(contrast(p.muted, p.card) >= 4.5, `${name}: secondary text on card`);
    assert.ok(contrast(p.muted, p.background) >= 4.5, `${name}: secondary text on page`);
    assert.ok(contrast(p.onPrimary, p.primary) >= 4.5, `${name}: label on the main command`);
    assert.ok(contrast(p.primary, p.card) >= 3, `${name}: command colour against a card`);
    // The dark red is the Lovable reference: bold 16 px label, held to the 3:1 bar.
    assert.ok(contrast(p.onError, p.error) >= (name === "light" ? 4.5 : 3), `${name}: label on the destructive command`);
    assert.ok(contrast(p.amber, p.card) >= 4.5, `${name}: paused state`);
  }
  // Text on the photo is light on a dark veil in both themes.
  assert.ok(contrast(Theme.brand.paper, Theme.brand.ink) >= 7);

  // 3. Styles declared at module level follow the theme.
  let builds = 0;
  const styles = Theme.themed(() => { builds++; return { card: { backgroundColor: Theme.lovable.card }, text: { color: Theme.lovable.foreground } }; });
  assert.equal(styles.card.backgroundColor, "#091516");
  assert.equal(builds, 1);
  void styles.text.color;
  assert.equal(builds, 1, "built once per theme");
  let notified = 0;
  const unsubscribe = Theme.subscribeTheme(() => { notified++; });
  Theme.applyTheme("light");
  assert.equal(Theme.themeName(), "light");
  assert.equal(Theme.lovable.background, Theme.palettes.light.background);
  assert.equal(styles.card.backgroundColor, "#ffffff", "rebuilt for the light theme");
  assert.deepEqual(Object.keys(styles), ["card", "text"], "a themed style can be spread");
  assert.equal(notified, 1);
  Theme.applyTheme("light");
  assert.equal(notified, 1, "no notification when nothing changes");
  Theme.applyTheme("dark");
  assert.equal(styles.card.backgroundColor, "#091516");
  unsubscribe();
  assert.equal(Theme.isThemeName("light"), true);
  assert.equal(Theme.isThemeName("blue"), false);

  // 4. The choice is stored with the preferences and restored after a restart.
  let Prefs = loadPrefs();
  await Prefs.loadPreferences();
  assert.equal(Prefs.getPreferences().theme, "dark", "dark by default");
  await Prefs.setPreferences({ theme: "light" });
  assert.equal(Theme.themeName(), "light", "applied immediately");
  assert.equal(JSON.parse(memory.get("roundr.preferences.v1")!).theme, "light");
  Theme.applyTheme("dark"); // a fresh process starts dark…
  Prefs = loadPrefs();
  await Prefs.loadPreferences();
  assert.equal(Prefs.getPreferences().theme, "light");
  assert.equal(Theme.themeName(), "light", "…and the saved choice is applied on load");
  // An unknown saved value falls back to dark and keeps the other preferences.
  memory.set("roundr.preferences.v1", JSON.stringify({ theme: "sepia", sounds: false, screenSleepVersion: 2 }));
  Theme.applyTheme("dark");
  Prefs = loadPrefs();
  await Prefs.loadPreferences();
  assert.equal(Prefs.getPreferences().theme, "dark");
  assert.equal(Prefs.getPreferences().sounds, false);
  // Older saved preferences have no theme at all.
  memory.set("roundr.preferences.v1", JSON.stringify({ volume: 0.4, screenSleepVersion: 2 }));
  Prefs = loadPrefs();
  await Prefs.loadPreferences();
  assert.equal(Prefs.getPreferences().theme, "dark");
  assert.equal(Prefs.getPreferences().volume, 0.4);

  // 5. Changing the appearance during a match keeps the clock, the score and the progress.
  memory.clear();
  const Store = require("../src/store/session-store") as typeof import("../src/store/session-store");
  await Store.loadStore();
  Prefs = loadPrefs();
  await Prefs.loadPreferences();
  const t0 = 1_800_000_000_000;
  const config = { ...defaultConfig("classique") } as import("../src/domain/types").ClassicConfig;
  assert.ok(Store.startSession(S.createSession(config, defaultTeams("classique", 2), t0)));
  Store.dispatchSession((s) => S.startReady(s, t0));
  Store.dispatchSession((s) => S.goal(s, 0, 1, t0 + 60_000));
  const before = JSON.stringify(Store.getStoreState().session);
  const elapsedBefore = elapsedMs(Store.getStoreState().session!.live!.chrono, t0 + 90_000);
  await Prefs.setPreferences({ theme: "light" });
  await Prefs.setPreferences({ theme: "dark" });
  await Prefs.setPreferences({ theme: "light" });
  const after = Store.getStoreState().session!;
  assert.equal(JSON.stringify(after), before, "the session is untouched by theme changes");
  assert.deepEqual(after.live!.score, [1, 0]);
  assert.equal(after.live!.stage, "period");
  assert.equal(elapsedMs(after.live!.chrono, t0 + 90_000), elapsedBefore, "the clock did not stop or jump");
  assert.equal(elapsedBefore, 90_000);
  // The theme module and the screen wrapper never reach the session or the timers.
  assert.doesNotMatch(source("src/visual/lovable.ts"), /from "@\/src\/(chrono|domain|store)/);
  const layout = source("app/_layout.tsx");
  assert.match(layout, /screenLayout=\{\(\{ children \}\) => <ThemeBoundary>\{children\}<\/ThemeBoundary>\}/);
  assert.match(layout, /<SessionRuntime \/>\s*<FreeTimerRuntime \/>\s*<StatusBar/, "the timers run outside the rebuilt screens");
  assert.match(source("src/features/lovable-settings.tsx"), /setPreferences\(\{ theme \}\)/);

  // 6. Share text: computed from the real result, for a win, a draw and a match without score.
  let s = S.createSession(config, defaultTeams("classique", 2), t0);
  s = S.startReady(s, t0);
  s = S.goal(s, 0, 1, t0 + 1000);
  s = S.goal(s, 0, 1, t0 + 2000);
  s = S.goal(s, 1, 1, t0 + 3000);
  s = S.endManual(s, t0 + 600_000);
  const names = s.teams.map((t) => t.name);
  const win = sessionShareText(s);
  assert.match(win, /^Roundr · Match classique\n/);
  assert.ok(win.includes(`${names[0]} 2 – 1 ${names[1]}`), win);
  assert.ok(win.includes(`Victoire ${names[0]}`), win);
  assert.match(win, /Durée jouée : 10 min 00 s/);
  let d = S.createSession(config, defaultTeams("classique", 2), t0);
  d = S.endManual(S.startReady(d, t0), t0 + 5000);
  const drawText = sessionShareText(d);
  assert.ok(drawText.includes("0 – 0") && drawText.includes("Match nul"), drawText);
  let n = S.createSession({ ...config, score: false }, defaultTeams("classique", 2), t0);
  n = S.endManual(S.startReady(n, t0), t0 + 5000);
  const noScore = sessionShareText(n);
  assert.ok(noScore.includes(`${names[0]} vs ${names[1]}`) && !noScore.includes("–"), noScore);
  assert.doesNotMatch(noScore, /Victoire|Match nul/);

  console.log("✓ Theme: two palettes, contrast, saved choice, match state kept across theme changes, share text");
})().catch((error) => { console.error(error); process.exit(1); });
