import {
  readFreeDraft,
  rememberFreeDraft,
  readFreeEditing,
  rememberFreeEditing,
  freePresetSnapshot,
} from "./free-config-draft";
import { useEffect, useState, type ReactNode } from "react";
import {
  Modal,
  Platform,
  Animated,
  AccessibilityInfo,
  Easing,
  Pressable,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import Svg, { Path } from "react-native-svg";
import {
  ConfigCard,
  ConfigTeams,
  Stepper,
  Sub,
  Toggle,
  Chip,
  Options,
  Mark,
  configStyles as s,
} from "@/src/components/lovable/configuration";
import { PhaseFrame } from "@/src/components/lovable/phase2b-ui";
import {
  LovableIcon,
  type LovableIconName,
} from "@/src/components/lovable/icon";
import {
  lovable as c,
  lovableFont as f,
  withAlpha,
} from "@/src/visual/lovable";
import { FreeStorageNotice } from "@/src/components/free-storage-notice";
import {
  buildSteps,
  validFreeConfig,
  type FreeTimerKind,
  type FreeTimerPreset,
} from "@/src/domain/free-timer";
import {
  configFromDraft,
  draftFromConfig,
  freeDuration,
  freeLabels,
  freeConfigSummary,
  type FreeDraft,
} from "@/src/domain/free-configuration";
import {
  saveFreePreset,
  deleteFreePreset,
  useStore,
} from "@/src/store/session-store";
import { usePreferences } from "@/src/store/preferences";
import { mergeConfigurationTeams } from "./lovable-config-state";
import { prepareFreeTimer } from "./prepare-free-timer";

type Icon =
  | LovableIconName
  | "hourglass"
  | "repeat"
  | "bookmark"
  | "save"
  | "plus"
  | "x";
function FreeIcon({
  name,
  color = c.foreground,
  size = 16,
}: {
  name: Icon;
  color?: string;
  size?: number;
}) {
  const paths: Partial<Record<Icon, string>> = {
    plus: "M12 5v14M5 12h14",
    x: "m18 6-12 12M6 6l12 12",
    hourglass:
      "M5 22h14M5 2h14M17 22v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22M7 2v4.172a2 2 0 0 0 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2",
    repeat:
      "m17 2 4 4-4 4M3 11V9a3 3 0 0 1 3-3h15M7 22l-4-4 4-4M21 13v2a3 3 0 0 1-3 3H3",
    bookmark: "m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2zM9 10l2 2 4-4",
    save: "M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2M17 21v-8H7v8M7 3v5h8",
  };
  return paths[name] ? (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      accessible={false}
    >
      <Path d={paths[name]} />
    </Svg>
  ) : (
    <LovableIcon name={name as LovableIconName} color={color} size={size} />
  );
}
function Action({
  label,
  onPress,
  icon,
  kind = "secondary",
  disabled = false,
  height,
  testID,
}: {
  label: string;
  onPress: () => void;
  icon?: Icon | "play";
  kind?: "primary" | "secondary" | "ghost" | "danger";
  disabled?: boolean;
  height?: number;
  testID?: string;
}) {
  const primary = kind === "primary" || kind === "danger",
    color =
      kind === "primary"
        ? c.onPrimary
        : kind === "ghost"
          ? c.muted
          : c.foreground;
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      accessibilityState={{ disabled }}
      onPress={onPress}
      hitSlop={height === 38 ? 3 : undefined}
      style={({ pressed }) => [
        s.action,
        {
          minHeight: height ?? (primary ? 56 : kind === "ghost" ? 44 : 50),
          backgroundColor:
            kind === "primary"
              ? c.primary
              : kind === "danger"
                ? c.error
                : kind === "ghost"
                  ? "transparent"
                  : c.cardRaised,
          borderWidth: kind === "secondary" ? 1 : 0,
          opacity: disabled ? 0.4 : 1,
          gap: primary ? 10 : 8,
        },
        pressed && s.pressed,
      ]}
    >
      {icon ? (
        icon === "play" ? (
          <Mark name="play" color={color} size={height === 44 ? 16 : 18} />
        ) : (
          <FreeIcon name={icon} color={color} size={primary ? 18 : 16} />
        )
      ) : null}
      <Text
        style={{
          fontFamily: primary ? f.extrabold : "ManropeRefined-Bold",
          fontSize: primary ? 16 : 14,
          lineHeight: primary ? 160 / 7 : 20,
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
const hint = {
  fontFamily: f.regular,
  fontSize: 12,
  lineHeight: 18,
  color: c.muted,
} as const;
function Seconds({
  value,
  min,
  max,
  step = 5,
  label,
  onChange,
  zero,
}: {
  value: number;
  min: number;
  max: number;
  step?: number;
  label: string;
  onChange: (n: number) => void;
  zero?: string;
}) {
  const text =
    value === 0 && zero
      ? zero
      : `${Math.floor(value / 60)}:${String(value % 60).padStart(2, "0")}`;
  return (
    <View style={s.stepper}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Réduire ${label}`}
        disabled={value <= min}
        accessibilityState={{ disabled: value <= min }}
        hitSlop={4}
        style={[s.stepButton, { opacity: value <= min ? 0.35 : 1 }]}
        onPress={() => onChange(Math.max(min, value - step))}
      >
        <Mark name="minus" />
      </Pressable>
      <View style={s.stepValue}>
        <Text accessibilityLiveRegion="polite" style={s.stepNumber}>
          {text}
        </Text>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Augmenter ${label}`}
        disabled={value >= max}
        accessibilityState={{ disabled: value >= max }}
        hitSlop={4}
        style={[s.stepButton, { opacity: value >= max ? 0.35 : 1 }]}
        onPress={() => onChange(Math.min(max, value + step))}
      >
        <Mark name="plus" />
      </Pressable>
    </View>
  );
}
function FreeSheet({
  title,
  description,
  onClose,
  children,
  busy,
}: {
  title: string;
  description: string;
  onClose: () => void;
  children: ReactNode;
  busy: boolean;
}) {
  const { width, height } = useWindowDimensions(),
    inset = useSafeAreaInsets(),
    landscape = width > height;
  const [motion] = useState(() => ({
    overlay: new Animated.Value(24),
    panel: new Animated.Value(0),
    y: new Animated.Value(0),
  }));
  useEffect(() => {
    let cancelled = false;
    let animation: Animated.CompositeAnimation | undefined;
    const finish = () => {
      animation?.stop();
      motion.overlay.setValue(1);
      motion.panel.setValue(1);
      motion.y.setValue(0);
    };
    void AccessibilityInfo.isReduceMotionEnabled()
      .then((reduced) => {
        if (cancelled) return;
        if (reduced) {
          finish();
          return;
        }
        motion.overlay.setValue(0);
        motion.panel.setValue(0);
        motion.y.setValue(24);
        animation = Animated.parallel([
          Animated.timing(motion.overlay, {
            toValue: 1,
            duration: 200,
            easing: Easing.ease,
            useNativeDriver: Platform.OS !== "web",
          }),
          Animated.timing(motion.panel, {
            toValue: 1,
            duration: 300,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: Platform.OS !== "web",
          }),
          Animated.timing(motion.y, {
            toValue: 0,
            duration: 300,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: Platform.OS !== "web",
          }),
        ]);
        animation.start();
      })
      .catch(finish);
    const subscription = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      (reduced) => {
        if (reduced) finish();
      },
    );
    return () => {
      cancelled = true;
      animation?.stop();
      subscription.remove();
    };
  }, [motion]);
  return (
    <Modal
      transparent
      animationType="none"
      onRequestClose={() => {
        if (!busy) onClose();
      }}
    >
      <Animated.View
        style={{
          opacity: motion.overlay,
          flex: 1,
          backgroundColor: "rgba(0,2,2,.78)",
          justifyContent: "flex-end",
          alignItems: "center",
          paddingLeft: inset.left,
          paddingRight: inset.right,
          paddingTop: inset.top,
        }}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Fermer"
          disabled={busy}
          onPress={onClose}
          style={{ position: "absolute", inset: 0 }}
        />
        <Animated.ScrollView
          role="dialog"
          accessibilityLabel={title}
          keyboardShouldPersistTaps="handled"
          style={{
            width: "100%",
            maxWidth: landscape ? 520 : undefined,
            maxHeight: (height - inset.top) * (landscape ? 0.96 : 0.92),
            opacity: motion.panel,
            transform: [{ translateY: motion.y }],
            flexGrow: 0,
            backgroundColor: c.card,
            borderTopLeftRadius: 26,
            borderTopRightRadius: 26,
            borderTopWidth: 1,
            borderColor: c.border,
          }}
          contentContainerStyle={{
            paddingTop: landscape ? 14 : 20,
            paddingHorizontal: 20,
            paddingBottom: Math.max(18, inset.bottom),
            gap: landscape ? 8 : 14,
          }}
        >
          <Text
            accessibilityRole="header"
            style={{
              fontFamily: f.extrabold,
              fontSize: 18,
              lineHeight: 27,
              color: c.foreground,
              textAlign: "center",
            }}
          >
            {title}
          </Text>
          <Text
            style={{
              fontFamily: f.regular,
              fontSize: 14,
              lineHeight: 21,
              color: c.muted,
              textAlign: "center",
            }}
          >
            {description}
          </Text>
          {children}
        </Animated.ScrollView>
      </Animated.View>
    </Modal>
  );
}
export function LovableFreeConfig({
  initialKind,
  initialSaved = false,
}: {
  initialKind?: FreeTimerKind;
  initialSaved?: boolean;
}) {
  const router = useRouter();
  const { width, height } = useWindowDimensions();
  const [d, setDraft] = useState<FreeDraft>(() =>
    initialKind ? { ...readFreeDraft(), kind: initialKind } : readFreeDraft(),
  );
  const [step, setStep] = useState<"type" | "settings" | "saved">(
    initialKind ? "settings" : initialSaved ? "saved" : "type",
  );
  const [editing, setEditingState] = useState(readFreeEditing),
    [saveOpen, setSaveOpen] = useState(false),
    [nameFocused, setNameFocused] = useState(false),
    [name, setName] = useState(""),
    [note, setNote] = useState<string | null>(null),
    [deleting, setDeleting] = useState<FreeTimerPreset | null>(null),
    [busy, setBusy] = useState(false),
    [imported, setImported] = useState<string | null>(null);
  const [viewportHeight, setViewportHeight] = useState(0),
    [measure, setMeasure] = useState({ content: 0, button: 50 });
  const saveHeight =
    width > height || !viewportHeight || !measure.content
      ? 50
      : measure.content + 50 - measure.button > viewportHeight + 0.5
        ? 38
        : 50;
  const [pendingSave, setPendingSave] = useState<{
    asNew: boolean;
    preset: FreeTimerPreset;
  } | null>(null);
  const presets = useStore((x) => x.freePresets),
    active = useStore((x) => x.freeTimer),
    loading = useStore((x) => !x.loaded),
    prefs = usePreferences();
  const set = (p: Partial<FreeDraft>) => {
    const next = { ...d, ...p };
    rememberFreeDraft(next);
    setDraft(next);
    setNote(null);
  };
  const edit = (e: typeof editing) => {
    rememberFreeEditing(e);
    setEditingState(e);
  };
  const config = configFromDraft(d),
    invalid = !validFreeConfig(config),
    steps = invalid ? [] : buildSteps(config),
    total = steps.reduce((n, x) => n + (x.durationMs ?? 0), 0) / 1000;
  const launch = (cfg = config) =>
    prepareFreeTimer(cfg, () => router.push("/chrono-libre/run"));
  const save = async (asNew: boolean) => {
    if (busy || !name.trim() || invalid) return;
    setBusy(true);
    const snapshot = freePresetSnapshot(
      name,
      config,
      !asNew && editing
        ? presets.find((p) => p.id === editing.id)
        : pendingSave?.asNew === asNew
          ? pendingSave.preset
          : undefined,
    );
    setPendingSave({ asNew, preset: snapshot });
    const { id, name: trimmed } = snapshot;
    const ok = await saveFreePreset(snapshot);
    setBusy(false);
    if (ok) {
      setPendingSave(null);
      edit({ id, name: trimmed });
      setSaveOpen(false);
      setNote(`« ${trimmed} » est enregistré dans Mes chronos.`);
    }
  };
  const hasNotice = useStore(
    (x) =>
      !!(
        x.saveError ||
        x.storageInfo ||
        x.legacyRecovery !== null ||
        x.replacingFreeTimer
      ),
  );
  const notice = hasNotice ? <FreeStorageNotice /> : null;
  if (step === "type")
    return (
      <PhaseFrame
        distributeRows
        title="Chrono libre"
        subtitle="Type de chrono"
        onBack={() => router.replace("/")}
        intro={
          <View style={[s.intro, { paddingHorizontal: 2 }]}>
            <View
              style={[
                s.modeIcon,
                {
                  backgroundColor: withAlpha(c.custom, 0.16),
                  borderColor: withAlpha(c.custom, 0.35),
                },
              ]}
            >
              <FreeIcon name="timer" color={c.custom} size={22} />
            </View>
            <Text style={s.introText}>
              Choisissez votre chrono. Les équipes sont facultatives.
            </Text>
          </View>
        }
      >
        {
          [
            notice,
            active ? (
              <Action
                key="resume"
                label="Reprendre le chrono en cours"
                onPress={() => router.push("/chrono-libre/run")}
                icon="play"
              />
            ) : null,
            ...(
              [
                [
                  "stopwatch",
                  "Départ à 00:00, tours, sans durée limite.",
                  "timer",
                ],
                [
                  "countdown",
                  "Durée personnalisée, fin automatique à zéro.",
                  "hourglass",
                ],
                [
                  "interval",
                  "Périodes, repos et répétitions enchaînés.",
                  "repeat",
                ],
              ] as const
            ).map(([kind, desc, icon]) => (
              <Tool
                key={kind}
                title={freeLabels[kind]}
                detail={desc}
                icon={icon}
                onPress={() => {
                  set({ kind });
                  edit(null);
                  setStep("settings");
                }}
              />
            )),
            <Tool
              key="saved"
              quiet
              title="Mes chronos"
              detail={
                presets.length
                  ? `${presets.length} chrono${presets.length > 1 ? "s" : ""} enregistré${presets.length > 1 ? "s" : ""}`
                  : "Aucun chrono enregistré pour l'instant"
              }
              icon="bookmark"
              onPress={() => setStep("saved")}
            />,
          ].filter(Boolean) as ReactNode[]
        }
      </PhaseFrame>
    );
  if (step === "saved")
    return (
      <PhaseFrame
        title="Mes chronos"
        subtitle="Chrono libre"
        onBack={() => setStep("type")}
      >
        {
          [
            notice,
            !presets.length ? (
              <View
                key="empty"
                style={[s.card, { alignItems: "center", gap: 8 }]}
              >
                <FreeIcon name="bookmark" color={c.primary} size={26} />
                <Text style={s.cardTitle}>Aucun chrono enregistré</Text>
                <Text
                  style={{
                    ...hint,
                    fontSize: 13,
                    lineHeight: 19.5,
                    textAlign: "center",
                  }}
                >
                  Réglez un chrono puis touchez « Enregistrer dans Mes chronos
                  ». Par exemple : Football à 5 — 10 minutes, Fractionné 30/30.
                </Text>
              </View>
            ) : null,
            ...presets.map((p) => (
              <View key={p.id} testID={`free-preset-${p.id}`} style={s.card}>
                <View>
                  <Text
                    style={{
                      fontFamily: f.extrabold,
                      fontSize: 16,
                      lineHeight: 24,
                      color: c.foreground,
                    }}
                  >
                    {p.name}
                  </Text>
                  <Text style={[hint, { marginTop: 4 }]}>
                    {freeConfigSummary(p.config)}
                  </Text>
                </View>
                <View
                  style={{ flexDirection: "row", gap: 8, alignItems: "center" }}
                >
                  <View style={{ flex: 1 }}>
                    <Action
                      label="Lancer"
                      icon="play"
                      kind="primary"
                      height={44}
                      disabled={loading}
                      onPress={() => launch(p.config)}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Action
                      label="Modifier"
                      icon="pencil"
                      height={44}
                      onPress={() => {
                        const next = draftFromConfig(p.config);
                        rememberFreeDraft(next);
                        setDraft(next);
                        edit({ id: p.id, name: p.name });
                        setNote(null);
                        setStep("settings");
                      }}
                    />
                  </View>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Supprimer ${p.name}`}
                    style={{
                      width: 44,
                      height: 44,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                    onPress={() => setDeleting(p)}
                  >
                    <FreeIcon name="trash" size={18} />
                  </Pressable>
                </View>
              </View>
            )),
            deleting ? (
              <FreeSheet
                key="delete"
                title={`Supprimer « ${deleting.name} » ?`}
                description="Ce chrono enregistré sera retiré de Mes chronos. Une session en cours n'est pas affectée."
                onClose={() => setDeleting(null)}
                busy={busy}
              >
                <View style={{ gap: 8 }}>
                  <Action
                    label="Supprimer"
                    icon="trash"
                    kind="danger"
                    disabled={busy}
                    onPress={async () => {
                      setBusy(true);
                      const ok = await deleteFreePreset(deleting.id);
                      setBusy(false);
                      if (ok) setDeleting(null);
                    }}
                  />
                  <Action
                    label="Annuler"
                    kind="ghost"
                    disabled={busy}
                    onPress={() => setDeleting(null)}
                  />
                </View>
                {notice}
              </FreeSheet>
            ) : null,
          ].filter(Boolean) as ReactNode[]
        }
      </PhaseFrame>
    );
  const cd = d.cd.h * 3600 + d.cd.m * 60 + d.cd.s;
  const cards: ReactNode[] = [notice];
  if (d.kind === "stopwatch")
    cards.push(
      <ConfigCard
        key="sw"
        title="Chronomètre"
        hint="Démarre à 00:00 et continue jusqu'à votre arrêt. Tours illimités, aucune durée à régler."
      />,
    );
  if (d.kind === "countdown")
    cards.push(
      <ConfigCard
        key="duration"
        title="Durée"
        hint={
          cd > 0
            ? `Total : ${freeDuration(cd)}`
            : "Choisissez une durée supérieure à zéro."
        }
      >
        <DurationChips cd={d.cd} set={(m) => set({ cd: { h: 0, m, s: 0 } })} />
        {(
          [
            ["Heures", "h", 23, "les heures"],
            ["Minutes", "m", 59, "les minutes"],
            ["Secondes", "s", 59, "les secondes"],
          ] as const
        ).map(([label, key, max, aria]) => (
          <Sub key={key} label={label}>
            <Stepper
              label={aria}
              value={d.cd[key]}
              min={0}
              max={max}
              unit={key === "h" ? "h" : key === "m" ? "min" : "s"}
              onChange={(n) => set({ cd: { ...d.cd, [key]: n } })}
            />
          </Sub>
        ))}
        {cd <= 0 ? (
          <Text style={s.error}>La durée doit être supérieure à zéro.</Text>
        ) : null}
      </ConfigCard>,
      <ConfigCard
        key="signal"
        title="Signal de fin"
        hint="Son et vibration à zéro"
        right={
          <Toggle
            label="Signal de fin"
            on={d.signal}
            set={(v) => set({ signal: v })}
          />
        }
      />,
    );
  if (d.kind === "interval") {
    if (d.legacyInterval)
      cards.push(
        <ConfigCard
          key="legacy"
          title="Configuration ancienne conservée"
          hint="Ces réglages dépassent les limites du nouvel éditeur. Ils restent utilisables et peuvent être renommés ou enregistrés comme nouveau sans transformation."
        >
          <Text style={hint}>{freeConfigSummary(d.legacyInterval)}</Text>
        </ConfigCard>,
      );
    else
      cards.push(
        <ConfigCard key="quick" title="Programmes rapides">
          <View style={{ flexDirection: "row", gap: 8 }}>
            {[
              { label: "30/30", periods: [30], rest: 30, reps: 8 },
              { label: "Tabata", periods: [20], rest: 10, reps: 8 },
              {
                label: "4 × 10 min",
                periods: [600, 600, 600, 600],
                rest: 120,
                reps: 1,
              },
            ].map((p) => (
              <View key={p.label} style={{ flex: 1 }}>
                <Chip
                  label={p.label}
                  active={false}
                  onPress={() =>
                    set({
                      periods: p.periods,
                      rest: p.rest,
                      reps: p.reps,
                      repRest: 0,
                    })
                  }
                />
              </View>
            ))}
          </View>
        </ConfigCard>,
        <ConfigCard
          key="periods"
          title="Périodes"
          hint={`${d.periods.length} période${d.periods.length > 1 ? "s" : ""} par série`}
        >
          <View>
            {d.periods.map((p, i) => (
              <Sub key={i} label={`Période ${i + 1}`}>
                <View
                  style={{ flexDirection: "row", gap: 6, alignItems: "center" }}
                >
                  <Seconds
                    label={`la période ${i + 1}`}
                    value={p}
                    min={5}
                    max={3600}
                    step={p >= 120 ? 30 : 5}
                    onChange={(n) =>
                      set({
                        periods: d.periods.map((v, j) => (j === i ? n : v)),
                      })
                    }
                  />
                  {d.periods.length > 1 ? (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`Supprimer la période ${i + 1}`}
                      hitSlop={6}
                      onPress={() =>
                        set({ periods: d.periods.filter((_, j) => j !== i) })
                      }
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 10,
                        borderWidth: 1,
                        borderColor: c.border,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <FreeIcon name="x" color={c.muted} />
                    </Pressable>
                  ) : null}
                </View>
              </Sub>
            ))}
          </View>
          {d.periods.length < 12 ? (
            <Action
              label="Ajouter une période"
              icon="plus"
              onPress={() =>
                set({ periods: [...d.periods, d.periods.at(-1) ?? 30] })
              }
            />
          ) : null}
        </ConfigCard>,
        <ConfigCard key="rest" title="Repos et répétitions">
          <Sub label="Repos entre périodes">
            <Seconds
              label="le repos"
              value={d.rest}
              min={0}
              max={600}
              zero="Aucun"
              onChange={(n) => set({ rest: n })}
            />
          </Sub>
          <Sub label="Répétitions">
            <Stepper
              label="les répétitions"
              value={d.reps}
              min={1}
              max={20}
              unit="×"
              onChange={(n) => set({ reps: n })}
            />
          </Sub>
          {d.reps > 1 ? (
            <Sub label="Repos entre séries">
              <Seconds
                label="le repos entre séries"
                value={d.repRest}
                min={0}
                max={900}
                step={15}
                zero="Aucun"
                onChange={(n) => set({ repRest: n })}
              />
            </Sub>
          ) : null}
          <Text style={{ ...hint, fontFamily: f.semibold }}>
            {steps.length} intervalle{steps.length > 1 ? "s" : ""} · durée
            totale {freeDuration(total)}
          </Text>
        </ConfigCard>,
        <ConfigCard key="auto" title="Passage à la période suivante">
          <Options
            value={d.auto ? "auto" : "manual"}
            options={[
              { value: "auto", label: "Automatique" },
              { value: "manual", label: "Manuel" },
            ]}
            onChange={(v) => set({ auto: v === "auto" })}
          />
          <Sub label="Signaux de transition">
            <Toggle
              label="Signaux de transition"
              on={d.signals}
              set={(v) => set({ signals: v })}
            />
          </Sub>
        </ConfigCard>,
      );
  }
  const fits = prefs.teams.length >= 2 && prefs.teams.length <= 8;
  cards.push(
    <ConfigCard
      key="teams"
      title="Avec équipes"
      hint={
        d.teamsOn
          ? "Noms, couleurs et scores facultatifs"
          : "Facultatif : sans équipe, seul le chrono s'affiche."
      }
      right={
        <Toggle
          label="Avec équipes"
          on={d.teamsOn}
          set={(v) => set({ teamsOn: v })}
        />
      }
    >
      {d.teamsOn ? (
        <>
          <Sub label="Nombre d'équipes">
            <Stepper
              label="le nombre d'équipes"
              value={d.teamCount}
              min={2}
              max={8}
              unit=""
              onChange={(n) => set({ teamCount: n })}
            />
          </Sub>
          <Sub label="Scores">
            <Toggle
              label="Scores"
              on={d.scoreOn}
              set={(v) => set({ scoreOn: v })}
            />
          </Sub>
          {prefs.teams.length ? (
            <View style={{ gap: 8 }}>
              <Action
                label={`Importer mes ${prefs.teams.length} équipes`}
                icon="users"
                disabled={!fits}
                onPress={() => {
                  set({
                    teamCount: prefs.teams.length,
                    teams: mergeConfigurationTeams(
                      d.teams,
                      prefs.teams.map((t) => ({ ...t })),
                    ),
                  });
                  setImported(
                    prefs.teams.length === d.teamCount
                      ? "Composition importée : vous pouvez encore la modifier ci-dessous."
                      : `Le nombre d'équipes a été ajusté à ${prefs.teams.length}.`,
                  );
                }}
              />
              {!fits ? (
                <Text style={hint}>
                  Ce mode accepte de 2 à 8 équipes : votre dernière composition
                  en compte {prefs.teams.length}.
                </Text>
              ) : imported ? (
                <Text style={hint}>
                  {prefs.teams.length !== d.teamCount
                    ? `Le nombre d'équipes a été ajusté à ${prefs.teams.length}.`
                    : "Composition importée : vous pouvez encore la modifier ci-dessous."}
                </Text>
              ) : null}
            </View>
          ) : null}
          <ConfigTeams
            teams={d.teams.slice(0, d.teamCount)}
            onChange={(ts) =>
              set({ teams: mergeConfigurationTeams(d.teams, ts) })
            }
          />
        </>
      ) : null}
    </ConfigCard>,
    <Action
      key="save"
      height={saveHeight}
      label={
        editing
          ? `Mettre à jour « ${editing.name} »`
          : "Enregistrer dans Mes chronos"
      }
      icon="save"
      disabled={invalid || loading || busy}
      onPress={() => {
        setName(editing?.name ?? "");
        setNameFocused(true);
        setSaveOpen(true);
      }}
    />,
  );
  if (note)
    cards.push(
      <Text
        key="note"
        role="status"
        accessibilityLiveRegion="polite"
        style={{
          fontFamily: "ManropeRefined-Bold",
          fontSize: 13,
          lineHeight: 19.5,
          color: c.primary,
          textAlign: "center",
        }}
      >
        {note}
      </Text>,
    );
  const saveSheet = saveOpen ? (
    <FreeSheet
      key="save-sheet"
      title={editing ? "Mettre à jour le chrono" : "Enregistrer le chrono"}
      description="Seuls les réglages sont enregistrés. Les temps et tours de vos sessions ne les modifient pas."
      onClose={() => setSaveOpen(false)}
      busy={busy}
    >
      <TextInput
        accessibilityLabel="Nom du chrono"
        onFocus={() => setNameFocused(true)}
        onBlur={() => setNameFocused(false)}
        autoFocus
        value={name}
        onChangeText={setName}
        maxLength={40}
        placeholder="Ex. Football à 5 — 10 minutes"
        placeholderTextColor={c.muted}
        style={[
          s.input,
          {
            height: 50,
            borderRadius: 14,
            backgroundColor: c.cardRaised,
            fontFamily: f.semibold,
            fontSize: 16,
            outlineStyle: "solid",
            outlineWidth: nameFocused ? 2 : 0,
            outlineOffset: 1,
            outlineColor: c.primary,
          },
        ]}
      />
      {!name.trim() ? (
        <Text style={s.error}>Donnez un nom à ce chrono.</Text>
      ) : null}
      <View style={{ gap: 8 }}>
        <Action
          label={editing ? "Mettre à jour" : "Enregistrer"}
          icon="save"
          kind="primary"
          disabled={!name.trim() || busy}
          onPress={() => save(false)}
        />
        {editing ? (
          <Action
            label="Enregistrer comme nouveau"
            disabled={!name.trim() || busy}
            onPress={() => save(true)}
          />
        ) : null}
        <Action
          label="Annuler"
          kind="ghost"
          disabled={busy}
          onPress={() => setSaveOpen(false)}
        />
      </View>
      {notice}
    </FreeSheet>
  ) : null;
  return (
    <>
      <PhaseFrame
        distributeRows={d.kind === "stopwatch"}
        onViewportHeight={setViewportHeight}
        onContentHeight={(h) =>
          setMeasure((previous) =>
            previous.content === h && previous.button === saveHeight
              ? previous
              : { content: h, button: saveHeight },
          )
        }
        title={freeLabels[d.kind]}
        subtitle={
          editing ? `Modifier « ${editing.name} »` : "Chrono libre · Réglages"
        }
        onBack={() => setStep(editing ? "saved" : "type")}
        footer={
          <Action
            height={width > height ? 48 : 56}
            testID="free-prepare"
            label="Préparer le chrono"
            icon="play"
            kind="primary"
            disabled={invalid || loading || busy}
            onPress={() => launch()}
          />
        }
      >
        {cards}
      </PhaseFrame>
      {saveSheet}
    </>
  );
}
function Tool({
  title,
  detail,
  icon,
  quiet,
  onPress,
}: {
  title: string;
  detail: string;
  icon: Icon;
  quiet?: boolean;
  onPress: () => void;
}) {
  const color = quiet ? c.classic : c.custom;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      onPress={onPress}
      style={({ pressed }) => [
        {
          minHeight: 76,
          padding: 14,
          borderWidth: 1,
          borderColor: c.border,
          borderRadius: 18,
          backgroundColor: quiet ? "transparent" : c.card,
          flexDirection: "row",
          alignItems: "center",
          gap: 14,
        },
        pressed && { transform: [{ scale: 0.98 }] },
      ]}
    >
      <View
        style={{
          width: 46,
          height: 46,
          borderRadius: 14,
          borderWidth: 1,
          borderColor: withAlpha(color, 0.35),
          backgroundColor: withAlpha(color, 0.16),
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <FreeIcon name={icon} color={color} size={22} />
      </View>
      <View style={{ flex: 1, minWidth: 0, gap: 3 }}>
        <Text
          style={{
            fontFamily: f.extrabold,
            fontSize: 15,
            lineHeight: 22.5,
            color: c.foreground,
          }}
        >
          {title}
        </Text>
        <Text
          style={{
            fontFamily: f.semibold,
            fontSize: 12,
            lineHeight: 18,
            color: c.muted,
          }}
        >
          {detail}
        </Text>
      </View>
    </Pressable>
  );
}

function DurationChips({
  cd,
  set,
}: {
  cd: FreeDraft["cd"];
  set: (m: number) => void;
}) {
  const { width, height, fontScale } = useWindowDimensions(),
    inset = useSafeAreaInsets(),
    available = width - inset.left - inset.right,
    two = width > height && available >= 600 && fontScale <= 1.5,
    inner = (two ? (available - 52) / 2 : available - 40) - 30,
    wide = inner > 360,
    col = Math.floor(((inner - (wide ? 24 : 16)) / (wide ? 4.6 : 3)) * 64) / 64;
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
      {[1, 5, 10, 15, 30].map((m) => (
        <View
          key={m}
          style={{
            width:
              !wide && m === 30 ? "100%" : wide && m === 15 ? col * 1.6 : col,
          }}
        >
          <Chip
            label={m + " min"}
            active={cd.h === 0 && cd.s === 0 && cd.m === m}
            onPress={() => set(m)}
          />
        </View>
      ))}
    </View>
  );
}
