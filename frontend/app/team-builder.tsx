import { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { DesignInputStyles, DesignRow, DesignScreen } from "@/src/components/design-screen";
import { PrimaryButton } from "@/src/components/primary-button";
import { Stepper } from "@/src/components/fields";
import { TEAM_PALETTE, uid } from "@/src/domain/defaults";
import { shuffleWithSeed } from "@/src/domain/bracket";
import { setPreferences, usePreferences } from "@/src/store/preferences";
import { fontFamily, useTheme } from "@/src/theme";
export default function TeamBuilder(){
 const p=usePreferences();const router=useRouter();const {colors}=useTheme();const input=DesignInputStyles();const [view,setView]=useState<"players"|"result"|"manual">("players");const [count,setCount]=useState(2);const [draft,setDraft]=useState("");const [adding,setAdding]=useState(false);const [selected,setSelected]=useState<string|null>(null);
 const draw=()=>{const groups=Array.from({length:count},()=>[] as string[]);shuffleWithSeed(p.players,Date.now()).forEach((player,i)=>groups[i%count].push(player));setPreferences({groups});setView("result");};
 const apply=()=>{if(p.groups.some(g=>!g.length))return;setPreferences({teams:p.groups.map((_,i)=>({id:uid(),name:`Équipe ${String.fromCharCode(65+i)}`,color:TEAM_PALETTE[i%TEAM_PALETTE.length]}))});router.push((p.groups.length > 2 ? "/config/maracana?teams=1" : "/config/classique?teams=1") as never);};
 const move=(target:number)=>{if(!selected)return;setPreferences({groups:p.groups.map((g,i)=>i===target?[...g.filter(x=>x!==selected),selected]:g.filter(x=>x!==selected))});setSelected(null);};
 if(view==="players")return <DesignScreen title="Faire les équipes" subtitle="Ajoute les joueurs présents.">
   {p.players.map(player=><DesignRow key={player} testID={`team-builder-player-${player}`} title={player} detail="Joueur"><PrimaryButton testID={`team-builder-remove-${player}`} label="Retirer le joueur" variant="secondary" onPress={()=>setPreferences({players:p.players.filter(x=>x!==player),groups:[]})}/></DesignRow>)}
   {adding?<View testID="team-builder-player-form" style={{gap:8}}><TextInput testID="team-builder-player-input" value={draft} onChangeText={setDraft} placeholder="Nom du joueur" placeholderTextColor={colors.muted} style={input} accessibilityLabel="Nom du joueur" maxLength={40} keyboardType="default" autoCapitalize="words" returnKeyType="done"/><PrimaryButton testID="team-builder-add-player" label="Ajouter" disabled={!draft.trim()||p.players.includes(draft.trim())} onPress={()=>{setPreferences({players:[...p.players,draft.trim()],groups:[]});setDraft("");setAdding(false);}}/></View>:null}
   <PrimaryButton testID="team-builder-open-player-form" label="+ Ajouter un joueur" variant="secondary" onPress={()=>setAdding(true)}/>
   <DesignRow testID="team-builder-count-row" title="Nombre d’équipes" detail={`${count} équipes`}><Stepper label="Nombre d’équipes" testID="team-builder-count" value={count} min={2} max={Math.max(2,Math.min(8,p.players.length))} onChange={setCount}/></DesignRow>
   <PrimaryButton testID="team-builder-draw" label="Mélanger les équipes" disabled={p.players.length<count} onPress={draw}/>
 </DesignScreen>;
 return <DesignScreen title={view==="result"?"Équipes créées":"Modifier les équipes"} subtitle={view==="result"?"Tirage aléatoire":"Rééquilibre avant de lancer."}>
   {p.groups.map((g,i)=><View key={i}>{view==="result"?<View testID={`team-builder-result-${i}`} style={{minHeight:116,borderRadius:18,borderWidth:1,borderColor:colors.border,backgroundColor:colors.surfaceSecondary,padding:15,gap:12}}><Text testID={`team-builder-result-${i}-title`} style={{fontFamily:fontFamily.textBold,fontSize:18,color:colors.onSurface}}>{`Équipe ${String.fromCharCode(65+i)}`}</Text><Text testID={`team-builder-result-${i}-players`} style={{fontFamily:fontFamily.text,fontSize:12,color:colors.muted}}>{g.join(" · ")}</Text></View>:<DesignRow testID={`team-builder-group-${i}`} title={`Équipe ${String.fromCharCode(65+i)}`} detail={`${g.length} joueurs`} onPress={selected?()=>move(i):undefined}>{g.map(player=><Pressable testID={`team-builder-select-${player}`} key={player} onPress={()=>setSelected(player)} accessibilityRole="button" accessibilityLabel={`Déplacer ${player}`}><Text style={{paddingVertical:10,color:colors.onSurface}}>{player}</Text></Pressable>)}</DesignRow>}</View>)}
   {selected?<Text testID="team-builder-selected-player" style={{color:colors.brandPrimary}}>Sélectionné : {selected}. Choisis l’équipe de destination.</Text>:null}
   {view==="result"?<><PrimaryButton testID="team-builder-redraw" label="Relancer le tirage" onPress={draw}/><PrimaryButton testID="team-builder-manual" label="Modifier manuellement" variant="secondary" onPress={()=>setView("manual")}/><PrimaryButton testID="team-builder-launch" label="Lancer une session" disabled={p.groups.some(g=>!g.length)} onPress={apply}/></>:<PrimaryButton testID="team-builder-confirm" label="Valider les équipes" onPress={()=>{setSelected(null);setView("result");}}/>}
 </DesignScreen>;
}
