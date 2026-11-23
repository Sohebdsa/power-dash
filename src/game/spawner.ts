// Procedural pattern generator. Guarantees a reachable safe lane in every row,
// spaces rows by reaction time + jump airtime, and ramps difficulty with distance.

import { FOODS, POWERUPS, type PowerUpId } from '../data/items';
import type { ZoneId } from './world/scenery';

export type Shape = 'low' | 'high' | 'block';

export interface ObstacleDef {
  id: string;
  shape: Shape;
  len: number; // depth along z
  hazard?: string; // hazard message id
  zones?: ZoneId[];
  y0: number;
  y1: number;
}

export const OBSTACLES: ObstacleDef[] = [
  { id: 'ob_charpai', shape: 'low', len: 1.1, y0: 0, y1: 0.8, zones: ['city', 'garden', 'boulevard'] },
  { id: 'ob_burger', shape: 'low', len: 1.5, y0: 0, y1: 0.95, hazard: 'burger' },
  { id: 'ob_basket', shape: 'low', len: 1.3, y0: 0, y1: 0.9, hazard: 'unwashed_cloth' },
  { id: 'ob_bin', shape: 'low', len: 1.2, y0: 0, y1: 0.95, hazard: 'bad_disposal' },
  { id: 'ob_planter', shape: 'low', len: 0.9, y0: 0, y1: 0.85, zones: ['garden', 'boulevard', 'valley'] },
  { id: 'ob_clothesline', shape: 'high', len: 0.4, y0: 1.05, y1: 2.5, hazard: 'damp_cloth' },
  { id: 'ob_banner', shape: 'high', len: 0.3, y0: 1.1, y1: 2.5, zones: ['city', 'boulevard'] },
  { id: 'ob_candy', shape: 'high', len: 0.45, y0: 1.1, y1: 2.5, hazard: 'candy' },
  { id: 'ob_branch', shape: 'high', len: 0.5, y0: 1.15, y1: 2.4, zones: ['garden', 'valley'] },
  { id: 'ob_stall', shape: 'block', len: 1.6, y0: 0, y1: 2.8, hazard: 'fries' },
  { id: 'ob_auto', shape: 'block', len: 2.6, y0: 0, y1: 2.1, zones: ['city'] },
  { id: 'ob_thela', shape: 'block', len: 2.2, y0: 0, y1: 2.4, hazard: 'soda' },
  { id: 'ob_board', shape: 'block', len: 0.6, y0: 0, y1: 2.2, zones: ['boulevard'] },
  { id: 'ob_rock', shape: 'block', len: 1.8, y0: 0, y1: 2.0, zones: ['valley', 'garden'] },
  { id: 'ob_hedge', shape: 'block', len: 1.4, y0: 0, y1: 2.0, zones: ['garden'] },
];

const SMALL_HYGIENE = ['unwashed_cloth', 'damp_cloth', 'stored_used', 'unclean_product', 'bad_disposal'];
const SMALL_JUNK = ['burger', 'pizza', 'fries', 'donut', 'soda', 'candy'];
const HYGIENE_WEIGHTS: [string, number][] = [['pad', 30], ['cloth', 18], ['cup', 15], ['tampon', 12], ['water', 15], ['kit', 10]];

export const JUMP_V = 9.8;
export const GRAVITY = 27;
export const AIRTIME = (2 * JUMP_V) / GRAVITY;

export type SpawnRequest =
  | { kind: 'obstacle'; def: ObstacleDef; lane: number; dist: number }
  | { kind: 'hazard'; id: string; lane: number; dist: number }
  | { kind: 'collect'; id: string; lane: number; dist: number; y: number }
  | { kind: 'powerup'; id: PowerUpId; lane: number; dist: number };

function pick<T>(arr: T[]) { return arr[Math.floor(Math.random() * arr.length)]; }
function weighted(list: [string, number][]) {
  const total = list.reduce((s, [, w]) => s + w, 0);
  let r = Math.random() * total;
  for (const [id, w] of list) { r -= w; if (r <= 0) return id; }
  return list[0][0];
}

export class Spawner {
  private nextRow = 60;
  private safe = 1;
  private nextPower = 220;
  private rowCount = 0;
  private lastPower: PowerUpId | null = null;
  private hygieneCountdown = 2;

  reset(startDist: number) {
    this.nextRow = startDist + 55;
    this.safe = 1;
    this.nextPower = startDist + 200;
    this.rowCount = 0;
    this.hygieneCountdown = 1;
    this.lastPower = null;
  }

  /** Emit spawn requests for rows within `ahead` metres of the player. */
  update(playerDist: number, speed: number, zone: ZoneId, ahead: number, out: SpawnRequest[]) {
    // warm-up food line at the very start
    while (this.nextRow < playerDist + ahead) {
      this.generateRow(this.nextRow, playerDist, speed, zone, out);
    }
  }

  private generateRow(dist: number, playerDist: number, speed: number, zone: ZoneId, out: SpawnRequest[]) {
    const diff = Math.min(1, dist / 2600);
    const gap = Math.max(speed * (AIRTIME + 0.42), 32 - diff * 14);
    this.rowCount++;

    // move safe lane by at most one lane
    const prevSafe = this.safe;
    const r = Math.random();
    if (r < 0.3) this.safe = Math.max(0, this.safe - 1);
    else if (r < 0.6) this.safe = Math.min(2, this.safe + 1);
    const safe = this.safe;

    const allowed = OBSTACLES.filter((o) => !o.zones || o.zones.includes(zone));
    const byShape = (s: Shape) => allowed.filter((o) => o.shape === s);
    const shapeWeights: [Shape, number][] = [
      ['low', 1], ['high', dist > 150 ? 0.9 : 0], ['block', dist > 80 ? 1.0 + diff * 0.4 : 0.3],
    ];
    const pickShape = (): Shape => {
      const total = shapeWeights.reduce((s, [, w]) => s + w, 0);
      let x = Math.random() * total;
      for (const [s, w] of shapeWeights) { x -= w; if (x <= 0) return s; }
      return 'low';
    };

    const pattern = this.choosePattern(diff, dist);
    const lanesUsed = new Set<number>();
    let rowLowLane = -1;

    if (pattern === 'wall') {
      const s: Shape = Math.random() < 0.5 || dist < 150 ? 'low' : 'high';
      const def = pick(byShape(s));
      for (let lane = 0; lane < 3; lane++) out.push({ kind: 'obstacle', def, lane, dist });
      // reward: food in the air over the wall for jumpers / under for sliders
      if (s === 'low') this.foodArc(dist, safe, speed, out);
    } else if (pattern === 'single' || pattern === 'double') {
      const others = [0, 1, 2].filter((l) => l !== safe);
      // Keep the lane between previous and new safe lane passable when switching two lanes.
      const count = pattern === 'double' ? 2 : 1;
      const shuffled = others.sort(() => Math.random() - 0.5).slice(0, count);
      for (const lane of shuffled) {
        let shape = pickShape();
        // don't fully block the lane the player is likely coming from
        if (lane === prevSafe && shape === 'block' && pattern === 'double') shape = 'low';
        const list = byShape(shape);
        if (!list.length) continue;
        const def = pick(list);
        out.push({ kind: 'obstacle', def, lane, dist });
        lanesUsed.add(lane);
        if (shape === 'low' && rowLowLane < 0) rowLowLane = lane;
      }
      if (rowLowLane >= 0 && Math.random() < 0.5) this.foodArc(dist, rowLowLane, speed, out);
    } else if (pattern === 'hazards') {
      const others = [0, 1, 2].filter((l) => l !== safe);
      const n = diff > 0.3 && Math.random() < 0.6 ? 2 : 1;
      for (const lane of others.sort(() => Math.random() - 0.5).slice(0, n)) {
        const isHygiene = Math.random() < 0.6;
        out.push({ kind: 'hazard', id: pick(isHygiene ? SMALL_HYGIENE : SMALL_JUNK), lane, dist });
      }
    }

    // healthy food line along the safe lane between rows
    if (Math.random() < 0.85) {
      const rainbow = Math.random() < 0.25;
      const type = pick(FOODS).id;
      const n = 5 + Math.floor(Math.random() * 4);
      const start = dist + 4;
      for (let i = 0; i < n; i++) {
        const d = start + i * 2.2;
        if (d > dist + gap * 0.52) break;
        out.push({ kind: 'collect', id: rainbow ? FOODS[(i * 3 + this.rowCount) % FOODS.length].id : type, lane: safe, dist: d, y: 0.75 });
      }
    }

    // menstrual hygiene products
    this.hygieneCountdown--;
    if (this.hygieneCountdown <= 0) {
      this.hygieneCountdown = 2 + Math.floor(Math.random() * 2);
      const id = weighted(HYGIENE_WEIGHTS);
      const lane = Math.random() < 0.6 ? safe : pick([0, 1, 2].filter((l) => !lanesUsed.has(l)));
      const d = dist + gap * 0.62;
      const trio = Math.random() < 0.35 && id !== 'kit';
      for (let i = 0; i < (trio ? 3 : 1); i++) {
        out.push({ kind: 'collect', id, lane, dist: d + i * 2.4, y: 0.85 });
      }
    }

    // power-ups
    if (dist >= this.nextPower) {
      this.nextPower = dist + 260 + Math.random() * 160;
      const choices = POWERUPS.filter((p) => p.id !== this.lastPower);
      const p = pick(choices).id;
      this.lastPower = p;
      const free = [0, 1, 2].filter((l) => !lanesUsed.has(l) && l !== safe);
      if (free.length) out.push({ kind: 'powerup', id: p, lane: pick(free), dist: dist + gap * 0.4 });
      else out.push({ kind: 'powerup', id: p, lane: safe, dist: dist + gap * 0.88 });
    }

    this.nextRow = dist + gap;
    void playerDist;
  }

  private choosePattern(diff: number, dist: number): 'single' | 'double' | 'wall' | 'hazards' | 'breather' {
    if (dist < 110) return Math.random() < 0.5 ? 'single' : 'breather';
    const w: [string, number][] = [
      ['single', 1.3 - diff * 0.5],
      ['double', 0.4 + diff * 1.3],
      ['wall', dist > 260 ? 0.15 + diff * 0.25 : 0],
      ['hazards', 0.7],
      ['breather', 0.35 - diff * 0.2],
    ];
    return weighted(w) as 'single' | 'double' | 'wall' | 'hazards' | 'breather';
  }

  private foodArc(dist: number, lane: number, speed: number, out: SpawnRequest[]) {
    // follows the jump parabola so a well-timed jump collects every item
    const type = pick(FOODS).id;
    const jumpLen = speed * AIRTIME;
    for (let k = 0; k < 5; k++) {
      const u = (k + 0.5) / 5;
      const t = u * AIRTIME;
      const y = 0.75 + JUMP_V * t - 0.5 * GRAVITY * t * t;
      out.push({ kind: 'collect', id: type, lane, dist: dist - jumpLen / 2 + u * jumpLen, y });
    }
  }

}
