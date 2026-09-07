/**
 * Environment decoration: a handful of absolutely positioned, pointer-events:
 * none elements animated with CSS transforms only (cheap, GPU friendly).
 * Respects the animations setting AND prefers-reduced-motion.
 */
import { getEnvironment } from "../data/environments.js";

const reduceMotion = () =>
  window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;

const rand = (min, max) => min + Math.random() * (max - min);

export function renderDecor(layer, environmentId, animationsOn) {
  if (!layer) return;
  layer.replaceChildren();
  const env = getEnvironment(environmentId);
  layer.dataset.kind = env.decor.kind;

  const still = reduceMotion() || !animationsOn;
  layer.classList.toggle("still", still);
  if (still) return; // static gradient only — no moving parts at all

  const frag = document.createDocumentFragment();
  for (let i = 0; i < env.decor.count; i += 1) {
    const el = document.createElement("span");
    el.className = `decor decor-${env.decor.kind}`;
    el.style.setProperty("--x", `${rand(2, 96).toFixed(2)}%`);
    el.style.setProperty("--delay", `${rand(-14, 0).toFixed(2)}s`);
    el.style.setProperty("--dur", `${rand(9, 22).toFixed(2)}s`);
    el.style.setProperty("--scale", rand(0.55, 1.25).toFixed(2));
    el.style.setProperty("--drift", `${rand(-26, 26).toFixed(1)}px`);
    if (env.decor.kind === "leaves") el.textContent = Math.random() > 0.5 ? "🍃" : "🌿";
    frag.append(el);
  }
  layer.append(frag);
}
