/*====================================================================
  main.js — Guitar-Hero-Lite (Refactored + Mobile Touch + Default Sample + Countdown)
======================================================================
© 2025  — MIT-ish license. Use freely & have fun!

Versione leggibile e commentata:
- Caricamento automatico di assets/sample/test.mp3 e test.json
- Countdown 3-2-1-GO prima di avviare audio e gioco
- Interfaccia touch per mobile sulle label A-S-D-F-G
- Effetti glow e particelle dorate come prima
====================================================================*/

// 1. IMPORTS ------------------------------------------------------------------
import { ComboManager } from "./combo.js"; // Gestione combo & moltiplicatori
import { NOTE_TYPES, LANE_COLORS, Note } from "./note.js"; // Note e colori corsie
import { InputManager } from "./input.js"; // Input tastiera + touch

// 2. UTILITY ------------------------------------------------------------------
/**
 * Converte un colore HEX (#rrggbb) in stringa "r,g,b"
 */
function hexToRgb(hex) {
  const [r, g, b] = hex
    .replace("#", "")
    .match(/.{2}/g)
    .map((h) => parseInt(h, 16));
  return `${r},${g},${b}`;
}

// 3. RIFERIMENTI DOM ----------------------------------------------------------
const $ = (sel) => document.querySelector(sel);
const canvas = $("#gameCanvas");
const ctx = canvas.getContext("2d");
// L'input file non verrà mai aperto: usiamo solo il pulsante per default
const pickerLabel = $(".picker-label"); // wrapper del pulsante "Upload song"
const audio = $("#audioPlayer");
const keyElems = document.querySelectorAll(".keyLabel");

// HUD
const scoreEl = $("#scoreDisplay");
const highEl = $("#highDisplay");
const lifeValEl = $("#lifeValue");
const lifeFill = $("#lifeFill");
const comboEl = $("#comboDisplay");
const multEl = $("#multiplierDisplay");
const hitInfo = $("#hitInfo");
const bonusFill = $("#bonusFill");
const modal = $("#resultModal");
const mScore = $("#modalScore");
const mAcc = $("#modalAcc");
const mBreak = $("#modalBreak");
const newBtn = $("#newSongBtn");

// 4. COSTANTI DI GIOCO -------------------------------------------------------
const LANES = 5;
const LANE_GAP = 8; // Spazio ridotto tra corsie
const NOTE_SPEED = 0.4; // px/ms
const RECEPTOR_Y = canvas.height - 60;
const RECEPTOR_H = 14;

const WINDOW_PERFECT = 30;
const WINDOW_GOOD = 70;
const WINDOW_BAD = 120;

const SCORE_PERFECT = 5;
const SCORE_GOOD = 3;
const SCORE_BAD = 1;

const MAX_LIFE = 400;
const COMBO_LIFE_STEP = 20;

const BONUS_DURATION = 10000; // ms
const BONUS_EXTENSION = 5000;
const BONUS_COST = 40;

const HIGH_KEY = "gh_highscore";

// 5. STATO GIOCO -------------------------------------------------------------
const inputMgr = new InputManager(keyElems);
const comboMgr = new ComboManager();

const state = {
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

let countdownInterval = null;

// 6. HANDLER HUD -------------------------------------------------------------
function updateLife() {
  lifeValEl.textContent = `${state.life} / ${MAX_LIFE}`;
  lifeFill.style.width = `${(state.life / MAX_LIFE) * 100}%`;
}
function updateBonus() {
  if (state.bonusEnd) {
    const pct =
      (Math.max(state.bonusEnd - performance.now(), 0) / BONUS_DURATION) * 100;
    bonusFill.style.width = `${pct}%`;
  } else {
    bonusFill.style.width = `${state.bonusMeter}%`;
  }
}

let hitTimeout = null;
function flashHit(text, cls) {
  hitInfo.textContent = text;
  hitInfo.className = cls;
  hitInfo.style.opacity = 1;
  clearTimeout(hitTimeout);
  hitTimeout = setTimeout(() => (hitInfo.style.opacity = 0), 1000);
}

// 7. PARTICELLE -------------------------------------------------------------
class Particle {
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
function spawnExplosion(lane) {
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

// 8. BONUS (Star Power) ------------------------------------------------------
window.addEventListener("keydown", (e) => {
  if (e.code !== "KeyB") return;
  if (state.bonusEnd || state.bonusMeter < BONUS_COST) return;
  state.bonusMeter = 0;
  state.bonusEnd = performance.now() + BONUS_DURATION;
  document.body.classList.add("bonus-active");
  updateBonus();
});

// 9. COUNTDOWN PRE-GAME ------------------------------------------------------
/**
 * Avvia un conto alla rovescia 3-2-1-GO,
 * al termine richiama restartGame() e audio.play().
 */
function startCountdown() {
  state.countdownActive = true;
  state.countdownValue = 3;
  state.showGo = false;

  countdownInterval = setInterval(() => {
    if (state.countdownValue > 1) {
      state.countdownValue--;
    } else {
      // da 1 -> mostra GO
      clearInterval(countdownInterval);
      state.countdownValue = 0;
      state.showGo = true;
      setTimeout(() => {
        // fine GO: avvia gioco
        state.countdownActive = false;
        state.showGo = false;
        restartGame();
        audio.play();
      }, 1000);
    }
  }, 1000);
}

// 10. HANDLER "UPLOAD SONG" ---------------------------------------------
// Sempre carica sample/test.mp3 + test.json, niente file picker.
pickerLabel.addEventListener("click", async (e) => {
  e.preventDefault();
  // 1) Carica audio
  const base = "test";
  audio.src = `assets/sample/${base}.mp3`;
  await audio.load();

  // 2) Carica chart JSON
  let chart;
  try {
    chart = await fetch(`assets/sample/${base}.json`).then((r) => r.json());
  } catch {
    alert("Errore: impossibile caricare assets/sample/test.json");
    return;
  }

  // 3) Inizializza state.notes
  state.notes = chart.map(
    (n) =>
      new Note({
        time: n.time,
        lane: n.lane,
        type: NOTE_TYPES[n.type?.toUpperCase()] || NOTE_TYPES.NORMAL,
        duration: n.duration || 0,
      })
  );
  state.totalNotes = state.notes.length;

  // 4) Nascondi pulsante e avvia countdown
  pickerLabel.style.display = "none";
  startCountdown();

  // Avvio del gameLoop disegnando anche il countdown
  requestAnimationFrame(gameLoop);
});

// 11. RESTART GAME ----------------------------------------------------------
function restartGame() {
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
  multEl.textContent = "1×";
  hitInfo.textContent = "";
}

// 12. MAIN LOOP --------------------------------------------------------------
function gameLoop(timestamp) {
  // Durante il countdown mostriamo solo l'overlay
  if (state.countdownActive) {
    drawCountdown();
    requestAnimationFrame(gameLoop);
    return;
  }

  if (!state.running) return;
  const songTime = timestamp - state.startTime;
  updateLogic(songTime, timestamp);
  drawFrame(songTime);

  // Controllo fine canzone
  if (state.life <= 0 || state.notes.every((n) => n.hit || n.missed)) {
    finishGame();
  } else {
    requestAnimationFrame(gameLoop);
  }
}

// 13. LOGIC UPDATE ----------------------------------------------------------
function updateLogic(songTime, now) {
  for (const note of state.notes) {
    if (note.hit || note.missed) continue;
    const diff = Math.abs(songTime - note.time);
    const pressed = inputMgr.isLanePressed(note.lane);
    const strum = inputMgr.strumPressed;
    const needStrum =
      note.type === NOTE_TYPES.HOPO
        ? comboMgr.combo === 0
        : note.type === NOTE_TYPES.NORMAL;

    // Hit detection
    if (pressed && (!needStrum || strum)) {
      if (diff <= WINDOW_PERFECT)
        handleHit(note, SCORE_PERFECT, "PERFECT", "perfect", now);
      else if (diff <= WINDOW_GOOD)
        handleHit(note, SCORE_GOOD, "GOOD", "good", now);
      else if (diff <= WINDOW_BAD)
        handleHit(note, SCORE_BAD, "BAD", "bad", now);
    }
    // Miss detection
    else if (songTime > note.time + WINDOW_BAD) {
      note.missed = true;
      state.life = Math.max(state.life - 1, 0);
      comboMgr.registerMiss();
      flashHit("MISS", "miss");
      updateLife();
    }
  }

  // Disattiva star power se scaduto
  if (state.bonusEnd && now >= state.bonusEnd) {
    state.bonusEnd = 0;
    document.body.classList.remove("bonus-active");
  }

  updateBonus();
  comboMgr.update(now);
  scoreEl.textContent = `Score: ${state.score}`;
  comboEl.textContent = `Combo: ${comboMgr.combo}`;
  multEl.textContent = `${comboMgr.currentMultiplier}×`;
}

// 14. HIT HANDLER -----------------------------------------------------------
function handleHit(note, baseScore, label, cls, now) {
  note.hit = true;
  state.hits++;
  if (label === "PERFECT") state.perfect++;
  else if (label === "GOOD") state.good++;
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

// 15. DRAW FRAME -------------------------------------------------------------
function drawFrame(songTime) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const laneW = (canvas.width - (LANES - 1) * LANE_GAP) / LANES;
  // 15.1. Sfondo lumi glow
  for (let i = 0; i < LANES; i++) {
    const x = i * (laneW + LANE_GAP);
    const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    if (state.bonusEnd) {
      grad.addColorStop(0, "rgba(255,223,0,0.4)");
      grad.addColorStop(0.5, "rgba(255,180,0,0.2)");
      grad.addColorStop(1, "rgba(255,223,0,0.1)");
    } else {
      const base = LANE_COLORS[i];
      grad.addColorStop(0, `rgba(${hexToRgb(base)},0.1)`);
      grad.addColorStop(0.5, `rgba(${hexToRgb(base)},0.05)`);
      grad.addColorStop(1, `rgba(${hexToRgb(base)},0.1)`);
    }
    ctx.fillStyle = grad;
    ctx.fillRect(x, 0, laneW, canvas.height);
  }
  // 15.2. Bordo glow su star power
  if (state.bonusEnd) {
    ctx.save();
    ctx.shadowBlur = 30;
    ctx.shadowColor = "gold";
    ctx.lineWidth = 20;
    ctx.strokeStyle = "rgba(255,223,0,0.7)";
    ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);
    ctx.restore();
  }
  // 15.3 Recettori
  for (let i = 0; i < LANES; i++) {
    const x = i * (laneW + LANE_GAP) + (laneW - 80) / 2;
    ctx.save();
    if (state.bonusEnd) {
      ctx.shadowBlur = 20;
      ctx.shadowColor = "gold";
    }
    ctx.globalAlpha = inputMgr.isLanePressed(i) ? 0.6 : 0.25;
    ctx.fillStyle = LANE_COLORS[i];
    ctx.fillRect(x, RECEPTOR_Y, 80, RECEPTOR_H);
    ctx.restore();
  }
  // 15.4 Key labels tappable
  const keyW = 80,
    keyH = 50,
    keyY = RECEPTOR_Y + RECEPTOR_H + 8;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = "bold 24px sans-serif";
  for (let i = 0; i < LANES; i++) {
    const cx = i * (laneW + LANE_GAP) + laneW / 2;
    ctx.fillStyle = LANE_COLORS[i];
    ctx.fillRect(cx - keyW / 2, keyY, keyW, keyH);
    ctx.fillStyle = "#fff";
    ctx.fillText(["A", "S", "D", "F", "G"][i], cx, keyY + keyH / 2);
  }
  // 15.5 Note e particelle
  state.notes.forEach((n) => {
    if (!n.hit)
      n.draw(ctx, songTime, NOTE_SPEED, canvas.width, canvas.height, LANE_GAP);
  });
  for (let i = state.particles.length - 1; i >= 0; i--) {
    const p = state.particles[i];
    p.update(16);
    p.draw(ctx);
    if (p.life <= 0) state.particles.splice(i, 1);
  }
}

// 16. DRAW COUNTDOWN ---------------------------------------------------------
function drawCountdown() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "rgba(0,0,0,0.7)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "gold";
  ctx.font = "bold 120px sans-serif";
  ctx.textAlign = "center";
  const text = state.showGo ? "GO" : state.countdownValue;
  ctx.fillText(text, canvas.width / 2, canvas.height / 2);
}

// 17. FINE GIOCO & MODAL ----------------------------------------------------
function finishGame() {
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

// 18. MODAL RESTART ----------------------------------------------------------
newBtn.addEventListener("click", () => {
  modal.classList.add("hidden");
  pickerLabel.style.display = "inline-flex";
  canvas.focus();
});
canvas.addEventListener("blur", () => setTimeout(() => canvas.focus(), 0));
