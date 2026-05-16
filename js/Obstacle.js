export class Obstacle {
  constructor(type, x, groundY, options = {}) {
    this.type = type;
    this.x = x;
    this.markedForRemoval = false;
    this.hit = false;
    this.time = Math.random() * Math.PI * 2;

    if (type === 'stump') {
      this.width = 64;
      this.height = 88;
      this.y = groundY - this.height + 8;
      this.scoreValue = 0;
    } else {
      this.width = 58;
      this.height = 58;
      this.y = options.y ?? groundY - 148;
      this.baseY = this.y;
      this.scoreValue = 150;
    }
  }

  update(dt, speed) {
    this.x -= speed * dt;
    this.time += dt;

    if (this.type === 'bee') {
      this.y = this.baseY + Math.sin(this.time * 6) * 9;
    }

    if (this.x + this.width < -120) {
      this.markedForRemoval = true;
    }
  }

  getHitbox() {
    if (this.type === 'stump') {
      return {
        x: this.x + 11,
        y: this.y + 18,
        width: this.width - 20,
        height: this.height - 20
      };
    }

    return {
      x: this.x + 8,
      y: this.y + 10,
      width: this.width - 14,
      height: this.height - 18
    };
  }

  draw(ctx, assets) {
    const image = this.type === 'stump' ? assets.get('stump') : assets.get('bee');
    if (!image) return;

    ctx.save();
    if (this.type === 'bee') {
      const wobble = Math.sin(this.time * 14) * 0.08;
      ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
      ctx.rotate(wobble);
      ctx.drawImage(image, -this.width / 2, -this.height / 2, this.width, this.height);
    } else {
      ctx.drawImage(image, this.x, this.y, this.width, this.height);
    }
    ctx.restore();
  }
}
