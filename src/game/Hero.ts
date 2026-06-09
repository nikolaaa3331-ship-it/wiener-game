import { Application, Graphics, Rectangle, Sprite } from 'pixi.js';

// Weapon types available to the hero
export type WeaponType = 'normal' | 'fire' | 'bomb';

// Represents the player-controlled aircraft
export class Hero {
  private app: Application;
  private sprite: Graphics;
  // Each bullet stores its Graphics object and velocity vector
  private bullets: { g: Graphics; vx: number; vy: number }[] = [];
  private keys: Record<string, boolean> = {};
  private shootCooldown: number = 0;
  readonly speed = 5;
  private heroType: number; // 1 = forward shooter, 2 = diagonal shooter

  private currentWeapon: WeaponType = 'normal';
  private specialAmmo: number = 0; // Remaining shots for fire/bomb weapons
  private aura: Graphics;          // Visual glow effect when special weapon is active
  private auraTimer: number = 0;

  constructor(app: Application, heroType: number = 1) {
    this.app = app;
    this.heroType = heroType;
    // Load the correct sprite based on hero selection
    const texture = heroType === 2 ? '/Hero2.webp' : '/hero.webp';
    this.sprite = Sprite.from(texture) as any;
    this.sprite.width = 80;
    this.sprite.height = 50;
    this.sprite.x = 100;
    this.sprite.y = app.screen.height / 2;
    app.stage.addChild(this.sprite);

    this.aura = new Graphics();
    app.stage.addChild(this.aura);
  }

  onKeyDown(e: KeyboardEvent): void { this.keys[e.code] = true; }
  onKeyUp(e: KeyboardEvent): void { this.keys[e.code] = false; }

  getPosition() { return { x: this.sprite.x, y: this.sprite.y }; }
  getBulletCount(): number { return this.bullets.length; }
  getCurrentWeapon(): WeaponType { return this.currentWeapon; }
  getSpecialAmmo(): number { return this.specialAmmo; }

  // Activates a special weapon and grants 5 shots
  setWeapon(type: WeaponType): void {
    this.currentWeapon = type;
    this.specialAmmo = 5;
  }

  // Called every frame — handles movement, shooting and bullet updates
  update(delta: number): void {
    if (this.keys['ArrowUp']) this.sprite.y -= this.speed * delta;
    if (this.keys['ArrowDown']) this.sprite.y += this.speed * delta;
    if (this.keys['ArrowLeft']) this.sprite.x -= this.speed * delta;
    if (this.keys['ArrowRight']) this.sprite.x += this.speed * delta;

    // Keep hero within screen bounds
    this.sprite.x = Math.max(0, Math.min(this.app.screen.width - 80, this.sprite.x));
    this.sprite.y = Math.max(0, Math.min(this.app.screen.height - 50, this.sprite.y));

    this.updateAura(delta);

    this.shootCooldown -= delta;
    if (this.keys['Space'] && this.shootCooldown <= 0) {
      this.shoot();
      this.shootCooldown = this.currentWeapon === 'bomb' ? 30 : 15;
    }

    // Move all bullets according to their velocity and remove off-screen ones
    this.bullets = this.bullets.filter(b => {
      b.g.x += b.vx * delta;
      b.g.y += b.vy * delta;
      if (b.g.x > this.app.screen.width || b.g.x < 0 ||
          b.g.y > this.app.screen.height || b.g.y < 0) {
        this.app.stage.removeChild(b.g);
        return false;
      }
      return true;
    });
  }

  // Draws a pulsing colored aura around the hero when a special weapon is active
  private updateAura(delta: number): void {
    this.aura.clear();
    if (this.currentWeapon === 'normal') return;
    this.auraTimer += 0.1 * delta;
    const cx = this.sprite.x + 40;
    const cy = this.sprite.y + 25;
    const color = this.currentWeapon === 'fire' ? 0xff4400 : 0x0088ff;
    const alpha = 0.3 + Math.sin(this.auraTimer) * 0.2;
    this.aura.circle(cx, cy, 50).fill({ color, alpha });
    this.aura.circle(cx, cy, 38).fill({ color, alpha: alpha * 0.6 });
  }

  // Fires the appropriate projectile based on current weapon and hero type
  private shoot(): void {
    if (this.currentWeapon === 'bomb' && this.specialAmmo > 0) {
      // Bomb drops downward and has a large blast radius
      const g = new Graphics();
      g.circle(0, 0, 12).fill(0x0044ff);
      g.circle(0, 0, 6).fill(0x0088ff);
      g.x = this.sprite.x + 40;
      g.y = this.sprite.y + 50;
      (g as any).isBomb = true;
      this.app.stage.addChild(g);
      this.bullets.push({ g, vx: 0, vy: 6 });
      this.specialAmmo--;
      if (this.specialAmmo <= 0) this.currentWeapon = 'normal';

    } else if (this.currentWeapon === 'fire' && this.specialAmmo > 0) {
      // Fire shoots three wide beams simultaneously for area coverage
      [-20, 0, 20].forEach(offset => {
        const g = new Graphics();
        g.rect(0, -8, 60, 16).fill(0xff4400);
        g.rect(0, -5, 45, 10).fill(0xff8800);
        g.rect(0, -3, 30, 6).fill(0xffff00);
        g.x = this.sprite.x + 80;
        g.y = this.sprite.y + 25 + offset;
        (g as any).isFire = true;
        this.app.stage.addChild(g);
        this.bullets.push({ g, vx: 10, vy: 0 });
      });
      this.specialAmmo--;
      if (this.specialAmmo <= 0) this.currentWeapon = 'normal';

    } else if (this.heroType === 2) {
      // Hero 2 fires two diagonal bullets — harder to aim but covers more area
      [{ vx: 8, vy: -5 }, { vx: 8, vy: 5 }].forEach(dir => {
        const g = new Graphics();
        g.rect(0, 0, 12, 5).fill(0x00ffff);
        g.x = this.sprite.x + 80;
        g.y = this.sprite.y + 22;
        this.app.stage.addChild(g);
        this.bullets.push({ g, vx: dir.vx, vy: dir.vy });
      });

    } else {
      // Hero 1 fires a single bullet straight ahead
      this.currentWeapon = 'normal';
      const g = new Graphics();
      g.rect(0, 0, 12, 5).fill(0xffff00);
      g.x = this.sprite.x + 80;
      g.y = this.sprite.y + 22;
      this.app.stage.addChild(g);
      this.bullets.push({ g, vx: 10, vy: 0 });
    }
  }

  // AABB collision check between hero and a rectangular bounds
  collidesWith(bounds: Rectangle): boolean {
    const hb = new Rectangle(this.sprite.x, this.sprite.y, 80, 50);
    return hb.x < bounds.x + bounds.width &&
      hb.x + hb.width > bounds.x &&
      hb.y < bounds.y + bounds.height &&
      hb.y + hb.height > bounds.y;
  }

  // Checks if any hero bullet intersects the given bounds — removes the bullet on hit
  getBulletCollision(bounds: Rectangle): boolean {
    return this.bullets.some((b, i) => {
      let bb: Rectangle;
      if ((b.g as any).isBomb) {
        bb = new Rectangle(b.g.x - 50, b.g.y - 50, 100, 100); // Large blast radius
      } else if ((b.g as any).isFire) {
        bb = new Rectangle(b.g.x, b.g.y - 8, 60, 16);
      } else {
        bb = new Rectangle(b.g.x, b.g.y, 12, 5);
      }
      if (bb.x < bounds.x + bounds.width &&
        bb.x + bb.width > bounds.x &&
        bb.y < bounds.y + bounds.height &&
        bb.y + bb.height > bounds.y) {
        this.app.stage.removeChild(b.g);
        this.bullets.splice(i, 1);
        return true;
      }
      return false;
    });
  }

  // Checks if any enemy projectile has hit the hero
  isHitByEnemyBullet(bullets: Graphics[]): boolean {
    const hb = new Rectangle(this.sprite.x, this.sprite.y, 80, 50);
    return bullets.some(b => {
      const bb = new Rectangle(b.x, b.y, 8, 4);
      return hb.x < bb.x + bb.width &&
        hb.x + hb.width > bb.x &&
        hb.y < bb.y + bb.height &&
        hb.y + hb.height > bb.y;
    });
  }

  getBounds(): Rectangle {
    return new Rectangle(this.sprite.x, this.sprite.y, 80, 50);
  }

  destroy(): void {
    this.app.stage.removeChild(this.aura);
  }
}