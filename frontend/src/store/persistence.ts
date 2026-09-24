import { defaultTeams } from "../domain/defaults";
import type { Preset, Session } from "../domain/types";
import { validateConfig } from "../domain/validate";

export type SavedState = { version: 2; session: Session | null; lastSummary: Session | null; presets: Preset[] };
export type StorageAdapter = { getItem(key: string): Promise<string | null>; setItem(key: string, value: string): Promise<unknown> };
export const STATE_KEY = "roundr.state.v2";
export const BACKUP_KEY = "roundr.state.backup.v2";
// Runtime JSON validation deliberately precedes all typed domain access.
const obj = (v: unknown): v is Record<string, any> => !!v && typeof v === "object" && !Array.isArray(v);
const num = (v: unknown) => typeof v === "number" && Number.isFinite(v) && v >= 0;
const score = (v: unknown) => Array.isArray(v) && v.length === 2 && v.every(n => Number.isSafeInteger(n) && n >= 0);

export function validSession(value: unknown): value is Session {
  if (!obj(value) || !obj(value.config) || !Array.isArray(value.teams)) return false;
  const s = value as Session;
  if ((s.mode !== "maracana" && s.maracana !== null) || (s.mode !== "cup" && s.cup !== null)) return false;
  if (validateConfig(s.config, s.teams).length || s.mode !== s.config.mode || typeof s.id !== "string" || !["active", "finished", "interrupted"].includes(s.status) || !num(s.createdAt) || !num(s.updatedAt)) return false;
  if (!Array.isArray(s.matches) || !s.matches.length || s.matches.some(m => !obj(m))) return false;
  const teamIds = new Set(s.teams.map(t => t.id));
  const matchIds = new Set(s.matches.map(m => m.id));
  if (matchIds.size !== s.matches.length) return false;
  const slot = (x: unknown): boolean => obj(x) && (x.kind === "team" ? teamIds.has(x.teamId) : x.kind === "winner" || x.kind === "loser" ? matchIds.has(x.matchId) : x.kind === "tbd" && typeof x.label === "string");
  if (s.matches.some(m => typeof m.id !== "string" || !slot(m.a) || !slot(m.b) || !["scheduled", "live", "finished", "bye"].includes(m.status) || (m.score !== null && !score(m.score)) || (m.shootout !== null && !score(m.shootout)) || (m.winnerId !== null && !teamIds.has(m.winnerId)) || !num(m.playedMs))) return false;
  const seen = new Set<string>();
  for (const m of s.matches) {
    if (typeof m.label !== "string" || !Number.isSafeInteger(m.order) || !["single", "rotation", "group", "ko", "small"].includes(m.stage)) return false;
    for (const slot of [m.a, m.b]) if ((slot.kind === "winner" || slot.kind === "loser") && !seen.has(slot.matchId)) return false;
    seen.add(m.id);
  }
  if (!obj(s.live) || !matchIds.has(s.live.matchId)) return false;
  const l = s.live, c = l.chrono;
  if (!["period", "break", "awaitPeriod", "additional", "extra", "golden", "shootout", "finished"].includes(l.stage) || !obj(c) || !score(l.score) || !Array.isArray(l.periodMs) || !l.periodMs.length || l.periodMs.some(x => !num(x)) || !Number.isInteger(l.periodIndex) || l.periodIndex < 0 || l.periodIndex >= l.periodMs.length || !num(l.playedMs) || !num(l.breakMs) || !num(l.extraMs) || !Array.isArray(l.firedAlerts) || l.firedAlerts.some(x => typeof x !== "string") || !obj(l.end) || typeof l.end.byTime !== "boolean" || !num(c.accumulatedMs) || (c.runningSince !== null && !num(c.runningSince))) return false;
  if (typeof l.scoreOn !== "boolean" || typeof l.additional !== "boolean" || typeof l.maracanaExtension !== "boolean" || typeof l.extensionUsed !== "boolean" || typeof l.finishCount !== "boolean" || !num(l.startedAt) || (l.drawRule !== null && !["shootout", "extraThenShootout", "golden"].includes(l.drawRule)) || (l.end.goalTarget !== null && (!Number.isSafeInteger(l.end.goalTarget) || l.end.goalTarget < 1))) return false;
  const ids = (v: unknown): v is string[] => Array.isArray(v) && v.every(id => teamIds.has(id));
  if (s.mode === "maracana") {
    const m = s.maracana;
    if (!m || !Array.isArray(m.waiting) || !Array.isArray(m.onField) || !Array.isArray(m.initialOrder) || !obj(m.consecutive) || m.onField.length !== 2 || [...m.onField, ...m.waiting].some(id => !teamIds.has(id))) return false;
  }
  if (s.maracana) {
    const m = s.maracana;
    if (!ids(m.lastOut) || !ids(m.initialOrder) || new Set([...m.onField, ...m.waiting]).size !== s.teams.length || Object.values(m.consecutive).some(n => !Number.isSafeInteger(n) || n < 0)) return false;
  }
  if (s.mode === "cup") {
    const cup = s.cup;
    if (!cup || !Array.isArray(cup.groups) || !Array.isArray(cup.qualifiedIds) || !["groups", "knockout"].includes(cup.phase) || cup.groups.some(g => !g || !Array.isArray(g.teamIds) || g.teamIds.some(id => !teamIds.has(id)))) return false;
    if (cup.tieChoice !== null && (!obj(cup.tieChoice) || !Array.isArray(cup.tieChoice.candidates) || !Number.isInteger(cup.tieChoice.slots))) return false;
  }
  if (s.cup) {
    const c = s.cup;
    if (!ids(c.qualifiedIds) || c.groups.some(g => typeof g.id !== "string" || typeof g.name !== "string")) return false;
    if (c.tieChoice && (!ids(c.tieChoice.candidates) || typeof c.tieChoice.context !== "string" || c.tieChoice.slots < 1 || c.tieChoice.slots > c.tieChoice.candidates.length)) return false;
    if (c.qualificationChoices !== undefined && (!obj(c.qualificationChoices) || Object.values(c.qualificationChoices).some(v => !ids(v)))) return false;
  }
  if (s.preFinish !== null && (!obj(s.preFinish) || !validSession({ ...s, ...s.preFinish, preFinish: null }))) return false;
  return true;
}

export function validPreset(p: unknown): p is Preset {
  return obj(p) && typeof p.id === "string" && typeof p.name === "string" && !!p.name.trim() && num(p.createdAt) && obj(p.config) && p.config.mode === "custom" && (p.teams === null || Array.isArray(p.teams)) && !validateConfig(p.config as Preset["config"], p.teams ?? defaultTeams("custom", 2)).length;
}
function decode(raw: string): SavedState {
  const x = JSON.parse(raw);
  if (!obj(x) || x.version !== 2 || (x.session !== null && !validSession(x.session)) || (x.lastSummary !== null && !validSession(x.lastSummary)) || !Array.isArray(x.presets) || !x.presets.every(validPreset)) throw new Error("Sauvegarde incompatible.");
  return x as SavedState;
}

// Serialized atomic snapshots: archive and active session are never separate writes.
export function createPersistence(storage: StorageAdapter) {
  let committed: string | null = null;
  let tail: Promise<unknown> = Promise.resolve();
  const preserve = async (raw: string, label: string) => storage.setItem(`roundr.corrupt.${label}.${Date.now()}`, raw);
  return {
    async load(): Promise<{ data: SavedState; warning: string | null }> {
      const empty: SavedState = { version: 2, session: null, lastSummary: null, presets: [] };
      const raw = await storage.getItem(STATE_KEY);
      if (raw !== null) {
        try { const data = decode(raw); committed = raw; return { data, warning: null }; }
        catch {
          await preserve(raw, "state");
          const backup = await storage.getItem(BACKUP_KEY);
          if (backup) {
            try { const data = decode(backup); committed = backup; return { data, warning: "Dernière sauvegarde illisible : copie précédente restaurée." }; }
            catch { await preserve(backup, "backup"); }
          }
          return { data: empty, warning: "Sauvegarde illisible conservée à part. Aucune session restaurable." };
        }
      }
      const warnings: string[] = [];
      const data = { ...empty };
      for (const [key, field] of [["roundr.session.v1", "session"], ["roundr.summary.v1", "lastSummary"], ["roundr.presets.v1", "presets"]] as const) {
        const value = await storage.getItem(key);
        if (value === null) continue;
        try {
          const parsed = JSON.parse(value);
          if (field === "presets") {
            if (!Array.isArray(parsed) || !parsed.every(validPreset)) throw new Error();
            data.presets = parsed;
          } else {
            if (obj(parsed) && parsed.mode === "maracana" && obj(parsed.config) && Array.isArray(parsed.teams)) parsed.config.teamCount = parsed.teams.length;
            if (parsed !== null && !validSession(parsed)) throw new Error();
            data[field] = parsed;
          }
        } catch { await preserve(value, field); warnings.push(field === "presets" ? "Presets invalides conservés à part." : "Session illisible conservée à part."); }
      }
      return { data, warning: warnings.join(" ") || null };
    },
    save(data: SavedState): Promise<void> {
      const raw = JSON.stringify(data);
      const operation = tail.then(async () => {
        if (committed) await storage.setItem(BACKUP_KEY, committed);
        await storage.setItem(STATE_KEY, raw);
        committed = raw;
      });
      tail = operation.catch(() => {});
      return operation;
    },
    async flush() { await tail; },
  };
}

