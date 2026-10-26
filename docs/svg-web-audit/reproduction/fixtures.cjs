const fs=require('fs'),path=require('path');
const frontend=path.resolve(__dirname,'../../../frontend');
require(path.join(frontend,'scripts/register-ts.cjs'));
const S=require(path.join(frontend,'src/domain/session'));
const {lovableLaunchDefaults,lovableConfigTeams}=require(path.join(frontend,'src/features/lovable-config-state'));
const {tournamentDefaults,tournamentTeams}=require(path.join(frontend,'src/features/tournament-config-state'));
const {createTournamentSession,tournamentProjection}=require(path.join(frontend,'src/domain/tournament-presentation'));
const {defaultConfig,createFreeTimer,advanceFree}=require(path.join(frontend,'src/domain/free-timer'));
const {freeCommand}=require(path.join(frontend,'src/features/free-live-state'));
const {matchTeams}=require(path.join(frontend,'src/domain/bracket'));
const {validSession}=require(path.join(frontend,'src/store/storage-validation'));
const {validFreeTimer}=require(path.join(frontend,'src/store/free-timer-validation'));
const {snapshotCompetition,HISTORY_INDEX,competitionKey}=require(path.join(frontend,'src/store/competition-history'));
const cases=[],now=1793000000000;
function add(name,route,key,value,extra={}){if(key==='roundr.session.v1'&&value&&!validSession(value))throw Error('Invalid fixture '+name);cases.push({name,route,now,storage:key?{[key]:JSON.stringify(value),...extra}:{...extra}});}
for(const mode of ['classique','maracana','cup','survie']){
 add(mode+'-config','/config/'+mode);
 let s;
 if(mode==='classique'||mode==='maracana')s=S.restartCurrent(S.createSession({...lovableLaunchDefaults(mode),additionalEachPeriod:false},lovableConfigTeams(mode,mode==='classique'?2:5),now-10000),now-10000);
 else {
  const cfg={...tournamentDefaults(mode),teamCount:8};
  s=createTournamentSession(cfg,tournamentTeams(8),now-10000);
  for(const view of ['hub'])add(mode+'-'+view,'/live','roundr.session.v1',{...s,tournamentView:view});
  s={...S.launchNext(s,now-10000),tournamentView:'match'};
 }
 const ready=s,run=S.startReady(ready,now-9000),paused=S.pause(run,now-5000);
 for(const [state,value]of [['ready',ready],['running',run],['paused',paused]]){
  if(!validSession(value))throw Error('Invalid session '+mode+state);
  add(mode+'-'+state,'/live','roundr.session.v1',value);
 }
 let ended=S.endManual(S.goal(run,0,1,now-7000),now-4000);
 if(mode==='classique')add(mode+'-break','/live','roundr.session.v1',ended);
 if(mode==='classique')ended=S.endManual(S.startNextPeriod(S.advance(ended,now+400000),now+400001),now+400010);
 add(mode+'-result','/live','roundr.session.v1',ended);
 if(mode==='cup'||mode==='survie'){
  const interrupted=S.endSession(s,now);
  add(mode+'-summary','/live','roundr.session.v1',{...interrupted,tournamentView:'summary'});
  if(mode==='survie')add(mode+'-shootout','/live','roundr.session.v1',S.endManual(run,now-3000));
  let completed=createTournamentSession({...tournamentDefaults(mode),teamCount:8},tournamentTeams(8),now-1000000);
  for(let i=0;i<100&&!tournamentProjection(completed).complete;i++){
    const at=completed.updatedAt+20000;
    completed=S.startReady(S.launchNext(completed,at),at);
    const [a,b]=matchTeams(S.currentMatch(completed),completed.matches).map(id=>Number(id.slice(1)));
    for(let j=0;j<completed.teams.length-Math.min(a,b)+1;j++)completed=S.goal(completed,a<b?0:1,1,at+100+j*10);
    completed=S.endManual(completed,at+12345);
    for(let j=0;j<20&&completed.cup?.tieChoice;j++){const choice=completed.cup.tieChoice;completed=S.resolveTieChoice(completed,choice.candidates.slice(0,choice.slots),completed.updatedAt);}
  }
  if(!tournamentProjection(completed).complete)throw Error('Fixture competition did not finish');
  completed=S.endSession(completed,completed.updatedAt);
  add(mode+'-champion','/live','roundr.session.v1',{...completed,tournamentView:'summary'});
  const finishedArchive=snapshotCompetition(completed);
  add(mode+'-champion-history','/history',null,null,{[HISTORY_INDEX]:JSON.stringify([finishedArchive.id]),[competitionKey(finishedArchive.id)]:JSON.stringify(finishedArchive)});
  const archive=snapshotCompetition(interrupted);
  add(mode+'-history','/history',null,null,{[HISTORY_INDEX]:JSON.stringify([archive.id]),[competitionKey(archive.id)]:JSON.stringify(archive)});
 }
}
for(const kind of ['stopwatch','countdown','interval']){
 add('free-'+kind+'-config','/chrono-libre/'+kind);
 const cfg={...defaultConfig(kind),withTeams:true,teams:lovableConfigTeams('classique',2)};
 const ready=createFreeTimer(cfg);ready.createdAt=now-10000;
 const run=freeCommand(ready,'toggle',now-9000),paused=freeCommand(run,'toggle',now-5000);
 const variants=[['ready',ready],['running',run],['paused',paused]];
 if(kind!=='stopwatch')variants.push(['finished',advanceFree(run,now+100000000)]);
 if(kind==='interval'){let manual=createFreeTimer({...cfg,autoChain:false});manual=freeCommand(manual,'toggle',now-100000);variants.push(['waiting',advanceFree(manual,now)]);}
 for(const [state,value]of variants)for(const display of ['numeric','analog','circular']){
  const ft={...value,config:{...value.config,display},ui:{...value.ui,view:display}};
  if(!validFreeTimer(ft))throw Error('Invalid free timer '+kind+state);
  add('free-'+kind+'-'+state+'-'+display,'/chrono-libre/run','roundr.free-timer.v1',ft);
 }
}
for(const route of ['/','/history','/teams','/team-builder','/settings','/chrono-libre','/chrono-libre/presets'])add('shared-'+route.replaceAll('/','_'),route);
const out=process.argv[2];fs.writeFileSync(out,JSON.stringify(cases,null,2));console.log(cases.length+' valid isolated browser fixtures');
