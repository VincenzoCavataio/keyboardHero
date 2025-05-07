// note.js â€” Note rendering and logic for Guitar-Hero-Lite (rounded corners)

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
const CORNER_RADIUS = 6; // radius for rounding corners of notes

/**
 * Draws a filled rounded rectangle (and optional stroke) on the canvas.
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} x - Top-left x
 * @param {number} y - Top-left y
 * @param {number} width
 * @param {number} height
 * @param {number} radius
 */
function drawRoundedRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
  ctx.fill();
  // if a stroke style is set, stroke the path
  if (ctx.strokeStyle && ctx.lineWidth) ctx.stroke();
}

export class Note {
  constructor({ time, lane, type = NOTE_TYPES.NORMAL, duration = 0 }) {
    this.time = time; // start time
    this.lane = lane;
    this.type = type;
    this.duration = duration; // only for LONG notes
    this.hit = false;
    this.missed = false;
    this.holding = false;
    this.completed = false;
  }

  getScreenY(songTime, pixelsPerMs, canvasHeight) {
    const delta = this.time - songTime;
    return canvasHeight - delta * pixelsPerMs - NOTE_HEIGHT;
  }

  checkHit(
    songTime,
    lastHitSuccessful,
    keyPressed,
    strumPressed,
    onKeyRelease
  ) {
    if (this.missed || this.completed)
      return { startHit: false, endHit: false };
    // Instant notes
    if (this.type !== NOTE_TYPES.LONG) {
      const diff = Math.abs(songTime - this.time);
      if (diff <= HIT_WINDOW && keyPressed) {
        const needsStrum =
          this.type === NOTE_TYPES.NORMAL ||
          (this.type === NOTE_TYPES.HOPO && !lastHitSuccessful);
        if (!needsStrum || strumPressed) {
          this.hit = true;
          return { startHit: true, endHit: false };
        }
      }
      if (!this.hit && songTime - this.time > HIT_WINDOW) this.missed = true;
      return { startHit: false, endHit: false };
    }

    // LONG-note start
    if (!this.holding) {
      const diffStart = Math.abs(songTime - this.time);
      if (diffStart <= HIT_WINDOW && keyPressed) {
        this.holding = true;
        return { startHit: true, endHit: false };
      }
      if (songTime - this.time > HIT_WINDOW) this.missed = true;
      return { startHit: false, endHit: false };
    }

    // LONG-note end
    const endTime = this.time + this.duration;
    if (this.holding) {
      if (onKeyRelease) {
        const diffEnd = Math.abs(songTime - endTime);
        if (diffEnd <= HIT_WINDOW) {
          this.completed = true;
          this.hit = true;
          return { startHit: false, endHit: true };
        }
        if (songTime < endTime - HIT_WINDOW) this.missed = true;
      }
      if (songTime - endTime > HIT_WINDOW) this.missed = true;
    }
    return { startHit: false, endHit: false };
  }

  draw(ctx, songTime, pixelsPerMs, canvasWidth, canvasHeight) {
    // Skip if completed or instant missed/hit
    if (
      (this.type !== NOTE_TYPES.LONG && (this.missed || this.hit)) ||
      this.completed
    )
      return;
    const laneWidth = canvasWidth / LANE_COUNT;
    const x = this.lane * laneWidth + (laneWidth - NOTE_WIDTH) / 2;
    const y = this.getScreenY(songTime, pixelsPerMs, canvasHeight);
    if (y > canvasHeight || y < -NOTE_HEIGHT) return;

    ctx.save();
    // Determine fill color: lane or gold if star power
    const fillColor =
      window.state && window.state.bonusEnd ? "gold" : LANE_COLORS[this.lane];
    ctx.fillStyle = fillColor;
    ctx.strokeStyle = this.type === NOTE_TYPES.HOPO ? "#fff" : "";
    ctx.lineWidth = this.type === NOTE_TYPES.HOPO ? 3 : 0;

    // Draw tail for LONG
    if (this.type === NOTE_TYPES.LONG) {
      const tailHeight = this.duration * pixelsPerMs;
      drawRoundedRect(
        ctx,
        x + NOTE_WIDTH / 4,
        y - tailHeight,
        NOTE_WIDTH / 2,
        tailHeight,
        CORNER_RADIUS
      );
    }

    // Draw head
    drawRoundedRect(ctx, x, y, NOTE_WIDTH, NOTE_HEIGHT, CORNER_RADIUS);

    // Fade out missed LONG
    if (this.type === NOTE_TYPES.LONG && this.missed) {
      ctx.fillStyle = "rgba(0,0,0,0.5)";
      drawRoundedRect(ctx, x, y, NOTE_WIDTH, NOTE_HEIGHT, CORNER_RADIUS);
    }

    ctx.restore();
  }
}
