// Composants de formulaire partagés (E02) : grandes cibles tactiles, options
// dépliables sur place, aucun écran intermédiaire.
import { useContext, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import * as Haptics from "expo-haptics";
import MaterialCommunityIcons from "@react-native-vector-icons/material-design-icons";

import { TEAM_PALETTE } from "@/src/domain/defaults";
import type { EndRules, Team } from "@/src/domain/types";
import { fontFamily, fontSize, control, makeStyles, radius, spacing, useTheme } from "@/src/theme";
import { TypographyPreview, refinedType } from "@/src/typography-preview";

export function Section({ title, children, hint }: { title: string; children: React.ReactNode; hint?: string }) {
  const styles = useStyles();
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text testID={`section-${title.toLowerCase().replace(/\s+/g, "-")}-title`} style={styles.sectionTitle}>{title}</Text>
        {hint ? <Text testID={`section-${title.toLowerCase().replace(/\s+/g, "-")}-hint`} style={styles.sectionHint}>{hint}</Text> : null}
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
  const isCustom = !options.some((o) => o.value === value);
  const [showCustom, setShowCustom] = useState(isCustom);
  const [draft, setDraft] = useState(String(value));
  return (
    <View style={styles.field} testID={testID}>
      <Text testID={`${testID ?? label}-label`} style={styles.fieldLabel}>{label}</Text>
      <View style={styles.chips}>
        {options.map((o) => {
          const active = !showCustom && o.value === value;
          return (
            <Pressable
              key={String(o.value)}
              testID={`${testID ?? label}-${o.value}`}
              accessibilityRole="radio"
              accessibilityState={{ checked: active }}
              aria-checked={active}
              onPress={() => {
                Haptics.selectionAsync().catch(() => {});
                setShowCustom(false);
                onChange(o.value);
              }}
              style={[styles.chip, active && styles.chipActive]}
            >
              <Text testID={`${testID ?? label}-${o.value}-label`} style={[styles.chipLabel, active && styles.chipLabelActive]}>{o.label}</Text>
            </Pressable>
          );
        })}
        {custom ? (
          <Pressable
            testID={`${testID ?? label}-custom`}
            accessibilityRole="radio"
            accessibilityState={{ checked: showCustom }}
            aria-checked={showCustom}
            onPress={() => setShowCustom(true)}
            style={[styles.chip, showCustom && styles.chipActive]}
          >
            <Text testID={`${testID ?? label}-custom-label`} style={[styles.chipLabel, showCustom && styles.chipLabelActive]}>Perso</Text>
          </Pressable>
        ) : null}
      </View>
      {showCustom && custom ? (
        <NumberInput
          value={Number.isFinite(value) ? String(value) : draft}
          onChange={(t) => {
            setDraft(t);
            const n = t.trim() === "" ? NaN : Number(t);
            custom.onChange(Number.isSafeInteger(n) && n >= custom.min && (custom.max == null || n <= custom.max) ? n : NaN);
          }}
          suffix={suffix}
          testID={`${testID ?? label}-custom-input`}
        />
      ) : null}
      {showCustom && !Number.isFinite(value) ? <Text style={[styles.hint, { color: "#EF4444" }]}>Saisis un nombre entier valide.</Text> : null}
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
        style={[styles.input, styles.numericInput]}
        accessibilityLabel={testID ?? placeholder ?? "Valeur numérique"}
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
        accessibilityRole="button"
        accessibilityLabel={`${delta < 0 ? "Diminuer" : "Augmenter"} : ${label}`}
        accessibilityState={{ disabled }}
        aria-disabled={disabled}
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
    <View style={styles.stepperRow}>
      <View style={styles.stepperLabel}>
        <Text testID={`${testID ?? label}-label`} style={styles.fieldLabel}>{label}</Text>
        {hint ? <Text testID={`${testID ?? label}-hint`} style={styles.hint}>{hint}</Text> : null}
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
    <Pressable onPress={() => onChange(!value)} style={styles.rowBetween} testID={testID} accessibilityRole="switch" accessibilityLabel={label} accessibilityState={{ checked: value }} aria-checked={value}>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text testID={`${testID ?? label}-label`} style={styles.fieldLabel}>{label}</Text>
        {hint ? <Text testID={`${testID ?? label}-hint`} style={styles.hint}>{hint}</Text> : null}
      </View>
      <View style={styles.toggleTarget} pointerEvents="none" accessible={false}>
        <View style={[styles.track, value && styles.trackOn]}>
          <View style={[styles.thumb, value && styles.thumbOn]} />
        </View>
      </View>
    </Pressable>
  );
}

// Interrupteur maison (maquettes) : piste sombre, pastille verte à l'état actif.
export function Toggle({ value, onChange, testID = "toggle", label = "Activer l’option" }: { value: boolean; onChange: (v: boolean) => void; testID?: string; label?: string }) {
  const styles = useStyles();
  return (
    <Pressable
      testID={testID}
      accessibilityRole="switch"
      accessibilityLabel={label}
      accessibilityState={{ checked: value }}
      aria-checked={value}
      onPress={() => {
        Haptics.selectionAsync().catch(() => {});
        onChange(!value);
      }}
      style={styles.toggleTarget}
    >
      <View style={[styles.track, value && styles.trackOn]}>
        <View style={[styles.thumb, value && styles.thumbOn]} />
      </View>
    </Pressable>
  );
}

export function Divider() {
  const styles = useStyles();
  return <View style={styles.dividerLine} />;
}

export function Segmented<T extends string | number>({ label, options, value, onChange, testID }: { label?: string; options: { value: T; label: string }[]; value: T; onChange: (v: T) => void; testID?: string }) {
  const styles = useStyles();
  return (
    <View testID={`${testID ?? label}-group`} style={styles.field}>
      {label ? <Text testID={`${testID ?? label}-label`} style={styles.fieldLabel}>{label}</Text> : null}
      <View style={styles.segment}>
        {options.map((o) => {
          const active = o.value === value;
          return (
            <Pressable
              key={String(o.value)}
              testID={`${testID ?? label}-${o.value}`}
              accessibilityRole="radio"
              accessibilityState={{ checked: active }}
              aria-checked={active}
              onPress={() => {
                Haptics.selectionAsync().catch(() => {});
                onChange(o.value);
              }}
              style={[styles.segmentItem, options.some((option) => option.label.length > 16) && styles.segmentItemLong, active && styles.segmentItemActive]}
            >
              <Text testID={`${testID ?? label}-${o.value}-label`} style={[styles.chipLabel, active && styles.chipLabelActive]}>{o.label}</Text>
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
      <Text testID="end-rules-label" style={styles.fieldLabel}>Fin du match</Text>
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
      {note ? <Text testID="end-rules-note" style={styles.hint}>{note}</Text> : null}
    </View>
  );
}

function CheckChip({ label, checked, onPress, testID }: { label: string; checked: boolean; onPress: () => void; testID?: string }) {
  const styles = useStyles();
  const { colors } = useTheme();
  return (
    <Pressable
      testID={testID}
      accessibilityRole="checkbox"
      accessibilityLabel={label}
      accessibilityState={{ checked }}
      aria-checked={checked}
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
      <Text testID={`${testID}-label`} style={[styles.tileLabel, checked && styles.chipLabelActive]}>{label}</Text>
    </Pressable>
  );
}

// Noms et couleurs dépliés sur place (UX-02).
export function TeamsEditor({ teams, onChange, reorder }: { teams: Team[]; onChange: (t: Team[]) => void; reorder?: boolean }) {
  const styles = useStyles();
  const { colors } = useTheme();
  const [palette, setPalette] = useState<number | null>(null);
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= teams.length) return;
    const copy = [...teams];
    [copy[i], copy[j]] = [copy[j], copy[i]];
    onChange(copy);
  };
  const setColor = (i: number, color: string) => {
    onChange(teams.map((x, k) => (k === i ? { ...x, color } : x)));
    setPalette(null);
  };
  return (
    <View style={{ gap: spacing.md }}>
      {teams.map((t, i) => (
        <View key={t.id} style={{ gap: spacing.sm }}>
          <View style={styles.teamRow}>
            <Pressable
              testID={`team-color-${i}`}
              accessibilityRole="button"
              accessibilityLabel={`Couleur de ${t.name}`}
              accessibilityState={{ expanded: palette === i }}
              aria-expanded={palette === i}
              onPress={() => {
                Haptics.selectionAsync().catch(() => {});
                setPalette((p) => (p === i ? null : i));
              }}
              style={[styles.jerseyBtn, { borderColor: t.color }]}
            >
              <MaterialCommunityIcons name="tshirt-crew" size={24} color={t.color} />
            </Pressable>
            <TextInput
              testID={`team-name-${i}`}
              accessibilityLabel={`Nom de l’équipe ${i + 1}`}
              value={t.name}
              onChangeText={(name) => onChange(teams.map((x, k) => (k === i ? { ...x, name } : x)))}
              style={[styles.input, styles.teamInput]}
              placeholder={`Équipe ${i + 1}`}
              placeholderTextColor={colors.muted}
              maxLength={18}
            />
            {reorder ? (
              <View style={styles.reorderActions}>
                <Pressable onPress={() => move(i, -1)} style={styles.stepBtn} testID={`team-up-${i}`} accessibilityRole="button" accessibilityLabel={`Monter ${t.name}`}>
                  <MaterialCommunityIcons name="chevron-up" size={22} color={colors.onSurface} />
                </Pressable>
                <Pressable onPress={() => move(i, 1)} style={styles.stepBtn} testID={`team-down-${i}`} accessibilityRole="button" accessibilityLabel={`Descendre ${t.name}`}>
                  <MaterialCommunityIcons name="chevron-down" size={22} color={colors.onSurface} />
                </Pressable>
              </View>
            ) : null}
          </View>
          {palette === i ? (
            <View style={styles.swatchRow} testID={`team-palette-${i}`}>
              {TEAM_PALETTE.map((color, ci) => (
                <Pressable
                  key={color}
                  testID={`team-swatch-${i}-${ci}`}
                  accessibilityRole="radio"
                  accessibilityLabel={`Couleur ${ci + 1} pour ${t.name}`}
                  accessibilityState={{ checked: t.color === color }}
                  aria-checked={t.color === color}
                  onPress={() => setColor(i, color)}
                  style={[styles.swatch, { backgroundColor: color }, t.color === color && styles.swatchActive]}
                >
                  {t.color === color ? <MaterialCommunityIcons name="check" size={18} color={colors.onBrandPrimary} /> : null}
                </Pressable>
              ))}
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
      <Pressable onPress={() => setOpen((o) => !o)} style={styles.rowBetween} testID={testID} accessibilityRole="button" accessibilityLabel={title} accessibilityState={{ expanded: open }} aria-expanded={open}>
        <Text testID={`${testID}-title`} style={[styles.fieldLabel, { flex: 1 }]}>{title}</Text>
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

const useBaseStyles = makeStyles((colors) => ({
  section: { gap: spacing.md },
  sectionHeader: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, justifyContent: "space-between", alignItems: "baseline" },
  sectionTitle: { fontFamily: fontFamily.textBold, fontSize: fontSize.sm, letterSpacing: 1.8, color: colors.muted, textTransform: "uppercase" },
  sectionHint: { fontFamily: fontFamily.text, fontSize: fontSize.sm, color: colors.muted },
  card: { backgroundColor: colors.surfaceSecondary, borderRadius: radius.lg, padding: spacing.lg, gap: spacing.xl, borderWidth: 1, borderColor: colors.border },
  field: { gap: spacing.md },
  fieldLabel: { fontFamily: fontFamily.textBold, fontSize: fontSize.lg, color: colors.onSurface, flexShrink: 1, minWidth: 0 },
  hint: { fontFamily: fontFamily.text, fontSize: fontSize.sm, color: colors.muted, lineHeight: fontSize.sm * 1.45 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  chip: {
    minHeight: control.chip,
    minWidth: 82,
    maxWidth: "100%",
    paddingVertical: spacing.sm,
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
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceTertiary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tileActive: { backgroundColor: colors.brandTertiary, borderColor: colors.brandPrimary, borderWidth: 2 },
  tileLabel: { flex: 1, fontFamily: fontFamily.textBold, fontSize: fontSize.base + 1, color: colors.onSurfaceTertiary },
  track: { width: 58, height: 34, borderRadius: radius.pill, backgroundColor: colors.surfaceTertiary, borderWidth: 1, borderColor: colors.borderStrong, padding: 3, justifyContent: "center" },
  toggleTarget: { width: 58, minHeight: 44, justifyContent: "center", flexShrink: 0 },
  trackOn: { backgroundColor: colors.brandPrimary, borderColor: colors.brandPrimary },
  thumb: { width: 26, height: 26, borderRadius: radius.pill, backgroundColor: colors.muted },
  thumbOn: { backgroundColor: colors.onBrandPrimary, alignSelf: "flex-end" },
  dividerLine: { height: 1, backgroundColor: colors.divider, marginVertical: -spacing.xs },
  chipLabel: { fontFamily: fontFamily.textBold, fontSize: fontSize.lg, color: colors.onSurfaceTertiary, textAlign: "center", flexShrink: 1, maxWidth: "100%" },
  chipLabelActive: { color: colors.brandPrimary },
  inputRow: { flexDirection: "row", alignItems: "center", flexShrink: 1, maxWidth: "100%", gap: spacing.sm },
  numericInput: { width: 100, flexShrink: 1, maxWidth: "100%" },
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
  stepperRow: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: spacing.md, minHeight: control.row },
  stepperLabel: { flexGrow: 1, flexBasis: 128, minWidth: 0 },
  stepper: { flexDirection: "row", alignItems: "center", gap: spacing.sm, flexShrink: 0 },
  stepBtn: { width: 52, height: 52, borderRadius: radius.pill, backgroundColor: colors.surfaceTertiary, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center" },
  stepValue: { fontFamily: fontFamily.display, fontSize: fontSize["2xl"] + 8, color: colors.onSurface, minWidth: 52, textAlign: "center" },
  segment: { flexDirection: "row", flexWrap: "wrap", backgroundColor: colors.surfaceTertiary, borderRadius: radius.md, padding: 5, gap: 5, borderWidth: 1, borderColor: colors.border },
  segmentItem: { flexGrow: 1, flexBasis: 108, minWidth: 0, minHeight: 48, paddingHorizontal: spacing.sm, paddingVertical: spacing.sm, borderRadius: radius.sm, alignItems: "center", justifyContent: "center" },
  segmentItemLong: { flexBasis: 144 },
  segmentItemActive: { backgroundColor: colors.brandTertiary, borderWidth: 2, borderColor: colors.brandPrimary },
  teamRow: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: spacing.sm },
  teamInput: { flexGrow: 1, flexBasis: 140, minWidth: 140, maxWidth: "100%" },
  reorderActions: { flexDirection: "row", gap: spacing.xs, marginLeft: "auto" },
  jerseyBtn: { width: 52, height: 52, borderRadius: radius.pill, borderWidth: 2.5, alignItems: "center", justifyContent: "center", backgroundColor: colors.surface },
  swatchRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, paddingLeft: 60 },
  swatch: { width: 44, height: 44, borderRadius: radius.pill, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: "transparent" },
  swatchActive: { borderColor: colors.onSurface },
}));

function useStyles() {
  const base = useBaseStyles();
  const refined = useContext(TypographyPreview);
  const { colors } = useTheme();
  if (!refined) return base;
  return {
    ...base,
    sectionTitle: [base.sectionTitle, refinedType.sectionTitle, { color: colors.onSurfaceTertiary }],
    sectionHint: [base.sectionHint, refinedType.secondary],
    fieldLabel: [base.fieldLabel, refinedType.fieldLabel],
    hint: [base.hint, refinedType.secondary],
    chipLabel: [base.chipLabel, refinedType.control],
    tileLabel: [base.tileLabel, refinedType.tile],
    input: [base.input, refinedType.control],
    suffix: [base.suffix, refinedType.secondary],
  };
}


