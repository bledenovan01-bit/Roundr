import { Linking, Text, View } from "react-native";
import { DesignScreen, DesignRow, DesignSection } from "@/src/components/design-screen";
import { Segmented, ToggleRow } from "@/src/components/fields";
import { VolumeSlider } from "@/src/components/volume-slider";
import { PrimaryButton } from "@/src/components/primary-button";
import { setPreferences, usePreferences, type EventSound } from "@/src/store/preferences";
import { playSound, SOUND_CATALOG } from "@/src/audio/sounds";
import { useTheme } from "@/src/theme";
const events = [
  ["startSound","Début du match"],["goalSound","But marqué"],["minuteSound","1 minute restante"],
  ["periodSound","Fin de période"],["endSound","Fin du match"],["warmupSound","Échauffement"],
] as const;
const options:{value:EventSound;label:string}[]=[{value:"off",label:"Aucun son"},...SOUND_CATALOG.map(s=>({value:s.key,label:s.title}))];
export default function Settings(){
  const p=usePreferences();const {colors}=useTheme();
  return <DesignScreen title="Paramètres" subtitle="Tes réglages s’appliquent à tous les modes et chronos enregistrés." testID="settings-screen">
    {p.error?<Text style={{color:colors.error}}>{p.error}</Text>:null}
    <DesignSection>CONFORT DE JEU</DesignSection>
    <ToggleRow label="Vibrations" value={p.vibrations} onChange={v=>{void setPreferences({vibrations:v});}}/>
    <ToggleRow label="Annonces de préparation" hint="Messages dans Roundr pour les équipes du prochain match." value={p.preparation} onChange={v=>{void setPreferences({preparation:v});}}/>
    <ToggleRow label="Temps additionnel par défaut" hint="Pour les nouveaux matchs classiques et chronos personnalisés." value={p.additional} onChange={v=>{void setPreferences({additional:v});}}/>
    <ToggleRow label="Garder l’écran allumé" hint="Pendant que le chrono tourne. Désactivé : mise en veille normale du téléphone." value={p.keepAwake} onChange={v=>{void setPreferences({keepAwake:v});}}/>
    <DesignSection>SONS DES ÉVÉNEMENTS</DesignSection>
    <ToggleRow label="Sons de Roundr" value={p.sounds} onChange={v=>{void setPreferences({sounds:v});}}/>
    <VolumeSlider value={p.volume} onChange={v=>{void setPreferences({volume:v});}}/>
    {events.map(([key,title])=><DesignRow key={key} title={title} detail={options.find(o=>o.value===p[key])?.label}>
      <View style={{gap:12}}>
        <Segmented label={title} testID={`sound-${key}`} value={p[key]} options={options} onChange={v=>{void setPreferences({[key]:v});}}/>
        <PrimaryButton label="Écouter ce son" variant="secondary" disabled={p[key]==="off"} onPress={()=>{const sound=p[key];if(sound!=="off")void playSound(sound);}}/>
      </View>
    </DesignRow>)}
    <DesignSection>ASSISTANCE</DesignSection>
    <DesignRow title="Signaler un problème" onPress={()=>void Linking.openURL("https://github.com/bledenovan01-bit/Roundr/issues/new?title=Probl%C3%A8me%20Roundr")}/>
    <DesignRow title="Envoyer un retour" onPress={()=>void Linking.openURL("https://github.com/bledenovan01-bit/Roundr/issues/new?title=Retour%20Roundr")}/>
    <DesignRow title="À propos de Roundr" detail="Version 1.0.0"><Text style={{color:colors.onSurface}}>Moins d’organisation, plus de jeu.</Text></DesignRow>
  </DesignScreen>;
}
