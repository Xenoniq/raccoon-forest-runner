export class InputHandler {
  constructor(canvas) {
    this.canvas = canvas;
    this.down = new Set();
    this.justPressed = new Set();
    this.preventedCodes = new Set([
      'Space',
      'ArrowUp',
      'ArrowDown',
      'ArrowLeft',
      'ArrowRight'
    ]);

    window.addEventListener('keydown', (event) => this.handleKeyDown(event));
    window.addEventListener('keyup', (event) => this.handleKeyUp(event));
  }

  handleKeyDown(event) {
    const action = this.mapKey(event.code);
    if (!action) return;

    if (this.preventedCodes.has(event.code)) {
      event.preventDefault();
    }

    if (!this.down.has(action)) {
      this.justPressed.add(action);
    }
    this.down.add(action);
  }

  handleKeyUp(event) {
    const action = this.mapKey(event.code);
    if (!action) return;

    if (this.preventedCodes.has(event.code)) {
      event.preventDefault();
    }

    this.down.delete(action);
  }

  mapKey(code) {
    const map = {
      KeyW: 'jump',
      ArrowUp: 'jump',
      KeyS: 'duck',
      ArrowDown: 'duck',
      Space: 'shoot',
      Escape: 'pause',
      KeyP: 'pause',
      KeyR: 'restart',
      Enter: 'confirm',
      KeyA: 'left',
      ArrowLeft: 'left',
      KeyD: 'right',
      ArrowRight: 'right'
    };
    return map[code];
  }

  isDown(action) {
    return this.down.has(action);
  }

  pressed(action) {
    return this.justPressed.has(action);
  }

  endFrame() {
    this.justPressed.clear();
  }
}
