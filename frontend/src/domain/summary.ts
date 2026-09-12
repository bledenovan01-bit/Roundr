// §11 / C21 — Résumés calculés depuis les résultats (jamais inventés).
import { matchTeams } from "./bracket";
import { computeStandings, type StandingRow } from "./standings";
import type { Match, Session } from "./types";

export type Summary = {
  title: string;
  headline: string; // vainqueur(s), champion, score…
  sub: string | null;
  stats: { label: string; value: string }[];
  interrupted: boolean;
  podium: { place: number; name: string }[];
  leaders: StandingRow[]; // Maracana ex æquo en tête
};

export function fmtDuration(ms: number): string {
  const total = Math.floor(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h > 0) return `${h} h ${String(m).padStart(2, "0")} min`;
  return `${m} min ${String(s).padStart(2, "0")} s`;
}

export function played(session: Session): Match[] {
  return session.matches.filter((m) => m.status === "finished");
}

export function buildSummary(session: Session): Summary {
  const name = (id: string | null) => session.teams.find((t) => t.id === id)?.name ?? "?";
  const done = played(session);
  const playedMs = done.reduce((a, m) => a + m.playedMs, 0);
  const goals = done.reduce((a, m) => a + (m.score ? m.score[0] + m.score[1] : 0), 0);
  const scoreOn = done.some((m) => m.score);
  const interrupted = session.status === "interrupted";
  const sessionMs = (session.endedAt ?? session.updatedAt) - session.createdAt;
  const base: Summary = { title: "", headline: "", sub: null, stats: [], interrupted, podium: [], leaders: [] };

  switch (session.mode) {
    case "classique":
    case "custom": {
      const m = done[0] ?? session.matches[0];
      const [a, b] = matchTeams(m, session.matches);
      base.title = "Match terminé";
      base.headline = m.score ? `${name(a)} ${m.score[0]} – ${m.score[1]} ${name(b)}` : `${name(a)} vs ${name(b)}`;
      base.sub = m.score ? (m.winnerId ? `Victoire ${name(m.winnerId)}` : "Match nul") : null;
      base.stats.push({ label: "Durée jouée", value: fmtDuration(m.playedMs) });
      if (session.mode === "custom") {
        const c = session.config;
        if (c.mode === "custom") base.stats.push({ label: "Périodes", value: `${session.live ? Math.min(session.live.periodIndex + (session.live.stage === "finished" ? 1 : 0), c.periods) : c.periods}/${c.periods}` });
      }
      if (m.finishReason === "manual") base.sub = `${base.sub ?? ""}${base.sub ? " · " : ""}Fin manuelle`;
      return base;
    }
    case "maracana": {
      const rows = computeStandings(session.teams.map((t) => t.id), session.matches);
      const leaders = rows.filter((r) => r.rank === 1 && r.played > 0);
      base.title = "Session terminée";
      base.leaders = leaders;
      base.headline = leaders.length ? leaders.map((r) => name(r.teamId)).join(" & ") : "Aucun match joué";
      base.sub = leaders.length ? `${leaders.length > 1 ? "Ex æquo · " : ""}${leaders[0].points} pts` : null;
      base.stats.push({ label: "Matchs", value: String(done.length) }, { label: "Buts", value: String(goals) }, { label: "Temps joué", value: fmtDuration(playedMs) }, { label: "Durée de session", value: fmtDuration(sessionMs) });
      base.podium = rows.slice(0, 3).filter((r) => r.played > 0).map((r) => ({ place: r.rank, name: name(r.teamId) }));
      return base;
    }
    case "cup":
    case "survie": {
      const final = session.matches.find((m) => m.stage === "ko" && m.roundOf === 2);
      const small = session.matches.find((m) => m.stage === "small");
      const champion = final?.status === "finished" ? final.winnerId : null;
      base.title = interrupted ? "Tournoi interrompu" : session.mode === "cup" ? "Champion" : "Dernière équipe en jeu";
      base.headline = champion ? name(champion) : interrupted ? "Aucun champion désigné" : "—";
      if (final?.status === "finished") {
        const [a, b] = matchTeams(final, session.matches);
        base.sub = `Finale : ${name(a)} ${final.score?.[0] ?? ""}–${final.score?.[1] ?? ""} ${name(b)}${final.shootout ? ` (TAB ${final.shootout[0]}–${final.shootout[1]})` : ""}`;
        const runnerUp = a === champion ? b : a;
        base.podium.push({ place: 1, name: name(champion) }, { place: 2, name: name(runnerUp) });
        if (small?.status === "finished" && small.winnerId) base.podium.push({ place: 3, name: name(small.winnerId) });
      }
      if (champion) {
        const wins = done.filter((m) => m.winnerId === champion).length;
        base.stats.push({ label: "Victoires jouées", value: String(wins) });
      }
      base.stats.push({ label: "Matchs joués", value: String(done.length) });
      if (scoreOn) base.stats.push({ label: "Buts de jeu", value: String(goals) });
      base.stats.push({ label: "Temps joué", value: fmtDuration(playedMs) });
      return base;
    }
  }
}
