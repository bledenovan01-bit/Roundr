import { Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { DesignScreen, DesignRow, DesignSection } from "@/src/components/design-screen";
import { computeStandings } from "@/src/domain/standings";
import { slotLabel, roundName } from "@/src/domain/bracket";
import { useStore } from "@/src/store/session-store";
import { fontFamily, useTheme } from "@/src/theme";
import type { Match, Session } from "@/src/domain/types";
export default function Standings(){
 const active=useStore(s=>s.session);const last=useStore(s=>s.lastSummary);const params=useLocalSearchParams<{summary?:string}>();const session=params.summary?last:active??last;const {colors}=useTheme();
 if(!session)return <DesignScreen title="Classement" subtitle="Aucune session"><Text style={{color:colors.muted}}>Lance une session pour afficher les résultats.</Text></DesignScreen>;
 const ko=session.matches.filter(m=>m.stage==="ko"||m.stage==="small");const rounds=[...new Set(ko.map(m=>m.roundOf??2))].sort((a,b)=>b-a);
 const title=session.mode==="maracana"?"Classement":session.mode==="cup"&&session.cup?.phase==="groups"?"Poules":"Tableau";
 const subtitle=session.mode==="maracana"?`Après ${session.matches.filter(m=>m.status==="finished").length} matchs`:"Classement en direct";
 const ranking=(name:string,ids:string[],matches:Match[])=>{const rows=computeStandings(ids,matches);return <View key={name} style={{gap:14}}>{session.mode==="cup"?<DesignSection>{name}</DesignSection>:null}{rows.map(r=><View key={r.teamId} testID={`standing-${name}-${r.teamId}`} style={{minHeight:58,paddingHorizontal:14,borderRadius:18,borderWidth:1,borderColor:colors.border,backgroundColor:colors.surfaceSecondary,flexDirection:"row",alignItems:"center",gap:12}}><Text style={{color:colors.onSurface}}>{r.rank}{r.tied?"=":""}</Text><Text testID={`standing-${name}-${r.teamId}-name`} style={{flex:1,textAlign:"center",fontFamily:fontFamily.textBold,fontSize:18,color:colors.onSurface}}>{session.teams.find(t=>t.id===r.teamId)?.name}</Text><Text style={{color:colors.onSurface,fontSize:12}}>{r.points} pts{session.mode==="cup"?` · ${r.gd>0?"+":""}${r.gd}`:""}</Text></View>)}</View>;};
 return <DesignScreen title={title} subtitle={subtitle} testID="standings-screen">
  {session.mode==="maracana"?ranking("Classement",session.teams.map(t=>t.id),session.matches):null}
  {session.mode==="cup"?session.cup?.groups.map(g=>ranking(g.name,g.teamIds,session.matches.filter(m=>m.groupId===g.id))):null}
  {rounds.map(r=><View key={r} style={{gap:14}}><DesignSection>{roundName(r)}</DesignSection>{ko.filter(m=>m.roundOf===r).map(m=><MatchRow key={m.id} match={m} session={session}/>)}</View>)}
  <DesignRow title="Résultats et statistiques" detail="Tous les matchs">{session.matches.filter(m=>m.status==="finished").map(m=><MatchRow key={m.id} match={m} session={session}/>)}{session.teams.map(t=>{const r=computeStandings(session.teams.map(x=>x.id),session.matches).find(x=>x.teamId===t.id)!;return <Text key={t.id} style={{color:colors.muted}}>{t.name} : {r.played} joués · {r.wins} victoires · {r.gf} buts</Text>;})}</DesignRow>
 </DesignScreen>;
}
function MatchRow({match:m,session}:{match:Match;session:Session}){
 const {colors}=useTheme();const a=slotLabel(m.a,session.matches,session.teams);const b=slotLabel(m.b,session.matches,session.teams);
 const detail=m.status==="bye"?"Exempt":m.score?`${m.score[0]} – ${m.score[1]}${m.shootout?` · TAB ${m.shootout[0]} – ${m.shootout[1]}`:""}`:m.status==="live"?"En cours":"À jouer";
 return <DesignRow testID={`bracket-match-${m.id}`} title={`${a} vs ${b}`} detail={detail}><Text style={{color:colors.muted}}>{m.label} · {detail}</Text></DesignRow>;
}
