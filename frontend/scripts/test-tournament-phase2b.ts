import { defaultConfig } from "../src/domain/defaults";
import { buildBracket, matchTeams } from "../src/domain/bracket";
import { buildGroups, computeConfiguredQualification, computeQualification, scheduleGroups } from "../src/domain/cup";
import { buildSummary } from "../src/domain/summary";
import { computeStandings } from "../src/domain/standings";
import * as S from "../src/domain/session";
import { validateConfig } from "../src/domain/validate";
import { validSession } from "../src/store/storage-validation";
import { snapshotCompetition } from "../src/store/competition-history";
import { cupPlan, normalizeTournament, tournamentDefaults, tournamentTeams } from "../src/features/tournament-config-state";
import type { CupConfig, SurvieConfig, Session } from "../src/domain/types";
const builtin=(process as unknown as {getBuiltinModule:(id:string)=>any}).getBuiltinModule;
const assert=builtin("assert/strict");
const req=builtin("module").createRequire(process.argv[1]) as { (id:string):unknown;cache:Record<string,unknown>;resolve:(id:string)=>string };

const cup=tournamentDefaults("cup") as CupConfig, survie=tournamentDefaults("survie") as SurvieConfig;
assert.equal(cup.matchMin,10);assert.equal(cup.groups,2);assert.equal(cup.qualifiersPerGroup,2);assert.equal(cup.smallFinal,true);assert.equal(cup.drawRule,"shootout");assert.equal(cup.extraMin,5);
assert.equal(survie.matchMin,8);assert.equal(survie.extraMin,3);assert.equal(survie.drawRule,"shootout");assert.equal(survie.smallFinal,false);
assert.equal((defaultConfig("cup") as CupConfig).matchMin,8);assert.equal((defaultConfig("survie") as SurvieConfig).drawRule,"extraThenShootout");
assert.deepEqual(tournamentTeams(4).map(t=>t.name),["Les Renards","FC Amigos","Panthères","Galactiques"]);
assert.equal(tournamentTeams(4)[3].color,"#fd393f");
for(const mode of ["cup","survie"] as const)assert.deepEqual(validateConfig(tournamentDefaults(mode),tournamentTeams(8)),[]);
console.log("✓ Cup and Survie use reference defaults, names and colors; old defaults remain unchanged");

for(let n=4;n<=32;n++)for(let g=1;g<=Math.floor(n/2);g++)for(let q=1;q<=Math.floor(n/g);q++)for(const bestNext of [false,true]){
  const c={...cup,teamCount:n,groups:g,qualifiersPerGroup:q,bestNext};
  assert.deepEqual(validateConfig(c,tournamentTeams(n)),[]);
  const p=cupPlan(c);assert.equal(p.groupMatches,scheduleGroups(buildGroups(tournamentTeams(n).map(t=>t.id),g,true),false).length);
  assert(p.finalSize===1||(p.finalSize&(p.finalSize-1))===0);
}
const normalized=normalizeTournament({...cup,teamCount:4,groups:9,qualifiersPerGroup:7}) as CupConfig;
assert.equal(normalized.groups,2);assert.equal(normalized.qualifiersPerGroup,2);
const striped=buildGroups(tournamentTeams(8).map(t=>t.id),2,true);
assert.deepEqual(striped.map(g=>g.teamIds),[["t1","t3","t5","t7"],["t2","t4","t6","t8"]]);
assert.equal(buildGroups(tournamentTeams(32).map(t=>t.id),16,true)[15].name,"Poule P");
assert.deepEqual(buildGroups(["a","b","c","d"],2).map(g=>g.teamIds),[["a","b"],["c","d"]]);
console.log("✓ All Cup count/group/qualification combinations normalize and schedule; explicit order is interleaved only for new sessions");

function finishedGroups(n:number,g:number){
 const groups=buildGroups(tournamentTeams(n).map(t=>t.id),g,true);
 const matches=scheduleGroups(groups,false).map(m=>({...m,status:"finished" as const,score:[3,0] as [number,number],winnerId:m.a.kind==="team"?m.a.teamId:null,finishedAt:2000}));
 return {groups,matches};
}
function qualify(n:number,g:number,q:number,best:boolean){
 const {groups,matches}=finishedGroups(n,g),choices:Record<string,string[]>={};
 let result=computeConfiguredQualification(groups,matches,q,choices,best);
 for(let guard=0;result.kind==="tie"&&guard<40;guard++){choices[result.context]=result.candidates.slice(0,result.slots);result=computeConfiguredQualification(groups,matches,q,choices,best);}
 assert.equal(result.kind,"seeds");
 return result.kind==="seeds"?result.seeds:[];
}
assert.equal(qualify(12,3,2,false).length,4);assert.equal(qualify(12,3,2,true).length,8);
assert.equal(qualify(7,3,2,true).length,7);assert.equal(qualify(4,1,1,false).length,1);
const tied=finishedGroups(12,3);for(const m of tied.matches){m.score=[0,0];m.winnerId=null;}
assert.equal(computeConfiguredQualification(tied.groups,tied.matches,2,{},false).kind,"tie");
let legacy=computeQualification(tied.groups,tied.matches,2,{});assert.equal(legacy.kind,"tie");
console.log("✓ Best-following ON/OFF, reduced bracket, insufficient candidates/byes and perfect ties are effective");

// Three teams tied on points; mini-table GD precedes global GD in the reference.
const miniGroups=buildGroups(["t1","t2","t3","t4"],1,true);
const scoreFor:Record<string,[number,number]>={"t1t2":[3,0],"t2t3":[2,0],"t1t3":[0,1],"t1t4":[1,0],"t2t4":[10,0],"t3t4":[1,0]};
const miniMatches=scheduleGroups(miniGroups,false).map(m=>{
 const [a,b]=matchTeams(m,[]);const normal=[a!,b!].sort(),score=scoreFor[normal.join("")];
 return {...m,status:"finished" as const,score:a===normal[0]?score:[score[1],score[0]] as [number,number]};
});
assert.equal(computeStandings(["t1","t2","t3","t4"],miniMatches)[0].teamId,"t2");
assert.equal(computeStandings(["t1","t2","t3","t4"],miniMatches,true)[0].teamId,"t1");
assert.deepEqual(computeConfiguredQualification(miniGroups,miniMatches,1,{},false),{kind:"seeds",seeds:[{kind:"team",teamId:"t1"}]});
console.log("✓ New Cup qualification and displayed ranks share reference mini-table criteria; legacy ranks stay unchanged");

for(let n=2;n<=32;n++){
 const ids=tournamentTeams(n).map(t=>t.id),before=JSON.stringify(ids);
 const matches=buildBracket(ids.map(teamId=>({kind:"team" as const,teamId})),{smallFinal:n>=4,startOrder:1,idPrefix:"k",reference:true});
 assert.equal(matches.filter(m=>m.status==="bye").length,2**Math.ceil(Math.log2(n))-n);
 assert(matches.filter(m=>m.status==="bye").every(m=>m.winnerId));
 assert.equal(matches.filter(m=>m.status==="scheduled"&&m.stage==="ko").length,n-1);
 let order=[1];while(order.length<2**Math.ceil(Math.log2(n))){const size=order.length*2;order=order.flatMap(x=>[x,size+1-x]);}
 const first=matches.filter(m=>m.roundOf===order.length&&m.stage==="ko");
 assert.deepEqual(first.map(m=>matchTeams(m,matches)),Array.from({length:order.length/2},(_,i)=>[ids[order[2*i]-1]??null,ids[order[2*i+1]-1]??null]));
 assert.equal(JSON.stringify(ids),before);
}
console.log("✓ Survie brackets 2–32 preserve every team, exact bye count, seeding and optional small final");

for(const drawRule of ["shootout","extraThenShootout","golden"] as const){
 let s=S.createSession({...survie,teamCount:2,drawRule,draw:"manual"},tournamentTeams(2),1000);
 s=S.endManual(s,2000);
 assert.equal(s.live!.stage,drawRule==="shootout"?"shootout":drawRule==="golden"?"golden":"extra");
 if(drawRule==="extraThenShootout"){s=S.advance(s,182000);assert.equal(s.live!.stage,"shootout");}
 if(drawRule==="golden")s=S.goal(s,0,1,300000);else s=S.submitShootout(s,3,2,300000);
 assert.equal(s.live!.stage,"finished");assert(s.matches.some(m=>m.winnerId==="t1"));
}
let round=S.createSession({...survie,teamCount:6,draw:"manual",roundMinutes:{8:12,4:15,2:20},smallFinal:true},tournamentTeams(6),1000);
assert.equal(round.live!.periodMs[0],12*60000);
for(const m of round.matches)if(m.stage==="small")assert.equal(S.matchMinutes(round,m),15);
console.log("✓ Shootout, timed extra then shootout, unlimited golden goal and round-specific durations use the shared engine");
const extraGroup=S.createSession({...cup,teamCount:4,groups:1,draw:"manual",groupAdditional:true},tournamentTeams(4),1000);
assert.equal(S.advance(extraGroup,601000).live!.stage,"additional");
const goalsOnly=S.createSession({...survie,teamCount:2,end:{byTime:false,goalTarget:2}},tournamentTeams(2),1000);
assert.equal(S.advance(goalsOnly,99999999).live!.stage,"period");
assert.equal(S.goal(S.goal(goalsOnly,0,1,2000),0,1,3000).live!.stage,"finished");
for(const patch of [{launch:"bad"},{launchDelaySec:NaN},{launchDelaySec:0},{roundMinutes:{4:-1}},{matchMin:Infinity},{groups:NaN},{bestNext:"yes"}])
 assert(validateConfig({...cup,...patch} as CupConfig,tournamentTeams(8)).length);
console.log("✓ Cup group additional time, goals-only matches and invalid option data are covered");

let single=S.createSession({...cup,teamCount:4,groups:1,qualifiersPerGroup:1,draw:"manual",name:"Cup des amis",end:{byTime:true,goalTarget:1}},tournamentTeams(4),1000);
let at=2000;
while(single.matches.some(m=>m.status==="live"||m.status==="scheduled")){
 const current=S.currentMatch(single)!;const pair=matchTeams(current,single.matches);
 single=S.goal(single,Number(pair[0]!.slice(1))<Number(pair[1]!.slice(1))?0:1,1,at++);
 if(single.cup?.tieChoice){const t=single.cup.tieChoice;single=S.resolveTieChoice(single,t.candidates.slice(0,t.slots),at++);}
 if(S.sessionComplete(single))break;
 single=S.launchNext(single,at++,true);
}
assert(S.sessionComplete(single));assert.equal(buildSummary(single).headline,"Les Renards");
const archived=snapshotCompetition(S.endSession(single,at));assert.equal(archived.name,"Cup des amis");assert.equal(archived.summary.podium[0].name,"Les Renards");assert(validSession(archived.session));
console.log("✓ A Cup with one qualifier completes without an invented final and keeps its competition name");

function delayed(mode:"cup"|"survie",launch:"manual"|"auto"|"delay"="delay"):Session{
 const c={...tournamentDefaults(mode),draw:"manual" as const,launch,launchDelaySec:30,end:{byTime:true,goalTarget:1}};
 const s=S.goal(S.createSession(c,tournamentTeams(c.teamCount),1000),0,1,11000);
 return S.advance(s,11000);
}
for(const mode of ["cup","survie"] as const){
 const manual=delayed(mode,"manual");assert.equal(manual.live!.stage,"finished");
 const auto=delayed(mode,"auto");assert.equal(auto.live!.stage,"period");assert.equal(auto.matches.filter(m=>m.status==="finished").length,1);
 const waiting=delayed(mode);assert(validSession(waiting));assert(waiting.pendingLaunch);
 const paused=S.pauseNextLaunch(waiting,16000);assert.equal(S.advance(paused,90000).live!.stage,"finished");
 const cancelled=S.cancelNextLaunch(paused,17000);assert.equal(S.advance(cancelled,90000).pendingLaunch!.cancelled,true);
 const resumed=S.resumeNextLaunch(paused,20000);const launched=S.advance(resumed,45000);assert.equal(launched.live!.chrono.runningSince,45000);
 assert.equal(S.advance(launched,45000),launched);assert.equal(S.startNextImmediately(waiting,18000).live!.chrono.runningSince,18000);
 assert.equal(S.endSession(waiting,18000).pendingLaunch,undefined);
 const invalid=JSON.parse(JSON.stringify(waiting));invalid.pendingLaunch.key="stale";assert.equal(validSession(invalid),false);
 const correction=S.correctLast(waiting,0,1,15000);assert.equal(correction.pendingLaunch?.cancelled,true);
}
console.log("✓ Tournament manual/auto/delayed launch, pause, cancel, immediate, correction and stale target validation");

const preferencesKey="roundr.preferences.v1",sessionKey="roundr.session.v1";
function fixture(memory:Map<string,string>){
 const faults={read:false,write:false};
 const audio:string[]=[];
 (globalThis as any).__roundrTestModules={"@react-native-async-storage/async-storage":{
  async getAllKeys(){return [...memory.keys()];},async getItem(k:string){if(faults.read&&k===sessionKey)throw Error("read");return memory.get(k)??null;},
  async setItem(k:string,v:string){if(faults.write&&k===sessionKey)throw Error("write");memory.set(k,v);},async removeItem(k:string){memory.delete(k);}
 },react:{useSyncExternalStore(){}}, "@/src/audio/sounds":{async playSound(sound:string){audio.push(sound);}}, "@/src/haptics":{async selectionAsync(){}}};
 delete req.cache[req.resolve("../src/store/session-store")];
 return {store:req("../src/store/session-store") as typeof import("../src/store/session-store"),faults,audio};
}
async function run(){
 const original=Date.now;
 try{Date.now=()=>45000;
 for(const mode of ["cup","survie"] as const){
  const raw=JSON.stringify(delayed(mode)),memory=new Map([[sessionKey,raw],[preferencesKey,"{}"]]),f=fixture(memory);
  f.faults.write=true;await f.store.loadStore();assert.equal(memory.get(sessionKey),raw);assert(f.store.getStoreState().saveError);
  f.faults.write=false;await f.store.retryStorage();assert.equal(f.store.getStoreState().saveError,null);
  const restored=JSON.parse(memory.get(sessionKey)!);assert.equal(restored.live.chrono.runningSince,41000);
  const restart=fixture(memory);await restart.store.loadStore();assert.equal(restart.store.getStoreState().session!.live!.chrono.runningSince,41000);
  assert.equal(restart.store.getStoreState().session!.matches.filter(m=>m.status==="finished").length,1);
 }
 console.log("✓ Cup/Survie delayed launch survives storage failure and restart without duplicate results");
 for(const sounds of [false,true]){
  const f=fixture(new Map());await f.store.loadStore();
  assert(f.store.startSession(S.createSession({...survie,sounds},tournamentTeams(8),45000)));
  f.store.dispatchSession(S.startReady);await f.store.flushStorage();assert.equal(f.audio.length>0,sounds);
 }
 console.log("✓ Survie sound toggle really enables or silences the session audio");
 }finally{Date.now=original;}
}
void run().catch(e=>{console.error(e);process.exitCode=1;});
