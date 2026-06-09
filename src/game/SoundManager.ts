// All sound effects and music are generated procedurally using the Web Audio API
// No external audio files are needed — keeps the bundle size minimal
export class SoundManager {
  private ctx: AudioContext;
  private musicStopped: boolean = false;

  constructor() {
    this.ctx = new AudioContext();
  }

  // Short descending tone played each time the hero fires
  shoot(): void {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.frequency.setValueAtTime(880, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(220, this.ctx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.1);
    osc.start(this.ctx.currentTime);
    osc.stop(this.ctx.currentTime + 0.1);
  }

  // White noise burst that simulates an explosion
  explosion(): void {
    const bufferSize = this.ctx.sampleRate * 0.5;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    // Fill buffer with random noise that fades out over time
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    }
    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(1, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.5);
    source.connect(gain);
    gain.connect(this.ctx.destination);
    source.start();
  }

  // Descending four-note sequence played on game over
  gameOverSound(): void {
    const notes = [523, 392, 329, 261];
    let time = this.ctx.currentTime + 0.1;
    notes.forEach(freq => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.frequency.value = freq;
      osc.type = 'square';
      gain.gain.setValueAtTime(0.2, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.4);
      osc.start(time);
      osc.stop(time + 0.4);
      time += 0.45;
    });
  }

  // Loops a simple 8-note melody during gameplay
  startMusic(): void {
    this.musicStopped = false;
    const notes = [261, 329, 392, 523, 392, 329, 261, 0]; // 0 = rest
    let time = this.ctx.currentTime;
    const playLoop = () => {
      if (this.musicStopped) return;
      notes.forEach(freq => {
        if (freq > 0) {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.frequency.value = freq;
          osc.type = 'square';
          gain.gain.setValueAtTime(0.05, time);
          gain.gain.exponentialRampToValueAtTime(0.001, time + 0.3);
          osc.start(time);
          osc.stop(time + 0.3);
        }
        time += 0.35;
      });
      // Schedule next loop iteration after current one completes
      setTimeout(playLoop, (notes.length * 0.35) * 1000);
    };
    playLoop();
  }

  // Sets a flag that stops the loop on the next iteration
  stopMusic(): void {
    this.musicStopped = true;
  }

  restartMusic(): void {
    this.startMusic();
  }
}