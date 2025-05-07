import { MAX_LIFE } from "./constants.js";
import { bonusFill, hitInfo, lifeFill, lifeValEl } from "./domElements.js";
import { state } from "./state.js";

export function updateLife() {
  lifeValEl.textContent = `${state.life} / ${MAX_LIFE}`;
  lifeFill.style.width = `${(state.life / MAX_LIFE) * 100}%`;
}

export function updateBonus() {
  if (state.bonusEnd) {
    const pct =
      (Math.max(state.bonusEnd - performance.now(), 0) / BONUS_DURATION) * 100;
    bonusFill.style.width = `${pct}%`;
  } else {
    bonusFill.style.width = `${state.bonusMeter}%`;
  }
}

let hitTimeout = null;

export function flashHit(text, cls) {
  hitInfo.textContent = text;
  hitInfo.className = cls;
  hitInfo.style.opacity = 1;
  clearTimeout(hitTimeout);
  hitTimeout = setTimeout(() => (hitInfo.style.opacity = 0), 1000);
}
