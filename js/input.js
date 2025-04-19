// Gestione input tastiera e aggiornamento etichette
export class InputManager {
  constructor(keyLabelElems) {
    this.laneKeys = ["KeyA", "KeyS", "KeyD", "KeyF", "KeyG"]; // corsie 0‑4
    this.strumKey = "Space"; // plettra
    this.lanePressed = Array(5).fill(false);
    this.strumPressed = false;
    this.keyLabelElems = keyLabelElems; // <div class="keyLabel">

    window.addEventListener("keydown", (e) => this.onKey(e.code, true));
    window.addEventListener("keyup", (e) => this.onKey(e.code, false));
  }

  onKey(code, pressed) {
    // corsie
    const laneIdx = this.laneKeys.indexOf(code);
    if (laneIdx !== -1) {
      this.lanePressed[laneIdx] = pressed;
      this.updateLabel(laneIdx);
    }
    // plettra
    if (code === this.strumKey) {
      this.strumPressed = pressed;
      // refresh di tutte le etichette perché la classe dipende da strum
      this.keyLabelElems.forEach((_, idx) => this.updateLabel(idx));
    }
  }

  updateLabel(lane) {
    const el = this.keyLabelElems[lane];
    el.classList.remove("pressed-no-strum", "pressed-strum");

    if (this.lanePressed[lane]) {
      el.classList.add(
        this.strumPressed ? "pressed-strum" : "pressed-no-strum"
      );
    }
  }

  /* API esterna */
  isLanePressed(lane) {
    return this.lanePressed[lane];
  }
}
