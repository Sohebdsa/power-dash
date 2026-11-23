import { create } from 'zustand';
import { load, save, type Progress, type Settings } from '../systems/persistence';
import { ACHIEVEMENTS } from '../data/achievements';
import type { PowerUpId } from '../data/items';

export type Screen =
  | 'loading' | 'menu' | 'characters' | 'howto' | 'learning' | 'encyclopedia' | 'achievements' | 'settings'
  | 'playing' | 'paused' | 'gameover';

export interface ActivePower {
  id: PowerUpId;
  remaining: number; // seconds, -1 = until used
  duration: number;
}

export interface RunStats {
  score: number;
  distance: number;
  lives: number;
  maxLives: number;
  food: number;
  hygiene: number;
  multiplier: number;
  hygieneHazardsHit: number;
  newFacts: string[]; // collectible ids discovered for the first time this run
  seenFacts: string[]; // collectible ids collected this run
  achievementsUnlocked: string[];
  hazardLessons: string[];
}

const emptyRun = (): RunStats => ({
  score: 0, distance: 0, lives: 3, maxLives: 3, food: 0, hygiene: 0, multiplier: 1,
  hygieneHazardsHit: 0, newFacts: [], seenFacts: [], achievementsUnlocked: [], hazardLessons: [],
});

interface State {
  screen: Screen;
  settingsReturn: Screen;
  settings: Settings;
  progress: Progress;
  run: RunStats;
  powers: ActivePower[];
  zoneName: string;
  thumbs: Record<string, string>;
  setScreen: (s: Screen) => void;
  openSettings: (from: Screen) => void;
  updateSettings: (p: Partial<Settings>) => void;
  setRun: (p: Partial<RunStats>) => void;
  resetRun: () => void;
  setPowers: (p: ActivePower[]) => void;
  setZone: (z: string) => void;
  setThumbs: (t: Record<string, string>) => void;
  mutateProgress: (fn: (p: Progress) => void) => void;
  checkAchievements: () => string[];
}

const initial = load();

export const useGame = create<State>((set, get) => ({
  screen: 'loading',
  settingsReturn: 'menu',
  settings: initial.settings,
  progress: initial.progress,
  run: emptyRun(),
  powers: [],
  zoneName: 'Sunrise City',
  thumbs: {},
  setScreen: (screen) => set({ screen }),
  openSettings: (from) => set({ screen: 'settings', settingsReturn: from }),
  updateSettings: (p) => {
    const settings = { ...get().settings, ...p };
    set({ settings });
    save({ settings, progress: get().progress });
  },
  setRun: (p) => set({ run: { ...get().run, ...p } }),
  resetRun: () => set({ run: emptyRun(), powers: [] }),
  setPowers: (powers) => set({ powers }),
  setZone: (zoneName) => set({ zoneName }),
  setThumbs: (thumbs) => set({ thumbs }),
  mutateProgress: (fn) => {
    const progress = structuredClone(get().progress);
    fn(progress);
    set({ progress });
    save({ settings: get().settings, progress });
  },
  checkAchievements: () => {
    const { progress } = get();
    const fresh = ACHIEVEMENTS.filter(
      (a) => !progress.achievements.includes(a.id) && a.progress(progress) >= 1,
    ).map((a) => a.id);
    if (fresh.length) {
      get().mutateProgress((p) => { p.achievements.push(...fresh); });
    }
    return fresh;
  },
}));
