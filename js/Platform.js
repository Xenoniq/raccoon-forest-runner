export class Platform {
  constructor(x, y, width, height = 128, type = 'ground') {
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

  draw(ctx, assets) {
    const grass = assets.get('grass');
    if (!grass) return;

    const tile = 128;
    const drawX = Math.round(this.x);
    const drawY = Math.round(this.y);
    const drawW = Math.ceil(this.width) + 1;
    const drawH = this.type === 'ground'
      ? Math.max(this.height, ctx.canvas.height - drawY)
      : this.height;
    const endX = drawX + drawW;

    ctx.save();
    ctx.beginPath();
    ctx.rect(drawX, drawY, drawW, drawH);
    ctx.clip();

    for (let x = drawX; x < endX; x += tile) {
      ctx.drawImage(grass, x, drawY, tile, tile);
    }

    ctx.restore();
  }
}
