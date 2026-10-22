import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSyncExternalStore } from "react";
import type { Team } from "@/src/domain/types";
import type { SoundKey } from "@/src/audio/sounds";
import { copyComposition, validComposition, type TeamComposition } from "@/src/domain/team-maker";
export type EventSound = SoundKey | "off";
export type Preferences = {
  sounds:boolean; vibrations:boolean; preparation:boolean; additional:boolean; keepAwake:boolean;
  volume:number; startSound:EventSound; endSound:EventSound; goalSound:EventSound;
  minuteSound:EventSound; periodSound:EventSound; warmupSound:EventSound;
  teams:Team[]; players:string[]; groups:string[][]; error:string|null; compositionSavedAt?:number;
};
let state:Preferences={sounds:true,vibrations:true,preparation:true,additional:true,keepAwake:false,
  volume:0.8,startSound:"whistle",endSound:"final",goalSound:"alert",minuteSound:"gong",periodSound:"gong",warmupSound:"prep",
  teams:[],players:[],groups:[],error:null};
const listeners=new Set<()=>void>();
const emit=()=>listeners.forEach(fn=>fn());
const sounds = new Set(["off","alert","whistle","final","prep","gong"]);
const team = (t:any):t is Team => !!t && typeof t.id==="string" && typeof t.name==="string" && typeof t.color==="string";
let pending=Promise.resolve(), writes=0, loaded=false, readable=false, reading:Promise<void>|null=null;
let compositionStatus={loading:true,saving:false,readable:false,error:null as string|null};
const setCompositionStatus=(p:Partial<typeof compositionStatus>)=>{compositionStatus={...compositionStatus,...p};emit();};
let compositionReadError=false;
export function loadPreferences():Promise<void>{
  if(reading)return reading;
  const before=writes?pending:Promise.resolve();
  setCompositionStatus({loading:true});
  reading=before.then(async()=>{
  try{
    const raw=await AsyncStorage.getItem("roundr.preferences.v1");
    if(raw){
      const value=JSON.parse(raw);
      if(!value || typeof value!=="object" || Array.isArray(value)) throw Error("Préférences invalides");
      if(value.teams!==undefined&&(!Array.isArray(value.teams)||!value.teams.every(team)||new Set(value.teams.map((t:Team)=>t.id)).size!==value.teams.length))throw Error("Équipes invalides");
      if(value.groups!==undefined&&(!Array.isArray(value.groups)||!value.groups.every((g:any)=>Array.isArray(g)&&g.every((x:any)=>typeof x==="string"))))throw Error("Répartition invalide");
      if(value.players!==undefined&&(!Array.isArray(value.players)||!value.players.every((x:any)=>typeof x==="string")))throw Error("Joueurs invalides");
      if(value.compositionSavedAt!==undefined&&(!Number.isFinite(value.compositionSavedAt)||value.compositionSavedAt<0))throw Error("Date de composition invalide");
      const clean:Partial<Preferences>={};
      for(const key of ["sounds","vibrations","preparation","additional","keepAwake"] as const) {
        if(typeof value[key]==="boolean") clean[key]=value[key];
      }
      // v2 changes the old implicit always-on default. Future explicit choices persist.
      if(value.screenSleepVersion!==2) clean.keepAwake=false;
      for(const key of ["startSound","endSound","goalSound","minuteSound","periodSound","warmupSound"] as const) {
        if(sounds.has(value[key])) clean[key]=value[key];
      }
      if(Number.isFinite(value.volume)) clean.volume=Math.min(1,Math.max(0,value.volume));
      if(Array.isArray(value.teams)&&value.teams.every(team)&&new Set(value.teams.map((t:Team)=>t.id)).size===value.teams.length) clean.teams=value.teams;
      if(Array.isArray(value.players)&&value.players.every((x:any)=>typeof x==="string")) clean.players=[...new Set<string>(value.players)];
      if(Array.isArray(value.groups)&&value.groups.every((g:any)=>Array.isArray(g)&&g.every((x:any)=>typeof x==="string"))) clean.groups=value.groups;
      if(Number.isFinite(value.compositionSavedAt)&&value.compositionSavedAt>=0)clean.compositionSavedAt=value.compositionSavedAt;
      state={...state,...clean,error:null};
    }
    readable=true;setCompositionStatus({readable:true});
    if(compositionReadError){compositionReadError=false;setCompositionStatus({error:null});}
  }catch{readable=false;compositionReadError=true;state={...state,error:"Lecture des préférences impossible. Les données enregistrées sont conservées."};setCompositionStatus({readable:false,error:"Impossible de lire la composition enregistrée. Réessayez avant de la remplacer."});}
  loaded=true;
  emit();
  }).finally(()=>{reading=null;setCompositionStatus({loading:false});});
  return reading;
}
export function setPreferences(p:Partial<Preferences>){
  const ready=reading??(loaded?Promise.resolve():loadPreferences());
  const patch=JSON.parse(JSON.stringify(p)) as Partial<Preferences>;
  const optimistic=loaded&&readable&&!reading;
  if(optimistic){state={...state,...patch};emit();}
  writes++;
  pending=pending.then(async()=>{
    await ready;
    if(!readable){state={...state,error:"Sauvegarde impossible tant que les préférences ne sont pas lisibles."};emit();return;}
    if(!optimistic){state={...state,...patch};emit();}
    const snapshot={...state,...patch,error:null,screenSleepVersion:2};
    try{await AsyncStorage.setItem("roundr.preferences.v1",JSON.stringify(snapshot));if(state.error){state={...state,error:null};emit();}}
    catch{state={...state,error:"Sauvegarde des préférences impossible."};emit();}
  }).finally(()=>{writes--;});
  return pending;
}
export function saveTeamComposition(value:TeamComposition):Promise<boolean>{
  if(!validComposition(value)||compositionStatus.saving)return Promise.resolve(false);
  const copy=copyComposition(value),ready=reading??(loaded?Promise.resolve():loadPreferences());
  setCompositionStatus({saving:true});writes++;
  let success=false;
  pending=pending.then(async()=>{
    await ready;
    if(!readable){setCompositionStatus({error:"La composition précédente n’a pas pu être lue. Aucune donnée n’a été remplacée."});return;}
    const patch={teams:copy.teams,groups:copy.groups,players:copy.groups.flat(),compositionSavedAt:copy.savedAt??Date.now()};
    try{
      await AsyncStorage.setItem("roundr.preferences.v1",JSON.stringify({...state,...patch,error:null,screenSleepVersion:2}));
      state={...state,...patch,error:null};compositionReadError=false;setCompositionStatus({error:null});success=true;emit();
    }catch{setCompositionStatus({error:"Enregistrement impossible. La composition précédente est conservée. Réessayez."});}
  }).finally(()=>{writes--;setCompositionStatus({saving:false});});
  return pending.then(()=>success);
}
export const getSavedComposition=():TeamComposition|null=>{
  const value={teams:state.teams,groups:state.groups,savedAt:state.compositionSavedAt};
  return validComposition(value)?copyComposition(value):null;
};
export function useCompositionStatus(){return useSyncExternalStore(fn=>{listeners.add(fn);return()=>{listeners.delete(fn);};},()=>compositionStatus,()=>compositionStatus);}
export const flushPreferences=()=>pending;
export const getCompositionStatus=()=>compositionStatus;
export const getPreferences=()=>state;
export function usePreferences(){return useSyncExternalStore(fn=>{listeners.add(fn);return()=>{listeners.delete(fn);};},()=>state,()=>state);}
