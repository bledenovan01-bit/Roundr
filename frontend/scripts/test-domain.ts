// Tests du moteur de session avec horloge contrôlée.
//   npx tsx /app/frontend/scripts/test-domain.ts
import { defaultConfig, defaultTeams } from "../src/domain/defaults";
import * as S from "../src/domain/session";
import { byeCount } from "../src/domain/bracket";
import { computeStandings } from "../src/domain/standings";
import { recommendCup, validateCupStructure } from "../src/domain/cup";
import { splitPeriods } from "../src/domain/custom-split";
import type { AnyConfig, Session } from "../src/domain/types";

let failures = 0;
function check(label: string, cond: boolean, extra?: unknown) {
  if (cond) console.log(`✓ ${label}`);
  else {
    failures++;
    console.log(`✗ ${label}`, extra ?? "");
  }
}
const MIN = 60_000;
function make(cfg: AnyConfig, count: number, now = 1_000_000): Session {
  return S.createSession(cfg, defaultTeams(cfg.mode, count), now);
}
function playTo(s: Session, result: [number, number], now: number): Session {
  // marque le score puis termine manuellement
  let x = s;
  for (let i = 0; i < result[0]; i++) x = S.goal(x, 0, 1, now);
  for (let i = 0; i < result[1]; i++) x = S.goal(x, 1, 1, now);
  return S.endManual(x, now);
}

// --- Classique 45 min / 2 périodes (AC03/AC04/AC05) ---
{
  const cfg = { ...defaultConfig("classique"), totalMin: 45, periods: 2, breakMin: 5 } as AnyConfig;
  let s = make(cfg, 2);
  check("classique 45/2 : périodes 22:30", s.live!.periodMs[0] === 22.5 * MIN && s.live!.periodMs.length === 2);
  s = S.pause(s, 1_000_000 + 6 * MIN + 42_000);
  s = S.resume(s, 1_000_000 + 7 * MIN + 2_000);
  s = S.advance(s, 1_000_000 + 7 * MIN + 3_000);
  check("pause 20 s non jouée", S.livePlayedMs(s.live!, 1_000_000 + 7 * MIN + 3_000) === 6 * MIN + 43_000);
  s = S.advance(s, 1_000_000 + 25 * MIN); // zéro franchi pendant absence
  check("fin de période → pause chronométrée", s.live!.stage === "break", s.live!.stage);
  s = S.advance(s, 1_000_000 + 60 * MIN);
  check("pause terminée → attente reprise", s.live!.stage === "awaitPeriod" && s.live!.periodIndex === 1);
  s = S.startNextPeriod(s, 2_000_000);
  s = S.goal(s, 0, 1, 2_000_000 + MIN);
  s = S.advance(s, 2_000_000 + 30 * MIN);
  check("dernière période → match terminé une fois", s.live!.stage === "finished" && s.matches[0].status === "finished");
  check("durée jouée 45:00", s.matches[0].playedMs === 45 * MIN, s.matches[0].playedMs);
  check("score cumulé 1-0", s.matches[0].score?.[0] === 1 && s.matches[0].winnerId === "t1");
  const again = S.advance(s, 2_000_000 + 90 * MIN);
  check("advance idempotent après fin", again === s);
}

// --- Classique additionnel (AC07) ---
{
  const cfg = { ...defaultConfig("classique"), totalMin: 10, additional: true } as AnyConfig;
  let s = make(cfg, 2);
  s = S.advance(s, 1_000_000 + 11 * MIN);
  check("additionnel ouvert à zéro", s.live!.stage === "additional");
  s = S.endManual(s, 1_000_000 + 12 * MIN);
  check("fin manuelle : 12 min jouées", s.matches[0].playedMs === 12 * MIN, s.matches[0].playedMs);
}

// --- Maracana 3 (AC11, AC16-19, AC52) ---
{
  const cfg = { ...defaultConfig("maracana"), matchMin: 8, end: { byTime: true, goalTarget: 3 } } as AnyConfig;
  let s = make(cfg, 3);
  const t0 = 1_000_000;
  s = S.goal(s, 0, 1, t0 + MIN);
  s = S.goal(s, 0, 1, t0 + 2 * MIN);
  s = S.goal(s, 1, 1, t0 + 3 * MIN);
  s = S.goal(s, 0, 1, t0 + 4 * MIN + 20_000);
  check("AC11 premier à 3 : fin immédiate à 04:20", s.live!.stage === "finished" && s.matches[0].playedMs === 4 * MIN + 20_000, s.matches[0].playedMs);
  check("AC16 : A reste, B sort, prochain A–C", s.matches[1] && (s.matches[1].a as { teamId: string }).teamId === "t1" && (s.matches[1].b as { teamId: string }).teamId === "t3");
  // AC52 : annuler le but décisif
  const corrected = S.correctLast(s, 0, -1, t0 + 5 * MIN);
  check("AC52 : match restauré en pause à 04:20", corrected.live!.stage === "period" && S.isPaused(corrected.live!) && S.livePlayedMs(corrected.live!, t0 + 9 * MIN) === 4 * MIN + 20_000 && corrected.matches.length === 1);
  // Continue : lancer match 2, nul 1-1 → A (présent depuis plus longtemps) sort
  s = S.launchNext(s, t0 + 10 * MIN);
  check("match 2 live A–C", S.liveTeams(s)[0]?.id === "t1" && S.liveTeams(s)[1]?.id === "t3");
  s = playTo(s, [1, 1], t0 + 15 * MIN);
  check("AC17 : nul → A sort, C reste", s.maracana!.lastOut[0] === "t1" && s.maracana!.onField.includes("t3") && s.maracana!.onField.includes("t2"));
  // Match 3 : 0-0 au temps → extension 2 min
  s = S.launchNext(s, t0 + 20 * MIN);
  s = S.advance(s, t0 + 29 * MIN);
  check("AC18 : 0-0 → extension 2 min", s.live!.stage === "extra" && s.live!.extraMs === 2 * MIN && s.live!.extensionUsed);
  const goalExt = S.goal(s, 1, 1, t0 + 29 * MIN);
  check("AC19 : but en extension = fin immédiate", goalExt.live!.stage === "finished" && goalExt.matches[2].winnerId === goalExt.maracana!.onField[0]);
  s = S.advance(s, t0 + 32 * MIN);
  check("AC18 : 0-0 après extension = nul enregistré", s.live!.stage === "finished" && s.matches[2].winnerId === null && s.matches[2].playedMs === 10 * MIN, s.matches[2].playedMs);
  const rows = computeStandings(["t1", "t2", "t3"], s.matches);
  check("AC24 classement : points calculés", rows.reduce((a, r) => a + r.points, 0) === 3 + 1 + 1 + 1 + 1, rows);
  // AC22 : ajout 4e équipe → rotation 4+
  s = S.addMaracanaTeam(s, { id: "t4", name: "Équipe 4", color: "#fff" }, t0 + 33 * MIN);
  check("AC22 : 4 équipes, résultats conservés", s.teams.length === 4 && s.matches.filter((m) => m.status === "finished").length === 3);
  const next = s.matches[s.matches.length - 1];
  const ids = [(next.a as { teamId: string }).teamId, (next.b as { teamId: string }).teamId];
  check("AC22 : les deux sortantes exclues", !ids.some((id) => s.maracana!.lastOut.includes(id)) && ids.includes("t4"), ids);
  for (let i = 0; i < 5; i++) s = S.addMaracanaTeam(s, { id: `x${i}`, name: "x", color: "#fff" }, t0);
  check("AC23 : pas plus de 8", s.teams.length <= 8);
}

// --- Maracana 5 (AC20/AC21) ---
{
  let s = make(defaultConfig("maracana"), 5);
  const t0 = 1_000_000;
  for (let i = 0; i < 6; i++) {
    const [a, b] = S.liveTeams(s);
    s = playTo(s, [i % 2, i % 2], t0 + i * 10 * MIN);
    const next = s.matches[s.matches.length - 1];
    const ids = [(next.a as { teamId: string }).teamId, (next.b as { teamId: string }).teamId];
    check(`MA5 rotation ${i + 1} : sortantes exclues, pas de doublon`, !ids.includes(a!.id) && !ids.includes(b!.id) && ids[0] !== ids[1]);
    s = S.launchNext(s, t0 + i * 10 * MIN + MIN);
  }
}

// --- Survie (AC34-39) ---
{
  check("10 équipes = 6 exemptions", byeCount(10) === 6);
  for (const n of [2, 3, 10, 32]) {
    const cfg = { ...defaultConfig("survie"), teamCount: n, smallFinal: false, draw: "manual" } as AnyConfig;
    const s = make(cfg, n);
    const real = s.matches.filter((m) => m.status !== "bye");
    check(`Survie ${n} : ${n - 1} matchs joués`, real.length === n - 1, real.length);
    check(`Survie ${n} : aucun match contre place vide`, real.every((m) => m.a.kind !== "tbd" && m.b.kind !== "tbd"));
  }
  // Nul → prolongation 2 min → TAB
  const cfg = { ...defaultConfig("survie"), teamCount: 4, smallFinal: true, draw: "manual" } as AnyConfig;
  let s = make(cfg, 4);
  const t0 = 1_000_000;
  s = S.goal(s, 0, 1, t0 + MIN);
  s = S.goal(s, 1, 1, t0 + 2 * MIN);
  s = S.advance(s, t0 + 8 * MIN);
  check("AC34 : nul → prolongation", s.live!.stage === "extra");
  s = S.advance(s, t0 + 10 * MIN + 5_000);
  check("AC34 : toujours nul → attente TAB", s.live!.stage === "shootout");
  const bad = S.submitShootout(s, 3, 3, t0 + 11 * MIN);
  check("C11 : TAB nul refusé", bad === s);
  s = S.submitShootout(s, 4, 3, t0 + 11 * MIN);
  check("AC35 : 1-1, TAB 4-3, A avance, 2 buts de jeu", s.live!.stage === "finished" && s.matches[0].winnerId === "t1" && s.matches[0].score![0] + s.matches[0].score![1] === 2 && s.matches[0].shootout![0] === 4);
  check("durée jouée 10:00 (prolongation incluse)", s.matches[0].playedMs === 10 * MIN, s.matches[0].playedMs);
  s = S.launchNext(s, t0 + 12 * MIN);
  s = playTo(s, [2, 0], t0 + 20 * MIN);
  s = S.launchNext(s, t0 + 21 * MIN);
  check("AC38 : petite finale avant la finale", S.currentMatch(s)!.stage === "small");
  const [pa, pb] = S.liveTeams(s);
  check("AC38 : perdants des demies", pa?.id === "t4" && pb?.id === "t3", [pa?.id, pb?.id]);
  s = playTo(s, [1, 0], t0 + 30 * MIN);
  s = S.launchNext(s, t0 + 31 * MIN);
  check("finale t1–t2", S.liveTeams(s)[0]?.id === "t1" && S.liveTeams(s)[1]?.id === "t2");
  s = playTo(s, [0, 1], t0 + 40 * MIN);
  check("session complète", S.sessionComplete(s));
  // Survie 2 : petite finale indisponible
  const s2 = make({ ...defaultConfig("survie"), teamCount: 2, smallFinal: true, draw: "manual" } as AnyConfig, 2);
  check("AC39 : 2 équipes → 1 seul match", s2.matches.length === 1);
  // Golden goal
  let g = make({ ...defaultConfig("survie"), teamCount: 2, drawRule: "golden", draw: "manual" } as AnyConfig, 2);
  g = S.advance(g, t0 + 9 * MIN);
  check("AC36 : golden goal ouvert", g.live!.stage === "golden");
  g = S.goal(g, 1, 1, t0 + 9 * MIN + 30_000);
  check("AC36 : premier but clôt, vainqueur B", g.live!.stage === "finished" && g.matches[0].winnerId === "t2");
}

// --- Cup (AC26-28) ---
{
  check("recommandation 8 → 2 poules", recommendCup(8).groups === 2);
  check("recommandation 12 → 3 poules", recommendCup(12).groups === 3);
  check("recommandation 6 → 2×3", recommendCup(6).groups === 2);
  check("recommandation 32 → 8×4", recommendCup(32).groups === 8);
  check("validation impossible (5 équipes, 2 poules, 2 qualifiés)", validateCupStructure(7, 3, 2) !== null);
  check("validation 12/3/2 OK", validateCupStructure(12, 3, 2) === null);
  const c8 = make({ ...defaultConfig("cup"), teamCount: 8, draw: "manual" } as AnyConfig, 8);
  check("AC26 : 12 matchs de poule", c8.matches.filter((m) => m.stage === "group").length === 12);
  const c8r = make({ ...defaultConfig("cup"), teamCount: 8, doubleRound: true, draw: "manual" } as AnyConfig, 8);
  check("AC27 : 24 matchs aller-retour", c8r.matches.length === 24);
  // Jouer les 12 matchs de poule avec des scores déterministes
  let s = c8;
  const t0 = 1_000_000;
  let i = 0;
  let tieSeen = false;
  for (let guard = 0; guard < 20; guard++) {
    const m = S.currentMatch(s)!;
    if (m.stage !== "group") break;
    if (s.cup!.tieChoice) {
      tieSeen = true;
      const tc = s.cup!.tieChoice;
      s = S.resolveTieChoice(s, tc.candidates.slice(0, tc.slots), t0);
      s = S.launchNext(s, t0);
      continue;
    }
    if (m.status === "finished") break;
    const [a, b] = S.liveTeams(s);
    const ia = Number(a!.id.slice(1));
    const ib = Number(b!.id.slice(1));
    s = playTo(s, [ia % 3, ib % 3], t0 + i * 10 * MIN);
    s = S.launchNext(s, t0 + i * 10 * MIN + MIN);
    i++;
  }
  console.log(tieSeen ? "  (AC31 : égalité à la coupure résolue par choix explicite)" : "  (pas d'égalité à la coupure)");
  const ko = s.matches.filter((m) => m.stage === "ko");
  check("AC26 : 2 demies + finale générées", ko.length === 3 && s.cup!.phase === "knockout", ko.length);
  const semi1 = ko[0];
  check("AC33 : A1–B2", (semi1.a as { teamId: string }).teamId === s.cup!.qualifiedIds[0] && (semi1.b as { teamId: string }).teamId === s.cup!.qualifiedIds[3]);
  const c12 = make({ ...defaultConfig("cup"), ...recommendCup(12), teamCount: 12, draw: "manual" } as AnyConfig, 12);
  check("AC28 : 18 matchs de poule à 12", c12.matches.length === 18);
}

// --- Standings ex æquo (AC25) ---
{
  const s = make({ ...defaultConfig("cup"), teamCount: 4, groups: 1, qualifiersPerGroup: 2, draw: "manual" } as AnyConfig, 4);
  const rows = computeStandings(["t1", "t2", "t3"], []);
  check("AC25 : trois ex æquo affichés", rows.every((r) => r.rank === 1 && r.tied));
  check("split 36 min / 3 → 12/12/12", splitPeriods(36 * 60, 3).every((v) => v === 720));
  check("split reliquat", splitPeriods(10, 3).join() === "4,3,3");
  check("single-group cup valid", s.matches.length === 6);
}

// --- Custom 3 périodes 10/10/16 (AC40) ---
{
  const cfg = { ...defaultConfig("custom"), totalMin: 36, periods: 3, periodSec: [600, 600, 960], breakMin: 0 } as AnyConfig;
  let s = make(cfg, 2);
  const t0 = 1_000_000;
  s = S.advance(s, t0 + 11 * MIN);
  check("AC40 : pause zéro → attente reprise directe (C04)", s.live!.stage === "awaitPeriod");
  s = S.startNextPeriod(s, t0 + 12 * MIN);
  s = S.advance(s, t0 + 23 * MIN);
  s = S.startNextPeriod(s, t0 + 24 * MIN);
  s = S.advance(s, t0 + 41 * MIN);
  check("AC40 : 36 min jouées", s.live!.stage === "finished" && s.matches[0].playedMs === 36 * MIN, s.matches[0].playedMs);
  // Buts seul (AC14)
  const g = make({ ...defaultConfig("custom"), end: { byTime: false, goalTarget: 2 } } as AnyConfig, 2);
  const g2 = S.advance(g, t0 + 120 * MIN);
  check("AC14 : aucune fin fantôme en buts seul", g2.live!.stage === "period");
}

// Relancer réinitialise le match courant sans perdre la rotation ni les résultats.
{
  const s = S.goal(make(defaultConfig("maracana"), 3), 0, 1, 1_001_000);
  const restarted = S.restartCurrent(s, 1_005_000);
  check("Relancer : score et chrono remis à zéro", restarted.live!.score.every(v => v === 0) && restarted.live!.chrono.accumulatedMs === 0 && restarted.live!.chrono.runningSince === null);
  check("Relancer : historique et rotation conservés", restarted.matches === s.matches && restarted.maracana === s.maracana);
  check("Relancer : reprise possible", S.resume(restarted, 1_010_000).live!.chrono.runningSince === 1_010_000);
}

console.log(failures ? `\n${failures} échec(s)` : "\nTous les tests passent");
process.exit(failures ? 1 : 0);
