import { KEYS, TIMER_PRESETS, todayKey } from "./data/schema.js";
import { ENVIRONMENTS } from "./data/environments.js";
import { randomQuote } from "./data/quotes.js";
import * as storage from "./src/storage.js";
import * as tasks from "./src/tasks.js";
import * as timer from "./src/timer.js";
import * as stats from "./src/stats.js";
import * as history from "./src/history.js";
import * as spotify from "./src/spotify.js";
import * as blocker from "./src/blocker.js";
import * as companion from "./src/companion.js";
import { renderDecor } from "./src/decor.js";
import { configureSound, playClick, playChime, playMilestone } from "./src/sound.js";
import { applyAppearance, watchSystemAppearance } from "./src/appearance.js";
import { applyColors, clearColors, FALLBACK_COLORS, extractColors } from "./src/color.js";
import { artForStage, PET_PRESETS, normalizePet } from "./src/petArt.js";

const $ = (id) => document.getElementById(id);
let settings;
let spotifyPollTimer = null;
let lastSpotifyTrackId = null;
let nestAnimTimer = null;

/**
 * Ask the background service worker to run a timer/blocker write action,
 * instead of running it here in the popup. The popup's own script context
 * is torn down the instant it loses focus (e.g. the user clicks straight
 * through to the site they just blocked), which can silently cut off an
 * in-flight declarativeNetRequest update. The service worker has no such
 * lifecycle, so this is what makes "Start" and the blocker list reliable.
 */
function callBackground(type, payload = {}) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage({ type, ...payload }, (response) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }
      if (!response?.ok) {
        reject(new Error(response?.error || "Something went wrong."));
        return;
      }
      resolve(response.result);
    });
  });
}

// ---------- screens ----------
function show(screen) {
  for (const id of ["onboarding", "main"]) $(id).hidden = id !== screen;
}

// ---------- tabs ----------
const TABS = ["study", "nest", "history", "settings"];
let activeTab = "study";

function selectTab(name, { focus = false } = {}) {
  if (!TABS.includes(name)) return;
  activeTab = name;
  for (const id of TABS) {
    const tab = $(`tab-${id}`);
    const panel = $(`panel-${id}`);
    const on = id === name;
    tab.setAttribute("aria-selected", String(on));
    tab.tabIndex = on ? 0 : -1;
    panel.hidden = !on;
  }
  if (focus) $(`tab-${name}`).focus();
  void refreshTab(name);
}

async function refreshTab(name) {
  if (name === "study") await renderTasks();
  if (name === "nest") await renderNest();
  if (name === "history") await renderHistory();
  if (name === "settings") {
    renderSettings();
    await renderBlocker();
  }
}

function wireTabs() {
  TABS.forEach((id, i) => {
    const tab = $(`tab-${id}`);
    tab.addEventListener("click", () => {
      playClick();
      selectTab(id);
    });
    tab.addEventListener("keydown", (e) => {
      const dir = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
      if (dir) {
        e.preventDefault();
        selectTab(TABS[(i + dir + TABS.length) % TABS.length], { focus: true });
      } else if (e.key === "Home" || e.key === "End") {
        e.preventDefault();
        selectTab(e.key === "Home" ? TABS[0] : TABS[TABS.length - 1], { focus: true });
      }
    });
  });
}

function syncSound() {
  configureSound(settings);
  const on = settings.soundClicks || settings.soundChime;
  const btn = $("sound-btn");
  btn.textContent = on ? "🔔" : "🔕";
  btn.setAttribute("aria-pressed", String(!on));
  btn.setAttribute("aria-label", on ? "Mute sounds" : "Unmute sounds");
}

function paintEnvironment() {
  applyAppearance(settings);
  renderDecor($("decor-layer"), settings.environment, settings.animations);
}

// ---------- environments ----------
function renderEnvButtons(container, current, onPick) {
  container.replaceChildren(
    ...ENVIRONMENTS.map((env) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "env-btn";
      btn.setAttribute("role", "radio");
      btn.setAttribute("aria-checked", String(env.id === current));
      btn.setAttribute("aria-label", `${env.label} — ${env.description}`);
      btn.title = `${env.label} — ${env.description}`;
      btn.innerHTML = `${env.emoji}<small>${env.label}</small>`;
      btn.addEventListener("click", () => {
        playClick();
        onPick(env.id);
      });
      return btn;
    })
  );
}

async function pickEnvironment(id) {
  settings = await storage.update(KEYS.settings, { environment: id });
  paintEnvironment();
  renderEnvButtons($("env-picker"), id, pickEnvironment);
  renderEnvButtons($("onboard-envs"), id, pickEnvironment);
}

// ---------- presets ----------
function renderPresets() {
  $("preset-row").replaceChildren(
    ...TIMER_PRESETS.map((mins) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "preset-btn";
      btn.textContent = `${mins}m`;
      btn.setAttribute("aria-pressed", String(settings.focusMinutes === mins));
      btn.setAttribute("aria-label", `Focus for ${mins} minutes`);
      btn.addEventListener("click", async () => {
        playClick();
        const { minutes, appliedNow } = await timer.applyFocusPreset(mins);
        settings = await storage.get(KEYS.settings);
        $("timer-live").textContent = appliedNow
          ? `Focus length set to ${minutes} minutes.`
          : `Focus length set to ${minutes} minutes, from the next focus session.`;
        renderPresets();
        renderSettings();
        await renderTimer();
      });
      return btn;
    })
  );
}

// ---------- timer (exactly one interval, created once) ----------
let cachedTimer = null;

function paintTimerFace(t) {
  const left = timer.remainingMs(t, settings);
  const total = timer.phaseDurationMs(t.phase, settings);
  $("timer-display").textContent = timer.formatMs(left);
  $("timer-progress").style.width = `${Math.min(100, Math.max(0, (1 - left / total) * 100))}%`;
  return left;
}

async function renderTimer() {
  const t = await storage.get(KEYS.timer);
  cachedTimer = t;
  paintTimerFace(t);
  $("session-label").textContent = timer.phaseLabel(t.phase);

  const cycle = settings.sessionsBeforeLongBreak;
  const n = Math.min(cycle, t.completedFocusInCycle + (t.phase === "focus" ? 1 : 0)) || 1;
  $("timer-meta").textContent =
    t.phase === "focus" ? `Session ${n} of ${cycle}` : "Take a breath";
  $("start-btn").disabled = t.running;
  $("start-btn").textContent = timer.isPhaseFresh(t) ? "Start" : "Resume";
  $("pause-btn").disabled = !t.running;

  const fresh = timer.isPhaseFresh(t);
  $("session-note").textContent = fresh
    ? ""
    : t.running
      ? `Running · ${settings.focusMinutes} min focus. Length changes apply to the next session.`
      : "Paused · length changes apply to the next session.";

  const b = await blocker.getBlocker();
  const note = $("blocker-note");
  if (b.enabled && b.domains.length) {
    note.hidden = false;
    note.textContent =
      t.running && t.phase === "focus"
        ? `Blocking ${b.domains.length} site${b.domains.length > 1 ? "s" : ""} while you focus.`
        : `${b.domains.length} site${b.domains.length > 1 ? "s" : ""} will be blocked during focus.`;
  } else {
    note.hidden = true;
  }
}

let finishing = false;

async function onPhaseFinished() {
  if (finishing) return;
  finishing = true;
  try {
    const { newStage, credited } = await callBackground("timer:syncIfElapsed");
    playChime();
    $("timer-live").textContent = "Session finished.";
    await celebrate(newStage, { credited });
    await renderTimer();
    await Promise.all([renderStats(), refreshTab(activeTab)]);
  } finally {
    finishing = false;
  }
}

/** The single ticker for the whole popup lifetime. */
function startTicker() {
  setInterval(() => {
    if (!cachedTimer?.running) return;
    const left = paintTimerFace(cachedTimer);
    if (left <= 0) void onPhaseFinished();
  }, 1000);
}

// ---------- dialogs (ritual + confirm) ----------
let dialogPending = null; // { resolve, overlay }

function closeDialog(result) {
  const pending = dialogPending;
  dialogPending = null;
  document.removeEventListener("keydown", onDialogKey);
  if (!pending) return;
  pending.overlay.hidden = true;
  pending.resolve(result);
  pending.restore?.focus?.();
}

function onDialogKey(e) {
  if (!dialogPending) return;
  if (e.key === "Escape") {
    e.preventDefault();
    closeDialog(false);
  }
  if (e.key === "Tab") {
    const focusable = [...dialogPending.overlay.querySelectorAll("button")];
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }
}

function openDialog(overlayId, focusId) {
  if (dialogPending) closeDialog(false); // never leave a stale overlay open
  const overlay = $(overlayId);
  return new Promise((resolve) => {
    dialogPending = { resolve, overlay, restore: document.activeElement };
    overlay.hidden = false;
    document.addEventListener("keydown", onDialogKey);
    requestAnimationFrame(() => $(focusId).focus());
  });
}

const runRitual = () => openDialog("ritual", "ritual-start");
const confirmSkip = () => openDialog("confirm", "confirm-cancel");

function wireDialogs() {
  $("ritual-start").addEventListener("click", () => {
    playClick();
    closeDialog(true);
  });
  $("ritual-skip").addEventListener("click", () => {
    playClick();
    closeDialog(false);
  });
  $("confirm-ok").addEventListener("click", () => {
    playClick();
    closeDialog(true);
  });
  $("confirm-cancel").addEventListener("click", () => {
    playClick();
    closeDialog(false);
  });
}

// ---------- nest / companion ----------
function paintNestArt(c, { stageId = null, cracked = false, motion = null } = {}) {
  const stage = companion.stageForMinutes(c.totalFocusMinutes);
  const pet = normalizePet(c.pet);
  const el = $("nest-art");
  el.innerHTML = artForStage(stageId || stage.id, pet, { cracked });
  el.classList.remove("is-cracking", "is-hatched", "is-happy");
  if (motion) {
    el.classList.add(motion);
    clearTimeout(nestAnimTimer);
    nestAnimTimer = setTimeout(() => {
      el.classList.remove("is-cracking", "is-hatched", "is-happy");
      // After a crack flourish on egg, redraw without crack lines.
      if (motion === "is-cracking" && (stageId || stage.id) === "egg") {
        el.innerHTML = artForStage("egg", pet, { cracked: false });
      }
    }, 900);
  }
}

function syncPetDesigner(c) {
  const pet = normalizePet(c.pet);
  const stage = companion.stageForMinutes(c.totalFocusMinutes);
  $("pet-body").value = pet.body;
  $("pet-belly").value = pet.belly;
  $("pet-cheek").value = pet.cheek;
  $("pet-accent").value = pet.accent;
  $("nest-name").value = c.name || "";
  for (const btn of document.querySelectorAll(".pet-pattern")) {
    btn.setAttribute("aria-checked", String(btn.dataset.pattern === pet.pattern));
  }
  for (const btn of document.querySelectorAll(".pet-preset")) {
    const preset = PET_PRESETS.find((p) => p.id === btn.dataset.preset);
    const match =
      preset &&
      preset.body === pet.body &&
      preset.belly === pet.belly &&
      preset.cheek === pet.cheek &&
      preset.accent === pet.accent &&
      preset.pattern === pet.pattern;
    btn.setAttribute("aria-pressed", String(Boolean(match)));
  }
  // Preview pet colors on egg stage by briefly showing designer still useful;
  // art stays egg until hatch, but designer lead explains that.
  void stage;
}

function renderPetPresets() {
  const row = $("pet-presets");
  if (!row || row.childElementCount) return;
  for (const preset of PET_PRESETS) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "pet-preset";
    btn.dataset.preset = preset.id;
    btn.title = preset.label;
    btn.setAttribute("aria-label", preset.label);
    btn.style.setProperty("--p1", preset.body);
    btn.style.setProperty("--p2", preset.belly);
    btn.addEventListener("click", async () => {
      playClick();
      await companion.updatePet({
        body: preset.body,
        belly: preset.belly,
        cheek: preset.cheek,
        accent: preset.accent,
        pattern: preset.pattern,
      });
      await renderNest();
    });
    row.append(btn);
  }
}

async function renderNest({ preserveArt = false } = {}) {
  renderPetPresets();
  const c = await companion.getCompanion();
  const stage = companion.stageForMinutes(c.totalFocusMinutes);
  const next = companion.nextStage(stage.id);
  if (!preserveArt) paintNestArt(c);
  syncPetDesigner(c);
  $("nest-stage").textContent = c.name ? `${c.name} · ${stage.label}` : stage.label;
  $("nest-blurb").textContent = stage.blurb;
  $("nest-progress").style.width = `${companion.stageProgress(c.totalFocusMinutes) * 100}%`;
  $("nest-next").textContent = next
    ? `${Math.max(0, next.minMinutes - c.totalFocusMinutes)} focus minutes until ${next.label.toLowerCase()}.`
    : `${c.totalFocusMinutes} focus minutes together so far.`;
}

async function celebrate(newStage, { credited = false } = {}) {
  if (!credited && !newStage) return;
  const c = await companion.getCompanion();
  const cue = $("nest-session-cue");
  const stage = companion.stageForMinutes(c.totalFocusMinutes);

  if (newStage) {
    const el = $("nest-milestone");
    el.textContent = newStage.milestone;
    el.hidden = false;
    playMilestone();
    if (newStage.id === "hatchling") {
      // Storage has already advanced to hatchling, so explicitly show the
      // previous egg stage for the crack frame.
      paintNestArt(c, { stageId: "egg", cracked: true, motion: "is-cracking" });
      setTimeout(() => paintNestArt(c, { stageId: "hatchling", motion: "is-hatched" }), 700);
    } else {
      paintNestArt(c, { motion: "is-happy" });
    }
    cue.textContent = newStage.milestone;
    cue.hidden = false;
  } else if (credited) {
    if (stage.id === "egg") {
      paintNestArt(c, { stageId: "egg", cracked: true, motion: "is-cracking" });
      cue.textContent = "The shell stirred.";
    } else {
      paintNestArt(c, { motion: "is-happy" });
      cue.textContent = "Your companion noticed.";
    }
    cue.hidden = false;
    playClick("toggle-on");
  }
  setTimeout(() => {
    if (cue) cue.hidden = true;
  }, 2200);
  // Keep Nest tab data fresh without redrawing over the animation.
  if (activeTab === "nest") await renderNest({ preserveArt: true });
}

// ---------- tasks ----------
async function renderTasks() {
  const items = await tasks.list();
  const list = $("task-list");
  list.replaceChildren(
    ...items.map((t) => {
      const li = document.createElement("li");
      if (t.done) li.classList.add("done");

      const box = document.createElement("input");
      box.type = "checkbox";
      box.checked = t.done;
      box.id = `task-${t.id}`;
      box.addEventListener("change", async () => {
        playClick(box.checked ? "toggle-on" : "toggle-off");
        await tasks.toggle(t.id);
        await Promise.all([renderTasks(), renderStats()]);
      });

      const label = document.createElement("label");
      label.className = "task-text";
      label.htmlFor = box.id;
      label.textContent = t.text;

      const del = document.createElement("button");
      del.className = "task-del";
      del.textContent = "×";
      del.setAttribute("aria-label", `Delete task: ${t.text}`);
      del.addEventListener("click", async () => {
        playClick();
        await tasks.remove(t.id);
        await renderTasks();
      });

      li.append(box, label, del);
      return li;
    })
  );
  const done = items.filter((t) => t.done).length;
  $("task-count").textContent = `${done}/${items.length}`;
  $("tasks-empty").hidden = items.length > 0;
}

// ---------- stats ----------
async function renderStats() {
  const [today, all] = await Promise.all([stats.getToday(), stats.getStats()]);
  $("stat-sessions").textContent = today.focusSessions;
  $("stat-minutes").textContent = today.focusMinutes;
  $("stat-tasks").textContent = today.tasksCompleted;
  $("stat-streak").textContent = all.streak || 0;
  $("stat-streak-pill").textContent = `${all.streak || 0} day streak`;
  $("stats-date").textContent = new Date().toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

// ---------- history ----------
const dayKeyOf = (y, m, d) =>
  `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
let calView = { year: new Date().getFullYear(), month: new Date().getMonth() };
let selectedDay = todayKey();

async function renderHistory() {
  await renderStats();
  const { year, month } = calView;
  const summary = await history.monthSummary(year, month);
  $("cal-month").textContent = new Date(year, month, 1).toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });

  const first = new Date(year, month, 1);
  const lead = (first.getDay() + 6) % 7; // Monday-first grid
  const days = new Date(year, month + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < lead; i += 1) {
    const blank = document.createElement("div");
    blank.className = "cal-cell blank";
    blank.setAttribute("aria-hidden", "true");
    cells.push(blank);
  }
  for (let d = 1; d <= days; d += 1) {
    const key = dayKeyOf(year, month, d);
    const info = summary[key];
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "cal-cell";
    btn.textContent = String(d);
    btn.setAttribute("role", "gridcell");
    if (info) btn.classList.add("has-focus");
    if (key === todayKey()) btn.classList.add("today");
    btn.setAttribute("aria-selected", String(key === selectedDay));
    btn.setAttribute(
      "aria-label",
      info
        ? `${new Date(year, month, d).toLocaleDateString(undefined, { day: "numeric", month: "long" })} — ${info.sessions} focus session${info.sessions > 1 ? "s" : ""}, ${info.minutes} minutes`
        : `${new Date(year, month, d).toLocaleDateString(undefined, { day: "numeric", month: "long" })} — no focus sessions`
    );
    btn.addEventListener("click", async () => {
      playClick();
      selectedDay = key;
      await renderHistory();
    });
    cells.push(btn);
  }
  $("cal-grid").replaceChildren(...cells);
  await renderDay();
}

async function renderDay() {
  const items = await history.sessionsForDay(selectedDay);
  const [y, m, d] = selectedDay.split("-").map(Number);
  const label = new Date(y, m - 1, d).toLocaleDateString(undefined, {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  const total = items.reduce((sum, s) => sum + (s.minutes || 0), 0);
  $("day-title").textContent =
    selectedDay === todayKey() ? `Today · ${total} min` : `${label} · ${total} min`;
  $("day-list").replaceChildren(
    ...items.map((s) => {
      const li = document.createElement("li");
      const time = document.createElement("span");
      time.className = "s-time";
      time.textContent = `${history.formatClock(s.startedAt)} – ${history.formatClock(s.endedAt)}`;
      const mode = document.createElement("span");
      mode.textContent = s.mode === "focus" ? "Focus" : s.mode;
      const mins = document.createElement("span");
      mins.className = "s-mins";
      mins.textContent = `${s.minutes}m`;
      li.append(time, mode, mins);
      return li;
    })
  );
  $("day-empty").hidden = items.length > 0;
}

function wireHistory() {
  const move = (delta) => async () => {
    playClick();
    const d = new Date(calView.year, calView.month + delta, 1);
    calView = { year: d.getFullYear(), month: d.getMonth() };
    await renderHistory();
  };
  $("cal-prev").addEventListener("click", move(-1));
  $("cal-next").addEventListener("click", move(1));
}

// ---------- blocker UI ----------
function setBlockError(msg) {
  const el = $("block-error");
  el.textContent = msg || "";
  el.hidden = !msg;
}

async function renderBlocker() {
  const b = await blocker.getBlocker();
  $("set-blocker").checked = b.enabled;
  const list = $("block-list");
  list.replaceChildren(
    ...b.domains.map((domain) => {
      const li = document.createElement("li");
      li.className = "chip";
      const name = document.createElement("span");
      name.textContent = domain;
      const del = document.createElement("button");
      del.type = "button";
      del.textContent = "×";
      del.setAttribute("aria-label", `Stop blocking ${domain}`);
      del.addEventListener("click", async () => {
        playClick();
        await callBackground("blocker:removeDomain", { domain });
        await Promise.all([renderBlocker(), renderTimer()]);
      });
      li.append(name, del);
      return li;
    })
  );
  $("block-empty").hidden = b.domains.length > 0;

  const granted = await blocker.hasHostAccess();
  $("perm-status").textContent = granted
    ? "Blocked sites show the friendly Focus Nest page."
    : "Blocked sites currently show Chrome's own error page. Allow site access to show a friendly Focus Nest page instead — it is used only to redirect blocked requests.";
  $("perm-grant").hidden = granted;
  $("perm-revoke").hidden = !granted;
}

// ---------- spotify ----------
function setSpotifyError(message) {
  const el = $("spotify-error");
  el.textContent = message || "";
  el.hidden = !message;
}

function showSpotifyControls(visible) {
  for (const id of ["spotify-prev", "spotify-toggle", "spotify-next", "spotify-disconnect", "spotify-pin"]) {
    $(id).hidden = !visible;
  }
  $("spotify-connect").hidden = visible;
}

function setSpotifyGradient(colors, active) {
  const card = $("spotify-card");
  if (!active) {
    clearColors(card);
    return;
  }
  applyColors(card, colors || FALLBACK_COLORS);
}

async function syncPinButton() {
  const pin = $("spotify-pin");
  const note = $("spotify-pin-note");
  let pinned = false;
  try {
    pinned = Boolean(await callBackground("spotify:getPinned"));
  } catch {
    const ui = await storage.get(KEYS.spotifyUi);
    pinned = Boolean(ui?.pinned);
  }
  pin.setAttribute("aria-pressed", pinned ? "true" : "false");
  pin.title = pinned ? "Unpin player" : "Pin over websites";
  pin.setAttribute("aria-label", pinned ? "Unpin player" : "Pin player on websites");
  note.hidden = !pinned;
  return pinned;
}

function paintSpotifyTrack(now) {
  const track = $("spotify-track");
  if (!now || now.empty || !now.title) {
    track.hidden = true;
    setSpotifyGradient(null, false);
    lastSpotifyTrackId = null;
    return false;
  }
  track.hidden = false;
  $("spotify-title").textContent = now.title;
  $("spotify-artist").textContent = now.artist || "";
  $("spotify-album").textContent = now.album || "";
  if (now.art) $("spotify-art").src = now.art;
  $("spotify-art").alt = `Album art for ${now.title}`;
  $("spotify-toggle").textContent = now.isPlaying ? "⏸" : "▶";
  setSpotifyGradient(now.colors, true);
  lastSpotifyTrackId = now.id || null;
  return true;
}

function fillSpotifyRedirect() {
  const el = $("spotify-redirect");
  const box = $("spotify-redirect-box");
  let uri = "";
  try {
    uri = chrome.identity.getRedirectURL();
  } catch {
    uri = "";
  }
  if (el) el.textContent = uri || "(reload extension to see redirect URI)";
  return uri;
}

function setRedirectBoxVisible(visible) {
  const box = $("spotify-redirect-box");
  if (box) box.hidden = !visible;
}

async function renderSpotify() {
  setSpotifyError("");
  const track = $("spotify-track");
  const redirectUri = fillSpotifyRedirect();

  if (!spotify.isConfigured()) {
    $("spotify-pill").textContent = "Setup needed";
    $("spotify-status").textContent =
      "Spotify needs your own developer client ID before it can connect.";
    $("spotify-status").hidden = false;
    $("spotify-setup").hidden = false;
    setRedirectBoxVisible(true);
    track.hidden = true;
    showSpotifyControls(false);
    $("spotify-connect").disabled = true;
    setSpotifyGradient(null, false);
    $("spotify-pin-note").hidden = true;
    return;
  }

  $("spotify-setup").hidden = true;
  $("spotify-connect").disabled = false;
  if (!(await spotify.isConnected())) {
    const pending = await spotify.isAuthPending();
    $("spotify-pill").textContent = pending ? "Signing in…" : "Disconnected";
    $("spotify-status").textContent = pending
      ? "Finish signing in in the Spotify tab, then reopen Focus Nest."
      : "Connect Spotify to see and control what's playing. If you see redirect_uri errors, copy the URI below into your Spotify app settings.";
    $("spotify-status").hidden = false;
    setRedirectBoxVisible(true);
    track.hidden = true;
    showSpotifyControls(false);
    setSpotifyGradient(null, false);
    $("spotify-pin-note").hidden = true;
    if (!redirectUri) {
      setSpotifyError("Couldn't read the redirect URI — reload the extension on opera://extensions.");
    }
    return;
  }

  setRedirectBoxVisible(false);
  showSpotifyControls(true);
  await syncPinButton();

  try {
    const snap = await callBackground("spotify:refreshNowPlaying");
    if (!snap || snap.empty || !snap.title) {
      $("spotify-pill").textContent = "Connected";
      $("spotify-status").textContent = "Nothing playing right now.";
      $("spotify-status").hidden = false;
      paintSpotifyTrack(null);
      return;
    }
    $("spotify-pill").textContent = snap.isPlaying ? "Playing" : "Paused";
    $("spotify-status").hidden = true;
    paintSpotifyTrack(snap);
  } catch (err) {
    $("spotify-pill").textContent = err.message?.includes("Not connected") || err.message?.includes("session")
      ? "Disconnected"
      : "Problem";
    // Fall back to direct API if background refresh fails
    try {
      const now = await spotify.getNowPlaying();
      if (!now) {
        $("spotify-status").textContent = "Nothing playing right now.";
        $("spotify-status").hidden = false;
        paintSpotifyTrack(null);
        return;
      }
      $("spotify-pill").textContent = now.isPlaying ? "Playing" : "Paused";
      $("spotify-status").hidden = true;
      const colors = await extractColors(now.art);
      paintSpotifyTrack({ ...now, colors });
    } catch (inner) {
      $("spotify-status").hidden = false;
      $("spotify-status").textContent = "Music is unavailable right now.";
      paintSpotifyTrack(null);
      setSpotifyError(inner.message || err.message);
      if (inner.code === "no_auth") showSpotifyControls(false);
    }
  }
}

async function spotifyAction(fn) {
  try {
    await fn();
  } catch (err) {
    setSpotifyError(err.message || "Something went wrong.");
  }
  await renderSpotify();
}

function startSpotifyPolling() {
  stopSpotifyPolling();
  spotifyPollTimer = setInterval(() => {
    if (document.visibilityState === "hidden") return;
    void renderSpotifyQuiet();
  }, 4000);
}

function stopSpotifyPolling() {
  if (spotifyPollTimer) {
    clearInterval(spotifyPollTimer);
    spotifyPollTimer = null;
  }
}

/** Refresh track/gradient without resetting connect UI chrome. */
async function renderSpotifyQuiet() {
  if (!(await spotify.isConnected())) return;
  try {
    const snap = await callBackground("spotify:refreshNowPlaying");
    if (!snap || snap.empty || !snap.title) {
      if ($("spotify-track").hidden === false) {
        $("spotify-pill").textContent = "Connected";
        $("spotify-status").textContent = "Nothing playing right now.";
        $("spotify-status").hidden = false;
        paintSpotifyTrack(null);
      }
      return;
    }
    if (snap.id === lastSpotifyTrackId && $("spotify-pill").textContent === (snap.isPlaying ? "Playing" : "Paused")) {
      $("spotify-toggle").textContent = snap.isPlaying ? "⏸" : "▶";
      return;
    }
    $("spotify-pill").textContent = snap.isPlaying ? "Playing" : "Paused";
    $("spotify-status").hidden = true;
    paintSpotifyTrack(snap);
  } catch {
    /* quiet poll — ignore */
  }
}

async function toggleSpotifyPin() {
  playClick();
  setSpotifyError("");
  const pinned = $("spotify-pin").getAttribute("aria-pressed") === "true";
  try {
    if (pinned) await callBackground("spotify:unpin");
    else await callBackground("spotify:pin");
  } catch (err) {
    setSpotifyError(err.message || "Couldn't update pin.");
  }
  await syncPinButton();
}

// ---------- settings ----------
function renderSettings() {
  $("set-focus").value = settings.focusMinutes;
  $("set-short").value = settings.shortBreakMinutes;
  $("set-long").value = settings.longBreakMinutes;
  $("set-cycle").value = settings.sessionsBeforeLongBreak;
  $("set-autostart").checked = settings.autoStartNext;
  $("set-quotes").checked = settings.showQuotes;
  $("set-ritual").checked = settings.ritualEnabled;
  $("set-animations").checked = settings.animations;
  $("set-clicks").checked = settings.soundClicks;
  $("set-chime").checked = settings.soundChime;
  $("set-volume").value = Math.round((settings.soundVolume ?? 0.5) * 100);
  document.querySelectorAll(".appearance-btn").forEach((b) => {
    b.setAttribute("aria-checked", String(b.dataset.appearance === settings.appearance));
    b.classList.toggle("primary", b.dataset.appearance === settings.appearance);
  });
}

async function saveSetting(patch) {
  settings = await storage.update(KEYS.settings, patch);
  syncSound();
  paintEnvironment();
  renderSettings();
  renderPresets();
  await renderTimer();
  renderQuote();
}

function renderQuote() {
  $("quote").textContent = settings.showQuotes ? randomQuote() : "";
}

function renderGreeting() {
  const h = new Date().getHours();
  $("greeting").textContent =
    h < 5 ? "Still up?" : h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
}

// ---------- wiring ----------
function wire() {
  wireTabs();
  wireDialogs();
  wireHistory();

  let startBusy = false;
  $("start-btn").addEventListener("click", async () => {
    if (startBusy) return;
    startBusy = true;
    try {
      playClick();
      const t = await storage.get(KEYS.timer);
      if (settings.ritualEnabled && timer.isPhaseFresh(t) && t.phase === "focus") {
        const go = await runRitual();
        if (!go) return;
      }
      await callBackground("timer:start");
      $("timer-live").textContent = "Session started.";
      await Promise.all([renderTimer(), renderBlocker()]);
    } finally {
      startBusy = false;
    }
  });

  $("pause-btn").addEventListener("click", async () => {
    playClick();
    await callBackground("timer:pause");
    await renderTimer();
  });
  $("reset-btn").addEventListener("click", async () => {
    playClick();
    await callBackground("timer:reset");
    $("timer-live").textContent = "Timer reset.";
    await renderTimer();
  });
  $("skip-btn").addEventListener("click", async () => {
    playClick();
    const t = await storage.get(KEYS.timer);
    $("confirm-body").textContent =
      t.phase === "focus"
        ? "It won't count towards your history or your nest."
        : "You'll move straight on to the next focus session.";
    if (!(await confirmSkip())) return;
    await callBackground("timer:skip");
    $("timer-live").textContent = "Session skipped.";
    await renderTimer();
  });

  $("sound-btn").addEventListener("click", async () => {
    const on = settings.soundClicks || settings.soundChime;
    await saveSetting({ soundClicks: !on, soundChime: !on });
    if (!on) playClick("toggle-on");
  });

  $("task-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const input = $("new-task");
    if (await tasks.add(input.value)) {
      playClick();
      input.value = "";
      await renderTasks();
    }
    input.focus();
  });

  document.querySelectorAll(".appearance-btn").forEach((b) =>
    b.addEventListener("click", () => {
      playClick();
      saveSetting({ appearance: b.dataset.appearance });
    })
  );

  // Durations never touch a countdown that is already under way.
  const lengthNote = (appliedNow) => {
    $("length-note").textContent = appliedNow
      ? "Applied to the current session."
      : "A session is under way — this applies from the next one.";
  };
  $("set-focus").addEventListener("change", async () => {
    const v = Math.min(120, Math.max(1, Number($("set-focus").value) || 1));
    const { appliedNow } = await timer.applyFocusPreset(v);
    settings = await storage.get(KEYS.settings);
    lengthNote(appliedNow);
    renderPresets();
    renderSettings();
    await renderTimer();
  });
  const breakInput = (id, key, max) =>
    $(id).addEventListener("change", async () => {
      const v = Math.min(max, Math.max(1, Number($(id).value) || 1));
      const { appliedNow } = await timer.applyBreakLength(key, v, max);
      settings = await storage.get(KEYS.settings);
      lengthNote(appliedNow);
      renderSettings();
      await renderTimer();
    });
  breakInput("set-short", "shortBreakMinutes", 60);
  breakInput("set-long", "longBreakMinutes", 60);
  $("set-cycle").addEventListener("change", () => {
    const v = Math.min(12, Math.max(2, Number($("set-cycle").value) || 4));
    saveSetting({ sessionsBeforeLongBreak: v });
  });

  const check = (id, key) =>
    $(id).addEventListener("change", () => {
      playClick($(id).checked ? "toggle-on" : "toggle-off");
      saveSetting({ [key]: $(id).checked });
    });
  check("set-autostart", "autoStartNext");
  check("set-quotes", "showQuotes");
  check("set-ritual", "ritualEnabled");
  check("set-animations", "animations");
  check("set-clicks", "soundClicks");
  check("set-chime", "soundChime");
  $("set-volume").addEventListener("change", () => {
    saveSetting({ soundVolume: Number($("set-volume").value) / 100 });
    playClick();
  });

  $("set-blocker").addEventListener("change", async () => {
    playClick($("set-blocker").checked ? "toggle-on" : "toggle-off");
    await callBackground("blocker:setEnabled", { enabled: $("set-blocker").checked });
    await Promise.all([renderBlocker(), renderTimer()]);
  });
  $("block-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const input = $("block-input");
    const res = await callBackground("blocker:addDomain", { input: input.value });
    setBlockError(res.ok ? "" : res.error);
    if (res.ok) {
      playClick();
      input.value = "";
      await Promise.all([renderBlocker(), renderTimer()]);
    }
    input.focus();
  });
  $("perm-grant").addEventListener("click", async () => {
    playClick();
    await callBackground("blocker:requestHostAccess");
    await renderBlocker();
  });
  $("perm-revoke").addEventListener("click", async () => {
    playClick();
    await callBackground("blocker:dropHostAccess");
    await renderBlocker();
  });

  $("clear-tasks").addEventListener("click", async () => {
    playClick();
    await tasks.clear();
    await renderTasks();
  });
  $("reset-all").addEventListener("click", async () => {
    await storage.clearAll();
    location.reload();
  });

  $("spotify-connect").addEventListener("click", async () => {
    playClick();
    setSpotifyError("");
    $("spotify-pill").textContent = "Signing in…";
    $("spotify-status").textContent =
      "A Spotify tab is opening — approve access there. You can reopen Focus Nest when it finishes.";
    $("spotify-status").hidden = false;
    try {
      await callBackground("spotify:connect");
      await renderSpotify();
    } catch (err) {
      // Opening a tab steals focus and closes this popup; the background keeps working.
      const closed =
        /message port closed|Receiving end does not exist|The message port closed/i.test(
          err?.message || ""
        );
      if (closed) return;
      setSpotifyError(err.message || "Sign-in failed.");
      $("spotify-pill").textContent = "Disconnected";
    }
  });
  $("spotify-disconnect").addEventListener("click", () => spotifyAction(() => callBackground("spotify:disconnect")));
  $("spotify-toggle").addEventListener("click", () => spotifyAction(() => callBackground("spotify:togglePlayback")));
  $("spotify-next").addEventListener("click", () => spotifyAction(() => callBackground("spotify:next")));
  $("spotify-prev").addEventListener("click", () => spotifyAction(() => callBackground("spotify:previous")));
  $("spotify-pin").addEventListener("click", () => void toggleSpotifyPin());

  $("spotify-copy-redirect")?.addEventListener("click", async () => {
    playClick();
    const uri = fillSpotifyRedirect();
    try {
      await navigator.clipboard.writeText(uri);
      $("spotify-copy-redirect").textContent = "Copied";
      setTimeout(() => { $("spotify-copy-redirect").textContent = "Copy"; }, 1500);
    } catch {
      setSpotifyError("Couldn't copy — select the URI and copy it manually.");
    }
  });

  storage.onChange((changes) => {
    if (changes.spotifyAuth || changes.spotifyAuthPending) {
      void renderSpotify();
    }
    if (changes.spotifyNowPlaying || changes.spotifyUi) {
      void syncPinButton();
      const snap = changes.spotifyNowPlaying?.newValue;
      if (snap && !snap.empty && snap.title) {
        $("spotify-pill").textContent = snap.isPlaying ? "Playing" : "Paused";
        $("spotify-status").hidden = true;
        paintSpotifyTrack(snap);
      }
    }
  });

  $("onboard-done").addEventListener("click", async () => {
    playClick();
    await storage.update(KEYS.meta, { onboarded: true });
    show("main");
    selectTab("study");
    $("start-btn").focus();
  });
}

async function init() {
  await storage.migrate();
  settings = await storage.get(KEYS.settings);
  syncSound();
  paintEnvironment();
  watchSystemAppearance(() => settings);
  wire();

  renderEnvButtons($("env-picker"), settings.environment, pickEnvironment);
  renderEnvButtons($("onboard-envs"), settings.environment, pickEnvironment);
  renderPresets();
  renderQuote();
  renderGreeting();
  renderSettings();
  const { newStage } = await callBackground("timer:syncIfElapsed");
  celebrate(newStage);
  const meta = await storage.get(KEYS.meta);
  show(meta.onboarded ? "main" : "onboarding");
  selectTab("study");

  await Promise.all([renderTimer(), renderStats(), renderBlocker(), renderSpotify()]);
  startTicker();
  startSpotifyPolling();
}

init();