// Roundr V0 — Moteur de session : un seul état pilote tous les écrans (CH-01).
// Toutes les fonctions sont pures et prennent `now` en paramètre : la
// restauration après fermeture rejoue `advance(session, Date.now())` une fois.
import {
  chronoReducer,
  elapsedMs,
  initialChronoState,
  type ChronoState,
} from "@/src/chrono/engine";
import { buildBracket, matchTeams, resolveSlot, shuffleWithSeed, slotLabel } from "./bracket";
import { buildGroups, computeQualification, scheduleGroups } from "./cup";
import { CONVENTIONS, uid } from "./defaults";
import { addTeam as maracanaAddTeam, initMaracana, pickNextPair, rotate } from "./maracana";
import { prepLeadMs, REMINDER_MS } from "./preparation";
import type { AnyConfig, Live, LiveStage, Match, Session, Team } from "./types";

const PLAY_STAGES: LiveStage[] = ["period", "additional", "extra", "golden"];

function blankMatch(id: string, order: number, label: string, a: string, b: string, stage: Match["stage"]): Match {
  return {
    id,
    order,
    label,
    stage,
    a: { kind: "team", teamId: a },
    b: { kind: "team", teamId: b },
    status: "scheduled",
    score: null,
    shootout: null,
    winnerId: null,
    finishReason: null,
    playedMs: 0,
    finishedAt: null,
  };
}

// ---------------------------------------------------------------------------
// Création
// ---------------------------------------------------------------------------
export function createSession(config: AnyConfig, teams: Team[], now: number): Session {
  const base: Session = {
    id: uid(),
    mode: config.mode,
    config,
    teams,
    createdAt: now,
    updatedAt: now,
    endedAt: null,
    status: "active",
    matches: [],
    live: null,
    maracana: null,
    cup: null,
    preFinish: null,
    lastEvent: null,
  };
  const ids = teams.map((t) => t.id);
  switch (config.mode) {
    case "classique":
    case "custom":
      base.matches = [blankMatch("m1", 1, "Match", ids[0], ids[1], "single")];
      break;
    case "maracana":
      base.maracana = initMaracana(ids);
      base.matches = [blankMatch("m1", 1, "Match 1", ids[0], ids[1], "rotation")];
      break;
    case "survie": {
      const order = config.draw === "random" ? shuffleWithSeed(ids, now) : ids;
      base.matches = buildBracket(
        order.map((id) => ({ kind: "team", teamId: id })),
        { smallFinal: config.smallFinal && teams.length > 2, startOrder: 1, idPrefix: "k" },
      );
      break;
    }
    case "cup": {
      const order = config.draw === "random" ? shuffleWithSeed(ids, now) : ids;
      const groups = buildGroups(order, config.groups);
      base.cup = { groups, phase: "groups", tieChoice: null, qualifiedIds: [] };
      base.matches = scheduleGroups(groups, config.doubleRound);
      break;
    }
  }
  return launchNext(base, now);
}

// ---------------------------------------------------------------------------
// Durées et live
// ---------------------------------------------------------------------------
export function matchMinutes(session: Session, match: Match): number {
  const c = session.config;
  switch (c.mode) {
    case "classique":
      return c.totalMin;
    case "custom":
      return c.totalMin;
    case "maracana":
      return c.matchMin;
    case "survie":
    case "cup": {
      if (match.stage === "ko" && match.roundOf) return c.roundMinutes[match.roundOf] ?? c.matchMin;
      if (match.stage === "small") return c.roundMinutes[4] ?? c.matchMin;
      return c.matchMin;
    }
  }
}

function buildLive(session: Session, match: Match, now: number): Live {
  const c = session.config;
  let periodMs: number[] = [];
  let breakMs = 0;
  let end = { byTime: true, goalTarget: null as number | null };
  let additional = false;
  let scoreOn = true;
  let drawRule: Live["drawRule"] = null;
  let extraMs = 0;
  let maracanaExtension = false;

  switch (c.mode) {
    case "classique": {
      const total = c.totalMin * 60_000;
      periodMs = c.periods === 2 ? [total / 2, total / 2] : [total];
      breakMs = c.periods === 2 ? c.breakMin * 60_000 : 0;
      additional = c.additional;
      scoreOn = c.score;
      break;
    }
    case "custom": {
      end = c.end;
      periodMs = c.end.byTime ? c.periodSec.map((s) => s * 1000) : [0];
      breakMs = c.breakMin * 60_000;
      additional = c.additional && c.end.byTime;
      scoreOn = c.score || c.end.goalTarget != null;
      break;
    }
    case "maracana": {
      end = c.end;
      periodMs = c.end.byTime ? [c.matchMin * 60_000] : [0];
      maracanaExtension = session.teams.length === 3 && c.end.byTime;
      break;
    }
    case "survie":
    case "cup": {
      end = c.end;
      const min = matchMinutes(session, match);
      periodMs = c.end.byTime ? [min * 60_000] : [0];
      const knockout = match.stage !== "group";
      drawRule = knockout ? c.drawRule : null;
      extraMs = c.extraMin * 60_000;
      additional = !knockout && c.mode === "cup" && c.groupAdditional && c.end.byTime;
      break;
    }
  }

  const chrono = chronoReducer(
    chronoReducer(initialChronoState, { type: "configure", regulationDurationMs: periodMs[0], extraDurationMs: extraMs }),
    { type: "start" },
    now,
  );
  return {
    matchId: match.id,
    periodMs,
    breakMs,
    end,
    additional,
    scoreOn,
    drawRule,
    extraMs,
    maracanaExtension,
    stage: "period",
    periodIndex: 0,
    chrono,
    playedMs: 0,
    score: [0, 0],
    firedAlerts: [],
    extensionUsed: false,
    prevStage: null,
    finishCount: false,
    finishedAt: null,
    startedAt: now,
  };
}

export function currentMatch(session: Session): Match | null {
  return session.live ? session.matches.find((m) => m.id === session.live!.matchId) ?? null : null;
}

export function isPlayStage(stage: LiveStage): boolean {
  return PLAY_STAGES.includes(stage);
}

export function livePlayedMs(live: Live, now: number): number {
  return live.playedMs + (isPlayStage(live.stage) ? elapsedMs(live.chrono, now) : 0);
}

// Instant exact auquel la cible de la phase a été atteinte.
function reachedAt(chrono: ChronoState, target: number): number {
  return (chrono.runningSince ?? 0) + (target - chrono.accumulatedMs);
}

function setLive(session: Session, live: Live, now: number): Session {
  return { ...session, live, updatedAt: now };
}

function enterStage(live: Live, stage: LiveStage, target: number | null, at: number): Live {
  const chrono: ChronoState = {
    ...initialChronoState,
    phase: stage === "additional" || stage === "golden" ? (stage as "additional" | "golden") : stage === "extra" ? "extra" : "playing",
    runningSince: at,
    accumulatedMs: 0,
    targetDurationMs: target,
    regulationTargetMs: live.chrono.regulationTargetMs,
    extraTargetMs: live.extraMs,
  };
  return { ...live, stage, chrono, firedAlerts: live.firedAlerts };
}

// ---------------------------------------------------------------------------
// Avancement temporel (idempotent) — alertes, fin de période, fin de match
// ---------------------------------------------------------------------------
export function advance(session: Session, now: number): Session {
  let s = session;
  for (let guard = 0; guard < 8; guard++) {
    const next = advanceOnce(s, now);
    if (next === s) return s;
    s = next;
  }
  return s;
}

function advanceOnce(session: Session, now: number): Session {
  const live = session.live;
  if (!live || live.stage === "finished" || live.chrono.runningSince == null) return session;
  const el = elapsedMs(live.chrono, now);

  if (live.stage === "period" && live.end.byTime) {
    const target = live.periodMs[live.periodIndex];
    const withAlerts = fireAlerts(session, live, target, el, now);
    if (el < target) return withAlerts === live ? session : setLive(session, withAlerts, now);
    const at = reachedAt(live.chrono, target);
    const frozen: Live = { ...withAlerts, playedMs: withAlerts.playedMs + target };
    const isLast = live.periodIndex === live.periodMs.length - 1;
    if (!isLast) {
      // C04 : période intermédiaire arrêtée à zéro, puis pause chronométrée.
      if (live.breakMs > 0) return setLive(session, enterStage(frozen, "break", live.breakMs, at), now);
      return setLive(session, { ...frozen, stage: "awaitPeriod", periodIndex: live.periodIndex + 1, chrono: { ...frozen.chrono, runningSince: null, accumulatedMs: 0 } }, now);
    }
    return concludePlay(setLive(session, frozen, now), at, "regulation");
  }

  if (live.stage === "break") {
    if (el < live.breakMs) return session;
    return setLive(session, { ...live, stage: "awaitPeriod", periodIndex: live.periodIndex + 1, chrono: { ...live.chrono, runningSince: null, accumulatedMs: 0 } }, now);
  }

  if (live.stage === "extra") {
    const target = live.extraMs;
    const withAlerts = fireAlerts(session, live, target, el, now);
    if (el < target) return withAlerts === live ? session : setLive(session, withAlerts, now);
    const at = reachedAt(live.chrono, target);
    return concludePlay(setLive(session, { ...withAlerts, playedMs: withAlerts.playedMs + target }, now), at, "extraTimeEnd");
  }
  return session;
}

// §9 / C19 — seuils par période, dédupliqués, + préparation (§8).
function fireAlerts(session: Session, live: Live, target: number, el: number, now: number): Live {
  const remaining = target - el;
  const keys: string[] = [];
  const prefix = `${live.stage}${live.periodIndex}`;
  const thresholds = CONVENTIONS.ALERT_THRESHOLDS_MS.filter((t) => t < target);
  thresholds.forEach((t) => {
    if (remaining <= t) keys.push(`${prefix}:${t}`);
  });
  const isLastPeriod = live.periodIndex === live.periodMs.length - 1;
  if (isLastPeriod && session.mode !== "classique" && session.mode !== "custom") {
    const next = nextMatchInfo(session);
    if (next && live.end.byTime) {
      if (remaining <= prepLeadMs(next.durationMin)) keys.push("prep");
      if (remaining <= REMINDER_MS) keys.push("prep1");
    }
  }
  const fresh = keys.filter((k) => !live.firedAlerts.includes(k));
  if (!fresh.length) return live;
  return { ...live, firedAlerts: [...live.firedAlerts, ...fresh] };
}

// ---------------------------------------------------------------------------
// Fin de temps réglementaire / fin manuelle → additionnel, départage ou fin
// ---------------------------------------------------------------------------
function concludePlay(session: Session, at: number, reason: "regulation" | "manual" | "extraTimeEnd"): Session {
  const live = session.live!;
  const [sa, sb] = live.score;
  const draw = live.scoreOn && sa === sb;

  if (live.stage === "period") {
    if (reason === "regulation" && draw && live.maracanaExtension && !live.extensionUsed && sa === 0) {
      // MA-02 : extension unique de 2 min à but décisif.
      return setLive(session, { ...enterStage(live, "extra", CONVENTIONS.MARACANA_EXTENSION_MS, at), extraMs: CONVENTIONS.MARACANA_EXTENSION_MS, extensionUsed: true }, at);
    }
    if (reason === "regulation" && live.additional) return setLive(session, enterStage(live, "additional", null, at), at);
    if (draw && live.drawRule) return tiebreak(session, at);
    // Temps déjà comptabilisé (advance ou endManual).
    return finishMatch(session, at, reason, false);
  }
  const manual = reason === "manual";
  const el = elapsedMs(live.chrono, at);
  if (live.stage === "additional") {
    if (draw && live.drawRule) return tiebreak(session, at);
    return finishMatch(session, at, "manual", true);
  }
  if (live.stage === "extra") {
    if (draw) {
      if (live.maracanaExtension) return finishMatch(session, at, "extension", manual);
      return setLive(session, { ...live, stage: "shootout", playedMs: live.playedMs + (manual ? el : 0), chrono: { ...live.chrono, runningSince: null, accumulatedMs: el } }, at);
    }
    return finishMatch(session, at, manual ? "manual" : "extraTimeEnd", manual);
  }
  if (live.stage === "golden") {
    if (draw) return setLive(session, { ...live, stage: "shootout", playedMs: live.playedMs + el, chrono: { ...live.chrono, runningSince: null, accumulatedMs: el } }, at);
    return finishMatch(session, at, "manual", true);
  }
  return session;
}

function tiebreak(session: Session, at: number): Session {
  const live = session.live!;
  const frozenPlayed = live.stage === "period" ? live.playedMs : live.playedMs + elapsedMs(live.chrono, at);
  const base = { ...live, playedMs: frozenPlayed };
  switch (live.drawRule) {
    case "shootout":
      return setLive(session, { ...base, stage: "shootout", chrono: { ...live.chrono, runningSince: null } }, at);
    case "extraThenShootout":
      return setLive(session, enterStage(base, "extra", live.extraMs, at), at);
    case "golden":
      return setLive(session, enterStage(base, "golden", null, at), at);
    default:
      return finishMatch(session, at, "manual", false);
  }
}

// CH-04 — une seule fin, résultat conservé, progression du mode.
function finishMatch(session: Session, at: number, reason: Match["finishReason"], countElapsed: boolean): Session {
  const live = session.live!;
  if (live.stage === "finished") return session;
  const el = elapsedMs(live.chrono, at);
  const inPlay = isPlayStage(live.stage);
  const finishCount = countElapsed && inPlay;
  const playedMs = live.playedMs + (finishCount ? el : 0);
  const [sa, sb] = live.score;
  const match = currentMatch(session)!;
  const [ta, tb] = matchTeams(match, session.matches);
  let winnerId: string | null = null;
  if (live.stage === "shootout" && match.shootout) winnerId = match.shootout[0] > match.shootout[1] ? ta : tb;
  else if (live.scoreOn && sa !== sb) winnerId = sa > sb ? ta : tb;

  const preFinish = { matches: session.matches, maracana: session.maracana, cup: session.cup };
  const updated: Match = {
    ...match,
    status: "finished",
    score: live.scoreOn ? [sa, sb] : null,
    winnerId,
    finishReason: reason,
    playedMs,
    finishedAt: at,
  };
  let matches = session.matches.map((m) => (m.id === match.id ? updated : m));
  const frozenChrono: ChronoState = { ...live.chrono, runningSince: null, accumulatedMs: inPlay ? el : live.chrono.accumulatedMs, phase: "finished", finishReason: reason === "goalTarget" || reason === "extension" ? "goldenGoal" : reason === "shootout" ? "shootout" : (reason as ChronoState["finishReason"]) };
  let s: Session = {
    ...session,
    matches,
    preFinish,
    live: { ...live, stage: "finished", prevStage: live.stage, finishCount, chrono: frozenChrono, playedMs, finishedAt: at },
    updatedAt: at,
    lastEvent: null,
  };

  if (s.mode === "maracana" && s.maracana) {
    const r = rotate(s.maracana, winnerId, matches);
    const n = matches.length + 1;
    matches = [...matches, blankMatch(`m${n}`, n, `Match ${n}`, r.next[0], r.next[1], "rotation")];
    const name = (id: string) => s.teams.find((t) => t.id === id)?.name ?? id;
    s = { ...s, matches, maracana: r.state, lastEvent: `Sort : ${r.out.map(name).join(", ")} · Entre : ${r.in.map(name).join(", ")}` };
  }
  if (s.mode === "cup" && s.cup && s.cup.phase === "groups") s = tryQualify(s);
  return s;
}

// CU-04 — qualification résolue seulement quand toutes les poules sont finies.
function tryQualify(session: Session, chosen: string[] = []): Session {
  const cup = session.cup!;
  const groupMatches = session.matches.filter((m) => m.stage === "group");
  if (groupMatches.some((m) => m.status !== "finished")) return session;
  const c = session.config;
  if (c.mode !== "cup") return session;
  const choices = { ...cup.qualificationChoices };
  if (cup.tieChoice && chosen.length) {
    const valid = [...new Set(chosen)].filter((id) => cup.tieChoice!.candidates.includes(id));
    if (valid.length !== cup.tieChoice.slots) return session;
    choices[cup.tieChoice.context] = valid;
  }
  const q = computeQualification(cup.groups, groupMatches, c.qualifiersPerGroup, Object.values(choices).flat());
  if (q.kind === "tie") return { ...session, cup: { ...cup, qualificationChoices: choices, tieChoice: { candidates: q.candidates, slots: q.slots, context: q.context } } };
  const bracket = buildBracket(q.seeds, { smallFinal: c.smallFinal, startOrder: groupMatches.length + 1, idPrefix: "k" });
  return {
    ...session,
    matches: [...groupMatches, ...bracket],
    cup: { ...cup, qualificationChoices: choices, phase: "knockout", tieChoice: null, qualifiedIds: q.seeds.map((sl) => (sl.kind === "team" ? sl.teamId : "")) },
    lastEvent: "Phase de poules terminée",
  };
}

export function resolveTieChoice(session: Session, chosen: string[], now: number): Session {
  if (!session.cup?.tieChoice) return session;
  return { ...tryQualify(session, chosen), updatedAt: now };
}

// ---------------------------------------------------------------------------
// Actions organisateur
// ---------------------------------------------------------------------------
export function pause(session: Session, now: number): Session {
  const live = session.live;
  if (!live || !isPlayStage(live.stage) || live.chrono.runningSince == null) return session;
  return setLive(session, { ...live, chrono: chronoReducer(live.chrono, { type: "pause" }, now) }, now);
}

export function resume(session: Session, now: number): Session {
  const live = session.live;
  if (!live || !isPlayStage(live.stage) || live.chrono.runningSince != null) return session;
  const phase = live.stage === "period" ? "playing" : live.stage;
  return setLive(session, { ...live, chrono: { ...live.chrono, phase: phase as ChronoState["phase"], runningSince: now } }, now);
}

export function isPaused(live: Live): boolean {
  return isPlayStage(live.stage) && live.chrono.runningSince == null;
}

export function startNextPeriod(session: Session, now: number): Session {
  const live = session.live;
  if (!live || live.stage !== "awaitPeriod") return session;
  return setLive(session, enterStage(live, "period", live.periodMs[live.periodIndex], now), now);
}

export function goal(session: Session, side: 0 | 1, delta: 1 | -1, now: number): Session {
  const live = session.live;
  if (!live || !live.scoreOn) return session;
  if (!isPlayStage(live.stage) && live.stage !== "awaitPeriod" && live.stage !== "break") return session;
  const score: [number, number] = [...live.score] as [number, number];
  score[side] = Math.max(0, score[side] + delta);
  if (score[side] === live.score[side]) return session;
  let s = setLive(session, { ...live, score }, now);
  if (delta < 0) return s;
  if (live.stage === "golden" || (live.stage === "extra" && live.maracanaExtension)) {
    return finishMatch(s, now, live.stage === "golden" ? "goldenGoal" : "extension", true);
  }
  if (live.end.goalTarget != null && score[side] >= live.end.goalTarget) return finishMatch(s, now, "goalTarget", true);
  return s;
}

// CH-05 — fin manuelle confirmée par l'écran.
export function endManual(session: Session, now: number): Session {
  const live = session.live;
  if (!live || !isPlayStage(live.stage)) return session;
  if (live.stage === "period") {
    // Temps de la période figé et compté ici ; concludePlay ne le recompte pas.
    const el = elapsedMs(live.chrono, now);
    const s = setLive(session, { ...live, playedMs: live.playedMs + el, chrono: { ...live.chrono, runningSince: null, accumulatedMs: el } }, now);
    return concludePlay(s, now, "manual");
  }
  return concludePlay(session, now, "manual");
}

export function submitShootout(session: Session, a: number, b: number, now: number): Session {
  const live = session.live;
  if (!live || live.stage !== "shootout" || !Number.isSafeInteger(a) || !Number.isSafeInteger(b) || a === b || a < 0 || b < 0) return session;
  const matches = session.matches.map((m) => (m.id === live.matchId ? { ...m, shootout: [a, b] as [number, number] } : m));
  return finishMatch({ ...session, matches }, now, "shootout", false);
}

// Prochain match jouable (équipes résolues), hors match courant.
function findNextMatch(session: Session): Match | null {
  const candidates = session.matches
    .filter((m) => m.status === "scheduled")
    .sort((x, y) => x.order - y.order);
  return candidates.find((m) => matchTeams(m, session.matches).every(Boolean)) ?? null;
}

export function hasPendingMatches(session: Session): boolean {
  return session.matches.some((m) => m.status === "scheduled") || !!session.cup?.tieChoice;
}

// FI-02 — Lancer le prochain match. Jamais automatique.
export function launchNext(session: Session, now: number): Session {
  if (session.cup?.tieChoice) return session;
  if (session.live && session.live.stage !== "finished") return session;
  const next = findNextMatch(session);
  if (!next) return session;
  const matches = session.matches.map((m) => (m.id === next.id ? { ...m, status: "live" as const } : m));
  const s = { ...session, matches, preFinish: null, lastEvent: null };
  return setLive(s, buildLive(s, next, now), now);
}

export function sessionComplete(session: Session): boolean {
  if (!session.live || session.live.stage !== "finished") return false;
  if (session.mode === "maracana") return false;
  return !hasPendingMatches(session);
}

export function endSession(session: Session, now: number): Session {
  const interrupted = session.mode !== "classique" && session.mode !== "custom" && hasPendingMatches(session);
  const live = session.live && session.live.stage !== "finished" ? { ...session.live, chrono: { ...session.live.chrono, runningSince: null } } : session.live;
  return { ...session, live, status: interrupted && session.mode !== "maracana" ? "interrupted" : "finished", endedAt: now, updatedAt: now };
}

// C16 — correction du dernier résultat avant le match suivant.
export function correctLast(session: Session, side: 0 | 1, delta: 1 | -1, now: number): Session {
  const live = session.live;
  if (!live || live.stage !== "finished" || !session.preFinish || !live.scoreOn) return session;
  const score: [number, number] = [...live.score] as [number, number];
  score[side] = Math.max(0, score[side] + delta);
  if (score[side] === live.score[side]) return session;
  const match = currentMatch(session)!;
  const restored: Session = { ...session, matches: session.preFinish.matches, maracana: session.preFinish.maracana, cup: session.preFinish.cup, preFinish: null };
  const stillReached = live.end.goalTarget != null && (score[0] >= live.end.goalTarget || score[1] >= live.end.goalTarget);
  const cancelledTarget = match.finishReason === "goalTarget" && !stillReached;
  const cancelledDecisiveGoal = (match.finishReason === "goldenGoal" || (match.finishReason === "extension" && match.winnerId != null)) && score[0] === score[1] && !stillReached;
  if (cancelledTarget || cancelledDecisiveGoal) {
    // Le but décisif est annulé : match restauré en pause à l'instant exact.
    const prev = live.prevStage ?? "period";
    const phase = prev === "period" ? "paused" : prev;
    const chrono: ChronoState = { ...live.chrono, phase: phase as ChronoState["phase"], finishReason: null, runningSince: null };
    const playedMs = live.playedMs - (live.finishCount ? live.chrono.accumulatedMs : 0);
    return setLive(restored, { ...live, stage: prev, prevStage: null, finishCount: false, score, chrono, playedMs, finishedAt: null }, now);
  }
  // A corrected knockout draw must be settled before it can feed the bracket.
  if (live.drawRule && score[0] === score[1] && match.finishReason !== "shootout") {
    const base: Live = { ...live, score, stage: "shootout", prevStage: null, finishCount: false, finishedAt: null, chrono: { ...live.chrono, runningSince: null, phase: "paused", finishReason: null } };
    const pending = setLive(restored, base, now);
    if (live.prevStage === "period") {
      return tiebreak(setLive(restored, { ...base, stage: "period" }, now), now);
    }
    return pending;
  }
  // Once the corrected game score is decisive, old penalties no longer decide it.
  if (match.finishReason === "shootout" && score[0] !== score[1]) {
    const matches = restored.matches.map((m) => m.id === live.matchId ? { ...m, shootout: null } : m);
    return finishMatch(setLive({ ...restored, matches }, { ...unfinishedLive({ ...live, score }), stage: "period" }, now), live.finishedAt ?? now, "manual", false);
  }
  const reFinished = setLive(restored, unfinishedLive({ ...live, score }), now);
  return finishMatch(reFinished, live.finishedAt ?? now, match.finishReason, live.finishCount);
}

// Restart only the current match; retain all earlier results and the draw.
export function restartCurrent(session: Session, now: number): Session {
  if (!session.live) return session;
  const original = session.live.stage === "finished" && session.preFinish
    ? { ...session, ...session.preFinish } : session;
  const match = currentMatch(original);
  if (!match) return session;
  const fresh: Match = { ...match, status: "live", score: null, shootout: null, winnerId: null, finishReason: null, playedMs: 0, finishedAt: null };
  const base = { ...original, status: "active" as const, endedAt: null, preFinish: null, lastEvent: null, matches: original.matches.map((m) => m.id === match.id ? fresh : m) };
  return setLive(base, buildLive(base, fresh, now), now);
}

export function correctShootout(session: Session, now: number): Session {
  if (!session.live || session.live.stage !== "finished" || !session.preFinish || currentMatch(session)?.finishReason !== "shootout") return session;
  const restored = { ...session, ...session.preFinish, preFinish: null };
  return setLive(restored, { ...session.live, stage: "shootout", prevStage: null, finishedAt: null, finishCount: false, chrono: { ...session.live.chrono, phase: "paused", runningSince: null, finishReason: null } }, now);
}

// Ramène un live finalisé à l'étape précédente (pour re-finaliser).
function unfinishedLive(live: Live): Live {
  const prev = live.prevStage ?? "period";
  return {
    ...live,
    stage: prev,
    playedMs: live.playedMs - (live.finishCount ? live.chrono.accumulatedMs : 0),
    chrono: { ...live.chrono, phase: prev === "period" ? "paused" : (prev as ChronoState["phase"]), finishReason: null },
  };
}

// MA-04 / C09 — ajout d'une équipe à la transition, résultats conservés.
export function addMaracanaTeam(session: Session, team: Team, now: number): Session {
  const live = session.live;
  if (session.mode !== "maracana" || !live || live.stage !== "finished" || !session.preFinish) return session;
  if (session.teams.length >= CONVENTIONS.MAX_MARACANA_TEAMS) return session;
  const match = currentMatch(session)!;
  const restored: Session = {
    ...session,
    teams: [...session.teams, team],
    config: { ...session.config, teamCount: session.teams.length + 1 } as AnyConfig,
    matches: session.preFinish.matches,
    maracana: maracanaAddTeam(session.preFinish.maracana!, team.id),
    preFinish: null,
    live: unfinishedLive(live),
  };
  return finishMatch(restored, live.finishedAt ?? now, match.finishReason, live.finishCount);
}

// ---------------------------------------------------------------------------
// Lecture : prochain match, libellés
// ---------------------------------------------------------------------------
export type NextInfo = { match: Match | null; aLabel: string; bLabel: string; durationMin: number; certain: boolean };

export function nextMatchInfo(session: Session): NextInfo | null {
  const live = session.live;
  const name = (id: string | null) => session.teams.find((t) => t.id === id)?.name ?? "?";
  if (session.mode === "classique" || session.mode === "custom") return null;
  if (session.mode === "maracana" && session.maracana) {
    const c = session.config as Extract<AnyConfig, { mode: "maracana" }>;
    if (live?.stage === "finished") {
      const next = findNextMatch(session);
      if (!next) return null;
      const [a, b] = matchTeams(next, session.matches);
      return { match: next, aLabel: name(a), bLabel: name(b), durationMin: c.matchMin, certain: true };
    }
    const st = session.maracana;
    if (session.teams.length <= 3) {
      return { match: null, aLabel: name(st.waiting[0]), bLabel: "l’équipe qui reste", durationMin: c.matchMin, certain: false };
    }
    const pair = pickNextPair(st, st.waiting, session.matches);
    return { match: null, aLabel: name(pair[0]), bLabel: name(pair[1]), durationMin: c.matchMin, certain: true };
  }
  const scheduled = session.matches.filter((m) => m.status === "scheduled").sort((x, y) => x.order - y.order);
  const next = scheduled[0];
  if (!next) return null;
  const [a, b] = matchTeams(next, session.matches);
  return {
    match: next,
    aLabel: slotLabel(next.a, session.matches, session.teams),
    bLabel: slotLabel(next.b, session.matches, session.teams),
    durationMin: matchMinutes(session, next),
    certain: !!(a && b),
  };
}

export function teamName(session: Session, id: string | null): string {
  return session.teams.find((t) => t.id === id)?.name ?? "?";
}

export function liveTeams(session: Session): [Team | null, Team | null] {
  const m = currentMatch(session);
  if (!m) return [null, null];
  const [a, b] = matchTeams(m, session.matches);
  return [session.teams.find((t) => t.id === a) ?? null, session.teams.find((t) => t.id === b) ?? null];
}

export { resolveSlot };


