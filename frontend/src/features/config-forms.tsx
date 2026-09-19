// Formulaires de configuration par mode (§5). Un seul écran, options
// dépliées sur place, temps d'abord (UX-01/UX-02).
import { Text, View } from "react-native";
import { useContext } from "react";

import { Card, ChoiceRow, Disclosure, Divider, EndRulesField, NumberInput, Section, Segmented, Stepper, ToggleRow } from "@/src/components/fields";
import { bestNextCount, groupSizes, recommendCup } from "@/src/domain/cup";
import { periodsDelta, splitPeriods } from "@/src/domain/custom-split";
import { classicBreakDefault } from "@/src/domain/defaults";
import { byeCount, roundName } from "@/src/domain/bracket";
import type { AnyConfig, ClassicConfig, CupConfig, CustomConfig, DrawRule, MaracanaConfig, RoundMinutes, SurvieConfig } from "@/src/domain/types";
import { fontFamily, fontSize, makeStyles, spacing } from "@/src/theme";
import { TypographyPreview, refinedType } from "@/src/typography-preview";

type FormProps<T extends AnyConfig> = { config: T; onChange: (c: T) => void };

const MATCH_MIN = [7, 8, 10].map((n) => ({ value: n, label: `${n} min` }));
const DRAW_RULES: { value: DrawRule; label: string }[] = [
  { value: "shootout", label: "TAB directs" },
  { value: "extraThenShootout", label: "Prolongation + TAB" },
  { value: "golden", label: "Golden goal" },
];

export function ClassicForm({ config, onChange }: FormProps<ClassicConfig>) {
  const styles = useStyles();
  const set = (p: Partial<ClassicConfig>) => onChange({ ...config, ...p });
  const half = (config.totalMin * 60) / 2;
  const mm = Math.floor(half / 60);
  const ss = Math.round(half % 60);
  return (
    <View style={styles.formStack}>
      <Section title="Temps de jeu">
        <Card>
          <ChoiceRow
            label="Durée totale de jeu"
            testID="duration"
            options={[10, 30, 45, 90].map((n) => ({ value: n, label: `${n} min` }))}
            value={config.totalMin}
            onChange={(n) => set({ totalMin: n, breakMin: classicBreakDefault(n) })}
            custom={{ min: 1, onChange: (n) => set({ totalMin: n, breakMin: classicBreakDefault(n) }) }}
            suffix="min"
          />
          <Divider />
          <Segmented
            label="Format"
            testID="periods"
            options={[{ value: 1, label: "1 période" }, { value: 2, label: "2 mi-temps" }]}
            value={config.periods}
            onChange={(v) => set({ periods: v as 1 | 2 })}
          />
          {config.periods === 2 ? (
            <>
              <Text testID="classic-periods-note" style={styles.note}>{`Chaque mi-temps : ${mm}:${String(ss).padStart(2, "0")} · pause exclue du total.`}</Text>
              <Divider />
              <ChoiceRow
                label="Pause entre les mi-temps"
                testID="break"
                options={[5, 10, 15].map((n) => ({ value: n, label: `${n} min` }))}
                value={config.breakMin}
                onChange={(n) => set({ breakMin: n })}
                custom={{ min: 0, onChange: (n) => set({ breakMin: n }) }}
                suffix="min"
              />
            </>
          ) : null}
        </Card>
      </Section>
      <Section title="Options">
        <Card>
          <ToggleRow testID="toggle-additional" label="Temps additionnel" hint="À zéro, le chrono continue en +00:01… jusqu’à la fin manuelle." value={config.additional} onChange={(v) => set({ additional: v })} />
          <Divider />
          <ToggleRow testID="toggle-score" label="Score" value={config.score} onChange={(v) => set({ score: v })} />
          <Divider />
          <ToggleRow testID="toggle-sounds" label="Sons / alertes" value={config.sounds} onChange={(v) => set({ sounds: v })} />
        </Card>
      </Section>
    </View>
  );
}

export function CustomForm({ config, onChange }: FormProps<CustomConfig>) {
  const styles = useStyles();
  const set = (p: Partial<CustomConfig>) => onChange({ ...config, ...p });
  const totalSec = config.totalMin * 60;
  const setTotal = (min: number) => set({ totalMin: min, periodSec: config.autoSplit ? splitPeriods(min * 60, config.periods) : config.periodSec });
  const setPeriods = (n: number) => set({ periods: n, periodSec: splitPeriods(totalSec, n), autoSplit: true });
  const delta = periodsDelta(config.periodSec, totalSec);
  const goalsOnly = !config.end.byTime;
  return (
    <Card>
      {!goalsOnly ? (
        <View style={styles.fieldGap}>
          <Text style={styles.label}>Durée totale de jeu</Text>
          <NumberInput testID="custom-total" value={String(config.totalMin)} onChange={(t) => setTotal(Math.max(1, parseInt(t || "1", 10)))} suffix="min" />
          <Stepper label="Nombre de périodes" testID="custom-periods" value={config.periods} min={1} max={12} onChange={setPeriods} />
          {config.periods > 1 ? (
            <>
              <Segmented
                label="Répartition"
                testID="split"
                options={[{ value: "auto", label: "Automatique" }, { value: "manual", label: "Personnalisée" }]}
                value={config.autoSplit ? "auto" : "manual"}
                onChange={(v) => set({ autoSplit: v === "auto", periodSec: v === "auto" ? splitPeriods(totalSec, config.periods) : config.periodSec })}
              />
              {!config.autoSplit ? (
                <View style={styles.fieldGap}>
                  {config.periodSec.map((sec, i) => (
                    <View key={i} style={styles.periodRow}>
                      <Text style={styles.periodLabel}>Période {i + 1}</Text>
                      <NumberInput
                        testID={`period-${i}`}
                        value={String(Math.round(sec / 60))}
                        onChange={(t) => {
                          const copy = [...config.periodSec];
                          copy[i] = Math.max(0, parseInt(t || "0", 10)) * 60;
                          set({ periodSec: copy });
                        }}
                        suffix="min"
                      />
                    </View>
                  ))}
                  {delta !== 0 ? (
                    <Text style={styles.error} testID="split-error">{`Somme ${Math.round(config.periodSec.reduce((a, b) => a + b, 0) / 60)} min ≠ total ${config.totalMin} min (${delta > 0 ? "+" : ""}${delta / 60} min).`}</Text>
                  ) : (
                    <Text style={styles.note}>Somme correcte : {config.periodSec.map((s) => Math.round(s / 60)).join(" + ")} min.</Text>
                  )}
                </View>
              ) : (
                <Text style={styles.note}>{config.periodSec.map((s) => Math.round(s / 60)).join(" + ")} min</Text>
              )}
              <ChoiceRow
                label="Pause entre périodes"
                testID="custom-break"
                options={[0, 1, 3, 5].map((n) => ({ value: n, label: n === 0 ? "Aucune" : `${n} min` }))}
                value={config.breakMin}
                onChange={(n) => set({ breakMin: n })}
                custom={{ min: 0, onChange: (n) => set({ breakMin: n }) }}
                suffix="min"
              />
            </>
          ) : null}
        </View>
      ) : (
        <Text style={styles.note}>Buts seul : chrono croissant sans limite, une seule période (C06).</Text>
      )}
      <EndRulesField
        value={config.end}
        onChange={(end) => {
          const goalsOnlyNext = !end.byTime;
          set({ end, score: end.goalTarget != null ? true : config.score, periods: goalsOnlyNext ? 1 : config.periods, periodSec: goalsOnlyNext ? [totalSec] : config.periodSec, additional: end.byTime ? config.additional : false });
        }}
      />
      {config.end.byTime ? <ToggleRow testID="toggle-additional" label="Temps additionnel" hint="Dernière période uniquement, arrêt manuel." value={config.additional} onChange={(v) => set({ additional: v })} /> : null}
      <ToggleRow testID="toggle-score" label="Score" hint={config.end.goalTarget != null ? "Requis par l’objectif de buts." : undefined} value={config.score || config.end.goalTarget != null} onChange={(v) => set({ score: config.end.goalTarget != null ? true : v })} />
      <ToggleRow testID="toggle-sounds" label="Sons / alertes" value={config.sounds} onChange={(v) => set({ sounds: v })} />
    </Card>
  );
}

export function MaracanaForm({ config, onChange }: FormProps<MaracanaConfig>) {
  const styles = useStyles();
  const set = (p: Partial<MaracanaConfig>) => onChange({ ...config, ...p });
  return (
    <View style={styles.formStack}>
      <Section title="Temps de jeu">
        <Card>
          {config.end.byTime ? (
            <>
              <ChoiceRow label="Durée des matchs" testID="duration" options={MATCH_MIN} value={config.matchMin} onChange={(n) => set({ matchMin: n })} custom={{ min: 1, onChange: (n) => set({ matchMin: n }) }} suffix="min" />
              <Divider />
            </>
          ) : null}
          <EndRulesField value={config.end} onChange={(end) => set({ end })} note={config.teamCount === 3 && config.end.byTime ? "À 3 équipes, un 0–0 au temps déclenche une extension unique de 2 min : le premier but l’emporte (C06)." : undefined} />
        </Card>
      </Section>
      <Section title="Équipes">
        <Card>
          <Stepper label="Nombre d’équipes" testID="teams" value={config.teamCount} min={3} max={8} onChange={(n) => set({ teamCount: n })} hint={config.teamCount === 3 ? "Le vainqueur reste, le perdant sort." : "Les deux équipes sortent après chaque match."} />
        </Card>
      </Section>
      <Section title="Options">
        <Card>
          <ToggleRow testID="toggle-sounds" label="Sons / alertes" value={config.sounds} onChange={(v) => set({ sounds: v })} />
          <Divider />
          <Text testID="maracana-options-note" style={styles.note}>Score obligatoire. Préparation automatique du prochain match.</Text>
        </Card>
      </Section>
    </View>
  );
}

function RoundDurations({ teamCount, value, onChange, base }: { teamCount: number; value: RoundMinutes; onChange: (v: RoundMinutes) => void; base: number }) {
  const styles = useStyles();
  let p = 2;
  while (p < teamCount) p *= 2;
  const rounds: number[] = [];
  for (let r = p; r >= 2; r /= 2) rounds.push(r);
  return (
    <View style={styles.fieldGap}>
      {rounds.map((r) => (
        <View key={r} style={styles.periodRow}>
          <Text style={styles.periodLabel}>{roundName(r)}</Text>
          <NumberInput testID={`round-${r}`} value={String(value[r] ?? base)} onChange={(t) => onChange({ ...value, [r]: Math.max(1, parseInt(t || String(base), 10)) })} suffix="min" />
        </View>
      ))}
    </View>
  );
}

export function SurvieForm({ config, onChange }: FormProps<SurvieConfig>) {
  const styles = useStyles();
  const set = (p: Partial<SurvieConfig>) => onChange({ ...config, ...p });
  const byes = byeCount(config.teamCount);
  return (
    <View style={styles.formStack}>
      <Section title="Temps de jeu">
        <Card>
          {config.end.byTime ? (
            <>
              <ChoiceRow label="Durée des matchs" testID="duration" options={MATCH_MIN} value={config.matchMin} onChange={(n) => set({ matchMin: n })} custom={{ min: 1, onChange: (n) => set({ matchMin: n }) }} suffix="min" />
              <Divider />
            </>
          ) : null}
          <EndRulesField value={config.end} onChange={(end) => set({ end })} />
        </Card>
      </Section>
      <Section title="Tableau">
        <Card>
          <Stepper label="Nombre d’équipes" testID="teams" value={config.teamCount} min={2} max={32} onChange={(n) => set({ teamCount: n })} hint={byes > 0 ? `${byes} exemption${byes > 1 ? "s" : ""} au premier tour · ${config.teamCount - 1} matchs` : `${config.teamCount - 1} matchs`} />
          <Divider />
          <Segmented label="Tirage" testID="draw" options={[{ value: "random", label: "Aléatoire" }, { value: "manual", label: "Manuel (ordre des équipes)" }]} value={config.draw} onChange={(v) => set({ draw: v })} />
          <Divider />
          {config.teamCount >= 4 ? <ToggleRow testID="toggle-small-final" label="Match pour la 3e place" value={config.smallFinal} onChange={(v) => set({ smallFinal: v })} /> : <Text style={styles.note}>Petite finale indisponible à moins de 4 équipes.</Text>}
        </Card>
      </Section>
      <Section title="Égalité">
        <Card>
          <Segmented label="Départage" testID="draw-rule" options={DRAW_RULES} value={config.drawRule} onChange={(v) => set({ drawRule: v })} />
          {config.drawRule === "extraThenShootout" ? (
            <>
              <Divider />
              <ChoiceRow label="Durée de prolongation" testID="extra" options={[1, 2, 3, 5].map((n) => ({ value: n, label: `${n} min` }))} value={config.extraMin} onChange={(n) => set({ extraMin: n })} custom={{ min: 1, onChange: (n) => set({ extraMin: n }) }} suffix="min" />
            </>
          ) : null}
        </Card>
      </Section>
      <Section title="Options">
        <Card>
          <ToggleRow testID="toggle-sounds" label="Sons / alertes" value={config.sounds} onChange={(v) => set({ sounds: v })} />
          {config.end.byTime ? (
            <>
              <Divider />
              <Disclosure title="Options avancées : durées par tour" testID="advanced">
                <RoundDurations teamCount={config.teamCount} value={config.roundMinutes} onChange={(roundMinutes) => set({ roundMinutes })} base={config.matchMin} />
              </Disclosure>
            </>
          ) : null}
        </Card>
      </Section>
    </View>
  );
}

export function CupForm({ config, onChange }: FormProps<CupConfig>) {
  const styles = useStyles();
  const set = (p: Partial<CupConfig>) => onChange({ ...config, ...p });
  const sizes = groupSizes(config.teamCount, config.groups);
  const rec = recommendCup(config.teamCount);
  const extra = bestNextCount(config.groups, config.qualifiersPerGroup);
  const perGroupMatches = sizes.reduce((a, n) => a + (n * (n - 1)) / 2, 0) * (config.doubleRound ? 2 : 1);
  const totalQualified = config.groups * config.qualifiersPerGroup + extra;
  return (
    <View style={styles.formStack}>
      <Section title="Temps de jeu">
        <Card>
          {config.end.byTime ? (
            <>
              <ChoiceRow label="Durée des matchs de poule" testID="duration" options={MATCH_MIN} value={config.matchMin} onChange={(n) => set({ matchMin: n })} custom={{ min: 1, onChange: (n) => set({ matchMin: n }) }} suffix="min" />
              <Divider />
            </>
          ) : null}
          <EndRulesField value={config.end} onChange={(end) => set({ end })} />
        </Card>
      </Section>
      <Section title="Poules">
        <Card>
          <Stepper
            label="Nombre d’équipes"
            testID="teams"
            value={config.teamCount}
            min={4}
            max={32}
            onChange={(n) => {
              const r = recommendCup(n);
              set({ teamCount: n, groups: r.groups, qualifiersPerGroup: r.qualifiersPerGroup });
            }}
          />
          <Divider />
          <Stepper label="Poules" testID="groups" value={config.groups} min={1} max={Math.max(1, Math.floor(config.teamCount / 2))} onChange={(n) => set({ groups: n })} hint={`Recommandé : ${rec.groups} · tailles ${sizes.join("/")} · ${perGroupMatches} matchs`} />
          <Divider />
          <Segmented label="Format des poules" testID="format" options={[{ value: "single", label: "Aller simple" }, { value: "double", label: "Aller-retour" }]} value={config.doubleRound ? "double" : "single"} onChange={(v) => set({ doubleRound: v === "double" })} />
          <Divider />
          <Segmented label="Répartition" testID="draw" options={[{ value: "random", label: "Aléatoire" }, { value: "manual", label: "Manuelle (ordre)" }]} value={config.draw} onChange={(v) => set({ draw: v })} />
        </Card>
      </Section>
      <Section title="Phase finale">
        <Card>
          <Stepper label="Qualifiés par poule" testID="qualifiers" value={config.qualifiersPerGroup} min={1} max={Math.min(...sizes)} onChange={(n) => set({ qualifiersPerGroup: n })} hint={extra > 0 ? `${config.groups * config.qualifiersPerGroup} directs + ${extra} meilleur${extra > 1 ? "s" : ""} suivant${extra > 1 ? "s" : ""} → ${totalQualified} en phase finale` : `${totalQualified} équipes en phase finale`} />
          <Divider />
          <Segmented label="Égalité en phase finale" testID="draw-rule" options={DRAW_RULES} value={config.drawRule} onChange={(v) => set({ drawRule: v })} />
          {config.drawRule === "extraThenShootout" ? (
            <>
              <Divider />
              <ChoiceRow label="Durée de prolongation" testID="extra" options={[1, 2, 3, 5].map((n) => ({ value: n, label: `${n} min` }))} value={config.extraMin} onChange={(n) => set({ extraMin: n })} custom={{ min: 1, onChange: (n) => set({ extraMin: n }) }} suffix="min" />
            </>
          ) : null}
          {totalQualified >= 4 ? (
            <>
              <Divider />
              <ToggleRow testID="toggle-small-final" label="Match pour la 3e place" value={config.smallFinal} onChange={(v) => set({ smallFinal: v })} />
            </>
          ) : null}
        </Card>
      </Section>
      <Section title="Options">
        <Card>
          <ToggleRow testID="toggle-sounds" label="Sons / alertes" value={config.sounds} onChange={(v) => set({ sounds: v })} />
          <Divider />
          <Disclosure title="Options avancées" testID="advanced">
            {config.end.byTime ? (
              <ToggleRow testID="toggle-group-additional" label="Additionnel ouvert en poules" hint="À zéro le chrono monte jusqu’à la fin manuelle ; le nul reste possible. Si « Premier à X buts » est actif, l’atteindre termine le match même pendant l’additionnel." value={config.groupAdditional} onChange={(v) => set({ groupAdditional: v })} />
            ) : null}
            {config.end.byTime ? (
              <>
                <Text style={styles.label}>Durées par tour</Text>
                <RoundDurations teamCount={totalQualified} value={config.roundMinutes} onChange={(roundMinutes) => set({ roundMinutes })} base={config.matchMin} />
              </>
            ) : null}
            <Text style={styles.note}>Croisements par défaut : 1er de poule contre 2e d’une autre poule (A1–B2, B1–A2 à 8 équipes).</Text>
          </Disclosure>
        </Card>
      </Section>
    </View>
  );
}

const useBaseStyles = makeStyles((colors) => ({
  formStack: { gap: spacing.xl },
  fieldGap: { gap: spacing.md },
  label: { fontFamily: fontFamily.textBold, fontSize: fontSize.lg, color: colors.onSurface },
  note: { fontFamily: fontFamily.text, fontSize: fontSize.sm, color: colors.muted, lineHeight: fontSize.sm * 1.4 },
  error: { fontFamily: fontFamily.textBold, fontSize: fontSize.sm, color: colors.error },
  periodRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  periodLabel: { fontFamily: fontFamily.text, fontSize: fontSize.base, color: colors.onSurface },
}));

function useStyles() {
  const base = useBaseStyles();
  const refined = useContext(TypographyPreview);
  return refined ? { ...base, note: [base.note, refinedType.secondary] } : base;
}
