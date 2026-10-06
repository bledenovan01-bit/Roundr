import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSyncExternalStore } from "react";
import type { Team } from "@/src/domain/types";
export type Preferences = { sounds:boolean; vibrations:boolean; preparation:boolean; additional:boolean; keepAwake:boolean; volume:number; startSound:"whistle"|"alert"; endSound:"final"|"whistle"; goalSound:"alert"|"whistle"; teams:Team[]; players:string[]; groups:string[][]; error:string|null };
let state:Preferences={sounds:true,vibrations:true,preparation:true,additional:true,keepAwake:true,volume:0.8,startSound:"whistle",endSound:"final",goalSound:"alert",teams:[],players:[],groups:[],error:null};
const listeners=new Set<()=>void>();
const emit=()=>listeners.forEach(fn=>fn());
export async function loadPreferences(){try{const raw=await AsyncStorage.getItem("roundr.preferences.v1");if(raw){const value=JSON.parse(raw);state={...state,...value,error:null};}emit();}catch{state={...state,error:"Lecture des préférences impossible."};emit();}}
let pending=Promise.resolve();
export function setPreferences(p:Partial<Preferences>){state={...state,...p};emit();const snapshot=state;pending=pending.then(async()=>{try{await AsyncStorage.setItem("roundr.preferences.v1",JSON.stringify({...snapshot,error:null}));}catch{state={...state,error:"Sauvegarde des préférences impossible."};emit();}});}
export const getPreferences=()=>state;
export function usePreferences(){return useSyncExternalStore(fn=>{listeners.add(fn);return()=>{listeners.delete(fn);};},()=>state,()=>state);}
