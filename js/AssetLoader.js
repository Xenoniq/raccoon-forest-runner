export class AssetLoader {
  constructor() {
    this.images = new Map();
    this.paths = {
      raccoonWalk0: 'assets/raccoon/raccoon_walk0.png',
      raccoonWalk1: 'assets/raccoon/raccoon_walk1.png',
      raccoonWalk2: 'assets/raccoon/raccoon_walk2.png',
      raccoonJump: 'assets/raccoon/raccoon_jump.png',
      raccoonFall: 'assets/raccoon/raccoon_fall.png',
      raccoonDead: 'assets/raccoon/raccoon_dead.png',
      raccoonWinner: 'assets/raccoon/raccoon_winner.png',
      tree: 'assets/decor/tree1.png',
      bush: 'assets/decor/bush1.png',
      grass: 'assets/decor/grass1.png',
      apple: 'assets/events/apple.png',
      bee: 'assets/events/bee.png',
      stone: 'assets/events/stone.png',
      stump: 'assets/events/stump.png'
    };
  }

  loadAll() {
    const entries = Object.entries(this.paths);
    return Promise.all(entries.map(([key, path]) => this.loadImage(key, path))).then(() => this);
  }

  loadImage(key, path) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => {
        this.images.set(key, image);
        resolve(image);
      };
      image.onerror = () => reject(new Error(`Не удалось загрузить изображение: ${path}`));
      image.src = path;
    });
  }

  get(key) {
    return this.images.get(key);
  }
}
