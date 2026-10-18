import type { ReactNode } from "react";
import { ScrollView, Text, View } from "react-native";
import Svg, { Path } from "react-native-svg";
import { matchTeams, slotLabel } from "@/src/domain/bracket";
import { computeStandings } from "@/src/domain/standings";
import { formatMMSS } from "@/src/chrono/format";
import type { Match, Session } from "@/src/domain/types";
import type { Competition } from "@/src/store/competition-history";
import { lovable as c, lovableFont as f, withAlpha } from "@/src/visual/lovable";
import { h } from "./history-ui";
import { LovableIcon } from "./icon";

function Jersey({ color, size }: { color: string; size: number }) {
  return <Svg width={size} height={size} viewBox="0 0 52 54" fill="none" accessible={false} aria-hidden>
    <Path d="M17 4.5 11 7 2.8 15.7 8.7 23l5.2-3.4V48c0 1.2 1 2.2 2.2 2.2h19.8c1.2 0 2.2-1 2.2-2.2V19.6l5.2 3.4 5.9-7.3L41 7l-6-2.5c-2 3.1-5.1 4.7-9 4.7s-7-1.6-9-4.7Z" fill={color} stroke={c.foreground} strokeOpacity={0.35} strokeWidth={1.4} strokeLinejoin="round" />
    <Path d="M17 4.5c2 3.1 5.1 4.7 9 4.7s7-1.6 9-4.7" stroke={c.background} strokeWidth={2.7} strokeLinecap="round" /><Path d="M2.8 15.7 8.7 23l5.2-3.4m24.2 0 5.2 3.4 5.9-7.3" stroke={c.foreground} strokeOpacity={0.22} strokeWidth={1.2} />
  </Svg>;
}
function Card({ title, count, children }: { title: string; count?: string | number; children: ReactNode }) { return <View style={h.card}><View style={[h.row, { justifyContent: "space-between" }]}><Text accessibilityRole="header" style={h.heading}>{title}</Text>{count !== undefined ? <Text style={[h.hint, { fontFamily: f.extrabold }]}>{count}</Text> : null}</View>{children}</View>; }
const round = (n: number) => n === 2 ? "Finale" : n === 4 ? "Demi-finales" : n === 8 ? "Quarts de finale" : n === 16 ? "Huitièmes" : `Tour de ${n}`;
const how = (m: Match) => m.shootout ? `TAB ${m.shootout[0]}–${m.shootout[1]}` : m.finishReason === "goldenGoal" ? "golden goal" : m.finishReason === "extraTimeEnd" ? "a.p." : "";
const score = (m: Match) => m.score ? `${m.score[0]} – ${m.score[1]}` : "—";

// All values come from the stored native results. No active match action exists here.
export function historySummaryCards(entry: Competition): ReactNode[] {
  const s = entry.session, accent = entry.kind === "cup" ? c.cup : c.survie;
  const final = s.matches.find(m => m.stage === "ko" && m.roundOf === 2);
  const small = s.matches.find(m => m.stage === "small");
  const champion = final?.status === "finished" ? s.teams.find(t => t.id === final.winnerId) : undefined;
  const done = s.matches.filter(m => m.status === "finished");
  const name = (id: string | null) => s.teams.find(t => t.id === id)?.name ?? "—";
  const cards: ReactNode[] = [];
  if (entry.status === "interrupted" && !champion) cards.push(<View key="interruption" style={[h.row, { padding: 12, borderRadius: 14, backgroundColor: c.secondary }]}><LovableIcon name="flag" color={c.muted} /><Text style={[h.hint, { flex: 1 }]}>Tournoi arrêté avant la fin : aucun vainqueur n&apos;est désigné. Les {done.length} résultats joués sont conservés.</Text></View>);
  else {
    const [a, b] = final ? matchTeams(final, s.matches) : [null, null];
    cards.push(<View key="champion" style={[h.card, { alignItems: "center", borderColor: withAlpha(accent, 0.45), backgroundColor: entry.kind === "cup" ? c.cupChampion : c.survieChampion }]}><LovableIcon name="trophy" color={accent} size={34} /><Text style={h.eyebrow}>CHAMPION</Text>{champion ? <View style={{ alignItems: "center", gap: 6 }}><Jersey color={champion.color} size={52} /><Text style={{ fontFamily: f.extrabold, fontSize: 22, lineHeight: 33, color: c.foreground, textAlign: "center" }}>{champion.name}</Text></View> : null}{final?.status === "finished" ? <Text style={[h.text, { fontFamily: f.extrabold, fontSize: 16, lineHeight: 24, color: accent, textAlign: "center" }]}>Finale : {name(a)} {score(final)} {name(b)}{how(final) ? ` (${how(final)})` : ""}</Text> : null}</View>);
    const runner = a === champion?.id ? b : a;
    const places = [{ label: "Champion", id: champion?.id ?? null }, { label: "Finaliste", id: runner }, ...(small ? [{ label: "3e place", id: small.winnerId }] : [])];
    cards.push(<Card key="podium" title="Podium"><View style={{ gap: 8, marginTop: 4 }}>{places.map((p, i) => <View key={i} style={[h.row, { paddingVertical: 10, paddingHorizontal: 12, borderRadius: 12, borderWidth: 1, borderColor: i ? c.border : withAlpha(accent, 0.45), backgroundColor: i ? c.secondary : entry.kind === "cup" ? c.cupPodium : c.surviePodium }]}><View style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: i ? c.mutedSurface : accent, alignItems: "center", justifyContent: "center" }}><Text style={[h.text, { fontFamily: f.extrabold, fontSize: 13, color: i ? c.foreground : c.background }]}>{i + 1}</Text></View>{p.id ? <Jersey color={s.teams.find(t => t.id === p.id)!.color} size={26} /> : null}<Text numberOfLines={1} style={[h.text, { fontFamily: f.extrabold, fontSize: i ? 14 : 16, flex: 1 }]}>{name(p.id)}</Text><Text style={[h.hint, { fontSize: 11, letterSpacing: 0.66 }]}>{p.label.toUpperCase()}</Text></View>)}</View></Card>);
  }
  cards.push(<Card key="stats" title="Statistiques"><View style={[h.row, { gap: 8 }]}>{[{ value: String(done.length), label: "matchs joués" }, { value: String(done.reduce((n, m) => n + (m.score?.[0] ?? 0) + (m.score?.[1] ?? 0), 0)), label: "buts" }, { value: formatMMSS(done.reduce((n, m) => n + m.playedMs, 0)), label: "temps de jeu" }].map(stat => <View key={stat.label} style={{ flex: 1, gap: 2, paddingVertical: 10, paddingHorizontal: 4, borderRadius: 12, backgroundColor: c.secondary, alignItems: "center" }}><Text style={[h.text, { fontFamily: f.extrabold, fontSize: 20, lineHeight: 30, fontVariant: ["tabular-nums"] }]}>{stat.value}</Text><Text style={[h.hint, { fontSize: 11, lineHeight: 16.5 }]}>{stat.label}</Text></View>)}</View></Card>);
  cards.push(<Card key="bracket" title="Tableau final"><HistoryBracket session={s} accent={accent} /></Card>);
  if (s.mode === "cup") {
    for (const group of s.cup?.groups ?? []) cards.push(<Card key={group.id} title={group.name} count={s.config.mode === "cup" ? `${s.config.qualifiersPerGroup} qualifié${s.config.qualifiersPerGroup > 1 ? "s" : ""}` : undefined}><GroupTable session={s} ids={group.teamIds} matches={s.matches.filter(m => m.groupId === group.id)} /></Card>);
    cards.push(<Text key="tie" style={h.hint}>Départage : points, confrontations directes, différence de buts, buts marqués, victoires. « = » : ex æquo.</Text>);
  }
  cards.push(<Card key="fixtures" title="Rencontres" count={`${done.length}/${s.matches.filter(m => m.status !== "bye").length}`}>{s.matches.filter(m => m.status !== "bye").map(m => <View key={m.id} style={[h.row, { paddingVertical: 9, paddingHorizontal: 2, borderBottomWidth: 1, borderColor: c.border }]}><View style={{ flex: 1, gap: 2 }}><Text style={[h.eyebrow, { fontSize: 10, lineHeight: 15, letterSpacing: 0.8 }]}>{m.label.toUpperCase()}</Text><Text style={[h.text, { fontFamily: "ManropeRefined-Bold", fontSize: 13, lineHeight: 19.5 }]}>{slotLabel(m.a, s.matches, s.teams)} <Text style={[h.hint, { fontSize: 11 }]}>vs</Text> {slotLabel(m.b, s.matches, s.teams)}</Text></View><View style={{ alignItems: "flex-end" }}><Text style={m.score ? [h.text, { fontFamily: f.extrabold }] : h.hint}>{m.score ? score(m) : m.status === "live" ? "En cours" : "En attente"}</Text>{how(m) ? <Text style={[h.hint, { fontSize: 10 }]}>{how(m)}</Text> : null}</View></View>)}</Card>);
  cards.push(<Card key="teams" title="Équipes participantes" count={s.teams.length}>{s.teams.map((team, i) => <View key={team.id} style={{ paddingVertical: 9, paddingHorizontal: 2, borderBottomWidth: i < s.teams.length - 1 ? 1 : 0, borderColor: c.border, gap: 2 }}><Text style={[h.eyebrow, { fontSize: 10, lineHeight: 15 }]}>{i + 1}</Text><View style={[h.row, { gap: 6 }]}><View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: team.color }} /><Text style={[h.text, { fontFamily: "ManropeRefined-Bold", fontSize: 13, lineHeight: 19.5 }]}>{team.name}</Text></View></View>)}</Card>);
  return cards;
}

function HistoryBracket({ session: s, accent }: { session: Session; accent: string }) {
  const ko = s.matches.filter(m => m.stage === "ko"), small = s.matches.filter(m => m.stage === "small");
  const rounds = [...new Set(ko.map(m => m.roundOf ?? 2))].sort((a, b) => b - a);
  const cols = [...rounds.map(n => ({ title: round(n), matches: ko.filter(m => m.roundOf === n) })), ...(small.length ? [{ title: "Petite finale", matches: small }] : [])];
  if (!cols.length) return <Text style={h.hint}>Pas de phase finale : le premier qualifié remporte la Cup.</Text>;
  return <ScrollView horizontal accessibilityLabel="Tableau final" contentContainerStyle={{ gap: 10, paddingBottom: 6 }}>{cols.map(col => <View key={col.title} style={{ width: 156, gap: 8 }}><Text style={h.eyebrow}>{col.title.toUpperCase()}</Text><View style={{ flex: 1, gap: 8, justifyContent: "space-around" }}>{col.matches.map(m => <View key={m.id} style={{ paddingVertical: 6, paddingHorizontal: 8, gap: 2, borderWidth: 1, borderColor: c.border, borderStyle: m.status === "bye" ? "dashed" : "solid", opacity: m.status === "bye" ? 0.7 : 1, backgroundColor: c.secondary, borderRadius: 12 }}>{[m.a, m.b].map((slot, i) => {
    const id = matchTeams(m, s.matches)[i], team = s.teams.find(t => t.id === id);
    return <View key={i} style={{ flexDirection: "row", alignItems: "center", gap: 6, minHeight: 22 }}><View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: team?.color ?? "transparent", borderWidth: team ? 0 : 1, borderColor: c.muted }} /><Text numberOfLines={1} style={[h.text, { flex: 1, fontFamily: "ManropeRefined-Bold", fontSize: 12, lineHeight: 18, color: m.score && m.winnerId !== id ? c.muted : c.foreground }]}>{slotLabel(slot, s.matches, s.teams)}</Text>{m.score ? <Text style={[h.text, { fontFamily: f.extrabold, fontSize: 12, color: m.winnerId === id ? accent : c.foreground }]}>{m.score[i]}</Text> : null}</View>;
  })}{m.status === "bye" ? <Text style={[h.hint, { fontSize: 10 }]}>Qualifié d&apos;office</Text> : how(m) ? <Text style={[h.hint, { fontSize: 10 }]}>{how(m)}</Text> : null}</View>)}</View></View>)}</ScrollView>;
}
function GroupTable({ session: s, ids, matches }: { session: Session; ids: string[]; matches: Match[] }) {
  const rows = computeStandings(ids, matches), widths = [22, 100, 23, 23, 23, 23, 25, 25, 32, 28];
  const headers = ["#", "Équipe", "J", "G", "N", "P", "BP", "BC", "Diff", "Pts"];
  return <ScrollView horizontal><View style={{ minWidth: 330 }}>{[headers, ...rows.map(r => [
    r.rank + (r.tied ? "=" : ""), s.teams.find(t => t.id === r.teamId)?.name ?? "?", r.played, r.wins, r.draws, r.losses, r.gf, r.gc, (r.gd > 0 ? "+" : "") + r.gd, r.points,
  ])].map((row, i) => {
    const team = i ? s.teams.find(t => t.id === rows[i - 1].teamId) : null;
    const qualified = !!team && s.cup?.phase === "knockout" && s.cup.qualifiedIds.includes(team.id);
    return <View key={i} style={{ flexDirection: "row", borderBottomWidth: 1, borderColor: c.border }}>{row.map((value, j) => <View key={j} style={{ width: widths[j], paddingVertical: 8, paddingHorizontal: 3, flexDirection: "row", alignItems: "center", gap: 6, borderLeftWidth: j === 0 && qualified ? 3 : 0, borderColor: c.cup, justifyContent: j < 2 ? "flex-start" : "flex-end" }}>{j === 1 && team ? <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: team.color }} /> : null}<Text numberOfLines={1} style={[h.text, { flexShrink: 1, fontSize: i ? 12 : 11, lineHeight: 18, color: !j && qualified ? c.cup : i ? c.foreground : c.muted, fontFamily: j === 9 || !i || (!j && qualified) ? "ManropeRefined-Bold" : f.semibold }]}>{value}</Text></View>)}</View>;
  })}</View></ScrollView>;
}
