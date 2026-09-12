// Composants de formulaire partagés (E02) : grandes cibles tactiles, options
// dépliables sur place, aucun écran intermédiaire.
import { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import * as Haptics from "expo-haptics";
import MaterialCommunityIcons from "@react-native-vector-icons/material-design-icons";

import { TEAM_PALETTE } from "@/src/domain/defaults";
import type { EndRules, Team } from "@/src/domain/types";
import { fontFamily, fontSize, control, makeStyles, radius, spacing, useTheme } from "@/src/theme";

export function Section({ title, children, hint }: { title: string; children: React.ReactNode; hint?: string }) {
  const styles = useStyles();
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {hint ? <Text style={styles.sectionHint}>{hint}</Text> : null}
      </View>
      {children}
    </View>
  );
}

export function Card({ children, style }: { children: React.ReactNode; style?: object }) {
  const styles = useStyles();
  return <View style={[styles.card, style]}>{children}</View>;
}

// Choix parmi des valeurs + "Perso" saisie numérique.
export function ChoiceRow<T extends string | number>({
  label,
  options,
  value,
  onChange,
  custom,
  suffix,
  testID,
}: {
  label: string;
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  custom?: { min: number; max?: number; onChange: (n: number) => void };
  suffix?: string;
  testID?: string;
}) {
  const styles = useStyles();
  const { colors } = useTheme();
  const isCustom = !options.some((o) => o.value === value);
  const [showCustom, setShowCustom] = useState(isCustom);
  const [draft, setDraft] = useState(String(value));
  return (
    <View style={styles.field} testID={testID}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.chips}>
        {options.map((o) => {
          const active = !showCustom && o.value === value;
          return (
            <Pressable
              key={String(o.value)}
              testID={`${testID ?? label}-${o.value}`}
              onPress={() => {
                Haptics.selectionAsync().catch(() => {});
                setShowCustom(false);
                onChange(o.value);
              }}
              style={[styles.chip, active && styles.chipActive]}
            >
              <Text style={[styles.chipLabel, active && styles.chipLabelActive]}>{o.label}</Text>
            </Pressable>
          );
        })}
        {custom ? (
          <Pressable
            testID={`${testID ?? label}-custom`}
            onPress={() => setShowCustom(true)}
            style={[styles.chip, showCustom && styles.chipActive]}
          >
            <Text style={[styles.chipLabel, showCustom && styles.chipLabelActive]}>Perso</Text>
          </Pressable>
        ) : null}
      </View>
      {showCustom && custom ? (
        <NumberInput
          value={draft}
          onChange={(t) => {
            setDraft(t);
            const n = parseInt(t, 10);
            if (!Number.isNaN(n) && n >= custom.min && (custom.max == null || n <= custom.max)) custom.onChange(n);
          }}
          suffix={suffix}
          testID={`${testID ?? label}-custom-input`}
        />
      ) : null}
    </View>
  );
}

export function NumberInput({ value, onChange, suffix, testID, placeholder }: { value: string; onChange: (t: string) => void; suffix?: string; testID?: string; placeholder?: string }) {
  const styles = useStyles();
  const { colors } = useTheme();
  return (
    <View style={styles.inputRow}>
      <TextInput
        testID={testID}
        value={value}
        onChangeText={(t) => onChange(t.replace(/[^0-9]/g, ""))}
        keyboardType="number-pad"
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        style={styles.input}
        selectTextOnFocus
      />
      {suffix ? <Text style={styles.suffix}>{suffix}</Text> : null}
    </View>
  );
}

export function Stepper({ label, value, min, max, onChange, testID, hint }: { label: string; value: number; min: number; max: number; onChange: (n: number) => void; testID?: string; hint?: string }) {
  const styles = useStyles();
  const { colors } = useTheme();
  const btn = (delta: number, icon: "minus" | "plus") => {
    const disabled = delta < 0 ? value <= min : value >= max;
    return (
      <Pressable
        testID={`${testID ?? label}-${icon}`}
        disabled={disabled}
        onPress={() => {
          Haptics.selectionAsync().catch(() => {});
          onChange(Math.min(max, Math.max(min, value + delta)));
        }}
        style={[styles.stepBtn, disabled && { opacity: 0.3 }]}
      >
        <MaterialCommunityIcons name={icon} size={24} color={colors.onSurface} />
      </Pressable>
    );
  };
  return (
    <View style={styles.rowBetween}>
      <View style={{ flex: 1 }}>
        <Text style={styles.fieldLabel}>{label}</Text>
        {hint ? <Text style={styles.hint}>{hint}</Text> : null}
      </View>
      <View style={styles.stepper}>
        {btn(-1, "minus")}
        <Text style={styles.stepValue} testID={`${testID ?? label}-value`}>{value}</Text>
        {btn(1, "plus")}
      </View>
    </View>
  );
}

export function ToggleRow({ label, value, onChange, hint, testID }: { label: string; value: boolean; onChange: (v: boolean) => void; hint?: string; testID?: string }) {
  const styles = useStyles();
  return (
    <Pressable onPress={() => onChange(!value)} style={styles.rowBetween} testID={testID}>
      <View style={{ flex: 1 }}>
        <Text style={styles.fieldLabel}>{label}</Text>
        {hint ? <Text style={styles.hint}>{hint}</Text> : null}
      </View>
      <Toggle value={value} onChange={onChange} />
    </Pressable>
  );
}

// Interrupteur maison (maquettes) : piste sombre, pastille verte à l'état actif.
export function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  const styles = useStyles();
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      onPress={() => {
        Haptics.selectionAsync().catch(() => {});
        onChange(!value);
      }}
      style={[styles.track, value && styles.trackOn]}
    >
      <View style={[styles.thumb, value && styles.thumbOn]} />
    </Pressable>
  );
}

export function Divider() {
  const styles = useStyles();
  return <View style={styles.dividerLine} />;
}

export function Segmented<T extends string | number>({ label, options, value, onChange, testID }: { label?: string; options: { value: T; label: string }[]; value: T; onChange: (v: T) => void; testID?: string }) {
  const styles = useStyles();
  const { colors } = useTheme();
  return (
    <View style={styles.field}>
      {label ? <Text style={styles.fieldLabel}>{label}</Text> : null}
      <View style={styles.segment}>
        {options.map((o) => {
          const active = o.value === value;
          return (
            <Pressable
              key={String(o.value)}
              testID={`${testID ?? label}-${o.value}`}
              onPress={() => {
                Haptics.selectionAsync().catch(() => {});
                onChange(o.value);
              }}
              style={[styles.segmentItem, active && styles.segmentItemActive]}
            >
              <Text style={[styles.chipLabel, active && styles.chipLabelActive]}>{o.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

// CH-06 — deux cases indépendantes, au moins une active.
export function EndRulesField({ value, onChange, note }: { value: EndRules; onChange: (v: EndRules) => void; note?: string }) {
  const styles = useStyles();
  const { colors } = useTheme();
  const invalid = !value.byTime && value.goalTarget == null;
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>Fin du match</Text>
      <View style={styles.chips}>
        <CheckChip testID="end-time" label="Au temps" checked={value.byTime} onPress={() => onChange({ ...value, byTime: !value.byTime })} />
        <CheckChip testID="end-goals" label="Premier à X buts" checked={value.goalTarget != null} onPress={() => onChange({ ...value, goalTarget: value.goalTarget == null ? 3 : null })} />
      </View>
      {value.goalTarget != null ? (
        <ChoiceRow
          label="Nombre de buts"
          testID="goal-target"
          options={[1, 2, 3, 5].map((n) => ({ value: n, label: String(n) }))}
          value={value.goalTarget}
          onChange={(n) => onChange({ ...value, goalTarget: n })}
          custom={{ min: 1, onChange: (n) => onChange({ ...value, goalTarget: n }) }}
          suffix="buts"
        />
      ) : null}
      {invalid ? (
        <Text style={[styles.hint, { color: colors.error }]} testID="end-rules-error">Active au moins une condition de fin.</Text>
      ) : null}
      {note ? <Text style={styles.hint}>{note}</Text> : null}
    </View>
  );
}

function CheckChip({ label, checked, onPress, testID }: { label: string; checked: boolean; onPress: () => void; testID?: string }) {
  const styles = useStyles();
  const { colors } = useTheme();
  return (
    <Pressable
      testID={testID}
      onPress={() => {
        Haptics.selectionAsync().catch(() => {});
        onPress();
      }}
      style={[styles.tile, checked && styles.tileActive]}
    >
      <MaterialCommunityIcons
        name={checked ? "check-circle" : "circle-outline"}
        size={24}
        color={checked ? colors.brandPrimary : colors.muted}
      />
      <Text style={[styles.tileLabel, checked && styles.chipLabelActive]}>{label}</Text>
    </Pressable>
  );
}

// Noms et couleurs dépliés sur place (UX-02).
export function TeamsEditor({ teams, onChange, reorder }: { teams: Team[]; onChange: (t: Team[]) => void; reorder?: boolean }) {
  const styles = useStyles();
  const { colors } = useTheme();
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= teams.length) return;
    const copy = [...teams];
    [copy[i], copy[j]] = [copy[j], copy[i]];
    onChange(copy);
  };
  return (
    <View style={{ gap: spacing.sm }}>
      {teams.map((t, i) => (
        <View key={t.id} style={styles.teamRow}>
          <Pressable
            testID={`team-color-${i}`}
            onPress={() => {
              const idx = TEAM_PALETTE.indexOf(t.color);
              const color = TEAM_PALETTE[(idx + 1) % TEAM_PALETTE.length];
              onChange(teams.map((x, k) => (k === i ? { ...x, color } : x)));
            }}
            style={[styles.colorDot, { backgroundColor: t.color }]}
          />
          <TextInput
            testID={`team-name-${i}`}
            value={t.name}
            onChangeText={(name) => onChange(teams.map((x, k) => (k === i ? { ...x, name } : x)))}
            style={[styles.input, { flex: 1 }]}
            placeholder={`Équipe ${i + 1}`}
            placeholderTextColor={colors.muted}
            maxLength={18}
          />
          {reorder ? (
            <View style={{ flexDirection: "row", gap: spacing.xs }}>
              <Pressable onPress={() => move(i, -1)} style={styles.stepBtn} testID={`team-up-${i}`}>
                <MaterialCommunityIcons name="chevron-up" size={22} color={colors.onSurface} />
              </Pressable>
              <Pressable onPress={() => move(i, 1)} style={styles.stepBtn} testID={`team-down-${i}`}>
                <MaterialCommunityIcons name="chevron-down" size={22} color={colors.onSurface} />
              </Pressable>
            </View>
          ) : null}
        </View>
      ))}
    </View>
  );
}

export function Disclosure({ title, children, testID }: { title: string; children: React.ReactNode; testID?: string }) {
  const styles = useStyles();
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);
  return (
    <View>
      <Pressable onPress={() => setOpen((o) => !o)} style={styles.rowBetween} testID={testID}>
        <Text style={styles.fieldLabel}>{title}</Text>
        <MaterialCommunityIcons name={open ? "chevron-up" : "chevron-down"} size={26} color={colors.muted} />
      </Pressable>
      {open ? <View style={{ gap: spacing.md, paddingTop: spacing.sm }}>{children}</View> : null}
    </View>
  );
}

export function ErrorText({ children, testID }: { children: string; testID?: string }) {
  const styles = useStyles();
  const { colors } = useTheme();
  return (
    <Text style={[styles.hint, { color: colors.error, fontFamily: fontFamily.textBold }]} testID={testID}>
      {children}
    </Text>
  );
}

const useStyles = makeStyles((colors) => ({
  section: { gap: spacing.md },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "baseline" },
  sectionTitle: { fontFamily: fontFamily.textBold, fontSize: fontSize.sm, letterSpacing: 1.8, color: colors.muted, textTransform: "uppercase" },
  sectionHint: { fontFamily: fontFamily.text, fontSize: fontSize.sm, color: colors.muted },
  card: { backgroundColor: colors.surfaceSecondary, borderRadius: radius.lg, padding: spacing.lg, gap: spacing.xl, borderWidth: 1, borderColor: colors.border },
  field: { gap: spacing.md },
  fieldLabel: { fontFamily: fontFamily.textBold, fontSize: fontSize.lg, color: colors.onSurface },
  hint: { fontFamily: fontFamily.text, fontSize: fontSize.sm, color: colors.muted, lineHeight: fontSize.sm * 1.45 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  chip: {
    minHeight: control.chip,
    minWidth: 82,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceTertiary,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  chipActive: { backgroundColor: colors.brandTertiary, borderColor: colors.brandPrimary, borderWidth: 2 },
  checkChip: { flexDirection: "row", gap: spacing.sm, paddingHorizontal: spacing.md },
  tile: {
    flex: 1,
    minWidth: 140,
    minHeight: 72,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceTertiary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tileActive: { backgroundColor: colors.brandTertiary, borderColor: colors.brandPrimary, borderWidth: 2 },
  tileLabel: { flex: 1, fontFamily: fontFamily.textBold, fontSize: fontSize.base + 1, color: colors.onSurfaceTertiary },
  track: { width: 58, height: 34, borderRadius: radius.pill, backgroundColor: colors.surfaceTertiary, borderWidth: 1, borderColor: colors.borderStrong, padding: 3, justifyContent: "center" },
  trackOn: { backgroundColor: colors.brandPrimary, borderColor: colors.brandPrimary },
  thumb: { width: 26, height: 26, borderRadius: radius.pill, backgroundColor: colors.muted },
  thumbOn: { backgroundColor: colors.onBrandPrimary, alignSelf: "flex-end" },
  dividerLine: { height: 1, backgroundColor: colors.divider, marginVertical: -spacing.xs },
  chipLabel: { fontFamily: fontFamily.textBold, fontSize: fontSize.lg, color: colors.onSurfaceTertiary },
  chipLabelActive: { color: colors.brandPrimary },
  inputRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  input: {
    minHeight: control.chip,
    minWidth: 100,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    color: colors.onSurface,
    fontFamily: fontFamily.textBold,
    fontSize: fontSize.lg,
  },
  suffix: { fontFamily: fontFamily.text, fontSize: fontSize.base, color: colors.muted },
  rowBetween: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.md, minHeight: control.row },
  stepper: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  stepBtn: { width: 52, height: 52, borderRadius: radius.pill, backgroundColor: colors.surfaceTertiary, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center" },
  stepValue: { fontFamily: fontFamily.display, fontSize: fontSize["2xl"] + 8, color: colors.onSurface, minWidth: 52, textAlign: "center" },
  segment: { flexDirection: "row", backgroundColor: colors.surfaceTertiary, borderRadius: radius.md, padding: 5, gap: 5, borderWidth: 1, borderColor: colors.border },
  segmentItem: { flex: 1, minHeight: 48, borderRadius: radius.sm, alignItems: "center", justifyContent: "center" },
  segmentItemActive: { backgroundColor: colors.brandTertiary, borderWidth: 2, borderColor: colors.brandPrimary },
  teamRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  colorDot: { width: control.icon, height: control.icon, borderRadius: radius.pill, borderWidth: 2, borderColor: colors.borderStrong },
}));
