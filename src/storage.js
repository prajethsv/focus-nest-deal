import { DEFAULTS, KEYS, SCHEMA_VERSION } from "../data/schema.js";

const area = () => chrome.storage.local;

export async function get(key) {
  const res = await area().get(key);
  const value = res[key];
  const fallback = DEFAULTS[key];
  if (value === undefined || value === null) {
    if (Array.isArray(fallback)) return [...fallback];
    return isPlainObject(fallback) ? { ...fallback } : fallback;
  }
  if (isPlainObject(fallback) && isPlainObject(value)) return { ...fallback, ...value };
  return value;
}


export async function set(key, value) {
  await area().set({ [key]: value });
  return value;
}

export async function update(key, patch) {
  const current = await get(key);
  const next = typeof patch === "function" ? patch(current) : { ...current, ...patch };
  return set(key, next);
}

export async function clearAll() {
  await area().clear();
}

export function onChange(handler) {
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === "local") handler(changes);
  });
}

/** One-time migration from the 0.1 flat keys ("theme", "tasks" as {text,done}). */
export async function migrate() {
  const raw = await area().get(null);
  const meta = { ...DEFAULTS[KEYS.meta], ...(raw[KEYS.meta] || {}) };
  if (meta.schemaVersion === SCHEMA_VERSION && raw[KEYS.settings]) return;

  const settings = { ...DEFAULTS[KEYS.settings], ...(raw[KEYS.settings] || {}) };
  if (typeof raw.theme === "string") settings.environment = raw.theme;

  let tasks = raw[KEYS.tasks];
  if (Array.isArray(tasks) && tasks.some((t) => t && t.id === undefined)) {
    tasks = tasks.map((t) => ({
      id: crypto.randomUUID(),
      text: String(t.text ?? ""),
      done: Boolean(t.done),
      createdAt: Date.now(),
      completedAt: t.done ? Date.now() : null,
      tags: [],
    }));
  }

  await area().set({
    [KEYS.meta]: { ...meta, schemaVersion: SCHEMA_VERSION, installedAt: meta.installedAt ?? Date.now() },
    [KEYS.settings]: settings,
    [KEYS.tasks]: Array.isArray(tasks) ? tasks : [],
  });
  await area().remove(["theme"]);
}

function isPlainObject(v) {
  return v !== null && typeof v === "object" && !Array.isArray(v);
}

