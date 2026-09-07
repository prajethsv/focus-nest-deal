/**
 * Gentle progression ladder. Growth is tied ONLY to completed focus
 * minutes — there is no decay, no penalty, and nothing to lose.
 * Visuals are SVG (egg / customizable pet), not emoji.
 */
export const STAGES = [
  {
    id: "egg",
    label: "Speckled egg",
    minMinutes: 0,
    blurb: "Something is resting in the nest. Each finished session stirs the shell.",
    milestone: "A little egg has appeared in your nest.",
  },
  {
    id: "hatchling",
    label: "Hatchling",
    minMinutes: 60,
    blurb: "It hatched. Small, sleepy, entirely on your side.",
    milestone: "Your egg hatched — say hello to your hatchling.",
  },
  {
    id: "fledgling",
    label: "Fledgling",
    minMinutes: 300,
    blurb: "Steadier now, hopping to the edge of the nest.",
    milestone: "Your hatchling grew into a fledgling.",
  },
  {
    id: "companion",
    label: "Companion",
    minMinutes: 900,
    blurb: "Fully grown, and it waits for you every session.",
    milestone: "Fully grown. Your companion is here to stay.",
  },
];

export function stageForMinutes(minutes = 0) {
  let current = STAGES[0];
  for (const stage of STAGES) if (minutes >= stage.minMinutes) current = stage;
  return current;
}

export function nextStage(stageId) {
  const i = STAGES.findIndex((s) => s.id === stageId);
  return i >= 0 && i < STAGES.length - 1 ? STAGES[i + 1] : null;
}

/** 0..1 progress toward the next stage (1 when fully grown). */
export function stageProgress(minutes = 0) {
  const current = stageForMinutes(minutes);
  const next = nextStage(current.id);
  if (!next) return 1;
  const span = next.minMinutes - current.minMinutes;
  return Math.min(1, Math.max(0, (minutes - current.minMinutes) / span));
}
