import { useState } from "react";
import { Alert } from "@/src/alert";
import { Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { DesignInputStyles, DesignRow, DesignScreen, DesignSection } from "@/src/components/design-screen";
import { PrimaryButton } from "@/src/components/primary-button";
import { Segmented } from "@/src/components/fields";
import { TEAM_PALETTE, uid } from "@/src/domain/defaults";
import type { Team } from "@/src/domain/types";
import { addMaracanaTeam } from "@/src/domain/session";
import { dispatchSession, useStore } from "@/src/store/session-store";
import { setPreferences, usePreferences } from "@/src/store/preferences";
import { useTheme } from "@/src/theme";
export default function Teams(){
 const p=usePreferences();const session=useStore(s=>s.session);const [edit,setEdit]=useState<Team|null>(null);const [fresh,setFresh]=useState(false);const router=useRouter();const input=DesignInputStyles();const {colors}=useTheme();
 const teams=session?.status==="active"?session.teams:p.teams;
 const palette=[{value:TEAM_PALETTE[0],label:"Orange"},{value:TEAM_PALETTE[1],label:"Vert"},{value:TEAM_PALETTE[4],label:"Rouge"},{value:"#7a8d90",label:"Gris"},{value:TEAM_PALETTE[2],label:"Bleu"}];
 const save=()=>{if(!edit||!edit.name.trim())return;const value={...edit,name:edit.name.trim()};if(session?.status==="active"){if(fresh)dispatchSession((s,t)=>addMaracanaTeam(s,value,t));else dispatchSession(s=>({...s,teams:s.teams.map(x=>x.id===edit.id?value:x)}));}else setPreferences({teams:fresh?[...p.teams,value]:p.teams.map(x=>x.id===edit.id?value:x)});setEdit(null);};
 const remove=()=>{if(!edit)return;Alert.alert("Supprimer l’équipe ?",edit.name,[{text:"Annuler",style:"cancel"},{text:"Supprimer",style:"destructive",onPress:()=>{setPreferences({teams:p.teams.filter(t=>t.id!==edit.id)});setEdit(null);}}]);};
 if(edit)return <DesignScreen title="Modifier l’équipe" subtitle={edit.name} footer={<><PrimaryButton label="Enregistrer" onPress={save} disabled={!edit.name.trim()}/>{!session?<PrimaryButton label="Supprimer l’équipe" variant="secondary" onPress={remove}/>:null}<PrimaryButton label="Retour aux équipes" variant="secondary" onPress={()=>setEdit(null)}/></>}>
   <View style={{backgroundColor:colors.surfaceSecondary,padding:14,borderRadius:18,gap:4}}><Text style={{color:colors.onSurface,fontSize:12}}>NOM DE L’ÉQUIPE</Text><TextInput value={edit.name} onChangeText={name=>setEdit({...edit,name})} maxLength={18} accessibilityLabel="Nom de l’équipe" style={input}/></View>
   <DesignSection>COULEUR</DesignSection><Segmented value={edit.color} options={palette} onChange={color=>setEdit({...edit,color})}/>
 </DesignScreen>;
 return <DesignScreen title="Équipes" subtitle="Modifie les équipes avant ou pendant la session.">
   {teams.map(t=><DesignRow key={t.id} title={t.name} detail={palette.find(x=>x.value===t.color)?.label??"Couleur personnalisée"} onPress={()=>{setFresh(false);setEdit({...t});}}/>)}
   {!teams.length?<Text style={{color:colors.muted}}>Ajoute tes équipes pour les retrouver à la prochaine session.</Text>:null}
   {(!session || session.mode==="maracana"&&teams.length<8)?<PrimaryButton label="Ajouter une équipe" variant="secondary" onPress={()=>{setFresh(true);setEdit({id:uid(),name:"",color:TEAM_PALETTE[teams.length%TEAM_PALETTE.length]});}}/>:null}
   <PrimaryButton label="Faire les équipes" variant="secondary" onPress={()=>router.push("/team-builder")}/>
 </DesignScreen>;
}
