export class ComboManager {
  constructor() {
    this.combo = 0;
    this.multiplier = 1;
    this.bonusActive = false;
    this.bonusEnd = 0;
  }

  registerHit(isBonus, currentTime) {
    this.combo += 1;
    if (this.combo % 10 === 0 && this.multiplier < 4) {
      this.multiplier += 1;
    }
    if (isBonus) {
      this.activateBonus(currentTime);
    }
  }

  registerMiss() {
    this.combo = 0;
    this.multiplier = 1;
    this.bonusActive = false;
  }

  activateBonus(currentTime) {
    this.bonusActive = true;
    this.bonusEnd = currentTime + 10000; // 10s
  }

  update(currentTime) {
    if (this.bonusActive && currentTime > this.bonusEnd) {
      this.bonusActive = false;
    }
  }

  get currentMultiplier() {
    return this.multiplier * (this.bonusActive ? 2 : 1);
  }
}
