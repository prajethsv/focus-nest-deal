import { KEYS } from "../data/schema.js";
import * as storage from "./storage.js";
import { stageForMinutes, stageProgress, nextStage, STAGES } from "../data/companion.js";
import { PET_DEFAULTS, normalizePet } from "./petArt.js";

export { stageForMinutes, stageProgress, nextStage, STAGES, PET_DEFAULTS, normalizePet };

export const getCompanion = () => storage.get(KEYS.companion);

/**
 * Credit a genuinely completed focus session. Growth only ever moves forward.
 * Returns { companion, newStage } where newStage is set the first time a
 * stage is reached, so the popup can celebrate once.
 */
export async function creditFocus(minutes) {
  const before = await getCompanion();
  const totalFocusMinutes = before.totalFocusMinutes + Math.max(0, Math.round(minutes));
  const stage = stageForMinutes(totalFocusMinutes);
  const firstTime = !before.milestonesSeen.includes(stage.id) && stage.id !== before.stage;
  const companion = await storage.update(KEYS.companion, {
    totalFocusMinutes,
    totalFocusSessions: before.totalFocusSessions + 1,
    stage: stage.id,
    milestonesSeen: firstTime ? [...before.milestonesSeen, stage.id] : before.milestonesSeen,
    pet: normalizePet(before.pet),
  });
  return { companion, newStage: firstTime ? stage : null };
}

export async function rename(name) {
  const clean = String(name || "").trim().slice(0, 24);
  return storage.update(KEYS.companion, { name: clean || null });
}

/** Merge pet appearance fields (colors / pattern). */
export async function updatePet(patch) {
  const before = await getCompanion();
  const pet = normalizePet({ ...before.pet, ...patch });
  return storage.update(KEYS.companion, { pet });
}
