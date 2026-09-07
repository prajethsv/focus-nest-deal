/**
 * Calm environments. Gradients live in popup.css via body[data-theme];
 * `decor` describes the subtle floating elements built by src/decor.js.
 */
export const ENVIRONMENTS = [
  {
    id: "cozy",
    label: "Cozy",
    emoji: "☕",
    description: "Warm lamp light, paper tones, drifting motes of steam.",
    decor: { kind: "motes", count: 7 },
  },
  {
    id: "rainy",
    label: "Rainy",
    emoji: "🌧️",
    description: "Grey window, soft drifting rain.",
    decor: { kind: "rain", count: 10 },
  },
  {
    id: "minimal",
    label: "Minimal",
    emoji: "🤍",
    description: "Restrained paper and light. Nothing but the work.",
    decor: { kind: "paper", count: 3 },
  },
  {
    id: "nature",
    label: "Nature",
    emoji: "🌿",
    description: "Green and quiet, with slow falling leaves.",
    decor: { kind: "leaves", count: 5 },
  },
];

export const DEFAULT_ENVIRONMENT = "cozy";
export const isEnvironment = (id) => ENVIRONMENTS.some((e) => e.id === id);
export const getEnvironment = (id) =>
  ENVIRONMENTS.find((e) => e.id === id) || ENVIRONMENTS[0];
