import { useState, type ReactNode } from "react";
import { Text, View, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { CupConfig, Team } from "@/src/domain/types";
import { nextPow2 } from "@/src/domain/bracket";
import { usePreferences } from "@/src/store/preferences";
import { lovable as c, withAlpha } from "@/src/visual/lovable";
import { Chip, ConfigCard, ConfigTeams, NumberField, Options, Stepper, Sub, Toggle, ToggleCard, configStyles as s } from "@/src/components/lovable/configuration";
import { PhaseAction, PhaseFrame, PhaseInput, PhaseSummary } from "@/src/components/lovable/phase2b-ui";
import { LovableIcon } from "@/src/components/lovable/icon";
import { cupPlan, normalizeTournament, tournamentRoundName, tournamentRounds, type TournamentConfig } from "./tournament-config-state";

export function TournamentConfiguration({config,onChange,teams,onTeams,onBack,onLaunch,errors,disabled}:{config:TournamentConfig;onChange:(c:TournamentConfig)=>void;teams:Team[];onTeams:(t:Team[])=>void;onBack:()=>void;onLaunch:()=>void;errors:string[];disabled:boolean}) {
  const {width,height}=useWindowDimensions(),inset=useSafeAreaInsets(),landscape=width>height;
  const compact=(landscape?(width-inset.left-inset.right-52)/2:width-inset.left-inset.right-40)-30<=360;
  const presets=config.mode==="cup"?[7,10,12]:[5,8,10];
  const [custom,setCustom]=useState(!presets.includes(config.matchMin));
  const [goals,setGoals]=useState(config.end.goalTarget??3);
  const [perRound,setPerRound]=useState(Object.keys(config.roundMinutes).length>0);
  const [rememberedRounds,setRememberedRounds]=useState({...config.roundMinutes});
  const [imported,setImported]=useState(false);
  const prefs=usePreferences();
  const set=(patch:Partial<TournamentConfig>)=>onChange(normalizeTournament({...config,...patch} as TournamentConfig));
  const setCup=(patch:Partial<CupConfig>)=>onChange(normalizeTournament({...config,...patch} as CupConfig));
  const plan=config.mode==="cup"?cupPlan(config):null;
  const rounds=tournamentRounds(config),min=config.mode==="cup"?4:2;
  const saved=prefs.teams, fits=saved.length>=min&&saved.length<=32;
  const title=config.mode==="cup"?"Cup":"Survie";
  const cards:ReactNode[]=[
    <ConfigCard key="name" title="Nom de la compétition" hint="Facultatif"><PhaseInput accessibilityLabel="Nom de la compétition" maxLength={40} value={config.name??""} placeholder={title+" du "+new Date().toLocaleDateString("fr-FR")} onChangeText={name=>set({name})}/></ConfigCard>,
    <ConfigCard key="count" title="Nombre d'équipes"><Sub label="Équipes"><Stepper value={config.teamCount} min={min} max={32} unit="équipes" label="le nombre d'équipes" onChange={teamCount=>set({teamCount})}/></Sub></ConfigCard>
  ];
  if(config.mode==="survie") {
    const size=nextPow2(config.teamCount),byes=size-config.teamCount;
    cards.push(<PhaseSummary key="structure">Tableau de {size} · {rounds.length} tour{rounds.length>1?"s":""}{byes?" · "+byes+" équipe"+(byes>1?"s":"")+" exemptée"+(byes>1?"s":"")+" du premier tour":""}.</PhaseSummary>);
  }
  cards.push(<ConfigCard key="duration" title={config.mode==="cup"?"Durée des matchs de poule":"Durée des matchs"}>
    <View style={{gap:8}}><View style={{flexDirection:"row",gap:8}}>{presets.map(n=><View key={n} style={{flex:1}}><Chip label={n+" min"} active={!custom&&config.matchMin===n} onPress={()=>{setCustom(false);set({matchMin:n});}}/></View>)}{!compact?<View style={{flex:1.6}}><Chip label="Personnalisée" active={custom} onPress={()=>setCustom(true)}/></View>:null}</View>{compact?<Chip label="Personnalisée" active={custom} onPress={()=>setCustom(true)}/>:null}</View>
    {custom?<Sub label="Durée personnalisée"><Stepper value={config.matchMin} min={1} max={120} unit="min" label="la durée" onChange={matchMin=>set({matchMin})}/></Sub>:null}
  </ConfigCard>);
  cards.push(<ConfigCard key="end" title="Fin du match" hint="Combinables : le premier critère atteint termine le match.">
    <View style={{flexDirection:"row",gap:8}}><View style={{flex:1}}><Chip check label="Au temps" active={config.end.byTime} disabled={config.end.byTime&&config.end.goalTarget===null} onPress={()=>set({end:{...config.end,byTime:!config.end.byTime}})}/></View>
    <View style={{flex:1}}><Chip check label="Premier à X buts" active={config.end.goalTarget!==null} disabled={!config.end.byTime&&config.end.goalTarget!==null} onPress={()=>{if(config.end.goalTarget!==null)setGoals(config.end.goalTarget);set({end:{...config.end,goalTarget:config.end.goalTarget===null?goals:null}});}}/></View></View>
    {config.end.goalTarget!==null?<Sub label="Objectif de buts"><Stepper value={config.end.goalTarget} min={1} max={20} unit="buts" label="l'objectif" onChange={goalTarget=>{setGoals(goalTarget);set({end:{...config.end,goalTarget}});}}/></Sub>:null}
  </ConfigCard>);
  cards.push(<ConfigCard key="launch" title="Lancement du prochain match">
    <Options flexible value={config.launch??"manual"} options={[{value:"manual",label:"Manuel"},{value:"auto",label:"Automatique"},{value:"delay",label:"Après un délai"}]} onChange={launch=>set({launch})}/>
    {config.launch==="delay"?<View style={[s.sub,{flexDirection:"column",alignItems:"stretch",gap:12}]}>
      <Options flexible value={String(config.launchDelaySec??60)} options={[{value:"30",label:"30 secondes"},{value:"60",label:"1 minute"},{value:"120",label:"2 minutes"}]} onChange={v=>set({launchDelaySec:Number(v)})}/>
      <View><Text style={[s.subText,{fontSize:12,lineHeight:18}]}>Durée personnalisée (secondes)</Text><NumberField label="Délai personnalisé en secondes" value={config.launchDelaySec??60} onChange={launchDelaySec=>set({launchDelaySec})}/></View>
    </View>:null}
  </ConfigCard>);
  if(config.mode==="cup"&&plan) {
    cards.push(<ConfigCard key="groups" title="Poules">
      <Sub label="Nombre de poules"><Stepper value={plan.groups} min={1} max={Math.floor(config.teamCount/2)} unit="" label="le nombre de poules" onChange={groups=>setCup({groups})}/></Sub>
      <Sub label="Qualifiés par poule"><Stepper value={plan.qualified} min={1} max={plan.size} unit="" label="les qualifiés" onChange={qualifiersPerGroup=>setCup({qualifiersPerGroup})}/></Sub>
      <Options value={config.draw} options={[{value:"random",label:"Répartition auto"},{value:"manual",label:"Selon l'ordre"}]} onChange={draw=>setCup({draw})}/>
      <Options value={config.doubleRound?"double":"single"} options={[{value:"single",label:"Aller simple"},{value:"double",label:"Aller-retour"}]} onChange={v=>setCup({doubleRound:v==="double"})}/>
      {plan.needBest?<Sub label={"Repêcher "+(plan.bracket-plan.direct)+" meilleur"+(plan.bracket-plan.direct>1?"s":"")+" suivant"+(plan.bracket-plan.direct>1?"s":"")+" pour un tableau de "+plan.bracket}><Toggle label="Meilleurs suivants" on={!!config.bestNext} set={bestNext=>setCup({bestNext})}/></Sub>:null}
    </ConfigCard>);
    cards.push(<PhaseSummary key="structure">{plan.groups} poule{plan.groups>1?"s":""} de {plan.size}{config.teamCount%plan.groups?"-"+(plan.size+1):""} équipes · {plan.groupMatches} matchs de poule · {plan.direct+plan.bestCount} qualifiés{plan.needBest&&!config.bestNext?" (tableau réduit à "+plan.bracket/2+")":""}.</PhaseSummary>);
  } else {
    cards.push(<ConfigCard key="draw" title="Tirage"><Options value={config.draw} options={[{value:"random",label:"Aléatoire"},{value:"manual",label:"Manuel"}]} onChange={draw=>set({draw})}/></ConfigCard>);
  }
  cards.push(<ToggleCard key="rounds" title="Durées spécifiques par tour" hint={config.mode==="cup"?"Phases finales":undefined} on={perRound} set={on=>{setPerRound(on);set({roundMinutes:on?{...rememberedRounds}: {}});}}>
    {rounds.map(n=><Sub key={n} label={tournamentRoundName(n)}><Stepper value={rememberedRounds[n]??config.matchMin} min={1} max={60} unit="min" label={tournamentRoundName(n)} onChange={v=>{const next={...rememberedRounds,[n]:v};setRememberedRounds(next);set({roundMinutes:next});}}/></Sub>)}
  </ToggleCard>);
  if(config.mode==="cup") cards.push(<ToggleCard key="additional" title="Temps additionnel en poules" on={config.groupAdditional} set={groupAdditional=>setCup({groupAdditional})}/>);
  if((config.mode==="cup"&&rounds.includes(4))||(config.mode==="survie"&&config.teamCount>=4))
    cards.push(<ToggleCard key="third" title={config.mode==="cup"?"Petite finale":"Match pour la 3e place"} hint={config.mode==="cup"?"Match pour la 3e place":undefined} on={config.smallFinal} set={smallFinal=>set({smallFinal})}/>);
  cards.push(<ConfigCard key="tie" title="Gestion des égalités" hint="Pour les matchs à élimination">
    <View style={{gap:8}}>{([{value:"shootout",label:"Tirs au but directs"},{value:"extraThenShootout",label:"Prolongation puis tirs au but"},{value:"golden",label:"Golden goal"}] as const).map(o=><Chip key={o.value} alignStart label={o.label} active={config.drawRule===o.value} onPress={()=>set({drawRule:o.value})}/>)}</View>
    {config.drawRule==="extraThenShootout"?<Sub label="Durée de prolongation"><Stepper value={config.extraMin} min={1} max={15} unit="min" label="la prolongation" onChange={extraMin=>set({extraMin})}/></Sub>:null}
  </ConfigCard>);
  cards.push(<ToggleCard key="teams" title="Personnaliser les équipes" hint={config.draw==="manual"?"Noms, couleurs et ordre":"Noms et couleurs"} on={config.customTeams} set={customTeams=>set({customTeams})}>
    {saved.length?<View style={{gap:8}}><PhaseAction kind="secondary" height={44} icon="users" label={"Importer mes "+saved.length+" équipes"} disabled={!fits} onPress={()=>{onTeams(saved.map(t=>({...t})));set({teamCount:saved.length});setImported(true);}}/>
      {!fits?<Text style={s.importHint}>Ce mode accepte de {min} à 32 équipes : votre dernière composition en compte {saved.length}.</Text>:null}
      {fits&&imported?<Text style={s.importHint}>{saved.length!==config.teamCount?"Le nombre d'équipes a été ajusté à "+saved.length+".":"Composition importée : vous pouvez encore la modifier ci-dessous."}</Text>:null}
    </View>:null}
    <ConfigTeams teams={teams} onChange={onTeams} reorder={config.draw==="manual"} compact={teams.length>8}/>
  </ToggleCard>);
  if(config.mode==="survie") cards.push(<ToggleCard key="sounds" title="Sons / effets" hint="Coup de sifflet de début et de fin" on={config.sounds} set={sounds=>set({sounds})}/>);
  const otherErrors=errors.filter(e=>e!=="Chaque équipe doit avoir un nom."&&e!=="Deux équipes portent le même nom.");
  if(otherErrors.length)cards.push(<View key="errors" style={{gap:8}}>{otherErrors.map(e=><Text key={e} accessibilityRole="alert" style={s.error}>{e}</Text>)}</View>);
  const color=config.mode==="cup"?c.cup:c.survie;
  const intro=<View style={s.intro}><View style={[s.modeIcon,{backgroundColor:withAlpha(color,.16),borderColor:withAlpha(color,.35)}]}><LovableIcon name={config.mode==="cup"?"trophy":"swords"} color={color} size={22}/></View><Text style={s.introText}>{config.mode==="cup"?"Des poules pour tout le monde, puis les meilleurs se qualifient pour les phases finales.":"Élimination directe : le gagnant avance, le perdant sort. Jusqu'au dernier debout."}</Text></View>;
  return <PhaseFrame title={title} subtitle="Paramètres" onBack={onBack} intro={intro} footer={<PhaseAction testID="config-launch" label={config.mode==="cup"?"Lancer la Cup":"Lancer la Survie"} onPress={onLaunch} disabled={disabled} icon="play"/>}>{cards}</PhaseFrame>;
}
