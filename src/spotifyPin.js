/**
 * Pinned Spotify mini-player: keep a now-playing snapshot in storage and
 * dynamically inject a floating overlay onto open http(s) tabs.
 *
 * Content scripts are only injected while pin is on (and host access granted).
 */
import { KEYS } from "../data/schema.js";
import * as storage from "./storage.js";
import * as spotify from "./spotify.js";
import { extractColors, FALLBACK_COLORS } from "./color.js";
import * as blocker from "./blocker.js";

export const POLL_ALARM = "focus-nest:spotify-poll";
const POLL_MS = 4000;
const OVERLAY_JS = "overlay/player.js";
const OVERLAY_CSS = "overlay/player.css";

let lastColorsKey = null;
let cachedColors = { ...FALLBACK_COLORS };
let pollInFlight = false;

export async function isPinned() {
  const ui = await storage.get(KEYS.spotifyUi);
  return Boolean(ui?.pinned);
}

export async function getSnapshot() {
  return storage.get(KEYS.spotifyNowPlaying);
}

async function writeSnapshot(snap) {
  await storage.set(KEYS.spotifyNowPlaying, snap);
  return snap;
}

async function colorsFor(art, trackId) {
  const key = trackId || art || "";
  if (key && key === lastColorsKey) return cachedColors;
  const colors = art ? await extractColors(art) : { ...FALLBACK_COLORS };
  lastColorsKey = key;
  cachedColors = colors;
  return colors;
}

/** Refresh Spotify now-playing into storage (for popup + overlays). */
export async function refreshNowPlaying() {
  if (pollInFlight) return getSnapshot();
  pollInFlight = true;
  try {
    if (!(await spotify.isConnected())) {
      lastColorsKey = null;
      return writeSnapshot(null);
    }
    let now;
    try {
      now = await spotify.getNowPlaying();
    } catch (err) {
      if (err?.code === "no_auth") {
        await setPinned(false);
        return writeSnapshot(null);
      }
      // Keep last snapshot on transient errors
      return getSnapshot();
    }
    if (!now) {
      lastColorsKey = null;
      return writeSnapshot({
        id: null,
        title: null,
        artist: null,
        album: null,
        art: null,
        isPlaying: false,
        colors: { ...FALLBACK_COLORS },
        updatedAt: Date.now(),
        empty: true,
      });
    }
    const colors = await colorsFor(now.art, now.id);
    return writeSnapshot({
      ...now,
      colors,
      empty: false,
      updatedAt: Date.now(),
    });
  } finally {
    pollInFlight = false;
  }
}

function canInjectTab(tab) {
  if (!tab?.id || !tab.url) return false;
  return /^https?:\/\//i.test(tab.url);
}

async function injectTab(tabId) {
  try {
    await chrome.scripting.insertCSS({ target: { tabId }, files: [OVERLAY_CSS] });
  } catch {
    /* may already be inserted */
  }
  try {
    await chrome.scripting.executeScript({ target: { tabId }, files: [OVERLAY_JS] });
  } catch {
    /* restricted page or missing host access */
  }
}

export async function injectAllTabs() {
  if (!(await blocker.hasHostAccess())) return;
  let tabs = [];
  try {
    tabs = await chrome.tabs.query({ url: ["http://*/*", "https://*/*"] });
  } catch {
    return;
  }
  await Promise.all(tabs.filter(canInjectTab).map((t) => injectTab(t.id)));
}

/** Tell overlays to tear down (storage pin flag is the source of truth). */
export async function notifyOverlaysRemoved() {
  try {
    const tabs = await chrome.tabs.query({ url: ["http://*/*", "https://*/*"] });
    await Promise.all(
      tabs.map((t) =>
        chrome.tabs.sendMessage(t.id, { type: "focus-nest:overlay-remove" }).catch(() => {})
      )
    );
  } catch {
    /* ignore */
  }
}

export async function schedulePoll() {
  try {
    await chrome.alarms.create(POLL_ALARM, { when: Date.now() + POLL_MS });
  } catch {
    /* ignore */
  }
}

export async function clearPoll() {
  try {
    await chrome.alarms.clear(POLL_ALARM);
  } catch {
    /* ignore */
  }
}

/**
 * Enable or disable the pinned overlay. Caller must obtain host access on a
 * user gesture before pinning (popup does this).
 */
export async function setPinned(pinned) {
  const next = Boolean(pinned);
  if (next) {
    if (!(await blocker.hasHostAccess())) {
      throw new Error("Site access is needed to show the mini player on pages.");
    }
    if (!(await spotify.isConnected())) {
      throw new Error("Connect Spotify before pinning the player.");
    }
    await storage.update(KEYS.spotifyUi, { pinned: true });
    await refreshNowPlaying();
    await injectAllTabs();
    await schedulePoll();
  } else {
    await storage.update(KEYS.spotifyUi, { pinned: false });
    await clearPoll();
    await notifyOverlaysRemoved();
  }
  return next;
}

/** Pin after requesting optional host access (must run from a user gesture). */
export async function pinWithHostAccess() {
  if (!(await blocker.hasHostAccess())) {
    const granted = await blocker.requestHostAccess();
    if (!granted) {
      throw new Error("Allow site access to pin the mini player over websites.");
    }
  }
  return setPinned(true);
}

export async function onAlarm(alarm) {
  if (alarm?.name !== POLL_ALARM) return false;
  if (!(await isPinned())) {
    await clearPoll();
    return true;
  }
  await refreshNowPlaying();
  await schedulePoll();
  return true;
}

export async function onTabUpdated(tabId, changeInfo, tab) {
  if (!(await isPinned())) return;
  if (changeInfo.status !== "complete") return;
  if (!canInjectTab(tab)) return;
  await injectTab(tabId);
}

export async function restoreIfPinned() {
  if (!(await isPinned())) return;
  if (!(await blocker.hasHostAccess()) || !(await spotify.isConnected())) {
    await storage.update(KEYS.spotifyUi, { pinned: false });
    return;
  }
  await refreshNowPlaying();
  await injectAllTabs();
  await schedulePoll();
}
