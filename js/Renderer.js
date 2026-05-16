export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.width = canvas.width;
    this.height = canvas.height;
    this.clouds = Array.from({ length: 7 }, (_, index) => ({
      x: index * 170 + Math.random() * 120,
      y: 38 + Math.random() * 92,
      scale: 0.78 + Math.random() * 0.62,
      speed: 0.10 + Math.random() * 0.08
    }));
    this.decor = [];
    this.nextDecorX = 0;
    this.resetDecor();
  }

  resetDecor() {
    this.decor = [];
    this.nextDecorX = -120;
    while (this.nextDecorX < this.width + 1100) {
      this.addDecorItem();
    }
  }

  addDecorItem() {
    const spacing = random(300, 1000);
    this.nextDecorX += spacing;
    const type = Math.random() < 0.58 ? 'tree' : 'bush';
    const scale = type === 'tree' ? random(0.72, 1.08) : random(0.62, 0.92);
    this.decor.push({
      x: this.nextDecorX,
      type,
      scale,
      flip: Math.random() < 0.5,
      tint: random(0.88, 1.05)
    });
  }

  updateDecor(distance) {
    const scroll = distance * 0.42;
    this.decor = this.decor.filter((item) => item.x - scroll > -360);
    while (this.nextDecorX - scroll < this.width + 1000) {
      this.addDecorItem();
    }
  }

  clear() {
    this.ctx.clearRect(0, 0, this.width, this.height);
  }

  drawBackground(assets, distance, speed, groundY) {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;

    const sky = ctx.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0, '#8adeff');
    sky.addColorStop(0.5, '#c7f3ff');
    sky.addColorStop(1, '#e7f8ba');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, w, h);

    this.drawSun(ctx);
    this.drawClouds(ctx, distance);
    this.drawHillLayer(ctx, distance * 0.075, 305, '#74bf6f', 0.65);
    this.drawHillLayer(ctx, distance * 0.13, 356, '#4f9d57', 0.82);
    this.updateDecor(distance);
    this.drawDecor(ctx, assets, distance, groundY);
    this.drawAtmosphere(ctx, speed);
  }

  drawSun(ctx) {
    const sunX = 782;
    const sunY = 84;
    const sunGradient = ctx.createRadialGradient(sunX, sunY, 12, sunX, sunY, 98);
    sunGradient.addColorStop(0, 'rgba(255, 247, 178, 0.96)');
    sunGradient.addColorStop(0.42, 'rgba(255, 218, 102, 0.28)');
    sunGradient.addColorStop(1, 'rgba(255, 210, 102, 0)');
    ctx.fillStyle = sunGradient;
    ctx.beginPath();
    ctx.arc(sunX, sunY, 98, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff2a9';
    ctx.beginPath();
    ctx.arc(sunX, sunY, 38, 0, Math.PI * 2);
    ctx.fill();
  }

  drawClouds(ctx, distance) {
    this.clouds.forEach((cloud) => {
      let x = cloud.x - (distance * cloud.speed) % 1180;
      if (x < -190) x += 1180;
      ctx.save();
      ctx.translate(x, cloud.y);
      ctx.scale(cloud.scale, cloud.scale);
      ctx.globalAlpha = 0.74;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(0, 18, 24, 0, Math.PI * 2);
      ctx.arc(30, 10, 32, 0, Math.PI * 2);
      ctx.arc(68, 20, 24, 0, Math.PI * 2);
      ctx.roundRect(-24, 18, 116, 28, 16);
      ctx.fill();
      ctx.restore();
    });
  }

  drawHillLayer(ctx, offset, baseY, color, alpha) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(0, this.height);
    const step = 165;
    for (let x = -step; x <= this.width + step; x += step) {
      const px = x - (offset % step);
      ctx.lineTo(px, baseY - 58 - Math.sin(x * 0.018) * 28);
      ctx.lineTo(px + step / 2, baseY - 126 - Math.cos(x * 0.014) * 20);
    }
    ctx.lineTo(this.width, this.height);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  drawDecor(ctx, assets, distance, groundY) {
    const scroll = distance * 0.42;
    const tree = assets.get('tree');
    const bush = assets.get('bush');

    ctx.save();
    this.decor.forEach((item) => {
      const x = item.x - scroll;
      if (x < -260 || x > this.width + 260) return;

      if (item.type === 'tree' && tree) {
        const size = 178 * item.scale;
        const y = groundY - size;
        this.drawImageWithOptionalFlip(ctx, tree, x, y, size, size, item.flip, item.tint, 0.96);
      }

      if (item.type === 'bush' && bush) {
        const size = 126 * item.scale;
        const y = groundY - size;
        this.drawImageWithOptionalFlip(ctx, bush, x, y, size, size, item.flip, item.tint, 0.98);
      }
    });
    ctx.restore();
  }

  drawImageWithOptionalFlip(ctx, image, x, y, width, height, flip, tint = 1, alpha = 1) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.filter = `brightness(${tint}) saturate(1.04)`;
    if (flip) {
      ctx.translate(x + width, y);
      ctx.scale(-1, 1);
      ctx.drawImage(image, 0, 0, width, height);
    } else {
      ctx.drawImage(image, x, y, width, height);
    }
    ctx.restore();
  }

  drawAtmosphere(ctx, speed) {
    const fog = ctx.createLinearGradient(0, 300, 0, this.height);
    fog.addColorStop(0, 'rgba(255,255,255,0)');
    fog.addColorStop(1, 'rgba(236,255,212,0.25)');
    ctx.fillStyle = fog;
    ctx.fillRect(0, 284, this.width, this.height - 284);

    if (speed > 560) {
      ctx.save();
      ctx.globalAlpha = Math.min(0.18, (speed - 560) / 900);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      for (let i = 0; i < 16; i += 1) {
        const y = 70 + i * 25;
        const x = (i * 137 + speed * 0.6) % this.width;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x - 48, y + 8);
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  drawHUD(game) {
    const ctx = this.ctx;

    ctx.save();
    ctx.font = '800 15px Rubik, sans-serif';
    ctx.fillStyle = 'rgba(17, 45, 31, 0.84)';
    ctx.shadowColor = 'rgba(255, 255, 255, 0.55)';
    ctx.shadowBlur = 8;
    ctx.fillText(`Скорость тропы: ${Math.round(game.speed)} px/s`, 24, 36);
    ctx.restore();
  }

  drawLoading() {
    const ctx = this.ctx;
    ctx.save();
    ctx.fillStyle = '#9ce4ff';
    ctx.fillRect(0, 0, this.width, this.height);
    ctx.fillStyle = '#1f4231';
    ctx.font = '900 34px Nunito, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Загружаем лес...', this.width / 2, this.height / 2);
    ctx.restore();
  }
}

function random(min, max) {
  return Math.random() * (max - min) + min;
}
