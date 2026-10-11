import { useState } from "react";
import { Alert } from "@/src/alert";
import { Pressable, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { DesignInputStyles, DesignRow, DesignScreen, DesignSection } from "@/src/components/design-screen";
import { PrimaryButton } from "@/src/components/primary-button";
import { TEAM_PALETTE, uid } from "@/src/domain/defaults";
import type { Team } from "@/src/domain/types";
import { addMaracanaTeam } from "@/src/domain/session";
import { dispatchSession, useStore } from "@/src/store/session-store";
import { setPreferences, usePreferences } from "@/src/store/preferences";
import { useTheme } from "@/src/theme";
export default function Teams(){
 const p=usePreferences();const session=useStore(s=>s.session);const [edit,setEdit]=useState<Team|null>(null);const [fresh,setFresh]=useState(false);const router=useRouter();const input=DesignInputStyles();const {colors}=useTheme();
 const teams=session?.status==="active"?session.teams:p.teams;
 const paletteNames=["Orange","Vert clair","Bleu","Ambre","Rouge","Violet","Turquoise","Blanc","Noir","Bleu marine","Bleu foncé","Bordeaux","Bleu canard","Violet foncé","Gris","Rose","Vert foncé","Vert citron","Vert d’eau","Bleu ciel","Bleu roi","Rouge vif","Rose corail","Orange foncé","Orange clair","Jaune doré","Jaune clair","Lavande"];
 const save=()=>{if(!edit||!edit.name.trim())return;const value={...edit,name:edit.name.trim()};if(teams.some(t=>t.id!==edit.id&&t.name.trim().toLowerCase()===value.name.toLowerCase())){Alert.alert("Nom déjà utilisé","Choisis un nom différent pour cette équipe.");return;}if(session?.status==="active"){if(fresh){
  if(session.mode!=="maracana"||session.live?.stage!=="finished"||!session.preFinish||session.teams.length>=8){
    Alert.alert("Ajout à la fin du match","Ajoute l’équipe pendant la transition, avant le match suivant.");return;
  }
  dispatchSession((s,t)=>addMaracanaTeam(s,value,t));
}else dispatchSession(s=>({...s,teams:s.teams.map(x=>x.id===edit.id?value:x)}));}else setPreferences({teams:fresh?[...p.teams,value]:p.teams.map(x=>x.id===edit.id?value:x)});setEdit(null);};
 const remove=()=>{if(!edit)return;Alert.alert("Supprimer l’équipe ?",edit.name,[{text:"Annuler",style:"cancel"},{text:"Supprimer",style:"destructive",onPress:()=>{setPreferences({teams:p.teams.filter(t=>t.id!==edit.id)});setEdit(null);}}]);};
 if(edit)return <DesignScreen onBack={()=>setEdit(null)} title="Modifier l’équipe" subtitle={edit.name} footer={<><PrimaryButton label="Enregistrer" onPress={save} disabled={!edit.name.trim()}/>{!session?<PrimaryButton label="Supprimer l’équipe" variant="secondary" onPress={remove}/>:null}<PrimaryButton label="Retour aux équipes" variant="secondary" onPress={()=>setEdit(null)}/></>}>
  <View testID="team-edit-name-field" style={{backgroundColor:colors.surfaceSecondary,padding:14,borderRadius:18,gap:4}}><Text testID="team-edit-name-label" style={{color:colors.onSurface,fontSize:12}}>NOM DE L’ÉQUIPE</Text><TextInput testID="team-edit-name-input" value={edit.name} onChangeText={name=>setEdit({...edit,name})} maxLength={18} accessibilityLabel="Nom de l’équipe" style={input} keyboardType="default" autoCapitalize="words" returnKeyType="done"/></View>
   <DesignSection>COULEUR</DesignSection><View testID="team-edit-color" style={{flexDirection:"row",flexWrap:"wrap",gap:12}}>{TEAM_PALETTE.map((color,i)=><Pressable key={color} accessibilityRole="radio" accessibilityLabel={paletteNames[i]} accessibilityState={{selected:edit.color===color}} onPress={()=>setEdit({...edit,color})} style={{width:48,height:48,borderRadius:14,backgroundColor:color,borderWidth:edit.color===color?3:2,borderColor:edit.color===color?colors.brandPrimary:colors.onSurface,alignItems:"center",justifyContent:"center"}}>{edit.color===color?<Text style={{color:i===8||i===9||i===10||i===11?"#FFFFFF":"#101820",fontSize:24,fontWeight:"bold"}}>✓</Text>:null}</Pressable>)}</View>
 </DesignScreen>;
 return <DesignScreen title="Équipes" subtitle="Modifie les équipes avant ou pendant la session.">
   {teams.map(t=><DesignRow key={t.id} testID={`team-row-${t.id}`} title={t.name} detail={paletteNames[TEAM_PALETTE.indexOf(t.color)]??"Couleur personnalisée"} onPress={()=>{setFresh(false);setEdit({...t});}}/>)}
   {!teams.length?<Text style={{color:colors.muted}}>Ajoute tes équipes pour les retrouver à la prochaine session.</Text>:null}
   {(!session || session.status!=="active" || session.mode==="maracana"&&session.live?.stage==="finished"&&!!session.preFinish&&teams.length<8)?<PrimaryButton label="Ajouter une équipe" variant="secondary" onPress={()=>{setFresh(true);setEdit({id:uid(),name:"",color:TEAM_PALETTE[teams.length%TEAM_PALETTE.length]});}}/>:null}
   <PrimaryButton label="Faire les équipes" variant="secondary" onPress={()=>router.push("/team-builder")}/>
 </DesignScreen>;
}
