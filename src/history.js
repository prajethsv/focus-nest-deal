/**
 * Study history — one local record per genuinely COMPLETED focus session.
 * Interrupted, reset or skipped sessions are never recorded here.
 * Aggregate day totals in `stats` are untouched; this is additive.
 */
import { KEYS, todayKey } from "../data/schema.js";
import * as storage from "./storage.js";

const MAX_SESSIONS = 2000; // ~years of use; keeps storage small

export const listSessions = () => storage.get(KEYS.sessions);

/** Record a finished focus session. `startedAt` may be null (unknown start). */
export async function recordSession({ startedAt, endedAt = Date.now(), minutes, mode = "focus" }) {
  const safeMinutes = Math.max(0, Math.round(minutes || 0));
  const started = startedAt || endedAt - safeMinutes * 60000;
  const record = {
    id: crypto.randomUUID(),
    day: todayKey(new Date(endedAt)),
    startedAt: started,
    endedAt,
    minutes: safeMinutes,
    mode,
  };
  await storage.update(KEYS.sessions, (list) =>
    [record, ...(Array.isArray(list) ? list : [])].slice(0, MAX_SESSIONS)
  );
  return record;
}

/** Sessions for one day key, oldest first (reads naturally as a timeline). */
export async function sessionsForDay(dayKey) {
  const all = await listSessions();
  return all.filter((s) => s.day === dayKey).sort((a, b) => a.startedAt - b.startedAt);
}

/**
 * Month summary: { "YYYY-MM-DD": { sessions, minutes } } for the given
 * year/month (month is 0-indexed, matching Date).
 */
export async function monthSummary(year, month) {
  const all = await listSessions();
  const prefix = `${year}-${String(month + 1).padStart(2, "0")}-`;
  const out = {};
  for (const s of all) {
    if (!s.day?.startsWith(prefix)) continue;
    const bucket = (out[s.day] ??= { sessions: 0, minutes: 0 });
    bucket.sessions += 1;
    bucket.minutes += s.minutes || 0;
  }
  return out;
}

export function formatClock(ts) {
  return new Date(ts).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}
