import type { Progress } from '../systems/persistence';

export interface AchievementDef {
  id: string;
  name: string;
  description: string;
  /** Returns 0..1 progress from persisted data. */
  progress: (p: Progress) => number;
}

const ratio = (v: number, max: number) => Math.min(1, v / max);

export const ACHIEVEMENTS: AchievementDef[] = [
  { id: 'firstSteps', name: 'First Steps', description: 'Complete your first run.',
    progress: (p) => ratio(p.runs, 1) },
  { id: 'healthyCollector', name: 'Healthy Collector', description: 'Collect 100 healthy food items.',
    progress: (p) => ratio(p.totalFood, 100) },
  { id: 'periodPrepared', name: 'Period Prepared', description: 'Collect 25 menstrual hygiene items.',
    progress: (p) => ratio(p.totalHygiene, 25) },
  { id: 'knowledgeExplorer', name: 'Knowledge Explorer', description: 'Unlock 10 educational facts.',
    progress: (p) => ratio(p.discovered.length, 10) },
  { id: 'hygieneChampion', name: 'Hygiene Champion', description: 'Run 500 m without hitting a hygiene hazard.',
    progress: (p) => (p.flags.hygieneChampion ? 1 : 0) },
  { id: 'healthyStreak', name: 'Healthy Streak', description: 'Collect five different healthy foods in a row.',
    progress: (p) => (p.flags.healthyStreak ? 1 : 0) },
  { id: 'powerRunner', name: 'Power Runner', description: 'Reach 1,500 m in a single run.',
    progress: (p) => ratio(p.bestDistance, 1500) },
  { id: 'balanced', name: 'Balanced Body', description: 'Earn a Balanced Health Bonus.',
    progress: (p) => (p.flags.balanced ? 1 : 0) },
  { id: 'powerPro', name: 'Power Pro', description: 'Use 5 different power-ups.',
    progress: (p) => ratio(p.powerupsUsed.length, 5) },
  { id: 'mythBuster', name: 'Myth Buster', description: 'Read every card in Myths & Facts.',
    progress: (p) => ratio(p.mythsRead.length, 7) },
  { id: 'worldTraveller', name: 'World Traveller', description: 'Reach Rainbow Valley.',
    progress: (p) => (p.flags.rainbowValley ? 1 : 0) },
  { id: 'marathon', name: 'Marathon Heart', description: 'Run 10,000 m in total.',
    progress: (p) => ratio(p.totalDistance, 10000) },
];
