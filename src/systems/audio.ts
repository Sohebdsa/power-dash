// Fully synthesized audio (Web Audio API). Every sound and the soundtrack are
// generated in code, so there are no licensing concerns and nothing to download.
// The soundtrack uses a plucked-string voice (Karplus–Strong) and tabla-like
// percussion over a I–vi–IV–V progression, with layers that rise with speed.

export type Sfx =
  | 'start' | 'jump' | 'land' | 'slide' | 'lane' | 'food' | 'hygiene' | 'powerup' | 'magnet'
  | 'shield' | 'shieldBreak' | 'hit' | 'combo' | 'discovery' | 'gameover' | 'click' | 'step'
  | 'achievement' | 'superjump' | 'energy';

type MusicMode = 'none' | 'menu' | 'game';

const midi = (m: number) => 440 * Math.pow(2, (m - 69) / 12);

// [step, midi, lengthSteps]
type Note = [number, number, number];
// Melody phrases, 4 bars each (16 steps / bar). Key: D major pentatonic flavour.
const PHRASE_A: Note[][] = [
  [[0, 78, 2], [2, 81, 2], [4, 78, 2], [6, 76, 2], [8, 74, 4], [12, 76, 2], [14, 78, 2]],
  [[0, 74, 2], [2, 71, 2], [4, 74, 2], [6, 78, 2], [8, 76, 6], [14, 74, 2]],
  [[0, 71, 2], [2, 74, 2], [4, 76, 2], [6, 74, 2], [8, 71, 4], [12, 69, 2], [14, 71, 2]],
  [[0, 69, 2], [2, 71, 2], [4, 74, 2], [6, 76, 2], [8, 73, 4], [12, 76, 4]],
];
const PHRASE_B: Note[][] = [
  [[0, 81, 3], [3, 78, 1], [4, 81, 2], [6, 83, 2], [8, 81, 2], [10, 78, 2], [12, 76, 4]],
  [[0, 78, 2], [2, 74, 2], [4, 71, 2], [6, 74, 2], [8, 78, 3], [11, 76, 1], [12, 74, 4]],
  [[0, 79, 2], [2, 78, 2], [4, 76, 2], [6, 74, 2], [8, 76, 2], [10, 79, 2], [12, 78, 4]],
  [[0, 76, 2], [2, 74, 2], [4, 73, 2], [6, 71, 2], [8, 69, 6], [14, 73, 2]],
];
const PHRASE_C: Note[][] = [ // sparse "breathing" phrase for variety
  [[0, 74, 4], [6, 78, 2], [8, 81, 6]],
  [[0, 83, 4], [4, 81, 2], [6, 78, 2], [8, 74, 8]],
  [[0, 71, 4], [4, 74, 4], [8, 76, 4], [12, 79, 4]],
  [[0, 78, 4], [4, 76, 4], [8, 73, 8]],
];
// Bass roots per bar (D, B, G, A)
const ROOTS = [50, 47, 43, 45];

class AudioManager {
  ctx: AudioContext | null = null;
  master!: GainNode;
  musicGain!: GainNode;
  sfxGain!: GainNode;
  private noiseBuf!: AudioBuffer;
  private pluckCache = new Map<number, AudioBuffer>();
  private mode: MusicMode = 'none';
  private wantedMode: MusicMode = 'none';
  private timer: number | null = null;
  private nextTime = 0;
  private step = 0;
  private bar = 0;
  private phraseOrder: Note[][][] = [];
  private intensity = 0;
  private volumes = { music: 0.55, sfx: 0.8, muted: false };

  /** Must be called from a user gesture. */
  unlock() {
    if (!this.ctx) {
      const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return;
      this.ctx = new Ctor();
      this.master = this.ctx.createGain();
      this.musicGain = this.ctx.createGain();
      this.sfxGain = this.ctx.createGain();
      const comp = this.ctx.createDynamicsCompressor();
      comp.threshold.value = -14;
      comp.ratio.value = 4;
      this.musicGain.connect(this.master);
      this.sfxGain.connect(this.master);
      this.master.connect(comp).connect(this.ctx.destination);
      const len = this.ctx.sampleRate;
      this.noiseBuf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const d = this.noiseBuf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      this.applyVolumes();
      if (this.wantedMode !== 'none') this.playMusic(this.wantedMode);
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume();
  }

  setVolumes(music: number, sfx: number, muted: boolean) {
    this.volumes = { music, sfx, muted };
    this.applyVolumes();
  }

  private applyVolumes() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    this.master.gain.setTargetAtTime(this.volumes.muted ? 0 : 1, t, 0.05);
    this.musicGain.gain.setTargetAtTime(this.volumes.music * 0.5, t, 0.05);
    this.sfxGain.gain.setTargetAtTime(this.volumes.sfx * 0.7, t, 0.05);
  }

  setIntensity(v: number) {
    this.intensity = Math.max(0, Math.min(1, v));
  }

  suspend(paused: boolean) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    this.musicGain.gain.setTargetAtTime(paused ? this.volumes.music * 0.15 : this.volumes.music * 0.5, t, 0.15);
  }

  playMusic(mode: MusicMode) {
    this.wantedMode = mode;
    if (!this.ctx || mode === this.mode) return;
    this.mode = mode;
    if (this.timer !== null) {
      clearInterval(this.timer);
      this.timer = null;
    }
    if (mode === 'none') return;
    this.step = 0;
    this.bar = 0;
    this.nextTime = this.ctx.currentTime + 0.1;
    this.phraseOrder = [PHRASE_A, PHRASE_B, PHRASE_A, PHRASE_C];
    this.timer = window.setInterval(() => this.schedule(), 25);
  }

  private get stepDur() {
    const bpm = this.mode === 'menu' ? 92 : 112 + this.intensity * 14;
    return 60 / bpm / 4;
  }

  private schedule() {
    if (!this.ctx) return;
    while (this.nextTime < this.ctx.currentTime + 0.15) {
      this.playStep(this.nextTime);
      this.nextTime += this.stepDur;
      this.step++;
      if (this.step >= 16) {
        this.step = 0;
        this.bar++;
        if (this.bar % 16 === 0) {
          // reshuffle phrase order for variety
          const pool = [PHRASE_A, PHRASE_B, PHRASE_C];
          this.phraseOrder = [0, 1, 2, 3].map(() => pool[Math.floor(Math.random() * pool.length)]);
          this.phraseOrder[0] = PHRASE_A;
        }
      }
    }
  }

  private playStep(t: number) {
    const s = this.step;
    const barInLoop = this.bar % 4;
    const phrase = this.phraseOrder[Math.floor(this.bar / 4) % 4];
    const game = this.mode === 'game';
    const sd = this.stepDur;
    // Melody — skip the first 2 bars of the menu loop to breathe
    const playMelody = game || this.bar % 8 >= 2;
    if (playMelody) {
      for (const [st, m, len] of phrase[barInLoop]) {
        if (st === s) this.pluck(t, midi(m), len * sd, game ? 0.32 : 0.26);
      }
    }
    // Harmony pluck (chord tones) on beats
    const root = ROOTS[barInLoop];
    if (s === 0 || s === 8) {
      const third = barInLoop === 1 ? 3 : 4;
      this.pluck(t, midi(root + 12), sd * 6, 0.1);
      this.pluck(t + 0.01, midi(root + 12 + third), sd * 6, 0.08);
      this.pluck(t + 0.02, midi(root + 19), sd * 6, 0.08);
    }
    // Bass
    if (s === 0 || (game && s === 8) || (!game && s === 10)) this.bass(t, midi(root), sd * 6, 0.35);
    if (game && (s === 6 || s === 14)) this.bass(t, midi(root + 7), sd * 2, 0.22);
    // Percussion (tabla-ish)
    if (s === 0 || (game && s === 10)) this.dha(t, 0.5);
    if (s === 8 && game) this.dha(t, 0.38);
    if (s === 4 || s === 12) this.na(t, game ? 0.28 : 0.18);
    if (game && (s === 6 || s === 14 || (this.intensity > 0.4 && s === 15))) this.ting(t, 0.12);
    if (game && s % 2 === 0) this.shaker(t, 0.04 + this.intensity * 0.05);
  }

  // ---- instruments -------------------------------------------------------
  private pluckBuffer(freq: number) {
    const key = Math.round(freq * 10);
    const cached = this.pluckCache.get(key);
    if (cached) return cached;
    const ctx = this.ctx!;
    const sr = ctx.sampleRate;
    const len = Math.floor(sr * 1.6);
    const buf = ctx.createBuffer(1, len, sr);
    const out = buf.getChannelData(0);
    const period = Math.max(2, Math.round(sr / freq));
    const ring = new Float32Array(period);
    for (let i = 0; i < period; i++) ring[i] = Math.random() * 2 - 1;
    let idx = 0;
    for (let i = 0; i < len; i++) {
      const next = (idx + 1) % period;
      const v = (ring[idx] + ring[next]) * 0.5 * 0.996;
      out[i] = ring[idx];
      ring[idx] = v;
      idx = next;
    }
    this.pluckCache.set(key, buf);
    return buf;
  }

  private pluck(t: number, freq: number, dur: number, vol: number) {
    const ctx = this.ctx!;
    const src = ctx.createBufferSource();
    src.buffer = this.pluckBuffer(freq);
    const g = ctx.createGain();
    const f = ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = 3200;
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0008, t + Math.max(0.25, dur * 1.6));
    src.connect(f).connect(g).connect(this.musicGain);
    src.start(t);
    src.stop(t + Math.max(0.3, dur * 1.7));
  }

  private bass(t: number, freq: number, dur: number, vol: number) {
    const ctx = this.ctx!;
    const o = ctx.createOscillator();
    o.type = 'triangle';
    o.frequency.value = freq;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g).connect(this.musicGain);
    o.start(t);
    o.stop(t + dur + 0.05);
  }

  private dha(t: number, vol: number) {
    const ctx = this.ctx!;
    const o = ctx.createOscillator();
    o.type = 'sine';
    o.frequency.setValueAtTime(150, t);
    o.frequency.exponentialRampToValueAtTime(70, t + 0.25);
    const g = ctx.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
    o.connect(g).connect(this.musicGain);
    o.start(t);
    o.stop(t + 0.4);
  }

  private na(t: number, vol: number) {
    const ctx = this.ctx!;
    const o = ctx.createOscillator();
    o.type = 'sine';
    o.frequency.setValueAtTime(620, t);
    o.frequency.exponentialRampToValueAtTime(560, t + 0.15);
    const g = ctx.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
    o.connect(g).connect(this.musicGain);
    o.start(t);
    o.stop(t + 0.2);
    this.noise(t, 0.03, vol * 0.4, 3000, 'bandpass', this.musicGain);
  }

  private ting(t: number, vol: number) {
    const ctx = this.ctx!;
    const o = ctx.createOscillator();
    o.type = 'sine';
    o.frequency.value = 1180;
    const g = ctx.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
    o.connect(g).connect(this.musicGain);
    o.start(t);
    o.stop(t + 0.14);
  }

  private shaker(t: number, vol: number) {
    this.noise(t, 0.04, vol, 7000, 'highpass', this.musicGain);
  }

  private noise(t: number, dur: number, vol: number, freq: number, type: BiquadFilterType, dest: AudioNode, sweepTo?: number) {
    const ctx = this.ctx!;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuf;
    const f = ctx.createBiquadFilter();
    f.type = type;
    f.frequency.setValueAtTime(freq, t);
    if (sweepTo) f.frequency.exponentialRampToValueAtTime(sweepTo, t + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    src.connect(f).connect(g).connect(dest);
    src.start(t, Math.random() * 0.5);
    src.stop(t + dur + 0.02);
  }

  private tone(t: number, freq: number, dur: number, vol: number, type: OscillatorType = 'sine', slideTo?: number) {
    const ctx = this.ctx!;
    const o = ctx.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g).connect(this.sfxGain);
    o.start(t);
    o.stop(t + dur + 0.02);
  }

  private arp(t: number, notes: number[], gap: number, dur: number, vol: number, type: OscillatorType = 'triangle') {
    notes.forEach((m, i) => this.tone(t + i * gap, midi(m), dur, vol, type));
  }

  // ---- public sfx -------------------------------------------------------
  private foodPitch = 0;
  sfx(name: Sfx, opt = 0) {
    const ctx = this.ctx;
    if (!ctx || ctx.state !== 'running') return;
    const t = ctx.currentTime + 0.005;
    switch (name) {
      case 'start': this.arp(t, [62, 66, 69, 74, 78], 0.07, 0.25, 0.25); break;
      case 'click': this.tone(t, 880, 0.06, 0.18, 'triangle', 1320); break;
      case 'jump': this.tone(t, 380, 0.18, 0.22, 'triangle', 760); this.noise(t, 0.12, 0.08, 1800, 'bandpass', this.sfxGain, 3600); break;
      case 'superjump': this.tone(t, 300, 0.35, 0.25, 'triangle', 1200); this.arp(t + 0.05, [74, 78, 81], 0.05, 0.15, 0.12); break;
      case 'land': this.tone(t, 140, 0.12, 0.25, 'sine', 70); this.noise(t, 0.08, 0.12, 900, 'lowpass', this.sfxGain); break;
      case 'slide': this.noise(t, 0.35, 0.18, 2400, 'bandpass', this.sfxGain, 600); break;
      case 'lane': this.noise(t, 0.12, 0.12, 1200, 'bandpass', this.sfxGain, 3000); break;
      case 'step': this.noise(t, 0.035, 0.06 + Math.random() * 0.03, 500 + Math.random() * 300, 'lowpass', this.sfxGain); break;
      case 'food': {
        // pentatonic climb while streaking
        const scale = [74, 76, 78, 81, 83, 86, 88, 90, 93];
        const m = scale[Math.min(scale.length - 1, opt)];
        this.foodPitch = m;
        this.tone(t, midi(m), 0.16, 0.2, 'triangle');
        this.tone(t + 0.04, midi(m + 12), 0.12, 0.08, 'sine');
        break;
      }
      case 'hygiene': this.arp(t, [81, 86, 90], 0.06, 0.25, 0.2, 'sine'); this.tone(t, midi(93), 0.4, 0.05, 'sine'); break;
      case 'powerup': this.arp(t, [62, 69, 74, 78, 81, 86], 0.055, 0.22, 0.2); break;
      case 'magnet': this.tone(t, 220, 0.4, 0.15, 'sawtooth', 440); this.tone(t, 330, 0.4, 0.08, 'sine', 660); break;
      case 'shield': this.arp(t, [74, 81, 86, 93], 0.04, 0.5, 0.12, 'sine'); break;
      case 'shieldBreak': this.noise(t, 0.3, 0.2, 4000, 'highpass', this.sfxGain); this.arp(t, [86, 81, 74], 0.05, 0.2, 0.12, 'sine'); break;
      case 'energy': this.noise(t, 0.8, 0.15, 400, 'bandpass', this.sfxGain, 4000); this.tone(t, 200, 0.8, 0.12, 'sawtooth', 800); break;
      case 'hit': this.tone(t, 220, 0.25, 0.3, 'square', 110); this.tone(t + 0.08, 180, 0.3, 0.18, 'triangle', 120); this.noise(t, 0.15, 0.18, 700, 'lowpass', this.sfxGain); break;
      case 'combo': this.arp(t, [74, 78, 81, 86, 90], 0.07, 0.3, 0.2); this.arp(t + 0.35, [86, 90, 93], 0.0, 0.5, 0.12, 'sine'); break;
      case 'discovery': this.arp(t, [81, 86, 88, 93], 0.09, 0.45, 0.14, 'sine'); break;
      case 'achievement': this.arp(t, [74, 78, 81, 86], 0.1, 0.4, 0.18); this.arp(t + 0.45, [86, 90, 93, 98], 0.0, 0.8, 0.1, 'sine'); break;
      case 'gameover': this.arp(t, [74, 71, 69, 66, 62], 0.14, 0.4, 0.18); break;
    }
  }
}

export const audio = new AudioManager();
