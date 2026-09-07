/**
 * Focus Nest storage schema (chrome.storage.local).
 *
 * Every top-level key is versioned and independently readable so future
 * features (achievements, pets, eggs, room decor, farm) can be added without
 * migrating unrelated data.
 */
export const SCHEMA_VERSION = 6;

export const KEYS = {
  meta: "meta",
  settings: "settings",
  tasks: "tasks",
  timer: "timer",
  stats: "stats",
  sessions: "sessions", // individual completed focus sessions (history)
  spotify: "spotifyAuth", // tokens only; never client secrets
  spotifyAuthPending: "spotifyAuthPending", // in-flight tab OAuth { verifier, state, tabId, createdAt }
  spotifyUi: "spotifyUi", // pin / player chrome (not tokens)
  spotifyNowPlaying: "spotifyNowPlaying", // shared snapshot for popup + page overlay
  companion: "companion",
  blocker: "blocker",
  // Reserved for later features — intentionally unused for now.
  achievements: "achievements",
  room: "room",
};

export const TIMER_PRESETS = [5, 10, 25, 50];

export const DEFAULTS = {
  [KEYS.meta]: { schemaVersion: SCHEMA_VERSION, onboarded: false, installedAt: null },
  [KEYS.settings]: {
    appearance: "system", // "light" | "dark" | "system"
    environment: "cozy",
    focusMinutes: 25,
    shortBreakMinutes: 5,
    longBreakMinutes: 15,
    sessionsBeforeLongBreak: 4,
    autoStartNext: false,
    showQuotes: true,
    // sound design
    soundClicks: true,
    soundChime: true,
    soundVolume: 0.5, // 0..1
    // motion / decoration
    animations: true,
    // pre-focus ritual
    ritualEnabled: true,
  },
  [KEYS.tasks]: [], // { id, text, done, createdAt, completedAt, tags: [] }
  [KEYS.timer]: {
    phase: "focus", // "focus" | "shortBreak" | "longBreak"
    running: false,
    endsAt: null, // epoch ms while running
    remainingMs: null, // while paused
    completedFocusInCycle: 0,
    phaseStartedAt: null, // epoch ms the current phase was first started
  },
  [KEYS.stats]: { days: {}, streak: 0, lastActiveDay: null }, // days: { "YYYY-MM-DD": { focusSessions, focusMinutes, tasksCompleted } }
  /**
   * Individual completed focus sessions, newest first. Aggregates in `stats`
   * are kept as-is; this is the extensible per-session record used by History
   * (and later streaks / achievements).
   * { id, day: "YYYY-MM-DD", startedAt, endedAt, minutes, mode: "focus" }
   */
  [KEYS.sessions]: [],
  [KEYS.spotify]: null, // { accessToken, refreshToken, expiresAt, scope }
  [KEYS.spotifyAuthPending]: null,
  [KEYS.spotifyUi]: { pinned: false, corner: "bottom-right" }, // corner: bottom-right | bottom-left | top-right | top-left
  /**
   * Latest now-playing snapshot for the popup gradient + pinned page overlay.
   * { id, title, artist, album, art, isPlaying, colors: { a, b, c }, updatedAt }
   */
  [KEYS.spotifyNowPlaying]: null,

  /**
   * Gentle progression. `pet` holds the customizable companion look;
   * eggs / pets arrays stay reserved for later multi-creature nests.
   */
  [KEYS.companion]: {
    stage: "egg", // "egg" | "hatchling" | "fledgling" | "companion"
    name: null,
    totalFocusMinutes: 0,
    totalFocusSessions: 0,
    milestonesSeen: [], // stage ids already celebrated
    pet: {
      body: "#e8b86d",
      belly: "#fff6e8",
      cheek: "#f0a0a0",
      eye: "#3b2d20",
      accent: "#c48a3a",
      pattern: "spots",
    },
    pets: [], // [{ id, species, stage, bornAt }]
    eggs: [], // [{ id, species, progress }]
    items: [], // room / farm items, later
  },
  [KEYS.blocker]: {
    enabled: false,
    domains: [], // ["twitter.com", ...] validated, local only
    hostAccess: false, // true once the user grants optional host access
    blockedCount: 0,
  },

  // ---- Reserved, extensible models (not implemented yet) ----
  [KEYS.achievements]: { unlocked: [] }, // [{ id, unlockedAt }]
  [KEYS.room]: { items: [], layout: {} },
};

/** Empty task factory so shape stays consistent everywhere. */
export function makeTask(text) {
  return {
    id: crypto.randomUUID(),
    text,
    done: false,
    createdAt: Date.now(),
    completedAt: null,
    tags: [],
  };
}

export const todayKey = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
