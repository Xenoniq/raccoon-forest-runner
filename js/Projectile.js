export class Projectile {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = 20;
    this.height = 20;
    this.velocityX = 610;
    this.velocityY = -48;
    this.gravity = 210;
    this.rotation = 0;
    this.markedForRemoval = false;
  }

  update(dt, worldSpeed) {
    this.x += (this.velocityX - worldSpeed * 0.22) * dt;
    this.velocityY += this.gravity * dt;
    this.y += this.velocityY * dt;
    this.rotation += dt * 16;

    if (this.x > 1040 || this.y > 560 || this.x < -80) {
      this.markedForRemoval = true;
    }
  }

  getHitbox() {
    return {
      x: this.x + 3,
      y: this.y + 3,
      width: this.width - 6,
      height: this.height - 6
    };
  }

  draw(ctx, assets) {
    const image = assets.get('stone');
    if (!image) return;

    ctx.save();
    ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
    ctx.rotate(this.rotation);
    ctx.drawImage(image, -this.width / 2, -this.height / 2, this.width, this.height);
    ctx.restore();
  }
}
