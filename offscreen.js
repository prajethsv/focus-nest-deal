/** Offscreen audio document: plays the generated chime on request. */
import { configureSound, playChime } from "./src/sound.js";

chrome.runtime.onMessage.addListener((msg) => {
  if (msg?.type !== "focus-nest:chime") return;
  configureSound({ soundChime: true, soundVolume: msg.volume ?? 0.5 });
  playChime();
});
