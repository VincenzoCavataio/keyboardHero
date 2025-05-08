import {
  BONUS_EXTENSION,
  COMBO_LIFE_STEP,
  MAX_LIFE,
  SCORE_LABELS,
} from "./constants.js";
import { flashHit, updateLife } from "./hud.js";
import { NOTE_TYPES } from "./note.js";
import { spawnExplosion } from "./particicle.js";
import { comboMgr, state } from "./state.js";

const { PERFECT, GOOD } = SCORE_LABELS;

export function handleHit(note, baseScore, label, cls, now) {
  note.hit = true;
  state.hits++;
  if (label === PERFECT) state.perfect++;
  else if (label === GOOD) state.good++;
  else state.bad++;

  // Gestione bonus note
  if (note.type === NOTE_TYPES.BONUS) {
    if (state.bonusEnd) {
      state.bonusEnd += BONUS_EXTENSION;
    } else {
      state.bonusMeter = Math.min(state.bonusMeter + 20, 100);
    }
  }

  comboMgr.registerHit(false, now);
  // Vita extra ogni COMBO_LIFE_STEP hit
  if (
    comboMgr.combo > 0 &&
    comboMgr.combo % COMBO_LIFE_STEP === 0 &&
    state.life < MAX_LIFE
  ) {
    state.life++;
    updateLife();
  }

  const multiplier = comboMgr.currentMultiplier * (state.bonusEnd ? 2 : 1);
  state.score += baseScore * multiplier;
  spawnExplosion(note.lane);
  flashHit(label, cls);
}
