import { Application, Graphics, Rectangle, Sprite } from 'pixi.js';

// Enemy aircraft — two behavioural variants with different movement and firing patterns
export class Opponent {
  private app: Application;
  private sprite: Sprite;
  private bullets: Graphics[] = [];
  private shootTimer: number = 0;
  private type: 'straight' | 'zigzag'; // straight = predictable, zigzag = harder to avoid
  private zigzagTimer: number = 0;
  private zigzagDir: number = 1; // 1 = moving down, -1 = moving up

  constructor(app: Application) {
    this.app = app;
    this.type = Math.random() > 0.5 ? 'straight' : 'zigzag';

    // Each type uses a different sprite so the player can visually distinguish them
    const texture = this.type === 'straight' ? '/enemy1.webp' : '/enemy2.webp';
    this.sprite = Sprite.from(texture) as any;
    this.sprite.width = 70;
    this.sprite.height = 45;
    this.sprite.x = app.screen.width + 10;
    this.sprite.y = Math.random() * (app.screen.height - 100) + 50;
    app.stage.addChild(this.sprite);
  }

  // Called every frame — moves the opponent and fires projectiles
  update(delta: number, _heroPos: { x: number; y: number }): void {
    this.sprite.x -= 1.5 * delta;

    if (this.type === 'zigzag') {
      // Zigzag enemy oscillates vertically, reversing direction every 60 frames
      this.zigzagTimer += delta;
      this.sprite.y += this.zigzagDir * 2 * delta;

      if (this.zigzagTimer > 60) {
        this.zigzagTimer = 0;
        this.zigzagDir *= -1;
      }

      // Clamp to screen bounds
      if (this.sprite.y < 10) { this.sprite.y = 10; this.zigzagDir = 1; }
      if (this.sprite.y > this.app.screen.height - 60) {
        this.sprite.y = this.app.screen.height - 60;
        this.zigzagDir = -1;
      }
    }

    // Zigzag fires more frequently as a tradeoff for being harder to hit
    const shootInterval = this.type === 'zigzag' ? 90 : 140;
    this.shootTimer += delta;
    if (this.shootTimer > shootInterval) {
      this.shootTimer = 0;
      this.shoot();
    }

    // Move bullets leftward and remove when off-screen
    this.bullets = this.bullets.filter((b) => {
      b.x -= 6 * delta;
      if (b.x < 0) {
        this.app.stage.removeChild(b);
        return false;
      }
      return true;
    });
  }

  private shoot(): void {
    if (this.type === 'straight') {
      // Single horizontal bullet
      const bullet = new Graphics();
      bullet.rect(0, 0, 10, 4).fill(0xff9900);
      bullet.x = this.sprite.x;
      bullet.y = this.sprite.y + 13;
      this.app.stage.addChild(bullet);
      this.bullets.push(bullet);
    } else {
      // Two diagonal bullets — one angled up, one angled down
      const bullet1 = new Graphics();
      bullet1.rect(0, 0, 10, 4).fill(0xff0000);
      bullet1.x = this.sprite.x;
      bullet1.y = this.sprite.y + 13;
      (bullet1 as any).vy = -2;
      this.app.stage.addChild(bullet1);
      this.bullets.push(bullet1);

      const bullet2 = new Graphics();
      bullet2.rect(0, 0, 10, 4).fill(0xff0000);
      bullet2.x = this.sprite.x;
      bullet2.y = this.sprite.y + 13;
      (bullet2 as any).vy = 2;
      this.app.stage.addChild(bullet2);
      this.bullets.push(bullet2);
    }
  }

  isOffScreen(): boolean {
    return this.sprite.x + 70 < 0;
  }

  getBounds(): Rectangle {
    return new Rectangle(this.sprite.x, this.sprite.y, 70, 45);
  }

  getBullets(): Graphics[] {
    return this.bullets;
  }

  destroy(): void {
    this.bullets.forEach((b) => this.app.stage.removeChild(b));
    this.app.stage.removeChild(this.sprite);
  }
}