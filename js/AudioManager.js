export class AudioManager {
  constructor() {
    this.context = null;
    this.enabled = true;
  }

  ensureContext() {
    if (!this.enabled) return null;
    if (!this.context) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) {
        this.enabled = false;
        return null;
      }
      this.context = new AudioContext();
    }
    if (this.context.state === 'suspended') {
      this.context.resume();
    }
    return this.context;
  }

  tone(frequency, duration = 0.08, type = 'sine', volume = 0.055) {
    const ctx = this.ensureContext();
    if (!ctx) return;

    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(volume, ctx.currentTime + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
    oscillator.connect(gain);
    gain.connect(ctx.destination);
    oscillator.start();
    oscillator.stop(ctx.currentTime + duration + 0.025);
  }

  jump() {
    this.tone(360, 0.07, 'triangle', 0.045);
    window.setTimeout(() => this.tone(540, 0.07, 'triangle', 0.035), 45);
  }

  collect() {
    this.tone(760, 0.06, 'sine', 0.045);
    window.setTimeout(() => this.tone(1040, 0.07, 'sine', 0.04), 48);
  }

  shoot() {
    this.tone(430, 0.045, 'square', 0.032);
    window.setTimeout(() => this.tone(260, 0.05, 'triangle', 0.025), 36);
  }

  hit() {
    this.tone(160, 0.12, 'sawtooth', 0.045);
    window.setTimeout(() => this.tone(100, 0.12, 'sawtooth', 0.035), 70);
  }

  gameOver() {
    this.tone(260, 0.12, 'triangle', 0.045);
    window.setTimeout(() => this.tone(200, 0.16, 'triangle', 0.04), 120);
    window.setTimeout(() => this.tone(140, 0.22, 'triangle', 0.035), 280);
  }
}
