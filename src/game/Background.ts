import { Application, Graphics } from 'pixi.js';

// Manages the scrolling background — sky, ground and clouds
export class Background {
  private app: Application;
  private sky: Graphics;
  private ground: Graphics;
  private clouds: Graphics[] = [];
  private cloudTimer: number = 0;

  constructor(app: Application) {
    this.app = app;

    // Sky fills the upper portion of the screen
    this.sky = new Graphics();
    this.sky.rect(0, 0, app.screen.width, app.screen.height - 60).fill(0x87ceeb);
    app.stage.addChild(this.sky);

    // Green ground strip at the bottom
    this.ground = new Graphics();
    this.ground.rect(0, app.screen.height - 60, app.screen.width, 60).fill(0x228b22);
    app.stage.addChild(this.ground);

    // Spawn initial clouds at random positions
    for (let i = 0; i < 4; i++) {
      this.spawnCloud(Math.random() * app.screen.width);
    }
  }

  // Creates a single cloud ellipse at the given x position
  private spawnCloud(x: number): void {
    const cloud = new Graphics();
    cloud.ellipse(0, 0, 60, 30).fill(0xffffff);
    cloud.x = x;
    cloud.y = Math.random() * (this.app.screen.height - 120) + 20;
    cloud.alpha = 0.8;
    this.app.stage.addChild(cloud);
    this.clouds.push(cloud);
  }

  // Called every frame — moves clouds left and spawns new ones as needed
  update(delta: number): void {
    this.clouds.forEach((c) => { c.x -= 1.5 * delta; });

    // Remove clouds that have scrolled off screen
    this.clouds = this.clouds.filter((c) => {
      if (c.x < -80) {
        this.app.stage.removeChild(c);
        return false;
      }
      return true;
    });

    // Spawn a new cloud every 120 frames
    this.cloudTimer += delta;
    if (this.cloudTimer > 120) {
      this.cloudTimer = 0;
      this.spawnCloud(this.app.screen.width + 60);
    }
  }
}