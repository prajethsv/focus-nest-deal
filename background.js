/**
 * Service worker: keeps the Pomodoro honest while the popup is closed,
 * plays the end-of-phase chime through an offscreen document, and keeps the
 * distraction blocker rules in sync with the timer.
 */
import { ALARM_NAME, advance } from "./src/timer.js";
import * as timerApi from "./src/timer.js";
import * as blockerApi from "./src/blocker.js";
import * as spotifyApi from "./src/spotify.js";
import * as spotifyPin from "./src/spotifyPin.js";
import { migrate } from "./src/storage.js";
import { sync as syncBlocker } from "./src/blocker.js";
import * as storage from "./src/storage.js";
import { KEYS, DEFAULTS } from "./data/schema.js";

chrome.runtime.onInstalled.addListener(async () => {
  await migrate();
  const { meta } = await chrome.storage.local.get(KEYS.meta);
  if (!meta) {
    await chrome.storage.local.set({
      [KEYS.meta]: { ...DEFAULTS[KEYS.meta], installedAt: Date.now() },
    });
  }
  await syncBlocker();
  await spotifyPin.restoreIfPinned();
});

chrome.runtime.onStartup?.addListener(async () => {
  await syncBlocker();
  await spotifyPin.restoreIfPinned();
});

/** Chrome can only play audio from a document, so use a tiny offscreen one. */
async function playChimeOffscreen(volume) {
  if (!chrome.offscreen) return;
  try {
    const has = await chrome.offscreen.hasDocument?.();
    if (!has) {
      await chrome.offscreen.createDocument({
        url: "offscreen.html",
        reasons: ["AUDIO_PLAYBACK"],
        justification: "Play a short chime when a focus session ends.",
      });
    }
    await chrome.runtime.sendMessage({ type: "focus-nest:chime", volume });
  } catch {
    /* audio is a nicety — never break the timer over it */
  }
}

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (await spotifyPin.onAlarm(alarm)) return;
  if (alarm.name !== ALARM_NAME) return;
  const settings = await storage.get(KEYS.settings);
  await advance({ credit: true });
  if (settings.soundChime) await playChimeOffscreen(settings.soundVolume);
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  void spotifyPin.onTabUpdated(tabId, changeInfo, tab);
});

/**
 * Actions that MUST run here, not in the popup. The timer/blocker ones end
 * with an `await syncBlocker()` chain (storage write -> permission check ->
 * declarativeNetRequest.updateDynamicRules); the Spotify ones open a real
 * Spotify tab (Connect opens a full tab, not an auth popup). Either way, if the
 * popup runs this itself and then loses focus — which happens the instant a
 * new tab opens, or the instant the user clicks through to a site they
 * just blocked — Chrome tears the popup's script down mid-flight and the
 * action silently never finishes. The service worker has no such lifecycle
 * tied to the popup, so routing these calls here is what makes them
 * reliable regardless of what the popup does immediately after.
 */
const ACTIONS = {
  "timer:start": () => timerApi.start(),
  "timer:pause": () => timerApi.pause(),
  "timer:reset": () => timerApi.reset(),
  "timer:skip": () => timerApi.skip(),
  "timer:syncIfElapsed": () => timerApi.syncIfElapsed(),
  "blocker:addDomain": (msg) => blockerApi.addDomain(msg.input),
  "blocker:removeDomain": (msg) => blockerApi.removeDomain(msg.domain),
  "blocker:setEnabled": (msg) => blockerApi.setEnabled(msg.enabled),
  "blocker:requestHostAccess": () => blockerApi.requestHostAccess(),
  "blocker:dropHostAccess": () => blockerApi.dropHostAccess(),
  "spotify:connect": () => spotifyApi.connect(),
  "spotify:disconnect": async () => {
    await spotifyPin.setPinned(false);
    await spotifyApi.disconnect();
    await storage.set(KEYS.spotifyNowPlaying, null);
  },
  "spotify:togglePlayback": async () => {
    const result = await spotifyApi.togglePlayback();
    await spotifyPin.refreshNowPlaying();
    return result;
  },
  "spotify:next": async () => {
    const result = await spotifyApi.next();
    await spotifyPin.refreshNowPlaying();
    return result;
  },
  "spotify:previous": async () => {
    const result = await spotifyApi.previous();
    await spotifyPin.refreshNowPlaying();
    return result;
  },
  "spotify:pin": () => spotifyPin.pinWithHostAccess(),
  "spotify:unpin": () => spotifyPin.setPinned(false),
  "spotify:refreshNowPlaying": () => spotifyPin.refreshNowPlaying(),
  "spotify:getPinned": () => spotifyPin.isPinned(),
};

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  const handler = ACTIONS[msg?.type];
  if (!handler) return false; // not one of ours — let other listeners handle it
  handler(msg)
    .then((result) => sendResponse({ ok: true, result }))
    .catch((err) => sendResponse({ ok: false, error: err?.message || String(err) }));
  return true; // keep the message channel open for the async sendResponse
});
