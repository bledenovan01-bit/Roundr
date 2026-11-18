// Validated V0 mockup (Roundr-maquettes-validees.pdf): match bar, intro and logo.
import geometry from "../assets/images/logo-geometry.json";
import { palettes } from "../src/visual/lovable";

const builtin = (process as unknown as { getBuiltinModule: (id: string) => any }).getBuiltinModule;
const assert = builtin("assert/strict"),
  fs = builtin("fs"),
  path = builtin("path");
const root = path.join(path.dirname(process.argv[1]), "..");
const source = (file: string): string => fs.readFileSync(path.join(root, file), "utf8");

const match = source("src/features/lovable-match.tsx");

// 1. Before the first kick-off: Démarrer alone, full width.
assert.match(match, /const beforeKickoff = l\.stage === "ready";/);
assert.match(match, /beforeKickoff && !locked \? \([\s\S]*?testID="match-start" label="Démarrer"/);

// 2. In play / paused: one row, in this exact order.
const row = match.slice(match.indexOf('testID="match-bar"'));
const order = ['testID="match-lock"', "<KeepAwakeControl compact", 'testID="match-end"', 'testID="match-restart"', 'testID="match-pause"'].map(id => row.indexOf(id));
assert.ok(order.every(i => i > 0), "every command is in the bar");
assert.deepEqual([...order].sort((a, b) => a - b), order, "Verrouillage · Veille · Fin · Relancer · Pause/Reprendre");
assert.doesNotMatch(row.slice(0, row.indexOf("</View>\n        )}")), /flexWrap/, "the bar never wraps to a second row");

// 3. Lock: icon only, open/closed padlock, unlock from the same button; the clock keeps running.
assert.match(row, /icon=\{locked \? "lock" : "unlock"\}/);
assert.match(row, /accessibilityLabel=\{locked \? "Déverrouiller les commandes" : "Verrouiller les commandes"\}/);
assert.match(row, /onPress=\{\(\) => setLocked\(value => !value\)\}/);
assert.doesNotMatch(match, /onLongPress=\{\(\) => \{\s*lockHeld/, "the gear no longer locks");
assert.doesNotMatch(match, /setLocked[^\n]*S\.pause/, "locking never pauses the clock");

// 4. Sleep: icon only, outline sun = sleep allowed, filled sun = screen kept on; same preference as Settings.
const keepAwake = source("src/components/lovable/keep-awake-control.tsx");
assert.match(keepAwake, /icon=\{on \? "sunFilled" : "sun"\}/);
assert.match(source("src/components/lovable/match-ui.tsx"), /fill=\{name === "sunFilled" \? color : "none"\}/);
assert.match(keepAwake, /accessibilityRole="switch"/);
assert.match(keepAwake, /checked=\{on\}/);

// 5. Fin: red in both themes and the existing end confirmation; Relancer keeps the reset confirmation.
assert.match(row, /label="Fin"\s+tone="danger"[\s\S]*?onPress=\{finish\}/);
assert.match(match, /Alert\.alert\("Terminer le match \?"/);
assert.match(row, /label="Relancer"[\s\S]*?onPress=\{restart\}/);
assert.match(match, /confirmMatchRestart\(/);
for (const theme of ["dark", "light"] as const) {
  const p = palettes[theme];
  const [r, g, b] = [1, 3, 5].map(i => parseInt(p.dangerText.slice(i, i + 2), 16));
  assert.ok(r > g + 40 && r > b + 40, theme + ": Fin label is red");
}

// 6. The restart undo is a one-off notice, not a second bar row; the abandon path stays reachable.
assert.match(match, /<LiveNoticeBanner[\s\S]*?action=\{\{[\s\S]*?Annuler la remise à zéro/);
assert.match(match, /testID="match-options-stop" label="Arrêter la session"/);
assert.match(match, /editable \? \([\s\S]*?Modifier les réglages du match/);
assert.doesNotMatch(match, /Alerte 1 min/);

// 7. Logo: ball diameter 0.22 em, bottom on the baseline, same gap on wordmarks and icon.
assert.equal(geometry.wordBallRadiusPerSize, geometry.iconBallRadiusPerSize);
assert.equal(geometry.wordGapPerSize, geometry.iconGapPerSize);
assert.equal(geometry.wordBallRadiusPerSize, 0.11);
const wordmark = source("src/components/lovable/wordmark.tsx");
assert.match(wordmark, /marginBottom: size \* MANROPE_DESCENT/);
assert.doesNotMatch(wordmark, /raiseBall/, "one ball position for home and intro");

// 8. Intro: validated photo and exact copy.
const intro = source("src/components/lovable/intro.tsx");
assert.match(intro, /source=\{INTRO_PHOTO\}/);
assert.match(source("src/components/lovable/pitch-photo.tsx"), /INTRO_PHOTO = require\("\.\.\/\.\.\/\.\.\/assets\/images\/roundr-intro-hd\.png"\)/);
assert.ok(intro.includes('{"Plus de jeu.\\nMoins d’organisation."}'));
assert.ok(intro.includes('{"Du coup d’envoi au dernier but,\\ngarde le fil du match."}'));
assert.ok(fs.statSync(path.join(root, "assets/images/roundr-intro-hd.png")).size > 1_000_000);

// 9. Chrono libre: same bar, same order, same labels; lap and skip stay outside the bar.
const free = source("src/features/lovable-free-live.tsx");
const freeBar = free.slice(free.indexOf('testID="free-bar"'));
const freeOrder = ['testID="free-lock"', "<KeepAwakeControl compact", 'testID="free-end"', 'testID="free-restart"', 'testID="free-pause"'].map(id => freeBar.indexOf(id));
assert.ok(freeOrder.every(i => i > 0), "every command is in the free bar");
assert.deepEqual([...freeOrder].sort((a, b) => a - b), freeOrder, "same order as the match bar");
assert.match(freeBar, /label="Fin"\s+tone="danger"/);
assert.match(freeBar, /label="Relancer"/);
assert.match(free, /testID=\{isStopwatch \? "free-lap" : "free-skip"\}/);
assert.doesNotMatch(free, /onLongPress/, "the gear no longer locks");

// 10. Summaries: Rejouer is the main green action; home is quiet red with a house.
for (const file of ["src/features/lovable-match.tsx", "src/features/lovable-maracana-summary.tsx"]) {
  const src = source(file);
  assert.match(src, /testID="result-replay"\s+label="Rejouer"\s+icon="restart"\s+(disabled=\{[^}]*\}\s+)?onPress/, file + ": Rejouer is primary");
  assert.match(src, /testID="result-home"\s+label="Retour à l’accueil"\s+icon="home"\s+kind="secondary"\s+danger/, file);
  assert.match(src, /testID="result-share"\s+label="Partager le résumé"\s+icon="share"\s+kind="secondary"/, file);
}
assert.match(match, /testID="maracana-home"\s+label="Retour à l’accueil"\s+icon="home"\s+kind="text"/);

// 11. Home: HD photo banner, no chevron on mode cards, small "?" with a 44 pt target.
assert.match(source("app/index.tsx"), /<HomeBannerPhoto \/>/);
const card = source("src/components/mode-card.tsx");
assert.match(card, /\{onHelp \? null : <LovableIcon name="chevron"/);
assert.match(card, /help: \{ width: 44, height: 44/);
assert.match(card, /helpMark: \{ width: 24, height: 24/);

console.log("✓ V0 mockup: one-row match bar, lock/sleep icons, red Fin, undo notice, aligned logo ball and intro");
