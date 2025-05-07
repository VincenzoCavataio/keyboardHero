import { LANE_GAP, LANES, RECEPTOR_Y } from "./constants.js";
import { canvas } from "./domElements.js";
import { LANE_COLORS } from "./note.js";
import { state } from "./state.js";

export class Particle {
  constructor(x, y, color) {
    this.x = x;
    this.y = y;
    this.vx = (Math.random() - 0.5) * 2;
    this.vy = -Math.random() * 6 - 4;
    this.size = 10;
    this.life = 520;
    this.color = color;
  }
  update(dt) {
    this.x += this.vx;
    this.y += this.vy;
    this.vy += 0.12;
    this.size *= 0.96;
    this.life -= dt;
  }
  draw(ctx) {
    ctx.globalAlpha = Math.max(this.life / 520, 0);
    ctx.fillStyle = this.color;
    ctx.fillRect(
      this.x - this.size / 2,
      this.y - this.size / 2,
      this.size,
      this.size
    );
    ctx.globalAlpha = 1;
  }
}

export function spawnExplosion(lane) {
  const laneW = (canvas.width - (LANES - 1) * LANE_GAP) / LANES;
  const x = lane * (laneW + LANE_GAP) + laneW / 2;
  const y = RECEPTOR_Y - 8;
  // particelle standard (colori della corsia)
  for (let i = 0; i < 28; i++) {
    state.particles.push(new Particle(x, y, LANE_COLORS[lane]));
  }
  // particelle più grandi: colore di corsia di default, o gold se star-power attivo
  const glowColor = state.bonusEnd ? "gold" : LANE_COLORS[lane];
  for (let i = 0; i < 8; i++) {
    const p = new Particle(x, y, glowColor);
    p.size = 20;
    p.vx = (Math.random() - 0.5) * 4;
    p.vy = -Math.random() * 4 - 2;
    p.life = 800;
    state.particles.push(p);
  }
}
