import type { ReactNode } from "react";
import { Pressable, Text, View, useWindowDimensions } from "react-native";
import { MatchAction, MatchIcon } from "./match-ui";
import { LovableIcon } from "./icon";
import { Jersey, Stepper } from "./configuration";
import { GroupTable, HistoryBracket } from "./history-summary";
import { h } from "./history-ui";
import {
  lovable as c,
  lovableFont as f,
  withAlpha,
} from "@/src/visual/lovable";
import { matchTeams } from "@/src/domain/bracket";
import { matchMinutes } from "@/src/domain/session";
import {
  fixtureLabel,
  resultHow,
  teamLabel,
  tournamentBest,
  tournamentFixtures,
  tournamentProjection,
  tournamentSize,
} from "@/src/domain/tournament-presentation";
import type { Session } from "@/src/domain/types";

export function TournamentSheetHeader({
  title,
  onClose,
}: {
  title: string;
  onClose?: () => void;
}) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 8,
      }}
    >
      <Text
        accessibilityRole="header"
        style={[h.heading, { fontSize: 18, lineHeight: 27, flexShrink: 1 }]}
      >
        {title}
      </Text>
      {onClose ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Fermer"
          onPress={onClose}
          style={{
            width: 44,
            height: 44,
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 14,
          }}
        >
          <MatchIcon name="close" color={c.foreground} size={20} />
        </Pressable>
      ) : null}
    </View>
  );
}

export function TournamentCard({
  title,
  count,
  children,
}: {
  title: string;
  count?: string | number;
  children: ReactNode;
}) {
  return (
    <View style={h.card}>
      <View style={[h.row, { justifyContent: "space-between" }]}>
        <Text accessibilityRole="header" style={h.heading}>
          {title}
        </Text>
        {count !== undefined ? (
          <Text style={[h.hint, { fontFamily: f.extrabold }]}>{count}</Text>
        ) : null}
      </View>
      {children}
    </View>
  );
}
export function TournamentNote({
  children,
  warn = false,
}: {
  children: ReactNode;
  warn?: boolean;
}) {
  return (
    <View
      style={{
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 12,
        backgroundColor: withAlpha(warn ? c.survie : c.primary, 0.14),
        flexDirection: "row",
        alignItems: "flex-start",
        gap: 10,
      }}
    >
      <LovableIcon
        name={warn ? "chevron" : "trophy"}
        size={16}
        color={c.primary}
      />
      <Text
        style={[
          h.hint,
          {
            flex: 1,
            color: c.foreground,
            fontFamily: f.semibold,
            fontSize: 12,
            lineHeight: 17.4,
          },
        ]}
      >
        {children}
      </Text>
    </View>
  );
}
export function TournamentBadge({
  text,
  accent,
}: {
  text: string;
  accent: string;
}) {
  return (
    <Text
      style={{
        alignSelf: "flex-start",
        paddingVertical: 3,
        paddingHorizontal: 9,
        borderRadius: 99,
        backgroundColor: withAlpha(accent, 0.16),
        color: accent,
        fontFamily: f.extrabold,
        fontSize: 11,
        lineHeight: 16.5,
      }}
    >
      {text}
    </Text>
  );
}
export function TournamentBar({
  played,
  total,
}: {
  played: number;
  total: number;
}) {
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: total, now: played }}
      style={{
        height: 10,
        width: "100%",
        borderRadius: 99,
        backgroundColor: c.mutedSurface,
        overflow: "hidden",
      }}
    >
      <View
        style={{
          height: "100%",
          width: `${Math.min(100, (played / Math.max(1, total)) * 100)}%`,
          backgroundColor: c.primary,
          borderRadius: 99,
        }}
      />
    </View>
  );
}
export function TournamentInfo({
  children,
  accent,
  highlight = false,
}: {
  children: ReactNode;
  accent: string;
  highlight?: boolean;
}) {
  const { width, height } = useWindowDimensions(),
    land = width > height;
  return (
    <View
      style={{
        paddingVertical: land ? 8 : 12,
        paddingHorizontal: land ? 12 : 14,
        gap: 6,
        borderWidth: 1,
        borderColor: highlight ? withAlpha(accent, 0.45) : c.border,
        borderRadius: 16,
        backgroundColor: c.secondary,
      }}
    >
      {children}
    </View>
  );
}
export function FixtureMatchup({ a, b }: { a: string; b: string }) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "baseline",
        gap: 8,
        flexWrap: "wrap",
      }}
    >
      <Text
        style={[
          h.text,
          { fontFamily: f.extrabold, fontSize: 16, lineHeight: 24 },
        ]}
      >
        {a}
      </Text>
      <Text style={[h.hint, { fontSize: 12 }]}>vs</Text>
      <Text
        style={[
          h.text,
          { fontFamily: f.extrabold, fontSize: 16, lineHeight: 24 },
        ]}
      >
        {b}
      </Text>
    </View>
  );
}
export function TournamentTabs({
  value,
  onChange,
  cup,
}: {
  value: string;
  onChange: (v: string) => void;
  cup: boolean;
}) {
  const tabs = cup
    ? [
        ["matches", "Matchs"],
        ["groups", "Poules"],
        ["bracket", "Tableau"],
      ]
    : [
        ["bracket", "Tableau"],
        ["matches", "Matchs"],
      ];
  return (
    <View accessibilityRole="tablist" style={{ flexDirection: "row", gap: 8 }}>
      {tabs.map(([id, label]) => (
        <Pressable
          accessibilityRole="tab"
          accessibilityLabel={label}
          accessibilityState={{ selected: value === id }}
          key={id}
          onPress={() => onChange(id)}
          style={{
            flex: 1,
            minWidth: 0,
            height: 44,
            paddingHorizontal: 8,
            justifyContent: "center",
            alignItems: "center",
            borderRadius: 12,
            borderWidth: 1,
            borderColor: value === id ? c.primary : c.border,
            backgroundColor: value === id ? c.primary : c.secondary,
          }}
        >
          <Text
            style={{
              fontFamily: "ManropeRefined-Bold",
              fontSize: 13,
              lineHeight: 19.5,
              color: value === id ? c.onPrimary : c.foreground,
            }}
          >
            {label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}
export function TournamentFixtures({
  session: s,
  onCorrect,
  canCorrect = false,
}: {
  session: Session;
  onCorrect?: (id: string) => void;
  canCorrect?: boolean;
}) {
  const projection = tournamentProjection(s),
    fixtures = projection.fixtures.filter((m) => m.status !== "bye"),
    accent = s.mode === "cup" ? c.cup : c.survie;
  return (
    <TournamentCard
      title="Rencontres"
      count={`${projection.done.length}/${projection.total}`}
    >
      <View>
        {fixtures.map((m, i) => {
          const finished = m.status === "finished",
            next = m.id === projection.next?.id;
          return (
            <View
              key={m.id}
              testID={`fixture-${m.id}`}
              style={{
                flexDirection: "row",
                gap: 10,
                alignItems: "center",
                paddingVertical: 9,
                paddingHorizontal: next ? 10 : 2,
                borderLeftWidth: next ? 3 : 0,
                borderLeftColor: accent,
                borderBottomWidth: i === fixtures.length - 1 ? 0 : 1,
                borderBottomColor: c.border,
              }}
            >
              <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
                <Text
                  style={[
                    h.eyebrow,
                    { fontSize: 10, lineHeight: 15, letterSpacing: 0.8 },
                  ]}
                >
                  {fixtureLabel(s, m).toUpperCase()}
                  {s.live?.matchId === m.id && !finished ? " · EN COURS" : ""}
                </Text>
                <Text
                  numberOfLines={1}
                  style={[
                    h.text,
                    {
                      fontFamily: "ManropeRefined-Bold",
                      fontSize: 13,
                      lineHeight: 19.5,
                    },
                  ]}
                >
                  {teamLabel({ ...s, matches: projection.fixtures }, m.a)}{" "}
                  <Text style={[h.hint, { fontSize: 11 }]}>vs</Text>{" "}
                  {teamLabel({ ...s, matches: projection.fixtures }, m.b)}
                </Text>
              </View>
              <View
                style={{ flexDirection: "row", gap: 6, alignItems: "center" }}
              >
                <Text
                  style={[
                    h.text,
                    finished
                      ? { fontFamily: f.extrabold }
                      : {
                          fontFamily: "ManropeRefined-Bold",
                          fontSize: 11,
                          color: c.muted,
                        },
                  ]}
                >
                  {finished && m.score
                    ? `${m.score[0]} – ${m.score[1]}`
                    : matchTeams(m, projection.fixtures).every(Boolean)
                      ? `${matchMinutes(s, m)} min`
                      : "En attente"}
                </Text>
                {resultHow(m) ? (
                  <Text style={[h.hint, { fontSize: 10 }]}>{resultHow(m)}</Text>
                ) : null}
                {finished && canCorrect && onCorrect ? (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Corriger ${teamLabel(s, m.a)} contre ${teamLabel(s, m.b)}`}
                    onPress={() => onCorrect(m.id)}
                    hitSlop={8}
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 8,
                      borderWidth: 1,
                      borderColor: c.border,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <LovableIcon name="pencil" size={14} color={c.muted} />
                  </Pressable>
                ) : null}
              </View>
            </View>
          );
        })}
      </View>
    </TournamentCard>
  );
}
export function TournamentGroupCards(s: Session): ReactNode[] {
  if (s.config.mode !== "cup") return [];
  const q = s.config.qualifiersPerGroup,
    best = tournamentBest(s);
  return [
    ...(s.cup?.groups ?? []).map((g) => (
      <TournamentCard
        key={g.id}
        title={g.name}
        count={`${q} qualifié${q > 1 ? "s" : ""}`}
      >
        <GroupTable
          session={s}
          ids={g.teamIds}
          matches={s.matches.filter((m) => m.groupId === g.id)}
          referenceUI
        />
      </TournamentCard>
    )),
    <Text key="group-tiebreak-rules" style={h.hint}>
      Départage : points, confrontations directes, différence de buts, buts
      marqués, victoires. « = » : ex æquo.
      {best
        ? ` ${best} meilleur${best > 1 ? "s" : ""} suivant${best > 1 ? "s" : ""} repêché${best > 1 ? "s" : ""} (moyenne par match).`
        : ""}
    </Text>,
  ];
}
export function TournamentBracket({ session: s }: { session: Session }) {
  if (s.mode === "cup" && tournamentSize(s) < 2)
    return (
      <Text style={h.hint}>
        Pas de phase finale : le premier qualifié remporte la Cup.
      </Text>
    );
  return (
    <HistoryBracket
      session={{ ...s, matches: tournamentFixtures(s) }}
      accent={s.mode === "cup" ? c.cup : c.survie}
      nextMatchId={tournamentProjection(s).next?.id}
      referenceLabels
    />
  );
}
export function TournamentScoreDuo({
  session: s,
  ids,
  value,
  onChange,
  label,
}: {
  session: Session;
  ids: [string, string];
  value: [number, number];
  onChange: (value: [number, number]) => void;
  label: string;
}) {
  const { width, height } = useWindowDimensions();
  return (
    <View style={{ flexDirection: "row", gap: width > height ? 12 : 6 }}>
      {ids.map((id, i) => {
        const t = s.teams.find((t) => t.id === id)!;
        return (
          <View
            key={i}
            style={{ flex: 1, minWidth: 0, alignItems: "center", gap: 8 }}
          >
            <View style={{ alignItems: "center", gap: 4 }}>
              <Jersey color={t.color} size={30} />
              <Text
                numberOfLines={1}
                style={[
                  h.text,
                  {
                    fontFamily: f.extrabold,
                    fontSize: 13,
                    lineHeight: 19.5,
                    textAlign: "center",
                  },
                ]}
              >
                {t.name}
              </Text>
            </View>
            <Stepper
              value={value[i]}
              min={0}
              max={Math.max(30, value[i])}
              unit=""
              label={`${label} ${t.name}`}
              onChange={(v) =>
                onChange(i === 0 ? [v, value[1]] : [value[0], v])
              }
            />
          </View>
        );
      })}
    </View>
  );
}
export function TournamentDanger({
  onPress,
  disabled,
}: {
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Interrompre définitivement"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={{
        width: "100%",
        minHeight: 56,
        borderRadius: 16,
        backgroundColor: c.error,
        padding: 12,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        opacity: disabled ? 0.35 : 1,
      }}
    >
      <MatchIcon name="flag" size={18} color={c.foreground} />
      <Text
        style={[
          h.text,
          { fontFamily: f.extrabold, fontSize: 16, color: c.foreground },
        ]}
      >
        Interrompre définitivement
      </Text>
    </Pressable>
  );
}
export function TournamentStorageError({
  error,
  onRetry,
}: {
  error: string | null;
  onRetry: () => void;
}) {
  return error ? (
    <View style={{ gap: 4 }}>
      <Text accessibilityRole="alert" style={h.error}>
        {error}
      </Text>
      <MatchAction
        label="Réessayer la sauvegarde"
        kind="text"
        onPress={onRetry}
      />
    </View>
  ) : null;
}
