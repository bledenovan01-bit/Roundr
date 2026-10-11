import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSyncExternalStore } from "react";
import type { Team } from "@/src/domain/types";
import type { SoundKey } from "@/src/audio/sounds";
export type EventSound = SoundKey | "off";
export type Preferences = {
  sounds:boolean; vibrations:boolean; preparation:boolean; additional:boolean; keepAwake:boolean;
  volume:number; startSound:EventSound; endSound:EventSound; goalSound:EventSound;
  minuteSound:EventSound; periodSound:EventSound; warmupSound:EventSound;
  teams:Team[]; players:string[]; groups:string[][]; error:string|null;
};
let state:Preferences={sounds:true,vibrations:true,preparation:true,additional:true,keepAwake:false,
  volume:0.8,startSound:"whistle",endSound:"final",goalSound:"alert",minuteSound:"gong",periodSound:"gong",warmupSound:"prep",
  teams:[],players:[],groups:[],error:null};
const listeners=new Set<()=>void>();
const emit=()=>listeners.forEach(fn=>fn());
const sounds = new Set(["off","alert","whistle","final","prep","gong"]);
const team = (t:any):t is Team => !!t && typeof t.id==="string" && typeof t.name==="string" && typeof t.color==="string";
export async function loadPreferences(){
  try{
    const raw=await AsyncStorage.getItem("roundr.preferences.v1");
    if(raw){
      const value=JSON.parse(raw);
      if(!value || typeof value!=="object" || Array.isArray(value)) throw Error("Préférences invalides");
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
      state={...state,...clean,error:null};
    }
  }catch{state={...state,error:"Lecture des préférences impossible. Réglages par défaut utilisés."};}
  emit();
}
let pending=Promise.resolve();
export function setPreferences(p:Partial<Preferences>){
  state={...state,...p};emit();const snapshot={...state,error:null,screenSleepVersion:2};
  pending=pending.then(async()=>{
    try{await AsyncStorage.setItem("roundr.preferences.v1",JSON.stringify(snapshot));if(state.error){state={...state,error:null};emit();}}
    catch{state={...state,error:"Sauvegarde des préférences impossible."};emit();}
  });
  return pending;
}
export const getPreferences=()=>state;
export function usePreferences(){return useSyncExternalStore(fn=>{listeners.add(fn);return()=>{listeners.delete(fn);};},()=>state,()=>state);}
