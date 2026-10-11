const assert = require("node:assert/strict");
import { defaultConfig, defaultTeams } from "../src/domain/defaults";
import * as S from "../src/domain/session";
const memory=new Map<string,string>();
const calls:string[]=[];const sounds:string[]=[];
let concurrent=0,maxConcurrent=0,failKey:string|null=null;
const storage={
  async getItem(key:string){return memory.get(key)??null;},
  async setItem(key:string,value:string){
    if(key!=="roundr.preferences.v1"){concurrent++;maxConcurrent=Math.max(maxConcurrent,concurrent);}
    await new Promise(r=>setTimeout(r,2));
    if(key!=="roundr.preferences.v1")concurrent--;
    if(failKey===key)throw Error("simulated disk failure");
    memory.set(key,value);calls.push(key);
  },
  async removeItem(key:string){
    if(key!=="roundr.preferences.v1"){concurrent++;maxConcurrent=Math.max(maxConcurrent,concurrent);}
    await new Promise(r=>setTimeout(r,2));if(key!=="roundr.preferences.v1")concurrent--;
    memory.delete(key);calls.push(key);
  },
};
(globalThis as any).__roundrTestModules={
  "@react-native-async-storage/async-storage":storage,
  "react":{useSyncExternalStore:()=>{}},
  "@/src/audio/sounds":{playSound:async(key:string)=>{sounds.push(key);}},
  "@/src/haptics":{selectionAsync:async()=>{}},
};
const Store=require("../src/store/session-store") as typeof import("../src/store/session-store");
const Prefs=require("../src/store/preferences") as typeof import("../src/store/preferences");
let now=1_000_000;const originalNow=Date.now;Date.now=()=>now;
const wait=()=>new Promise(r=>setTimeout(r,80));
const make=(config:any)=>S.createSession(config,defaultTeams(config.mode,"teamCount" in config?config.teamCount:2),now);
async function main(){
  memory.set("roundr.session.v1","{}");
  const legacy={id:"old",name:"Ancien chrono",config:defaultConfig("custom"),teams:null,createdAt:now};
  memory.set("roundr.presets.v1",JSON.stringify([legacy]));
  memory.set("roundr.preferences.v1",JSON.stringify({keepAwake:true,volume:2,sounds:true}));
  await Prefs.loadPreferences();await Store.loadStore();
  assert.equal(Store.getStoreState().session,null);
  assert.equal(memory.get("roundr.session.corrupt.v1"),"{}");
  assert.equal(Store.getStoreState().presets[0].id,"old");
  assert.equal(Prefs.getPreferences().keepAwake,false);
  assert.equal(Prefs.getPreferences().volume,1);
  console.log("✓ Corrupt session is retained and legacy Custom preset survives");
  assert.equal(Prefs.getPreferences().chronoStyle,"classic");
  await Prefs.setPreferences({chronoStyle:"ring"});
  assert.equal(JSON.parse(memory.get("roundr.preferences.v1")!).chronoStyle,"ring");
  await Prefs.loadPreferences();
  assert.equal(Prefs.getPreferences().chronoStyle,"ring");
  memory.set("roundr.preferences.v1",JSON.stringify({chronoStyle:"invalid"}));
  await Prefs.loadPreferences();
  assert.equal(Prefs.getPreferences().chronoStyle,"ring");
  console.log("✓ Chrono view persists; invalid stored values do not replace it");
  for(const mode of ["classique","custom","maracana","cup","survie"] as const) {
    Store.startSession(make(defaultConfig(mode)));
    assert.equal(Store.getStoreState().session!.live!.chrono.runningSince,null);
  }
  console.log("✓ All launch paths share a ready state");
  const config={...defaultConfig("classique"),totalMin:1,periods:1,additional:false};
  Store.startSession(make(config));Store.dispatchSession(S.startReady);
  now+=60_001;Store.dispatchSession(S.pause);
  assert.equal(Store.getStoreState().session!.live!.stage,"finished");
  now+=1000;Store.startSession(make(config));Store.dispatchSession(S.startReady);
  now+=60_001;Store.dispatchSession((s,t)=>S.goal(s,0,1,t));
  assert.equal(Store.getStoreState().session!.live!.stage,"finished");
  assert.deepEqual(Store.getStoreState().session!.live!.score,[0,0]);
  console.log("✓ Late pause and goal cannot modify an expired phase");
  await Prefs.setPreferences({sounds:true,preparation:false,minuteSound:"gong"});
  Store.startSession(make({...config,totalMin:2,sounds:false}));Store.dispatchSession(S.startReady);
  assert.equal(sounds.at(-1),"whistle");
  sounds.length=0;now+=60_000;Store.tick();
  assert.deepEqual(sounds,["gong"]);
  assert(Store.getStoreState().notice!.message.includes("1 minute"));
  await Prefs.setPreferences({sounds:false});sounds.length=0;
  Store.startSession(make(config));Store.dispatchSession(S.startReady);
  now+=60_001;Store.tick();assert.equal(sounds.length,0);
  console.log("✓ Global mute overrides old saves; preparation off preserves minute alert");
  const old=Store.getStoreState().session!;
  Store.archiveSession(S.endSession(old,now));
  now+=1000;const fresh=make(config);Store.startSession(fresh);
  await wait();
  assert.equal(JSON.parse(memory.get("roundr.session.v1")!).id,fresh.id);
  assert.equal(JSON.parse(memory.get("roundr.summary.v1")!).id,old.id);
  assert.equal(maxConcurrent,1);
  console.log("✓ Writes are serialized; archive never erases a newly created session");
  failKey="roundr.presets.v1";
  assert.equal(await Store.setPresets([legacy]),false);
  Store.startSession(make(config));await wait();
  assert(Store.getStoreState().saveError);
  failKey=null;assert.equal(await Store.setPresets([legacy]),true);
  assert.equal(Store.getStoreState().saveError,null);
  console.log("✓ Storage error remains visible until the failed save succeeds");
}
main().then(()=>{Date.now=originalNow;console.log("Store regression scenarios passed");}).catch(error=>{Date.now=originalNow;console.error(error);process.exitCode=1;});
