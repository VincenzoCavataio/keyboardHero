export const NOTE_TYPES = {
  NORMAL: "normal",
  HOPO: "hopo",
  LONG: "long",
  BONUS: "bonus",
};

export const LANE_COLORS = [
  "#1abc9c",
  "#3498db",
  "#f1c40f",
  "#e67e22",
  "#e74c3c",
];

const LANE_COUNT = 5;
const HIT_WINDOW = 100; // ms before/after planned hit time
const NOTE_HEIGHT = 24;
const NOTE_WIDTH = 80;

export class Note {
  constructor({ time, lane, type = NOTE_TYPES.NORMAL, duration = 0 }) {
    this.time = time; // scheduled start (ms from song start)
    this.lane = lane; // 0‑4
    this.type = type;
    this.duration = duration; // for LONG notes
    this.hit = false;
    this.missed = false;
  }

  /**
   * Compute y‑position based on current songTime (ms) and note speed.
   */
  getScreenY(songTime, pixelsPerMs, canvasHeight) {
    const delta = this.time - songTime;
    return canvasHeight - delta * pixelsPerMs - NOTE_HEIGHT;
  }

  checkHit(songTime, lastHitSuccessful, keyPressed, strumPressed) {
    if (this.hit || this.missed) return false;
    const diff = Math.abs(songTime - this.time);
    let requiresStrum = this.type === NOTE_TYPES.NORMAL;
    if (this.type === NOTE_TYPES.HOPO) {
      requiresStrum = !lastHitSuccessful;
    }
    if (diff <= HIT_WINDOW) {
      if (keyPressed && (!requiresStrum || strumPressed)) {
        this.hit = true;
        return true;
      }
    }
    return false;
  }

  checkMiss(songTime) {
    if (!this.hit && !this.missed && songTime - this.time > HIT_WINDOW) {
      this.missed = true;
      return true;
    }
    return false;
  }

  draw(ctx, songTime, pixelsPerMs, canvasWidth, canvasHeight) {
    const laneWidth = canvasWidth / LANE_COUNT;
    const x = this.lane * laneWidth + (laneWidth - NOTE_WIDTH) / 2;
    const y = this.getScreenY(songTime, pixelsPerMs, canvasHeight);

    if (y > canvasHeight || y < -NOTE_HEIGHT) return;

    ctx.save();
    ctx.fillStyle = LANE_COLORS[this.lane];

    if (this.type === NOTE_TYPES.HOPO) {
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 3;
    } else if (this.type === NOTE_TYPES.LONG) {
      ctx.fillStyle = "#9b59b6";
    } else if (this.type === NOTE_TYPES.BONUS) {
      ctx.fillStyle = "#f39c12";
      ctx.shadowBlur = 10;
      ctx.shadowColor = "#f39c12";
    }

    ctx.fillRect(x, y, NOTE_WIDTH, NOTE_HEIGHT);
    if (this.type === NOTE_TYPES.HOPO) {
      ctx.strokeRect(x, y, NOTE_WIDTH, NOTE_HEIGHT);
    }

    // Tail for LONG note
    if (this.type === NOTE_TYPES.LONG && this.duration > 0) {
      const endY = this.getScreenY(
        this.time + this.duration,
        pixelsPerMs,
        canvasHeight
      );
      ctx.fillRect(x + NOTE_WIDTH / 4, endY, NOTE_WIDTH / 2, y - endY);
    }
    ctx.restore();
  }
}
