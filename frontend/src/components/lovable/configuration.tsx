import { isValidElement, useState, type ReactNode } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useFormWindowDimensions } from "@/src/hooks/use-form-window-dimensions";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Circle, Line, Path } from "react-native-svg";
import type { ClassicConfig, MaracanaConfig, Team } from "@/src/domain/types";
import { lovable as c, lovableFont as f, withAlpha } from "@/src/visual/lovable";
import { getPreferences } from "@/src/store/preferences";
import { referenceTeamPalette } from "@/src/features/lovable-config-state";
import { LovableBackground } from "./background";
import { LovableIcon } from "./icon";

type Config = ClassicConfig | MaracanaConfig;
const bold = "ManropeRefined-Bold";
const rectText = { includeFontPadding: false } as const;
export function Mark({ name, color = c.foreground, size: customSize }: { name: "play" | "minus" | "plus" | "info" | "warning"; color?: string; size?: number }) {
  const size = customSize ?? (name === "play" ? 18 : name === "warning" ? 14 : 16);
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" accessible={false} aria-hidden>
    {name === "play" ? <Path d="M5 5a2 2 0 0 1 3.008-1.728l11.997 6.998a2 2 0 0 1 .003 3.458l-12 7A2 2 0 0 1 5 19z" fill={color} /> : name === "warning" ? <><Path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3" /><Path d="M12 9v4M12 17h.01" /></> : name === "info" ? <><Circle cx="12" cy="12" r="10" /><Path d="M12 16v-4M12 8h.01" /></> : <><Line x1="5" x2="19" y1="12" y2="12" />{name === "plus" ? <Line x1="12" x2="12" y1="5" y2="19" /> : null}</>}
  </Svg>;
}
export function ConfigAction({ label, onPress, disabled = false, primary = false, testID, importTeams = false }: { label: string; onPress: () => void; disabled?: boolean; primary?: boolean; testID?: string; importTeams?: boolean }) {
  const { width, height } = useFormWindowDimensions();
  return <Pressable testID={testID} accessibilityRole="button" accessibilityLabel={label} disabled={disabled} accessibilityState={{ disabled }} onPress={onPress} style={({ pressed }) => [s.action, { minHeight: primary ? width > height ? 48 : 56 : importTeams ? 44 : 50, backgroundColor: primary ? c.primary : c.cardRaised, opacity: disabled ? .4 : 1, borderWidth: primary ? 0 : 1 }, pressed && s.pressed]}>
    {primary ? <Mark name="play" color={c.onPrimary} /> : importTeams ? <LovableIcon name="users" color={c.foreground} /> : null}<Text style={[s.actionText, { color: primary ? c.onPrimary : c.foreground, fontSize: primary ? 16 : 14, lineHeight: primary ? 160 / 7 : 20, fontFamily: primary ? f.extrabold : bold }]}>{label}</Text>
  </Pressable>;
}
export function LovableConfigFrame({ mode, onBack, onLaunch, disabled, children }: { mode: Config["mode"]; onBack: () => void; onLaunch: () => void; disabled: boolean; children: ReactNode }) {
  const { width, height } = useFormWindowDimensions(), inset = useSafeAreaInsets(), landscape = width > height;
  const cardWidth = landscape ? (width - inset.left - inset.right - 52) / 2 : width - inset.left - inset.right - 40;
  return <KeyboardAvoidingView style={s.screen} behavior={Platform.OS === "ios" ? "padding" : "height"}>
    <LovableBackground />
    <View style={[s.header, { paddingTop: inset.top + (landscape ? 10 : 18), paddingBottom: landscape ? 4 : 10, paddingLeft: 20 + inset.left, paddingRight: 20 + inset.right }]}>
      <Pressable testID="config-back" accessibilityRole="button" accessibilityLabel="Retour" onPress={onBack} style={s.back}><LovableIcon name="back" color={c.foreground} size={20} /></Pressable>
      <View style={{ flex: 1, minWidth: 0 }}><Text testID="config-title" accessibilityRole="header" numberOfLines={1} style={s.title}>{mode === "classique" ? "Match classique" : "Maracana"}</Text><Text style={s.subtitle}>Paramètres</Text></View><View style={{ width: 44 }} />
    </View>
    {/* RN Web's on-drag blurs inputs on every scroll, including focus/keyboard scrolling. */}
    <ScrollView testID="config-scroll" style={{ flex: 1 }} keyboardShouldPersistTaps="handled" keyboardDismissMode={Platform.OS === "web" ? "none" : "on-drag"} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingTop: 6, paddingLeft: 20 + inset.left, paddingRight: 20 + inset.right, paddingBottom: Math.max(16, inset.bottom), gap: 12, flexDirection: "row", flexWrap: "wrap", alignItems: "flex-start" }}>
      <View testID="config-intro" style={[s.intro, { width: "100%" }]}><View style={[s.modeIcon, { backgroundColor: withAlpha(mode === "classique" ? c.classic : c.maracana, .16), borderColor: withAlpha(mode === "classique" ? c.classic : c.maracana, .35) }]}><LovableIcon name={mode === "classique" ? "pitch" : "refresh"} color={mode === "classique" ? c.classic : c.maracana} size={22} /></View><Text style={s.introText}>{mode === "classique" ? "Un match simple entre deux équipes, avec ou sans mi-temps." : "Les équipes tournent à chaque match. Les deux équipes en attente entrent, celles qui sortent repassent en fin de file."}</Text></View>
      {(children as ReactNode[]).filter(Boolean).map((child, i) => <View key={isValidElement(child) ? child.key ?? i : i} style={{ width: cardWidth }}>{child}</View>)}
    </ScrollView>
    <View style={{ paddingTop: landscape ? 8 : 12, paddingBottom: Math.max(inset.bottom, landscape ? 10 : 16), paddingLeft: 20 + inset.left, paddingRight: 20 + inset.right, alignItems: "center" }}><View style={{ width: "100%", maxWidth: landscape ? 420 : undefined }}><ConfigAction testID="config-launch" primary label={mode === "classique" ? "Lancer le match" : "Lancer le Maracana"} onPress={onLaunch} disabled={disabled} /></View></View>
  </KeyboardAvoidingView>;
}
export function ConfigCard({ title, hint, right, children }: { title: string; hint?: string; right?: ReactNode; children?: ReactNode }) {
  return <View testID={`card-${title}`} style={s.card}><View style={s.cardHead}><View style={{ flexShrink: 1, minWidth: 0 }}><Text accessibilityRole="header" style={s.cardTitle}>{title}</Text>{hint ? <Text style={s.hint}>{hint}</Text> : null}</View>{right}</View>{children}</View>;
}
export function Toggle({ label, on, set }: { label: string; on: boolean; set: (on: boolean) => void }) {
  return <Pressable accessibilityRole="switch" accessibilityLabel={label} accessibilityState={{ checked: on }} aria-checked={on} onPress={() => set(!on)} hitSlop={7} style={[s.toggle, { backgroundColor: on ? c.primary : c.mutedSurface }]}><View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: on ? c.onPrimary : c.foreground, marginLeft: on ? 23 : 3 }} /></Pressable>;
}
export function ToggleCard({ title, hint, on, set, children }: { title: string; hint?: string; on: boolean; set: (on: boolean) => void; children?: ReactNode }) {
  return <ConfigCard title={title} hint={hint} right={<Toggle label={title === "Sons / effets" ? "Sons et effets" : title} on={on} set={set} />}>{on ? children : null}</ConfigCard>;
}
export function Chip({ label, active, onPress, disabled = false, check = false, flexible = false, testID, alignStart = false }: { label: string; active: boolean; onPress: () => void; disabled?: boolean; check?: boolean; flexible?: boolean; testID?: string; alignStart?: boolean }) {
  return <Pressable testID={testID} accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ selected: active, disabled }} aria-pressed={active} disabled={disabled} onPress={onPress} hitSlop={flexible ? 2 : 0} style={({ pressed }) => [s.chip, flexible && s.flexChip, alignStart && {justifyContent:"flex-start",paddingHorizontal:14}, { backgroundColor: active ? c.primary : c.secondary, borderColor: active ? c.primary : c.border }, pressed && s.pressed]}>
    {check && active ? <LovableIcon name="check" color={c.onPrimary} size={15} /> : null}<Text style={[s.chipText, { color: active ? c.onPrimary : c.foreground, fontSize: /^\d$/.test(label) ? 15 : 13, lineHeight: flexible ? 130 / 7 : 19.5, flexShrink: flexible ? 1 : 0 }]}>{label}</Text>
  </Pressable>;
}
export function Options<T extends string>({ value, options, onChange, flexible = false }: { value: T; options: { value: T; label: string }[]; onChange: (value: T) => void; flexible?: boolean }) {
  return <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>{options.map(o => <View key={o.value} style={{ flexGrow: 1, flexShrink: 1, flexBasis: flexible ? 100 : 0 }}><Chip flexible={flexible} label={o.label} active={value === o.value} onPress={() => onChange(o.value)} /></View>)}</View>;
}
export function Stepper({ value, min, max, unit, label, onChange }: { value: number; min: number; max: number; unit: string; label: string; onChange: (n: number) => void }) {
  return <View style={s.stepper}><Pressable accessibilityRole="button" accessibilityLabel={`Réduire ${label}`} disabled={value <= min} accessibilityState={{ disabled: value <= min }} onPress={() => onChange(Math.max(min, value - 1))} hitSlop={4} style={[s.stepButton, { opacity: value <= min ? .35 : 1 }]}><Mark name="minus" /></Pressable><View style={s.stepValue}><Text accessibilityLiveRegion="polite" style={s.stepNumber}>{value}<Text style={s.unit}> {unit}</Text></Text></View><Pressable accessibilityRole="button" accessibilityLabel={`Augmenter ${label}`} disabled={value >= max} accessibilityState={{ disabled: value >= max }} onPress={() => onChange(Math.min(max, value + 1))} hitSlop={4} style={[s.stepButton, { opacity: value >= max ? .35 : 1 }]}><Mark name="plus" /></Pressable></View>;
}
export function Sub({ label, children }: { label: string; children: ReactNode }) {
  return <View style={s.sub}><Text style={s.subText}>{label}</Text>{children}</View>;
}
function Duration({ mode, value, onChange, compact }: { mode: Config["mode"]; value: number; onChange: (n: number) => void; compact: boolean }) {
  const presets = mode === "classique" ? [10, 30, 45, 90] : [7, 8, 10];
  const [custom, setCustom] = useState(!presets.includes(value));
  return <ConfigCard title={mode === "classique" ? "Temps de jeu" : "Durée des matchs"}>
    <View style={{ gap: 8 }}><View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>{presets.map(n => <View key={n} style={{ flex: 1 }}><Chip label={`${n} min`} active={!custom && value === n} onPress={() => { setCustom(false); onChange(n); }} /></View>)}{!compact ? <View style={{ flex: 1.6 }}><Chip label="Personnalisée" active={custom} onPress={() => setCustom(true)} /></View> : null}</View>
    {compact ? <Chip label="Personnalisée" active={custom} onPress={() => setCustom(true)} /> : null}</View>
    {custom ? <Sub label="Durée personnalisée"><Stepper value={value} min={mode === "classique" ? 1 : 2} max={mode === "classique" ? 120 : 45} unit="min" label="la durée" onChange={onChange} /></Sub> : null}
  </ConfigCard>;
}
export function NumberField({ label, value, onChange }: { label: string; value: number; onChange: (n: number) => void }) {
  const [focused, setFocused] = useState(false);
  return <TextInput accessibilityLabel={label} keyboardType="number-pad" value={String(value)} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} onChangeText={text => { const number = Number(text); onChange(Number.isFinite(number) ? Math.max(1, Math.min(3600, Math.trunc(number) || 1)) : 1); }} style={[s.input, { width: "100%", marginTop: 6, outlineStyle: "solid", outlineWidth: focused ? 2 : 0, outlineOffset: -1, outlineColor: c.primary }]} />;
}
function CompositionPicker({ config, onUse }: { config: Config; onUse: (teams: Team[]) => void }) {
  const [used, setUsed] = useState(false);
  const saved = getPreferences().teams, count = config.mode === "classique" ? 2 : config.teamCount;
  const min = config.mode === "classique" ? 2 : 3, max = config.mode === "classique" ? 2 : 8;
  if (!saved.length) return null;
  const fits = saved.length >= min && saved.length <= max;
  return <View style={{ gap: 8 }}><ConfigAction importTeams label={`Importer mes ${saved.length} équipes`} disabled={!fits} onPress={() => { onUse(saved.map(team => ({ ...team }))); setUsed(true); }} />
    {!fits ? <Text style={s.importHint}>Ce mode accepte de {min} à {max} équipes : votre dernière composition en compte {saved.length}.</Text> : null}
    {used && fits ? <Text style={s.importHint}>{saved.length !== count ? `Le nombre d'équipes a été ajusté à ${saved.length}.` : "Composition importée : vous pouvez encore la modifier ci-dessous."}</Text> : null}
  </View>;
}
export function useLovableConfigCards({ config, onChange, teams, onTeams, extra }: { config: Config; onChange: (config: Config) => void; teams: Team[]; onTeams: (teams: Team[]) => void; extra?: ReactNode }): ReactNode[] {
  const { width, height } = useFormWindowDimensions(), inset = useSafeAreaInsets();
  const [rememberedGoals, setRememberedGoals] = useState(config.mode === "maracana" ? config.end.goalTarget ?? 3 : 3);
  const compact = (width > height ? (width - inset.left - inset.right - 52) / 2 : width - inset.left - inset.right - 40) - 30 <= 360;
  const cards: ReactNode[] = [];
  const duration = config.mode === "classique" ? config.totalMin : config.matchMin;
  cards.push(<Duration key="duration" mode={config.mode} value={duration} compact={compact} onChange={n => onChange(config.mode === "classique" ? { ...config, totalMin: n } : { ...config, matchMin: n })} />);
  if (config.mode === "classique") {
    const set = (p: Partial<ClassicConfig>) => onChange({ ...config, ...p });
    cards.push(<ConfigCard key="format" title="Format"><Options value={String(config.periods)} options={[{ value: "1", label: "Une période" }, { value: "2", label: "Deux mi-temps" }]} onChange={v => set({ periods: Number(v) as 1 | 2 })} />{config.periods === 2 ? <Sub label="Pause à la mi-temps"><Stepper value={config.breakMin} min={1} max={20} unit="min" label="la pause" onChange={breakMin => set({ breakMin })} /></Sub> : null}</ConfigCard>);
    cards.push(<View key="summary" testID="classic-periods-note" style={s.summary}><Mark name="info" color={c.primary} /><Text style={s.summaryText}>Temps de jeu : {config.periods === 2 ? `2 × ${config.totalMin / 2} min · pause de ${config.breakMin} min non comptée` : `${config.totalMin} min`}.</Text></View>);
    cards.push(<ToggleCard key="additional" title="Temps additionnel" hint="À la fin de chaque période, fin manuelle" on={config.additional} set={additional => set({ additional })} />);
    cards.push(<ToggleCard key="score" title="Score" hint="Afficher et compter les buts" on={config.score} set={score => set({ score })} />);
  } else {
    const set = (p: Partial<MaracanaConfig>) => onChange({ ...config, ...p });
    cards.push(<ConfigCard key="end" title="Fin du match" hint="Combinables : le premier critère atteint termine le match."><View style={{ flexDirection: "row", gap: 8 }}><View style={{ flex: 1 }}><Chip label="Au temps" check active={config.end.byTime} disabled={config.end.byTime && config.end.goalTarget === null} onPress={() => set({ end: { ...config.end, byTime: !config.end.byTime } })} /></View><View style={{ flex: 1 }}><Chip label="Premier à X buts" check active={config.end.goalTarget !== null} disabled={config.end.goalTarget !== null && !config.end.byTime} onPress={() => { if (config.end.goalTarget !== null) setRememberedGoals(config.end.goalTarget); set({ end: { ...config.end, goalTarget: config.end.goalTarget === null ? rememberedGoals : null } }); }} /></View></View>{config.end.goalTarget !== null ? <Sub label="Objectif de buts"><Stepper value={config.end.goalTarget} min={1} max={10} unit="buts" label="l'objectif de buts" onChange={goalTarget => { setRememberedGoals(goalTarget); set({ end: { ...config.end, goalTarget } }); }} /></Sub> : null}</ConfigCard>);
    cards.push(<ConfigCard key="launch" title="Lancement du prochain match"><Options flexible value={config.launch ?? "manual"} options={[{ value: "manual", label: "Manuel" }, { value: "auto", label: "Automatique" }, { value: "delay", label: "Après un délai" }]} onChange={launch => set({ launch })} />{config.launch === "delay" ? <View style={[s.sub, { flexDirection: "column", alignItems: "stretch", gap: 12 }]}><Options flexible value={String(config.launchDelaySec ?? 60)} options={[{ value: "30", label: "30 secondes" }, { value: "60", label: "1 minute" }, { value: "120", label: "2 minutes" }]} onChange={v => set({ launchDelaySec: Number(v) })} /><View><Text style={[s.subText, {fontSize:12,lineHeight:18}]}>Durée personnalisée (secondes)</Text><NumberField label="Délai personnalisé en secondes" value={config.launchDelaySec ?? 60} onChange={launchDelaySec => set({ launchDelaySec })} /></View></View> : null}</ConfigCard>);
    cards.push(<ConfigCard key="rotation" title="Règle de rotation"><Options flexible value={config.rotation ?? "classic"} options={[{ value: "classic", label: "Rotation classique" }, { value: "winnerStays", label: "Le gagnant reste" }]} onChange={rotation => set({ rotation })} /></ConfigCard>);
    if (config.rotation === "winnerStays" && config.teamCount >= 4) cards.push(<ConfigCard key="draw" title="En cas de match nul" hint="Le gagnant reste, à partir de 4 équipes."><Options flexible value={config.drawRule4 ?? "oneLeaves"} options={[{ value: "oneLeaves", label: "Une équipe sort" }, { value: "bothLeave", label: "Les deux équipes sortent" }]} onChange={drawRule4 => set({ drawRule4 })} /></ConfigCard>);
    cards.push(<ConfigCard key="count" title="Nombre d'équipes"><View style={{ flexDirection: "row", gap: 8 }}>{[3, 4, 5, 6, 7, 8].map(n => <View key={n} style={{ flex: 1 }}><Chip label={String(n)} testID={`teams-${n}`} active={config.teamCount === n} onPress={() => set({ teamCount: n })} /></View>)}</View></ConfigCard>);
  }
  cards.push(<ToggleCard key="teams" title="Personnaliser les équipes" hint="Noms et couleurs" on={config.customTeams} set={customTeams => onChange({ ...config, customTeams })}><CompositionPicker config={config} onUse={saved => { onTeams(saved); onChange(config.mode === "maracana" ? { ...config, teamCount: saved.length } : config); }} /><ConfigTeams teams={teams} onChange={onTeams} /></ToggleCard>);
  cards.push(<ToggleCard key="sounds" title="Sons / effets" hint="Coup de sifflet de début et de fin" on={config.sounds} set={sounds => onChange({ ...config, sounds })} />);
  if (extra) cards.push(<View key="extra">{extra}</View>);
  return cards;
}
export function Jersey({ color, size = 32 }: { color: string; size?: number }) {
  return <Svg width={size} height={size} viewBox="0 0 52 54" fill="none" accessible={false} aria-hidden><Path d="M17 4.5 11 7 2.8 15.7 8.7 23l5.2-3.4V48c0 1.2 1 2.2 2.2 2.2h19.8c1.2 0 2.2-1 2.2-2.2V19.6l5.2 3.4 5.9-7.3L41 7l-6-2.5c-2 3.1-5.1 4.7-9 4.7s-7-1.6-9-4.7Z" fill={color} stroke={c.foreground} strokeOpacity={.35} strokeWidth={1.4} strokeLinejoin="round" /><Path d="M17 4.5c2 3.1 5.1 4.7 9 4.7s7-1.6 9-4.7" stroke={c.background} strokeWidth={2.7} strokeLinecap="round" /><Path d="M2.8 15.7 8.7 23l5.2-3.4m24.2 0 5.2 3.4 5.9-7.3" stroke={c.foreground} strokeOpacity={.22} strokeWidth={1.2} /></Svg>;
}
export function TeamError({ children }: { children: ReactNode }) {
  return <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}><Mark name="warning" color={c.error} /><Text accessibilityRole="alert" style={s.error}>{children}</Text></View>;
}
export function ConfigTeams({ teams, onChange, reorder = false, compact = false }: { teams: Team[]; onChange: (teams: Team[]) => void; reorder?: boolean; compact?: boolean }) {
  const [open, setOpen] = useState<number | null>(null);
  const [focused, setFocused] = useState<number | null>(null);
  const [paletteWidth, setPaletteWidth] = useState(0);
  const innerWidth = Math.max(36, paletteWidth - 16), columns = Math.max(1, Math.floor((innerWidth + 8) / 44));
  // onLayout rounds on web; reserve one pixel so the final column cannot wrap.
  const swatchWidth = (innerWidth - (columns - 1) * 8 - 1) / columns;
  const change = (index: number, patch: Partial<Team>) => onChange(teams.map((t, i) => i === index ? { ...t, ...patch } : t));
  const duplicate = teams.some((t, i) => teams.some((other, j) => i !== j && t.name.trim().toLowerCase() === other.name.trim().toLowerCase()));
  const empty = teams.some(t => !t.name.trim());
  const allColors = referenceTeamPalette;
  const colorNames = ["Orange", "Vert", "Bleu", "Rouge", "Jaune", "Violet", "Cyan", "Rose vif", "Citron vert", "Turquoise", "Bleu ciel", "Indigo", "Fuchsia", "Rose pâle", "Or", "Blanc", "Gris", "Noir", "Marine", "Grenat", "Olive", "Menthe", "Corail", "Lavande", "Marron", "Sable", "Vert forêt", "Bordeaux"];
  return <View style={{ gap: compact ? 4 : 8, borderTopWidth: 1, borderColor: c.border, paddingTop: 10 }}>{teams.map((t, i) => <View key={t.id} style={{ gap: 8 }}><View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}><Text style={{ width: 18, color: c.muted, fontFamily: f.extrabold, fontSize: 12, textAlign: "center" }}>{i + 1}</Text><Pressable accessibilityRole="button" accessibilityLabel={`Changer la couleur de ${t.name || `l'équipe ${i + 1}`}`} accessibilityState={{ expanded: open === i }} onPress={() => setOpen(open === i ? null : i)} style={{ width: 40, height: compact ? 38 : 44, alignItems: "center", justifyContent: "center" }}><Jersey color={t.color} size={compact ? 26 : 32} /></Pressable><TextInput accessibilityLabel={`Nom de l'équipe ${i + 1}`} maxLength={18} onFocus={() => setFocused(i)} onBlur={() => setFocused(null)} value={t.name} placeholder={`Équipe ${i + 1}`} placeholderTextColor={c.muted} onChangeText={name => change(i, { name })} style={[s.input, { flex: 1, height: compact ? 38 : 44, fontSize: compact ? 14 : 15, outlineStyle: "solid", outlineWidth: focused === i ? 2 : 0, outlineOffset: -1, outlineColor: c.primary, borderColor: !t.name.trim() || teams.some((other, j) => j !== i && other.name.trim().toLowerCase() === t.name.trim().toLowerCase()) ? c.error : c.border }]} />{reorder ? <View style={{flexDirection:"row",gap:4}}>{[-1,1].map(delta=><Pressable key={delta} accessibilityRole="button" accessibilityLabel={(delta<0?"Monter ":"Descendre ")+t.name} disabled={i+delta<0||i+delta>=teams.length} accessibilityState={{disabled:i+delta<0||i+delta>=teams.length}} hitSlop={5} onPress={()=>{const next=[...teams],j=i+delta;[next[i],next[j]]=[next[j],next[i]];onChange(next);}} style={{width:34,height:34,borderRadius:10,borderWidth:1,borderColor:c.border,backgroundColor:c.cardRaised,alignItems:"center",justifyContent:"center",opacity:i+delta<0||i+delta>=teams.length?.3:1}}><Svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke={c.foreground} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><Path d={delta<0?"m5 12 7-7 7 7M12 19V5":"M12 5v14m7-7-7 7-7-7"} /></Svg></Pressable>)}</View> : null}</View>{open === i ? <View onLayout={event => setPaletteWidth(event.nativeEvent.layout.width)} accessibilityRole="radiogroup" accessibilityLabel={`Couleur de ${t.name}`} style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, padding: 8, backgroundColor: c.secondary, borderRadius: 12 }}>{allColors.map((color, j) => <Pressable key={color} accessibilityRole="radio" accessibilityLabel={colorNames[j]} accessibilityState={{ checked: t.color === color }} onPress={() => { change(i, { color }); setOpen(null); }} style={{ width: swatchWidth, height: 30, alignItems: "center", justifyContent: "center" }} hitSlop={{top:7,bottom:7,left:4,right:4}}><View style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: color, boxShadow: t.color === color ? [{offsetX:0,offsetY:0,blurRadius:0,spreadDistance:2,color:c.background},{offsetX:0,offsetY:0,blurRadius:0,spreadDistance:4,color}] : undefined, borderWidth: 2, borderColor: withAlpha(c.foreground, .18), alignItems: "center", justifyContent: "center" }}>{t.color === color ? <LovableIcon name="check" color={[11,17,18,19,24,26,27].includes(j) ? "#f5f5f5" : c.background} size={13} /> : null}</View></Pressable>)}</View> : null}</View>)}{duplicate ? <TeamError>Deux équipes ne peuvent pas porter le même nom.</TeamError> : null}{empty ? <TeamError>Chaque équipe doit avoir un nom.</TeamError> : null}</View>;
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: c.background },
  header: { flexDirection: "row", gap: 8, alignItems: "center" },
  back: { width: 44, height: 44, borderRadius: 14, borderWidth: 1, borderColor: c.border, backgroundColor: c.cardRaised, alignItems: "center", justifyContent: "center" },
  title: { ...rectText, fontFamily: f.extrabold, fontSize: 20, lineHeight: 30, color: c.foreground, textAlign: "center" },
  subtitle: { ...rectText, fontFamily: f.semibold, fontSize: 12, lineHeight: 18, color: c.muted, marginTop: 2, textAlign: "center" },
  intro: { flexDirection: "row", gap: 12, alignItems: "center", paddingHorizontal: 2, paddingVertical: 4 },
  introText: { ...rectText, flex: 1, color: c.muted, fontFamily: f.regular, fontSize: 13, lineHeight: 18.85 },
  modeIcon: { width: 46, height: 46, borderRadius: 14, borderWidth: 1, borderColor: withAlpha(c.primary, .35), alignItems: "center", justifyContent: "center" },
  card: { padding: 14, gap: 12, borderWidth: 1, borderColor: c.border, borderRadius: 18, backgroundColor: c.card },
  cardHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  cardTitle: { ...rectText, fontFamily: f.extrabold, fontSize: 15, lineHeight: 22.5, color: c.foreground },
  hint: { ...rectText, fontFamily: f.regular, fontSize: 12, lineHeight: 18, color: c.muted, marginTop: 2 },
  importHint: { ...rectText, fontFamily: f.semibold, fontSize: 12, lineHeight: 18, color: c.muted },
  toggle: { width: 50, height: 30, flexShrink: 0, borderRadius: 999, justifyContent: "center" },
  chip: { minHeight: 44, borderRadius: 12, borderWidth: 1, paddingHorizontal: 8, flexDirection: "row", gap: 5, alignItems: "center", justifyContent: "center" },
  flexChip: { flexGrow: 1, minHeight: 40, borderRadius: 8, paddingVertical: 10, paddingHorizontal: 12 },
  chipText: { ...rectText, fontFamily: bold, fontSize: 13, lineHeight: 19.5, textAlign: "center", flexShrink: 1 },
  sub: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10, paddingTop: 10, borderTopWidth: 1, borderColor: c.border },
  subText: { ...rectText, flexShrink: 1, color: c.muted, fontFamily: f.semibold, fontSize: 13, lineHeight: 19.5 },
  stepper: { flexDirection: "row", alignItems: "center", gap: 4, borderWidth: 1, borderColor: c.border, borderRadius: 12, backgroundColor: c.secondary, padding: 3 },
  stepButton: { width: 36, height: 36, borderRadius: 9, backgroundColor: c.cardRaised, alignItems: "center", justifyContent: "center" },
  stepValue: { minWidth: 58, alignItems: "center" },
  stepNumber: { ...rectText, fontFamily: f.extrabold, fontSize: 15, lineHeight: 22.5, color: c.foreground, fontVariant: ["tabular-nums"] },
  unit: { fontSize: 11, color: c.muted },
  summary: { flexDirection: "row", gap: 10, alignItems: "flex-start", paddingVertical: 10, paddingHorizontal: 12, borderRadius: 12, backgroundColor: withAlpha(c.primary, .14) },
  summaryText: { ...rectText, flex: 1, fontFamily: f.semibold, color: c.foreground, fontSize: 12, lineHeight: 17.4 },
  input: { ...rectText, minWidth: 0, height: 44, borderRadius: 12, borderWidth: 1, borderColor: c.border, backgroundColor: c.secondary, color: c.foreground, paddingHorizontal: 12, paddingVertical: 0, fontSize: 15, fontFamily: bold },
  action: { width: "100%", minHeight: 56, flexDirection: "row", gap: 10, borderRadius: 16, borderColor: c.border, paddingHorizontal: 12, alignItems: "center", justifyContent: "center" },
  actionText: { ...rectText, fontSize: 16, lineHeight: 24, textAlign: "center", flexShrink: 1 },
  error: { color: c.error, fontFamily: bold, fontSize: 12, lineHeight: 18 },
  pressed: { transform: [{ scale: .97 }] },
});

export { s as configStyles };
