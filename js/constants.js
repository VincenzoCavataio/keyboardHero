import { canvas } from "./domElements.js";

export const LANES = 5;
export const LANE_GAP = 8; // Spazio ridotto tra corsie
export const NOTE_SPEED = 0.4; // px/ms
export const RECEPTOR_Y = canvas.height - 60;
export const RECEPTOR_H = 14;
export const WINDOW_PERFECT = 20;
export const WINDOW_GOOD = 50;
export const WINDOW_BAD = 80;
export const SCORE_PERFECT = 5;
export const SCORE_GOOD = 3;
export const SCORE_BAD = 1;
export const MAX_LIFE = 10;
export const COMBO_LIFE_STEP = 20;
export const BONUS_DURATION = 10000; // ms
export const BONUS_EXTENSION = 5000;
export const BONUS_COST = 40;
export const HIGH_KEY = "gh_highscore";

export const SCORE_LABELS = {
  PERFECT: "PERFECT",
  GOOD: "GOOD",
  BAD: "BAD",
  MISS: "MISS",
};
