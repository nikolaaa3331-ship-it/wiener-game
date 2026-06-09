import { Application, Graphics } from 'pixi.js';

// Particle-based explosion effect — spawned when enemies or the hero are destroyed
export class Explosion {
  private app: Application;
  // Each particle has a Graphics object, velocity and remaining life (0-1)
  private particles: { g: Graphics; vx: number; vy: number; life: number }[] = [];
  private done: boolean = false;

  constructor(app: Application, x: number, y: number) {
    this.app = app;
    const colors = [0xff4400, 0xff8800, 0xffff00, 0xffffff, 0xff0000];

    // Spawn 30 particles in random directions with random colors and sizes
    for (let i = 0; i < 30; i++) {
      const g = new Graphics();
      const color = colors[Math.floor(Math.random() * colors.length)];
      const size = Math.random() * 30 + 12;
      g.circle(0, 0, size).fill(color);
      g.x = x;
      g.y = y;
      this.app.stage.addChild(g);
      this.particles.push({
        g,
        vx: (Math.random() - 0.5) * 15,
        vy: (Math.random() - 0.5) * 15,
        life: 1
      });
    }
  }

  // Moves particles outward and fades them out over time
  update(delta: number): void {
    this.particles.forEach(p => {
      p.g.x += p.vx * delta;
      p.g.y += p.vy * delta;
      p.life -= 0.03 * delta;
      p.g.alpha = p.life;      // Fade out
      p.g.scale.set(p.life);   // Shrink as life decreases
    });

    // Remove dead particles from stage and array
    this.particles = this.particles.filter(p => {
      if (p.life <= 0) {
        this.app.stage.removeChild(p.g);
        return false;
      }
      return true;
    });

    if (this.particles.length === 0) this.done = true;
  }

  // Returns true when all particles have faded — signals Game to remove this explosion
  isDone(): boolean { return this.done; }
}