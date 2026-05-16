export class Particle {
  constructor(x, y, options = {}) {
    this.x = x;
    this.y = y;
    this.velocityX = options.velocityX ?? (Math.random() - 0.5) * 180;
    this.velocityY = options.velocityY ?? -Math.random() * 170;
    this.radius = options.radius ?? random(2, 5);
    this.color = options.color ?? 'rgba(255, 220, 120, 0.92)';
    this.life = options.life ?? random(0.35, 0.75);
    this.maxLife = this.life;
    this.gravity = options.gravity ?? 360;
    this.layer = options.layer ?? 'burst';
    this.markedForRemoval = false;
  }

  update(dt) {
    this.life -= dt;
    this.velocityY += this.gravity * dt;
    this.x += this.velocityX * dt;
    this.y += this.velocityY * dt;
    if (this.life <= 0) {
      this.markedForRemoval = true;
    }
  }

  draw(ctx) {
    const alpha = Math.max(0, this.life / this.maxLife);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius * alpha, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

function random(min, max) {
  return Math.random() * (max - min) + min;
}
