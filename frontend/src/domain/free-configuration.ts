import type {
  FreeTimerConfig,
  FreeTimerKind,
  IntervalConfig,
} from "./free-timer";
import {
  lovableConfigTeams,
  mergeConfigurationTeams,
  referenceTeamPalette,
} from "./../features/lovable-config-state";
import type { Team } from "./types";

// Configuration draft only: never contains elapsed time, laps or scores.
export type FreeDraft = {
  nativeDisplay?: FreeTimerConfig["display"];
  nativeSounds?: boolean;
  kind: FreeTimerKind;
  cd: { h: number; m: number; s: number };
  signal: boolean;
  periods: number[];
  rest: number;
  reps: number;
  repRest: number;
  auto: boolean;
  signals: boolean;
  teamsOn: boolean;
  teamCount: number;
  teams: Team[];
  scoreOn: boolean;
  legacyInterval?: IntervalConfig;
};
export const freeLabels = {
  stopwatch: "Chronomètre",
  countdown: "Compte à rebours",
  interval: "Intervalles",
};
export const copyFreeDraft = (d: FreeDraft): FreeDraft =>
  JSON.parse(JSON.stringify(d));
export function initialFreeDraft(): FreeDraft {
  return {
    kind: "stopwatch",
    cd: { h: 0, m: 10, s: 0 },
    signal: true,
    periods: [30],
    rest: 30,
    reps: 8,
    repRest: 0,
    auto: true,
    signals: true,
    teamsOn: false,
    teamCount: 2,
    teams: lovableConfigTeams("maracana", 8).map((t, i) => ({
      ...t,
      color: referenceTeamPalette[i],
    })),
    scoreOn: true,
  };
}
export function configFromDraft(d: FreeDraft): FreeTimerConfig {
  const base = {
    withTeams: d.teamsOn,
    teams: d.teams.slice(0, d.teamCount).map((t) => ({ ...t })),
    scoreOn: d.scoreOn,
    display: d.nativeDisplay ?? "numeric",
    sounds:
      d.nativeSounds ??
      (d.kind === "countdown"
        ? d.signal
        : d.kind === "interval"
          ? d.signals
          : true),
  };
  if (d.kind === "stopwatch") return { kind: "stopwatch", ...base };
  if (d.kind === "countdown")
    return {
      kind: "countdown",
      ...base,
      durationMs: (d.cd.h * 3600 + d.cd.m * 60 + d.cd.s) * 1000,
      endSignal: d.signal,
    };
  if (d.legacyInterval) return { ...d.legacyInterval, ...base };
  return {
    kind: "interval",
    ...base,
    periodsMs: d.periods.map((p) => p * 1000),
    workMs: d.periods[0] * 1000,
    restMs: d.rest * 1000,
    reps: d.periods.length,
    sets: d.reps,
    restBetweenSetsMs: d.repRest * 1000,
    autoChain: d.auto,
    endSignal: d.signals,
  };
}
// Explicit editor adapter. Active sessions and saved configurations are never
// rewritten by this operation. Saving creates a separate validated snapshot.
export function draftFromConfig(config: FreeTimerConfig): FreeDraft {
  const d = initialFreeDraft();
  d.kind = config.kind;
  d.nativeDisplay = config.display;
  d.nativeSounds = config.sounds;
  d.teamsOn = config.withTeams;
  d.scoreOn = config.scoreOn ?? true;
  if (config.teams) {
    d.teamCount = config.teams.length;
    d.teams = mergeConfigurationTeams(
      d.teams,
      config.teams.map((t) => ({ ...t })),
    );
  }
  if (config.kind === "countdown") {
    const sec = config.durationMs / 1000;
    d.cd = {
      h: Math.floor(sec / 3600),
      m: Math.floor((sec % 3600) / 60),
      s: sec % 60,
    };
    d.signal = config.endSignal;
  }
  if (config.kind === "interval") {
    const periods =
      config.periodsMs ??
      Array.from({ length: config.reps }, () => config.workMs);
    if (
      periods.length > 12 ||
      config.sets > 20 ||
      periods.some((p) => p < 5000 || p > 3600000 || p % 1000) ||
      config.restMs > 600000 ||
      config.restBetweenSetsMs > 900000
    )
      d.legacyInterval = JSON.parse(JSON.stringify(config));
    else {
      d.periods = periods.map((p) => p / 1000);
      d.rest = config.restMs / 1000;
      d.reps = config.sets;
      d.repRest = config.restBetweenSetsMs / 1000;
      d.auto = config.autoChain;
      d.signals = config.endSignal;
    }
  }
  return d;
}
export function freeDuration(sec: number): string {
  const h = Math.floor(sec / 3600),
    m = Math.floor((sec % 3600) / 60),
    s = sec % 60;
  return (
    [
      h ? `${h} h` : "",
      m ? `${String(m).padStart(h ? 2 : 1, "0")} min` : "",
      s ? `${s} s` : "",
    ]
      .filter(Boolean)
      .join(" ") || "0 s"
  );
}
export function freeConfigSummary(c: FreeTimerConfig): string {
  let main = "Chronomètre · sans limite";
  if (c.kind === "countdown")
    main = `Compte à rebours · ${freeDuration(c.durationMs / 1000)}`;
  if (c.kind === "interval") {
    const p = c.periodsMs ?? Array.from({ length: c.reps }, () => c.workMs);
    main = `Intervalles · ${p.every((x) => x === p[0]) ? `${p.length} × ${freeDuration(p[0] / 1000)}` : p.map((x) => freeDuration(x / 1000)).join(" / ")}${c.restMs ? ` · repos ${freeDuration(c.restMs / 1000)}` : ""}${c.sets > 1 ? ` · ${c.sets} séries` : ""}`;
  }
  return c.withTeams ? `${main} · ${c.teams?.length ?? 2} équipes` : main;
}
