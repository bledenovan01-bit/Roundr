import { Linking, Text } from "react-native";
import { DesignScreen, DesignRow, DesignSection } from "@/src/components/design-screen";
import { ChoiceRow, Segmented, ToggleRow } from "@/src/components/fields";
import { getStoreState, dispatchSession } from "@/src/store/session-store";
import { setPreferences, usePreferences } from "@/src/store/preferences";
import { playSound } from "@/src/audio/sounds";
import { useTheme } from "@/src/theme";
export default function Settings(){
 const p=usePreferences();const {colors}=useTheme();
 const toggle=(key:"sounds"|"vibrations"|"preparation"|"additional"|"keepAwake",title:string)=>{
   const session=getStoreState().session;const value=key==="sounds"&&session?session.config.sounds:p[key];
   return <DesignRow title={title} detail={value?"Activé":"Désactivé"}><ToggleRow label={title} value={value} onChange={v=>{setPreferences({[key]:v});if(key==="sounds")dispatchSession(s=>({...s,config:{...s.config,sounds:v}}));if(key==="additional")dispatchSession(s=>{ const supported=s.mode==="classique"||s.mode==="custom"||(s.mode==="cup"&&s.cup?.phase==="groups"); return supported ? {...s,config:{...s.config,...(s.mode==="cup"?{groupAdditional:v}:{additional:v})},live:s.live?{...s.live,additional:v&&s.live.end.byTime}:null} : s; });}}/></DesignRow>;
 };
 return <DesignScreen title="Paramètres" subtitle="Personnalise Roundr." testID="settings-screen">
  {p.error?<Text style={{color:colors.error}}>{p.error}</Text>:null}
  <DesignSection>SESSION</DesignSection>{toggle("sounds","Sons")}{toggle("vibrations","Vibrations")}{toggle("preparation","Alertes préparation")}{toggle("additional","Temps additionnel")}{toggle("keepAwake","Écran toujours actif")}
  <DesignSection>AUDIO</DesignSection>
  <DesignRow title="Sifflet de début" detail={p.startSound==="whistle"?"Standard":"Court"}><Segmented value={p.startSound} options={[{value:"whistle",label:"Standard"},{value:"alert",label:"Court"}]} onChange={v=>{setPreferences({startSound:v});void playSound(v);}}/></DesignRow>
  <DesignRow title="Sifflet de fin" detail={p.endSound==="final"?"3 coups":"Standard"}><Segmented value={p.endSound} options={[{value:"final",label:"3 coups"},{value:"whistle",label:"Standard"}]} onChange={v=>{setPreferences({endSound:v});void playSound(v);}}/></DesignRow>
  <DesignRow title="Son de but" detail={p.goalSound==="alert"?"Standard":"Sifflet"}><Segmented value={p.goalSound} options={[{value:"alert",label:"Standard"},{value:"whistle",label:"Sifflet"}]} onChange={v=>{setPreferences({goalSound:v});void playSound(v);}}/></DesignRow>
  <DesignRow title="Volume" detail={`${Math.round(p.volume*100)} %`}><ChoiceRow label="Volume" value={Math.round(p.volume*100)} options={[0,20,40,60,80,100].map(value=>({value,label:`${value} %`}))} onChange={v=>setPreferences({volume:v/100})}/></DesignRow>
  <DesignSection>ASSISTANCE</DesignSection>
  <DesignRow title="Signaler un problème" onPress={()=>void Linking.openURL("https://github.com/bledenovan01-bit/Roundr/issues/new?title=Probl%C3%A8me%20Roundr")}/>
  <DesignRow title="Envoyer un retour" onPress={()=>void Linking.openURL("https://github.com/bledenovan01-bit/Roundr/issues/new?title=Retour%20Roundr")}/>
  <DesignRow title="À propos de Roundr" detail="Version 1.0.0"><Text style={{color:colors.onSurface}}>Roundr — organisation des matchs et chronomètres.</Text></DesignRow>
 </DesignScreen>;
}
