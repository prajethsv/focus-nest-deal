/**
 * Distraction blocker built on declarativeNetRequest DYNAMIC rules.
 *
 * Design notes (all deliberate):
 *  - No content scripts for blocking — sites are stopped with DNR only.
 *  - The pinned Spotify mini-player may inject a content script while pin is on;
 *    that is unrelated to blocking.
 *  - "declarativeNetRequest" alone lets us BLOCK main-frame requests.
 *  - To show the friendly blocked.html page we must REDIRECT, which Chrome
 *    only allows with host access. That is requested as an OPTIONAL permission
 *    the user can grant (or refuse) from the blocker settings. Without it the
 *    site is still blocked — just with Chrome's own error page.
 *  - Rules exist only while a FOCUS session is running, never during breaks.
 *  - The domain list is stored locally and never leaves the device.
 */
import { KEYS } from "../data/schema.js";
import * as storage from "./storage.js";

const RULE_ID_BASE = 9000;
const HOST_ACCESS = { origins: ["http://*/*", "https://*/*"] };

/** Accepts "twitter.com", "www.reddit.com", strips scheme/path, validates. */
export function normalizeDomain(input) {
  let value = String(input || "").trim().toLowerCase();
  if (!value) return null;
  value = value.replace(/^[a-z]+:\/\//, "").replace(/^www\./, "");
  value = value.split("/")[0].split("?")[0].split("#")[0].split(":")[0];
  const ok = /^(?!-)[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(value) && value.length <= 253;
  return ok ? value : null;
}

export const getBlocker = () => storage.get(KEYS.blocker);

export async function hasHostAccess() {
  try {
    return await chrome.permissions.contains(HOST_ACCESS);
  } catch {
    return false;
  }
}

/** Must be called from a user gesture (popup button click). */
export async function requestHostAccess() {
  const granted = await chrome.permissions.request(HOST_ACCESS);
  await storage.update(KEYS.blocker, { hostAccess: granted });
  await sync();
  return granted;
}

export async function dropHostAccess() {
  try {
    await chrome.permissions.remove(HOST_ACCESS);
  } catch {
    /* ignore */
  }
  await storage.update(KEYS.blocker, { hostAccess: false });
  await sync();
  return false;
}

export async function addDomain(input) {
  const domain = normalizeDomain(input);
  if (!domain) return { ok: false, error: "That doesn't look like a website address." };
  const blocker = await getBlocker();
  if (blocker.domains.includes(domain)) return { ok: false, error: `${domain} is already on the list.` };
  if (blocker.domains.length >= 50) return { ok: false, error: "The list is full (50 sites)." };
  await storage.update(KEYS.blocker, { domains: [...blocker.domains, domain] });
  await sync();
  return { ok: true, domain };
}

export async function removeDomain(domain) {
  const blocker = await getBlocker();
  await storage.update(KEYS.blocker, { domains: blocker.domains.filter((d) => d !== domain) });
  await sync();
}

export async function setEnabled(enabled) {
  await storage.update(KEYS.blocker, { enabled: Boolean(enabled) });
  await sync();
}

async function clearRules() {
  if (!chrome.declarativeNetRequest?.getDynamicRules) return;
  const existing = await chrome.declarativeNetRequest.getDynamicRules();
  const ids = existing.filter((r) => r.id >= RULE_ID_BASE).map((r) => r.id);
  if (ids.length) {
    await chrome.declarativeNetRequest.updateDynamicRules({ removeRuleIds: ids });
  }
}

function buildRules(domains, redirect) {
  return domains.map((domain, i) => ({
    id: RULE_ID_BASE + i,
    priority: 1,
    action: redirect
      ? {
          type: "redirect",
          redirect: {
            url: chrome.runtime.getURL(`blocked.html?site=${encodeURIComponent(domain)}`),
          },
        }
      : { type: "block" },
    condition: {
      requestDomains: [domain],
      resourceTypes: ["main_frame"],
    },
  }));
}

/**
 * Bring the live rules in line with settings + timer state.
 * Safe to call often; it is idempotent.
 */
export async function sync() {
  if (!chrome.declarativeNetRequest?.updateDynamicRules) return { active: false };
  const [blocker, timer] = await Promise.all([getBlocker(), storage.get(KEYS.timer)]);
  const focusing = timer.running && timer.phase === "focus";
  const shouldBlock = blocker.enabled && focusing && blocker.domains.length > 0;

  await clearRules();
  if (!shouldBlock) return { active: false };

  const redirect = await hasHostAccess();
  try {
    await chrome.declarativeNetRequest.updateDynamicRules({
      addRules: buildRules(blocker.domains, redirect),
    });
  } catch {
    // Fall back to plain blocking if the redirect target is refused.
    await chrome.declarativeNetRequest.updateDynamicRules({
      addRules: buildRules(blocker.domains, false),
    });
  }
  return { active: true, redirect };
}
