// Test-only route, present in the isolated QA mirror, absent from production exports.
import {useEffect,useState} from 'react';import {AccessibilityInfo,View,Text,Pressable} from 'react-native';import {useLocalSearchParams,useRouter} from 'expo-router';
import cases from '../phase3-cases.json';import * as S from '@/src/domain/session';import {emptyMatchDetail,recordMatchDetail} from '@/src/domain/match-detail';
import {beginMatch} from '@/src/features/match-presentation';import {lovableLaunchDefaults,lovableConfigTeams} from '@/src/features/lovable-config-state';
import {loadStore,startSession,dispatchSession,flushStorage} from '@/src/store/session-store';import {LovableMatchScreen} from '@/src/features/lovable-match';
let cross=()=>{};
// Static comparison: timestamp freezing also freezes RN's JS animation clock.
// Use the component's real reduced-motion path; production behavior is unchanged.
AccessibilityInfo.isReduceMotionEnabled=async()=>true;
export default function QA(){const {scenario}=useLocalSearchParams();const router=useRouter();const [ready,setReady]=useState(false),[crossed,setCrossed]=useState(false);const specNow=cases.find(x=>x.id===scenario) as any;
 useEffect(()=>{let cancelled=false;const spec=cases.find(x=>x.id===scenario) as any;if(!spec)return;
  void(async()=>{const t0=1700000000000;let now=t0+(spec.ms??0)-(spec.banner?1000:0);Date.now=()=>now;cross=()=>{now=t0+spec.ms;dispatchSession(s=>s,{silent:true});};await loadStore();
  const mode=spec.mode==='classic'?'classique':'maracana',count=mode==='classique'?2:spec.count??5;
  let cfg:any=lovableLaunchDefaults(mode);cfg=mode==='classique'?{...cfg,additional:!!spec.additional,score:!spec.scoreOff,sounds:false}:{...cfg,teamCount:count,launch:spec.launch??'manual',launchDelaySec:30,rotation:spec.rotation==='winner'?'winnerStays':'classic',drawRule4:spec.draw==='both'?'bothLeave':'oneLeaves',end:{byTime:!spec.goalsOnly,goalTarget:spec.goalsOnly?3:null},sounds:false};
  let s=S.restartCurrent(S.createSession(cfg,lovableConfigTeams(mode,count),t0),t0);if(mode==='classique')s={...s,live:{...s.live!,detail:emptyMatchDetail(2)}};
  const step=(fn:(s:any,n:number)=>any,n:number)=>{s=recordMatchDetail(s,fn(s,n),n);};
  if(!spec.ready){step(S.startReady,t0);for(const side of [0,1] as const)for(let i=0;i<(spec.score?.[side]??0);i++)step((x,n)=>S.goal(x,side,1,n),t0+1000+i*1000+side*1000);
   if(spec.result){step(S.advance,t0+900000);step(beginMatch,t0+902000);step((x,n)=>S.goal(x,1,1,n),t0+912000);step(S.endManual,t0+932000);now=t0+932000;}
   else{step(S.advance,now);if(spec.paused)step(S.pause,now);if(spec.finish)step(S.endManual,now);}
   step(S.advance,now);if(spec.pendingAge){now+=spec.pendingAge;step(S.advance,now);}if(spec.pendingPause)step(S.pauseNextLaunch,now);if(spec.pendingCancel)step(S.cancelNextLaunch,now);if(spec.next)step(S.launchNext,now);
  }
  startSession(s);dispatchSession(()=>s,{silent:true});await flushStorage();if(!cancelled)setReady(true);
  })();return()=>{cancelled=true;};
 },[scenario]);
 if(!scenario)return <View><Text>Phase 3A — composants Expo réels, états déterministes</Text>{cases.map(c=><Pressable key={c.id} onPress={()=>router.push({pathname:'/phase3qa',params:{scenario:c.id}})}><Text>{c.id}</Text></Pressable>)}</View>;
 return ready?<View style={{flex:1}}>{specNow?.banner&&!crossed?<Pressable accessibilityRole="button" style={{position:'absolute',zIndex:1000,top:0,left:0,backgroundColor:'white'}} onPress={()=>{cross();setCrossed(true);}}><Text>Franchir le seuil de test</Text></Pressable>:null}<LovableMatchScreen/></View>:<Text>Préparation de l’état de test…</Text>;
}
