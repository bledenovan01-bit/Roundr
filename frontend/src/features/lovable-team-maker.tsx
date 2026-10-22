import { useState, type ReactNode } from "react";
import { Keyboard, Pressable, Text, View, useWindowDimensions } from "react-native";
import { useRouter } from "expo-router";
import { Chip, ConfigCard, ConfigTeams, Jersey, Options, Stepper, Sub, TeamError, configStyles as s } from "@/src/components/lovable/configuration";
import { CompositionSheet, PhaseAction, PhaseFrame, PhaseIcon, PhaseInput, PhaseSummary, REDRAW_MIN_WIDTH } from "@/src/components/lovable/phase2b-ui";
import { LovableIcon } from "@/src/components/lovable/icon";
import { lovable as c, lovableFont as f, withAlpha } from "@/src/visual/lovable";
import { drawPlayers, editPlayer, movePlayer, validComposition } from "@/src/domain/team-maker";
import { getSavedComposition, loadPreferences, saveTeamComposition, useCompositionStatus, usePreferences } from "@/src/store/preferences";
import { tournamentTeams } from "./tournament-config-state";

export function LovableTeamMaker() {
  const router=useRouter(),prefs=usePreferences(),status=useCompositionStatus(),last=getSavedComposition();
  const {width,height}=useWindowDimensions();
  const [naturalHeight,setNaturalHeight]=useState(0),[viewportHeight,setViewportHeight]=useState(0);
  const ghostHeight=width<=height&&viewportHeight>0&&naturalHeight>viewportHeight?36:44;
  const [choice,setChoice]=useState(false),[overwrite,setOverwrite]=useState(false),[done,setDone]=useState(false);
  const [source,setSource]=useState<"names"|"count">("names"),[count,setCount]=useState(10),[teamCount,setTeamCount]=useState(2);
  const [players,setPlayers]=useState<string[]>([]),[draft,setDraft]=useState(""),[editing,setEditing]=useState<number|null>(null);
  const [result,setResult]=useState<string[][]|null>(null),[meta,setMeta]=useState(tournamentTeams(2)),[picked,setPicked]=useState<{t:number;p:number}|null>(null);
  const onBack=()=>{if(status.saving)return;if(router.canGoBack())router.back();else router.replace("/");};
  const actualPlayers=source==="names"?players:Array.from({length:count},(_,i)=>"Joueur "+(i+1));
  const tooFew=actualPlayers.length<teamCount;
  const invalidPlayers=actualPlayers.some(p=>!p.trim())||new Set(actualPlayers.map(p=>p.trim().toLowerCase())).size!==actualPlayers.length;
  const duplicate=players.some((p,i)=>i!==editing&&p.trim().toLowerCase()===draft.trim().toLowerCase());
  const draw=()=>{if(tooFew||invalidPlayers||status.saving)return;setResult(drawPlayers(actualPlayers,teamCount,Date.now()));setMeta(Array.from({length:teamCount},(_,i)=>({...meta[i]??tournamentTeams(teamCount)[i]})));setPicked(null);};
  const add=()=>{const next=editPlayer(players,draft,editing);if(!next||status.saving)return;setPlayers(next);setDraft("");setEditing(null);};
  const save=async()=>{
    if(!result||status.saving||!validComposition({teams:meta,groups:result}))return;
    Keyboard.dismiss();
    if(await saveTeamComposition({teams:meta,groups:result,savedAt:Date.now()})){setChoice(true);setOverwrite(false);setDone(true);}
  };
  const invalid=!result||!validComposition({teams:meta,groups:result});
  const pickedName=picked&&result?result[picked.t]?.[picked.p]:null;
  const cards:ReactNode[]=[];
  if(status.loading||!status.readable) {
    cards.push(<ConfigCard key="loading" title={status.loading?"Chargement de la composition":"Composition indisponible"}><Text accessibilityRole={status.loading?undefined:"alert"} style={s.importHint}>{status.loading?"Lecture des équipes enregistrées…":status.error}</Text>{!status.loading?<PhaseAction kind="secondary" label="Réessayer la lecture" onPress={()=>{void loadPreferences();}}/>:null}</ConfigCard>);
    return <PhaseFrame title="Faire les équipes" onBack={onBack}>{cards}</PhaseFrame>;
  }
  if((prefs.teams.length||prefs.players.length)&&!choice) {
    const choiceCard=(label:string,hint:string,icon:"history"|"shuffle",onPress:()=>void,disabled=false)=><Pressable key={label} accessibilityRole="button" accessibilityLabel={label} accessibilityHint={hint} accessibilityState={{disabled}} disabled={disabled} onPress={onPress}
      style={({pressed})=>[{minHeight:76,borderRadius:18,borderWidth:1,borderColor:c.border,backgroundColor:c.card,padding:14,flexDirection:"row",alignItems:"center",gap:14,opacity:disabled?.4:1},pressed&&s.pressed]}>
      <View style={{width:46,height:46,borderRadius:14,backgroundColor:withAlpha(icon==="history"?c.classic:c.custom,.16),borderWidth:1,borderColor:withAlpha(icon==="history"?c.classic:c.custom,.35),alignItems:"center",justifyContent:"center"}}>{icon==="shuffle"?<PhaseIcon name="shuffle" size={16} color={c.muted}/>:<LovableIcon name="history" size={16} color={c.classic}/>}</View>
      <View style={{flex:1,gap:3}}><Text style={[s.cardTitle,{lineHeight:150/7}]}>{label}</Text><Text style={[s.importHint,{lineHeight:120/7}]}>{hint}</Text></View><LovableIcon name="chevron" size={16} color={c.muted}/>
    </Pressable>;
    cards.push(choiceCard("Nouvelle répartition","Créer de nouvelles équipes","shuffle",()=>setChoice(true)));
    const recoverPlayers=!last&&prefs.players.length>0;
    cards.push(choiceCard(recoverPlayers?"Reprendre ma liste de joueurs":"Reprendre ma dernière composition",recoverPlayers?prefs.players.length+" joueurs enregistrés":prefs.teams.length+" équipes · "+prefs.groups.flat().length+" joueurs","history",()=>{
      if(last){setPlayers(last.groups.flat());setCount(last.groups.flat().length);setTeamCount(last.teams.length);setResult(last.groups);setMeta(last.teams);}
      else if(recoverPlayers){setPlayers([...prefs.players]);setSource("names");}
      else return;
      setSource("names");setChoice(true);
    },!last&&!recoverPlayers));
    if(!last&&prefs.teams.length)cards.push(<Text key="legacy" style={s.importHint}>Les équipes enregistrées restent importables. Leur répartition de joueurs est incomplète et ne peut pas être reprise.</Text>);
    return <PhaseFrame title="Faire les équipes" onBack={onBack}>{cards}</PhaseFrame>;
  }
  if(!result) {
    cards.push(<ConfigCard key="players" title="Joueurs" hint={actualPlayers.length+" joueur"+(actualPlayers.length>1?"s":"")}>
      <Options value={source} options={[{value:"names",label:"Par noms"},{value:"count",label:"Par nombre"}]} onChange={setSource}/>
      {source==="names"?<>
        <View style={{flexDirection:"row",gap:8,marginTop:10}}>
          <PhaseInput testID="team-builder-player-input" accessibilityLabel={editing===null?"Nom du joueur à ajouter":"Nom du joueur à modifier"} placeholder="Nom du joueur" value={draft} aria-invalid={duplicate} accessibilityHint={duplicate?"Ce joueur est déjà dans la liste.":undefined} maxLength={20} onChangeText={setDraft} onSubmitEditing={add} editable={!status.saving} style={{flex:1,borderColor:duplicate?c.error:c.border}}/>
          <Pressable accessibilityRole="button" accessibilityLabel={editing===null?"Ajouter le joueur":"Enregistrer le nom"} accessibilityState={{disabled:!draft.trim()||duplicate}} disabled={!draft.trim()||duplicate} onPress={add} style={{width:44,height:44,borderRadius:12,backgroundColor:c.primary,alignItems:"center",justifyContent:"center",opacity:!draft.trim()||duplicate?.4:1}}><PhaseIcon name="plus" color={c.onPrimary}/></Pressable>
        </View>
        {duplicate?<TeamError>Ce joueur est déjà dans la liste.</TeamError>:null}
        <View style={{marginTop:8,flexDirection:"row",flexWrap:"wrap",gap:6}}>{players.map((p,i)=><View key={p+i} style={{height:38,maxWidth:"100%",paddingLeft:12,paddingRight:4,borderRadius:99,borderWidth:1,borderColor:c.border,backgroundColor:c.secondary,flexDirection:"row",alignItems:"center",gap:4}}>
          <Pressable accessibilityRole="button" accessibilityLabel={"Modifier le nom de "+p} onPress={()=>{setEditing(i);setDraft(p);}} hitSlop={{top:3,bottom:3}}><Text style={{fontFamily:"ManropeRefined-Bold",fontSize:13,lineHeight:19.5,color:c.foreground}}>{p}</Text></Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel={"Retirer "+p} onPress={()=>{setPlayers(players.filter((_,j)=>j!==i));if(editing===i){setEditing(null);setDraft("");}else if(editing!==null&&editing>i)setEditing(editing-1);}} hitSlop={8} style={{width:28,height:28,borderRadius:99,alignItems:"center",justifyContent:"center"}}><PhaseIcon name="x" size={15} color={c.muted}/></Pressable>
        </View>)}</View>
        {editing!==null?<PhaseAction kind="ghost" label="Annuler la modification" onPress={()=>{setEditing(null);setDraft("");}}/>:null}
        {players.length?<PhaseAction kind="ghost" label="Vider la liste" onPress={()=>{setPlayers([]);setEditing(null);setDraft("");}}/>:null}
      </>:<Sub label="Nombre de joueurs"><Stepper value={count} min={2} max={60} unit="joueurs" label="le nombre de joueurs" onChange={setCount}/></Sub>}
    </ConfigCard>);
    cards.push(<ConfigCard key="count" title="Nombre d'équipes"><View style={{flexDirection:"row",gap:8}}>{[2,3,4,5,6,7,8].map(n=><View key={n} style={{flex:1}}><ChipNumber value={n} active={teamCount===n} onPress={()=>{setTeamCount(n);setMeta(tournamentTeams(n));}}/></View>)}</View></ConfigCard>);
    cards.push(<PhaseSummary key="summary">{actualPlayers.length} joueurs · {teamCount} équipes · {Math.floor(actualPlayers.length/teamCount)}{actualPlayers.length%teamCount?" à "+Math.ceil(actualPlayers.length/teamCount):""} par équipe.</PhaseSummary>);
    if(tooFew)cards.push(<TeamError key="few">Ajoutez au moins {teamCount} joueurs pour créer {teamCount} équipes.</TeamError>);
    if(invalidPlayers)cards.push(<TeamError key="invalid-players">Chaque joueur doit avoir un nom différent et non vide. Modifiez ou retirez les doublons avant le tirage.</TeamError>);
  } else {
    cards.push(<PhaseSummary key="summary">{pickedName?"Choisissez l'équipe où déplacer "+pickedName+".":"Touchez un joueur pour le déplacer dans une autre équipe."}</PhaseSummary>);
    result.forEach((group,t)=>cards.push(<View key={"group"+t} testID={"maker-team-"+t} style={[s.card,{borderColor:picked&&picked.t!==t?c.primary:c.border}]}>
      <View style={{flexDirection:"row",alignItems:"center",justifyContent:"space-between",gap:12}}><View style={{flexDirection:"row",alignItems:"center",gap:10,flexShrink:1}}><Jersey size={26} color={meta[t].color}/><Text accessibilityRole="header" style={s.cardTitle}>{meta[t].name||"Équipe "+(t+1)}</Text></View><Text style={{fontFamily:f.extrabold,fontSize:12,lineHeight:18,color:c.muted}}>{group.length}</Text></View>
      <View style={{flexDirection:"row",flexWrap:"wrap",gap:6}}>{group.map((p,i)=><Pressable key={p+i} accessibilityRole="button" accessibilityLabel={p} accessibilityState={{selected:picked?.t===t&&picked.p===i}} aria-pressed={picked?.t===t&&picked.p===i} onPress={()=>setPicked(picked?.t===t&&picked.p===i?null:{t,p:i})} hitSlop={4}
        style={{height:36,paddingHorizontal:12,borderRadius:99,borderWidth:1,borderColor:picked?.t===t&&picked.p===i?c.primary:c.border,backgroundColor:picked?.t===t&&picked.p===i?c.primary:c.secondary,justifyContent:"center"}}><Text style={{fontFamily:"ManropeRefined-Bold",fontSize:13,lineHeight:19.5,color:picked?.t===t&&picked.p===i?c.onPrimary:c.foreground}}>{p}</Text></Pressable>)}
      {!group.length?<Text style={s.importHint}>Équipe vide</Text>:null}</View>
      {picked&&picked.t!==t?<View style={{marginTop:10}}><PhaseAction kind="secondary" label={"Déplacer "+pickedName+" ici"} onPress={()=>{setResult(movePlayer(result,picked.t,picked.p,t));setPicked(null);}}/></View>:null}
    </View>));
    cards.push(<ConfigCard key="meta" title="Noms et couleurs" hint="Modifiables avant de valider"><ConfigTeams teams={meta} onChange={setMeta}/></ConfigCard>);
    if(result.some(g=>!g.length))cards.push(<TeamError key="empty">Chaque équipe doit compter au moins un joueur.</TeamError>);
    cards.push(<PhaseAction key="edit" kind="ghost" height={ghostHeight} label="Modifier les joueurs" onPress={()=>{setResult(null);setPicked(null);}}/>);
  }
  if(status.error)cards.push(<Text key="error" accessibilityRole="alert" style={s.error}>{status.error}</Text>);
  const footer=result?<View style={{flexDirection:"row",gap:10}}><View style={{flex:1,minWidth:REDRAW_MIN_WIDTH}}><PhaseAction kind="secondary" height={56} icon="shuffle" label="Nouveau tirage" onPress={draw} disabled={status.saving}/></View><View style={{flex:1.4}}><PhaseAction label={status.saving?"Enregistrement…":"Valider"} disabled={invalid||status.saving} onPress={()=>{Keyboard.dismiss();if(prefs.teams.length)setOverwrite(true);else void save();}}/></View></View>
    :<PhaseAction icon="shuffle" label="Mélanger les équipes" disabled={tooFew||invalidPlayers||status.saving} onPress={draw} testID="team-builder-draw"/>;
  return <><PhaseFrame title="Faire les équipes" subtitle={result?"Équipes créées":"Tirage au sort"} onBack={onBack} footer={footer} pair={!!result} blocked={status.saving} onViewportHeight={setViewportHeight} onContentHeight={h=>setNaturalHeight(h+(result?44-ghostHeight:0))}>{cards}</PhaseFrame>
    {overwrite?<CompositionSheet title="Remplacer la dernière composition ?" description="La composition enregistrée sera remplacée par ces équipes." onClose={()=>{if(!status.saving)setOverwrite(false);}}>
      <PhaseAction height={56} label={status.saving?"Enregistrement…":"Remplacer et valider"} onPress={()=>{void save();}} disabled={status.saving}/><PhaseAction kind="ghost" label="Annuler" disabled={status.saving} onPress={()=>setOverwrite(false)}/>
      {status.error?<Text accessibilityRole="alert" style={s.error}>{status.error}</Text>:null}
    </CompositionSheet>:null}
    {done?<CompositionSheet success title="Composition enregistrée" description={"Dans la configuration d'un mode, activez « Personnaliser les équipes » puis touchez « Importer mes équipes ». Vous pourrez encore modifier les équipes avant de jouer."} onClose={()=>setDone(false)}>
      <PhaseAction height={56} label="Retour à l'accueil" onPress={()=>{setDone(false);router.replace("/");}}/><PhaseAction kind="ghost" label="Rester ici" onPress={()=>setDone(false)}/>
    </CompositionSheet>:null}
  </>;
}
function ChipNumber({value,active,onPress}:{value:number;active:boolean;onPress:()=>void}){return <Chip label={String(value)} active={active} onPress={onPress}/>;}
