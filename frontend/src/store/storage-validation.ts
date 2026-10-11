import { validateConfig } from "@/src/domain/validate";
import type { Preset, Session, Team } from "@/src/domain/types";
const record = (x:any) => x && typeof x==="object" && !Array.isArray(x);
const finite = (x:any) => typeof x==="number" && Number.isFinite(x);
const teamsOK = (ts:any):ts is Team[] => Array.isArray(ts) && ts.length>=2 && ts.every(t=>record(t)&&typeof t.id==="string"&&typeof t.name==="string"&&typeof t.color==="string") && new Set(ts.map(t=>t.id)).size===ts.length;
const modes = ["classique","custom","maracana","cup","survie"];
function configOK(c:any, teams:Team[]) {
  try {return record(c)&&modes.includes(c.mode)&&validateConfig(c,teams).length===0;}
  catch {return false;}
}
export function validPreset(p:any):p is Preset {
  return record(p)&&typeof p.id==="string"&&typeof p.name==="string"&&finite(p.createdAt)&&
    record(p.config)&&modes.includes(p.config.mode)&&(p.teams===null||teamsOK(p.teams))&&
    configOK(p.config,p.teams??Array.from({length:p.config.teamCount??2},(_,i)=>({id:`t${i+1}`,name:`Équipe ${i+1}`,color:"#ffffff"})));
}
export function validSession(s:any):s is Session {
  try {
    if(!record(s)||typeof s.id!=="string"||!modes.includes(s.mode)||s.config?.mode!==s.mode||!teamsOK(s.teams)||
      !["active","finished","interrupted"].includes(s.status)||!finite(s.createdAt)||!finite(s.updatedAt)||
      !configOK("teamCount" in s.config?{...s.config,teamCount:s.teams.length}:s.config,s.teams)||
      !Array.isArray(s.matches)||s.matches.length===0||new Set(s.matches.map((m:any)=>m.id)).size!==s.matches.length) return false;
    const teamIds=new Set(s.teams.map((t:Team)=>t.id));
    const matchIds=new Set(s.matches.map((m:any)=>m.id));
    const slotOK=(sl:any)=>record(sl)&&(sl.kind==="team"?teamIds.has(sl.teamId):
      sl.kind==="winner"||sl.kind==="loser"?matchIds.has(sl.matchId):sl.kind==="tbd"&&typeof sl.label==="string");
    const pairOK=(x:any)=>x===null||(Array.isArray(x)&&x.length===2&&x.every(n=>Number.isInteger(n)&&n>=0));
    if(s.matches.some((m:any)=>!record(m)||typeof m.id!=="string"||!finite(m.order)||!slotOK(m.a)||!slotOK(m.b)||
      !["scheduled","live","finished","bye"].includes(m.status)||!pairOK(m.score)||!pairOK(m.shootout)||
      !finite(m.playedMs)||(m.winnerId!==null&&!teamIds.has(m.winnerId)))) return false;
    const l=s.live;
    if(l!==null&&(!record(l)||!matchIds.has(l.matchId)||!["period","break","awaitPeriod","additional","extra","golden","shootout","finished"].includes(l.stage)||
      !record(l.chrono)||!finite(l.chrono.accumulatedMs)||l.chrono.accumulatedMs<0||
      (l.chrono.runningSince!==null&&!finite(l.chrono.runningSince))||
      !Array.isArray(l.periodMs)||!l.periodMs.length||l.periodMs.some((n:any)=>!finite(n)||n<0)||
      !Number.isInteger(l.periodIndex)||l.periodIndex<0||l.periodIndex>=l.periodMs.length||
      !finite(l.playedMs)||!pairOK(l.score)||l.score===null||!record(l.end)||
      !Array.isArray(l.firedAlerts)||l.firedAlerts.some((x:any)=>typeof x!=="string"))) return false;
    if(s.mode==="maracana"&&(!record(s.maracana)||!Array.isArray(s.maracana.onField)||!Array.isArray(s.maracana.waiting)||!record(s.maracana.consecutive))) return false;
    if(s.mode==="cup"&&(!record(s.cup)||!Array.isArray(s.cup.groups)||!["groups","knockout"].includes(s.cup.phase)||!Array.isArray(s.cup.qualifiedIds))) return false;
    return true;
  }catch{return false;}
}
