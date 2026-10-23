import * as S from "../src/domain/session";
import { matchTeams } from "../src/domain/bracket";
import {
  correctTournamentResult,
  createTournamentSession,
  tournamentProjection,
  unfinishedRevision,
} from "../src/domain/tournament-presentation";
import {
  tournamentDefaults,
  tournamentTeams,
} from "../src/features/tournament-config-state";
import {
  competitionKey,
  HISTORY_PREFIX,
  validCompetitionRecord,
} from "../src/store/competition-history";
import { validSession } from "../src/store/storage-validation";
import type { Session } from "../src/domain/types";
const builtin = (
  process as unknown as { getBuiltinModule: (id: string) => any }
).getBuiltinModule;
const assert = builtin("assert/strict"),
  req = builtin("module").createRequire(process.argv[1]);
const memory = new Map<string, string>(),
  faults = { history: false, session: false, backup: false },
  key = "roundr.session.v1";
const t0 = 1700000000000;
let now = t0;
(globalThis as any).__roundrTestModules = {
  "@react-native-async-storage/async-storage": {
    async getAllKeys() {
      return [...memory.keys()];
    },
    async getItem(k: string) {
      return memory.get(k) ?? null;
    },
    async setItem(k: string, value: string) {
      if (
        (faults.history && k.startsWith(HISTORY_PREFIX)) ||
        (faults.session && k === key) ||
        (faults.backup && k !== key)
      )
        throw Error("write rejected");
      memory.set(k, value);
    },
    async removeItem(k: string) {
      memory.delete(k);
    },
  },
  react: { useSyncExternalStore() {} },
  "@/src/audio/sounds": { async playSound() {} },
  "@/src/haptics": { async selectionAsync() {} },
};
const fresh = () => {
  delete req.cache[req.resolve("../src/store/session-store")];
  return req(
    "../src/store/session-store",
  ) as typeof import("../src/store/session-store");
};
const create = (mode: "cup" | "survie", n = 4) =>
  createTournamentSession(
    {
      ...tournamentDefaults(mode),
      draw: "manual",
      teamCount: n,
      sounds: false,
      smallFinal: n >= 4,
    },
    tournamentTeams(n),
    now,
  );
async function play(st: ReturnType<typeof fresh>) {
  now += 20000;
  st.dispatchSession(S.launchNext);
  st.dispatchSession(S.startReady);
  const s = st.getStoreState().session!,
    [a, b] = matchTeams(S.currentMatch(s)!, s.matches).map((id) =>
      Number(id!.slice(1)),
    );
  for (let i = 0; i < s.teams.length - Math.min(a, b) + 1; i++)
    st.dispatchSession((x, t) => S.goal(x, a < b ? 0 : 1, 1, t));
  now += 12345;
  st.dispatchSession(S.endManual);
  for (let i = 0; i < 20 && st.getStoreState().session?.cup?.tieChoice; i++) {
    const tc = st.getStoreState().session!.cup!.tieChoice!;
    st.dispatchSession((x, t) =>
      S.resolveTieChoice(x, tc.candidates.slice(0, tc.slots), t),
    );
  }
  await st.flushStorage();
}
async function run() {
  const original = Date.now;
  Date.now = () => now;
  try {
    for (const mode of ["cup", "survie"] as const) {
      memory.clear();
      now = t0;
      let st = fresh();
      await st.loadStore();
      assert(st.startSession(create(mode)));
      st.dispatchSession((x) => ({ ...x, tournamentView: "hub" }));
      await st.flushStorage();
      assert.equal(
        st.getStoreState().session!.sportingRules,
        "lovable-final-v1",
      );
      const ready = memory.get(key)!;
      st = fresh();
      await st.loadStore();
      assert.equal(memory.get(key), ready);
      assert.equal(
        st.getStoreState().session!.sportingRules,
        "lovable-final-v1",
      );
      const old = JSON.parse(ready);
      delete old.sportingRules;
      const oldRaw = JSON.stringify(old);
      memory.set(key, oldRaw);
      st = fresh();
      await st.loadStore();
      await st.flushStorage();
      assert.equal(st.getStoreState().session!.sportingRules, undefined);
      assert.equal(memory.get(key), oldRaw);
      const invalid = { ...old, sportingRules: "unknown" };
      assert.equal(validSession(invalid), false);
      memory.set(key, ready);
      st = fresh();
      await st.loadStore();
      assert.equal(st.getStoreState().session!.tournamentView, "hub");
      assert.equal(st.getStoreState().session!.live, null);
      for (
        let guard = 0;
        !tournamentProjection(st.getStoreState().session!).complete &&
        guard < 100;
        guard++
      )
        await play(st);
      const complete = st.getStoreState().session!;
      assert(validSession(complete));
      const entry = memory.get(competitionKey(complete.id))!;
      assert(entry);
      assert(
        validCompetitionRecord(JSON.parse(entry), competitionKey(complete.id)),
      );
      assert.equal(
        [...memory.keys()].filter((k) => k === competitionKey(complete.id))
          .length,
        1,
      );
      const result = S.currentMatch(complete)!;
      faults.history = true;
      st.dispatchSession((x, t) =>
        correctTournamentResult(
          x,
          result.id,
          [result.score![0] + 1, result.score![1]],
          null,
          t,
        ),
      );
      await st.flushStorage();
      assert.equal(memory.get(competitionKey(complete.id)), entry);
      assert(st.getStoreState().saveError);
      const currentRaw = memory.get(key)!;
      st = fresh();
      await st.loadStore();
      await st.flushStorage();
      assert.equal(memory.get(key), currentRaw);
      assert(st.getStoreState().saveError);
      faults.history = false;
      await st.retryStorage();
      assert.equal(st.getStoreState().saveError, null);
      const revised = JSON.parse(memory.get(competitionKey(complete.id))!);
      assert(validCompetitionRecord(revised, competitionKey(complete.id)));
      assert.deepEqual(
        revised.session.matches.find((m: any) => m.id === result.id).score,
        [result.score![0] + 1, result.score![1]],
      );
      const revisedRaw = memory.get(competitionKey(complete.id))!;
      memory.set(
        "roundr.summary.v1",
        JSON.stringify(JSON.parse(entry).session),
      );
      memory.set(key, "null");
      st = fresh();
      await st.loadStore();
      await st.flushStorage();
      assert.equal(memory.get(competitionKey(complete.id)), revisedRaw);
      console.log(
        `✓ ${mode}: hub/ready restoration, atomic history update, failed history write preserves durable archive, restart/retry updates exactly one entry; stale summary cannot roll it back`,
      );
    }
    memory.clear();
    now = t0;
    let st = fresh();
    await st.loadStore();
    assert(st.startSession(create("survie", 8)));
    for (
      let guard = 0;
      !tournamentProjection(st.getStoreState().session!).complete &&
      guard < 100;
      guard++
    )
      await play(st);
    const complete = st.getStoreState().session!,
      archived = memory.get(competitionKey(complete.id))!,
      first = complete.matches.find((m) => m.roundOf === 8)!;
    st.dispatchSession((x, t) =>
      correctTournamentResult(x, first.id, [0, 2], null, t),
    );
    await st.flushStorage();
    assert.equal(memory.get(competitionKey(complete.id)), archived);
    assert(
      unfinishedRevision(
        st.getStoreState().session,
        JSON.parse(archived).session,
      ),
    );
    st = fresh();
    await st.loadStore();
    assert(
      unfinishedRevision(
        st.getStoreState().session,
        JSON.parse(archived).session,
      ),
    );
    for (
      let guard = 0;
      !tournamentProjection(st.getStoreState().session!).complete &&
      guard < 100;
      guard++
    )
      await play(st);
    assert.notEqual(memory.get(competitionKey(complete.id)), archived);
    assert.equal(
      unfinishedRevision(
        st.getStoreState().session,
        JSON.parse(memory.get(competitionKey(complete.id))!).session,
      ),
      false,
    );
    console.log(
      "✓ A correction reopening the bracket preserves and identifies the prior palmarès until the competition is completed again",
    );

    for (const mode of ["cup", "survie"] as const) {
      memory.clear();
      now = t0;
      st = fresh();
      await st.loadStore();
      assert(st.startSession(create(mode, 8)));
      await play(st);
      const previous = S.currentMatch(st.getStoreState().session!)!;
      st.dispatchSession(S.launchNext);
      const preparedId = st.getStoreState().session!.live!.matchId;
      st.dispatchSession((s, t) =>
        correctTournamentResult(
          s,
          previous.id,
          [previous.score![0] + 1, previous.score![1]],
          null,
          t,
        ),
      );
      await st.flushStorage();
      const raw = memory.get(key)!;
      st = fresh();
      await st.loadStore();
      assert.equal(memory.get(key), raw);
      assert.equal(st.getStoreState().session!.live, null);
      assert.equal(
        st.getStoreState().session!.matches.find((m) => m.id === preparedId)!
          .status,
        "scheduled",
      );
      assert.equal(
        tournamentProjection(st.getStoreState().session!).next!.id,
        preparedId,
      );
    }
    console.log(
      "✓ A prepared next fixture stays selectable after a previous-result correction and a storage restart",
    );

    for (const step of ["choice", "ready"] as const) {
      memory.clear();
      now = t0;
      st = fresh();
      await st.loadStore();
      let s = createTournamentSession(
        {
          ...tournamentDefaults("survie"),
          teamCount: 2,
          draw: "manual",
          drawRule: "extraThenShootout",
          matchMin: 1,
          extraMin: 1,
        },
        tournamentTeams(2),
        now,
      );
      assert(st.startSession(s));
      st.dispatchSession(S.launchNext);
      st.dispatchSession(S.startReady);
      now += 60000;
      st.dispatchSession(S.advance);
      if (step === "ready") st.dispatchSession(S.prepareTournamentTiebreak);
      await st.flushStorage();
      const raw = memory.get(key)!;
      now += 9999999;
      st = fresh();
      await st.loadStore();
      assert.equal(memory.get(key), raw);
      s = st.getStoreState().session!;
      assert.equal(s.live!.tiebreakStep, step);
      assert.equal(s.live!.chrono.runningSince, null);
    }
    console.log(
      "✓ Choosing/preparing overtime survives a closed/reopened store without invented elapsed time or automatic start",
    );

    memory.clear();
    now = t0;
    st = fresh();
    await st.loadStore();
    assert(st.startSession(create("survie", 5)));
    await play(st);
    const interrupted = S.endSession(st.getStoreState().session!, now);
    faults.history = true;
    st.archiveSession(interrupted);
    await st.flushStorage();
    assert(st.getStoreState().saveError);
    assert.equal(st.startSession(create("cup")), false);
    faults.history = false;
    await st.retryStorage();
    assert.equal(st.getStoreState().saveError, null);
    const record = JSON.parse(memory.get(competitionKey(interrupted.id))!);
    assert.equal(record.status, "interrupted");
    assert.equal(
      record.session.matches.filter((m: any) => m.status === "finished").length,
      1,
    );
    st.archiveSession(interrupted);
    await st.flushStorage();
    assert.equal(
      st.getStoreState().competitions.filter((e) => e.id === interrupted.id)
        .length,
      1,
    );
    assert(st.startSession(create("cup")));
    await st.flushStorage();
    assert(memory.get(competitionKey(interrupted.id)));
    console.log(
      "✓ Interruption/repeated archival is idempotent; new sessions are blocked until failed history writes succeed",
    );

    memory.clear();
    const badVersion = { ...create("cup"), sportingRules: "unknown" };
    const badRaw = JSON.stringify(badVersion);
    memory.set(key, badRaw);
    st = fresh();
    await st.loadStore();
    await st.flushStorage();
    assert.equal(st.getStoreState().session, null);
    assert.equal(memory.get(key), badRaw);
    assert(st.getStoreState().saveError);
    assert([...memory.entries()].some(([k, v]) => k !== key && v === badRaw));
    memory.clear();
    now = t0;
    const invalid: Session = create("survie");
    invalid.tournamentView = "invalid" as any;
    const raw = JSON.stringify(invalid);
    memory.set(key, raw);
    st = fresh();
    await st.loadStore();
    assert.equal(st.getStoreState().session, null);
    assert.equal(memory.get(key), raw);
    assert(st.getStoreState().saveError);
    assert([...memory.entries()].some(([k, v]) => k !== key && v === raw));
    memory.clear();
    memory.set(key, raw);
    faults.backup = true;
    st = fresh();
    await st.loadStore();
    assert.equal(memory.get(key), raw);
    assert(
      st.getStoreState().saveError?.includes("Copie de secours impossible"),
    );
    faults.backup = false;
    console.log(
      "✓ Invalid tournament UI metadata is rejected; raw bytes are preserved and a failed backup is never reported as saved",
    );
  } finally {
    Date.now = original;
  }
}
void run().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
