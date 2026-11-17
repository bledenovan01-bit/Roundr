// Échéances des notifications de fin (écran verrouillé). Exécuté par run-domain-tests.cjs.
const assert = require("node:assert/strict");
import * as S from "../src/domain/session";
import { beginMatch } from "../src/features/match-presentation";
import { lovableConfigTeams, lovableLaunchDefaults } from "../src/features/lovable-config-state";
import { buildSteps, createFreeTimer, pauseFree, startFree, type IntervalConfig } from "../src/domain/free-timer";
import { freeAlertPlan, matchAlertPlan, MAX_ALERTS } from "../src/notifications/end-alert-plan";

const prefs = { sounds: true, vibrations: true };
const t0 = 1_000_000;

// --- Match : rien tant que le chrono ne tourne pas ---------------------------
const config = lovableLaunchDefaults("classique");
// Comme startSession : la session s'ouvre prête, chrono à l'arrêt.
const created = S.createSession(config, lovableConfigTeams("classique", 2), t0);
const ready = { ...created, live: { ...created.live!, stage: "ready" as const, startedAt: 0, chrono: { ...created.live!.chrono, phase: "idle" as const, runningSince: null, accumulatedMs: 0 } } };
assert.equal(matchAlertPlan(ready, prefs), null);

const running = beginMatch(ready, t0);
const plan = matchAlertPlan(running, prefs)!;
assert.ok(plan, "un match lancé programme une échéance");
assert.equal(plan.alerts.length, 1);
const period = running.live!.periodMs[0];
assert.equal(plan.alerts[0].at, t0 + period, "fin = départ + durée de la période");
console.log("✓ Match lancé : une notification à la fin de la période");

// Échéance stable entre deux rafraîchissements (aucune reprogrammation inutile).
assert.deepEqual(matchAlertPlan({ ...running }, prefs), plan);

// Pause : plus d'échéance. Reprise : l'échéance tient compte du temps joué.
const paused = S.pause(running, t0 + 60_000);
assert.equal(matchAlertPlan(paused, prefs), null);
const resumed = S.resume(paused, t0 + 120_000);
assert.equal(matchAlertPlan(resumed, prefs)!.alerts[0].at, t0 + 120_000 + period - 60_000);
console.log("✓ Pause annule, reprise reprogramme avec le temps restant");

// Préférences : sons coupés -> notification silencieuse ; sons et vibrations coupés -> aucune.
assert.equal(matchAlertPlan(running, { sounds: false, vibrations: true })!.sound, false);
assert.equal(matchAlertPlan(running, { sounds: false, vibrations: false }), null);
console.log("✓ Préférences de son et de vibration respectées");

// --- Chrono libre ------------------------------------------------------------
const tabata: IntervalConfig = { kind: "interval", workMs: 20_000, restMs: 10_000, reps: 8, sets: 1, restBetweenSetsMs: 0, autoChain: true, endSignal: true, withTeams: false, display: "numeric", sounds: true };
const free = startFree(createFreeTimer(tabata), t0);
const freePlan = freeAlertPlan(free, prefs)!;
assert.equal(freePlan.alerts.length, Math.min(MAX_ALERTS, buildSteps(tabata).length));
assert.equal(freePlan.alerts[0].at, t0 + 20_000);
assert.equal(freePlan.alerts[1].at, t0 + 30_000);
assert.equal(freePlan.alerts.at(-1)!.body, "Fin du chrono.");
console.log("✓ Intervalles enchaînés : une notification par fin d'étape");

const manual = startFree(createFreeTimer({ ...tabata, autoChain: false }), t0);
assert.equal(freeAlertPlan(manual, prefs)!.alerts.length, 1, "passage manuel : seulement l'étape en cours");
assert.equal(freeAlertPlan(pauseFree(free, t0 + 5_000), prefs), null);
assert.equal(freeAlertPlan(startFree(createFreeTimer({ kind: "stopwatch", withTeams: false, display: "numeric", sounds: true }), t0), prefs), null);
assert.equal(freeAlertPlan(startFree(createFreeTimer({ ...tabata, endSignal: false }), t0), prefs), null);
console.log("✓ Pause, chronomètre et signal de fin désactivé : aucune notification");
