import { KEYS } from "./data/schema.js";
import * as storage from "./src/storage.js";
import { remainingMs, formatMs } from "./src/timer.js";

const params = new URLSearchParams(location.search);
const site = params.get("site");
if (site) document.getElementById("site").textContent = site;

let redirected = false;

/**
 * Once the focus session has ended, the blocker's dynamic rule for this
 * domain has already been removed (timer.js calls syncBlocker() on every
 * phase change), so navigating to the real site now will actually reach it
 * instead of bouncing back here. This is what makes the page's promise
 * ("It will open again the moment your session ends") true.
 */
function goBackToSite() {
  if (redirected || !site) return;
  redirected = true;
  location.href = `https://${site}/`;
}

async function render() {
  const [timer, settings] = await Promise.all([
    storage.get(KEYS.timer),
    storage.get(KEYS.settings),
  ]);
  const meta = document.getElementById("meta");
  if (timer.running && timer.phase === "focus") {
    meta.textContent = `${formatMs(remainingMs(timer, settings))} left in this focus session.`;
  } else if (site) {
    meta.textContent = "Session ended — taking you back…";
    goBackToSite();
  } else {
    meta.textContent = "Your session has ended — you can close this tab.";
  }
}

render();
setInterval(render, 1000);
