import { audio, canvas, ctx } from "./domElements.js";
import { restartGame } from "./restartGame.js";
import { state } from "./state.js";

export let countdownInterval = null;

export function startCountdown() {
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

export function drawCountdown() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "rgba(0,0,0,0.7)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "gold";
  ctx.font = "bold 120px sans-serif";
  ctx.textAlign = "center";
  const text = state.showGo ? "GO" : state.countdownValue;
  ctx.fillText(text, canvas.width / 2, canvas.height / 2);
}
