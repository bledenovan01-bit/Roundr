// Test-only adapter. Imports the frozen components unchanged, uses their public engines.
import React,{useState} from 'react';import {createRoot} from 'react-dom/client';
import './src/styles.css';
import cases from './phase3-cases.json';
import {DuelMatch,startDuel} from './src/components/roundr/matches';
import {MaracanaMatch,startMaracana,DEFAULT_TEAMS} from './src/components/roundr/maracana';
import * as C from './src/lib/roundr/clock';
import {updateSession,getSession} from './src/lib/roundr/session';
import {finalizeResult,settleNextLaunch,nextCandidate} from './src/lib/roundr/next-match';
const spec=cases.find(x=>x.id===new URLSearchParams(location.search).get('scenario')) as any;
const t0=1700000000000;
let cross=()=>{};
if(spec){
 let now=t0+(spec.ms??0)-(spec.banner?1000:0);Date.now=()=>now;cross=()=>{now=t0+spec.ms;updateSession(s=>({...s}));};
 if(spec.mode==='classic')startDuel('classic','MATCH CLASSIQUE','Match classique',{periods:[900,900],breakSec:300,extra:spec.additional?'all':'none',countUp:false,goalTarget:null,goallessOvertimeSec:null},DEFAULT_TEAMS.slice(0,2) as any,!spec.scoreOff);
 else startMaracana({minutes:8,custom:false,byTime:!spec.goalsOnly,byGoals:!!spec.goalsOnly,goals:3,teamCount:spec.count??5,customize:true,teams:DEFAULT_TEAMS.slice(0,spec.count??5),sounds:false,nextLaunch:{mode:spec.launch??'manual',seconds:30},rotation:spec.rotation??'classic',drawRule:spec.draw??'one'},DEFAULT_TEAMS.slice(0,spec.count??5));
 let s=getSession()!;
 if(!spec.ready){
  let clock=C.start(s.clock,t0);
  for(const side of [0,1] as const)for(let i=0;i<(spec.score?.[side]??0);i++)clock=C.goal(clock,s.cfg,side,1,t0+1000+i*1000+side*1000);
  if(spec.result){clock=C.settle(clock,s.cfg,t0+900000);clock=C.start(clock,t0+902000);clock=C.goal(clock,s.cfg,1,1,t0+912000);clock=C.finish(clock,t0+932000);now=t0+932000;}
  else{clock=C.settle(clock,s.cfg,now);if(spec.paused)clock=C.pause(clock,now);if(spec.finish)clock=C.finish(clock,now);}
  s={...s,clock};s=settleNextLaunch(finalizeResult(s),now);
  if(spec.pendingAge){now+=spec.pendingAge;s=settleNextLaunch(s,now);}
  if(spec.pendingPause&&s.pendingLaunch)s={...s,pendingLaunch:{...s.pendingLaunch,clock:C.pause(s.pendingLaunch.clock,now)}};
  if(spec.pendingCancel&&s.pendingLaunch)s={...s,pendingLaunch:{...s.pendingLaunch,cancelled:true}};
  if(spec.next)s=nextCandidate(s)?.session??s;
  updateSession(()=>s);
 }
}
function App(){const [crossed,setCrossed]=useState(false);return spec?<div className="device" data-fixture={spec.id}><style>{`.score-pop,.sheet,.result .score,.announce{animation:none!important}.carousel-track{transition:none!important}`}</style>{spec.banner&&!crossed?<button style={{position:'absolute',zIndex:1000,top:0,left:0}} onClick={()=>{cross();setCrossed(true);}}>Franchir le seuil de test</button>:null}{spec.mode==='classic'?<DuelMatch onExit={()=>{}} onSettings={()=>{}}/>:<MaracanaMatch onExit={()=>{}} onSettings={()=>{}}/>}</div>:<main><h1>Phase 3A — états déterministes, composants Lovable réels</h1>{cases.map(c=><p key={c.id}><a href={'/?scenario='+c.id}>{c.id}</a></p>)}</main>;}
createRoot(document.getElementById('root')!).render(<App/>);
