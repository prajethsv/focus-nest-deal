/**
 * Floating Spotify mini-player injected into web pages while pin is on.
 * Self-contained (no ES imports) so chrome.scripting.executeScript can load it.
 */
(() => {
  const ROOT_ID = "focus-nest-spotify-overlay";
  const FALLBACK = { a: "#3d4a5c", b: "#1a222c", c: "#0d1218" };
  const DEFAULT_CORNER = "bottom-right";
  const ICONS = {
    prev: '<svg class="fn-ui-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6v12M18 7l-7 5 7 5V7Z"/></svg>',
    play: '<svg class="fn-ui-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="m9 6 8 6-8 6V6Z"/></svg>',
    pause: '<svg class="fn-ui-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 6v12M16 6v12"/></svg>',
    next: '<svg class="fn-ui-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M18 6v12M6 7l7 5-7 5V7Z"/></svg>',
    close: '<svg class="fn-ui-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="m7 7 10 10M17 7 7 17"/></svg>',
  };

  function ensureRoot() {
    let root = document.getElementById(ROOT_ID);
    if (root) return root;
    root = document.createElement("div");
    root.id = ROOT_ID;
    root.setAttribute("data-focus-nest", "spotify");
    root.setAttribute("data-corner", DEFAULT_CORNER);
    root.innerHTML = `
      <div class="fn-spot-blur" aria-hidden="true"></div>
      <div class="fn-spot-inner">
        <img class="fn-spot-art" alt="" width="42" height="42" hidden />
        <div class="fn-spot-meta">
          <strong class="fn-spot-title">Nothing playing</strong>
          <span class="fn-spot-artist">Focus Nest</span>
        </div>
        <div class="fn-spot-controls">
          <button type="button" class="fn-spot-btn" data-act="prev" aria-label="Previous track">${ICONS.prev}</button>
          <button type="button" class="fn-spot-btn fn-spot-play" data-act="toggle" aria-label="Play or pause">${ICONS.play}</button>
          <button type="button" class="fn-spot-btn" data-act="next" aria-label="Next track">${ICONS.next}</button>
          <button type="button" class="fn-spot-btn fn-spot-unpin" data-act="unpin" aria-label="Unpin player" title="Unpin">${ICONS.close}</button>
        </div>
      </div>
    `;
    document.documentElement.appendChild(root);
    root.addEventListener("click", onClick);
    return root;
  }

  function removeRoot() {
    const root = document.getElementById(ROOT_ID);
    if (root) root.remove();
  }

  function applyColors(root, colors) {
    const c = colors || FALLBACK;
    root.style.setProperty("--spot-a", c.a);
    root.style.setProperty("--spot-b", c.b);
    root.style.setProperty("--spot-c", c.c);
  }

  function applyCorner(root, corner) {
    const allowed = ["bottom-right", "bottom-left", "top-right", "top-left"];
    root.setAttribute("data-corner", allowed.includes(corner) ? corner : DEFAULT_CORNER);
  }

  function render(snap, ui) {
    if (ui && ui.pinned === false) {
      removeRoot();
      return;
    }
    const root = ensureRoot();
    applyCorner(root, ui?.corner);
    const art = root.querySelector(".fn-spot-art");
    const title = root.querySelector(".fn-spot-title");
    const artist = root.querySelector(".fn-spot-artist");
    const play = root.querySelector(".fn-spot-play");

    if (!snap || snap.empty || !snap.title) {
      applyColors(root, FALLBACK);
      art.hidden = true;
      art.removeAttribute("src");
      title.textContent = "Nothing playing";
      artist.textContent = "Focus Nest";
       play.innerHTML = ICONS.play;
      play.setAttribute("aria-label", "Play");
      return;
    }

    applyColors(root, snap.colors);
    title.textContent = snap.title;
    artist.textContent = snap.artist || "";
    if (snap.art) {
      art.hidden = false;
      art.src = snap.art;
      art.alt = "";
    } else {
      art.hidden = true;
    }
    play.innerHTML = snap.isPlaying ? ICONS.pause : ICONS.play;
    play.setAttribute("aria-label", snap.isPlaying ? "Pause" : "Play");
  }

  function send(type) {
    return new Promise((resolve) => {
      try {
        chrome.runtime.sendMessage({ type }, (response) => {
          if (chrome.runtime.lastError) resolve(null);
          else resolve(response);
        });
      } catch {
        resolve(null);
      }
    });
  }

  async function onClick(e) {
    const btn = e.target.closest("[data-act]");
    if (!btn) return;
    e.preventDefault();
    e.stopPropagation();
    const act = btn.getAttribute("data-act");
    if (act === "unpin") {
      await send("spotify:unpin");
      removeRoot();
      return;
    }
    if (act === "toggle") await send("spotify:togglePlayback");
    if (act === "next") await send("spotify:next");
    if (act === "prev") await send("spotify:previous");
    await send("spotify:refreshNowPlaying");
  }

  function readState() {
    chrome.storage.local.get(["spotifyUi", "spotifyNowPlaying"], (res) => {
      if (chrome.runtime.lastError) return;
      const ui = res.spotifyUi || { pinned: false, corner: DEFAULT_CORNER };
      if (!ui.pinned) {
        removeRoot();
        return;
      }
      render(res.spotifyNowPlaying || null, ui);
    });
  }

  if (!window.__focusNestSpotifyOverlay) {
    window.__focusNestSpotifyOverlay = true;
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area !== "local") return;
      if (changes.spotifyUi || changes.spotifyNowPlaying) readState();
    });
    chrome.runtime.onMessage.addListener((msg) => {
      if (msg?.type === "focus-nest:overlay-remove") removeRoot();
    });
  }

  readState();
})();
