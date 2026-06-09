import { Application, Graphics, Text, Sprite } from 'pixi.js';

// Start screen — shows title, high score, hero selection and controls
export class Menu {
  private app: Application;
  private container: Graphics;
  private onStart: (heroType: number) => void;
  private started: boolean = false;
  private selectedHero: number = 1; // Currently highlighted hero (1 or 2)
  private keyHandler!: (e: KeyboardEvent) => void;

  constructor(app: Application, onStart: (heroType: number) => void) {
    this.app = app;
    this.onStart = onStart;
    this.container = new Graphics();
    this.draw();
  }

  private draw(): void {
    // Dark background
    this.container.rect(0, 0, this.app.screen.width, this.app.screen.height).fill(0x0d1b2a);
    this.app.stage.addChild(this.container);

    const title = new Text({
      text: 'WIENER GAMES',
      style: { fill: 0xe94560, fontSize: 36, fontWeight: 'bold' }
    });
    title.x = this.app.screen.width / 2 - title.width / 2;
    title.y = 30;
    this.app.stage.addChild(title);

    const subtitle = new Text({
      text: 'Sky Defender',
      style: { fill: 0xf5a623, fontSize: 18 }
    });
    subtitle.x = this.app.screen.width / 2 - subtitle.width / 2;
    subtitle.y = 75;
    this.app.stage.addChild(subtitle);

    // Load and display the persisted high score from localStorage
    const highScore = localStorage.getItem('skyDefenderHighScore') || '0';
    const highScoreText = new Text({
      text: `🏆 HIGH SCORE: ${highScore}`,
      style: { fill: 0xf5a623, fontSize: 16, fontWeight: 'bold' }
    });
    highScoreText.x = this.app.screen.width / 2 - highScoreText.width / 2;
    highScoreText.y = 110;
    this.app.stage.addChild(highScoreText);

    const chooseText = new Text({
      text: 'ИЗБЕРИ САМОЛЕТ:',
      style: { fill: 0xffffff, fontSize: 14, fontWeight: 'bold' }
    });
    chooseText.x = this.app.screen.width / 2 - chooseText.width / 2;
    chooseText.y = 150;
    this.app.stage.addChild(chooseText);

    // Hero 1 selection card
    const hero1Box = new Graphics();
    hero1Box.x = this.app.screen.width / 2 - 180;
    hero1Box.y = 175;
    hero1Box.interactive = true;
    hero1Box.cursor = 'pointer';
    this.app.stage.addChild(hero1Box);

    const hero1Sprite = Sprite.from('/hero.webp');
    hero1Sprite.width = 100;
    hero1Sprite.height = 60;
    hero1Sprite.x = hero1Box.x + 30;
    hero1Sprite.y = hero1Box.y + 15;
    this.app.stage.addChild(hero1Sprite);

    const hero1Text = new Text({
      text: 'САМОЛЕТ 1\n→ Стреля напред',
      style: { fill: 0xffffff, fontSize: 9, lineHeight: 16 }
    });
    hero1Text.x = hero1Box.x + 10;
    hero1Text.y = hero1Box.y + 85;
    this.app.stage.addChild(hero1Text);

    // Hero 2 selection card
    const hero2Box = new Graphics();
    hero2Box.x = this.app.screen.width / 2 + 20;
    hero2Box.y = 175;
    hero2Box.interactive = true;
    hero2Box.cursor = 'pointer';
    this.app.stage.addChild(hero2Box);

    const hero2Sprite = Sprite.from('/Hero2.webp');
    hero2Sprite.width = 100;
    hero2Sprite.height = 60;
    hero2Sprite.x = hero2Box.x + 30;
    hero2Sprite.y = hero2Box.y + 15;
    this.app.stage.addChild(hero2Sprite);

    const hero2Text = new Text({
      text: 'САМОЛЕТ 2\n↗↘ Стреля диагонал',
      style: { fill: 0xffffff, fontSize: 9, lineHeight: 16 }
    });
    hero2Text.x = hero2Box.x + 10;
    hero2Text.y = hero2Box.y + 85;
    this.app.stage.addChild(hero2Text);

    // Redraws both cards with a highlight on the selected one
    const updateSelection = (heroNum: number) => {
      this.selectedHero = heroNum;
      hero1Box.clear();
      hero2Box.clear();
      hero1Box.roundRect(0, 0, 160, 120, 8).fill(0x1a3a5c);
      hero2Box.roundRect(0, 0, 160, 120, 8).fill(0x1a3a5c);
      if (heroNum === 1) {
        hero1Box.roundRect(0, 0, 160, 120, 8).stroke({ color: 0xe94560, width: 3 });
        hero2Box.roundRect(0, 0, 160, 120, 8).stroke({ color: 0x444444, width: 2 });
      } else {
        hero1Box.roundRect(0, 0, 160, 120, 8).stroke({ color: 0x444444, width: 2 });
        hero2Box.roundRect(0, 0, 160, 120, 8).stroke({ color: 0xe94560, width: 3 });
      }
    };

    updateSelection(1);

    hero1Box.on('pointerdown', () => updateSelection(1));
    hero2Box.on('pointerdown', () => updateSelection(2));

    const controls = new Text({
      text: '← → —  Избор на самолет\nSPACE / ENTER  —  Старт',
      style: { fill: 0xaaaaaa, fontSize: 12, lineHeight: 24 }
    });
    controls.x = this.app.screen.width / 2 - controls.width / 2;
    controls.y = 315;
    this.app.stage.addChild(controls);

    const btn = new Graphics();
    btn.roundRect(0, 0, 200, 50, 8).fill(0xe94560);
    btn.x = this.app.screen.width / 2 - 100;
    btn.y = 410;
    btn.interactive = true;
    btn.cursor = 'pointer';
    this.app.stage.addChild(btn);

    const btnText = new Text({
      text: 'ИГРАЙ',
      style: { fill: 0xffffff, fontSize: 18, fontWeight: 'bold' }
    });
    btnText.x = btn.x + 100 - btnText.width / 2;
    btnText.y = btn.y + 14;
    this.app.stage.addChild(btnText);

    btn.on('pointerdown', () => this.start());

    // Keyboard navigation — arrows to switch hero, Space/Enter to start
    this.keyHandler = (e: KeyboardEvent) => {
      if (e.code === 'ArrowLeft') updateSelection(1);
      else if (e.code === 'ArrowRight') updateSelection(2);
      else if (e.code === 'Space' || e.code === 'Enter') {
        window.removeEventListener('keydown', this.keyHandler);
        this.start();
      }
    };
    window.addEventListener('keydown', this.keyHandler);
  }

  // Starts the game with the selected hero — cleans up key listener first
  private start(): void {
    if (this.started) return;
    this.started = true;
    window.removeEventListener('keydown', this.keyHandler);
    this.app.stage.removeChildren();
    this.onStart(this.selectedHero);
  }
}