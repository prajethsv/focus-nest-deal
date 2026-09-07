import { KEYS } from "../data/schema.js";
import * as storage from "./storage.js";
import { recordFocusSession } from "./stats.js";
import { recordSession } from "./history.js";
import { creditFocus } from "./companion.js";
import { sync as syncBlocker } from "./blocker.js";

export const ALARM_NAME = "focus-nest-phase-end";
const MIN = 60 * 1000;

export function phaseLabel(phase) {
  return phase === "focus" ? "Focus" : phase === "shortBreak" ? "Short break" : "Long break";
}

export function phaseDurationMs(phase, settings) {
  if (phase === "focus") return settings.focusMinutes * MIN;
  if (phase === "shortBreak") return settings.shortBreakMinutes * MIN;
  return settings.longBreakMinutes * MIN;
}

/** Remaining ms, derived so the timer survives popup closes and restarts. */
export function remainingMs(timer, settings) {
  if (timer.running && timer.endsAt) return Math.max(0, timer.endsAt - Date.now());
  if (timer.remainingMs != null) return Math.max(0, timer.remainingMs);
  return phaseDurationMs(timer.phase, settings);
}

/**
 * True when the current phase has not been started yet (fresh, untouched).
 * A fresh phase can safely adopt a new duration; a started one must not, so a
 * countdown in progress is never corrupted.
 */
export function isPhaseFresh(timer) {
  return !timer.running && timer.remainingMs == null && !timer.phaseStartedAt;
}

export function formatMs(ms) {
  const total = Math.ceil(ms / 1000);
  const m = String(Math.floor(total / 60)).padStart(2, "0");
  const s = String(total % 60).padStart(2, "0");
  return `${m}:${s}`;
}

async function scheduleAlarm(endsAt) {
  await chrome.alarms.clear(ALARM_NAME);
  if (endsAt) await chrome.alarms.create(ALARM_NAME, { when: endsAt });
}

export async function start() {
  const [timer, settings] = await Promise.all([
    storage.get(KEYS.timer),
    storage.get(KEYS.settings),
  ]);
  if (timer.running) return timer;
  const left = remainingMs(timer, settings) || phaseDurationMs(timer.phase, settings);
  const endsAt = Date.now() + left;
  await scheduleAlarm(endsAt);
  const next = await storage.update(KEYS.timer, {
    running: true,
    endsAt,
    remainingMs: null,
    phaseStartedAt: timer.phaseStartedAt || Date.now(),
  });
  await syncBlocker();
  return next;
}

export async function pause() {
  const [timer, settings] = await Promise.all([
    storage.get(KEYS.timer),
    storage.get(KEYS.settings),
  ]);
  if (!timer.running) return timer;
  const left = remainingMs(timer, settings);
  await chrome.alarms.clear(ALARM_NAME);
  const next = await storage.update(KEYS.timer, {
    running: false,
    endsAt: null,
    remainingMs: left,
  });
  await syncBlocker();
  return next;
}

export async function reset() {
  await chrome.alarms.clear(ALARM_NAME);
  const next = await storage.update(KEYS.timer, {
    phase: "focus",
    running: false,
    endsAt: null,
    remainingMs: null,
    completedFocusInCycle: 0,
    phaseStartedAt: null,
  });
  await syncBlocker();
  return next;
}

/**
 * Apply a new focus length. An active or partly-used session is never
 * destroyed: the new length is adopted right away only when the focus phase
 * is still fresh, otherwise it applies from the next focus session.
 * Returns { minutes, appliedNow }.
 */
export async function applyFocusPreset(minutes) {
  const clean = Math.min(120, Math.max(1, Math.round(minutes)));
  await storage.update(KEYS.settings, { focusMinutes: clean });
  const timer = await storage.get(KEYS.timer);
  const appliedNow = timer.phase === "focus" && isPhaseFresh(timer);
  if (appliedNow) {
    await storage.update(KEYS.timer, { remainingMs: null, endsAt: null });
  }
  return { minutes: clean, appliedNow };
}

/**
 * Apply a break length. Same rule: only adopted immediately when the current
 * break phase is fresh.
 */
export async function applyBreakLength(key, minutes, max = 60) {
  const clean = Math.min(max, Math.max(1, Math.round(minutes)));
  await storage.update(KEYS.settings, { [key]: clean });
  const timer = await storage.get(KEYS.timer);
  const phase = key === "shortBreakMinutes" ? "shortBreak" : "longBreak";
  const appliedNow = timer.phase === phase && isPhaseFresh(timer);
  if (appliedNow) await storage.update(KEYS.timer, { remainingMs: null, endsAt: null });
  return { minutes: clean, appliedNow };
}

/**
 * Already accounts for every transition correctly, including the
 * longBreak -> focus case (cycle count resets to 0 there), so callers can
 * use its `completedFocusInCycle` result directly without re-checking it.
 */
function nextPhase(timer, settings) {
  if (timer.phase !== "focus") {
    return {
      phase: "focus",
      completedFocusInCycle: timer.phase === "longBreak" ? 0 : timer.completedFocusInCycle,
    };
  }
  const done = timer.completedFocusInCycle + 1;
  const long = done >= settings.sessionsBeforeLongBreak;
  return { phase: long ? "longBreak" : "shortBreak", completedFocusInCycle: done };
}

/**
 * Advance to the next phase. `credit` records stats, history and companion
 * growth for a genuinely completed focus session (false when the user skipped).
 * Returns { timer, newStage, credited } so the popup can celebrate growth.
 */
export async function advance({ credit } = { credit: true }) {
  const [timer, settings] = await Promise.all([
    storage.get(KEYS.timer),
    storage.get(KEYS.settings),
  ]);
  let newStage = null;
  let credited = false;
  if (credit && timer.phase === "focus") {
    await recordFocusSession(settings.focusMinutes);
    await recordSession({
      startedAt: timer.phaseStartedAt,
      endedAt: timer.endsAt && timer.endsAt <= Date.now() ? timer.endsAt : Date.now(),
      minutes: settings.focusMinutes,
      mode: "focus",
    });
    ({ newStage } = await creditFocus(settings.focusMinutes));
    credited = true;
  }
  const { phase, completedFocusInCycle } = nextPhase(timer, settings);
  const autostart = settings.autoStartNext;
  const duration = phaseDurationMs(phase, settings);
  const endsAt = autostart ? Date.now() + duration : null;
  await scheduleAlarm(endsAt);
  const next = await storage.update(KEYS.timer, {
    phase,
    completedFocusInCycle,
    running: autostart,
    endsAt,
    remainingMs: null,
    phaseStartedAt: autostart ? Date.now() : null,
  });
  await syncBlocker();
  return { timer: next, newStage, credited };
}

export const skip = () => advance({ credit: false });

/** Called from the popup on open: catch up if the alarm fired while asleep. */
export async function syncIfElapsed() {
  const timer = await storage.get(KEYS.timer);
  if (timer.running && timer.endsAt && timer.endsAt <= Date.now()) {
    const { newStage, credited } = await advance({ credit: true });
    return { elapsed: true, newStage, credited };
  }
  await syncBlocker();
  return { elapsed: false, newStage: null, credited: false };
}
