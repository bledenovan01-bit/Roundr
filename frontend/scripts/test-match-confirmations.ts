import * as S from "../src/domain/session";
import { beginMatch, matchProjection } from "../src/features/match-presentation";
import { lovableConfigTeams, lovableLaunchDefaults } from "../src/features/lovable-config-state";
import type { Session } from "../src/domain/types";

const builtin = (process as unknown as { getBuiltinModule: (id: string) => any }).getBuiltinModule;
const assert = builtin("assert/strict");
const req = builtin("module").createRequire(process.argv[1]) as {
  (id: string): unknown; cache: Record<string, unknown>; resolve(id: string): string;
};
type Buttons = { text: string; style?: string; onPress?: () => void }[];
const memory = new Map<string, string>();
const platform = { OS: "web" };
let buttons: Buttons = [], answer = false, confirmCalls = 0;
(globalThis as any).__roundrTestModules = {
  "react-native": {
    Platform: platform,
    Alert: { alert(_title: string, _message: string, value: Buttons) { buttons = value; } },
  },
  "@react-native-async-storage/async-storage": {
    async getAllKeys() { return [...memory.keys()]; },
    async getItem(key: string) { return memory.get(key) ?? null; },
    async setItem(key: string, value: string) { memory.set(key, value); },
    async removeItem(key: string) { memory.delete(key); },
  },
  react: { useSyncExternalStore() {} },
  "@/src/audio/sounds": { async playSound() {} },
  "@/src/haptics": { async selectionAsync() {} },
};
// Unit boundary only. The actual Alert adapter is executed; no production dialog is replaced.
const previousWindow = (globalThis as any).window;
(globalThis as any).window = { confirm(text: string) {
  assert(text.includes("Relancer le match ?"));
  confirmCalls++;
  return answer;
} };
const { confirmMatchRestart } = req("../src/features/match-confirmations") as typeof import("../src/features/match-confirmations");
const fresh = () => {
  delete req.cache[req.resolve("../src/store/session-store")];
  return req("../src/store/session-store") as typeof import("../src/store/session-store");
};
const t0 = 1700000000000;
async function run() {
  const originalNow = Date.now;
  let now = t0;
  Date.now = () => now;
  try {
    for (const mode of ["classique", "maracana"] as const) {
      for (const os of ["web", "ios", "android"]) {
        memory.clear(); now = t0; platform.OS = os;
        let st = fresh(); await st.loadStore();
        const config = lovableLaunchDefaults(mode);
        assert(st.startSession(S.createSession(config, lovableConfigTeams(mode, mode === "classique" ? 2 : 5), now)));
        st.dispatchSession(S.startReady);
        now += 12345;
        st.dispatchSession((s, t) => S.goal(s, 0, 1, t));
        if (mode === "classique") {
          now = t0 + 900000;
          st.dispatchSession(S.advance);
          now += 2000;
          st.dispatchSession(beginMatch);
          now += 5432;
          st.dispatchSession((s, t) => S.goal(s, 1, 1, t));
          assert.equal(st.getStoreState().session!.live!.periodIndex, 1);
        }
        st.dispatchSession(S.pause);
        await st.flushStorage();
        const before = st.getStoreState().session!;
        const raw = JSON.stringify(before), disk = [...memory.entries()];
        const projection = matchProjection(before, now);
        let mutations = 0, showElapsed = true;
        const ask = () => confirmMatchRestart(() => {
          mutations++;
          showElapsed = false;
          st.dispatchSession(S.restartCurrent);
        });
        answer = false;
        ask();
        if (os !== "web") {
          assert.equal(buttons[0].text, "Annuler");
          assert.equal(buttons[0].style, "cancel");
          buttons[0].onPress?.();
        }
        await st.flushStorage();
        assert.equal(mutations, 0);
        assert.equal(showElapsed, true);
        assert.equal(st.getStoreState().session, before);
        assert.equal(JSON.stringify(st.getStoreState().session), raw);
        assert.deepEqual([...memory.entries()], disk);
        now += 12000;
        assert.deepEqual(matchProjection(before, now), projection);
        st = fresh(); await st.loadStore();
        assert.equal(JSON.stringify(st.getStoreState().session), raw);
        assert.deepEqual([...memory.entries()], disk);
        answer = true;
        ask();
        if (os !== "web") {
          assert.equal(mutations, 0, "opening a native dialog must not mutate");
          assert.equal(buttons[1].text, "Relancer");
          buttons[1].onPress!();
        }
        await st.flushStorage();
        const after = st.getStoreState().session as Session;
        assert.equal(mutations, 1);
        assert.equal(showElapsed, false);
        assert.equal(after.id, before.id);
        assert.equal(after.live!.matchId, before.live!.matchId);
        assert.deepEqual(after.teams, before.teams);
        assert.deepEqual(after.maracana, before.maracana);
        assert.deepEqual(after.matches, before.matches);
        assert.deepEqual(after.live!.score, [0, 0]);
        assert.equal(after.live!.periodIndex, 0);
        assert.equal(after.live!.stage, "ready");
        assert.equal(after.live!.chrono.runningSince, null);
        assert.equal(after.live!.chrono.accumulatedMs, 0);
        const resetRaw = JSON.stringify(after);
        assert.equal(memory.get("roundr.session.v1"), resetRaw);
        st = fresh(); await st.loadStore();
        assert.equal(JSON.stringify(st.getStoreState().session), resetRaw);
        console.log(`✓ ${mode}/${os}: cancel preserves session, score, period, time and durable bytes; confirm resets once, ready, same competition; reload preserves both outcomes`);
      }
    }
    assert.equal(confirmCalls, 4, "only the web adapter calls window.confirm");
  } finally {
    Date.now = originalNow;
    (globalThis as any).window = previousWindow;
  }
}
void run().catch(e => { console.error(e); process.exitCode = 1; });
