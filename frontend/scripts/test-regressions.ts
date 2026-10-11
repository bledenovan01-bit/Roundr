const assert = require("node:assert/strict");
import { alignTeams, defaultConfig, defaultTeams } from "../src/domain/defaults";
import * as S from "../src/domain/session";
import { sessionEvents } from "../src/domain/session-events";
import { validateConfig } from "../src/domain/validate";
import { validPreset, validSession } from "../src/store/storage-validation";
import { computeStandings } from "../src/domain/standings";
import type { AnyConfig, Session } from "../src/domain/types";
const t=1_000_000, MIN=60_000;
const make=(c:AnyConfig,n:number)=>S.createSession(c,defaultTeams(c.mode,n),t);
function win(s:Session,now:number) {return S.endManual(S.goal(s,0,1,now),now);}
{
  const cup=make({...defaultConfig("cup"),teamCount:8,groups:2,draw:"manual"} as AnyConfig,8);
  const following=S.followingKnownMatch(cup);
  assert(following?.certain);
  assert.notEqual(following?.match?.id,S.nextMatchInfo(cup)?.match?.id);
  const survival=make({...defaultConfig("survie"),teamCount:4,draw:"manual"} as AnyConfig,4);
  assert.equal(S.followingKnownMatch(survival),null,"Unresolved final must not be announced");
  assert.equal(S.followingKnownMatch(make(defaultConfig("maracana"),4)),null);
  console.log("✓ Following fixtures are shown only when both teams are known");
}
{
  for (const mode of ["maracana","cup","survie"] as const) {
    const c=defaultConfig(mode);const n="teamCount" in c?c.teamCount:2;
    let s=make(c,n);
    s=win(s,t+1_000);
    const ready=S.launchNext(s,t+2_000);
    assert.equal(ready.live?.stage,"ready",mode);
    assert.equal(ready.live?.chrono.runningSince,null);
    assert.equal(S.advance(ready,t+600_000),ready);
    const started=S.startReady(ready,t+600_000);
    assert.equal(started.live?.stage,"period");
    assert.equal(started.live?.chrono.runningSince,t+600_000);
    assert.equal(S.startReady(started,t+600_001),started);
    assert(sessionEvents(ready,started).some(e=>e.kind==="start"));
    assert(validSession(ready));
  }
  console.log("✓ Tournament matches stay ready until one explicit start");
}
{
  const c={...defaultConfig("maracana"),matchMin:7} as AnyConfig;
  let unknown=make(c,3);
  unknown=S.advance(unknown,t+4*MIN);
  assert(!unknown.live?.firedAlerts.includes("prep"));
  assert(!sessionEvents(make(c,3),unknown).some(e=>e.kind==="warmup"));
  let known=make(c,4);
  known=S.pause(known,t+2*MIN);
  assert.equal(S.advance(known,t+20*MIN),known);
  known=S.resume(known,t+20*MIN);
  const warm=S.advance(known,t+22*MIN);
  assert(warm.live?.firedAlerts.includes("prep"));
  assert(sessionEvents(known,warm).some(e=>e.kind==="warmup"));
  assert.equal(sessionEvents(warm,warm).length,0);
  console.log("✓ Short-match preparation waits for known teams and a running clock");
}
{
  const c={...defaultConfig("cup"),teamCount:8,groups:2,qualifiersPerGroup:2,draw:"manual"} as AnyConfig;
  let s=make(c,8);
  while(!s.cup?.tieChoice) {
    s=S.endManual(s,t+1000);if(!s.cup?.tieChoice)s=S.launchNext(s,t+2000,true);
  }
  const first=s.cup!.tieChoice!;const pick=first.candidates.slice(0,first.slots);
  s=S.resolveTieChoice(s,pick,t+3000);
  const second=s.cup!.tieChoice!;
  assert(second&&second.context!==first.context);
  s=S.resolveTieChoice(s,second.candidates.slice(0,second.slots),t+4000);
  assert.equal(s.cup!.phase,"knockout");assert.equal(s.cup!.tieChoice,null);
  assert(pick.every(id=>s.cup!.qualifiedIds.includes(id)));
  assert.equal(new Set(s.cup!.qualifiedIds).size,4);
  console.log("✓ Cup: two tied groups preserve both selections");
}
{
  const teams=defaultTeams("survie",4);const reordered=[{...teams[3],name:"Verts"},...teams.slice(0,3)];
  const reduced=alignTeams(reordered,"survie",3).map((x,i)=>i===1?{...x,name:"Bleus"}:x);
  const grown=alignTeams(reduced,"survie",4);
  assert.equal(new Set(grown.map(x=>x.id)).size,4);assert.equal(grown[0].id,"t4");
  assert(validateConfig({...defaultConfig("survie"),teamCount:4} as AnyConfig,grown).length===0);
  assert(validateConfig({...defaultConfig("survie"),teamCount:4} as AnyConfig,[grown[0],grown[0],...grown.slice(2)]).length>0);
  console.log("✓ Team resizing after reorder keeps unique IDs");
}
{
  let s=make({...defaultConfig("survie"),teamCount:4,draw:"manual",drawRule:"shootout",end:{byTime:true,goalTarget:null}} as AnyConfig,4);
  s=win(s,t+1000);const originalTime=s.matches[0].playedMs;
  const corrected=S.correctLast(s,0,-1,t+2000);
  assert.equal(corrected.live!.stage,"shootout");assert.equal(corrected.matches[0].status,"live");
  assert.equal(corrected.matches[0].winnerId,null);
  const finished=S.submitShootout(corrected,2,3,t+3000);
  assert(finished.matches[0].winnerId);assert.equal(finished.matches[0].playedMs,originalTime);
  const next=S.launchNext(finished,t+4000,true);assert(next.live!.matchId!==finished.live!.matchId);
  console.log("✓ Corrected knockout draw requires and resolves a tiebreak");
}
{
  let s=make({...defaultConfig("survie"),teamCount:2,matchMin:1,drawRule:"golden",end:{byTime:true,goalTarget:null}} as AnyConfig,2);
  s=S.goal(s,0,1,t+1000);s=S.goal(s,1,1,t+2000);s=S.advance(s,t+MIN);
  assert.equal(s.live!.stage,"golden");s=S.goal(s,0,1,t+MIN+1000);
  const sameWinner=S.correctLast(s,1,-1,t+MIN+2000);
  assert.equal(sameWinner.live!.stage,"finished");assert.equal(sameWinner.live!.score[0],2);
  const reopened=S.correctLast(s,0,-1,t+MIN+2000);
  assert.equal(reopened.live!.stage,"golden");assert(S.isPaused(reopened.live!));
  assert.equal(S.livePlayedMs(reopened.live!,t+10*MIN),MIN+1000);
  console.log("✓ Golden-goal correction distinguishes changed and unchanged decision");
}
{
  for(const mode of ["classique","custom","maracana","cup","survie"] as const) {
    const c=defaultConfig(mode);const n="teamCount" in c?c.teamCount:2;
    const s=make(c,n);assert(validSession(s),mode);
    assert(validPreset({id:"p",name:mode,config:c,teams:s.teams,createdAt:t}),mode);
    assert(!validSession({...s,live:{...s.live,chrono:null}}));
  }
  assert(!validSession({status:"active"}));assert(!validPreset({id:"p",config:{mode:"custom"}}));
  console.log("✓ Storage validates all five modes and rejects malformed structures");
}
{
  const c={...defaultConfig("classique"),totalMin:2,periods:1,additional:false} as AnyConfig;
  const s=make(c,2);const minute=S.advance(s,t+MIN);
  assert(sessionEvents(s,minute).some(e=>e.kind==="minute"));
  assert.equal(sessionEvents(minute,minute).length,0);
  const end=S.advance(minute,t+2*MIN);
  assert(sessionEvents(minute,end).some(e=>e.kind==="matchEnd"));
  const c2={...defaultConfig("classique"),totalMin:2,periods:2,breakMin:1,additional:false} as AnyConfig;
  const a=make(c2,2);const b=S.advance(a,t+MIN);
  assert(sessionEvents(a,b).some(e=>e.kind==="periodEnd"));
  console.log("✓ Minute, period and end announcements are deduplicated");
}
{
  let s=make({...defaultConfig("survie"),teamCount:4,draw:"manual",drawRule:"shootout"} as AnyConfig,4);
  s=win(s,t+1000);s=S.launchNext(s,t+2000,true);s=win(s,t+3000);s=S.launchNext(s,t+4000,true);s=win(s,t+5000);
  const champion=s.matches.find(m=>m.roundOf===2)!.winnerId;
  assert.equal(computeStandings(s.teams.map(x=>x.id),s.matches).find(r=>r.teamId===champion)!.wins,2);
  console.log("✓ Final statistics resolve teams from knockout slots");
}
console.log("Regression scenarios passed");
