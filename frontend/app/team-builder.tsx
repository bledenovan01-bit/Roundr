import { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import MaterialCommunityIcons from "@react-native-vector-icons/material-design-icons";
import { DesignInputStyles, DesignScreen } from "@/src/components/design-screen";
import { PrimaryButton } from "@/src/components/primary-button";
import { Segmented, Stepper } from "@/src/components/fields";
import { TEAM_PALETTE, uid } from "@/src/domain/defaults";
import { shuffleWithSeed } from "@/src/domain/bracket";
import { getPreferences, setPreferences, usePreferences } from "@/src/store/preferences";
import { fontFamily, useTheme } from "@/src/theme";
export default function TeamBuilder(){
  const p=usePreferences();const router=useRouter();const {colors}=useTheme();const input=DesignInputStyles();
  const [view,setView]=useState<"players"|"result"|"manual">("players");
  const [method,setMethod]=useState<"names"|"numbers">("names");
  const [count,setCount]=useState(2);const [playersCount,setPlayersCount]=useState(10);
  const [draft,setDraft]=useState("");const [editing,setEditing]=useState<string|null>(null);const [adding,setAdding]=useState(false);
  const [selected,setSelected]=useState<string|null>(null);
  const total=method==="names"?p.players.length:playersCount;
  const canDraw=total>=count;
  const draw=()=>{
    if(!canDraw)return;
    const players=method==="names"?p.players:Array.from({length:playersCount},(_,i)=>`Joueur ${i+1}`);
    const groups=Array.from({length:count},()=>[] as string[]);
    shuffleWithSeed(players,Date.now()).forEach((player,i)=>groups[i%count].push(player));
    void setPreferences({groups});setSelected(null);setView("result");
  };
  const apply=async()=>{
    if(p.groups.some(g=>!g.length))return;
    await setPreferences({teams:p.groups.map((_,i)=>({id:uid(),name:`Équipe ${String.fromCharCode(65+i)}`,color:TEAM_PALETTE[i%TEAM_PALETTE.length]}))});
    if(!getPreferences().error)router.replace("/");
  };
  const savePlayer=()=>{
    const name=draft.trim();if(!name||p.players.some(x=>x===name&&x!==editing))return;
    void setPreferences({players:editing?p.players.map(x=>x===editing?name:x):[...p.players,name],groups:[]});
    setDraft("");setEditing(null);setAdding(false);
  };
  const move=(target:number)=>{
    if(!selected)return;
    void setPreferences({groups:p.groups.map((g,i)=>i===target?[...g.filter(x=>x!==selected),selected]:g.filter(x=>x!==selected))});
    setSelected(null);
  };
  const title=view==="players"?"Faire les équipes":view==="result"?"Équipes créées":"Modifier les équipes";
  const footer=view==="players"?<PrimaryButton testID="team-builder-draw" label="Mélanger les équipes" disabled={!canDraw||adding||editing!==null} onPress={draw}/>:
    view==="result"?<><PrimaryButton testID="team-builder-redraw" label="Mélanger les équipes" onPress={draw} disabled={!canDraw}/>
      <PrimaryButton testID="team-builder-manual" label="Modifier manuellement" variant="secondary" onPress={()=>setView("manual")}/>
      <PrimaryButton testID="team-builder-home" label="Retour à l’accueil" variant="secondary" disabled={p.groups.some(g=>!g.length)} onPress={apply}/></>:
      <PrimaryButton testID="team-builder-confirm" label="Valider les équipes" onPress={()=>{setSelected(null);setView("result");}}/>;
  return <DesignScreen title={title} subtitle={view==="players"?"Par noms ou par nombre de joueurs.":"Équipes équilibrées en nombre de joueurs."} stickyFooter footer={footer}
    onBack={()=>view!=="players"?setView("players"):router.canGoBack()?router.back():router.replace("/")}>
    {p.error?<Text style={{color:colors.error}}>{p.error}</Text>:null}
    {view==="players"?<>
      <Stepper label="Nombre d’équipes" testID="team-builder-count" value={count} min={2} max={8} onChange={setCount}/>
      <Segmented label="Ajouter les joueurs" value={method} options={[{value:"names",label:"Par noms"},{value:"numbers",label:"Par nombre"}]} onChange={setMethod}/>
      {method==="numbers"?<Stepper label="Nombre de joueurs" value={playersCount} min={2} max={200} onChange={setPlayersCount}/>:<>
        {p.players.map(player=><View key={player} style={{minHeight:56,flexDirection:"row",alignItems:"center",gap:8}}>
          <Text style={{flex:1,color:colors.onSurface,fontFamily:fontFamily.text}}>{player}</Text>
          <Pressable testID={`team-builder-edit-${player}`} accessibilityRole="button" accessibilityLabel={`Modifier le nom de ${player}`} onPress={()=>{setEditing(player);setDraft(player);setAdding(false);}} style={{width:48,height:48,alignItems:"center",justifyContent:"center"}}>
            <MaterialCommunityIcons name="pencil-outline" size={22} color={colors.brandPrimary}/>
          </Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel={`Retirer ${player}`} onPress={()=>{void setPreferences({players:p.players.filter(x=>x!==player),groups:[]});}} style={{width:48,height:48,alignItems:"center",justifyContent:"center"}}>
            <MaterialCommunityIcons name="close" size={22} color={colors.muted}/>
          </Pressable>
        </View>)}
        {adding||editing?<View style={{gap:8}}>
          <TextInput testID="team-builder-player-input" value={draft} onChangeText={setDraft} placeholder="Nom du joueur" placeholderTextColor={colors.muted} style={input} accessibilityLabel="Nom du joueur" maxLength={40} autoCapitalize="words" returnKeyType="done" onSubmitEditing={savePlayer}/>
          <PrimaryButton label={editing?"Enregistrer le nom":"Ajouter"} disabled={!draft.trim()||p.players.some(x=>x===draft.trim()&&x!==editing)} onPress={savePlayer}/>
          <PrimaryButton label="Annuler" variant="secondary" onPress={()=>{setAdding(false);setEditing(null);setDraft("");}}/>
        </View>:<PrimaryButton label="+ Ajouter un joueur" variant="secondary" onPress={()=>{setAdding(true);setDraft("");}}/>}
      </>}
      {!canDraw?<Text style={{color:colors.muted}}>Ajoute au moins {count} joueurs pour créer {count} équipes.</Text>:null}
    </>:<>
      {p.groups.map((g,i)=><View key={i} style={{borderRadius:18,borderWidth:1,borderColor:TEAM_PALETTE[i%TEAM_PALETTE.length],backgroundColor:colors.surfaceSecondary,padding:16,gap:10}}>
        <Text style={{fontFamily:fontFamily.textBold,fontSize:18,color:colors.onSurface}}>{`Équipe ${String.fromCharCode(65+i)} · ${g.length} joueurs`}</Text>
        {g.map(player=>view==="manual"?<Pressable key={player} accessibilityRole="button" accessibilityLabel={`Déplacer ${player}`} onPress={()=>setSelected(player)} style={{minHeight:48,justifyContent:"center"}}><Text style={{color:selected===player?colors.brandPrimary:colors.onSurface}}>{player}</Text></Pressable>:
          <Text key={player} style={{fontFamily:fontFamily.text,fontSize:14,lineHeight:22,color:colors.onSurface}}>{player}</Text>)}
        {view==="manual"&&selected?<PrimaryButton label={`Déplacer ${selected} ici`} variant="secondary" onPress={()=>move(i)}/>:null}
      </View>)}
    </>}
  </DesignScreen>;
}
