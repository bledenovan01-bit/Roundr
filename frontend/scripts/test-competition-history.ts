import { defaultConfig, defaultTeams } from "../src/domain/defaults";
import * as S from "../src/domain/session";
import { competitionKey, HISTORY_PREFIX, snapshotCompetition, validCompetitionRecord } from "../src/store/competition-history";
import type { Session } from "../src/domain/types";
const builtin = (process as unknown as { getBuiltinModule: (id: string) => any }).getBuiltinModule;
const assert = builtin("assert/strict");
const req = builtin("module").createRequire(process.argv[1]) as { (id: string): unknown; cache: Record<string, unknown>; resolve: (id: string) => string };
const K = { session: "roundr.session.v1", summary: "roundr.summary.v1" };
const clone = <T,>(x: T): T => JSON.parse(JSON.stringify(x));
const at = 2_000_000;
function finished(kind: "cup" | "survie" = "survie", id = "old"): Session {
  const config = defaultConfig(kind);
  let s = S.createSession(config, defaultTeams(kind, "teamCount" in config ? config.teamCount : 2), at);
  s = { ...s, id }; s = S.startReady(s, at + 1);
  return S.endSession(s, at + 1000);
}
function deferred() { let release!: () => void; const promise = new Promise<void>(r => { release = r; }); return { promise, release }; }
function fixture(memory = new Map<string, string>()) {
  const badReads = new Set<string>(), badWrites = new Set<string>();
  let readGate: Promise<void> | null = null, writeGate: Promise<void> | null = null;
  let concurrent = 0, maximum = 0;
  const writes: string[] = [];
  const storage = {
    async getAllKeys() { if (readGate) await readGate; if (badReads.has("index")) throw Error("index"); return [...memory.keys()]; },
    async getItem(key: string) { if (readGate) await readGate; if (badReads.has(key)) throw Error("read"); return memory.get(key) ?? null; },
    async setItem(key: string, value: string) { concurrent++; maximum = Math.max(maximum, concurrent); try { if (writeGate) await writeGate; if (badWrites.has(key)) throw Error("write"); memory.set(key, value); writes.push(key); } finally { concurrent--; } },
    async removeItem(key: string) { if (badWrites.has(key)) throw Error("remove"); memory.delete(key); },
  };
  (globalThis as any).__roundrTestModules = { "@react-native-async-storage/async-storage": storage, react: { useSyncExternalStore() {} }, "@/src/audio/sounds": { async playSound() {} }, "@/src/haptics": { async selectionAsync() {} } };
  delete req.cache[req.resolve("../src/store/session-store")];
  const store = req("../src/store/session-store") as typeof import("../src/store/session-store");
  return { store, memory, badReads, badWrites, writes, maximum: () => maximum, pauseReads: (gate: Promise<void> | null) => { readGate = gate; }, pauseWrites: (gate: Promise<void> | null) => { writeGate = gate; } };
}
const tests: [string, () => void | Promise<void>][] = [];
const test = (label: string, run: () => void | Promise<void>) => tests.push([label, run]);

test("empty index is a readable empty history; old Cup/Survie summaries backfill once", async () => {
  const empty = fixture(); await empty.store.loadStore(); assert(empty.store.getStoreState().historyAvailable); assert.deepEqual(empty.store.getStoreState().competitions, []);
  for (const mode of ["cup", "survie"] as const) {
    const s = finished(mode), f = fixture(new Map([[K.summary, JSON.stringify(s)]])); await f.store.loadStore();
    assert.equal(f.store.getStoreState().competitions.length, 1);
    const raw = f.memory.get(competitionKey(s.id)); assert(raw); assert(validCompetitionRecord(JSON.parse(raw!), competitionKey(s.id)));
    const next = fixture(f.memory); await next.store.loadStore(); assert.equal(next.store.getStoreState().competitions.length, 1); assert.equal(next.memory.get(competitionKey(s.id)), raw);
  }
});
test("snapshots retain all results/configuration and are independent of the active object", () => {
  const s = finished(), before = clone(s), entry = snapshotCompetition(s);
  entry.session.teams[0].name = "changed"; assert.deepEqual(s, before);
  assert.deepEqual(snapshotCompetition(s).session, before);
  assert.equal(validCompetitionRecord({ ...snapshotCompetition(s), summary: {} }, competitionKey(s.id)), false);
  assert.equal(validCompetitionRecord({ ...snapshotCompetition(s), endedAt: -1 }, competitionKey(s.id)), false);
});
test("automatic finished Survie archives before opening the summary", async () => {
  const f = fixture(); await f.store.loadStore();
  const cfg = { ...defaultConfig("survie"), teamCount: 2, end: { byTime: true, goalTarget: 1 } };
  const s = S.createSession(cfg, defaultTeams("survie", 2), at);
  assert(f.store.startSession(s)); f.store.dispatchSession(S.startReady);
  f.store.dispatchSession((active, now) => S.goal(active, 0, 1, now)); await f.store.flushStorage();
  const state = f.store.getStoreState(); assert.equal(state.competitions.length, 1); assert.equal(state.competitions[0].status, "finished"); assert.equal(state.competitions[0].summary.podium[0].place, 1); assert.equal(state.lastSummary, null);
  assert.deepEqual(state.competitions[0].session.matches.find(m => m.stage === "ko" && m.roundOf === 2)?.score, [1, 0]);
});
test("interrupted competition archives and a new session cannot be erased by completion", async () => {
  const f = fixture(); await f.store.loadStore(); const s = finished();
  f.store.archiveSession(s); assert.equal(f.store.startSession(finished("cup", "new")), false);
  await f.store.flushStorage(); assert.equal(f.store.getStoreState().competitions[0].status, "interrupted");
  const fresh = S.createSession(defaultConfig("classique"), defaultTeams("classique", 2), at + 9000);
  assert(f.store.startSession(fresh)); await f.store.flushStorage(); assert.equal(JSON.parse(f.memory.get(K.session)!).id, fresh.id); assert.equal(JSON.parse(f.memory.get(K.summary)!).id, s.id);
});
test("a complete Cup retains group results, qualification, final and podium after restart", async () => {
  const f = fixture(); await f.store.loadStore();
  const config = { ...defaultConfig("cup"), teamCount: 4, groups: 1, qualifiersPerGroup: 2, draw: "manual" as const, end: { byTime: true, goalTarget: 1 } };
  f.store.startSession(S.createSession(config, defaultTeams("cup", 4), at));
  for (let guard = 0; guard < 20 && !S.sessionComplete(f.store.getStoreState().session!); guard++) {
    f.store.dispatchSession(S.startReady);
    f.store.dispatchSession((s, now) => S.goal(s, 0, 1, now));
    const choice = f.store.getStoreState().session!.cup?.tieChoice;
    if (choice) f.store.dispatchSession((s, now) => S.resolveTieChoice(s, choice.candidates.slice(0, choice.slots), now));
    if (!S.sessionComplete(f.store.getStoreState().session!)) f.store.dispatchSession((s, now) => S.launchNext(s, now, true));
  }
  await f.store.flushStorage(); const entry = f.store.getStoreState().competitions[0];
  assert(entry); assert.equal(entry.status, "finished"); assert.equal(entry.session.matches.filter(m => m.stage === "group" && m.status === "finished").length, 6);
  assert.equal(entry.session.cup!.qualifiedIds.length, 2); assert.equal(entry.summary.podium.length, 2);
  const next = fixture(f.memory); await next.store.loadStore(); assert.deepEqual(next.store.getStoreState().competitions[0], entry);
});
test("updating an archived result preserves its custom name and all other competitions", async () => {
  const s = finished(), f = fixture(new Map([[K.summary, JSON.stringify(s)]])); await f.store.loadStore();
  await f.store.renameCompetition(s.id, "Tournoi du quartier"); const updated = { ...s, teams: s.teams.map((team, i) => i ? team : { ...team, name: "Les Renards" }) };
  f.store.archiveSession(updated); await f.store.flushStorage();
  assert.equal(f.store.getStoreState().competitions.length, 1); assert.equal(f.store.getStoreState().competitions[0].name, "Tournoi du quartier"); assert.deepEqual(f.store.getStoreState().competitions[0].session, updated);
});
test("failed archive retains previous durable session, blocks replacement, then retries", async () => {
  const s = finished(), f = fixture(new Map([[K.session, JSON.stringify(s)]])); f.badWrites.add(competitionKey(s.id));
  await f.store.loadStore(); f.store.archiveSession(s); await f.store.flushStorage();
  assert.equal(f.store.getStoreState().competitions.length, 0); assert(f.store.getStoreState().saveError);
  assert.equal(f.memory.get(K.session), JSON.stringify(s)); assert.equal(f.store.startSession(finished("cup", "new")), false);
  f.badWrites.clear(); await f.store.retryStorage(); assert.equal(f.store.getStoreState().competitions.length, 1); assert.equal(f.store.getStoreState().saveError, null); assert.equal(JSON.parse(f.memory.get(K.summary)!).id, s.id);
});
test("restart after an archive write failure recovers from the original session", async () => {
  const s = finished(), f = fixture(new Map([[K.session, JSON.stringify(s)]])); f.badWrites.add(competitionKey(s.id)); await f.store.loadStore();
  const next = fixture(new Map(f.memory)); await next.store.loadStore(); assert.equal(next.store.getStoreState().competitions.length, 1); assert.deepEqual(next.store.getStoreState().competitions[0].session, s);
});
test("renaming commits only after durable write; default name can be restored", async () => {
  const s = finished(), f = fixture(new Map([[K.summary, JSON.stringify(s)]])); await f.store.loadStore(); const gate = deferred(); f.pauseWrites(gate.promise);
  const original = clone(f.store.getStoreState().competitions[0]), saving = f.store.renameCompetition(s.id, "Finale du dimanche");
  await Promise.resolve(); assert.deepEqual(f.store.getStoreState().competitions[0], original); gate.release(); assert(await saving);
  assert.equal(f.store.getStoreState().competitions[0].name, "Finale du dimanche"); f.pauseWrites(null);
  const next = fixture(f.memory); await next.store.loadStore(); assert.equal(next.store.getStoreState().competitions[0].name, "Finale du dimanche");
  assert(await next.store.renameCompetition(s.id, "  ")); assert.equal(next.store.getStoreState().competitions[0].name, original.name);
});
test("failed rename/delete leaves entry unchanged and generic retry cannot apply it later", async () => {
  for (const action of ["rename", "delete"]) {
    const s = finished(), f = fixture(new Map([[K.summary, JSON.stringify(s)]])); await f.store.loadStore(); const before = f.memory.get(competitionKey(s.id)); f.badWrites.add(competitionKey(s.id));
    assert.equal(await (action === "rename" ? f.store.renameCompetition(s.id, "Rejected") : f.store.deleteCompetition(s.id)), false);
    assert.equal(f.memory.get(competitionKey(s.id)), before); assert.equal(f.store.getStoreState().competitions.length, 1); assert(f.store.getStoreState().saveError);
    f.badWrites.clear(); await f.store.retryStorage(); assert.equal(f.memory.get(competitionKey(s.id)), before); assert.equal(f.store.getStoreState().saveError, null);
  }
});
test("deletion is durable, does not resurrect from old summary, and changes no other resource", async () => {
  const s = finished(), other = snapshotCompetition(finished("cup", "other"));
  const f = fixture(new Map([[K.summary, JSON.stringify(s)], [competitionKey(other.id), JSON.stringify(other)], ["roundr.free-timer.v1", "null"]])); await f.store.loadStore();
  const summary = f.memory.get(K.summary), unrelated = f.memory.get(competitionKey(other.id));
  assert(await f.store.deleteCompetition(s.id)); const next = fixture(f.memory); await next.store.loadStore();
  assert.deepEqual(next.store.getStoreState().competitions.map(c => c.id), [other.id]); assert.equal(f.memory.get(K.summary), summary); assert.equal(f.memory.get(competitionKey(other.id)), unrelated);
  assert.equal(JSON.parse(f.memory.get(competitionKey(s.id))!).deleted, true);
});
test("unreadable index is never presented as a valid empty history and can be retried", async () => {
  const s = finished(), raw = JSON.stringify(snapshotCompetition(s)), f = fixture(new Map([[competitionKey(s.id), raw]])); f.badReads.add("index"); await f.store.loadStore();
  assert.equal(f.store.getStoreState().historyAvailable, false); assert(f.store.getStoreState().saveError); assert.equal(f.memory.get(competitionKey(s.id)), raw);
  f.badReads.clear(); await f.store.retryStorage(); assert(f.store.getStoreState().historyAvailable); assert.equal(f.store.getStoreState().competitions.length, 1); assert.equal(f.store.getStoreState().saveError, null);
});
test("invalid JSON/incomplete records are preserved raw, refused, and never overwritten", async () => {
  for (const raw of ["{invalid", "{}", JSON.stringify({ schema: 1, id: "bad", session: {} })]) {
    const s = finished(), good = snapshotCompetition(s), key = competitionKey("bad"), f = fixture(new Map([[key, raw], [competitionKey(s.id), JSON.stringify(good)]])); await f.store.loadStore();
    assert.equal(f.store.getStoreState().historyAvailable, false); assert.equal(f.store.getStoreState().competitions.length, 1); assert.equal(f.memory.get(key), raw);
    assert([...f.memory].some(([k, v]) => k.startsWith("roundr.competitions.rejected.") && v === raw)); assert(f.store.getStoreState().saveError?.includes("Valeur brute conservée"));
  }
});
test("archive read failure preserves its raw value and other archives remain usable", async () => {
  const s = finished(), key = competitionKey(s.id), raw = JSON.stringify(snapshotCompetition(s)), f = fixture(new Map([[key, raw]])); f.badReads.add(key); await f.store.loadStore();
  assert.equal(f.store.getStoreState().historyAvailable, false); assert.equal(f.memory.get(key), raw); assert.equal(await f.store.deleteCompetition(s.id), false);
  f.badReads.clear(); await f.store.retryStorage(); assert.equal(f.store.getStoreState().competitions.length, 1); assert.equal(f.store.getStoreState().saveError, null);
});
test("failed raw backup is reported truthfully", async () => {
  const key = competitionKey("bad"), f = fixture(new Map([[key, "{invalid"]])); f.badWrites.add("roundr.competitions.rejected.v1.bad"); await f.store.loadStore();
  assert(f.store.getStoreState().saveError?.includes("Copie de secours impossible")); assert.equal(f.memory.get(key), "{invalid"); assert.equal(f.memory.has("roundr.competitions.rejected.v1.bad"), false);
});
test("single-flight loading blocks history mutations; rapid records serialize without loss", async () => {
  const s = finished(), f = fixture(new Map([[K.summary, JSON.stringify(s)]])), gate = deferred(); f.pauseReads(gate.promise);
  const a = f.store.loadStore(), b = f.store.loadStore(); assert.equal(a, b); assert.equal(await f.store.deleteCompetition(s.id), false); assert.equal(f.store.startSession(s), false);
  gate.release(); await a; f.pauseReads(null);
  f.store.archiveSession(finished("cup", "second")); f.store.archiveSession(finished("survie", "third")); await f.store.flushStorage();
  assert.equal(f.store.getStoreState().competitions.length, 3); assert.equal(f.maximum(), 1); assert.equal([...f.memory.keys()].filter(k => k.startsWith(HISTORY_PREFIX)).length, 3);
  assert.equal(JSON.parse(f.memory.get(K.summary)!).id, "third");
});
const realNow = Date.now; Date.now = () => at + 2000;
(async () => { for (const [label, run] of tests) { await run(); console.log("✓ " + label); } console.log(`${tests.length} competition history scenarios passed`); })().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => { Date.now = realNow; });
