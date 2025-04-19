import { loadSongFromFile } from "./songLoader.js";
import { ComboManager } from "./combo.js";
import { NOTE_TYPES, LANE_COLORS, Note } from "./note.js";
import { InputManager } from "./input.js";

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const picker = document.getElementById("songFile");
const audio = document.getElementById("audioPlayer");

const scoreEl = document.getElementById("scoreDisplay");
const highEl = document.getElementById("highDisplay");
const lifeValEl = document.getElementById("lifeValue");
const lifeFill = document.getElementById("lifeFill");
const comboEl = document.getElementById("comboDisplay");
const multEl = document.getElementById("multiplierDisplay");
const hitInfo = document.getElementById("hitInfo");
const bonusFill = document.getElementById("bonusFill");
const modal = document.getElementById("resultModal");
const mScore = document.getElementById("modalScore");
const mAcc = document.getElementById("modalAcc");
const mBreak = document.getElementById("modalBreak");
const newBtn = document.getElementById("newSongBtn");
const keyElems = document.querySelectorAll(".keyLabel");

const inputMgr = new InputManager(keyElems);
const comboMgr = new ComboManager();

const LANES = 5,
  NOTE_SPEED = 0.4;
const RECEPTOR_Y = canvas.height - 60,
  RECEPTOR_H = 14;
const PERFECT_W = 30,
  GOOD_W = 70,
  BAD_W = 120;
const P_PERF = 5,
  P_GOOD = 3,
  P_BAD = 1;
const MAX_LIFE = 100;

let life = MAX_LIFE,
  bonusMeter = 0,
  bonusActive = false,
  bonusEnd = 0;

const HIGH_KEY = "gh_highscore";
let highScore = parseInt(localStorage.getItem(HIGH_KEY)) || 0;
highEl.textContent = `High Score: ${highScore}`;

let notes = [],
  score = 0,
  total = 0,
  hit = 0,
  countPerfect = 0,
  countGood = 0,
  countBad = 0,
  running = false,
  startTime = 0;

/* particle */
const particles = [],
  PART_CNT = 28;
class Particle {
  constructor(x, y, c) {
    this.x = x;
    this.y = y;
    this.vx = (Math.random() - 0.5) * 2;
    this.vy = -Math.random() * 6 - 4;
    this.life = 520;
    this.c = c;
    this.s = 10;
  }
  upd(d) {
    this.x += this.vx;
    this.y += this.vy;
    this.vy += 0.12;
    this.s *= 0.96;
    this.life -= d;
  }
  draw(ctx) {
    ctx.globalAlpha = Math.max(this.life / 520, 0);
    ctx.fillStyle = this.c;
    ctx.fillRect(this.x - this.s / 2, this.y - this.s / 2, this.s, this.s);
    ctx.globalAlpha = 1;
  }
}
function boom(l, lw) {
  const x = l * lw + lw / 2,
    y = RECEPTOR_Y - 8,
    c = LANE_COLORS[l];
  for (let i = 0; i < PART_CNT; i++) particles.push(new Particle(x, y, c));
}

/* hit text 1s */
let hitTimeout = null;
function flash(txt, cls) {
  hitInfo.textContent = txt;
  hitInfo.className = cls;
  hitInfo.style.opacity = 1;
  if (hitTimeout) clearTimeout(hitTimeout);
  hitTimeout = setTimeout(() => (hitInfo.style.opacity = 0), 1000);
}

/* UI */
function updateLife() {
  lifeValEl.textContent = `${life} / ${MAX_LIFE}`;
  lifeFill.style.width = `${(life / MAX_LIFE) * 100}%`;
}
function updateBonus() {
  bonusFill.style.width = `${bonusMeter}%`;
}

/* bonus key */
window.addEventListener("keydown", (e) => {
  if (e.code === "KeyB" && !bonusActive && bonusMeter >= 40) {
    bonusActive = true;
    bonusEnd = performance.now() + 10000;
    bonusMeter -= 40;
    updateBonus();
    document.body.classList.add("bonus-active");
  }
});

/* load song */
picker.addEventListener("change", async (e) => {
  const mp3 = e.target.files[0];
  if (!mp3) return;
  audio.src = URL.createObjectURL(mp3);
  await audio.load();
  try {
    const base = mp3.name.replace(/\\.mp3$/i, "");
    notes = (await (await fetch(`./assets/sample/${base}.json`)).json()).map(
      (n) =>
        new Note({
          time: n.time,
          lane: n.lane,
          type: NOTE_TYPES[n.type?.toUpperCase()] || NOTE_TYPES.NORMAL,
          duration: n.duration || 0,
        })
    );
    total = notes.length;
  } catch {
    alert("Missing chart");
    return;
  }

  picker.closest(".picker-label").style.display = "none";
  resetGame();
  requestAnimationFrame(loop);
  audio.play();
});

function resetGame() {
  life = MAX_LIFE;
  bonusMeter = 0;
  bonusActive = false;
  updateLife();
  updateBonus();
  score = hit = countPerfect = countGood = countBad = 0;
  comboMgr.registerMiss();
  startTime = performance.now();
  running = true;
}

/* combo reward */
function comboReward() {
  if (comboMgr.combo > 0 && comboMgr.combo % 20 === 0 && life < MAX_LIFE) {
    life++;
    updateLife();
  }
}

/* main loop */
function loop(ts) {
  if (!running) return;
  const st = ts - startTime;
  update(st, ts);
  draw(st);
  if (notes.every((n) => n.hit || n.missed) || life <= 0) {
    endGame();
    return;
  }
  requestAnimationFrame(loop);
}

function update(st, now) {
  for (const n of notes) {
    if (n.hit || n.missed) continue;
    const diff = Math.abs(st - n.time),
      pressed = inputMgr.isLanePressed(n.lane),
      strum = inputMgr.strumPressed;
    const needStrum =
      n.type === NOTE_TYPES.HOPO
        ? comboMgr.combo === 0
        : n.type === NOTE_TYPES.NORMAL;
    if (pressed && (!needStrum || strum)) {
      if (diff <= PERFECT_W) processHit(n, P_PERF, "PERFECT", "perfect", now);
      else if (diff <= GOOD_W) processHit(n, P_GOOD, "GOOD", "good", now);
      else if (diff <= BAD_W) processHit(n, P_BAD, "BAD", "bad", now);
    } else if (st > n.time + BAD_W) {
      n.missed = true;
      life--;
      updateLife();
      comboMgr.registerMiss();
      flash("MISS", "miss");
    }
  }
  if (bonusActive && now >= bonusEnd) {
    bonusActive = false;
    document.body.classList.remove("bonus-active");
  }
  comboMgr.update(now);
  scoreEl.textContent = `Score: ${score}`;
  comboEl.textContent = `Combo: ${comboMgr.combo}`;
  multEl.textContent = `${comboMgr.currentMultiplier}×`;
}

function processHit(n, basePts, label, cls, now) {
  const lw = canvas.width / LANES;
  n.hit = true;
  hit++;
  if (label === "PERFECT") countPerfect++;
  else if (label === "GOOD") countGood++;
  else countBad++;
  if (n.type === NOTE_TYPES.BONUS) {
    bonusMeter = Math.min(bonusMeter + 20, 100);
    updateBonus();
  }
  comboMgr.registerHit(false, now);
  comboReward();
  score += basePts * comboMgr.currentMultiplier * (bonusActive ? 2 : 1);
  boom(n.lane, lw);
  flash(label, cls);
}

function draw(st) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const lw = canvas.width / LANES;
  for (let i = 0; i < LANES; i++) {
    ctx.fillStyle = i & 1 ? "#141414" : "#0b0b0b";
    ctx.fillRect(i * lw, 0, lw, canvas.height);
  }
  for (let i = 0; i < LANES; i++) {
    ctx.fillStyle = LANE_COLORS[i];
    ctx.globalAlpha = 0.25;
    ctx.fillRect(i * lw + (lw - 80) / 2, RECEPTOR_Y, 80, RECEPTOR_H);
  }
  ctx.globalAlpha = 1;
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, RECEPTOR_Y + RECEPTOR_H, canvas.width, 2);
  for (const n of notes)
    if (!n.hit) n.draw(ctx, st, NOTE_SPEED, canvas.width, canvas.height);
  for (let i = particles.length - 1; i >= 0; i--) {
    particles[i].upd(16);
    particles[i].draw(ctx);
    if (particles[i].life <= 0) particles.splice(i, 1);
  }
}

function endGame() {
  running = false;
  audio.pause();
  if (score > highScore) {
    highScore = score;
    localStorage.setItem(HIGH_KEY, highScore);
  }
  highEl.textContent = `High Score: ${highScore}`;
  showModal();
}

function showModal() {
  const acc = ((hit / total) * 100 || 0).toFixed(1);
  mScore.textContent = `Score: ${score}`;
  mAcc.textContent = `Accuracy: ${acc}%  (${hit}/${total})`;
  mBreak.innerHTML = `<li>Perfect: ${((countPerfect / hit) * 100 || 0).toFixed(
    1
  )}%</li>
                    <li>Good: ${((countGood / hit) * 100 || 0).toFixed(1)}%</li>
                    <li>Bad: ${((countBad / hit) * 100 || 0).toFixed(1)}%</li>
                    <li>Miss: ${(100 - acc).toFixed(1)}%</li>`;
  modal.classList.remove("hidden");
}

newBtn.addEventListener("click", () => {
  modal.classList.add("hidden");
  picker.closest(".picker-label").style.display = "inline-flex";
  scoreEl.textContent = "Score: 0";
  comboEl.textContent = "Combo: 0";
  multEl.textContent = "1×";
  hitInfo.textContent = "";
  canvas.focus();
});

canvas.addEventListener("blur", () => setTimeout(() => canvas.focus(), 0));
