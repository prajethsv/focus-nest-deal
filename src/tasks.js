import { KEYS, makeTask, todayKey } from "../data/schema.js";
import * as storage from "./storage.js";
import { recordTaskCompleted } from "./stats.js";

export const list = () => storage.get(KEYS.tasks);

export async function add(text) {
  const clean = String(text || "").trim().slice(0, 120);
  if (!clean) return null;
  const task = makeTask(clean);
  await storage.update(KEYS.tasks, (tasks) => [...tasks, task]);
  return task;
}

export async function toggle(id) {
  let delta = 0;
  let dayKey = todayKey();

  await storage.update(KEYS.tasks, (tasks) =>
    tasks.map((t) => {
      if (t.id !== id) return t;
      const done = !t.done;

      if (done) {
        // Being completed right now — credit goes to today.
        delta = 1;
        dayKey = todayKey();
      } else {
        // Being un-completed — reverse the credit on the day it was
        // ORIGINALLY completed, not today, so past-day stats stay correct
        // instead of drifting whenever an old task gets unchecked later.
        delta = -1;
        dayKey = t.completedAt ? todayKey(new Date(t.completedAt)) : todayKey();
      }

      return { ...t, done, completedAt: done ? Date.now() : null };
    })
  );

  if (delta) await recordTaskCompleted(delta, dayKey);
}

export async function remove(id) {
  await storage.update(KEYS.tasks, (tasks) => tasks.filter((t) => t.id !== id));
}

export async function clear() {
  await storage.set(KEYS.tasks, []);
}
