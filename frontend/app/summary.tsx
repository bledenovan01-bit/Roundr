import { useState } from "react";
import { useRouter } from "expo-router";
import { Alert } from "@/src/alert";
import { Text, View } from "react-native";
import MaterialCommunityIcons from "@react-native-vector-icons/material-design-icons";
import { DesignScreen } from "@/src/components/design-screen";
import { formatMMSS } from "@/src/chrono/format";
import { PrimaryButton } from "@/src/components/primary-button";
import { GAME_MODES } from "@/src/data/modes";
import * as S from "@/src/domain/session";
import { buildSummary } from "@/src/domain/summary";
import { archiveSession, getStoreState, startSession, useStore } from "@/src/store/session-store";
import { fontFamily, useTheme } from "@/src/theme";

export default function SummaryScreen(){
  const {colors}=useTheme();const router=useRouter();
  const session=useStore(s=>s.lastSummary);const active=useStore(s=>s.session);const saveError=useStore(s=>s.saveError);
  const [correcting,setCorrecting]=useState(false);
  if(!session)return <DesignScreen title="Résumé" onBack={()=>router.replace("/")}><Text style={{color:colors.muted}}>Aucun résumé disponible.</Text><PrimaryButton label="Retourner au menu principal" onPress={()=>router.replace("/")}/></DesignScreen>;
  const summary=buildSummary(session);const mode=GAME_MODES.find(m=>m.id===session.mode)!;
  const single=session.mode==="classique"||session.mode==="custom";const match=S.currentMatch(session);
  const title=single?"Match terminé":summary.interrupted?"Tournoi interrompu":session.mode==="cup"?"Champion":session.mode==="survie"?"Vainqueur":"Session terminée";
  const replay=()=>{
    const go=()=>{startSession(S.createSession(session.config,session.teams,Date.now()));router.replace("/live");};
    if(getStoreState().session?.status==="active")Alert.alert("Session en cours","Remplacer la session active ?",[{text:"Annuler",style:"cancel"},{text:"Remplacer",style:"destructive",onPress:go}]);
    else go();
  };
  const correct=(side:0|1,delta:1|-1,now:number)=>{
    if(getStoreState().session?.status==="active")return;
    const updated=S.correctLast(session,side,delta,now);
    if(updated===session)return;
    if(updated.live?.stage==="finished")archiveSession(S.endSession(updated,now));
    else {startSession({...updated,status:"active",endedAt:null});router.replace("/live");}
  };
  const [a,b]=S.liveTeams(session);
  return <DesignScreen title={title} subtitle={single?`${formatMMSS(match?.playedMs??0)} jouées`:`${mode.title} · résultats conservés`} testID="summary-screen" onBack={()=>router.replace("/")} backLabel="Fermer">
    {saveError?<Text style={{color:colors.error}}>{saveError}</Text>:null}
    <View testID="summary-result" style={{minHeight:220,backgroundColor:colors.surfaceSecondary,borderRadius:18,padding:24,gap:14,alignItems:"center",justifyContent:"center"}}>
      {!single&&summary.podium.length?<MaterialCommunityIcons name="trophy-outline" size={44} color={colors.brandPrimary}/>:null}
      {single?<Text style={{color:colors.muted,textAlign:"center"}}>{a?.name} — {b?.name}</Text>:null}
      <Text testID="summary-headline" style={{fontFamily:fontFamily.display,fontSize:single?48:32,lineHeight:single?64:44,color:colors.brandPrimary,textAlign:"center",width:"100%"}}>{single&&match?.score?`${match.score[0]} – ${match.score[1]}`:summary.headline}</Text>
      {summary.sub?<Text style={{fontFamily:fontFamily.textBold,fontSize:16,lineHeight:24,textAlign:"center",color:colors.onSurface}}>{summary.sub}</Text>:null}
    </View>
    {single&&session.live?.scoreOn&&session.preFinish&&!active?<PrimaryButton label={correcting?"Fermer la correction":"Corriger le score final"} variant="secondary" onPress={()=>setCorrecting(!correcting)}/>:null}
    {correcting&&!active?([a,b] as const).map((team,i)=><View key={i} style={{gap:8}}>
      <Text style={{color:colors.onSurface}}>{team?.name}</Text>
      <View style={{flexDirection:"row",gap:8}}><View style={{flex:1}}><PrimaryButton label="−1 but" variant="secondary" onPress={()=>correct(i as 0|1,-1,Date.now())}/></View><View style={{flex:1}}><PrimaryButton label="+1 but" variant="secondary" onPress={()=>correct(i as 0|1,1,Date.now())}/></View></View>
    </View>):null}
    <PrimaryButton testID="summary-replay" label="Rejouer avec les mêmes réglages" variant="secondary" onPress={replay}/>
    {!single?<PrimaryButton testID="summary-details" label={session.mode==="maracana"?"Voir le classement":"Voir le tableau"} variant="secondary" onPress={()=>router.push("/standings?summary=1")}/>:null}
    <PrimaryButton testID="summary-new" label={single?"Démarrer un nouveau match":session.mode==="cup"?"Démarrer une nouvelle Cup":"Démarrer une nouvelle session"} variant="secondary" onPress={()=>router.replace(`/config/${session.mode}` as never)}/>
    <PrimaryButton testID="summary-home" label="Retourner au menu principal" variant="secondary" onPress={()=>router.replace("/")}/>
  </DesignScreen>;
}
