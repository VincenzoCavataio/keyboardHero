import { MAX_LIFE } from "./constants.js";
import { comboEl, hitInfo, multEl, scoreEl } from "./domElements.js";
import { updateBonus, updateLife } from "./hud.js";
import { comboMgr, state } from "./state.js";

export function restartGame() {
  // Ripristina stato iniziale
  Object.assign(state, {
    life: MAX_LIFE,
    bonusMeter: 0,
    bonusEnd: 0,
    score: 0,
    hits: 0,
    perfect: 0,
    good: 0,
    bad: 0,
    running: true,
    startTime: performance.now(),
    particles: [],
  });
  comboMgr.registerMiss();
  updateLife();
  updateBonus();
  scoreEl.textContent = "Score: 0";
  comboEl.textContent = "Combo: 0";
  multEl.textContent = "1x";
  hitInfo.textContent = "";
}
