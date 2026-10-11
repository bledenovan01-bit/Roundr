const assert=require("node:assert/strict");
const listeners=new Set<()=>void>();
let muted=false, played=0, paused=0;
let afterSeek:()=>void=()=>{};
let audioMode:any;
(globalThis as any).__roundrTestModules={
  "@/src/store/preferences":{
    getPreferences:()=>({sounds:!muted,volume:0.6}),
    subscribePreferences:(fn:()=>void)=>{listeners.add(fn);return()=>listeners.delete(fn);},
  },
  "expo-audio":{
    setAudioModeAsync:async(value:any)=>{audioMode=value;},
    createAudioPlayer:()=>({volume:1,seekTo:async()=>{afterSeek();},play:()=>{played++;},pause:()=>{paused++;}}),
  },
};
(require as any).extensions[".wav"]=(module:any)=>{module.exports=1;};
const {playSound}=require("../src/audio/sounds") as typeof import("../src/audio/sounds");
async function main(){
  await playSound("whistle");
  assert.equal(played,1);
  assert.equal(audioMode.interruptionMode,"mixWithOthers");
  muted=true;listeners.forEach(fn=>fn());
  assert.equal(paused,1);
  await playSound("whistle");assert.equal(played,1);
  await playSound("whistle",true);assert.equal(played,2);
  muted=false;afterSeek=()=>{muted=true;};
  await playSound("whistle");assert.equal(played,2);
  console.log("✓ Roundr mute stops its effects and prevents delayed playback; explicit previews remain available");
}
main().catch(e=>{console.error(e);process.exitCode=1;});
