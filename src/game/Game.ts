import { Application, Text, Assets } from 'pixi.js';
import { Hero } from './Hero';
import { Obstacle } from './Obstacle';
import { Opponent } from './Opponent';
import { Background } from './Background';
import { Explosion } from './Explosion';
import { SoundManager } from './SoundManager';
import { Menu } from './Menu';

// Central game controller — manages the game loop, entity spawning and collision detection
export class Game {
  private app: Application;
  private hero!: Hero;
  private obstacles: Obstacle[] = [];
  private opponents: Opponent[] = [];
  private explosions: Explosion[] = [];
  private background!: Background;
  private score: number = 0;
  private scoreText!: Text;
  private weaponText!: Text;       // Shows current special weapon and ammo count
  private gameOver: boolean = false;
  private spawnTimer: number = 0;  // Controls spawn rate of enemies and obstacles
  private tickerFn: any = () => {};
  private keyHandler!: (e: KeyboardEvent) => void;
  private keyUpHandler!: (e: KeyboardEvent) => void;
  private sound!: SoundManager;
  private heroType: number = 1;    // 1 = forward shooter, 2 = diagonal shooter

  constructor() {
    this.app = new Application();
  }

  // Initializes PixiJS, preloads all assets, then shows the menu
  async start(): Promise<void> {
    await this.app.init({
      width: 800,
      height: 500,
      backgroundColor: 0x87ceeb,
    });

    document.body.appendChild(this.app.canvas);

    await Assets.load([
      '/hero.webp',
      '/Hero2.webp',
      '/enemy1.webp',
      '/enemy2.webp',
      '/tank1.webp',
    ]);

    this.sound = new SoundManager();
    this.showMenu();
  }

  // Clears the stage and shows the main menu with hero selection
  private showMenu(): void {
    this.app.stage.removeChildren();
    this.sound.stopMusic();
    new Menu(this.app, (heroType: number) => {
      this.heroType = heroType;
      this.sound.startMusic();
      this.setup();
    });
  }

  // Resets all game state and starts a fresh round
  private setup(): void {
    this.app.stage.removeChildren();
    this.obstacles = [];
    this.opponents = [];
    this.explosions = [];
    this.score = 0;
    this.gameOver = false;
    this.spawnTimer = 0;

    this.background = new Background(this.app);
    this.hero = new Hero(this.app, this.heroType);

    this.scoreText = new Text({
      text: 'Score: 0',
      style: { fill: 0xffffff, fontSize: 20, fontWeight: 'bold' }
    });
    this.scoreText.x = 10;
    this.scoreText.y = 10;
    this.app.stage.addChild(this.scoreText);

    this.weaponText = new Text({
      text: '',
      style: { fill: 0xffff00, fontSize: 16, fontWeight: 'bold' }
    });
    this.weaponText.x = 10;
    this.weaponText.y = 38;
    this.app.stage.addChild(this.weaponText);

    // Remove previous key listeners to avoid stacking them on restart
    if (this.keyHandler) {
      window.removeEventListener('keydown', this.keyHandler);
      window.removeEventListener('keyup', this.keyUpHandler);
    }

    this.keyHandler = (e: KeyboardEvent) => {
      if (this.gameOver && e.code === 'Enter') {
        this.showMenu();
        return;
      }
      this.hero.onKeyDown(e);
    };
    this.keyUpHandler = (e: KeyboardEvent) => this.hero.onKeyUp(e);

    window.addEventListener('keydown', this.keyHandler);
    window.addEventListener('keyup', this.keyUpHandler);

    // Remove old ticker to prevent speed doubling on restart
    this.app.ticker.remove(this.tickerFn);
    this.tickerFn = (ticker: any) => this.update(ticker.deltaTime);
    this.app.ticker.add(this.tickerFn);
  }

  // Main game loop — called every frame by the PixiJS ticker
  private update(delta: number): void {
    if (this.gameOver) return;

    this.background.update(delta);

    // Detect new bullets fired this frame to trigger shoot sound
    const prevBulletCount = this.hero.getBulletCount();
    this.hero.update(delta);
    if (this.hero.getBulletCount() > prevBulletCount) {
      this.sound.shoot();
    }

    // Update weapon HUD display
    const weapon = this.hero.getCurrentWeapon();
    const ammo = this.hero.getSpecialAmmo();
    if (weapon === 'fire') this.weaponText.text = `🔥 FIRE x${ammo}`;
    else if (weapon === 'bomb') this.weaponText.text = `💣 BOMB x${ammo}`;
    else this.weaponText.text = '';

    // Update active explosions and remove finished ones
    this.explosions = this.explosions.filter(e => {
      e.update(delta);
      return !e.isDone();
    });

    // Spawn a new enemy or obstacle every 150 frames (60% obstacles, 40% opponents)
    this.spawnTimer += delta;
    if (this.spawnTimer > 150) {
      this.spawnTimer = 0;
      const rand = Math.random();
      if (rand < 0.4) {
        this.opponents.push(new Opponent(this.app));
      } else {
        this.obstacles.push(new Obstacle(this.app));
      }
    }

    // Process obstacles — tanks, rockets and power-ups
    this.obstacles = this.obstacles.filter(o => {
      o.update(delta);
      if (o.isOffScreen()) { o.destroy(); return false; }

      // Power-ups are collected on touch, not lethal
      if (o.isPowerUp()) {
        if (this.hero.collidesWith(o.getBounds())) {
          this.hero.setWeapon(o.weaponType);
          o.destroy();
          return false;
        }
        return true;
      }

      // Hero collides with obstacle — both explode, game over
      if (this.hero.collidesWith(o.getBounds())) {
        const hp = this.hero.getPosition();
        this.explosions.push(new Explosion(this.app, hp.x + 40, hp.y + 25));
        this.explosions.push(new Explosion(this.app, o.getBounds().x + 30, o.getBounds().y + 20));
        this.sound.explosion();
        this.endGame(); return false;
      }
      // Hero bullet hits obstacle
      if (this.hero.getBulletCollision(o.getBounds())) {
        this.explosions.push(new Explosion(this.app, o.getBounds().x + 30, o.getBounds().y + 20));
        this.sound.explosion();
        this.score += 10; o.destroy(); return false;
      }
      // Tank projectile hits hero
      if (this.hero.isHitByEnemyBullet(o.getBullets())) {
        const hp = this.hero.getPosition();
        this.explosions.push(new Explosion(this.app, hp.x + 40, hp.y + 25));
        this.sound.explosion();
        this.endGame(); return false;
      }
      return true;
    });

    // Process opponents — enemy planes
    this.opponents = this.opponents.filter(op => {
      op.update(delta, this.hero.getPosition());
      if (op.isOffScreen()) { op.destroy(); return false; }
      // Hero collides with opponent
      if (this.hero.collidesWith(op.getBounds())) {
        const hp = this.hero.getPosition();
        this.explosions.push(new Explosion(this.app, hp.x + 40, hp.y + 25));
        this.explosions.push(new Explosion(this.app, op.getBounds().x + 35, op.getBounds().y + 22));
        this.sound.explosion();
        this.endGame(); return false;
      }
      // Hero bullet hits opponent
      if (this.hero.getBulletCollision(op.getBounds())) {
        this.explosions.push(new Explosion(this.app, op.getBounds().x + 35, op.getBounds().y + 22));
        this.sound.explosion();
        this.score += 20; op.destroy(); return false;
      }
      // Opponent projectile hits hero
      if (this.hero.isHitByEnemyBullet(op.getBullets())) {
        const hp = this.hero.getPosition();
        this.explosions.push(new Explosion(this.app, hp.x + 40, hp.y + 25));
        this.sound.explosion();
        this.endGame(); return false;
      }
      return true;
    });

    // Score increases passively with time survived
    this.score += 0.05 * delta;
    this.scoreText.text = `Score: ${Math.floor(this.score)}`;
  }

  // Ends the game — saves high score and shows game over screen
  private endGame(): void {
    this.gameOver = true;
    this.sound.stopMusic();
    this.sound.gameOverSound();

    // Save high score to localStorage if current score is higher
    const currentHighScore = parseInt(localStorage.getItem('skyDefenderHighScore') || '0');
    if (Math.floor(this.score) > currentHighScore) {
      localStorage.setItem('skyDefenderHighScore', Math.floor(this.score).toString());
    }

    const gameOverText = new Text({
      text: 'GAME OVER',
      style: { fill: 0xff0000, fontSize: 48, fontWeight: 'bold' }
    });
    gameOverText.x = this.app.screen.width / 2 - gameOverText.width / 2;
    gameOverText.y = this.app.screen.height / 2 - 70;
    this.app.stage.addChild(gameOverText);

    const scoreText = new Text({
      text: `Score: ${Math.floor(this.score)}`,
      style: { fill: 0xf5a623, fontSize: 24 }
    });
    scoreText.x = this.app.screen.width / 2 - scoreText.width / 2;
    scoreText.y = this.app.screen.height / 2 - 10;
    this.app.stage.addChild(scoreText);

    const highScore = localStorage.getItem('skyDefenderHighScore') || '0';
    const highScoreText = new Text({
      text: `🏆 Best: ${highScore}`,
      style: { fill: 0xf5a623, fontSize: 18 }
    });
    highScoreText.x = this.app.screen.width / 2 - highScoreText.width / 2;
    highScoreText.y = this.app.screen.height / 2 + 30;
    this.app.stage.addChild(highScoreText);

    const restartText = new Text({
      text: 'Press ENTER for Menu',
      style: { fill: 0xffffff, fontSize: 20 }
    });
    restartText.x = this.app.screen.width / 2 - restartText.width / 2;
    restartText.y = this.app.screen.height / 2 + 70;
    this.app.stage.addChild(restartText);
  }
}