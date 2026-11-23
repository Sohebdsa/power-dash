// Devi (and her classmates) rebuilt in 3D from the "Aangan" character sheets.
// Devi: eleven, twin plaits with red ribbons, haldi kurta with red sprig print,
// indigo pants, red sandals, a dark bangle and a red thread on her wrists.
// The rig is a joint hierarchy animated procedurally with blended poses.

import * as THREE from 'three';
import { C, G, toon, flat, kurtaTexture, lathe, torusArc, mergeStatic } from '../materials';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

export type HairStyle = 'plaits' | 'bob' | 'long' | 'bun';
export interface KidStyle {
  outfit: 'kurta' | 'uniform';
  hair: HairStyle;
  skin: string;
  glasses?: boolean;
  headband?: string;
  clip?: string;
  backpack?: boolean;
}

export const DEVI_STYLE: KidStyle = { outfit: 'kurta', hair: 'plaits', skin: C.skin, backpack: true };
export const MEHER_STYLE: KidStyle = { outfit: 'uniform', hair: 'bob', skin: '#CF9567', glasses: true, clip: '#E58BA0' };
export const NAZIA_STYLE: KidStyle = { outfit: 'uniform', hair: 'long', skin: '#D39A6C', headband: C.teal };
export const ANJALI_STYLE: KidStyle = { outfit: 'uniform', hair: 'bun', skin: '#8E5A3B' };

export type CharacterId = 'devi' | 'meher' | 'nazia' | 'anjali';

export interface CharacterDef { id: CharacterId; name: string; tagline: string; about: string; style: KidStyle }

/** Playable cast from the Aangan storyboard. */
export const CHARACTERS: CharacterDef[] = [
  { id: 'devi', name: 'Devi', tagline: 'Curious, expressive, eleven',
    about: 'Quick to notice a change and quicker to ask about it. Twin plaits, red ribbons and a bright haldi kurta.', style: DEVI_STYLE },
  { id: 'meher', name: 'Meher', tagline: 'Thoughtful and bright',
    about: 'Round glasses, a neat bob and a pink clip. Meher likes to read up on everything first.', style: MEHER_STYLE },
  { id: 'nazia', name: 'Nazia', tagline: 'Calm and kind',
    about: 'Long hair held back with a teal headband. Nazia is the friend who always listens.', style: NAZIA_STYLE },
  { id: 'anjali', name: 'Anjali', tagline: 'Big laugh, big energy',
    about: 'A curly bun tied with a yellow band. Anjali makes the school courtyard feel like home.', style: ANJALI_STYLE },
];
export const CHARACTER_BY_ID = Object.fromEntries(CHARACTERS.map((c) => [c.id, c])) as Record<CharacterId, CharacterDef>;

export type AnimMode = 'idle' | 'run' | 'jump' | 'slide' | 'sit' | 'wave' | 'cheer';
export type Expression = 'smile' | 'glad' | 'oops' | 'curious' | 'puzzled';

export interface AnimInput {
  mode: AnimMode;
  /** 0..1 how fast the run cycle goes */
  speed: number;
  /** vertical velocity, for jump poses */
  vy: number;
  /** lateral velocity in lanes/sec, for banking */
  laneVel: number;
}

const KEYS = [
  'bodyY', 'bodyRX', 'hipLX', 'hipRX', 'hipLZ', 'hipRZ', 'kneeL', 'kneeR',
  'shLX', 'shLZ', 'shRX', 'shRZ', 'elL', 'elR', 'torsoX', 'torsoY', 'torsoZ',
  'headX', 'headY', 'headZ',
] as const;
type Key = (typeof KEYS)[number];
type Pose = Record<Key, number>;
const zeroPose = (): Pose => Object.fromEntries(KEYS.map((k) => [k, 0])) as Pose;

const MODES: AnimMode[] = ['idle', 'run', 'jump', 'slide', 'sit', 'wave', 'cheer'];

const HIP_H = 0.68;

function mesh(geo: THREE.BufferGeometry, mat: THREE.Material, x = 0, y = 0, z = 0, sx = 1, sy = sx, sz = sx) {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z);
  m.scale.set(sx, sy, sz);
  m.castShadow = true;
  return m;
}

function joint(parent: THREE.Object3D, x = 0, y = 0, z = 0) {
  const g = new THREE.Group();
  g.position.set(x, y, z);
  parent.add(g);
  return g;
}

/** Torus arc oriented as an arch (∩) or cup (∪), centred on its apex. */
function arc(radius: number, tube: number, arcLen: number, mat: THREE.Material, cup: boolean) {
  const geo = torusArc(radius, tube, arcLen);
  const m = new THREE.Mesh(geo, mat);
  const start = cup ? -Math.PI / 2 - arcLen / 2 : Math.PI / 2 - arcLen / 2;
  m.rotation.z = start;
  const holder = new THREE.Group();
  m.position.y = cup ? radius : -radius;
  holder.add(m);
  return holder;
}

interface Plait {
  segs: THREE.Group[];
  ax: number; vx: number; az: number; vz: number;
  side: number;
}

export class Kid {
  root = new THREE.Group();
  body: THREE.Group;
  torso: THREE.Group;
  head: THREE.Group;
  legL: THREE.Group; legR: THREE.Group; kneeL: THREE.Group; kneeR: THREE.Group;
  shL: THREE.Group; shR: THREE.Group; elL: THREE.Group; elR: THREE.Group;
  private eyesOpen: THREE.Group;
  private eyesClosed: THREE.Group;
  private mouthSmile: THREE.Object3D;
  private mouthOpen: THREE.Object3D;
  private browL: THREE.Group;
  private browR: THREE.Group;
  private plaits: Plait[] = [];
  private weights: Record<AnimMode, number> = { idle: 1, run: 0, jump: 0, slide: 0, sit: 0, wave: 0, cheer: 0 };
  private pose = zeroPose();
  private tmp = zeroPose();
  private t = Math.random() * 10;
  private runPhase = 0;
  private blinkT = 2;
  private exprT = 0;
  private expr: Expression = 'smile';
  private baseExpr: Expression = 'smile';
  private flinchT = 0;
  private twirlT = 0;
  private popT = 0;
  private squash = 0;
  private squashV = 0;
  private lastFootSign = 0;
  onFootstep: (() => void) | null = null;
  readonly style: KidStyle;

  constructor(style: KidStyle = DEVI_STYLE) {
    this.style = style;
    const skin = toon(style.skin);
    const skinShade = toon(shade(style.skin, 0.86));
    const hairMat = toon(C.hair);
    const isKurta = style.outfit === 'kurta';
    const topMat = isKurta ? toon('#FFFFFF', { map: kurtaTexture(), key: 'kurta' }) : toon('#2B3F6E');
    const sleeveMat = isKurta ? topMat : toon('#A9CBEE');
    const pantsMat = isKurta ? toon(C.indigo) : skin;
    const shoeMat = isKurta ? toon(C.sindoor) : toon('#1F1A1A');

    this.body = joint(this.root, 0, HIP_H, 0);
    const pelvis = joint(this.body);

    // ---- legs
    const makeLeg = (side: number) => {
      const leg = joint(pelvis, side * 0.085, 0, 0);
      leg.add(mesh(G.cyl, pantsMat, 0, -0.17, 0, 0.068, 0.36, 0.068));
      const knee = joint(leg, 0, -0.34, 0);
      knee.add(mesh(G.sphereLo, pantsMat, 0, 0, 0, 0.062));
      if (isKurta) {
        knee.add(mesh(G.cyl, pantsMat, 0, -0.15, 0, 0.06, 0.3, 0.06));
        knee.add(mesh(G.cyl, toon(shade(C.indigo, 0.8)), 0, -0.29, 0, 0.064, 0.03, 0.064)); // cuff
        knee.add(mesh(G.cylLo, skin, 0, -0.315, 0, 0.035, 0.03, 0.035));
      } else {
        knee.add(mesh(G.cyl, skin, 0, -0.08, 0, 0.045, 0.16, 0.045));
        knee.add(mesh(G.cyl, toon(C.white), 0, -0.23, 0, 0.05, 0.16, 0.05)); // socks
      }
      const foot = new RoundedBoxGeometry(0.1, 0.05, 0.19, 2, 0.02);
      knee.add(mesh(foot, shoeMat, 0, -0.33, 0.035));
      if (isKurta) knee.add(mesh(G.box, toon('#8E2E1E'), 0, -0.3, 0.06, 0.1, 0.012, 0.03)); // sandal strap
      return { leg, knee };
    };
    const L = makeLeg(1), R = makeLeg(-1);
    this.legL = L.leg; this.kneeL = L.knee; this.legR = R.leg; this.kneeR = R.knee;

    // ---- torso
    this.torso = joint(pelvis);
    if (isKurta) {
      const kurta = lathe([[0, -0.22], [0.27, -0.21], [0.25, -0.1], [0.215, 0.06], [0.2, 0.22], [0.19, 0.32], [0.15, 0.4], [0.06, 0.44], [0, 0.44]], 22);
      const k = mesh(kurta, topMat, 0, 0, 0, 1, 1, 0.82);
      this.torso.add(k);
      // hem band and placket in sindoor
      this.torso.add(mesh(G.cyl, toon(C.sindoor), 0, -0.205, 0, 0.272, 0.022, 0.272 * 0.82));
      this.torso.add(mesh(G.box, toon(C.sindoor), 0, 0.33, 0.158, 0.014, 0.12, 0.01));
      this.torso.add(mesh(G.torus, toon(C.sindoor), 0, 0.425, 0, 0.075, 0.075, 0.12).rotateX(Math.PI / 2));
    } else {
      // light blue shirt + navy pinafore
      const shirt = lathe([[0, 0.05], [0.2, 0.06], [0.2, 0.3], [0.15, 0.4], [0.06, 0.44], [0, 0.44]], 18);
      this.torso.add(mesh(shirt, toon('#A9CBEE'), 0, 0, 0, 1, 1, 0.82));
      const pin = lathe([[0, -0.2], [0.27, -0.2], [0.21, 0.08], [0.205, 0.2], [0, 0.2]], 18);
      this.torso.add(mesh(pin, topMat, 0, 0, 0, 1, 1, 0.84));
      this.torso.add(mesh(G.box, topMat, 0, 0.28, 0.12, 0.2, 0.18, 0.06)); // bib
      this.torso.add(mesh(G.box, toon(C.sindoor), 0, 0.33, 0.165, 0.11, 0.008, 0.008).rotateZ(0.7)); // lanyard
      this.torso.add(mesh(G.box, toon(C.white), 0, 0.22, 0.158, 0.06, 0.07, 0.01)); // ID card
    }
    // neck
    this.torso.add(mesh(G.cyl, skin, 0, 0.47, 0, 0.055, 0.08, 0.055));

    // ---- arms
    const makeArm = (side: number) => {
      const sh = joint(this.torso, side * 0.205, 0.36, 0);
      sh.add(mesh(G.sphereLo, sleeveMat, 0, -0.02, 0, 0.068));
      sh.add(mesh(G.cyl, sleeveMat, 0, -0.07, 0, 0.066, 0.11, 0.066));
      sh.add(mesh(G.cyl, skin, 0, -0.14, 0, 0.042, 0.16, 0.042));
      const el = joint(sh, 0, -0.22, 0);
      el.add(mesh(G.sphereLo, skin, 0, 0, 0, 0.041));
      el.add(mesh(G.cyl, skin, 0, -0.1, 0, 0.038, 0.2, 0.038));
      el.add(mesh(G.sphere, skin, 0, -0.22, 0.005, 0.048, 0.055, 0.04));
      if (isKurta) {
        const bangle = new THREE.TorusGeometry(0.044, 0.009, 6, 16);
        el.add(mesh(bangle, side > 0 ? toon(C.black) : toon(C.sindoor), 0, -0.17, 0).rotateX(Math.PI / 2));
      }
      return { sh, el };
    };
    const AL = makeArm(1), AR = makeArm(-1);
    this.shL = AL.sh; this.elL = AL.el; this.shR = AR.sh; this.elR = AR.el;

    // ---- backpack (Devi's period-kit backpack, deep teal block print)
    if (style.backpack) {
      const pack = new RoundedBoxGeometry(0.3, 0.32, 0.14, 3, 0.05);
      this.torso.add(mesh(pack, toon(C.teal), 0, 0.2, -0.22));
      this.torso.add(mesh(new RoundedBoxGeometry(0.31, 0.12, 0.15, 2, 0.04), toon(C.haldi), 0, 0.31, -0.225)); // flap
      this.torso.add(mesh(new RoundedBoxGeometry(0.17, 0.1, 0.04, 2, 0.02), toon(C.rose), 0, 0.12, -0.3)); // pocket
      this.torso.add(mesh(G.sphereLo, toon(C.sindoor), 0, 0.27, -0.3, 0.018));
      for (const s of [1, -1]) {
        this.torso.add(mesh(G.box, toon(shade(C.teal, 0.85)), s * 0.11, 0.27, 0.152, 0.024, 0.2, 0.01));
      }
    }

    // ---- head
    const neck = joint(this.torso, 0, 0.44, 0);
    this.head = joint(neck, 0, 0, 0);
    const H = 0.235; // head radius
    const headC = joint(this.head, 0, 0.23, 0);
    headC.add(mesh(G.sphere, skin, 0, 0, 0, H, H * 0.98, H * 0.95));
    for (const s of [1, -1]) headC.add(mesh(G.sphereLo, skinShade, s * 0.228, -0.02, 0, 0.045, 0.055, 0.03));

    this.buildHair(headC, H, hairMat, style);

    // face
    const eyeMat = flat('#1C1210');
    const white = flat('#FFFFFF');
    this.eyesOpen = joint(headC);
    this.eyesClosed = joint(headC);
    for (const s of [1, -1]) {
      const e = joint(this.eyesOpen, s * 0.083, -0.005, 0.208);
      e.add(mesh(G.sphere, eyeMat, 0, 0, 0, 0.04, 0.05, 0.02));
      e.add(mesh(G.sphereLo, white, 0.011, 0.016, 0.016, 0.011));
      e.add(mesh(G.sphereLo, white, -0.012, -0.014, 0.017, 0.005));
      const closed = arc(0.032, 0.0065, 2.4, eyeMat, false);
      closed.position.set(s * 0.083, 0.012, 0.214);
      this.eyesClosed.add(closed);
    }
    this.eyesClosed.visible = false;
    const browMat = toon(C.hair);
    this.browL = arc(0.05, 0.0075, 1.15, browMat, false);
    this.browL.position.set(0.085, 0.075, 0.206);
    this.browR = arc(0.05, 0.0075, 1.15, browMat, false);
    this.browR.position.set(-0.085, 0.075, 0.206);
    headC.add(this.browL, this.browR);
    headC.add(mesh(G.sphereLo, skinShade, 0, -0.045, 0.228, 0.017, 0.015, 0.014)); // nose
    const lipMat = toon('#8A3326');
    this.mouthSmile = arc(0.046, 0.0085, 1.9, lipMat, true);
    this.mouthSmile.position.set(0, -0.112, 0.208);
    headC.add(this.mouthSmile);
    this.mouthOpen = mesh(G.sphere, toon('#7A2A22'), 0, -0.105, 0.214, 0.028, 0.02, 0.012);
    this.mouthOpen.visible = false;
    this.mouthOpen.userData.keep = true;
    headC.add(this.mouthOpen);
    const blush = flat(C.rose, 0.45, 'blush');
    for (const s of [1, -1]) {
      const b = mesh(G.circle, blush, s * 0.138, -0.06, 0.18, 0.034, 0.024, 1);
      b.rotation.y = s * 0.62;
      b.castShadow = false;
      headC.add(b);
    }
    if (style.glasses) {
      const gm = toon(C.terracotta);
      for (const s of [1, -1]) {
        const ring = mesh(new THREE.TorusGeometry(0.05, 0.007, 6, 18), gm, s * 0.083, -0.005, 0.226);
        headC.add(ring);
      }
      headC.add(mesh(G.box, gm, 0, 0.0, 0.232, 0.04, 0.008, 0.008));
    }

    this.root.traverse((o) => { if ((o as THREE.Mesh).isMesh) o.castShadow = true; });
    mergeStatic(this.root);
  }

  private buildHair(headC: THREE.Group, H: number, hairMat: THREE.Material, style: KidStyle) {
    const r = H * 1.07;
    if (style.hair === 'plaits' || style.hair === 'bun') {
      const cap = new THREE.Mesh(new THREE.SphereGeometry(r, 26, 18, 0, Math.PI * 2, 0, 1.75), hairMat);
      cap.rotation.x = -0.66;
      cap.position.set(0, 0.005, -0.012);
      cap.castShadow = true;
      headC.add(cap);
      // hair framing temples
      for (const s of [1, -1]) headC.add(mesh(G.sphere, hairMat, s * 0.2, 0.04, 0.05, 0.06, 0.1, 0.09));
    }
    if (style.hair === 'plaits') {
      for (const side of [1, -1]) {
        const base = joint(headC, side * 0.19, -0.07, -0.13);
        base.rotation.z = side * 0.12;
        const segs: THREE.Group[] = [];
        let parent: THREE.Object3D = base;
        const n = 8;
        for (let i = 0; i < n; i++) {
          const seg = joint(parent, 0, i === 0 ? 0 : -0.058, 0);
          const tuft = i === n - 1;
          const s = tuft ? 0.03 : 0.043 - i * 0.0015;
          seg.add(mesh(G.sphere, hairMat, (i % 2 ? 1 : -1) * 0.009, -0.03, 0, s, s * 1.3, s * 0.95));
          if (i === n - 3) {
            // red ribbon bow
            const rib = toon(C.sindoor);
            for (const s2 of [1, -1]) {
              const loop = mesh(G.cone, rib, s2 * 0.045, -0.03, 0, 0.032, 0.07, 0.016);
              loop.rotation.z = s2 * -Math.PI / 2;
              seg.add(loop);
              const tail = mesh(G.box, rib, s2 * 0.02, -0.075, 0.0, 0.016, 0.06, 0.006);
              tail.rotation.z = s2 * 0.35;
              seg.add(tail);
            }
            seg.add(mesh(G.sphereLo, toon('#A8331F'), 0, -0.03, 0, 0.022));
          }
          segs.push(seg);
          parent = seg;
        }
        this.plaits.push({ segs, ax: 0.3, vx: 0, az: 0, vz: 0, side });
      }
    } else if (style.hair === 'bun') {
      const bun = joint(headC, 0, r * 1.02, -0.02);
      const rnd = [[0, 0.06, 0], [0.04, 0.04, 0.02], [-0.04, 0.045, 0.01], [0.02, 0.09, -0.02], [-0.02, 0.085, 0.03], [0, 0.05, -0.04]];
      for (const [x, y, z] of rnd) bun.add(mesh(G.sphereLo, hairMat, x, y, z, 0.05));
      bun.add(mesh(new THREE.TorusGeometry(0.05, 0.012, 6, 16), toon(C.haldi), 0, 0.01, 0).rotateX(Math.PI / 2));
    } else {
      // bob / long
      const cap = new THREE.Mesh(new THREE.SphereGeometry(r, 26, 18, 0, Math.PI * 2, 0, 2.15), hairMat);
      cap.rotation.x = -0.85;
      cap.castShadow = true;
      headC.add(cap);
      for (const s of [1, -1]) headC.add(mesh(G.sphere, hairMat, s * 0.2, -0.06, 0.02, 0.065, 0.17, 0.12));
      if (style.hair === 'long') {
        headC.add(mesh(G.sphere, hairMat, 0, -0.25, -0.13, 0.22, 0.3, 0.09));
        for (const s of [1, -1]) headC.add(mesh(G.sphere, hairMat, s * 0.2, -0.28, 0.0, 0.06, 0.22, 0.07));
      }
      if (style.headband) {
        const band = new THREE.Mesh(new THREE.TorusGeometry(r * 1.01, 0.014, 6, 24, Math.PI), toon(style.headband));
        // arch over the crown from ear to ear, tilted slightly forward
        band.rotation.set(0.35, 0, 0);
        band.position.set(0, 0.0, 0.0);
        headC.add(band);
      }
      if (style.clip) headC.add(mesh(G.box, toon(style.clip), 0.1, 0.17, 0.17, 0.05, 0.016, 0.016).rotateZ(0.3));
    }
  }

  // ---- events -----------------------------------------------------------
  setBaseExpression(e: Expression) { this.baseExpr = e; if (this.exprT <= 0) this.applyExpr(e); }
  express(e: Expression, seconds = 0.7) { this.exprT = seconds; this.applyExpr(e); }
  land(strength = 1) { this.squashV -= 2.2 * strength; }
  flinch() { this.flinchT = 0.7; this.express('oops', 0.9); }
  twirl() { this.twirlT = 0.6; this.express('glad', 0.9); }
  collect() { this.popT = 0.35; if (this.exprT <= 0.1) this.express('glad', 0.35); }

  private applyExpr(e: Expression) {
    this.expr = e;
    this.eyesOpen.visible = e !== 'glad';
    this.eyesClosed.visible = e === 'glad';
    this.mouthSmile.visible = e === 'smile' || e === 'glad';
    this.mouthOpen.visible = e === 'oops' || e === 'curious' || e === 'puzzled';
    this.mouthOpen.scale.set(e === 'puzzled' ? 0.02 : 0.028, e === 'oops' ? 0.026 : 0.018, 0.012);
    const raise = e === 'curious' || e === 'oops' ? 0.02 : 0;
    this.browL.position.y = 0.075 + raise + (e === 'puzzled' ? 0.018 : 0);
    this.browR.position.y = 0.075 + raise;
    this.browL.rotation.z = e === 'puzzled' ? -0.2 : 0;
    this.browR.rotation.z = e === 'oops' ? -0.15 : 0;
    if (e === 'oops') this.browL.rotation.z = 0.15;
  }

  // ---- poses ------------------------------------------------------------
  private poseIdle(p: Pose) {
    const t = this.t;
    const b = Math.sin(t * 2.1);
    p.bodyY = b * 0.008;
    p.torsoX = 0.02 + b * 0.012;
    p.shLZ = 0.12 + b * 0.02; p.shRZ = -0.12 - b * 0.02;
    p.shLX = 0.05; p.shRX = 0.05;
    p.elL = -0.2; p.elR = -0.2;
    p.headY = Math.sin(t * 0.5) * 0.25 * smoothPulse(t * 0.23);
    p.headZ = Math.sin(t * 0.7) * 0.05;
    p.hipLZ = 0.03; p.hipRZ = -0.03;
    p.torsoZ = Math.sin(t * 0.4) * 0.03;
  }

  private poseRun(p: Pose) {
    const ph = this.runPhase;
    const sL = Math.sin(ph), cL = Math.cos(ph);
    const sR = -sL, cR = -cL;
    const amp = 0.85;
    p.hipLX = -sL * amp; p.hipRX = -sR * amp;
    p.kneeL = 0.2 + 1.25 * Math.max(0, cL) ** 1.2;
    p.kneeR = 0.2 + 1.25 * Math.max(0, cR) ** 1.2;
    p.shLX = sL * 0.95; p.shRX = sR * 0.95;
    p.shLZ = 0.18; p.shRZ = -0.18;
    p.elL = -1.35 + sL * 0.25; p.elR = -1.35 + sR * 0.25;
    p.bodyY = Math.abs(cL) * 0.055 - 0.03;
    p.torsoX = 0.16;
    p.torsoY = sL * 0.16;
    p.headY = -sL * 0.1;
    p.headX = -0.08;
    p.torsoZ = cL * 0.03;
  }

  private poseJump(p: Pose, vy: number) {
    const up = Math.max(0, Math.min(1, vy / 8));
    const down = Math.max(0, Math.min(1, -vy / 8));
    p.hipLX = -1.0 * up - 0.4 * down; p.kneeL = 1.5 * up + 0.5 * down;
    p.hipRX = -0.35 * up + 0.15; p.kneeR = 0.8 * up + 0.3;
    p.shLX = -0.5; p.shLZ = 0.9 + 0.3 * up;
    p.shRX = -0.5; p.shRZ = -0.9 - 0.3 * up;
    p.elL = -0.5; p.elR = -0.5;
    p.torsoX = 0.12 + 0.1 * down;
    p.headX = -0.15 * up;
  }

  private poseSlide(p: Pose) {
    p.bodyY = -0.36;
    p.bodyRX = -1.05;
    p.hipLX = -1.25; p.kneeL = 0.35;
    p.hipRX = -0.7; p.kneeR = 1.3;
    p.shLX = -0.2; p.shLZ = 1.1; p.elL = -0.6;
    p.shRX = 0.9; p.shRZ = -0.3; p.elR = -0.3;
    p.torsoX = 0.15;
    p.headX = 0.6; // keep looking ahead
    p.torsoY = Math.sin(this.t * 30) * 0.02;
  }

  private poseSit(p: Pose) {
    p.bodyY = -0.5;
    p.bodyRX = 0;
    p.hipLX = -1.45; p.hipRX = -1.45; p.hipLZ = 0.15; p.hipRZ = -0.15;
    p.kneeL = 0.5; p.kneeR = 0.9;
    p.torsoX = -0.25;
    p.shLX = 0.5; p.shRX = 0.5; p.shLZ = 0.3; p.shRZ = -0.3; p.elL = -0.2; p.elR = -0.2;
    p.headX = 0.1 + Math.sin(this.t * 1.5) * 0.04;
    p.headZ = Math.sin(this.t * 2) * 0.1;
  }

  private poseWave(p: Pose) {
    this.poseIdle(p);
    p.shRX = -0.4; p.shRZ = -2.5; p.elR = -0.3 + Math.sin(this.t * 8) * 0.45;
    p.headZ = 0.1;
    p.torsoZ = -0.05;
  }

  private poseCheer(p: Pose) {
    const hop = Math.max(0, Math.sin(this.t * 7));
    p.bodyY = hop * 0.12;
    p.shLX = -0.3; p.shLZ = 2.4 + Math.sin(this.t * 7) * 0.2;
    p.shRX = -0.3; p.shRZ = -2.4 - Math.sin(this.t * 7) * 0.2;
    p.elL = -0.3; p.elR = -0.3;
    p.kneeL = p.kneeR = (1 - hop) * 0.3;
    p.hipLX = p.hipRX = -(1 - hop) * 0.15;
    p.headX = -0.1;
  }

  // ---- update -----------------------------------------------------------
  update(dt: number, inp: AnimInput) {
    this.t += dt;
    if (inp.mode === 'run') {
      const cadence = Math.PI * 2 * (1.55 + inp.speed * 0.95);
      this.runPhase += dt * cadence;
      const s = Math.sign(Math.sin(this.runPhase));
      if (s !== this.lastFootSign) { this.lastFootSign = s; this.onFootstep?.(); }
    }
    // blend weights
    const k = Math.min(1, dt * 14);
    for (const m of MODES) this.weights[m] += ((inp.mode === m ? 1 : 0) - this.weights[m]) * k;

    const out = this.pose;
    for (const key of KEYS) out[key] = 0;
    let total = 0;
    for (const m of MODES) {
      const w = this.weights[m];
      if (w < 0.002) continue;
      const p = this.tmp;
      for (const key of KEYS) p[key] = 0;
      switch (m) {
        case 'idle': this.poseIdle(p); break;
        case 'run': this.poseRun(p); break;
        case 'jump': this.poseJump(p, inp.vy); break;
        case 'slide': this.poseSlide(p); break;
        case 'sit': this.poseSit(p); break;
        case 'wave': this.poseWave(p); break;
        case 'cheer': this.poseCheer(p); break;
      }
      for (const key of KEYS) out[key] += p[key] * w;
      total += w;
    }
    if (total > 0) for (const key of KEYS) out[key] /= total;

    // additive layers
    if (this.flinchT > 0) {
      this.flinchT -= dt;
      const f = Math.max(0, this.flinchT / 0.7);
      const e = Math.sin(f * Math.PI);
      out.torsoX -= 0.55 * e;
      out.shLZ += 1.0 * e; out.shRZ -= 1.0 * e;
      out.headX -= 0.3 * e;
      out.headY += Math.sin(this.t * 25) * 0.25 * f;
    }
    if (this.popT > 0) {
      this.popT -= dt;
      const e = Math.sin(Math.max(0, this.popT / 0.35) * Math.PI);
      out.shRX -= 1.6 * e; out.elR += 0.8 * e;
      out.headX -= 0.15 * e;
    }
    let spin = 0;
    if (this.twirlT > 0) {
      this.twirlT -= dt;
      const f = 1 - Math.max(0, this.twirlT / 0.6);
      spin = easeInOut(f) * Math.PI * 2;
      const e = Math.sin(f * Math.PI);
      out.shLZ += 1.3 * e; out.shRZ -= 1.3 * e;
    }
    // banking into lane changes
    const lean = Math.max(-1.5, Math.min(1.5, inp.laneVel));
    out.torsoZ += lean * 0.12;
    out.torsoY += lean * 0.12;
    out.headZ -= lean * 0.05;

    // landing squash spring
    this.squashV += (-this.squash * 160 - this.squashV * 14) * dt;
    this.squash += this.squashV * dt;

    // apply
    this.body.position.y = HIP_H + out.bodyY + this.squash * 0.25;
    this.body.rotation.set(out.bodyRX, spin, -lean * 0.06);
    this.body.scale.set(1 - this.squash * 0.3, 1 + this.squash, 1 - this.squash * 0.3);
    this.legL.rotation.set(out.hipLX, 0, out.hipLZ);
    this.legR.rotation.set(out.hipRX, 0, out.hipRZ);
    this.kneeL.rotation.x = out.kneeL;
    this.kneeR.rotation.x = out.kneeR;
    this.torso.rotation.set(out.torsoX, out.torsoY, out.torsoZ);
    this.shL.rotation.set(out.shLX, 0, out.shLZ);
    this.shR.rotation.set(out.shRX, 0, out.shRZ);
    this.elL.rotation.x = out.elL;
    this.elR.rotation.x = out.elR;
    this.head.rotation.set(out.headX, out.headY, out.headZ);

    // blink
    this.blinkT -= dt;
    let eyeY = 1;
    if (this.blinkT < 0) {
      eyeY = 0.12;
      if (this.blinkT < -0.11) this.blinkT = 2 + Math.random() * 3;
    }
    this.eyesOpen.scale.y = eyeY;
    if (this.exprT > 0) {
      this.exprT -= dt;
      if (this.exprT <= 0) this.applyExpr(this.baseExpr);
    }

    // plaits: damped pendulums, gravity-compensated
    const pitch = out.bodyRX + out.torsoX + out.headX;
    for (const pl of this.plaits) {
      const targetX = 0.28 - pitch + Math.max(-0.6, Math.min(0.9, inp.vy * 0.06)) + out.bodyY * -2;
      const targetZ = -pl.side * 0.05 - lean * 0.35 - (out.torsoZ + out.headZ) * 0.8;
      pl.vx += ((targetX - pl.ax) * 90 - pl.vx * 7) * dt;
      pl.vz += ((targetZ - pl.az) * 70 - pl.vz * 6) * dt;
      // running bounce
      if (inp.mode === 'run') pl.vx += Math.cos(this.runPhase * 2) * dt * 9;
      pl.ax += pl.vx * dt;
      pl.az += pl.vz * dt;
      pl.ax = Math.max(-0.4, Math.min(2.2, pl.ax));
      pl.segs[0].rotation.set(pl.ax, 0, pl.az + pl.side * 0.1);
      for (let i = 1; i < pl.segs.length; i++) {
        pl.segs[i].rotation.set(pl.vx * -0.012 * i, 0, pl.vz * -0.01);
      }
    }
  }
}

function shade(hex: string, f: number) {
  const c = new THREE.Color(hex);
  c.multiplyScalar(f);
  return `#${c.getHexString()}`;
}
function easeInOut(x: number) { return x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2; }
function smoothPulse(x: number) { const s = Math.sin(x); return s > 0.6 ? 1 : s < 0.2 ? 0 : (s - 0.2) / 0.4; }

// ---------------------------------------------------------------------------
// Maa — seated on a charpai, jasmine in her bun, gold bindi, terracotta saree.

export function buildMaa(): { group: THREE.Group; waveArm: THREE.Group; update: (t: number) => void } {
  const g = new THREE.Group();
  const skin = toon('#B9774B');
  const sareeTex = sareeTexture();
  const saree = toon('#FFFFFF', { map: sareeTex, key: 'saree' });
  const blouse = toon(C.indigo);
  // crossed legs / saree base
  g.add(mesh(G.sphere, saree, 0, 0.12, 0.05, 0.42, 0.14, 0.32));
  g.add(mesh(G.cyl, toon(C.indigo), 0, 0.03, 0.05, 0.43, 0.04, 0.33));
  // torso
  const torso = joint(g, 0, 0.2, 0);
  torso.add(mesh(lathe([[0, 0], [0.22, 0], [0.2, 0.2], [0.19, 0.32], [0.12, 0.4], [0, 0.42]], 16), blouse, 0, 0, 0, 1, 1, 0.8));
  const pallu = mesh(G.box, saree, 0.02, 0.2, 0.15, 0.13, 0.46, 0.02);
  pallu.rotation.z = 0.6;
  torso.add(pallu);
  torso.add(mesh(G.cyl, skin, 0, 0.45, 0, 0.055, 0.08, 0.055));
  // head
  const head = joint(torso, 0, 0.66, 0);
  head.add(mesh(G.sphere, skin, 0, 0, 0, 0.21, 0.22, 0.2));
  const cap = new THREE.Mesh(new THREE.SphereGeometry(0.225, 20, 14, 0, Math.PI * 2, 0, 1.7), toon(C.hair));
  cap.rotation.x = -0.5;
  head.add(cap);
  head.add(mesh(G.sphere, toon(C.hair), 0, -0.02, -0.21, 0.1, 0.09, 0.08)); // bun
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    head.add(mesh(G.sphereLo, toon(C.white), Math.cos(a) * 0.11, -0.02 + Math.sin(a) * 0.1, -0.24, 0.022));
  }
  head.add(mesh(G.sphereLo, toon(C.sindoor), 0, 0.09, 0.2, 0.014)); // bindi
  for (const s of [1, -1]) {
    head.add(mesh(G.sphere, flat('#1C1210'), s * 0.075, 0.0, 0.185, 0.03, 0.038, 0.015));
    head.add(mesh(G.cone, toon('#D9A42C'), s * 0.2, -0.08, 0, 0.025, 0.05, 0.025)); // jhumka
  }
  const smile = arc(0.045, 0.008, 1.8, toon('#7E2E22'), true);
  smile.position.set(0, -0.1, 0.19);
  head.add(smile);
  // arms
  const armL = joint(torso, 0.2, 0.33, 0);
  armL.add(mesh(G.cyl, skin, 0, -0.12, 0.05, 0.04, 0.26, 0.04));
  armL.rotation.set(-0.5, 0, 0.3);
  const waveArm = joint(torso, -0.2, 0.33, 0);
  waveArm.add(mesh(G.cyl, blouse, 0, -0.04, 0, 0.055, 0.08, 0.055));
  waveArm.add(mesh(G.cyl, skin, 0, -0.17, 0, 0.04, 0.22, 0.04));
  waveArm.add(mesh(G.sphere, skin, 0, -0.3, 0, 0.045));
  waveArm.add(mesh(new THREE.TorusGeometry(0.043, 0.01, 6, 14), toon('#D9A42C'), 0, -0.24, 0).rotateX(Math.PI / 2));
  mergeStatic(g);
  const update = (t: number) => {
    waveArm.rotation.set(-0.3, 0, -2.4 + Math.sin(t * 6) * 0.35);
    head.rotation.z = Math.sin(t * 1.2) * 0.06;
  };
  return { group: g, waveArm, update };
}

function sareeTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 128;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = C.terracotta;
  ctx.fillRect(0, 0, 128, 128);
  ctx.fillStyle = '#F4E3C7';
  for (let y = 8; y < 128; y += 16) for (let x = 8 + ((y / 16) % 2) * 8; x < 128; x += 16) {
    ctx.beginPath(); ctx.moveTo(x, y - 4); ctx.lineTo(x + 3, y); ctx.lineTo(x, y + 4); ctx.lineTo(x - 3, y); ctx.fill();
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(3, 2);
  return tex;
}
