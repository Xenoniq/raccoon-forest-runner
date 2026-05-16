import { AssetLoader } from './AssetLoader.js';
import { InputHandler } from './InputHandler.js';
import { Player } from './Player.js';
import { Platform } from './Platform.js';
import { Obstacle } from './Obstacle.js';
import { Collectible } from './Collectible.js';
import { Projectile } from './Projectile.js';
import { Particle } from './Particle.js';
import { Renderer } from './Renderer.js';
import { AudioManager } from './AudioManager.js';
import { rectsIntersect, resolvePlatformCollisions } from './Collision.js';

const BEST_SCORE_KEY = 'raccoon-apple-run-best-score';

export class Game {
  constructor(canvas, ui) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.width = canvas.width;
    this.height = canvas.height;
    this.ui = ui;

    this.assets = new AssetLoader();
    this.input = new InputHandler(canvas);
    this.renderer = new Renderer(canvas);
    this.audio = new AudioManager();

    this.baseSpeed = 285;
    this.maxSpeed = 780;
    this.groundY = 426;
    this.runnerX = 165;
    this.player = new Player(this.runnerX, this.groundY);

    this.state = 'loading';
    this.lastTime = 0;
    this.distance = 0;
    this.score = 0;
    this.bestScore = Number(localStorage.getItem(BEST_SCORE_KEY)) || 0;
    this.apples = 0;
    this.health = 3;
    this.speed = this.baseSpeed;
    this.platforms = [];
    this.obstacles = [];
    this.collectibles = [];
    this.projectiles = [];
    this.particles = [];
    this.nextPlatformX = 0;
    this.shotCooldown = 0;
    this.beeHits = 0;
    this.lastHitReason = '';

    this.ui.bestScore.textContent = this.bestScore;
    this.bindUI();
    this.resetWorld();
    this.setOverlayLoading();

    this.assets.loadAll()
      .then(() => {
        this.state = 'menu';
        this.showIntroOverlay();
      })
      .catch((error) => {
        console.error(error);
        this.state = 'menu';
        this.showErrorOverlay(error.message);
      });
  }

  bindUI() {
    this.ui.startButton.addEventListener('click', () => {
      if (this.state === 'paused') {
        this.resume();
      } else if (this.state !== 'loading') {
        this.startRun();
      }
    });

    this.ui.overlayRestartButton.addEventListener('click', () => this.restart());
    this.ui.pauseButton.addEventListener('click', () => this.togglePause());
    this.ui.restartButton.addEventListener('click', () => this.restart());

    window.addEventListener('blur', () => {
      if (this.state === 'running') this.pause();
    });
  }

  start() {
    requestAnimationFrame((time) => {
      this.lastTime = time;
      this.loop(time);
    });
  }

  loop(time) {
    const dt = Math.min(0.033, (time - this.lastTime) / 1000 || 0);
    this.lastTime = time;

    this.handleGlobalInput();

    if (this.state === 'running') {
      this.update(dt);
    }

    this.render();
    this.input.endFrame();
    requestAnimationFrame((nextTime) => this.loop(nextTime));
  }

  handleGlobalInput() {
    if (this.input.pressed('pause')) {
      this.togglePause();
    }

    if (this.input.pressed('restart') && this.state !== 'loading') {
      this.restart();
    }

    const wantsStart = this.input.pressed('jump') || this.input.pressed('shoot') || this.input.pressed('confirm');
    if ((this.state === 'menu' || this.state === 'gameover') && wantsStart) {
      this.startRun();
    }
  }

  startRun() {
    if (this.state === 'running' || this.state === 'loading') return;
    this.audio.ensureContext();
    this.resetWorld();
    this.state = 'running';
    this.hideOverlay();
  }

  restart() {
    if (this.state === 'loading') return;
    this.audio.ensureContext();
    this.resetWorld();
    this.state = 'running';
    this.hideOverlay();
  }

  pause() {
    if (this.state !== 'running') return;
    this.state = 'paused';
    this.ui.pauseButton.textContent = 'Продолжить';
    this.showPauseOverlay();
  }

  resume() {
    if (this.state !== 'paused') return;
    this.state = 'running';
    this.ui.pauseButton.textContent = 'Пауза';
    this.hideOverlay();
  }

  togglePause() {
    if (this.state === 'running') {
      this.pause();
    } else if (this.state === 'paused') {
      this.resume();
    }
  }

  resetWorld() {
    this.distance = 0;
    this.score = 0;
    this.apples = 0;
    this.health = 3;
    this.speed = this.baseSpeed;
    this.platforms = [];
    this.obstacles = [];
    this.collectibles = [];
    this.projectiles = [];
    this.particles = [];
    this.shotCooldown = 0;
    this.beeHits = 0;
    this.lastHitReason = '';
    this.player.reset(this.runnerX, this.groundY);
    this.renderer.resetDecor();

    this.platforms.push(new Platform(-260, this.groundY, this.width + 860, 104, 'ground'));
    this.nextPlatformX = this.width + 420;
    while (this.nextPlatformX < this.width + 1400) {
      this.generatePlatformSegment(true);
    }

    this.updateUI();
    this.ui.pauseButton.textContent = 'Пауза';
  }

  update(dt) {
    this.speed = Math.min(this.maxSpeed, this.baseSpeed + this.distance * 0.0175);
    this.distance += this.speed * dt;
    this.nextPlatformX -= this.speed * dt;
    this.shotCooldown = Math.max(0, this.shotCooldown - dt);

    if (this.input.pressed('shoot')) {
      this.shootStone();
    }

    this.player.update(this.input, dt, {
      left: 96,
      right: 300,
      runnerX: this.runnerX
    });

    if (this.player.jumpedThisFrame) {
      this.audio.jump();
      this.spawnDust(this.player.x + this.player.width * 0.45, this.player.y + this.player.height, 9);
    }

    this.updateWorldObjects(dt);
    const landedPlatform = resolvePlatformCollisions(this.player, this.platforms);
    if (landedPlatform && this.player.landedThisFrame) {
      this.spawnDust(this.player.x + this.player.width * 0.45, landedPlatform.y - 2, 6);
    }

    this.handleProjectileCollisions();
    this.handleObstacleCollisions();
    this.handleCollectibles();
    this.handleFall();
    this.generateWorldIfNeeded();
    this.updateScore();
    this.updateParticles(dt);
    this.updateUI();
  }

  updateWorldObjects(dt) {
    this.platforms.forEach((platform) => platform.update(dt, this.speed));
    this.obstacles.forEach((obstacle) => obstacle.update(dt, this.speed));
    this.collectibles.forEach((collectible) => collectible.update(dt, this.speed));
    this.projectiles.forEach((projectile) => projectile.update(dt, this.speed));

    this.platforms = this.platforms.filter((platform) => platform.x + platform.width > -260);
    this.obstacles = this.obstacles.filter((obstacle) => !obstacle.markedForRemoval);
    this.collectibles = this.collectibles.filter((collectible) => !collectible.markedForRemoval);
    this.projectiles = this.projectiles.filter((projectile) => !projectile.markedForRemoval);
  }

  generateWorldIfNeeded() {
    while (this.nextPlatformX < this.width + 1150) {
      this.generatePlatformSegment(false);
    }
  }

  generatePlatformSegment(isInitial = false) {
    const difficulty = Math.min(1, this.distance / 22000);
    const gap = isInitial ? random(60, 105) : random(78 + difficulty * 38, 145 + difficulty * 48);
    const width = random(430 - difficulty * 70, 720 - difficulty * 95);
    const y = this.groundY + random(-10, 12);
    const platform = new Platform(this.nextPlatformX + gap, y, width, 104, 'ground');
    this.platforms.push(platform);

    if (!isInitial) {
      this.spawnEventsOnPlatform(platform, difficulty);
    } else if (Math.random() < 0.75) {
      this.spawnAppleLine(platform.x + random(90, 180), platform.y - 118, 3, 42);
    }

    if (!isInitial && Math.random() < 0.24 + difficulty * 0.08 && platform.width > 470) {
      const floatingWidth = random(190, 320);
      const floatingX = platform.x + random(120, Math.max(145, platform.width - floatingWidth - 60));
      const floatingY = platform.y - random(112, 142);
      const floating = new Platform(floatingX, floatingY, floatingWidth, 54, 'floating');
      this.platforms.push(floating);
      this.spawnAppleLine(floating.x + 34, floating.y - 48, Math.floor(random(3, 6)), 42);
    }

    this.nextPlatformX = platform.x + platform.width;
  }

  spawnEventsOnPlatform(platform, difficulty) {
    const safeWidth = Math.max(1, platform.width - 210);
    const firstX = platform.x + 110 + random(0, safeWidth * 0.35);
    const pattern = Math.random();

    if (pattern < 0.44) {
      this.obstacles.push(new Obstacle('stump', firstX, platform.y));
      this.spawnAppleArc(firstX + 92, platform.y - 138, 4, 34);
    } else if (pattern < 0.76) {
      const beeY = platform.y - random(150, 215);
      this.obstacles.push(new Obstacle('bee', firstX + 24, platform.y, { y: beeY }));
      this.spawnAppleLine(firstX + 112, beeY - 44, 3, 42);
    } else {
      this.spawnAppleArc(firstX, platform.y - 126, Math.floor(random(4, 7)), 38);
      if (Math.random() < 0.46 + difficulty * 0.22) {
        this.obstacles.push(new Obstacle('stump', firstX + random(145, 240), platform.y));
      }
    }

    if (Math.random() < 0.22 + difficulty * 0.25 && platform.width > 560) {
      const secondX = platform.x + platform.width - random(120, 190);
      const type = Math.random() < 0.55 ? 'bee' : 'stump';
      if (type === 'bee') {
        this.obstacles.push(new Obstacle('bee', secondX, platform.y, { y: platform.y - random(145, 210) }));
      } else {
        this.obstacles.push(new Obstacle('stump', secondX, platform.y));
      }
    }
  }

  spawnAppleLine(startX, y, count, spacing) {
    for (let i = 0; i < count; i += 1) {
      this.collectibles.push(new Collectible(startX + i * spacing, y + Math.sin(i * 0.8) * 12));
    }
  }

  spawnAppleArc(startX, baseY, count, spacing) {
    const middle = (count - 1) / 2;
    for (let i = 0; i < count; i += 1) {
      const lift = Math.abs(i - middle) * 14;
      this.collectibles.push(new Collectible(startX + i * spacing, baseY + lift));
    }
  }

  shootStone() {
    if (this.shotCooldown > 0 || this.projectiles.length > 4) return;

    const hitbox = this.player.getHitbox();
    this.projectiles.push(new Projectile(hitbox.x + hitbox.width + 8, hitbox.y + hitbox.height * 0.42));
    this.shotCooldown = 0.34;
    this.audio.shoot();
  }

  handleProjectileCollisions() {
    for (const projectile of this.projectiles) {
      for (const obstacle of this.obstacles) {
        if (obstacle.type !== 'bee' || obstacle.markedForRemoval) continue;
        if (rectsIntersect(projectile.getHitbox(), obstacle.getHitbox())) {
          projectile.markedForRemoval = true;
          obstacle.markedForRemoval = true;
          this.beeHits += 1;
          this.spawnBurst(obstacle.x + obstacle.width / 2, obstacle.y + obstacle.height / 2, '#ffd166', 18);
          this.audio.collect();
          break;
        }
      }
    }
  }

  handleObstacleCollisions() {
    if (this.player.invincibleTimer > 0) return;

    const playerBox = this.player.getHitbox();
    for (const obstacle of this.obstacles) {
      if (obstacle.markedForRemoval) continue;
      if (!rectsIntersect(playerBox, obstacle.getHitbox())) continue;

      this.lastHitReason = obstacle.type === 'bee' ? 'пчела' : 'пень';
      this.takeDamage(obstacle.type);
      if (obstacle.type === 'bee') {
        obstacle.markedForRemoval = true;
      }
      break;
    }
  }

  handleCollectibles() {
    const playerBox = this.player.getHitbox();
    for (const collectible of this.collectibles) {
      if (collectible.markedForRemoval) continue;
      if (rectsIntersect(playerBox, collectible.getHitbox())) {
        collectible.markedForRemoval = true;
        this.apples += 1;
        this.spawnBurst(collectible.x + collectible.width / 2, collectible.y + collectible.height / 2, '#ff5f57', 12);
        this.audio.collect();
      }
    }
  }

  handleFall() {
    if (this.player.y < this.height + 96) return;

    this.lastHitReason = 'яма';
    this.takeDamage('fall');
    if (this.state === 'running') {
      this.platforms.unshift(new Platform(-260, this.groundY, this.width + 760, 104, 'ground'));
      this.player.reset(this.runnerX, this.groundY);
      this.player.invincibleTimer = 1.35;
    }
  }

  takeDamage(source) {
    this.health -= 1;
    this.player.invincibleTimer = 1.25;
    this.audio.hit();
    this.spawnBurst(this.player.x + this.player.width / 2, this.player.y + this.player.height / 2, '#ffffff', 16);

    if (source === 'stump') {
      this.player.velocityY = -340;
    }

    if (this.health <= 0) {
      this.endGame();
    }
  }

  endGame() {
    this.health = 0;
    this.player.dead = true;
    this.state = 'gameover';
    this.audio.gameOver();
    this.updateScore();
    this.updateUI();
    this.showGameOverOverlay();
  }

  updateScore() {
    this.score = Math.floor(this.distance / 10) + this.apples * 100 + this.beeHits * 150;
    if (this.score > this.bestScore) {
      this.bestScore = this.score;
      localStorage.setItem(BEST_SCORE_KEY, String(this.bestScore));
    }
  }

  updateParticles(dt) {
    this.particles.forEach((particle) => particle.update(dt));
    this.particles = this.particles.filter((particle) => !particle.markedForRemoval);
  }

  spawnDust(x, y, count) {
    for (let i = 0; i < count; i += 1) {
      this.particles.push(new Particle(x, y, {
        velocityX: random(-120, 55),
        velocityY: random(-135, -30),
        radius: random(2, 5),
        color: 'rgba(184, 132, 72, 0.46)',
        life: random(0.22, 0.55),
        gravity: 430
      }));
    }
  }

  spawnBurst(x, y, color, count) {
    for (let i = 0; i < count; i += 1) {
      this.particles.push(new Particle(x, y, {
        velocityX: random(-210, 210),
        velocityY: random(-230, 90),
        radius: random(2, 5),
        color,
        life: random(0.35, 0.75),
        gravity: 360
      }));
    }
  }

  render() {
    if (this.state === 'loading') {
      this.renderer.drawLoading();
      return;
    }

    this.renderer.clear();
    this.renderer.drawBackground(this.assets, this.distance, this.speed, this.groundY);

    this.platforms.forEach((platform) => platform.draw(this.ctx, this.assets, this.distance));
    this.collectibles.forEach((collectible) => collectible.draw(this.ctx, this.assets));
    this.obstacles.forEach((obstacle) => obstacle.draw(this.ctx, this.assets));
    this.projectiles.forEach((projectile) => projectile.draw(this.ctx, this.assets));
    this.player.draw(this.ctx, this.assets);
    this.particles.forEach((particle) => particle.draw(this.ctx));
    this.renderer.drawHUD(this);
  }

  updateUI() {
    this.ui.score.textContent = this.score;
    this.ui.apples.textContent = this.apples;
    this.ui.bestScore.textContent = this.bestScore;
    this.ui.hearts.textContent = '❤'.repeat(this.health) + '♡'.repeat(Math.max(0, 3 - this.health));
  }

  setOverlayLoading() {
    this.ui.overlay.classList.remove('hidden');
    this.ui.overlayBadge.textContent = 'Загрузка';
    this.ui.overlayTitle.textContent = 'Загружаем ассеты';
    this.ui.overlayText.textContent = 'Подготавливаем спрайты енота, яблоки, пчёл, пни, землю и лесной фон.';
    this.ui.overlayImage.src = 'assets/raccoon/raccoon_winner.png';
    this.ui.startButton.textContent = 'Загрузка...';
    this.ui.startButton.disabled = true;
    this.ui.overlayRestartButton.classList.add('hidden-control');
  }

  showIntroOverlay() {
    this.ui.overlay.classList.remove('hidden');
    this.ui.overlayBadge.textContent = 'Яблочная охота';
    this.ui.overlayTitle.textContent = 'Помоги Еноту собрать как можно больше яблок!';
    this.ui.overlayText.textContent = 'Енот бежит сам. Слегка смещайся по тропе, перепрыгивай пни и ямы, пригибайся от опасностей, бросай камни в пчёл и собирай яблоки. Чем дальше забег — тем выше скорость.';
    this.ui.overlayImage.src = 'assets/raccoon/raccoon_winner.png';
    this.ui.startButton.textContent = 'Начать забег';
    this.ui.startButton.disabled = false;
    this.ui.overlayRestartButton.classList.add('hidden-control');
  }

  showPauseOverlay() {
    this.ui.overlay.classList.remove('hidden');
    this.ui.overlayBadge.textContent = 'Пауза';
    this.ui.overlayTitle.textContent = 'Забег остановлен';
    this.ui.overlayText.textContent = 'Нажми Esc ещё раз или кнопку «Продолжить», чтобы вернуться в игру. Можно сразу перезапустить забег.';
    this.ui.overlayImage.src = 'assets/raccoon/raccoon_walk1.png';
    this.ui.startButton.textContent = 'Продолжить';
    this.ui.startButton.disabled = false;
    this.ui.overlayRestartButton.classList.remove('hidden-control');
  }

  showGameOverOverlay() {
    const reason = this.lastHitReason ? ` Последнее столкновение: ${this.lastHitReason}.` : '';
    this.ui.overlay.classList.remove('hidden');
    this.ui.overlayBadge.textContent = 'Игра окончена';
    this.ui.overlayTitle.textContent = 'Енот устал';
    this.ui.overlayText.textContent = `Счёт: ${this.score}. Яблок собрано: ${this.apples}. Сбитых пчёл: ${this.beeHits}. Рекорд: ${this.bestScore}.${reason}`;
    this.ui.overlayImage.src = 'assets/raccoon/raccoon_dead.png';
    this.ui.startButton.textContent = 'Новый забег';
    this.ui.startButton.disabled = false;
    this.ui.overlayRestartButton.classList.add('hidden-control');
    this.ui.pauseButton.textContent = 'Пауза';
  }

  showErrorOverlay(message) {
    this.ui.overlay.classList.remove('hidden');
    this.ui.overlayBadge.textContent = 'Ошибка';
    this.ui.overlayTitle.textContent = 'Не удалось загрузить игру';
    this.ui.overlayText.textContent = message;
    this.ui.startButton.textContent = 'Недоступно';
    this.ui.startButton.disabled = true;
    this.ui.overlayRestartButton.classList.add('hidden-control');
  }

  hideOverlay() {
    this.ui.overlay.classList.add('hidden');
    this.ui.startButton.disabled = false;
  }
}

function random(min, max) {
  return Math.random() * (max - min) + min;
}
