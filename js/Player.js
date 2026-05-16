export class Player {
  constructor(x, groundY) {
    this.startX = x;
    this.groundY = groundY;
    this.standWidth = 78;
    this.standHeight = 104;
    this.width = this.standWidth;
    this.height = this.standHeight;
    this.x = x;
    this.y = groundY - this.height;
    this.velocityX = 0;
    this.velocityY = 0;
    this.moveSpeed = 220;
    this.acceleration = 1350;
    this.gravity = 2180;
    this.jumpForce = -805;
    this.grounded = false;
    this.coyoteDuration = 0.105;
    this.coyoteTimer = 0;
    this.jumpBuffer = 0;
    this.jumpBufferDuration = 0.12;
    this.previousBottom = this.y + this.height;
    this.landedThisFrame = false;
    this.jumpedThisFrame = false;
    this.invincibleTimer = 0;
    this.runTime = 0;
    this.dead = false;
    this.currentPlatform = null;
  }

  reset(x = this.startX, groundY = this.groundY) {
    this.startX = x;
    this.groundY = groundY;
    this.width = this.standWidth;
    this.height = this.standHeight;
    this.x = x;
    this.y = groundY - this.height;
    this.velocityX = 0;
    this.velocityY = 0;
    this.grounded = false;
    this.coyoteTimer = 0;
    this.jumpBuffer = 0;
    this.previousBottom = this.y + this.height;
    this.landedThisFrame = false;
    this.jumpedThisFrame = false;
    this.invincibleTimer = 1.1;
    this.runTime = 0;
    this.dead = false;
    this.currentPlatform = null;
  }

  update(input, dt, bounds) {
    this.previousBottom = this.y + this.height;
    this.landedThisFrame = false;
    this.jumpedThisFrame = false;
    this.runTime += dt;

    if (this.invincibleTimer > 0) {
      this.invincibleTimer = Math.max(0, this.invincibleTimer - dt);
    }

    if (input.pressed('jump')) {
      this.jumpBuffer = this.jumpBufferDuration;
    } else {
      this.jumpBuffer = Math.max(0, this.jumpBuffer - dt);
    }

    if (this.jumpBuffer > 0 && (this.grounded || this.coyoteTimer > 0)) {
      this.velocityY = this.jumpForce;
      this.jumpedThisFrame = true;
      this.grounded = false;
      this.coyoteTimer = 0;
      this.jumpBuffer = 0;
    }

    if (!this.grounded) {
      this.coyoteTimer = Math.max(0, this.coyoteTimer - dt);
    }

    const direction = Number(input.isDown('right')) - Number(input.isDown('left'));
    if (direction !== 0) {
      this.velocityX += direction * this.acceleration * dt;
      this.velocityX = clamp(this.velocityX, -this.moveSpeed, this.moveSpeed);
    } else {
      this.velocityX *= Math.max(0, 1 - dt * 8);
    }

    this.velocityY += this.gravity * dt;
    this.velocityY = Math.min(this.velocityY, 1030);
    this.x += this.velocityX * dt;
    this.y += this.velocityY * dt;

    const targetX = bounds.runnerX ?? this.startX;
    if (direction === 0) {
      this.x += (targetX - this.x) * Math.min(1, dt * 3.2);
    }
    this.x = clamp(this.x, bounds.left, bounds.right - this.width);
  }

  getHitbox() {
    return {
      x: this.x + 18,
      y: this.y + 18,
      width: this.width - 32,
      height: this.height - 18
    };
  }

  draw(ctx, assets) {
    const image = this.selectSprite(assets);
    if (!image) return;

    const blink = this.invincibleTimer > 0 && Math.floor(this.invincibleTimer * 16) % 2 === 0;
    if (blink && !this.dead) return;

    const bottom = this.y + this.height;
    const runBob = this.grounded ? Math.sin(this.runTime * 15.5) * 2.2 : 0;
    const drawW = 86;
    const drawH = 116;
    const drawX = this.x - 4;
    const drawY = bottom - drawH + runBob;

    ctx.save();
    ctx.drawImage(image, drawX, drawY, drawW, drawH);
    ctx.restore();
  }

  selectSprite(assets) {
    if (this.dead) return assets.get('raccoonDead');
    if (!this.grounded) {
      return this.velocityY < 0 ? assets.get('raccoonJump') : assets.get('raccoonFall');
    }
    const frame = Math.floor(this.runTime * 10) % 3;
    return assets.get(`raccoonWalk${frame}`);
  }
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}
