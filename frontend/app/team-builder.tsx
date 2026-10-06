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
   {p.players.map(player=><DesignRow key={player} title={player} detail="Joueur"><PrimaryButton label="Retirer le joueur" variant="secondary" onPress={()=>setPreferences({players:p.players.filter(x=>x!==player),groups:[]})}/></DesignRow>)}
   {adding?<View style={{gap:8}}><TextInput value={draft} onChangeText={setDraft} placeholder="Nom du joueur" placeholderTextColor={colors.muted} style={input} accessibilityLabel="Nom du joueur" maxLength={40}/><PrimaryButton label="Ajouter" disabled={!draft.trim()||p.players.includes(draft.trim())} onPress={()=>{setPreferences({players:[...p.players,draft.trim()],groups:[]});setDraft("");setAdding(false);}}/></View>:null}
   <PrimaryButton label="+ Ajouter un joueur" variant="secondary" onPress={()=>setAdding(true)}/>
   <DesignRow title="Nombre d’équipes" detail={`${count} équipes`}><Stepper label="Nombre d’équipes" value={count} min={2} max={Math.max(2,Math.min(8,p.players.length))} onChange={setCount}/></DesignRow>
   <PrimaryButton label="Mélanger les équipes" disabled={p.players.length<count} onPress={draw}/>
 </DesignScreen>;
 return <DesignScreen title={view==="result"?"Équipes créées":"Modifier les équipes"} subtitle={view==="result"?"Tirage aléatoire":"Rééquilibre avant de lancer."}>
   {p.groups.map((g,i)=><View key={i}>{view==="result"?<View style={{minHeight:116,borderRadius:18,borderWidth:1,borderColor:colors.border,backgroundColor:colors.surfaceSecondary,padding:15,gap:12}}><Text style={{fontFamily:fontFamily.textBold,fontSize:18,color:colors.onSurface}}>{`Équipe ${String.fromCharCode(65+i)}`}</Text><Text style={{fontFamily:fontFamily.text,fontSize:12,color:colors.muted}}>{g.join(" · ")}</Text></View>:<DesignRow title={`Équipe ${String.fromCharCode(65+i)}`} detail={`${g.length} joueurs`} onPress={selected?()=>move(i):undefined}>{g.map(player=><Pressable key={player} onPress={()=>setSelected(player)} accessibilityRole="button" accessibilityLabel={`Déplacer ${player}`}><Text style={{paddingVertical:10,color:colors.onSurface}}>{player}</Text></Pressable>)}</DesignRow>}</View>)}
   {selected?<Text style={{color:colors.brandPrimary}}>Sélectionné : {selected}. Choisis l’équipe de destination.</Text>:null}
   {view==="result"?<><PrimaryButton label="Relancer le tirage" onPress={draw}/><PrimaryButton label="Modifier manuellement" variant="secondary" onPress={()=>setView("manual")}/><PrimaryButton label="Lancer une session" disabled={p.groups.some(g=>!g.length)} onPress={apply}/></>:<PrimaryButton label="Valider les équipes" onPress={()=>{setSelected(null);setView("result");}}/>}
 </DesignScreen>;
}
