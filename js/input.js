/*--------------------------------------------------------------------
  InputManager â€” gestione keypress + mobile touch sui keyLabel
--------------------------------------------------------------------*/
export class InputManager {
  /**
   * @param {NodeListOf<HTMLElement>} labels â€” elementi .keyLabel in ordine di lane
   */
  constructor(labels) {
    this.labels = Array.from(labels || []);
    this.pressed = Array(this.labels.length).fill(false);
    this.strumPressed = false;

    // ascolto tastiera
    window.addEventListener("keydown", this._onKeyDown.bind(this));
    window.addEventListener("keyup", this._onKeyUp.bind(this));
  }

  _onKeyDown(e) {
    switch (e.code) {
      case "KeyA":
        this.pressLane(0);
        break;
      case "KeyS":
        this.pressLane(1);
        break;
      case "KeyD":
        this.pressLane(2);
        break;
      case "KeyF":
        this.pressLane(3);
        break;
      case "KeyG":
        this.pressLane(4);
        break;
      case "Space":
      case "KeyB":
        this.strumPressed = true;
        break;
      default:
        return;
    }
    e.preventDefault();
  }

  _onKeyUp(e) {
    switch (e.code) {
      case "KeyA":
        this.releaseLane(0);
        break;
      case "KeyS":
        this.releaseLane(1);
        break;
      case "KeyD":
        this.releaseLane(2);
        break;
      case "KeyF":
        this.releaseLane(3);
        break;
      case "KeyG":
        this.releaseLane(4);
        break;
      case "Space":
      case "KeyB":
        this.strumPressed = false;
        break;
      default:
        return;
    }
    e.preventDefault();
  }

  /**
   * Simula pressione corsia
   * @param {number} lane
   */
  pressLane(lane) {
    this.pressed[lane] = true;
    this.updateLabel(lane, true);
  }

  /**
   * Simula rilascio corsia
   * @param {number} lane
   */
  releaseLane(lane) {
    this.pressed[lane] = false;
    this.updateLabel(lane, false);
  }

  /**
   * Toggle classe visuale sul label (guardato per evitare undefined)
   */
  updateLabel(lane, pressed) {
    const lbl = this.labels[lane];
    if (!lbl) return;
    lbl.classList.toggle("pressed", pressed);
  }

  /**
   * @param {number} lane
   * @returns {boolean}
   */
  isLanePressed(lane) {
    return !!this.pressed[lane];
  }
}
