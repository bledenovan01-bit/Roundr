// Tests du Chrono libre (Phase 3). Exécuté par run-domain-tests.cjs.
const assert = require("node:assert/strict");
import {
  buildSteps, createFreeTimer, advanceFree, startFree, pauseFree, recordLap,
  resetTime, restartSession, lapExtremes, migrateCustomPreset, validFreePreset,
  defaultConfig, stepElapsed, nextStep,
  type IntervalConfig,
} from "../src/domain/free-timer";
import type { Preset } from "../src/domain/types";

// --- buildSteps ---------------------------------------------------------------
const tabata: IntervalConfig = { kind: "interval", workMs: 20_000, restMs: 10_000, reps: 8, sets: 1, restBetweenSetsMs: 60_000, autoChain: true, endSignal: true, withTeams: false, display: "numeric", sounds: true };
const tSteps = buildSteps(tabata);
// 8 work + 7 rest (pas de repos après le dernier effort), 1 série -> 15 steps
assert.strictEqual(tSteps.length, 15, `Tabata steps: ${tSteps.length}`);
assert.strictEqual(tSteps.filter(s => s.type === "work").length, 8);
assert.strictEqual(tSteps.filter(s => s.type === "rest").length, 7);
console.log("\u2713 Tabata = 8 efforts + 7 repos (15 steps)");

const twoSets: IntervalConfig = { ...tabata, reps: 4, sets: 2 };
const ts2 = buildSteps(twoSets);
// par série : 4 work + 3 rest = 7 ; 2 séries = 14 ; + 1 repos entre séries = 15
assert.strictEqual(ts2.length, 15, `2 séries: ${ts2.length}`);
assert.strictEqual(ts2.filter(s => s.type === "restSet").length, 1);
console.log("\u2713 Intervalles 2 séries : 1 repos de série");

assert.strictEqual(buildSteps(defaultConfig("stopwatch")).length, 1);
assert.strictEqual(buildSteps(defaultConfig("stopwatch"))[0].durationMs, null);
console.log("\u2713 Chronomètre = 1 step ouvert");

// --- stopwatch : tours + extrêmes + reset conserve le score -------------------
let sw = createFreeTimer(defaultConfig("stopwatch"));
sw = startFree(sw, 0);
sw = recordLap(sw, 5000);
sw = recordLap(sw, 8000);  // split 3000 (le plus rapide)
sw = recordLap(sw, 20000); // split 12000 (le plus lent)
assert.deepStrictEqual(sw.laps, [5000, 8000, 20000]);
const ex = lapExtremes(sw.laps);
assert.strictEqual(ex.fastest, 1, `fastest idx ${ex.fastest}`);
assert.strictEqual(ex.slowest, 2, `slowest idx ${ex.slowest}`);
console.log("\u2713 Tours : plus rapide/plus lent corrects");
sw.score = [2, 1];
const swReset = resetTime(sw, 20000);
assert.deepStrictEqual(swReset.laps, []);
assert.deepStrictEqual(swReset.score, [2, 1], "reset conserve le score");
const swRestart = restartSession(sw);
assert.deepStrictEqual(swRestart.score, [0, 0], "restart remet le score");
assert.strictEqual(swRestart.running, false);
console.log("\u2713 Reset conserve le score / Recommencer le remet à zéro");

// --- countdown : fin à zéro ---------------------------------------------------
let cd = createFreeTimer({ kind: "countdown", durationMs: 10_000, endSignal: true, withTeams: false, display: "numeric", sounds: true });
cd = startFree(cd, 0);
assert.strictEqual(advanceFree(cd, 5000).finished, false);
const cdDone = advanceFree(cd, 10_000);
assert.strictEqual(cdDone.finished, true, "compte à rebours terminé à zéro");
assert.strictEqual(cdDone.running, false);
console.log("\u2713 Compte à rebours : fin automatique à zéro");

// --- interval auto-chain : traverse plusieurs steps en un seul advance --------
let iv = createFreeTimer(tabata);
iv = startFree(iv, 0);
// à t=35s : work(20s) terminé + rest(10s) terminé -> dans le 2e effort (step 2)
const ivAdv = advanceFree(iv, 35_000);
assert.strictEqual(ivAdv.stepIndex, 2, `stepIndex après 35s: ${ivAdv.stepIndex}`);
assert.strictEqual(ivAdv.finished, false);
assert.ok(stepElapsed(ivAdv, 35_000) >= 0);
console.log("\u2713 Intervalles : auto-chaînage multi-steps en un seul advance");

// interval manuel : s'arrête en fin de step, attend nextStep
let ivm = createFreeTimer({ ...tabata, autoChain: false });
ivm = startFree(ivm, 0);
const ivmAdv = advanceFree(ivm, 25_000); // 1er effort (20s) dépassé
assert.strictEqual(ivmAdv.stepIndex, 0, "manuel : reste sur le step");
assert.strictEqual(ivmAdv.running, false, "manuel : en pause en fin de step");
const ivmNext = nextStep(ivmAdv, 25_000);
assert.strictEqual(ivmNext.stepIndex, 1);
console.log("\u2713 Intervalles manuel : attend le passage manuel");

// pause fige le temps
let p = createFreeTimer(defaultConfig("stopwatch"));
p = startFree(p, 0);
p = pauseFree(p, 7000);
assert.strictEqual(stepElapsed(p, 999999), 7000, "pause fige le temps");
console.log("\u2713 Pause fige le temps écoulé");

// --- migration non destructive ------------------------------------------------
const oldPreset = { id: "abc", name: "Mon custom", createdAt: 123, teams: null, config: { mode: "custom", totalMin: 12, periods: 2, periodSec: [360, 360], autoSplit: true, breakMin: 0, end: { byTime: true, goalTarget: null }, additional: false, score: true, sounds: true, customTeams: false, savePreset: false, presetName: "" } } as unknown as Preset;
const mig = migrateCustomPreset(oldPreset);
assert.ok(mig, "migration produit un preset");
assert.strictEqual(mig!.config.kind, "countdown");
assert.strictEqual((mig!.config as { durationMs: number }).durationMs, 720_000, "12 min -> 720000 ms");
assert.strictEqual(mig!.name, "Mon custom");
assert.ok(validFreePreset(mig), "preset migré valide");
console.log("\u2713 Migration Custom -> Mes chronos (compte à rebours équivalent)");

// validation rejette les mauvais
assert.strictEqual(validFreePreset({ id: "x", name: "y", createdAt: 1, config: { kind: "countdown", durationMs: -1 } }), false);
assert.strictEqual(validFreePreset(null), false);
console.log("\u2713 Validation Chrono libre rejette les données invalides");

console.log("Free timer scenarios passed");
