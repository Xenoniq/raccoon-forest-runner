export class Platform {
  constructor(x, y, width, height = 44, type = 'ground') {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.type = type;
  }

  update(dt, speed) {
    this.x -= speed * dt;
  }

  getHitbox() {
    return {
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height
    };
  }

  draw(ctx, assets, distance = 0) {
    const grass = assets.get('grass');
    if (!grass) return;

    const tile = 96;
    const startX = Math.floor(this.x / tile) * tile;
    const endX = this.x + this.width + tile;

    ctx.save();
    ctx.beginPath();
    ctx.rect(this.x, this.y - 10, this.width, this.height + 30);
    ctx.clip();

    for (let x = startX; x < endX; x += tile) {
      ctx.drawImage(grass, x, this.y - 10, tile, tile);
    }

    if (this.type === 'floating') {
      ctx.globalAlpha = 0.22;
      ctx.fillStyle = '#402815';
      ctx.fillRect(this.x + 10, this.y + this.height - 4, this.width - 20, 9);
    }

    ctx.restore();
  }
}
