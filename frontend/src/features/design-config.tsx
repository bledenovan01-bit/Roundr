import { TextInput, View } from "react-native";
import { DesignRow, DesignSection, DesignInputStyles } from "@/src/components/design-screen";
import { ChoiceRow, EndRulesField, Segmented, Stepper, TeamsEditor, ToggleRow } from "@/src/components/fields";
import { ClassicForm, CupForm, CustomForm, MaracanaForm, SurvieForm } from "./config-forms";
import { classicBreakDefault } from "@/src/domain/defaults";
import { splitPeriods } from "@/src/domain/custom-split";
import { recommendCup, groupSizes } from "@/src/domain/cup";
import type { AnyConfig, Team, DrawRule } from "@/src/domain/types";

const DRAWS: { value: DrawRule; label: string }[] = [{ value: "shootout", label: "TAB directs" }, { value: "extraThenShootout", label: "Prolongation + TAB" }, { value: "golden", label: "Golden goal" }];
const stateLabel = (v: boolean) => v ? "Activé" : "Désactivé";
export function DesignConfig({ config: c, onChange, teams, onTeams }: { config: AnyConfig; onChange: (v: AnyConfig) => void; teams: Team[]; onTeams: (t: Team[]) => void }) {
  const input = DesignInputStyles();
  const set = (p: object) => onChange({ ...c, ...p } as AnyConfig);
  const toggle = (title: string, key: "score" | "additional" | "sounds" | "smallFinal", value: boolean) => <DesignRow title={title} detail={stateLabel(value)}><ToggleRow label={title} testID={`toggle-${key}`} value={value} onChange={v => set({ [key]: v })} /></DesignRow>;
  const duration = (value: number, change: (n: number) => void, title = "Durée") => <DesignRow title={title} detail={`${value} min`}><ChoiceRow label={title} testID="duration" value={value} onChange={change} options={[7,8,10,30].map(n => ({ value: n, label: `${n} min` }))} custom={{ min: 1, onChange: change }} suffix="min" /></DesignRow>;
  const end = c.mode === "classique" ? null : <DesignRow title="Fin du match" detail={[c.end.byTime ? "Temps" : "", c.end.goalTarget ? `premier à ${c.end.goalTarget} buts` : ""].filter(Boolean).join(" + ") || "À configurer"}><EndRulesField value={c.end} onChange={v => set({ end: v, ...((c.mode === "custom" && v.goalTarget != null) ? { score: true } : {}) })} /></DesignRow>;
  const teamsRow = <DesignRow title={c.mode === "classique" ? "Ajouter les équipes" : c.mode === "maracana" ? "Noms et couleurs" : "Équipes"} detail={c.customTeams ? "Modifiables" : "Optionnel"}>
    <ToggleRow label="Personnaliser les équipes" testID="toggle-teams" value={c.customTeams} onChange={v => set({ customTeams: v })} />
    {c.customTeams ? <TeamsEditor teams={teams} onChange={onTeams} reorder={(c.mode === "cup" || c.mode === "survie") && c.draw === "manual"} /> : null}
  </DesignRow>;
  const count = (min: number) => c.mode !== "classique" && c.mode !== "custom" ? <DesignRow title={c.mode === "maracana" ? "Nombre d’équipes" : "Équipes"} detail={String(c.teamCount)}><Stepper label="Nombre d’équipes" testID="teams" min={min} max={c.mode === "maracana" ? 8 : 32} value={c.teamCount} onChange={n => set({ teamCount: n, ...(c.mode === "cup" ? recommendCup(n) : {}) })} /></DesignRow> : null;
  return <View style={{ gap: 14 }}>
    {c.mode === "classique" ? <>
      <DesignSection>DURÉE</DesignSection>
      <ChoiceRow label="" testID="duration" value={c.totalMin} options={[10,30,45,90].map(n => ({ value: n, label: `${n} min` }))} onChange={n => set({ totalMin: n, breakMin: classicBreakDefault(n) })} />
      <DesignRow title="Format" detail={c.periods === 2 ? "2 mi-temps" : "1 période"}><Segmented testID="periods" options={[{ value: 1, label: "1 période" },{ value: 2, label: "2 mi-temps" }]} value={c.periods} onChange={v => set({ periods: v })} />{c.periods === 2 ? <ChoiceRow label="Pause" testID="break" value={c.breakMin} options={[5,10,15].map(n => ({ value: n, label: `${n} min` }))} onChange={n => set({ breakMin: n })} /> : null}</DesignRow>
      {toggle("Score", "score", c.score)}{toggle("Temps additionnel", "additional", c.additional)}{teamsRow}
    </> : c.mode === "custom" ? <>
      {duration(c.totalMin, n => set({ totalMin: n, periodSec: c.autoSplit ? splitPeriods(n*60,c.periods) : c.periodSec }),"Durée totale")}
      <DesignRow title="Périodes" detail={String(c.periods)}><Stepper label="Nombre de périodes" testID="custom-periods" min={1} max={12} value={c.periods} onChange={n => set({ periods: n, autoSplit: true, periodSec: splitPeriods(c.totalMin*60,n) })} /></DesignRow>
      <DesignRow title="Répartition" detail={c.periodSec.map(s => s/60).join(" / ")}><CustomForm config={c} onChange={onChange} /></DesignRow>
      {duration(c.breakMin, n => set({ breakMin: n }),"Pauses")}
      {toggle("Score","score",c.score)}{teamsRow}{toggle("Sons","sounds",c.sounds)}
      <DesignRow title="Sauvegarder preset" detail={c.savePreset ? "Oui" : "Non"}><ToggleRow label="Sauvegarder preset" value={c.savePreset} testID="toggle-save-preset" onChange={v => set({ savePreset: v })} /><TextInput testID="preset-name" accessibilityLabel="Nom du preset" value={c.presetName} onChangeText={v => set({ presetName: v })} placeholder="Nom du preset" style={input} maxLength={30} /></DesignRow>
    </> : c.mode === "maracana" ? <>
      {duration(c.matchMin, n=>set({ matchMin:n }))}{end}{count(3)}{teamsRow}{toggle("Sons et alertes","sounds",c.sounds)}
    </> : <>
      {duration(c.matchMin,n=>set({matchMin:n}))}
      {c.mode === "cup" ? end : null}{count(c.mode === "cup" ? 4 : 2)}
      {c.mode === "cup" ? <>
        <DesignRow title="Structure" detail={`${c.groups} poules de ${groupSizes(c.teamCount,c.groups).join(" / ")}`}><Stepper label="Poules" testID="groups" min={1} max={Math.floor(c.teamCount/2)} value={c.groups} onChange={n=>set({groups:n})} /></DesignRow>
        <DesignRow title="Qualifiés" detail={`${c.qualifiersPerGroup} par poule`}><Stepper label="Qualifiés par poule" testID="qualifiers" min={1} max={Math.min(...groupSizes(c.teamCount,c.groups))} value={c.qualifiersPerGroup} onChange={n=>set({qualifiersPerGroup:n})} /></DesignRow>
      </> : end}
      <DesignRow title={c.mode === "cup" ? "Nul en phase finale" : "Égalité"} detail={DRAWS.find(d=>d.value===c.drawRule)?.label}><Segmented testID="draw-rule" value={c.drawRule} options={DRAWS} onChange={v=>set({drawRule:v})} /></DesignRow>
      {toggle("Petite finale","smallFinal",c.smallFinal)}
      <DesignRow title={c.mode === "cup" ? "Répartition" : "Tirage"} detail={c.draw === "random" ? "Aléatoire" : "Manuel"}><Segmented testID="draw" value={c.draw} options={[{value:"random",label:"Aléatoire"},{value:"manual",label:"Manuel"}]} onChange={v=>set({draw:v})} /></DesignRow>
      {teamsRow}
    </>}
    <DesignRow title="Options avancées" detail="Tous les réglages">{c.mode === "classique" ? <ClassicForm config={c} onChange={onChange}/> : c.mode === "maracana" ? <MaracanaForm config={c} onChange={onChange}/> : c.mode === "cup" ? <CupForm config={c} onChange={onChange}/> : c.mode === "survie" ? <SurvieForm config={c} onChange={onChange}/> : <CustomForm config={c} onChange={onChange}/>}</DesignRow>
  </View>;
}
