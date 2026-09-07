/**
 * Spotify integration (Authorization Code + PKCE).
 *
 * Sign-in opens a normal browser tab (not chrome.identity.launchWebAuthFlow).
 * Opera GX, ad blockers, and popup blockers often kill the identity popup
 * immediately — there is no permission that forces those through. A tab is
 * treated as a user navigation and survives them.
 *
 * No client secret is used or stored anywhere. If SPOTIFY_CONFIG.CLIENT_ID is
 * empty, every call returns a `setup_required` result and the UI shows setup
 * instructions instead of a fake connected state.
 */
import { KEYS } from "../data/schema.js";
import * as storage from "./storage.js";
import { SPOTIFY_CONFIG, isSpotifyConfigured } from "../data/spotify.config.js";

export class SpotifyError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code; // setup_required | auth_cancelled | auth_failed | no_auth | no_device | rate_limited | network | api
  }
}

export const isConfigured = isSpotifyConfigured;
export const redirectUri = () => chrome.identity.getRedirectURL();

export async function getAuth() {
  return storage.get(KEYS.spotify);
}

export async function isConnected() {
  const auth = await getAuth();
  return Boolean(auth?.refreshToken || auth?.accessToken);
}

export async function isAuthPending() {
  const pending = await storage.get(KEYS.spotifyAuthPending);
  return Boolean(pending?.verifier && pending?.state);
}

export async function disconnect() {
  await storage.set(KEYS.spotify, null);
  await storage.set(KEYS.spotifyAuthPending, null);
}

// ---------- PKCE helpers ----------
function randomString(len = 64) {
  const bytes = crypto.getRandomValues(new Uint8Array(len));
  return Array.from(bytes, (b) => "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"[b % 62]).join("");
}
function base64url(buffer) {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
async function challenge(verifier) {
  return base64url(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier)));
}

/**
 * Wait until the auth tab navigates to our chromiumapp.org redirect URL.
 * Uses tabs.onUpdated + webNavigation when available (redirect pages often
 * fail to "load", so changeInfo.url / onBeforeNavigate matter more than
 * status === "complete").
 */
function waitForAuthRedirect(tabId, redirectBase, timeoutMs = 5 * 60 * 1000) {
  return new Promise((resolve, reject) => {
    let done = false;

    const finish = (fn, value) => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      chrome.tabs.onUpdated.removeListener(onUpdated);
      chrome.tabs.onRemoved.removeListener(onRemoved);
      try {
        chrome.webNavigation?.onBeforeNavigate?.removeListener(onBeforeNavigate);
      } catch {
        /* ignore */
      }
      fn(value);
    };

    const consider = (url) => {
      if (!url || !url.startsWith(redirectBase)) return;
      finish(resolve, url);
      chrome.tabs.remove(tabId).catch(() => {});
    };

    const timer = setTimeout(() => {
      finish(reject, new SpotifyError("auth_cancelled", "Sign-in timed out — try Connect again."));
    }, timeoutMs);

    function onUpdated(id, changeInfo, tab) {
      if (id !== tabId) return;
      consider(changeInfo.url || tab?.url);
    }
    function onBeforeNavigate(details) {
      if (details.tabId !== tabId) return;
      consider(details.url);
    }
    function onRemoved(id) {
      if (id !== tabId) return;
      finish(reject, new SpotifyError("auth_cancelled", "Sign-in tab was closed before finishing."));
    }

    chrome.tabs.onUpdated.addListener(onUpdated);
    chrome.tabs.onRemoved.addListener(onRemoved);
    try {
      chrome.webNavigation?.onBeforeNavigate?.addListener(onBeforeNavigate);
    } catch {
      /* webNavigation optional */
    }
  });
}

export async function connect() {
  if (!isConfigured()) throw new SpotifyError("setup_required", "Spotify client ID is not configured.");

  const verifier = randomString();
  const state = randomString(16);
  const redirect = redirectUri();
  const url = new URL(SPOTIFY_CONFIG.AUTH_URL);
  url.search = new URLSearchParams({
    client_id: SPOTIFY_CONFIG.CLIENT_ID,
    response_type: "code",
    redirect_uri: redirect,
    code_challenge_method: "S256",
    code_challenge: await challenge(verifier),
    scope: SPOTIFY_CONFIG.SCOPES.join(" "),
    state,
  }).toString();

  let tab;
  try {
    tab = await chrome.tabs.create({ url: url.toString(), active: true });
  } catch (e) {
    throw new SpotifyError("auth_failed", e?.message || "Couldn't open the Spotify sign-in tab.");
  }

  await storage.set(KEYS.spotifyAuthPending, {
    verifier,
    state,
    tabId: tab.id,
    createdAt: Date.now(),
  });

  let redirected;
  try {
    redirected = await waitForAuthRedirect(tab.id, redirect);
  } catch (err) {
    await storage.set(KEYS.spotifyAuthPending, null);
    throw err;
  }

  await storage.set(KEYS.spotifyAuthPending, null);

  let params;
  try {
    params = new URL(redirected).searchParams;
  } catch {
    throw new SpotifyError("auth_failed", "Couldn't read Spotify's redirect.");
  }
  if (params.get("error")) throw new SpotifyError("auth_failed", params.get("error"));
  if (params.get("state") !== state) throw new SpotifyError("auth_failed", "State mismatch — please try again.");
  const code = params.get("code");
  if (!code) throw new SpotifyError("auth_failed", "No authorization code returned.");

  const tokens = await tokenRequest({
    grant_type: "authorization_code",
    code,
    redirect_uri: redirect,
    client_id: SPOTIFY_CONFIG.CLIENT_ID,
    code_verifier: verifier,
  });
  return saveTokens(tokens);
}

async function tokenRequest(body) {
  let res;
  try {
    res = await fetch(SPOTIFY_CONFIG.TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams(body).toString(),
    });
  } catch (e) {
    throw new SpotifyError("network", "Couldn't reach Spotify.");
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new SpotifyError("auth_failed", data.error_description || "Spotify rejected the sign-in.");
  return data;
}

async function saveTokens(data, previous) {
  const auth = {
    accessToken: data.access_token,
    refreshToken: data.refresh_token || previous?.refreshToken || null,
    expiresAt: Date.now() + (data.expires_in ?? 3600) * 1000 - 30_000,
    scope: data.scope || SPOTIFY_CONFIG.SCOPES.join(" "),
  };
  await storage.set(KEYS.spotify, auth);
  return auth;
}

async function accessToken() {
  if (!isConfigured()) throw new SpotifyError("setup_required", "Spotify client ID is not configured.");
  const auth = await getAuth();
  if (!auth) throw new SpotifyError("no_auth", "Not connected to Spotify.");
  if (auth.accessToken && auth.expiresAt > Date.now()) return auth.accessToken;
  if (!auth.refreshToken) throw new SpotifyError("no_auth", "Session expired — connect again.");
  const data = await tokenRequest({
    grant_type: "refresh_token",
    refresh_token: auth.refreshToken,
    client_id: SPOTIFY_CONFIG.CLIENT_ID,
  });
  const next = await saveTokens(data, auth);
  return next.accessToken;
}

async function api(path, { method = "GET", body } = {}) {
  const token = await accessToken();
  let res;
  try {
    res = await fetch(`${SPOTIFY_CONFIG.API_BASE}${path}`, {
      method,
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new SpotifyError("network", "Couldn't reach Spotify.");
  }
  if (res.status === 204) return null; // nothing playing / command accepted
  if (res.status === 401) {
    await disconnect();
    throw new SpotifyError("no_auth", "Spotify session ended — connect again.");
  }
  if (res.status === 403) throw new SpotifyError("api", "Playback control needs Spotify Premium.");
  if (res.status === 404) throw new SpotifyError("no_device", "No active Spotify device — start playing somewhere first.");
  if (res.status === 429) throw new SpotifyError("rate_limited", "Spotify is rate limiting — try again shortly.");
  if (!res.ok) throw new SpotifyError("api", `Spotify error (${res.status}).`);
  return res.json().catch(() => null);
}

/** Pick a mid/large album image (prefer ~300px, fall back to largest). */
function pickArt(images) {
  if (!Array.isArray(images) || !images.length) return null;
  const ranked = [...images].sort((a, b) => (b.width || 0) - (a.width || 0));
  const mid = ranked.find((img) => (img.width || 0) >= 200 && (img.width || 0) <= 400);
  return (mid || ranked[0])?.url || null;
}

/** Currently playing track, or null when nothing is playing. */
export async function getNowPlaying() {
  const data = await api("/me/player/currently-playing");
  if (!data?.item) return null;
  const images = data.item.album?.images || [];
  return {
    id: data.item.id || `${data.item.name}:${data.item.artists?.[0]?.name || ""}`,
    title: data.item.name,
    artist: (data.item.artists || []).map((a) => a.name).join(", "),
    album: data.item.album?.name || "",
    art: pickArt(images),
    isPlaying: Boolean(data.is_playing),
  };
}

export const play = () => api("/me/player/play", { method: "PUT" });
export const pause = () => api("/me/player/pause", { method: "PUT" });
export const next = () => api("/me/player/next", { method: "POST" });
export const previous = () => api("/me/player/previous", { method: "POST" });
export async function togglePlayback() {
  const state = await getNowPlaying();
  return state?.isPlaying ? pause() : play();
}
