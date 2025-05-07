import { ComboManager } from "./combo.js";
import { MAX_LIFE } from "./constants.js";
import { keyElems } from "./domElements.js";
import { InputManager } from "./input.js"; // Input tastiera + touch

export const inputMgr = new InputManager(keyElems);
export const comboMgr = new ComboManager();

export const state = {
  // barre e punteggio
  life: MAX_LIFE,
  bonusMeter: 0,
  bonusEnd: 0,

  // note
  notes: [],
  totalNotes: 0,
  score: 0,
  hits: 0,
  perfect: 0,
  good: 0,
  bad: 0,

  // controllo ciclo
  running: false,
  startTime: 0,

  // particelle
  particles: [],

  // countdown
  countdownActive: false,
  countdownValue: 0,
  showGo: false,
};
