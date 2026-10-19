import { advance, cancelNextLaunch, createSession, endManual, startReady } from "../src/domain/session";
import { lovableConfigTeams, lovableLaunchDefaults } from "../src/features/lovable-config-state";
import type { MaracanaConfig, Session } from "../src/domain/types";
const builtin = (process as unknown as { getBuiltinModule: (id: string) => any }).getBuiltinModule;
const assert = builtin("assert/strict");
const testRequire = builtin("module").createRequire(process.argv[1]) as { (id: string): unknown; cache: Record<string, unknown>; resolve: (id: string) => string };
const key = "roundr.session.v1";
function pending() {
  const config = { ...lovableLaunchDefaults("maracana"), launch: "delay", launchDelaySec: 30 } as MaracanaConfig;
  return advance(endManual(createSession(config, lovableConfigTeams("maracana", 5), 1000), 11000), 11000);
}
function fixture(memory: Map<string,string>, fail = false) {
  const faults = { write: fail, read: false };
  const audio: string[] = [];
  (globalThis as any).__roundrTestModules = {
    "@react-native-async-storage/async-storage": {
      async getAllKeys() { return [...memory.keys()]; },
      async getItem(k: string) { if (faults.read && k === key) throw Error("read failed"); return memory.get(k) ?? null; },
      async setItem(k: string, v: string) { if (faults.write && k === key) throw Error("write failed"); memory.set(k,v); },
      async removeItem(k: string) { memory.delete(k); },
    },
    react: { useSyncExternalStore() {} },
    "@/src/audio/sounds": { async playSound(sound: string) { audio.push(sound); } },
    "@/src/haptics": { async selectionAsync() {} },
  };
  delete testRequire.cache[testRequire.resolve("../src/store/session-store")];
  return { store: testRequire("../src/store/session-store") as typeof import("../src/store/session-store"), faults, audio };
}
async function run() {
  const originalNow = Date.now;
  try {
    Date.now = () => 45000;
    const memory = new Map([[key,JSON.stringify(pending())]]);
    const f = fixture(memory); await f.store.loadStore(); await f.store.flushStorage();
    const restored = f.store.getStoreState().session!;
    assert.equal(restored.live!.matchId,"m2"); assert.equal(restored.live!.chrono.runningSince,41000);
    assert.equal(JSON.parse(memory.get(key)!).live.chrono.runningSince,41000);
    const restarted = fixture(memory); await restarted.store.loadStore();
    assert.equal(restarted.store.getStoreState().session!.live!.chrono.runningSince,41000);
    assert.equal(restarted.store.getStoreState().session!.matches.filter(m=>m.status==="finished").length,1);
    console.log("✓ Delayed launch restored, persisted and restarted at the same timestamp without duplicates");
    const raw=JSON.stringify(pending()), failedMemory=new Map([[key,raw]]), failed=fixture(failedMemory,true);
    await failed.store.loadStore(); assert(failed.store.getStoreState().saveError); assert.equal(failedMemory.get(key),raw);
    failed.store.tick(); await failed.store.flushStorage(); assert(failed.store.getStoreState().saveError);
    failed.faults.write=false; await failed.store.retryStorage();
    assert.equal(failed.store.getStoreState().saveError,null); assert.equal(JSON.parse(failedMemory.get(key)!).live.chrono.runningSince,41000);
    console.log("✓ Failed recovery write preserves durable previous state and its error until the retry succeeds");
    const cancelled=cancelNextLaunch(pending(),16000), cancelledMemory=new Map([[key,JSON.stringify(cancelled)]]);
    const paused=fixture(cancelledMemory); await paused.store.loadStore();
    assert.equal(paused.store.getStoreState().session!.live!.matchId,"m1"); assert.equal(paused.store.getStoreState().session!.pendingLaunch!.cancelled,true);
    console.log("✓ Cancelled automatic launch remains cancelled after a storage restart");
    const invalid={...pending(),pendingLaunch:{...pending().pendingLaunch,chrono:{...pending().pendingLaunch!.chrono,accumulatedMs:-1}}};
    const rejectedRaw=JSON.stringify(invalid), rejectedMemory=new Map([[key,rejectedRaw]]), rejected=fixture(rejectedMemory);
    await rejected.store.loadStore(); rejected.store.tick(); await rejected.store.flushStorage();
    assert.equal(rejected.store.getStoreState().session,null); assert(rejected.store.getStoreState().saveError); assert.equal(rejectedMemory.get(key),rejectedRaw);
    assert([...rejectedMemory].some(([k,v])=>k.includes("corrupt")&&v===rejectedRaw));
    console.log("✓ Invalid pending launch is refused and preserved raw instead of overwritten");
    const unreadMemory=new Map([[key,raw]]), unread=fixture(unreadMemory); unread.faults.read=true;
    await unread.store.loadStore(); assert.equal(unread.store.startSession(pending() as Session),false); assert.equal(unreadMemory.get(key),raw);
    console.log("✓ Unreadable automatic session blocks replacement without erasing its data");
    for (const mode of ["classique","maracana"] as const) for (const sounds of [false,true]) {
      const soundFixture=fixture(new Map()); await soundFixture.store.loadStore();
      const config={...lovableLaunchDefaults(mode),sounds};
      const teams=lovableConfigTeams(mode,config.mode==="maracana"?config.teamCount:2);
      assert.equal(soundFixture.store.startSession(createSession(config,teams,45000)),true);
      soundFixture.store.dispatchSession(startReady); await soundFixture.store.flushStorage();
      assert.equal(soundFixture.audio.length>0,sounds,`${mode}: per-session sound toggle is effective`);
    }
    console.log("✓ Classic and Maracana sound toggles really enable or silence session audio");
  } finally { Date.now=originalNow; }
}
void run().catch(error=>{console.error(error); process.exitCode=1;});
