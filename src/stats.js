import { KEYS, todayKey } from "../data/schema.js";
import * as storage from "./storage.js";

const emptyDay = () => ({ focusSessions: 0, focusMinutes: 0, tasksCompleted: 0 });

export async function getToday() {
  const stats = await storage.get(KEYS.stats);
  return { ...emptyDay(), ...(stats.days?.[todayKey()] || {}) };
}

export async function getStats() {
  return storage.get(KEYS.stats);
}

function isYesterday(dayKey) {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return dayKey === todayKey(d);
}

/**
 * Update one day's bucket. `dayKey` defaults to today, but callers can pass
 * a different day — e.g. un-completing a task that was originally finished
 * yesterday — so historical stats stay accurate instead of always mutating
 * today's bucket.
 *
 * NOTE: this function intentionally does NOT touch the streak. Streak is
 * only ever advanced by `bumpStreakForToday`, so a write to a backdated day
 * can never inflate or corrupt the current streak.
 */
async function bump(patchDay, dayKey = todayKey()) {
  return storage.update(KEYS.stats, (stats) => {
    const days = { ...(stats.days || {}) };
    days[dayKey] = patchDay({ ...emptyDay(), ...(days[dayKey] || {}) });

    // Keep 90 days of history; enough for later progress features.
    const trimmed = Object.fromEntries(
      Object.entries(days).sort(([a], [b]) => (a < b ? 1 : -1)).slice(0, 90)
    );
    return { ...stats, days: trimmed };
  });
}

/**
 * Advance the streak for genuine activity happening right now (today).
 * Kept separate from `bump` on purpose: a backdated stats write (e.g.
 * un-completing an old task) must never touch the streak.
 */
async function bumpStreakForToday() {
  return storage.update(KEYS.stats, (stats) => {
    const key = todayKey();
    if (stats.lastActiveDay === key) return stats; // already counted today
    const streak = isYesterday(stats.lastActiveDay) ? (stats.streak || 0) + 1 : 1;
    return { ...stats, streak, lastActiveDay: key };
  });
}

/** A focus session just finished right now, so it always credits today. */
export async function recordFocusSession(minutes) {
  await bump((day) => ({
    ...day,
    focusSessions: day.focusSessions + 1,
    focusMinutes: day.focusMinutes + Math.round(minutes),
  }));
  await bumpStreakForToday();
}

/**
 * Credit or reverse a task completion on a specific day (defaults to today).
 * Pass the task's original `completedAt` day when reversing a completion so
 * the correct historical day is corrected instead of today's.
 */
export async function recordTaskCompleted(delta = 1, dayKey = todayKey()) {
  await bump(
    (day) => ({ ...day, tasksCompleted: Math.max(0, day.tasksCompleted + delta) }),
    dayKey
  );
  // Only a completion happening today should be able to extend the streak.
  if (dayKey === todayKey()) await bumpStreakForToday();
}
