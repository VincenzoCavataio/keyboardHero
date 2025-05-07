import { HIGH_KEY } from "./constants.js";
import { audio, highEl, mAcc, mBreak, modal, mScore } from "./domElements.js";
import { state } from "./state.js";

export function finishGame() {
  state.running = false;
  audio.pause();
  const hs = Math.max(state.score, Number(localStorage.getItem(HIGH_KEY) || 0));
  localStorage.setItem(HIGH_KEY, hs);
  highEl.textContent = `High Score: ${hs}`;
  const acc = ((state.hits / state.totalNotes) * 100).toFixed(1);
  mScore.textContent = `Score: ${state.score}`;
  mAcc.textContent = `Accuracy: ${acc}% (${state.hits}/${state.totalNotes})`;
  mBreak.innerHTML =
    `<li>Perfect: ${((state.perfect / state.hits) * 100).toFixed(1)}%</li>` +
    `<li>Good:    ${((state.good / state.hits) * 100).toFixed(1)}%</li>` +
    `<li>Bad:     ${((state.bad / state.hits) * 100).toFixed(1)}%</li>` +
    `<li>Miss:    ${(100 - acc).toFixed(1)}%</li>`;
  modal.classList.remove("hidden");
}
