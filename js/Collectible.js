export class Collectible {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = 38;
    this.height = 38;
    this.markedForRemoval = false;
    this.time = Math.random() * Math.PI * 2;
  }

  update(dt, speed) {
    this.x -= speed * dt;
    this.time += dt;
    if (this.x + this.width < -80) {
      this.markedForRemoval = true;
    }
  }

  getHitbox() {
    return {
      x: this.x + 7,
      y: this.y + 6 + Math.sin(this.time * 5) * 2,
      width: this.width - 14,
      height: this.height - 12
    };
  }

  draw(ctx, assets) {
    const image = assets.get('apple');
    if (!image) return;

    const bob = Math.sin(this.time * 5) * 4;
    const glow = 0.16 + Math.sin(this.time * 4) * 0.05;

    ctx.save();
    ctx.globalAlpha = glow;
    ctx.fillStyle = '#fff2a3';
    ctx.beginPath();
    ctx.arc(this.x + this.width / 2, this.y + this.height / 2 + bob, 24, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.drawImage(image, this.x, this.y + bob, this.width, this.height);
    ctx.restore();
  }
}
