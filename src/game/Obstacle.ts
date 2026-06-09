import { Application, Graphics, Rectangle, Sprite } from 'pixi.js';

// Re-exported here so Game.ts can use it without importing from Hero
export type WeaponType = 'normal' | 'fire' | 'bomb';

// Handles all non-enemy obstacles: tanks (shoot upward), rockets (fly straight) and power-ups
export class Obstacle {
  private app: Application;
  private sprite: Sprite | Graphics;
  private bullets: Graphics[] = [];
  private shootTimer: number = 0;
  private bobTimer: number = 0;  // Used for power-up floating animation
  private startY: number = 0;
  public type: 'tank' | 'rocket' | 'powerup';
  public weaponType: WeaponType = 'normal'; // Only relevant for power-up type

  constructor(app: Application) {
    this.app = app;

    // 40% tanks, 30% rockets, 30% power-ups
    const rand = Math.random();
    if (rand < 0.4) {
      this.type = 'tank';
    } else if (rand < 0.7) {
      this.type = 'rocket';
    } else {
      this.type = 'powerup';
    }

    if (this.type === 'tank') {
      // Tank rolls along the ground and fires diagonal shots upward
      this.sprite = Sprite.from('/tank1.webp') as any;
      (this.sprite as Sprite).width = 60;
      (this.sprite as Sprite).height = 40;
      this.sprite.x = app.screen.width + 10;
      this.sprite.y = app.screen.height - 90;

    } else if (this.type === 'rocket') {
      // Rocket is a fast-moving obstacle — no shooting, just dodge it
      const rocket = new Graphics();
      rocket.rect(0, -8, 50, 16).fill(0x888888);  // Body
      rocket.rect(50, -6, 15, 12).fill(0xff4400);  // Nose cone
      rocket.rect(-10, -6, 12, 12).fill(0x555555); // Tail
      this.sprite = rocket;
      this.sprite.x = app.screen.width + 60;
      this.sprite.y = Math.random() * (app.screen.height - 140) + 40;

    } else {
      // Power-up — collect it to gain fire or bomb weapon (5 shots)
      this.weaponType = Math.random() > 0.5 ? 'fire' : 'bomb';
      const pu = new Graphics();
      if (this.weaponType === 'fire') {
        // Fire power-up — concentric orange/yellow circles
        pu.circle(0, 0, 18).fill(0xff4400);
        pu.circle(0, 0, 11).fill(0xff8800);
        pu.circle(0, 0, 5).fill(0xffff00);
      } else {
        // Bomb power-up — blue circles with black center
        pu.circle(0, 0, 18).fill(0x0044ff);
        pu.circle(0, 0, 11).fill(0x0088ff);
        pu.rect(-5, -5, 10, 10).fill(0x000000);
      }
      this.sprite = pu;
      this.sprite.x = app.screen.width + 20;
      this.startY = Math.random() * (app.screen.height - 160) + 60;
      this.sprite.y = this.startY;
    }

    app.stage.addChild(this.sprite);
  }

  // Called every frame — moves the obstacle and handles tank shooting
  update(delta: number): void {
    if (this.type === 'tank') {
      this.sprite.x -= 2 * delta;
      this.shootTimer += delta;
      // Tank fires a diagonal shot every 120 frames
      if (this.shootTimer > 120) {
        this.shootTimer = 0;
        this.shoot();
      }
      // Move tank bullets diagonally upward and remove when off-screen
      this.bullets = this.bullets.filter((b) => {
        b.x -= 3 * delta;
        b.y -= 4 * delta;
        if (b.x < 0 || b.y < 0) {
          this.app.stage.removeChild(b);
          return false;
        }
        return true;
      });

    } else if (this.type === 'rocket') {
      // Rocket moves fast with no shooting
      this.sprite.x -= 5 * delta;

    } else {
      // Power-up bobs up and down using a sine wave
      this.sprite.x -= 2 * delta;
      this.bobTimer += 0.05 * delta;
      this.sprite.y = this.startY + Math.sin(this.bobTimer) * 15;
    }
  }

  // Fires a single diagonal bullet upward from the tank
  private shoot(): void {
    const bullet = new Graphics();
    bullet.circle(0, 0, 6).fill(0xff4400);
    bullet.x = this.sprite.x + 10;
    bullet.y = this.sprite.y;
    this.app.stage.addChild(bullet);
    this.bullets.push(bullet);
  }

  isOffScreen(): boolean {
    return this.sprite.x + 70 < 0;
  }

  // Returns true only for power-up type — used by Game to handle collection instead of collision
  isPowerUp(): boolean {
    return this.type === 'powerup';
  }

  // Returns an AABB bounding box appropriate for each obstacle type
  getBounds(): Rectangle {
    if (this.type === 'tank') {
      return new Rectangle(this.sprite.x, this.sprite.y, 60, 40);
    } else if (this.type === 'rocket') {
      return new Rectangle(this.sprite.x, this.sprite.y - 8, 65, 16);
    } else {
      return new Rectangle(this.sprite.x - 18, this.sprite.y - 18, 36, 36);
    }
  }

  getBullets(): Graphics[] {
    return this.bullets;
  }

  destroy(): void {
    this.bullets.forEach((b) => this.app.stage.removeChild(b));
    this.app.stage.removeChild(this.sprite);
  }
}