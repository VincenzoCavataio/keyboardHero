export class InputManager {
  constructor(labels) {
    this.labels = labels;
    this.pressed = {};
    this.strumPressed = false;
    // mappa i keycode alle lanes
    this.keyMap = {
      KeyA: 0,
      KeyS: 1,
      KeyD: 2,
      KeyF: 3,
      KeyG: 4,
      // se hai una strum-key mettila qui
    };

    // keyboard
    window.addEventListener("keydown", (e) => this.onKey(e, true));
    window.addEventListener("keyup", (e) => this.onKey(e, false));

    // ==== TOUCH SUPPORT ====
    // per ogni etichetta A/S/D/F/G, facciamo il bind di touchstart/end
    Object.entries(this.keyMap).forEach(([code, lane]) => {
      const lbl = labels[lane];
      if (!lbl) return;
      lbl.addEventListener("touchstart", (e) => {
        e.preventDefault();
        this.onKey({ code }, true);
      });
      lbl.addEventListener("touchend", (e) => {
        e.preventDefault();
        this.onKey({ code }, false);
      });
    });
  }

  onKey(e, pressed) {
    const lane = this.keyMap[e.code];
    if (lane === undefined) return;

    this.pressed[lane] = pressed;
    // se hai una chiave “strum” aggiungi qui la gestione di this.strumPressed

    // aggiorna lo stile della label
    this.updateLabel(lane, pressed);
  }

  isLanePressed(lane) {
    return !!this.pressed[lane];
  }

  updateLabel(lane, pressed) {
    const lbl = this.labels[lane];
    if (!lbl) return;
    lbl.classList.toggle("pressed", pressed);
  }
}
