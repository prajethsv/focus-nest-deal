/**
 * Sound design, generated entirely with the Web Audio API.
 * No audio files, no network requests, no analytics — just short soft tones.
 * Everything is off unless the matching setting is on, and volume is scaled.
 */
let ctx = null;

function audio() {
  if (typeof AudioContext === "undefined") return null;
  if (!ctx) ctx = new AudioContext();
  if (ctx.state === "suspended") ctx.resume().catch(() => {});
  return ctx;
}

function tone({ freq, start = 0, duration = 0.12, gain = 0.05, type = "sine" }) {
  const ac = audio();
  if (!ac) return;
  const t0 = ac.currentTime + start;
  const osc = ac.createOscillator();
  const amp = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  amp.gain.setValueAtTime(0.0001, t0);
  amp.gain.exponentialRampToValueAtTime(Math.max(0.0002, gain), t0 + 0.012);
  amp.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
  osc.connect(amp).connect(ac.destination);
  osc.start(t0);
  osc.stop(t0 + duration + 0.02);
}

let settings = { soundClicks: false, soundChime: false, soundVolume: 0.5 };
export function configureSound(next) {
  settings = { ...settings, ...next };
}

const vol = (base) => base * Math.min(1, Math.max(0, settings.soundVolume ?? 0.5));

/** Soft, satisfying tap for buttons and toggles. */
export function playClick(kind = "tap") {
  if (!settings.soundClicks) return;
  if (kind === "toggle-on") {
    tone({ freq: 660, duration: 0.09, gain: vol(0.05), type: "triangle" });
    tone({ freq: 990, start: 0.05, duration: 0.09, gain: vol(0.03), type: "triangle" });
  } else if (kind === "toggle-off") {
    tone({ freq: 520, duration: 0.09, gain: vol(0.04), type: "triangle" });
    tone({ freq: 380, start: 0.05, duration: 0.1, gain: vol(0.03), type: "triangle" });
  } else {
    tone({ freq: 440, duration: 0.07, gain: vol(0.035), type: "triangle" });
    tone({ freq: 880, start: 0.015, duration: 0.05, gain: vol(0.02), type: "sine" });
  }
}

/** Warm three-note chime at the end of a phase. */
export function playChime() {
  if (!settings.soundChime) return;
  [
    [523.25, 0],
    [659.25, 0.16],
    [783.99, 0.32],
  ].forEach(([freq, start]) =>
    tone({ freq, start, duration: 0.55, gain: vol(0.06), type: "sine" })
  );
}

/** Tiny sparkle for a companion milestone. */
export function playMilestone() {
  if (!settings.soundChime) return;
  [880, 1174.66, 1567.98].forEach((freq, i) =>
    tone({ freq, start: i * 0.09, duration: 0.35, gain: vol(0.045), type: "sine" })
  );
}
