import { NOTE_TYPES, LANE_COLORS, Note } from "./note.js";
import {
  BONUS_COST,
  BONUS_DURATION,
  BONUS_EXTENSION,
  COMBO_LIFE_STEP,
  LANES,
  LANE_GAP,
  MAX_LIFE,
  NOTE_SPEED,
  RECEPTOR_H,
  RECEPTOR_Y,
  SCORE_BAD,
  SCORE_GOOD,
  SCORE_PERFECT,
  WINDOW_BAD,
  WINDOW_GOOD,
  WINDOW_PERFECT,
} from "./constants.js";
import {
  audio,
  canvas,
  comboEl,
  ctx,
  modal,
  multEl,
  newBtn,
  pickerLabel,
  scoreEl,
} from "./domElements.js";
import { comboMgr, inputMgr, state } from "./state.js";
import { hexToRgb } from "./utils.js";
import { finishGame } from "./finishGame.js";
import { flashHit, updateBonus, updateLife } from "./hud.js";
import { drawCountdown, startCountdown } from "./countdown.js";
import { spawnExplosion } from "./particicle.js";

// BONUS (Star Power) ------------------------------------------------------
window.addEventListener("keydown", (e) => {
  if (e.code !== "KeyB") return;
  if (state.bonusEnd || state.bonusMeter < BONUS_COST) return;
  state.bonusMeter = 0;
  state.bonusEnd = performance.now() + BONUS_DURATION;
  document.body.classList.add("bonus-active");
  updateBonus();
});

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

// MODAL RESTART ----------------------------------------------------------
newBtn.addEventListener("click", () => {
  modal.classList.add("hidden");
  pickerLabel.style.display = "inline-flex";
  canvas.focus();
});
canvas.addEventListener("blur", () => setTimeout(() => canvas.focus(), 0));
