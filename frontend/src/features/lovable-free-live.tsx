import { decorativeSvgAccessibility } from "@/src/components/svg-compat";
import Svg, { Path } from "react-native-svg";
import {
  FreeScore,
  FreeTransitionFlash,
} from "@/src/components/lovable/free-motion";
import { dispatchFreeCommand } from "./free-live-actions";
import { useEffect, useRef, useState } from "react";
import {
  BackHandler,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { useNavigation, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FreeStorageNotice } from "@/src/components/free-storage-notice";
import { LovableBackground } from "@/src/components/lovable/background";
import { Jersey } from "@/src/components/lovable/configuration";
import { LovableIcon } from "@/src/components/lovable/icon";
import {
  MatchAction,
  MatchIcon,
  MatchSheet,
  m,
} from "@/src/components/lovable/match-ui";
import { FreeClockTrack } from "@/src/components/lovable/free-clock";
import { useFreeNotice } from "@/src/components/free-timer-runtime";
import { useDisplayClock } from "@/src/chrono/use-display-clock";
import {
  currentStep,
  lapSplits,
  type FreeTimerDisplay,
} from "@/src/domain/free-timer";
import {
  freeCommand,
  changeFreeScore,
  freeStationaryTap,
  freeReadout,
  freeStage,
  freeSwipe,
  freeViews,
  type FreeCommand,
} from "./free-live-state";
import {
  getStoreState,
  replaceFreeTimer,
  setFreeTimer,
  useStore,
} from "@/src/store/session-store";
import {
  lovable as c,
  lovableFont as f,
  withAlpha,
} from "@/src/visual/lovable";
import { freeDuration } from "@/src/domain/free-configuration";

function ScoreControl({
  name,
  color,
  compact,
  disabled,
  onChange,
}: {
  name: string;
  color: string;
  compact: false | "list" | "compact";
  disabled: boolean;
  onChange: (n: 1 | -1) => void;
}) {
  const held = useRef(false);
  const origin = useRef<{ x: number; y: number } | null>(null);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Ajouter un but : ${name}`}
      accessibilityHint="Appui long pour retirer un but"
      accessibilityActions={[
        { name: "activate", label: "Ajouter un but" },
        { name: "decrement", label: "Retirer un but" },
      ]}
      onAccessibilityAction={(e) => {
        if (!disabled)
          onChange(e.nativeEvent.actionName === "decrement" ? -1 : 1);
      }}
      disabled={disabled}
      onPressIn={(event) => {
        held.current = false;
        origin.current = {
          x: event.nativeEvent.pageX,
          y: event.nativeEvent.pageY,
        };
      }}
      onLongPress={() => {
        if (held.current) return;
        held.current = true;
        onChange(-1);
      }}
      onTouchMove={(event) => {
        if (
          !freeStationaryTap(origin.current, {
            x: event.nativeEvent.pageX,
            y: event.nativeEvent.pageY,
          })
        )
          held.current = true;
      }}
      delayLongPress={550}
      onPress={(event) => {
        if (
          !held.current &&
          freeStationaryTap(origin.current, {
            x: event.nativeEvent.pageX,
            y: event.nativeEvent.pageY,
          })
        )
          onChange(1);
        held.current = false;
      }}
      hitSlop={{ top: 5, bottom: 5 }}
      style={[
        s.scoreButton,
        {
          height: compact === "compact" ? 32 : compact ? 36 : 38,
          width: compact === "compact" ? 40 : compact ? 56 : undefined,
          borderColor: color,
          backgroundColor: withAlpha(color, 0.16),
          opacity: disabled ? 0.35 : 1,
        },
      ]}
    >
      <Text
        style={{
          fontFamily: f.extrabold,
          fontSize: compact === "compact" ? 14 : 16,
          color,
        }}
      >
        +1
      </Text>
    </Pressable>
  );
}
export function LovableFreeLive() {
  const router = useRouter(),
    navigation = useNavigation(),
    inset = useSafeAreaInsets(),
    { width, height, fontScale } = useWindowDimensions();
  const ft = useStore((x) => x.freeTimer),
    loaded = useStore((x) => x.loaded),
    replacing = useStore((x) => x.replacingFreeTimer);
  const now = useDisplayClock(!!ft?.running),
    notice = useFreeNotice();
  const [sheet, setSheet] = useState<{
      kind: "reset" | "restart" | "end";
      createdAt: number;
    } | null>(null),
    [busy, setBusy] = useState(false),
    [actionError, setActionError] = useState<string | null>(null),
    [locked, setLocked] = useState(false);
  const held = useRef(false);
  const clockOrigin = useRef<{ x: number; y: number } | null>(null);
  const two =
      width > height &&
      width - inset.left - inset.right >= 600 &&
      fontScale <= 1.5,
    land = width > height;
  const select = (view: FreeTimerDisplay) => {
    const current = getStoreState().freeTimer;
    if (current && !locked)
      setFreeTimer({ ...current, ui: { ...current.ui, view } });
  };
  const selected = ft?.ui?.view ?? ft?.config.display ?? "numeric";
  const gesture = PanResponder.create({
    onMoveShouldSetPanResponder: (_, g) =>
      !locked && Math.abs(g.dx) > 12 && Math.abs(g.dx) > Math.abs(g.dy) * 1.4,
    onPanResponderRelease: (_, g) => {
      const n = freeSwipe(g.dx, g.dy);
      if (n)
        select(
          freeViews[Math.max(0, Math.min(2, freeViews.indexOf(selected) + n))],
        );
    },
  });
  useEffect(() => {
    navigation.setOptions({ gestureEnabled: !locked });
    return () => navigation.setOptions({ gestureEnabled: true });
  }, [navigation, locked]);
  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => locked);
    return () => sub.remove();
  }, [locked]);
  useEffect(() => {
    if (loaded && !ft) router.replace("/");
  }, [loaded, ft, router]);
  if (!ft) return null;
  const r = freeReadout(ft, now),
    stage = r.stage,
    step = currentStep(r.state)!,
    isStopwatch = ft.config.kind === "stopwatch",
    blocked = locked || busy || replacing;
  const title = ft.ui?.name ?? "Chrono libre",
    kind = isStopwatch
      ? "Chronomètre"
      : ft.config.kind === "countdown"
        ? "Compte à rebours"
        : "Intervalles";
  const perform = (action: FreeCommand) => {
    const current = getStoreState().freeTimer;
    if (!current || blocked) return;
    dispatchFreeCommand(action);
  };
  const confirm = async (action: "reset" | "restart" | "end" | "relaunch") => {
    const current = getStoreState().freeTimer;
    if (!current || blocked || (sheet && sheet.createdAt !== current.createdAt))
      return;
    setBusy(true);
    const saved = await replaceFreeTimer(
      action === "end" ? null : freeCommand(current, action, Date.now()),
      current,
    );
    setBusy(false);
    if (saved) {
      setActionError(null);
      setSheet(null);
      if (action === "end") router.replace("/");
    } else {
      setActionError(
        "Le changement n’a pas été enregistré. La séance précédente est conservée. Réessayez cette action.",
      );
    }
  };
  const open = (kind: "reset" | "restart" | "end") => {
    if (!blocked) setSheet({ kind, createdAt: ft.createdAt });
  };
  const teams = ft.config.withTeams
    ? (ft.config.teams ?? [
        { id: "a", name: "Équipe A", color: "#ff9100" },
        { id: "b", name: "Équipe B", color: c.primary },
      ])
    : [];
  const scoreOn = ft.config.scoreOn !== false;
  const score = (i: number, delta: 1 | -1) => {
    const current = getStoreState().freeTimer;
    if (!current || blocked || freeStage(current) === "ready") return;
    setFreeTimer(changeFreeScore(current, i, delta));
  };
  const statusColor =
    stage === "running"
      ? c.primary
      : stage === "paused" || stage === "waiting"
        ? c.amber
        : c.muted;
  const clockHeight = land ? 128 : height <= 720 ? 196 : 220;
  const carousel = (
    <View testID="free-carousel" style={s.carousel} {...gesture.panHandlers}>
      <View
        accessibilityRole="tablist"
        accessibilityLabel="Affichage du chrono"
        style={[s.tabs, { marginTop: land ? 8 : 10 }]}
      >
        {["Numérique", "Analogique", "Circulaire"].map((label, i) => (
          <Pressable
            key={label}
            accessibilityRole="tab"
            aria-selected={selected === freeViews[i]}
            accessibilityLabel={label}
            accessibilityState={{
              selected: selected === freeViews[i],
              disabled: blocked,
            }}
            disabled={blocked}
            hitSlop={{ top: 6, bottom: 6 }}
            onPress={() => select(freeViews[i])}
            style={[
              s.tab,
              {
                height: land ? 26 : 30,
                backgroundColor:
                  selected === freeViews[i] ? c.card : "transparent",
              },
            ]}
          >
            <Text
              numberOfLines={1}
              style={{
                fontFamily: "ManropeRefined-Bold",
                fontSize: 12,
                lineHeight: 18,
                color: selected === freeViews[i] ? c.foreground : c.muted,
              }}
            >
              {label}
            </Text>
          </Pressable>
        ))}
      </View>
      <Pressable
        testID="free-clock"
        accessibilityRole={isStopwatch ? "text" : "button"}
        accessibilityLabel={
          isStopwatch
            ? r.main + r.cents
            : ft.ui?.elapsed
              ? "Afficher le temps restant"
              : "Afficher le temps écoulé"
        }
        disabled={blocked || isStopwatch}
        accessibilityValue={{ text: r.main + r.cents }}
        onPressIn={(event) => {
          clockOrigin.current = {
            x: event.nativeEvent.pageX,
            y: event.nativeEvent.pageY,
          };
        }}
        onPress={(event) => {
          if (
            !freeStationaryTap(clockOrigin.current, {
              x: event.nativeEvent.pageX,
              y: event.nativeEvent.pageY,
            })
          )
            return;
          const current = getStoreState().freeTimer;
          if (current)
            setFreeTimer({
              ...current,
              ui: { ...current.ui, elapsed: !current.ui?.elapsed },
            });
        }}
        style={{ height: clockHeight }}
      >
        <FreeClockTrack r={r} selected={selected} />
      </Pressable>
      <View style={s.dots}>
        {["Vue numérique", "Vue analogique", "Vue circulaire"].map(
          (label, i) => (
            <Pressable
              key={label}
              accessibilityRole="button"
              accessibilityLabel={label}
              accessibilityState={{ selected: selected === freeViews[i] }}
              disabled={blocked}
              hitSlop={{ top: 5, bottom: 5 }}
              onPress={() => select(freeViews[i])}
              style={s.dotControl}
            >
              <View
                style={{
                  width: selected === freeViews[i] ? 22 : 7,
                  height: 7,
                  borderRadius: 99,
                  backgroundColor:
                    selected === freeViews[i] ? c.primary : c.mutedSurface,
                }}
              />
            </Pressable>
          ),
        )}
      </View>
      <View style={[m.status, { marginTop: 2 }]}>
        <View
          style={{
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: stage === "ended" ? c.error : statusColor,
          }}
        >
          {stage === "running" ? (
            <View
              pointerEvents="none"
              style={{
                position: "absolute",
                left: -4,
                top: -4,
                width: 16,
                height: 16,
                borderRadius: 8,
                backgroundColor: withAlpha(c.primary, 0.16),
              }}
            />
          ) : null}
        </View>
        <Text
          testID="free-status"
          style={[m.statusText, { color: statusColor }]}
        >
          {locked ? "Commandes verrouillées" : r.status}
        </Text>
      </View>
    </View>
  );
  const teamCards = teams.length ? (
    <View
      accessibilityLabel="Équipes"
      style={{
        flexDirection: "row",
        flexWrap: "wrap",
        gap: teams.length > 2 ? 6 : 8,
      }}
    >
      {teams.map((team, i) => {
        const compact = teams.length > 2;
        return (
          <View
            key={team.id}
            style={[
              s.team,
              {
                width:
                  teams.length > 2 && teams.length <= 4
                    ? "100%"
                    : ((two
                        ? (width - inset.left - inset.right - 50) / 2
                        : width - inset.left - inset.right - 40) -
                        (teams.length > 4 ? 6 : 8)) /
                      2,
                paddingVertical: compact ? 6 : 10,
                paddingLeft: teams.length > 4 ? 6 : 10,
                paddingRight: compact ? (teams.length > 4 ? 6 : 8) : 10,
                borderRadius: compact ? 14 : 18,
                gap: 6,
              },
            ]}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: compact ? 6 : 8,
              }}
            >
              <Jersey color={team.color} size={compact ? 24 : 30} />
              <Text
                numberOfLines={1}
                style={{
                  flex: 1,
                  minWidth: 0,
                  fontFamily: "ManropeRefined-Bold",
                  fontSize: teams.length > 4 ? 12 : 13,
                  lineHeight: teams.length > 4 ? 18 : 19.5,
                  color: c.foreground,
                }}
              >
                {team.name}
              </Text>
              {scoreOn ? (
                <FreeScore value={ft.score[i]} size={compact ? 20 : 24} />
              ) : null}
              {compact && scoreOn ? (
                <ScoreControl
                  name={team.name}
                  color={team.color}
                  compact={teams.length > 4 ? "compact" : "list"}
                  disabled={blocked || stage === "ready"}
                  onChange={(d) => score(i, d)}
                />
              ) : null}
            </View>
            {!compact && scoreOn ? (
              <ScoreControl
                name={team.name}
                color={team.color}
                compact={false}
                disabled={blocked || stage === "ready"}
                onChange={(d) => score(i, d)}
              />
            ) : null}
          </View>
        );
      })}
    </View>
  ) : null;
  const next = stage === "ready" ? ft.steps[0] : ft.steps[ft.stepIndex + 1],
    remaining = ft.steps
      .slice(stage === "ready" ? 0 : ft.stepIndex + 1)
      .filter((x) => x.type === "work").length;
  const info =
    ft.config.kind === "interval" ? (
      <View style={[m.card, { gap: 8 }]} accessibilityLabel="Intervalles">
        {[
          [
            "Période actuelle",
            stage === "ended"
              ? "—"
              : stage === "ready"
                ? "Pas encore commencé"
                : stage === "waiting"
                  ? "Terminée"
                  : `${step.label} · série ${step.set}/${step.totalSets}`,
          ],
          ["Périodes restantes", String(remaining)],
          [
            "Ensuite",
            next && stage !== "ended"
              ? `${next.label} · ${freeDuration((next.durationMs ?? 0) / 1000)}`
              : "Fin du programme",
          ],
          ["Passage", ft.config.autoChain ? "Automatique" : "Manuel"],
        ].map(([label, value]) => (
          <View
            key={label}
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              gap: 10,
              alignItems: "center",
            }}
          >
            <Text style={s.infoLabel}>{label}</Text>
            {label === "Période actuelle" &&
            !["ready", "waiting", "ended"].includes(stage) ? (
              <View
                style={{
                  flexDirection: "row",
                  flexWrap: "wrap",
                  justifyContent: "flex-end",
                  alignItems: "center",
                  flexShrink: 1,
                }}
              >
                <View
                  style={{
                    backgroundColor: withAlpha(
                      step.type === "work" ? c.primary : c.amber,
                      0.18,
                    ),
                    paddingHorizontal: 8,
                    paddingVertical: 0,
                    borderRadius: 99,
                  }}
                >
                  <Text
                    style={[
                      s.infoValue,
                      { color: step.type === "work" ? c.primary : c.amber },
                    ]}
                  >
                    {step.label}
                  </Text>
                </View>
                <Text
                  style={s.infoValue}
                >{` · série ${step.set}/${step.totalSets}`}</Text>
              </View>
            ) : (
              <Text style={[s.infoValue, { flexShrink: 1 }]}>{value}</Text>
            )}
          </View>
        ))}
      </View>
    ) : null;
  const splits = lapSplits(ft.laps),
    best = splits.length > 2 ? Math.min(...splits) : null,
    worst = splits.length > 2 ? Math.max(...splits) : null;
  const format = (ms: number) => {
    const x = freeReadout(
      {
        ...ft,
        config: { ...ft.config, kind: "stopwatch" },
        stepAccumulatedMs: ms,
        running: false,
        stepStartedAt: 0,
      },
      0,
    );
    return x.main + x.cents;
  };
  const laps =
    isStopwatch && ft.laps.length ? (
      <View style={[m.card, { gap: 0 }]} testID="free-laps">
        <Text
          style={{
            fontFamily: f.extrabold,
            fontSize: 15,
            lineHeight: 22.5,
            color: c.foreground,
            marginBottom: 18,
          }}
        >
          Tours
        </Text>
        {ft.laps
          .map((total, i) => ({ total, i, split: splits[i] }))
          .reverse()
          .map((l) => (
            <View key={l.i} style={s.lap}>
              <Text
                style={[s.infoLabel, { flex: 1, fontSize: 14, lineHeight: 21 }]}
              >
                Tour {l.i + 1}
              </Text>
              <Text
                style={[
                  s.infoValue,
                  {
                    fontSize: 14,
                    lineHeight: 21,
                    color:
                      l.split === best
                        ? c.primary
                        : l.split === worst
                          ? c.error
                          : c.foreground,
                  },
                ]}
              >
                {format(l.split)}
              </Text>
              <Text
                style={[
                  s.infoLabel,
                  { fontFamily: f.regular, fontSize: 14, lineHeight: 21 },
                ]}
              >
                {format(l.total)}
              </Text>
            </View>
          ))}
      </View>
    ) : null;
  const noticeLayer =
    ft.config.kind === "countdown" && ft.config.endSignal ? (
      <View
        pointerEvents="none"
        accessibilityLiveRegion="assertive"
        style={{
          minHeight: land ? 40 : 46,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        {notice ? (
          <View
            testID="free-notice-banner"
            style={{
              maxWidth: undefined,
              width: "100%",
              paddingVertical: land ? 6 : 8,
              paddingHorizontal: land ? 12 : 14,
              borderWidth: 1,
              borderColor: withAlpha(c.amber, 0.65),
              borderRadius: 16,
              backgroundColor: withAlpha(c.card, 0.94),
              flexDirection: "row",
              gap: 8,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <MatchIcon name="timer" size={18} color={c.amber} />
            <Text
              style={{
                fontFamily: "ManropeRefined-Bold",
                fontSize: land ? 13 : 14,
                lineHeight: land ? 16.25 : 17.5,
                color: c.foreground,
                flexShrink: 1,
                textAlign: "center",
              }}
            >
              {notice.text}
            </Text>
          </View>
        ) : null}
      </View>
    ) : null;

  const controls = (
    items: {
      label: string;
      icon: "stop" | "restart" | "play" | "pause" | "flag" | "skip";
      action: () => void;
    }[],
  ) => (
    <View
      style={{
        flexDirection: "row",
        gap: 8,
        width: "100%",
        maxWidth: land ? 640 : undefined,
      }}
    >
      {items.map((item, i) => (
        <Pressable
          key={item.label}
          accessibilityRole="button"
          accessibilityLabel={item.label}
          disabled={blocked}
          onPress={item.action}
          style={[
            s.control,
            {
              height: land ? 48 : 60,
              flex: i === items.length - 1 ? 1.6 : 1,
              flexBasis: 0,
              minWidth: 0,
              flexDirection: land ? "row" : "column",
              backgroundColor:
                i === items.length - 1 ? c.primary : c.cardRaised,
              borderColor: i === items.length - 1 ? c.primary : c.border,
              opacity: blocked ? 0.35 : 1,
            },
          ]}
        >
          {item.icon === "skip" ? (
            <Svg
              width={20}
              height={20}
              viewBox="0 0 24 24"
              fill="none"
              stroke={c.foreground}
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              {...decorativeSvgAccessibility}
            >
              <Path d="M21 4v16" />
              <Path d="M6.029 4.285A2 2 0 0 0 3 6v12a2 2 0 0 0 3.029 1.715l9.997-5.998a2 2 0 0 0 .003-3.432z" />
            </Svg>
          ) : (
            <MatchIcon
              name={item.icon}
              color={i === items.length - 1 ? c.onPrimary : c.foreground}
            />
          )}
          <Text
            numberOfLines={1}
            adjustsFontSizeToFit
            style={{
              fontFamily: "ManropeRefined-Bold",
              fontSize: i === items.length - 1 ? 13 : 11,
              color: i === items.length - 1 ? c.onPrimary : c.foreground,
            }}
          >
            {item.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
  const dock =
    stage === "ready" ? (
      <MatchAction
        label="Démarrer"
        icon="play"
        disabled={blocked}
        onPress={() => perform("toggle")}
      />
    ) : stage === "ended" ? (
      <View
        style={{
          gap: 4,
          width: land ? undefined : "100%",
          alignSelf: "center",
          maxWidth: "100%",
        }}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={
            ft.config.kind === "countdown"
              ? "Relancer la même durée"
              : "Relancer le programme"
          }
          disabled={blocked}
          onPress={() => {
            void confirm("relaunch");
          }}
          style={{
            minHeight: land ? 48 : 56,
            borderRadius: 16,
            backgroundColor: c.primary,
            paddingHorizontal: 16,
            gap: 10,
            flexDirection: "row",
            justifyContent: "center",
            alignItems: "center",
            opacity: blocked ? 0.35 : 1,
          }}
        >
          <MatchIcon name="restart" size={18} color={c.onPrimary} />
          <Text
            style={{
              fontFamily: f.extrabold,
              fontSize: 16,
              lineHeight: 24,
              color: c.onPrimary,
              flexShrink: 1,
            }}
          >
            {ft.config.kind === "countdown"
              ? "Relancer la même durée"
              : "Relancer le programme"}
          </Text>
        </Pressable>
        <MatchAction
          label="Terminer et revenir à l'accueil"
          kind="text"
          disabled={blocked}
          onPress={() => {
            void confirm("end");
          }}
        />
      </View>
    ) : stage === "waiting" ? (
      controls([
        { label: "Fin", icon: "stop", action: () => open("end") },
        {
          label: `Lancer : ${next?.label ?? "suite"}`,
          icon: "play",
          action: () => perform("next"),
        },
      ])
    ) : (
      controls([
        { label: "Fin", icon: "stop", action: () => open("end") },
        {
          label:
            stage === "running" && isStopwatch
              ? "Tour"
              : stage === "running" && ft.config.kind === "interval"
                ? "Passer"
                : "Réinitialiser",
          icon:
            stage === "running" && isStopwatch
              ? "flag"
              : stage === "running" && ft.config.kind === "interval"
                ? "skip"
                : "restart",
          action: () =>
            stage === "running" && isStopwatch
              ? perform("lap")
              : stage === "running" && ft.config.kind === "interval"
                ? perform("skip")
                : open("reset"),
        },
        {
          label: stage === "running" ? "Pause" : "Reprendre",
          icon: stage === "running" ? "pause" : "play",
          action: () => perform("toggle"),
        },
      ])
    );
  const sheetTitle =
    sheet?.kind === "reset"
      ? "Réinitialiser le chrono ?"
      : sheet?.kind === "restart"
        ? "Recommencer la séance ?"
        : "Terminer cette session ?";
  return (
    <View testID="free-run-screen" style={m.root}>
      <LovableBackground />
      <FreeTransitionFlash timer={ft} />
      <View
        style={[
          m.header,
          {
            paddingTop: inset.top + (land ? 10 : 18),
            paddingBottom: land ? 4 : 6,
            paddingLeft: 20 + inset.left,
            paddingRight: 20 + inset.right,
          },
        ]}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Retour à l'accueil"
          disabled={blocked}
          style={m.headerButton}
          onPress={() => router.replace("/")}
        >
          <LovableIcon name="back" color={c.foreground} size={20} />
        </Pressable>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text accessibilityRole="header" style={m.title} numberOfLines={1}>
            {title.toUpperCase()}
          </Text>
          <Text style={m.subtitle} numberOfLines={1}>
            {kind} · {r.status}
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={
            locked ? "Déverrouiller les commandes" : "Paramètres du chrono"
          }
          accessibilityHint="Appui long pour verrouiller les commandes"
          style={m.headerButton}
          onPressIn={() => {
            held.current = false;
          }}
          onLongPress={() => {
            held.current = true;
            setLocked((v) => !v);
          }}
          delayLongPress={550}
          onPress={() => {
            if (!held.current && !locked) router.push({ pathname: "/settings", params: { from: "free" } });
            held.current = false;
          }}
          accessibilityActions={[
            { name: "longpress", label: "Verrouiller ou déverrouiller" },
          ]}
          onAccessibilityAction={() => setLocked((v) => !v)}
        >
          {locked ? (
            <MatchIcon name="lock" color={c.amber} />
          ) : (
            <LovableIcon name="settings" color={c.foreground} size={20} />
          )}
        </Pressable>
      </View>
      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: land ? 4 : 8,
          paddingBottom: 4,
          paddingLeft: 20 + inset.left,
          paddingRight: 20 + inset.right,
          gap: land ? 10 : 14,
        }}
      >
        <FreeStorageNotice />
        {actionError ? (
          <Text
            accessibilityRole="alert"
            style={[s.sheetText, { color: c.error }]}
          >
            {actionError}
          </Text>
        ) : null}
        {two ? (
          <View
            style={{ flexDirection: "row", gap: 10, alignItems: "flex-start" }}
          >
            <View style={{ flex: 1, gap: 10 }}>
              {teamCards}
              {ft.config.kind === "countdown" && ft.config.endSignal ? <View style={{ minHeight: land ? 40 : 46 }} /> : null}
              {info}
              {laps}
            </View>
            <View style={{ flex: 1 }}>{carousel}</View>
          </View>
        ) : (
          <>
            {teamCards}
            {carousel}
            {ft.config.kind === "countdown" && ft.config.endSignal ? <View style={{ minHeight: land ? 40 : 46 }} /> : null}
            {info}
            {laps}
          </>
        )}
      </ScrollView>
      <View
        testID="free-dock"
        style={{
          paddingTop: land ? 8 : 12,
          paddingBottom: Math.max(inset.bottom, land ? 10 : 16),
          paddingLeft: 20 + inset.left,
          paddingRight: 20 + inset.right,
          alignItems: "center",
        }}
      >
        <View pointerEvents="none" testID="free-notice-host" style={{ alignSelf: "flex-start", width: two ? (width - inset.left - inset.right - 50) / 2 : "100%" }}>
          {notice ? noticeLayer : null}
        </View>
        <View
          style={{
            width: "100%",
            maxWidth:
              land && (stage === "ready" || stage === "ended")
                ? 420
                : land
                  ? 640
                  : undefined,
            alignItems: "center",
          }}
        >
          {dock}
        </View>
      </View>
      {sheet ? (
        <MatchSheet
          dismissOnBackdrop
          label={sheetTitle}
          onClose={() => {
            if (!busy) setSheet(null);
          }}
        >
          <Text style={s.sheetTitle}>{sheetTitle}</Text>
          <Text style={s.sheetText}>
            {sheet.kind === "reset"
              ? `Le temps${ft.laps.length ? " et les tours" : ""} reviennent à zéro. Les réglages${scoreOn && teams.length ? " et les scores" : ""} sont conservés.`
              : sheet.kind === "restart"
                ? "Le temps, les tours et tous les scores reviennent à zéro. Les équipes, les réglages et Mes chronos sont conservés."
                : "Le chrono et les tours seront effacés. Vos chronos enregistrés ne changent pas."}
          </Text>
          <View style={{ gap: 8 }}>
            {sheet.kind === "reset" ? (
              <MatchAction
                label="Réinitialiser le chrono"
                height={56}
                icon="restart"
                disabled={busy || replacing}
                onPress={() => {
                  void confirm("reset");
                }}
              />
            ) : (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={
                  sheet.kind === "restart"
                    ? "Recommencer la séance"
                    : "Terminer la session"
                }
                disabled={busy || replacing}
                onPress={() => {
                  void confirm(sheet.kind);
                }}
                style={[
                  m.action,
                  {
                    height: 56,
                    backgroundColor: c.error,
                    opacity: busy || replacing ? 0.35 : 1,
                  },
                ]}
              >
                <MatchIcon
                  name={sheet.kind === "restart" ? "restart" : "close"}
                  color={c.foreground}
                  size={18}
                />
                <Text
                  style={{
                    fontFamily: f.extrabold,
                    fontSize: 16,
                    lineHeight: 24,
                    color: c.foreground,
                  }}
                >
                  {sheet.kind === "restart"
                    ? "Recommencer la séance"
                    : "Terminer la session"}
                </Text>
              </Pressable>
            )}
            {sheet.kind === "reset" && scoreOn && teams.length ? (
              <MatchAction
                label="Recommencer la séance (scores à zéro)"
                kind="secondary"
                disabled={busy}
                onPress={() => setSheet({ ...sheet, kind: "restart" })}
              />
            ) : null}
            <MatchAction
              label="Annuler"
              kind="text"
              disabled={busy}
              onPress={() => setSheet(null)}
            />
          </View>
          <FreeStorageNotice />
          {actionError ? (
            <Text
              accessibilityRole="alert"
              style={[s.sheetText, { color: c.error }]}
            >
              {actionError}
            </Text>
          ) : null}
        </MatchSheet>
      ) : null}
    </View>
  );
}
const s = StyleSheet.create({
  carousel: {
    backgroundColor: c.card,
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: 22,
    overflow: "hidden",
    paddingBottom: 12,
  },
  tabs: {
    flexDirection: "row",
    gap: 4,
    marginHorizontal: 12,
    padding: 3,
    borderRadius: 12,
    backgroundColor: c.mutedSurface,
  },
  tab: {
    flex: 1,
    minWidth: 0,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  dots: { flexDirection: "row", justifyContent: "center", gap: 4 },
  dotControl: {
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  team: {
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: 18,
    backgroundColor: c.card,
  },
  scoreButton: {
    borderWidth: 1,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  infoLabel: {
    fontFamily: f.semibold,
    fontSize: 13,
    lineHeight: 19.5,
    color: c.muted,
  },
  infoValue: {
    fontFamily: "ManropeRefined-Bold",
    fontSize: 13,
    lineHeight: 19.5,
    color: c.foreground,
    textAlign: "right",
  },
  lap: {
    flexDirection: "row",
    gap: 14,
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: c.border,
    paddingVertical: 8,
  },
  control: {
    borderWidth: 1,
    borderRadius: 16,
    gap: 4,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  sheetTitle: {
    fontFamily: f.extrabold,
    fontSize: 18,
    lineHeight: 27,
    color: c.foreground,
    textAlign: "center",
  },
  sheetText: {
    fontFamily: f.regular,
    fontSize: 14,
    lineHeight: 21,
    color: c.muted,
    textAlign: "center",
  },
});
