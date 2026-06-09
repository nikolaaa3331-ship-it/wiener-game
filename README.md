# Sky Defender 🛩️

A side-scrolling shooter game built with TypeScript, PixiJS and ES6+.

## Live Demo

🎮 [Play now](https://wiener-game.vercel.app/)

## How to Run Locally

1. Clone the repository:
```bash
   git clone https://github.com/nikolaaa111333/wiener-game.git
   cd wiener-game
```

2. Install dependencies:
```bash
   npm install
```

3. Start the development server:
```bash
   npx vite@5 dev
```

4. Open your browser at `http://localhost:5173`

## How to Play

| Key | Action |
|-----|--------|
| ← → ↑ ↓ | Move the hero plane |
| SPACE | Fire bullets |
| ENTER | Return to menu after Game Over |

On mobile — rotate your device horizontally and use the on-screen controls.

## Objective

Survive as long as possible while destroying enemies and avoiding obstacles. Score increases over time and with each enemy destroyed.

## Heroes

| Hero | Firing Style |
|------|-------------|
| ✈️ Hero 1 | Fires straight ahead — easy to aim |
| ✈️ Hero 2 | Fires diagonally — covers more area |

## Enemies & Obstacles

- **Straight planes** — fly in a straight line, fire single bullets
- **Zigzag planes** — move up and down, fire more frequently
- **Tanks** — roll along the ground, fire diagonal shots upward
- **Rockets** — fast-moving obstacles, cannot shoot back
- **Power-ups** 🔥💣 — collect them to gain special weapons (5 shots each)

## Special Weapons

- **🔥 Fire** — three wide beams fired simultaneously
- **💣 Bomb** — drops downward with a large blast radius

## Project Structure

src/
└── game/
├── Game.ts          # Main controller — game loop, spawning, collision
├── Hero.ts          # Player aircraft — movement, shooting, weapons
├── Opponent.ts      # Enemy planes — two movement/firing patterns
├── Obstacle.ts      # Tanks, rockets and power-ups
├── Background.ts    # Scrolling sky, ground and clouds
├── Explosion.ts     # Particle explosion effect
├── SoundManager.ts  # Procedural audio via Web Audio API
└── Menu.ts          # Start screen with hero selection

## Tech Stack

- **TypeScript** — strongly typed JavaScript
- **PixiJS v8** — WebGL-accelerated 2D rendering
- **Vite** — fast build tool and dev server
- **Web Audio API** — procedurally generated sounds, no audio files needed

## Design Decisions

- All entities use **OOP with ES6 classes** following the required design paradigm
- **AABB collision detection** for performance
- Sound is **procedurally generated** — no external audio files needed
- Assets preloaded via **PixiJS Assets API** before game start
- **localStorage** used to persist the high score between sessions
