/**
 * Inline SVG art for the nest: speckled egg + customizable round companion.
 * Colors are CSS-friendly hex strings from companion.pet.
 */

export const PET_DEFAULTS = {
  body: "#e8b86d",
  belly: "#fff6e8",
  cheek: "#f0a0a0",
  eye: "#3b2d20",
  accent: "#c48a3a", // beak / feet
  pattern: "spots", // "none" | "spots" | "stripe"
};

export const PET_PRESETS = [
  { id: "honey", label: "Honey", body: "#e8b86d", belly: "#fff6e8", cheek: "#f0a0a0", accent: "#c48a3a", pattern: "spots" },
  { id: "sky", label: "Sky", body: "#8eb6d4", belly: "#eef6fb", cheek: "#f2b6c2", accent: "#5f8fb3", pattern: "none" },
  { id: "matcha", label: "Matcha", body: "#8fbc8a", belly: "#f3faf0", cheek: "#e8a090", accent: "#5f8f5a", pattern: "stripe" },
  { id: "plum", label: "Plum", body: "#b89bc8", belly: "#f7f0fb", cheek: "#e8a0b8", accent: "#8a6a9a", pattern: "spots" },
  { id: "ink", label: "Ink", body: "#5c6570", belly: "#eef1f4", cheek: "#d4a090", accent: "#3d4550", pattern: "none" },
];

export function normalizePet(pet) {
  return { ...PET_DEFAULTS, ...(pet || {}) };
}

/** Speckled egg SVG. Pass cracked=true for session-end / hatch flourish. */
export function eggSvg({ cracked = false } = {}) {
  const crack = cracked
    ? `<path class="egg-crack" d="M48 38 L54 48 L50 58 L58 70" fill="none" stroke="#5a4634" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" opacity="0.75"/>
       <path class="egg-crack" d="M52 44 L62 52" fill="none" stroke="#5a4634" stroke-width="1.6" stroke-linecap="round" opacity="0.55"/>`
    : "";
  return `<svg class="nest-svg egg-svg" viewBox="0 0 100 120" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <defs>
      <radialGradient id="eggShell" cx="38%" cy="28%" r="70%">
        <stop offset="0%" stop-color="#fffaf2"/>
        <stop offset="55%" stop-color="#f3e0c4"/>
        <stop offset="100%" stop-color="#e0c49a"/>
      </radialGradient>
      <filter id="eggSoft" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="2" stdDeviation="1.4" flood-opacity="0.18"/>
      </filter>
    </defs>
    <ellipse cx="50" cy="112" rx="22" ry="4" fill="currentColor" opacity="0.12"/>
    <g filter="url(#eggSoft)">
      <path d="M50 8 C68 8 82 36 82 68 C82 94 68 112 50 112 C32 112 18 94 18 68 C18 36 32 8 50 8Z"
            fill="url(#eggShell)" stroke="#c9ae86" stroke-width="1.2"/>
      <ellipse cx="36" cy="42" rx="3.2" ry="2.4" fill="#c4a57a" opacity="0.55"/>
      <ellipse cx="58" cy="34" rx="2.4" ry="1.8" fill="#c4a57a" opacity="0.45"/>
      <ellipse cx="64" cy="58" rx="2.8" ry="2.1" fill="#c4a57a" opacity="0.4"/>
      <ellipse cx="40" cy="72" rx="2.2" ry="1.7" fill="#c4a57a" opacity="0.35"/>
      <ellipse cx="54" cy="86" rx="2.6" ry="1.9" fill="#c4a57a" opacity="0.4"/>
      ${crack}
    </g>
  </svg>`;
}

/** Cute round companion. Stage changes size / features slightly. */
export function petSvg(petInput, { stage = "hatchling" } = {}) {
  const pet = normalizePet(petInput);
  const scale = stage === "companion" ? 1 : stage === "fledgling" ? 0.92 : 0.82;
  const crest = stage === "companion"
    ? `<path d="M50 18 L54 8 L58 18" fill="${pet.accent}" opacity="0.9"/>`
    : stage === "fledgling"
      ? `<circle cx="50" cy="16" r="3" fill="${pet.accent}" opacity="0.85"/>`
      : "";
  const wing = stage === "egg" ? "" : `<ellipse cx="22" cy="58" rx="10" ry="14" fill="${pet.body}" opacity="0.85" transform="rotate(-18 22 58)"/>
    <ellipse cx="78" cy="58" rx="10" ry="14" fill="${pet.body}" opacity="0.85" transform="rotate(18 78 58)"/>`;
  const pattern =
    pet.pattern === "spots"
      ? `<circle cx="38" cy="48" r="2.2" fill="${pet.accent}" opacity="0.28"/>
         <circle cx="60" cy="44" r="1.8" fill="${pet.accent}" opacity="0.22"/>
         <circle cx="48" cy="62" r="1.6" fill="${pet.accent}" opacity="0.2"/>`
      : pet.pattern === "stripe"
        ? `<path d="M34 46 Q50 40 66 46" fill="none" stroke="${pet.accent}" stroke-width="2.4" opacity="0.3" stroke-linecap="round"/>
           <path d="M36 54 Q50 48 64 54" fill="none" stroke="${pet.accent}" stroke-width="2" opacity="0.22" stroke-linecap="round"/>`
        : "";

  return `<svg class="nest-svg pet-svg" viewBox="0 0 100 110" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <ellipse cx="50" cy="102" rx="20" ry="3.5" fill="currentColor" opacity="0.12"/>
    <g transform="translate(50 56) scale(${scale}) translate(-50 -56)">
      ${crest}
      ${wing}
      <ellipse cx="50" cy="58" rx="28" ry="30" fill="${pet.body}"/>
      <ellipse cx="50" cy="68" rx="16" ry="14" fill="${pet.belly}"/>
      ${pattern}
      <circle cx="40" cy="52" r="4.2" fill="${pet.eye}"/>
      <circle cx="60" cy="52" r="4.2" fill="${pet.eye}"/>
      <circle cx="41.4" cy="50.6" r="1.3" fill="#fff" opacity="0.9"/>
      <circle cx="61.4" cy="50.6" r="1.3" fill="#fff" opacity="0.9"/>
      <ellipse cx="34" cy="60" rx="4" ry="2.6" fill="${pet.cheek}" opacity="0.85"/>
      <ellipse cx="66" cy="60" rx="4" ry="2.6" fill="${pet.cheek}" opacity="0.85"/>
      <path d="M46 60 Q50 66 54 60" fill="${pet.accent}"/>
      <ellipse cx="42" cy="88" rx="5" ry="3" fill="${pet.accent}"/>
      <ellipse cx="58" cy="88" rx="5" ry="3" fill="${pet.accent}"/>
    </g>
  </svg>`;
}

export function artForStage(stageId, pet, { cracked = false } = {}) {
  if (stageId === "egg") return eggSvg({ cracked });
  return petSvg(pet, { stage: stageId });
}
