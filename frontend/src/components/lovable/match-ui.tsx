import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  AccessibilityInfo,
  Animated,
  Modal,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import Svg, { Circle, G, Path, Rect } from "react-native-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { Session, Team } from "@/src/domain/types";
import { Jersey } from "./configuration";
import { LovableIcon } from "./icon";
import {
  lovable as c,
  lovableFont as f,
  withAlpha,
} from "@/src/visual/lovable";
import {
  matchPages,
  pageNames,
  visibleMatchPage,
  type matchProjection,
} from "@/src/features/match-presentation";

import { TimerDigits } from "./timer-digits";

export type MatchIconName =
  | "check"
  | "pencil"
  | "play"
  | "pause"
  | "stop"
  | "restart"
  | "music"
  | "lock"
  | "unlock"
  | "megaphone"
  | "timer"
  | "plus"
  | "minus"
  | "in"
  | "out"
  | "close"
  | "trophy"
  | "home"
  | "flag"
  | "userPlus";
// Lucide 0.575.0 geometry, ISC license in docs/lucide-license.txt.
export function MatchIcon({
  name,
  size = 20,
  color = c.foreground,
}: {
  name: MatchIconName;
  size?: number;
  color?: string;
}) {
  if(name==="check"||name==="pencil")return <LovableIcon name={name} size={size} color={color}/>;
  if (name === "trophy")
    return <LovableIcon name="trophy" size={size} color={color} />;
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      stroke={color}
      strokeWidth={2}
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      accessible={false}
      aria-hidden
    >
      {name === "home" ? (
        <Path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-8H9v8H4a1 1 0 0 1-1-1z" />
      ) : name === "flag" ? (
        <Path d="M4 22V4a1 1 0 0 1 .4-.8A6 6 0 0 1 8 2c3 0 5 2 7.333 2q2 0 3.067-.8A1 1 0 0 1 20 4v10a1 1 0 0 1-.4.8A6 6 0 0 1 16 16c-3 0-5-2-8-2a6 6 0 0 0-4 1.528" />
      ) : name === "userPlus" ? (
        <>
          <Path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M19 8v6M16 11h6" />
          <Circle cx={9} cy={7} r={4} />
        </>
      ) : name === "play" ? (
        <Path
          d="M5 5a2 2 0 0 1 3.008-1.728l11.997 6.998a2 2 0 0 1 .003 3.458l-12 7A2 2 0 0 1 5 19z"
          fill={color}
        />
      ) : name === "pause" ? (
        <>
          <Rect x={5} y={3} width={5} height={18} rx={1} fill={color} />
          <Rect x={14} y={3} width={5} height={18} rx={1} fill={color} />
        </>
      ) : name === "stop" ? (
        <Rect x={3} y={3} width={18} height={18} rx={2} />
      ) : name === "restart" ? (
        <>
          <Path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8M3 3v5h5" />
        </>
      ) : name === "music" ? (
        <>
          <Path d="M9 18V5l12-2v13M9 8l12-2" />
          <Circle cx={6} cy={18} r={3} />
          <Circle cx={18} cy={16} r={3} />
        </>
      ) : name === "lock" || name === "unlock" ? (
        <>
          <Rect x={3} y={11} width={18} height={11} rx={2} />
          <Path
            d={
              name === "lock"
                ? "M7 11V7a5 5 0 0 1 10 0v4"
                : "M7 11V7a5 5 0 0 1 9.9-1"
            }
          />
        </>
      ) : name === "megaphone" ? (
        <>
          <Path d="M11 6a13 13 0 0 0 8.4-2.8A1 1 0 0 1 21 4v12a1 1 0 0 1-1.6.8A13 13 0 0 0 11 14H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2zM6 14a12 12 0 0 0 2.4 7.2 2 2 0 0 0 3.2-2.4A8 8 0 0 1 10 14M8 6v8" />
        </>
      ) : name === "timer" ? (
        <>
          <Circle cx={12} cy={14} r={8} />
          <Path d="M10 2h4M12 14l3-3" />
        </>
      ) : name === "plus" ? (
        <Path d="M12 5v14M5 12h14" />
      ) : name === "minus" ? (
        <Path d="M5 12h14" />
      ) : name === "in" ? (
        <Path d="m9 18 6-6-6-6" />
      ) : name === "out" ? (
        <Path d="M19 12H5m7 7-7-7 7-7" />
      ) : (
        <Path d="m6 6 12 12M6 18 18 6" />
      )}
    </Svg>
  );
}
export function MatchAction({
  label,
  onPress,
  icon,
  kind = "primary",
  height,
  disabled = false,
  testID,
  fontSize,
}: {
  label: string;
  onPress: () => void;
  icon?: MatchIconName;
  kind?: "primary" | "secondary" | "text";
  height?: number;
  disabled?: boolean;
  testID?: string;
  fontSize?: number;
}) {
  const { width, height: screenHeight } = useWindowDimensions(),
    h =
      height ??
      (kind === "text"
        ? 44
        : kind === "secondary"
          ? 50
          : width > screenHeight
            ? 48
            : 56);
  const color =
      kind === "primary"
        ? c.onPrimary
        : kind === "text"
          ? c.muted
          : c.foreground,
    size = fontSize ?? (kind === "primary" ? 16 : 14);
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        m.action,
        {
          minHeight: h,
          backgroundColor:
            kind === "primary"
              ? c.primary
              : kind === "secondary"
                ? c.cardRaised
                : "transparent",
          borderWidth: kind === "secondary" ? 1 : 0,
          opacity: disabled ? 0.35 : pressed ? 0.9 : 1,
        },
      ]}
    >
      {icon ? <MatchIcon name={icon} size={16} color={color} /> : null}
      <Text
        style={{
          fontFamily: kind === "primary" ? f.extrabold : "ManropeRefined-Bold",
          fontSize: size,
          lineHeight: (size * 10) / 7,
          color,
          textAlign: "center",
          flexShrink: 1,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}
export function MatchScoreboard({
  teams,
  score,
  scoreOn,
  canScore,
  locked,
  onGoal,
  onCorrect,
  compact = false,
  goalTarget = null,
  gridSecondRow,
  compactSize = 36,
  winner = null,
}: {
  teams: [Team | null, Team | null];
  score: [number, number];
  scoreOn: boolean;
  canScore: boolean;
  locked: boolean;
  onGoal: (side: 0 | 1, delta: 1 | -1) => void;
  onCorrect: () => void;
  compact?: boolean;
  goalTarget?: number | null;
  gridSecondRow?: number;
  compactSize?: number;
  winner?: 0 | 1 | null;
}) {
  const [scoreWidth, setScoreWidth] = useState(94),
    [scale] = useState(() => new Animated.Value(1));
  const [reduceMotion, setReduceMotion] = useState(false);
  const scoreKey = score.join(":");
  useEffect(() => {
    void AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
    const sub = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      setReduceMotion,
    );
    return () => sub.remove();
  }, []);
  useEffect(() => {
    if (reduceMotion) return;
    const a = Animated.sequence([
      Animated.timing(scale, {
        toValue: 1.12,
        duration: 140,
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 1,
        duration: 210,
        useNativeDriver: true,
      }),
    ]);
    a.start();
    return () => a.stop();
  }, [scoreKey, reduceMotion, scale]);
  const { width, height } = useWindowDimensions(),
    landscape = width > height;
  const font = landscape ? 34 : height < 720 ? 38 : 44;
  // Lovable's two landscape grid rows share the surplus height of the carousel.
  const natural = scoreOn ? 151.5 : 95.5,
    minHeight =
      gridSecondRow === undefined
        ? undefined
        : Math.max(natural, (208 - 10 - gridSecondRow + natural) / 2);
  return (
    <View
      testID="match-scoreboard"
      accessibilityLabel="Score"
      style={[
        m.scoreboard,
        {
          minHeight,
          justifyContent: "space-around",
          paddingTop: compact ? 0 : landscape ? 12 : 16,
          paddingBottom: compact ? 0 : landscape ? 12 : 14,
          paddingHorizontal: compact ? 0 : landscape ? 12 : 14,
          borderWidth: compact ? 0 : 1,
          backgroundColor: compact ? "transparent" : c.card,
        },
      ]}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
        {teams
          .map((team, i) => (
            <View key={i} style={m.team}>
              <Jersey
                color={team?.color ?? c.muted}
                size={compact ? compactSize : 44}
              />
              <Text
                numberOfLines={1}
                style={[m.teamName, winner === i && { color: c.primary }]}
              >
                {team?.name}
              </Text>
            </View>
          ))
          .flatMap((node, i) =>
            i === 0
              ? [
                  node,
                  <Pressable
                    key="score"
                    disabled={locked || !scoreOn}
                    accessibilityRole="button"
                    accessibilityLabel={
                      scoreOn
                        ? `Score ${score[0]} à ${score[1]} ; corriger le score`
                        : "Score désactivé"
                    }
                    accessibilityHint="Ouvrir les commandes de correction du score"
                    onPress={onCorrect}
                    style={{ maxWidth: "52%" }}
                  >
                    <Animated.View style={{ transform: [{ scale }] }}>
                      <Text
                        testID="match-score"
                        accessibilityLiveRegion="polite"
                        onLayout={(e) =>
                          setScoreWidth(e.nativeEvent.layout.width)
                        }
                        style={[
                          m.big,
                          {
                            fontSize: font,
                            lineHeight: font,
                            letterSpacing: -font * 0.01,
                          },
                        ]}
                      >
                        {scoreOn
                          ? score[0] + " – " + score[1]
                          : compact
                            ? "—"
                            : "vs"}
                      </Text>
                    </Animated.View>
                  </Pressable>,
                ]
              : [node],
          )}
      </View>
      {!compact && scoreOn ? (
        <View
          style={{
            flexDirection: "row",
            gap: 10,
            alignItems: "center",
            marginTop: 10,
          }}
        >
          <GoalButton
            team={teams[0]}
            side={0}
            enabled={canScore && !locked}
            onGoal={onGoal}
          />
          <Text style={[m.hint, { width: scoreWidth }]}>
            {goalTarget ? "Premier à " + goalTarget : "Appui long : −1"}
          </Text>
          <GoalButton
            team={teams[1]}
            side={1}
            enabled={canScore && !locked}
            onGoal={onGoal}
          />
        </View>
      ) : null}
    </View>
  );
}
function GoalButton({
  team,
  side,
  enabled,
  onGoal,
}: {
  team: Team | null;
  side: 0 | 1;
  enabled: boolean;
  onGoal: (s: 0 | 1, d: 1 | -1) => void;
}) {
  const held = useRef(false);
  const color = team?.color ?? c.muted;
  return (
    <Pressable
      testID={`match-goal-${side}`}
      accessibilityRole="button"
      accessibilityLabel={`But pour ${team?.name} (appui long : annuler)`}
      accessibilityHint="Toucher pour ajouter un but ; appui long pour retirer le dernier but"
      accessibilityState={{ disabled: !enabled }}
      disabled={!enabled}
      delayLongPress={550}
      onPressIn={() => {
        held.current = false;
      }}
      onLongPress={() => {
        held.current = true;
        onGoal(side, -1);
      }}
      onPress={() => {
        if (!held.current) onGoal(side, 1);
        held.current = false;
      }}
      style={({ pressed }) => [
        {
          height: 46,
          flex: 1,
          minWidth: 0,
          borderRadius: 14,
          borderWidth: 1,
          borderColor: color,
          backgroundColor: withAlpha(color, 0.16),
          alignItems: "center",
          justifyContent: "center",
          opacity: enabled ? 1 : 0.35,
        },
        pressed && { transform: [{ scale: 0.97 }] },
      ]}
    >
      <Text
        style={{ fontFamily: f.extrabold, fontSize: 18, lineHeight: 27, color }}
      >
        +1
      </Text>
    </Pressable>
  );
}
type Projection = ReturnType<typeof matchProjection>;
export function MatchCarousel({
  session,
  projection,
  locked,
  next,
  onToggle,
  onGiant,
  selected,
  onSelect,
}: {
  session: Session;
  projection: Projection;
  locked: boolean;
  next: ReactNode;
  onToggle: () => void;
  onGiant: () => void;
  selected: number;
  onSelect: (index: number) => void;
}) {
  const pages = matchPages(session),
    [width, setWidth] = useState(0),
    [offset] = useState(() => new Animated.Value(0));
  const [reduceMotion, setReduceMotion] = useState(false),
    held = useRef(false);
  const page = visibleMatchPage(selected, pages);
  const { width: sw, height: sh } = useWindowDimensions(),
    landscape = sw > sh;
  const slideHeight = landscape ? 170 : sh < 620 ? 164 : sh < 720 ? 196 : 232,
    dialSize = landscape ? 126 : sh < 620 ? 122 : sh < 720 ? 146 : 174;
  useEffect(() => {
    void AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
    const sub = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      setReduceMotion,
    );
    return () => sub.remove();
  }, []);
  useEffect(() => {
    const a = Animated.timing(offset, {
      toValue: -width * page,
      duration: reduceMotion ? 0 : 350,
      useNativeDriver: true,
    });
    a.start();
    return () => a.stop();
  }, [offset, width, page, reduceMotion]);
  const go = (n: number) => {
    if (!locked) onSelect(visibleMatchPage(n, pages));
  };
  const pan = PanResponder.create({
    onMoveShouldSetPanResponder: (_, g) =>
      !locked && Math.abs(g.dx) > 20 && Math.abs(g.dx) > Math.abs(g.dy) * 1.3,
    onPanResponderRelease: (_, g) => {
      if (Math.abs(g.dx) > 50) go(page + (g.dx < 0 ? 1 : -1));
    },
  });
  const status = (
    <View style={m.status}>
      <View
        style={{
          height: 8,
          width: 8,
          borderRadius: 4,
          backgroundColor:
            projection.tone === "running"
              ? c.primary
              : projection.tone === "paused"
                ? c.amber
                : projection.tone === "ended"
                  ? c.error
                  : c.muted,
        }}
      />
      <Text
        testID="match-status"
        style={[
          m.statusText,
          {
            color:
              projection.tone === "running"
                ? c.primary
                : projection.tone === "paused"
                  ? c.amber
                  : c.muted,
          },
        ]}
      >
        {locked ? "Commandes verrouillées" : projection.status}
      </Text>
    </View>
  );
  return (
    <View
      testID="match-carousel"
      accessibilityLabel="Vues du match"
      onLayout={(e) => setWidth(e.nativeEvent.layout.width - 2)}
      style={m.carousel}
      {...pan.panHandlers}
    >
      <View style={{ height: slideHeight, overflow: pages[page] === "tournament" ? "visible" : "hidden", zIndex: pages[page] === "tournament" ? 1 : undefined }}>
        <Animated.View
          style={{
            flexDirection: "row",
            height: slideHeight,
            width: Math.max(width, 1) * pages.length,
            transform: [{ translateX: offset }],
          }}
        >
          {pages.map((kind, i) => (
            <View
              key={kind}
              testID={`match-page-${kind}`}
              accessibilityElementsHidden={i !== page}
              importantForAccessibility={
                i !== page ? "no-hide-descendants" : "auto"
              }
              aria-hidden={i !== page}
              style={{ width: width || sw - 42, height: slideHeight }}
            >
              {kind === "digital" || kind === "ring" ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={
                    projection.canToggle
                      ? projection.label.includes("ÉCOULÉ")
                        ? "Afficher le temps restant"
                        : "Afficher le temps écoulé"
                      : "Agrandir le chronomètre"
                  }
                  accessibilityHint="Appui long pour agrandir"
                  disabled={locked}
                  onPressIn={() => {
                    held.current = false;
                  }}
                  onLongPress={() => {
                    held.current = true;
                    onGiant();
                  }}
                  onPress={() => {
                    if (!held.current && projection.canToggle) onToggle();
                    held.current = false;
                  }}
                  style={[
                    m.timer,
                    {
                      gap: landscape || sh < 620 ? 8 : 14,
                      paddingTop: landscape || sh < 620 ? 10 : 16,
                    },
                  ]}
                >
                  {kind === "ring" ? (
                    <View style={{ width: dialSize, height: dialSize }}>
                      <Svg
                        width={dialSize}
                        height={dialSize}
                        viewBox="0 0 140 140"
                        aria-hidden
                        accessible={false}
                      >
                        <G rotation={-90} origin="70,70">
                          <Circle
                            cx={70}
                            cy={70}
                            r={62}
                            fill="none"
                            stroke={c.mutedSurface}
                            strokeWidth={9}
                          />
                          <Circle
                            cx={70}
                            cy={70}
                            r={62}
                            fill="none"
                            stroke={c.primary}
                            strokeWidth={9}
                            strokeLinecap="round"
                            strokeDasharray={2 * Math.PI * 62}
                            strokeDashoffset={
                              2 * Math.PI * 62 * (1 - projection.progress)
                            }
                          />
                        </G>
                      </Svg>
                      <View
                        style={[
                          StyleSheet.absoluteFill,
                          {
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 6,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            m.eyebrow,
                            {
                              fontSize: landscape ? 7 : 9,
                              lineHeight: landscape ? 10 : 90 / 7,
                              letterSpacing: landscape ? 0 : 1.08,
                            },
                          ]}
                        >
                          {projection.label}
                        </Text>
                        <MatchDigits
                          projection={projection}
                          size={
                            landscape ? 26 : sh < 620 ? 25 : sh < 720 ? 30 : 36
                          }
                          ring
                        />
                      </View>
                    </View>
                  ) : (
                    <>
                      <Text style={m.eyebrow}>{projection.label}</Text>
                      <MatchDigits
                        projection={projection}
                        size={landscape ? 34 : sh < 720 ? 38 : 44}
                      />
                      <View
                        testID="match-progress"
                        accessibilityRole="progressbar"
                        accessibilityValue={{
                          min: 0,
                          max: 100,
                          now: Math.round(projection.progress * 100),
                        }}
                        style={m.bar}
                      >
                        <View
                          style={{
                            height: "100%",
                            borderRadius: 99,
                            backgroundColor: c.primary,
                            width: `${projection.progress * 100}%`,
                          }}
                        />
                      </View>
                    </>
                  )}
                  {status}
                </Pressable>
              ) : kind === "next" || kind === "tournament" ? (
                next
              ) : (
                <View
                  style={{ flex: 1, padding: landscape ? 10 : 14, gap: 14 }}
                >
                  <Text style={m.eyebrow}>MUSIQUE</Text>
                  <View
                    style={{
                      flex: 1,
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 6,
                    }}
                  >
                    <View
                      style={{
                        height: 56,
                        width: 56,
                        backgroundColor: c.secondary,
                        borderWidth: 1,
                        borderColor: c.border,
                        borderRadius: 14,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <MatchIcon name="music" size={26} color={c.muted} />
                    </View>
                    <Text style={[m.teamName, { fontSize: 14 }]}>
                      Contrôle musical indisponible
                    </Text>
                    <Text style={[m.hint, { fontSize: 12, lineHeight: 18 }]}>
                      La connexion à la musique du téléphone n’est pas encore
                      disponible.
                    </Text>
                  </View>
                </View>
              )}
            </View>
          ))}
        </Animated.View>
      </View>
      <View style={m.dots}>
        {pages.map((kind, i) => (
          <Pressable
            key={kind}
            testID={`match-view-${kind}`}
            accessibilityRole="button"
            accessibilityLabel={pageNames[kind]}
            accessibilityState={{ selected: i === page, disabled: locked }}
            aria-current={i === page ? "true" : undefined}
            disabled={locked}
            onPress={() => go(i)}
            hitSlop={{ top: 10, bottom: 10, left: 2, right: 2 }}
            style={{
              width: 24,
              height: 24,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <View
              style={{
                width: i === page ? 22 : 7,
                height: 7,
                borderRadius: 99,
                backgroundColor: i === page ? c.primary : c.mutedSurface,
              }}
            />
          </Pressable>
        ))}
      </View>
    </View>
  );
}
export function MatchDigits({
  projection,
  size,
  ring = false,
}: {
  projection: Pick<Projection, "main" | "cents">;
  size: number;
  ring?: boolean;
}) {
  return <TimerDigits main={projection.main} cents={projection.cents} size={size} ring={ring} testID="match-digits" centsTestID="match-centiseconds" />;
}

export function MatchSheet({
  label,
  onClose,
  children,
  dismissOnBackdrop = false,
}: {
  label: string;
  onClose?: () => void;
  children: ReactNode;
  dismissOnBackdrop?: boolean;
}) {
  const { width, height } = useWindowDimensions(),
    inset = useSafeAreaInsets(),
    landscape = width > height;
  const [reduceMotion, setReduceMotion] = useState(false);
  useEffect(() => {
    let active = true;
    void AccessibilityInfo.isReduceMotionEnabled().then(value => { if (active) setReduceMotion(value); });
    const subscription = AccessibilityInfo.addEventListener("reduceMotionChanged", setReduceMotion);
    return () => { active = false; subscription.remove(); };
  }, []);
  return (
    <Modal
      transparent
      visible
      animationType={reduceMotion ? "none" : "fade"}
      accessibilityViewIsModal
      onRequestClose={onClose ?? (() => {})}
      supportedOrientations={["portrait", "landscape"]}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(0,3,3,.78)",
          justifyContent: "flex-end",
          alignItems: "center",
          paddingLeft: inset.left,
          paddingRight: inset.right,
          paddingTop: inset.top,
        }}
      >
        {dismissOnBackdrop ? <Pressable accessibilityRole="button" accessibilityLabel="Fermer" onPress={onClose} style={{position:"absolute",inset:0}}/> : null}
        <ScrollView
          testID="match-sheet"
          focusable
          role="dialog"
          accessibilityLabel={label}
          style={{
            outlineStyle: "solid",
            outlineWidth: 0,
            width: "100%",
            maxWidth: landscape ? 520 : undefined,
            maxHeight: (height - inset.top) * (landscape ? 0.96 : 0.92),
            flexGrow: 0,
            backgroundColor: c.card,
            borderTopLeftRadius: 26,
            borderTopRightRadius: 26,
            borderTopWidth: 1,
            borderColor: c.border,
          }}
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingTop: landscape ? 14 : 20,
            paddingBottom: Math.max(18, inset.bottom),
            gap: landscape ? 8 : 14,
          }}
        >
          {children}
        </ScrollView>
      </View>
    </Modal>
  );
}
export const m = StyleSheet.create({
  root: { flex: 1, backgroundColor: c.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 6,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: c.border,
    backgroundColor: c.cardRaised,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontFamily: f.extrabold,
    fontSize: 22,
    lineHeight: 33,
    letterSpacing: 0.88,
    color: c.foreground,
    textAlign: "center",
  },
  subtitle: {
    fontFamily: f.semibold,
    fontSize: 12,
    lineHeight: 18,
    color: c.muted,
    textAlign: "center",
    marginTop: 2,
  },
  scoreboard: { borderRadius: 22, borderColor: c.border },
  team: { flex: 1, minWidth: 0, alignItems: "center", gap: 6 },
  teamName: {
    fontFamily: "ManropeRefined-Heavy",
    fontSize: 13,
    lineHeight: 19.5,
    color: c.foreground,
    textAlign: "center",
  },
  big: {
    fontFamily: f.extrabold,
    color: c.foreground,
    fontVariant: ["tabular-nums"],
    includeFontPadding: false,
  },
  hint: {
    fontFamily: f.semibold,
    fontSize: 10,
    lineHeight: 15,
    color: c.muted,
    textAlign: "center",
  },
  carousel: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: c.border,
    backgroundColor: c.card,
    paddingBottom: 12,
    overflow: "hidden",
  },
  timer: {
    flex: 1,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 22,
  },
  eyebrow: {
    fontFamily: f.extrabold,
    fontSize: 11,
    lineHeight: 110 / 7,
    letterSpacing: 1.32,
    color: c.muted,
    textAlign: "center",
  },
  bar: {
    width: "100%",
    height: 10,
    borderRadius: 99,
    backgroundColor: c.mutedSurface,
    overflow: "hidden",
  },
  status: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  statusText: {
    fontFamily: "ManropeRefined-Bold",
    fontSize: 13,
    lineHeight: 130 / 7,
  },
  dots: {
    flexDirection: "row",
    gap: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  action: {
    width: "100%",
    borderRadius: 16,
    borderColor: c.border,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 10,
  },
  card: {
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: c.border,
    backgroundColor: c.card,
    gap: 14,
  },
  resultLine: {
    fontFamily: f.extrabold,
    fontSize: 16,
    lineHeight: 24,
    color: c.primary,
    textAlign: "center",
  },
  bodyText: {
    fontFamily: f.semibold,
    fontSize: 14,
    lineHeight: 21,
    color: c.foreground,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  muted: {
    fontFamily: f.semibold,
    fontSize: 13,
    lineHeight: 19.5,
    color: c.muted,
  },
  rule: { paddingTop: 10, borderTopWidth: 1, borderColor: c.border },
  tableCell: {
    fontFamily: f.semibold,
    fontSize: 13,
    lineHeight: 19.5,
    color: c.foreground,
    paddingVertical: 10,
    paddingHorizontal: 4,
  },
  tableHead: {
    fontFamily: "ManropeRefined-Bold",
    fontSize: 11,
    lineHeight: 16.5,
    color: c.muted,
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  error: {
    fontFamily: f.semibold,
    fontSize: 13,
    lineHeight: 19.5,
    color: c.error,
  },
});
