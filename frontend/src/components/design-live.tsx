import { ChronoCarousel, type NoticeContent } from "./chrono-carousel";
import { ChronoTime } from "./chrono-time";
import { Image } from "expo-image";
import { Pressable, Text, View, useWindowDimensions } from "react-native";
import { fontFamily, makeStyles, useTheme } from "@/src/theme";
import type { Team } from "@/src/domain/types";
export const LIVE_ASSETS = {
  back: require("../../assets/figma/4b8f2.svg"), music: require("../../assets/figma/ceef6.svg"), settings: require("../../assets/figma/878e0.svg"),
  mark: require("../../assets/figma/d0f6c.svg"), jerseyA: require("../../assets/figma/0494e.svg"), jerseyB: require("../../assets/figma/3b038.svg"),
  dot: require("../../assets/figma/44655.svg"), stop: require("../../assets/figma/eb3d7.svg"), lock: require("../../assets/figma/9489a.svg"),
  restart: require("../../assets/figma/9e63c.svg"), pause: require("../../assets/figma/ffd1a.svg"), play: require("../../assets/figma/968c8.svg"),
  nextBg: require("../../assets/figma/8f287.svg"), arrow: require("../../assets/figma/4dfb8.svg"), chevron: require("../../assets/figma/57c8e.svg"),
  megaphone: require("../../assets/figma/5f2b8.svg"), pageDot: require("../../assets/figma/2edfd.svg"),
};
export function FigmaIcon({ source, size = 20, height = size, tint }: { source: number; size?: number; height?: number; tint?: string }) { return <Image source={source} contentFit="contain" tintColor={tint} style={{ width: size, height }} />; }
export function LiveHero({ title, subtitle, time, caption, status, progress, teamA, teamB, score, scoreOn, canScore, correcting, locked, onGoal, onCorrect, onBack, onSettings, onGiant, onToggleDisplay, canToggleDisplay, notice }: {
  notice?: NoticeContent; title: string; subtitle: string; time: string; caption: string; status: string; progress: number; teamA: Team | null; teamB: Team | null; score: [number,number]; scoreOn: boolean; canScore: boolean; correcting: boolean; locked: boolean; onGoal: (side:0|1,delta:1|-1)=>void; onCorrect:()=>void; onBack:()=>void; onSettings:()=>void; onGiant:()=>void; onToggleDisplay?:()=>void; canToggleDisplay?:boolean;
}) {
  const styles=useStyles(); const {colors}=useTheme();
  const {width,height}=useWindowDimensions();const landscape=width>height;
  return <View>
    <View style={landscape?{flexDirection:"row-reverse",alignItems:"center",gap:12}:undefined}>
    <View style={[styles.nav,landscape&&{width:180,flexShrink:0}]}><Pressable disabled={locked} onPress={onBack} accessibilityRole="button" accessibilityLabel="Retour au menu principal" style={[styles.navButton,{width:78,flexDirection:"row",gap:4}]}><FigmaIcon source={LIVE_ASSETS.back}/><Text style={styles.subtitle}>Retour</Text></Pressable><Pressable disabled={locked} onPress={onSettings} accessibilityRole="button" accessibilityLabel="Paramètres du match" style={styles.navButton}><FigmaIcon source={LIVE_ASSETS.settings}/></Pressable></View>
    <View style={[styles.heading,landscape&&{flex:1,flexDirection:"row",justifyContent:"center",marginTop:0}]}><Text testID="live-title" style={[styles.title,landscape&&{fontSize:20,lineHeight:28}]}>{title.toUpperCase()}</Text><Text testID="live-match-label" style={[styles.subtitle,landscape&&{flexShrink:1}]}>{subtitle}</Text></View>
    </View>
    <View style={landscape?{flexDirection:"row",alignItems:"center",gap:24}:undefined}>
    <View style={landscape?{flex:1,minWidth:0}:undefined}>
    {scoreOn ? <View testID="live-score-teams" style={styles.teams}>
      {([teamA,teamB] as const).map((team,i)=><View key={i} style={styles.teamColumn}>
        <View testID={`live-team-${i}`} style={styles.teamCard}><View style={[styles.accent,{backgroundColor:team?.color, [i===0?"left":"right"]:0}]}/><Text testID={`live-team-${i}-name`} style={styles.teamName}>{team?.name}</Text><FigmaIcon source={i===0?LIVE_ASSETS.jerseyA:LIVE_ASSETS.jerseyB} size={45} height={47} tint={team?.color}/></View>
        <Pressable testID={`goal-${i}`} disabled={!canScore||locked} onPress={()=>onGoal(i as 0|1,1)} accessibilityRole="button" accessibilityLabel={`Ajouter un but : ${team?.name}`} style={[styles.goal,{borderColor:team?.color,opacity:canScore?1:0.4}]}><Text style={[styles.goalLabel,{color:colors.onSurface}]}>+1</Text></Pressable>
        {correcting&&!locked ? <Pressable testID={`ungoal-${i}`} disabled={score[i]<=0} onPress={()=>onGoal(i as 0|1,-1)} accessibilityRole="button" accessibilityLabel={`Retirer un but : ${team?.name}`} style={styles.goal}><Text style={styles.subtitle}>−1</Text></Pressable>:null}
      </View>)}
      <Pressable testID="toggle-correct" disabled={locked} onPress={onCorrect} onLongPress={onCorrect} accessibilityRole="button" accessibilityLabel="Corriger le score" style={styles.score}><Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.55} style={styles.scoreText}><Text testID="score-0">{score[0]}</Text> - <Text testID="score-1">{score[1]}</Text></Text></Pressable>
    </View>:<Text style={[styles.subtitle,{textAlign:"center",marginTop:24}]}>{teamA?.name} vs {teamB?.name}</Text>}
    {canScore?<Pressable testID="score-correction-button" disabled={locked} onPress={onCorrect} accessibilityRole="button" accessibilityLabel={correcting?"Fermer la correction du score":"Corriger le score"} style={{minHeight:48,justifyContent:"center",alignItems:"center"}}><Text style={styles.subtitle}>{correcting?"Terminer la correction":"Corriger le score"}</Text></Pressable>:null}
    </View>
    <View style={landscape?{flex:1,minWidth:0}:undefined}>
    <ChronoCarousel notice={notice} locked={locked} time={time} caption={caption} status={status} progress={progress}><Pressable testID="live-giant" disabled={locked} onPress={canToggleDisplay && !locked ? onToggleDisplay : undefined} onLongPress={onGiant} accessibilityRole="button" accessibilityLabel={canToggleDisplay ? "Chrono ; touchez pour basculer temps restant/écoulé ; appui long pour agrandir" : "Chrono ; appui long pour l’agrandir"} style={styles.timer}>
      <Text style={styles.caption}>{caption.toUpperCase()}</Text><ChronoTime testID="live-chrono-time" numberOfLines={1} adjustsFontSizeToFit time={time} style={styles.time} ccStyle={styles.timeCc} />
      <View style={styles.track}><View testID="live-progress" style={[styles.fill,{width:`${Math.max(0,Math.min(1,progress))*100}%`}]}/></View>
      <View style={styles.status}><FigmaIcon source={LIVE_ASSETS.dot} size={19}/><Text testID="live-chrono-status" style={[styles.subtitle,{color:colors.onSurfaceTertiary}]}>{locked?"Verrouillé":status}</Text></View>
    </Pressable></ChronoCarousel>
    </View></View>
  </View>;
}
export function NextCards({ matchup, badge, preparation, onPress }: { matchup:string; badge:string; preparation:string; onPress:()=>void }) {
 const styles=useStyles();
 return <View style={styles.nextSection}>
   <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel="Voir les prochains matchs" testID="next-card" style={styles.nextCard}>
     <View style={styles.nextCircle}><FigmaIcon source={LIVE_ASSETS.nextBg} size={44}/><View style={styles.arrow}><FigmaIcon source={LIVE_ASSETS.arrow}/></View></View>
     <View style={styles.nextBody}><Text style={styles.eyebrow}>ENSUITE</Text><Text testID="next-matchup" style={styles.matchup}>{matchup}</Text><Text style={styles.badge}>{badge}</Text></View><FigmaIcon source={LIVE_ASSETS.chevron} size={14}/>
   </Pressable>
   <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel="Préparation du prochain match" style={styles.nextCard}><FigmaIcon source={LIVE_ASSETS.megaphone} size={26}/><View style={styles.nextBody}><Text style={styles.eyebrow}>PRÉPAREZ-VOUS</Text><Text style={styles.subtitle}>{preparation}</Text></View><FigmaIcon source={LIVE_ASSETS.chevron} size={14}/></Pressable>
   <View style={styles.dots}><FigmaIcon source={LIVE_ASSETS.pageDot} size={6}/><View style={styles.activeDot}/><FigmaIcon source={LIVE_ASSETS.pageDot} size={6}/></View>
 </View>;
}
export function LiveControls({ paused, ready, locked, onEnd, onLock, onRestart, onPause }: { paused:boolean; ready:boolean; locked:boolean; onEnd:()=>void; onLock:()=>void; onRestart:()=>void; onPause:()=>void }) {
 const styles=useStyles();
 if (ready) return <View style={[styles.controls,{justifyContent:"flex-end"}]}><Pressable testID="live-resume" disabled={locked} onPress={onPause} accessibilityRole="button" accessibilityLabel="Démarrer" accessibilityState={{disabled:locked}} style={[styles.control,styles.controlPrimary,{flex:0,minWidth:110}]}><FigmaIcon source={LIVE_ASSETS.play} size={22} tint="#010a0b"/><Text style={[styles.controlLabel,styles.controlPrimaryLabel]}>Démarrer</Text></Pressable></View>;
 return <View style={styles.controls}>{[{label:"Fin",src:LIVE_ASSETS.stop,fn:onEnd,id:"live-end",weight:64},{label:locked?"Déverrouiller":"Verrouiller",src:LIVE_ASSETS.lock,fn:onLock,id:"live-lock",weight:106},{label:"Relancer",src:LIVE_ASSETS.restart,fn:onRestart,id:"live-restart",weight:91},{label:ready?"Démarrer":paused?"Reprendre":"Pause",src:paused?LIVE_ASSETS.play:LIVE_ASSETS.pause,fn:onPause,id:paused?"live-resume":"live-pause",weight:79}].map((b,i)=><Pressable key={b.id} testID={b.id} disabled={locked&&i!==1} onPress={b.fn} accessibilityRole="button" accessibilityLabel={b.label} accessibilityState={{disabled:locked&&i!==1}} style={[styles.control,{flex:b.weight},i===3&&styles.controlPrimary]}><FigmaIcon source={b.src} size={22} tint={i===3 ? "#010a0b" : undefined}/><Text style={[styles.controlLabel,i===3&&styles.controlPrimaryLabel]}>{b.label}</Text></Pressable>)}</View>;
}
const useStyles=makeStyles(c=>({
 nav:{flexDirection:"row",justifyContent:"space-between",height:44},navButton:{width:44,height:44,alignItems:"center",justifyContent:"center"},
 heading:{alignItems:"center",marginTop:6,gap:4},title:{fontFamily:fontFamily.textBold,fontSize:29,lineHeight:40,color:c.onSurface,textAlign:"center",marginTop:0},subtitle:{fontFamily:fontFamily.text,fontSize:12,lineHeight:17,color:c.muted},
 teams:{flexDirection:"row",justifyContent:"space-between",marginTop:24,position:"relative"},teamColumn:{width:"32%",gap:7},teamCard:{minHeight:105,borderWidth:0,borderRadius:20,backgroundColor:c.surface,alignItems:"center",paddingTop:16,gap:12},teamName:{fontFamily:fontFamily.textBold,fontSize:11,lineHeight:15,color:c.onSurface,textAlign:"center",paddingHorizontal:6},accent:{position:"absolute",top:18,width:3,height:66,borderRadius:2},
 score:{position:"absolute",left:"35%",right:"35%",top:30,minHeight:65,justifyContent:"center",alignItems:"center"},scoreText:{fontFamily:fontFamily.textBold,fontSize:38,lineHeight:57,color:c.onSurface,textAlign:"center"},
 goal:{height:48,borderRadius:11,borderWidth:1,borderColor:c.border,alignItems:"center",justifyContent:"center"},goalLabel:{fontFamily:fontFamily.textBold,fontSize:13},
 timer:{marginTop:28},caption:{fontFamily:fontFamily.textBold,fontSize:10,lineHeight:20,letterSpacing:1.5,color:c.muted,textAlign:"center"},time:{fontFamily:fontFamily.textBold,fontSize:62,lineHeight:86,color:c.onSurface,textAlign:"center",fontVariant:["tabular-nums"]},timeCc:{fontFamily:fontFamily.textBold,fontSize:30,color:c.onSurfaceTertiary,fontVariant:["tabular-nums"]},track:{height:5,borderRadius:3,backgroundColor:c.border,overflow:"hidden",marginTop:-7},fill:{height:5,backgroundColor:c.brandPrimary,borderRadius:3},status:{flexDirection:"row",alignItems:"center",justifyContent:"center",gap:0,marginTop:8,minHeight:20},
 nextSection:{marginTop:20,borderTopWidth:1,borderColor:c.border,paddingTop:28,gap:10},nextCard:{minHeight:92,borderRadius:20,borderWidth:1,borderColor:c.border,backgroundColor:c.surfaceSecondary,flexDirection:"row",alignItems:"center",gap:18,padding:16},nextCircle:{width:44,height:44},arrow:{position:"absolute",top:12,left:12},nextBody:{flex:1,minWidth:0,gap:6},eyebrow:{fontFamily:fontFamily.textBold,fontSize:9,letterSpacing:1.2,color:c.muted},matchup:{fontFamily:fontFamily.textBold,fontSize:13,color:c.onSurface},badge:{fontFamily:fontFamily.text,fontSize:9,lineHeight:16,color:c.brandPrimary,backgroundColor:c.brandTertiary,alignSelf:"flex-start",paddingHorizontal:8,borderRadius:5},dots:{flexDirection:"row",gap:5,alignItems:"center",justifyContent:"center",marginTop:2},activeDot:{width:18,height:6,borderRadius:3,backgroundColor:c.brandPrimary},
 controls:{flexDirection:"row",gap:6,paddingHorizontal:16,paddingTop:12},control:{minHeight:64,minWidth:44,borderRadius:15,backgroundColor:c.surfaceTertiary,alignItems:"center",justifyContent:"center",gap:6,paddingVertical:8},controlPrimary:{backgroundColor:c.brandPrimary},controlLabel:{fontFamily:fontFamily.textBold,fontSize:11,lineHeight:16,color:c.onSurface,textAlign:"center"},controlPrimaryLabel:{color:c.surface},
}));
