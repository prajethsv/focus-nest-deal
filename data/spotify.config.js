/**
 * Spotify configuration.
 *
 * Focus Nest uses Authorization Code + PKCE, which needs NO client secret.
 * Nothing sensitive belongs in this file — only the public client ID.
 *
 * Setup (see README.md, "Spotify setup"):
 *  1. Create an app at https://developer.spotify.com/dashboard
 *  2. Copy its Client ID into CLIENT_ID below.
 *  3. Add this exact redirect URI in the app settings:
 *       https://<YOUR_EXTENSION_ID>.chromiumapp.org/
 *     Your extension ID is shown on chrome://extensions (or opera://extensions).
 *  Connect opens Spotify in a normal browser tab (not a popup), so Opera GX /
 *  adblock popup blockers do not kill the sign-in flow.
 *
 * Until CLIENT_ID is filled in, the music card shows a "setup needed" state
 * instead of pretending to be connected.
 */
export const SPOTIFY_CONFIG = {
  CLIENT_ID: "50d20a49706b4bd19a0989c47e50fd14", // <- paste your Spotify Client ID here
  SCOPES: [
    "user-read-playback-state",
    "user-modify-playback-state",
    "user-read-currently-playing",
  ],
  AUTH_URL: "https://accounts.spotify.com/authorize",
  TOKEN_URL: "https://accounts.spotify.com/api/token",
  API_BASE: "https://api.spotify.com/v1",
};

export const isSpotifyConfigured = () => Boolean(SPOTIFY_CONFIG.CLIENT_ID);
