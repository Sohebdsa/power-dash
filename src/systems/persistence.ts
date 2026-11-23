// Local-only persistence. No accounts, no personal data — just game progress.

export interface Settings {
  musicVolume: number; // 0..1
  sfxVolume: number; // 0..1
  muted: boolean;
  quality: 'auto' | 'high' | 'low';
  reduceMotion: boolean;
  character: 'devi' | 'meher' | 'nazia' | 'anjali';
}

export interface Progress {
  bestScore: number;
  bestDistance: number;
  totalScore: number;
  totalDistance: number;
  runs: number;
  totalFood: number;
  totalHygiene: number;
  discovered: string[]; // collectible ids discovered
  achievements: string[]; // unlocked achievement ids
  powerupsUsed: string[];
  mythsRead: string[];
  topicsRead: string[];
  flags: Record<string, boolean>;
}

const KEY = 'powerdash.v1';

export const DEFAULT_SETTINGS: Settings = {
  musicVolume: 0.55,
  sfxVolume: 0.8,
  muted: false,
  quality: 'auto',
  reduceMotion: false,
  character: 'devi',
};

export const DEFAULT_PROGRESS: Progress = {
  bestScore: 0,
  bestDistance: 0,
  totalScore: 0,
  totalDistance: 0,
  runs: 0,
  totalFood: 0,
  totalHygiene: 0,
  discovered: [],
  achievements: [],
  powerupsUsed: [],
  mythsRead: [],
  topicsRead: [],
  flags: {},
};

interface SaveFile {
  settings: Settings;
  progress: Progress;
}

export function load(): SaveFile {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const data = JSON.parse(raw) as Partial<SaveFile>;
      return {
        settings: { ...DEFAULT_SETTINGS, ...(data.settings ?? {}) },
        progress: { ...DEFAULT_PROGRESS, ...(data.progress ?? {}), flags: { ...(data.progress?.flags ?? {}) } },
      };
    }
  } catch {
    /* storage unavailable — play without saving */
  }
  return { settings: { ...DEFAULT_SETTINGS }, progress: structuredClone(DEFAULT_PROGRESS) };
}

export function save(file: SaveFile) {
  try {
    localStorage.setItem(KEY, JSON.stringify(file));
  } catch {
    /* ignore */
  }
}
