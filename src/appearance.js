import { DEFAULT_ENVIRONMENT, isEnvironment } from "../data/environments.js";

const media = window.matchMedia?.("(prefers-color-scheme: dark)");

export function applyAppearance(settings) {
  const env = isEnvironment(settings.environment) ? settings.environment : DEFAULT_ENVIRONMENT;
  document.body.dataset.theme = env;
  document.body.dataset.appearance = settings.appearance;
  const dark =
    settings.appearance === "dark" ||
    (settings.appearance === "system" && Boolean(media?.matches));
  document.body.classList.toggle("dark", dark);
}

export function watchSystemAppearance(getSettings) {
  media?.addEventListener?.("change", () => {
    const settings = getSettings();
    if (settings.appearance === "system") applyAppearance(settings);
  });
}
