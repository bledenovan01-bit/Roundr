import { buildSummary, type Summary } from "@/src/domain/summary";
import type { Session } from "@/src/domain/types";
import { validSession } from "./storage-validation";

// Native schema, deliberately distinct from the incompatible Lovable web data.
// One atomic record per competition; deletion is a durable tombstone.
export const HISTORY_PREFIX = "roundr.competitions.v1.entry.";
export const HISTORY_INDEX = "roundr.competitions.v1.index";
export const competitionKey = (id: string) => HISTORY_PREFIX + encodeURIComponent(id);
export type Competition = {
  schema: 1; id: string; name: string; kind: "cup" | "survie";
  status: "finished" | "interrupted"; createdAt: number; endedAt: number;
  session: Session; summary: Summary;
};
export type CompetitionRecord = Competition | { schema: 1; id: string; deleted: true };
export const competitionName = (kind: "cup" | "survie", at: number) => `${kind === "cup" ? "Cup" : "Survie"} du ${new Date(at).toLocaleDateString("fr-FR")}`;
export const isCompetition = (s: Session): boolean => (s.mode === "cup" || s.mode === "survie") && s.status !== "active";
function validArchivedSession(s: Session): boolean {
  return validSession(s) && isCompetition(s) && [s.createdAt, s.updatedAt, s.endedAt ?? s.updatedAt].every(t => Number.isFinite(new Date(t).getTime())) &&
    s.matches.every(m => typeof m.label === "string" && ["group", "ko", "small"].includes(m.stage) && m.playedMs >= 0 &&
      (m.stage === "group" ? typeof m.groupId === "string" && !!s.cup?.groups.some(g => g.id === m.groupId) : Number.isInteger(m.roundOf) && (m.roundOf ?? 0) >= 2));
}

export function snapshotCompetition(session: Session, previous?: Competition): Competition {
  if (!validArchivedSession(session)) throw Error("Compétition invalide");
  const copy = JSON.parse(JSON.stringify(session)) as Session;
  return { schema: 1, id: copy.id, kind: copy.mode as "cup" | "survie", status: copy.status as "finished" | "interrupted", createdAt: copy.createdAt, endedAt: previous?.endedAt ?? copy.endedAt ?? copy.updatedAt,
    name: previous?.name ?? (("name" in copy.config && copy.config.name?.trim()) || competitionName(copy.mode as "cup" | "survie", copy.createdAt)), session: copy, summary: buildSummary(copy) };
}

function canonical(value: unknown): string {
  if (Array.isArray(value)) return "[" + value.map(canonical).join(",") + "]";
  if (value && typeof value === "object") return "{" + Object.entries(value).sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => JSON.stringify(k) + ":" + canonical(v)).join(",") + "}";
  return JSON.stringify(value);
}
export function validCompetitionRecord(value: unknown, key: string): value is CompetitionRecord {
  try {
    if (!value || typeof value !== "object" || Array.isArray(value)) return false;
    const c = value as CompetitionRecord;
    if (c.schema !== 1 || typeof c.id !== "string" || !c.id || competitionKey(c.id) !== key) return false;
    if ("deleted" in c) return c.deleted === true && Object.keys(c).every(k => ["schema", "id", "deleted"].includes(k));
    return typeof c.name === "string" && !!c.name.trim() && c.name.length <= 40 && validArchivedSession(c.session) && c.id === c.session.id && c.kind === c.session.mode && c.status === c.session.status &&
      Number.isFinite(c.createdAt) && c.createdAt === c.session.createdAt && Number.isFinite(c.endedAt) && c.endedAt >= c.createdAt && c.session.matches.every(m => Number.isFinite(m.playedMs) && m.playedMs >= 0) && canonical(c.summary) === canonical(buildSummary(c.session));
  } catch { return false; }
}

export const sortedCompetitions = (entries: Competition[]) => [...entries].sort((a, b) => b.endedAt - a.endedAt || a.id.localeCompare(b.id));
