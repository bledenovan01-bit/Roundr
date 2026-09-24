// E08 — Classement / tableau (vue secondaire, ne modifie pas le chrono, C03).
import { useRouter } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MaterialCommunityIcons from "@react-native-vector-icons/material-design-icons";

import { matchTeams, roundName, slotLabel } from "@/src/domain/bracket";
import { computeStandings } from "@/src/domain/standings";
import type { Match, Session } from "@/src/domain/types";
import { getStoreState, useStore } from "@/src/store/session-store";
import { fontFamily, fontSize, makeStyles, radius, spacing, useTheme } from "@/src/theme";
import { layoutStyles, useScreenLayout } from "@/src/layout";

export default function StandingsScreen() {
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { safeSides } = useScreenLayout();
  const router = useRouter();
  const active = useStore((s) => s.session);
  const session = active ?? getStoreState().lastSummary;

  if (!session) {
    return (
      <View
        style={[
          styles.root,
          { paddingTop: insets.top + spacing.xl, paddingLeft: insets.left + spacing.xl, paddingRight: insets.right + spacing.xl, paddingBottom: insets.bottom + spacing.xl },
        ]}
      >
        <Text testID="standings-empty" style={styles.empty}>Aucune session.</Text>
      </View>
    );
  }
  const isCup = session.mode === "cup";
  const showTable = session.mode === "maracana" || isCup;
  const showBracket = isCup || session.mode === "survie";

  return (
    <View testID="standings-screen" style={[styles.root, safeSides, { paddingTop: insets.top }]}>
      <View style={[layoutStyles.content, styles.header]}>
        <Pressable testID="standings-back" onPress={() => router.back()} hitSlop={12} style={styles.iconBtn} accessibilityRole="button" accessibilityLabel="Retour">
          <MaterialCommunityIcons name="chevron-left" size={30} color={colors.onSurface} />
        </Pressable>
        <Text testID="standings-title" accessibilityRole="header" style={styles.title}>{session.mode === "maracana" ? "Classement" : isCup ? "Poules & tableau" : "Tableau"}</Text>
        <View style={styles.iconBtn} />
      </View>
      <ScrollView testID="standings-scroll" contentContainerStyle={[layoutStyles.content, styles.scroll, { paddingBottom: insets.bottom + spacing["2xl"] }]}>
        {showTable ? (
          isCup ? (
            session.cup!.groups.map((g) => <StandingsTable key={g.id} session={session} title={g.name} teamIds={g.teamIds} matches={session.matches.filter((m) => m.groupId === g.id)} qualifiers={(session.config as { qualifiersPerGroup: number }).qualifiersPerGroup} />)
          ) : (
            <StandingsTable session={session} title="Classement" teamIds={session.teams.map((t) => t.id)} matches={session.matches} />
          )
        ) : null}
        {showBracket ? <Bracket session={session} /> : null}
        <ResultsList session={session} />
      </ScrollView>
    </View>
  );
}

function StandingsTable({ session, title, teamIds, matches, qualifiers }: { session: Session; title: string; teamIds: string[]; matches: Match[]; qualifiers?: number }) {
  const styles = useStyles();
  const { colors } = useTheme();
  const { contentWidth, fontScale } = useScreenLayout();
  const compact = contentWidth / fontScale < 560;
  const rows = computeStandings(teamIds, matches);
  const qualified = (id: string) => session.cup?.phase === "knockout" && session.cup.qualifiedIds.includes(id);
  const name = (id: string) => session.teams.find((t) => t.id === id)?.name ?? "?";
  return (
    <View style={styles.card} testID={`table-${title}`}>
      <Text style={styles.cardTitle}>{title}</Text>
      <View style={styles.row}>
        <Text style={[styles.cellHead, { width: 24 }]}>#</Text>
        <Text style={[styles.cellHead, { flex: 1, textAlign: "left" }]}>Équipe</Text>
        {!compact ? <>
        <Text style={[styles.cellHead, { width: 20 }]}>J</Text>
        <Text style={[styles.cellHead, { width: 50 }]}>V-N-D</Text>
        <Text style={[styles.cellHead, { width: 44 }]}>BP-BC</Text>
        <Text style={[styles.cellHead, { width: 26 }]}>+/-</Text>
        </> : null}
        <Text style={[styles.cellHead, { width: 30, color: colors.brandPrimary }]}>Pts</Text>
      </View>
      {rows.map((r, i) => (
        compact ? <CompactStandingRow key={r.teamId} row={r} name={name(r.teamId)} testID={`standing-${title}-${r.teamId}`} alternate={i % 2 === 1} qualified={!!qualified(r.teamId)} /> : <View key={r.teamId} style={[styles.row, i % 2 === 1 && styles.rowAlt, qualified(r.teamId) && { backgroundColor: colors.brandTertiary }]}>
          <Text style={[styles.cell, { width: 24 }]}>{r.rank}{r.tied ? "=" : ""}</Text>
          <Text testID={`standing-${title}-${r.teamId}-name`} style={[styles.cell, styles.cellName, { flex: 1 }]}>{name(r.teamId)}</Text>
          <Text style={[styles.cell, { width: 20 }]}>{r.played}</Text>
          <Text style={[styles.cell, { width: 50 }]}>{r.wins}-{r.draws}-{r.losses}</Text>
          <Text style={[styles.cell, { width: 44 }]}>{r.gf}-{r.gc}</Text>
          <Text style={[styles.cell, { width: 26 }]}>{r.gd > 0 ? `+${r.gd}` : r.gd}</Text>
          <Text style={[styles.cell, styles.cellName, { width: 30, textAlign: "center", color: colors.brandPrimary }]}>{r.points}</Text>
        </View>
      ))}
      {rows.some((r) => r.tied) ? <Text style={styles.note}>= : ex æquo (aucun départage arbitraire).</Text> : null}
      {qualifiers != null ? <Text style={styles.note}>{session.cup?.phase === "knockout" ? "En vert : qualifiés confirmés." : `${qualifiers} place(s) directe(s) par poule · classement provisoire.`}</Text> : null}
    </View>
  );
}

function CompactStandingRow({ row, name, testID, alternate, qualified }: { row: ReturnType<typeof computeStandings>[number]; name: string; testID: string; alternate: boolean; qualified: boolean }) {
  const styles = useStyles();
  const { colors } = useTheme();
  const { compact } = useScreenLayout();
  const stats = [["J", row.played], ["V-N-D", `${row.wins}-${row.draws}-${row.losses}`], ["BP-BC", `${row.gf}-${row.gc}`], ["+/-", row.gd > 0 ? `+${row.gd}` : row.gd]];
  return (
    <View testID={testID} style={[styles.compactStanding, alternate && styles.rowAlt, qualified && { backgroundColor: colors.brandTertiary }]}>
      <View style={styles.row}>
        <Text testID={`${testID}-rank`} style={styles.cell}>{row.rank}{row.tied ? "=" : ""}</Text>
        <Text testID={`${testID}-name`} style={[styles.cellName, { flex: 1, minWidth: 0 }]}>{name}</Text>
        <Text testID={`${testID}-points`} style={[styles.cellName, { color: colors.brandPrimary, textAlign: "center", minWidth: 30 }]}>{row.points}</Text>
      </View>
      <View style={styles.compactStats}>
        {stats.map(([label, value], i) => <View key={label} style={[styles.compactStat, compact && styles.compactStatNarrow]}>
          <Text testID={`${testID}-stat-${i}-label`} style={[styles.cellHead, { width: "auto" }]}>{label}</Text>
          <Text testID={`${testID}-stat-${i}-value`} style={[styles.cell, { width: "auto" }]}>{value}</Text>
        </View>)}
      </View>
    </View>
  );
}

function Bracket({ session }: { session: Session }) {
  const styles = useStyles();
  const { colors } = useTheme();
  const ko = session.matches.filter((m) => m.stage === "ko" || m.stage === "small");
  if (!ko.length) return <Text style={styles.note}>Phase finale non encore générée.</Text>;
  const rounds = [...new Set(ko.filter((m) => m.stage === "ko").map((m) => m.roundOf!))].sort((a, b) => b - a);
  const byes = ko.filter((m) => m.status === "bye").length;
  return (
    <View style={styles.card} testID="bracket">
      <Text style={styles.cardTitle}>Tableau{byes ? ` · ${byes} exemption${byes > 1 ? "s" : ""}` : ""}</Text>
      {rounds.map((r) => (
        <View key={r} style={{ gap: spacing.xs }}>
          <Text style={styles.roundTitle}>{roundName(r)}{r > 2 ? "s" : ""}</Text>
          {ko.filter((m) => m.roundOf === r && (m.stage === "ko" || r === 4)).sort((a, b) => (a.stage === "small" ? 1 : 0) - (b.stage === "small" ? 1 : 0)).map((m) => <MatchLine key={m.id} m={m} session={session} accent={colors.brandPrimary} />)}
        </View>
      ))}
    </View>
  );
}

function MatchLine({ m, session, accent, testPrefix = "bracket" }: { m: Match; session: Session; accent: string; testPrefix?: string }) {
  const styles = useStyles();
  const { colors } = useTheme();
  const a = slotLabel(m.a, session.matches, session.teams);
  const b = slotLabel(m.b, session.matches, session.teams);
  const [ia, ib] = matchTeams(m, session.matches);
  const isBye = m.status === "bye";
  return (
    <View testID={`${testPrefix}-match-${m.id}`} style={[styles.matchLine, m.status === "live" && { borderColor: accent }]}>
      <Text testID={`${testPrefix}-match-${m.id}-team-0`} style={[styles.matchTeam, m.winnerId && m.winnerId === ia && { color: accent }]}>{a}</Text>
      <Text testID={`${testPrefix}-match-${m.id}-score`} style={styles.matchScore}>{isBye ? "exempt" : m.score ? `${m.score[0]}–${m.score[1]}${m.shootout ? ` (${m.shootout[0]}–${m.shootout[1]} tab)` : ""}` : m.status === "live" ? "en cours" : "vs"}</Text>
      <Text testID={`${testPrefix}-match-${m.id}-team-1`} style={[styles.matchTeam, { textAlign: "right" }, m.winnerId && m.winnerId === ib && { color: accent }, isBye && { color: colors.muted }]}>{isBye ? m.stage === "small" ? "" : "—" : b}</Text>
    </View>
  );
}

function ResultsList({ session }: { session: Session }) {
  const styles = useStyles();
  const { colors } = useTheme();
  const done = session.matches.filter((m) => m.status === "finished").sort((a, b) => a.order - b.order);
  if (!done.length) return null;
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Résultats ({done.length})</Text>
      {done.map((m) => (
        <View key={m.id} style={{ gap: 2 }}>
          <Text style={styles.note}>{m.label}</Text>
          <MatchLine m={m} session={session} accent={colors.brandPrimary} testPrefix="result" />
        </View>
      ))}
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  root: { flex: 1, backgroundColor: colors.surface },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  iconBtn: { width: 46, height: 46, alignItems: "center", justifyContent: "center" },
  title: { flex: 1, minWidth: 0, textAlign: "center", fontFamily: fontFamily.textBold, fontSize: fontSize["2xl"] - 4, color: colors.onSurface, letterSpacing: -0.4 },
  scroll: { padding: spacing.lg, gap: spacing.lg },
  empty: { fontFamily: fontFamily.text, fontSize: fontSize.lg, color: colors.muted, textAlign: "center", paddingVertical: spacing.xl },
  card: { backgroundColor: colors.surfaceSecondary, borderRadius: radius.lg, padding: spacing.lg, gap: spacing.sm, borderWidth: 1, borderColor: colors.border },
  cardTitle: { fontFamily: fontFamily.textBold, fontSize: fontSize.sm, letterSpacing: 1.8, color: colors.brandPrimary, textTransform: "uppercase", marginBottom: spacing.xs },
  row: { flexDirection: "row", alignItems: "center", minHeight: 44, gap: 2, borderRadius: radius.sm, paddingHorizontal: spacing.xs },
  rowAlt: { backgroundColor: colors.surface },
  compactStanding: { borderRadius: radius.sm, paddingBottom: spacing.md, gap: spacing.xs },
  compactStats: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, paddingHorizontal: spacing.xs },
  compactStat: { flexGrow: 1, flexBasis: 64, minWidth: 0, gap: spacing.xs, alignItems: "center" },
  compactStatNarrow: { flexBasis: "45%" },
  cellHead: { fontFamily: fontFamily.textBold, fontSize: 11, color: colors.muted, width: 24, textAlign: "center", letterSpacing: 0.4 },
  cell: { fontFamily: fontFamily.text, fontSize: 13, color: colors.onSurfaceTertiary, width: 24, textAlign: "center" },
  cellName: { fontFamily: fontFamily.textBold, fontSize: fontSize.base + 1, textAlign: "left", color: colors.onSurface },
  note: { fontFamily: fontFamily.text, fontSize: fontSize.sm, color: colors.muted },
  roundTitle: { fontFamily: fontFamily.textBold, fontSize: fontSize.lg, color: colors.onSurface, marginTop: spacing.md },
  matchLine: { flexDirection: "row", alignItems: "center", gap: spacing.sm, minHeight: 52, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  matchTeam: { flex: 1, minWidth: 0, fontFamily: fontFamily.textBold, fontSize: fontSize.base + 1, color: colors.onSurface },
  matchScore: { flexShrink: 1, maxWidth: "38%", fontFamily: fontFamily.display, fontSize: fontSize.xl + 4, color: colors.onSurface, minWidth: 56, textAlign: "center" },
}));


