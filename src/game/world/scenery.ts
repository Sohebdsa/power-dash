// Environment segment templates for the four zones of the Wellness World.
// Each template is merged once at load; the world clones them (geometry is shared).

import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { Builder, C, G, toon, canvasTexture, drawRangoli, seededRandom, weaveTexture, lathe } from '../materials';

export const SEG_LEN = 40;
export const LANE_W = 2.2;
export const TRACK_HALF = 3.6;

export type ZoneId = 'city' | 'garden' | 'boulevard' | 'valley';

export interface ZoneDef {
  id: ZoneId;
  name: string;
  skyTop: string;
  skyHorizon: string;
  fog: string;
  hemiSky: string;
  hemiGround: string;
  sun: string;
  sunIntensity: number;
  hemiIntensity: number;
  sunPos: [number, number, number];
}

export const ZONES: ZoneDef[] = [
  { id: 'city', name: 'Sunrise City', skyTop: '#EBCB98', skyHorizon: '#FBEFD8', fog: '#F4E2C2',
    hemiSky: '#FFF1D6', hemiGround: '#B8643F', sun: '#FFDDB0', sunIntensity: 2.3, hemiIntensity: 1.35, sunPos: [-30, 28, -40] },
  { id: 'garden', name: 'Wellness Garden', skyTop: '#8FC1C9', skyHorizon: '#EEF1D9', fog: '#E1E8CF',
    hemiSky: '#F6FBEF', hemiGround: '#6F8A55', sun: '#FFF4DC', sunIntensity: 2.4, hemiIntensity: 1.4, sunPos: [25, 45, -30] },
  { id: 'boulevard', name: 'Knowledge Boulevard', skyTop: '#9ACBE0', skyHorizon: '#F6ECD5', fog: '#EFE6CF',
    hemiSky: '#FFF8EA', hemiGround: '#B89A6A', sun: '#FFF0D2', sunIntensity: 2.3, hemiIntensity: 1.4, sunPos: [-20, 50, -20] },
  { id: 'valley', name: 'Rainbow Valley', skyTop: '#3E4C78', skyHorizon: '#EBA36B', fog: '#D9A07C',
    hemiSky: '#FFD9B8', hemiGround: '#4E5E78', sun: '#FFB878', sunIntensity: 2.0, hemiIntensity: 1.2, sunPos: [10, 12, -80] },
];
export const ZONE_LENGTH = 650; // metres per zone

export function zoneIndexAt(distance: number) {
  return Math.floor(Math.max(0, distance) / ZONE_LENGTH) % ZONES.length;
}

// ---------------------------------------------------------------------------
// Track textures

function trackTexture(zone: ZoneId) {
  return canvasTexture(`track-${zone}`, 256, 256, (ctx, w, h) => {
    const r = seededRandom(zone.length * 7);
    if (zone === 'city') {
      ctx.fillStyle = '#E8D3AC'; ctx.fillRect(0, 0, w, h);
      // square stone pavers
      for (let y = 0; y < h; y += 32) for (let x = 0; x < w; x += 32) {
        const t = r();
        ctx.fillStyle = t > 0.7 ? '#E0C79C' : t > 0.4 ? '#EBD8B4' : '#E4CEA6';
        ctx.fillRect(x + 1.5, y + 1.5, 29, 29);
      }
      ctx.fillStyle = '#C9A877';
      for (let i = 0; i < w; i += 32) { ctx.fillRect(i, 0, 1.5, h); ctx.fillRect(0, i, w, 1.5); }
    } else if (zone === 'garden') {
      ctx.fillStyle = '#D9BE8E'; ctx.fillRect(0, 0, w, h);
      for (let i = 0; i < 260; i++) {
        ctx.fillStyle = r() > 0.5 ? '#C9AC7C' : '#E6CFA3';
        ctx.beginPath(); ctx.arc(r() * w, r() * h, 1 + r() * 2.5, 0, Math.PI * 2); ctx.fill();
      }
    } else if (zone === 'boulevard') {
      ctx.fillStyle = '#EAD7AF'; ctx.fillRect(0, 0, w, h);
      for (let i = 0; i < 26; i++) {
        ctx.fillStyle = r() > 0.5 ? '#E0C99C' : '#DCC394';
        ctx.beginPath(); ctx.ellipse(r() * w, r() * h, 8 + r() * 14, 5 + r() * 8, r() * 3, 0, Math.PI * 2); ctx.fill();
      }
    } else {
      // bridge planks
      for (let y = 0; y < h; y += 16) {
        const t = r();
        ctx.fillStyle = t > 0.6 ? '#A8774C' : t > 0.3 ? '#B5845A' : '#9E6E46';
        ctx.fillRect(0, y, w, 15);
        ctx.fillStyle = '#7A5234';
        ctx.fillRect(0, y + 15, w, 1);
        ctx.fillStyle = '#6E4A2E';
        ctx.fillRect(20, y + 6, 3, 3); ctx.fillRect(w - 24, y + 6, 3, 3);
      }
    }
    // lane dividers: dotted chandan lines
    if (zone !== 'valley') {
      ctx.fillStyle = 'rgba(250,243,227,0.75)';
      for (const lx of [w / 3, (2 * w) / 3]) for (let y = 0; y < h; y += 24) ctx.fillRect(lx - 2, y, 4, 12);
    } else {
      ctx.fillStyle = 'rgba(60,38,24,0.35)';
      for (const lx of [w / 3, (2 * w) / 3]) ctx.fillRect(lx - 1.5, 0, 3, h);
    }
  }, [1, 5]);
}

function grassTexture() {
  return canvasTexture('grass', 128, 128, (ctx, w, h) => {
    ctx.fillStyle = '#8AA571'; ctx.fillRect(0, 0, w, h);
    const r = seededRandom(3);
    for (let i = 0; i < 180; i++) {
      ctx.fillStyle = r() > 0.5 ? '#7E9A6E' : '#97B07C';
      ctx.fillRect(r() * w, r() * h, 2, 4);
    }
  }, [8, 4]);
}

function muralTexture(kind: number) {
  return canvasTexture(`mural-${kind}`, 512, 256, (ctx, w, h) => {
    const bgs = [C.cream, '#F3D9A0', '#E8C4B8', '#D8E3C8', '#F2E6CF'];
    ctx.fillStyle = bgs[kind % bgs.length]; ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = C.terracotta; ctx.lineWidth = 10; ctx.strokeRect(5, 5, w - 10, h - 10);
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const title = (t: string, y: number, col: string = C.ink, size = 44) => {
      ctx.fillStyle = col; ctx.font = `800 ${size}px "Baloo 2", sans-serif`; ctx.fillText(t, w / 2, y);
    };
    switch (kind) {
      case 0: drawRangoli(ctx, w / 2, h / 2, 100); break;
      case 1: {
        title('Eat a rainbow!', 50);
        const cols = ['#C9392A', '#E88A2A', '#F2C84B', '#4F7A3A', '#2F4A73', '#8E5BA8'];
        cols.forEach((c, i) => { ctx.fillStyle = c; ctx.beginPath(); ctx.arc(76 + i * 72, 160, 28, 0, Math.PI * 2); ctx.fill(); });
        break;
      }
      case 2: {
        title('Periods are normal', 60, C.sindoor);
        title('Talk. Ask. Learn.', 130, C.indigo, 36);
        ctx.fillStyle = C.rose;
        for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.arc(140 + i * 58, 200, 14, 0, Math.PI * 2); ctx.fill(); }
        break;
      }
      case 3: {
        title('Wash your hands', 56, C.teal);
        ctx.fillStyle = '#6FB7C9';
        for (let i = 0; i < 7; i++) { ctx.beginPath(); ctx.ellipse(110 + i * 50, 150 + Math.sin(i) * 20, 10, 16, 0, 0, Math.PI * 2); ctx.fill(); }
        title('with soap & clean water', 210, C.ink, 30);
        break;
      }
      case 4: {
        title('Every body is different', 70, C.ink, 40);
        title('— and that\'s okay!', 140, C.terracotta, 38);
        drawRangoli(ctx, 60, 200, 34); drawRangoli(ctx, w - 60, 200, 34);
        break;
      }
      case 5: {
        title('Drink clean water', 60, C.indigo);
        ctx.fillStyle = '#6FB7C9';
        ctx.beginPath(); ctx.moveTo(w / 2, 100); ctx.quadraticCurveTo(w / 2 + 50, 170, w / 2, 220); ctx.quadraticCurveTo(w / 2 - 50, 170, w / 2, 100); ctx.fill();
        break;
      }
    }
  });
}

function billboardTexture(kind: number) {
  const msgs = [
    ['Be prepared:', 'carry a period kit'], ['Sunlight dries', 'cloth pads best'], ['Protein helps', 'you grow strong'],
    ['Change pads', 'every 4–6 hours'], ['Iron + vitamin C', '= a great team'], ['Ask a trusted', 'adult anything'],
  ];
  const [a, b] = msgs[kind % msgs.length];
  return canvasTexture(`bb-${kind}`, 512, 256, (ctx, w, h) => {
    const bgs = [C.teal, C.sindoor, C.indigo, C.terracotta, '#5C7A4C', C.rose];
    ctx.fillStyle = bgs[kind % bgs.length]; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = C.haldi; ctx.fillRect(0, h - 26, w, 26);
    ctx.fillStyle = C.cream; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = '800 56px "Baloo 2", sans-serif';
    ctx.fillText(a, w / 2, 80); ctx.fillText(b, w / 2, 150);
  });
}

function signTexture(text: string) {
  return canvasTexture(`sign-${text}`, 512, 128, (ctx, w, h) => {
    ctx.fillStyle = C.cream; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = C.sindoor; ctx.fillRect(0, 0, w, 10); ctx.fillRect(0, h - 10, w, 10);
    ctx.fillStyle = C.ink; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = '800 64px "Baloo 2", sans-serif';
    ctx.fillText(text, w / 2, h / 2 + 4);
  });
}

// ---------------------------------------------------------------------------
// Prop helpers (add to a Builder)

const RB = new RoundedBoxGeometry(1, 1, 1, 2, 0.08);

function neemTree(b: Builder, x: number, z: number, s: number, r: () => number) {
  b.add(G.cylLo, toon('#6E4F35'), x, 1.6 * s, z, 0, 0, (r() - 0.5) * 0.15, 0.22 * s, 3.2 * s, 0.22 * s);
  const n = 5 + Math.floor(r() * 3);
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    b.add(G.ico, toon(i % 2 ? C.leaf : C.leafDark), x + Math.cos(a) * 1.0 * s, (3.6 + r() * 0.8) * s, z + Math.sin(a) * 1.0 * s, 0, 0, 0, (1.1 + r() * 0.4) * s);
  }
  b.add(G.ico, toon(C.leaf), x, 4.6 * s, z, 0, 0, 0, 1.3 * s);
}

function streetLight(b: Builder, x: number, z: number, side: number) {
  const pole = toon('#3D3A38');
  b.add(G.cylLo, pole, x, 2.4, z, 0, 0, 0, 0.07, 4.8, 0.07);
  b.add(G.box, pole, x - side * 0.5, 4.75, z, 0, 0, 0, 1.0, 0.07, 0.07);
  b.add(G.box, toon('#FFF3C2', { emissive: '#FFE9A8', emissiveIntensity: 0.5 }), x - side * 0.95, 4.62, z, 0, 0, 0, 0.35, 0.12, 0.2);
}

function pottedPlant(b: Builder, x: number, y: number, z: number, s = 1) {
  b.add(lathe([[0, 0], [0.18, 0], [0.24, 0.35], [0, 0.35]], 10), toon(C.terracotta), x, y, z, 0, 0, 0, s);
  b.add(G.ico, toon(C.leaf), x, y + 0.5 * s, z, 0, 0, 0, 0.28 * s);
  b.add(G.ico0, toon(C.sindoor), x + 0.1 * s, y + 0.65 * s, z, 0, 0, 0, 0.07 * s);
}

function clothesline(b: Builder, x: number, y: number, z: number, len: number, r: () => number) {
  b.add(G.cylLo, toon('#E6DCC6'), x, y, z, Math.PI / 2, 0, 0, 0.015, len, 0.015);
  const cols = [C.haldi, C.sindoor, C.teal, C.cream, C.rose, C.indigo];
  for (let i = 0; i < 4; i++) {
    const zz = z - len / 2 + 0.6 + i * (len - 1.2) / 3;
    b.add(G.box, toon(cols[Math.floor(r() * cols.length)]), x, y - 0.45, zz, 0, 0, 0, 0.04, 0.8, 0.7);
  }
}

function cityBuilding(b: Builder, side: number, z0: number, len: number, r: () => number) {
  const wallCols = [C.chandan, '#EFCB85', '#E3A07C', '#E7B3A8', '#D9C8A0', '#F1DDB0', '#B9CFC2'];
  const wall = toon(wallCols[Math.floor(r() * wallCols.length)]);
  const trim = toon(r() > 0.5 ? C.terracotta : '#F7EEDC');
  const floors = 2 + Math.floor(r() * 2);
  const fh = 3.1;
  const height = floors * fh + 0.4;
  const depth = 7;
  const front = 6.3; // facade distance from centre
  const cx = side * (front + depth / 2);
  const cz = z0 - len / 2;
  b.add(G.box, wall, cx, height / 2, cz, 0, 0, 0, depth, height, len);
  // parapet band + coping
  b.add(G.box, trim, cx, height + 0.25, cz, 0, 0, 0, depth + 0.2, 0.5, len + 0.2);
  b.add(G.box, trim, cx, 0.3, cz, 0, 0, 0, depth + 0.1, 0.6, len + 0.1); // plinth
  const fx = side * (front - 0.02);
  const shutter = toon(r() > 0.5 ? C.teal : '#4F7E8C');
  const nWin = Math.max(1, Math.floor(len / 2.8));
  for (let f = 0; f < floors; f++) {
    const y = f * fh + 1.7;
    for (let i = 0; i < nWin; i++) {
      const zz = z0 - (i + 0.5) * (len / nWin);
      if (f === 0 && i === Math.floor(nWin / 2)) {
        // blue door with frame and step
        b.add(G.box, toon('#2F5AA0'), fx, 1.25, zz, 0, 0, 0, 0.1, 2.4, 1.2);
        b.add(G.box, trim, fx, 2.55, zz, 0, 0, 0, 0.15, 0.2, 1.5);
        b.add(G.box, toon('#CBB48A'), side * (front - 0.35), 0.1, zz, 0, 0, 0, 0.7, 0.2, 1.6);
        continue;
      }
      if (f === 0 && r() > 0.6) {
        // shop with awning & rolling shutter
        b.add(G.box, toon('#9AA0A0'), fx, 1.2, zz, 0, 0, 0, 0.08, 2.2, 1.9);
        b.add(G.box, toon('#FFFFFF', { map: awningTex(r() > 0.5 ? C.sindoor : C.teal), key: 'awn-c' + Math.floor(r() * 2) }), side * (front - 0.6), 2.6, zz, 0, 0, side * 0.35, 1.3, 0.06, 2.2);
        continue;
      }
      b.add(G.box, toon('#3A4A52'), fx, y, zz, 0, 0, 0, 0.06, 1.2, 0.85);
      b.add(G.box, shutter, fx - side * 0.02, y, zz - 0.62, 0, side * 0.5, 0, 0.05, 1.2, 0.4);
      b.add(G.box, shutter, fx - side * 0.02, y, zz + 0.62, 0, -side * 0.5, 0, 0.05, 1.2, 0.4);
      b.add(G.box, trim, fx - side * 0.05, y - 0.68, zz, 0, 0, 0, 0.18, 0.1, 1.1);
      b.add(G.box, trim, fx - side * 0.05, y + 0.68, zz, 0, 0, 0, 0.14, 0.12, 1.0);
    }
    if (f === 1 && r() > 0.35) {
      // balcony with railing
      const bx = side * (front - 0.6);
      b.add(G.box, trim, bx, f * fh + 0.95, cz, 0, 0, 0, 1.2, 0.15, len * 0.6);
      b.add(G.box, toon(C.indigo), side * (front - 1.15), f * fh + 1.5, cz, 0, 0, 0, 0.06, 0.08, len * 0.6);
      const posts = Math.floor(len * 0.6 / 0.35);
      for (let p = 0; p <= posts; p++) b.add(G.box, toon(C.indigo), side * (front - 1.15), f * fh + 1.22, cz - len * 0.3 + p * 0.35, 0, 0, 0, 0.04, 0.5, 0.04);
      if (r() > 0.4) pottedPlant(b, side * (front - 0.9), f * fh + 1.02, cz + len * 0.25, 0.8);
    }
  }
  // rooftop: water tank, plants, clothesline
  if (r() > 0.25) {
    const tx = cx + side * (r() * 1.5), tz = cz + (r() - 0.5) * (len - 3);
    b.add(G.cyl, toon('#2B2826'), tx, height + 1.1, tz, 0, 0, 0, 0.75, 1.5, 0.75);
    b.add(G.cyl, toon('#3A3633'), tx, height + 1.9, tz, 0, 0, 0, 0.55, 0.15, 0.55);
    b.add(G.box, toon('#8A8682'), tx, height + 0.35, tz, 0, 0, 0, 1.4, 0.3, 1.4);
  }
  if (r() > 0.5) clothesline(b, cx - side * 1.2, height + 1.6, cz, Math.min(len - 1, 5), r);
  if (r() > 0.4) for (let i = 0; i < 3; i++) pottedPlant(b, side * (front + 0.4), height + 0.5, z0 - 1 - i * 1.2, 0.8);
  // creeper vines along the parapet (moodboard terrace)
  if (r() > 0.5) for (let i = 0; i < len / 1.2; i++) b.add(G.ico0, toon(i % 2 ? C.leaf : C.leafDark), fx - side * 0.1, height - 0.2 - (i % 3) * 0.3, z0 - 0.6 - i * 1.2, 0, i, 0, 0.3, 0.45, 0.3);
}

function awningTex(col: string) {
  return canvasTexture(`awning-${col}`, 128, 32, (ctx, w, h) => {
    for (let x = 0; x < w; x += 16) { ctx.fillStyle = (x / 16) % 2 ? col : C.cream; ctx.fillRect(x, 0, 16, h); }
  });
}

function charpai(b: Builder, x: number, z: number, rotY = 0) {
  const wood = toon('#6E4527');
  const c = Math.cos(rotY), s = Math.sin(rotY);
  const at = (lx: number, lz: number): [number, number] => [x + lx * c + lz * s, z - lx * s + lz * c];
  const [tx, tz] = at(0, 0);
  b.add(G.box, toon('#FFFFFF', { map: weaveTexture(), key: 'weave' }), tx, 0.45, tz, 0, rotY, 0, 1.0, 0.05, 1.8);
  for (const lx of [-0.5, 0.5]) for (const lz of [-0.88, 0.88]) {
    const [px, pz] = at(lx, lz);
    b.add(G.cylLo, wood, px, 0.24, pz, 0, 0, 0, 0.045, 0.48, 0.045);
  }
}

// ---------------------------------------------------------------------------
// Segment builders

export interface AnimSpec { type: 'fountain' | 'kite' | 'lantern'; x: number; y: number; z: number; c?: string }
export interface Template { group: THREE.Group; anims: AnimSpec[]; cameo?: { kind: 'classmates' | 'maa'; x: number; z: number } }

function baseTrack(b: Builder, zone: ZoneId) {
  const mat = toon('#FFFFFF', { map: trackTexture(zone), key: `track-${zone}` });
  b.add(G.plane, mat, 0, 0, -SEG_LEN / 2, -Math.PI / 2, 0, 0, TRACK_HALF * 2, SEG_LEN, 1);
}

function buildCity(variant: number): Template {
  const b = new Builder();
  const r = seededRandom(100 + variant * 31);
  baseTrack(b, 'city');
  const anims: AnimSpec[] = [];
  for (const side of [-1, 1]) {
    b.add(G.box, toon('#CDB48A'), side * (TRACK_HALF + 0.15), 0.1, -SEG_LEN / 2, 0, 0, 0, 0.3, 0.2, SEG_LEN);
    b.add(G.box, toon('#E2CDA6'), side * 4.9, 0.08, -SEG_LEN / 2, 0, 0, 0, 2.3, 0.16, SEG_LEN);
  }
  // left: road with traffic then buildings further out; right: buildings
  b.add(G.box, toon('#7A6E62'), -8.5, 0.02, -SEG_LEN / 2, 0, 0, 0, 5.0, 0.04, SEG_LEN);
  for (let z = -2; z > -SEG_LEN; z -= 5) b.add(G.box, toon(C.cream), -8.5, 0.05, z, 0, 0, 0, 0.18, 0.02, 2.2);
  b.add(G.box, toon('#E2CDA6'), -12, 0.08, -SEG_LEN / 2, 0, 0, 0, 2, 0.16, SEG_LEN);
  for (const side of [-1, 1]) {
    let z = 0;
    while (z > -SEG_LEN + 3) {
      const len = Math.min(-z + SEG_LEN, 7 + r() * 6);
      if (side < 0) {
        // shift left buildings out past the road
        const g = new Builder();
        cityBuilding(g, -1, z, len, r);
        const grp = g.build();
        grp.children.forEach((m) => {
          const mesh = m as THREE.Mesh;
          mesh.geometry.translate(-6.7, 0, 0);
          b.add(mesh.geometry, mesh.material as THREE.Material);
          mesh.geometry.dispose();
        });
      } else {
        cityBuilding(b, 1, z, len, r);
      }
      z -= len + (r() > 0.7 ? 1.2 : 0.2);
    }
  }
  for (let z = -6; z > -SEG_LEN; z -= 20) {
    streetLight(b, 4.3, z, 1);
    streetLight(b, -4.3, z - 10, -1);
  }
  if (r() > 0.4) neemTree(b, 5.2, -12 - r() * 16, 0.8, r);
  if (r() > 0.5) neemTree(b, -5.2, -8 - r() * 20, 0.75, r);
  // electric wires between rooftops
  b.add(G.cylLo, toon('#2B2826'), 0, 8.5, -SEG_LEN * 0.4, 0, 0, Math.PI / 2, 0.015, 26, 0.015);
  const cameo = variant === 1 ? { kind: 'maa' as const, x: 5.0, z: -22 } : undefined;
  if (cameo) charpai(b, 5.0, -22, 0);
  return { group: b.build({ receiveShadow: true }), anims, cameo };
}

function buildGarden(variant: number): Template {
  const b = new Builder();
  const r = seededRandom(200 + variant * 17);
  baseTrack(b, 'garden');
  const anims: AnimSpec[] = [];
  const grass = toon('#FFFFFF', { map: grassTexture(), key: 'grass' });
  for (const side of [-1, 1]) {
    b.add(G.plane, grass, side * (TRACK_HALF + 30), -0.01, -SEG_LEN / 2, -Math.PI / 2, 0, 0, 60, SEG_LEN, 1);
    // stone edging
    for (let z = -0.6; z > -SEG_LEN; z -= 1.2) b.add(RB, toon(z % 2.4 < -1.2 ? '#CDBB98' : '#D8C7A4'), side * (TRACK_HALF + 0.2), 0.08, z, 0, 0, 0, 0.35, 0.18, 1.1);
    // low hedges with gaps
    for (let z = -2; z > -SEG_LEN + 2; z -= 9) {
      const len = 5 + r() * 2;
      b.add(new RoundedBoxGeometry(0.9, 0.8, len, 2, 0.3), toon(C.leafDark), side * 4.6, 0.4, z - len / 2, 0, 0, 0);
      for (let i = 0; i < len / 0.9; i++) b.add(G.ico0, toon(r() > 0.5 ? C.haldi : '#E8892B'), side * 4.15, 0.62, z - 0.4 - i * 0.9, 0, r() * 3, 0, 0.12);
    }
    // flower beds
    for (let i = 0; i < 3; i++) {
      const fx = side * (7 + r() * 6), fz = -5 - r() * 30;
      b.add(G.cyl, toon('#6E5040'), fx, 0.08, fz, 0, 0, 0, 1.6, 0.16, 1.1);
      for (let k = 0; k < 14; k++) {
        const a = r() * Math.PI * 2, d = r() * 1.3;
        b.add(G.ico0, toon([C.haldi, '#E8892B', C.rose, C.cream][k % 4]), fx + Math.cos(a) * d, 0.3, fz + Math.sin(a) * d * 0.7, 0, 0, 0, 0.16);
      }
    }
    for (let i = 0; i < 3; i++) neemTree(b, side * (8 + r() * 14), -4 - i * 13 - r() * 4, 0.9 + r() * 0.4, r);
  }
  // lanterns
  for (let z = -10; z > -SEG_LEN; z -= 20) for (const side of [-1, 1]) {
    b.add(G.cylLo, toon(C.ink), side * 4.0, 1.0, z, 0, 0, 0, 0.05, 2.0, 0.05);
    b.add(G.box, toon('#FFE2A0', { emissive: '#FFD27A', emissiveIntensity: 0.5 }), side * 4.0, 2.15, z, 0, 0, 0, 0.3, 0.4, 0.3);
    b.add(G.cone, toon(C.terracotta), side * 4.0, 2.5, z, 0, 0, 0, 0.3, 0.3, 0.3);
  }
  if (variant !== 2) {
    const fx = variant === 0 ? 9 : -9, fz = -20;
    const stone = toon('#D9CBB0');
    b.add(lathe([[0, 0], [2.0, 0], [2.1, 0.5], [1.9, 0.55], [1.8, 0.2], [0, 0.2]], 24), stone, fx, 0, fz);
    b.add(G.cyl, toon('#6FB7C9', { opacity: 0.9 }), fx, 0.35, fz, 0, 0, 0, 1.85, 0.2, 1.85);
    b.add(G.cyl, stone, fx, 1.0, fz, 0, 0, 0, 0.25, 1.4, 0.25);
    b.add(lathe([[0, 0], [0.9, 0.05], [0.95, 0.3], [0.85, 0.32], [0, 0.15]], 20), stone, fx, 1.6, fz);
    anims.push({ type: 'fountain', x: fx, y: 1.9, z: fz });
    // charpai bench beside the fountain
    charpai(b, fx + (fx > 0 ? 3.2 : -3.2), fz + 2, Math.PI / 2);
  }
  return { group: b.build({ receiveShadow: true }), anims };
}

function buildBoulevard(variant: number): Template {
  const b = new Builder();
  const r = seededRandom(300 + variant * 13);
  baseTrack(b, 'boulevard');
  const anims: AnimSpec[] = [];
  const sand = toon('#E6D2A8');
  for (const side of [-1, 1]) b.add(G.plane, sand, side * (TRACK_HALF + 20), -0.01, -SEG_LEN / 2, -Math.PI / 2, 0, 0, 40, SEG_LEN, 1);
  // right: school building (moodboard school courtyard)
  const wall = toon('#EFC56A');
  const front = 8.5, depth = 8, h1 = 3.4;
  const cx = front + depth / 2;
  b.add(G.box, wall, cx, h1, -SEG_LEN / 2, 0, 0, 0, depth, h1 * 2, SEG_LEN);
  b.add(G.box, toon(C.terracotta), cx, h1 * 2 + 0.2, -SEG_LEN / 2, 0, 0, 0, depth + 0.3, 0.4, SEG_LEN);
  b.add(G.box, toon(C.terracotta), cx - 0.6, h1, -SEG_LEN / 2, 0, 0, 0, depth, 0.25, SEG_LEN); // floor slab
  for (let i = 0; i < 8; i++) {
    const zz = -2.5 - i * 5;
    // ground floor teal doors and upper windows
    b.add(G.box, toon(C.teal), front - 0.02, 1.2, zz, 0, 0, 0, 0.1, 2.3, 1.2);
    b.add(G.box, toon('#2E5650'), front - 0.04, 1.2, zz, 0, 0, 0, 0.1, 0.06, 1.2);
    b.add(G.box, toon(C.teal), front - 0.02, h1 + 1.7, zz, 0, 0, 0, 0.1, 1.6, 1.2);
    b.add(G.box, toon('#FBEBC0'), front - 0.6, h1, zz + 2.5, 0, 0, 0, 0.3, h1 * 2, 0.3); // column
  }
  // upper balcony with blue railing
  b.add(G.box, toon('#4A6FB0'), front - 1.15, h1 + 0.9, -SEG_LEN / 2, 0, 0, 0, 0.08, 0.1, SEG_LEN);
  b.add(G.box, toon('#4A6FB0'), front - 1.15, h1 + 0.35, -SEG_LEN / 2, 0, 0, 0, 0.06, 0.06, SEG_LEN);
  for (let z = -0.2; z > -SEG_LEN; z -= 0.4) b.add(G.box, toon('#4A6FB0'), front - 1.15, h1 + 0.6, z, 0, 0, 0, 0.04, 0.55, 0.04);
  b.add(G.box, toon(C.terracotta), front - 0.6, h1 + 0.12, -SEG_LEN / 2, 0, 0, 0, 1.3, 0.2, SEG_LEN);
  // left: mural wall
  b.add(G.box, toon(C.chandan), -6.5, 1.6, -SEG_LEN / 2, 0, 0, 0, 0.5, 3.2, SEG_LEN);
  b.add(G.box, toon(C.terracotta), -6.5, 3.3, -SEG_LEN / 2, 0, 0, 0, 0.7, 0.25, SEG_LEN);
  for (let i = 0; i < 3; i++) {
    const kind = (variant * 3 + i) % 6;
    b.add(G.plane, toon('#FFFFFF', { map: muralTexture(kind), key: `mural-${kind}` }), -6.24, 1.7, -6.5 - i * 13, 0, Math.PI / 2, 0, 5.2, 2.6, 1);
  }
  // peepal tree with round brick platform (moodboard)
  if (variant !== 1) {
    const tz = -20;
    b.add(G.cyl, toon(C.brick), -4.9, 0.3, tz, 0, 0, 0, 1.1, 0.6, 1.1);
    b.add(G.cyl, toon('#C98463'), -4.9, 0.62, tz, 0, 0, 0, 1.15, 0.06, 1.15);
    neemTree(b, -4.9, tz, 1.2, r);
  }
  // billboards
  const bbKind = variant * 2;
  b.add(G.cylLo, toon(C.ink), 5.0, 2.0, -10, 0, 0, 0, 0.08, 4, 0.08);
  b.add(G.box, toon('#FFFFFF', { map: billboardTexture(bbKind), key: `bb-${bbKind}` }), 5.0, 4.3, -10, 0, -Math.PI / 2 + 0.25, 0, 3.2, 1.6, 0.1);
  b.add(G.cylLo, toon(C.ink), -5.4, 2.0, -32, 0, 0, 0, 0.08, 4, 0.08);
  b.add(G.box, toon('#FFFFFF', { map: billboardTexture(bbKind + 1), key: `bb-${bbKind + 1}` }), -5.4, 4.3, -32, 0, Math.PI / 2 - 0.25, 0, 3.2, 1.6, 0.1);
  // bicycles
  for (let i = 0; i < 2; i++) {
    const bz = -26 - i * 1.1, bx = 7.6;
    b.add(G.torus, toon(C.ink), bx, 0.35, bz - 0.5, 0, Math.PI / 2, 0, 0.32, 0.32, 0.12);
    b.add(G.torus, toon(C.ink), bx, 0.35, bz + 0.5, 0, Math.PI / 2, 0, 0.32, 0.32, 0.12);
    b.add(G.box, toon(i ? C.sindoor : C.indigo), bx, 0.55, bz, 0.5, 0, 0, 0.05, 0.05, 1.0);
    b.add(G.box, toon(C.ink), bx, 0.85, bz + 0.45, 0, 0, 0, 0.4, 0.04, 0.04);
  }
  for (let i = 0; i < 4; i++) pottedPlant(b, front - 0.4, 0, -6 - i * 9, 1.2);
  const cameo = variant === 0 ? { kind: 'classmates' as const, x: -4.6, z: -12 } : undefined;
  return { group: b.build({ receiveShadow: true }), anims, cameo };
}

function buildValley(variant: number): Template {
  const b = new Builder();
  const r = seededRandom(400 + variant * 19);
  baseTrack(b, 'valley');
  const anims: AnimSpec[] = [];
  const wood = toon('#7A5234');
  // deck beams
  b.add(G.box, toon('#6E4A2E'), 0, -0.35, -SEG_LEN / 2, 0, 0, 0, TRACK_HALF * 2 + 0.4, 0.6, SEG_LEN);
  // railings
  for (const side of [-1, 1]) {
    b.add(G.box, wood, side * 3.85, 1.0, -SEG_LEN / 2, 0, 0, 0, 0.12, 0.12, SEG_LEN);
    b.add(G.box, wood, side * 3.85, 0.55, -SEG_LEN / 2, 0, 0, 0, 0.08, 0.08, SEG_LEN);
    for (let z = -1.25; z > -SEG_LEN; z -= 2.5) b.add(G.box, toon('#6E4A2E'), side * 3.85, 0.55, z, 0, 0, 0, 0.16, 1.1, 0.16);
    for (let z = -5; z > -SEG_LEN; z -= 10) {
      b.add(G.cylLo, toon(C.ink), side * 3.85, 1.6, z, 0, 0, 0, 0.05, 1.2, 0.05);
      b.add(G.sphereLo, toon('#FFC978', { emissive: '#FFB84D', emissiveIntensity: 0.9 }), side * 3.85, 2.3, z, 0, 0, 0, 0.18, 0.24, 0.18);
      b.add(G.cone, toon(C.sindoor), side * 3.85, 2.55, z, 0, 0, 0, 0.18, 0.18, 0.18);
    }
  }
  // pillars
  for (let z = -10; z > -SEG_LEN; z -= 20) for (const side of [-1, 1]) b.add(G.box, toon('#8A7A6A'), side * 3.0, -14, z, 0, 0, 0, 1.2, 28, 1.2);
  // valley floor, river and hills
  b.add(G.plane, toon('#7E9A6E'), 0, -28, -SEG_LEN / 2, -Math.PI / 2, 0, 0, 260, SEG_LEN, 1);
  b.add(G.plane, toon('#5C9AA0'), 6, -27.9, -SEG_LEN / 2, -Math.PI / 2, 0, 0.3, 10, SEG_LEN + 6, 1);
  const hillCols = [C.neem, C.teal, '#93A86E', '#C9A55A', '#6F8E5E', '#B98A5A'];
  for (let i = 0; i < 7; i++) {
    const side = i % 2 ? 1 : -1;
    const hx = side * (16 + r() * 70), hz = -r() * SEG_LEN;
    const s = 8 + r() * 14;
    b.add(G.ico, toon(hillCols[Math.floor(r() * hillCols.length)]), hx, -28 + s * 0.3, hz, 0, r() * 3, 0, s, s * (0.6 + r() * 0.6), s);
    if (r() > 0.6) b.add(G.plane, toon('#FFFFFF', { map: rangoliTex(), key: 'rangoliTex', opacity: 0.95 }), hx, -28 + s * 0.3 + s * 0.85, hz, -Math.PI / 2, 0, 0, s * 0.8, s * 0.8, 1);
  }
  for (let i = 0; i < 3; i++) anims.push({ type: 'kite', x: (r() - 0.5) * 50, y: 14 + r() * 10, z: -r() * SEG_LEN, c: [C.sindoor, C.haldi, C.teal, C.rose][Math.floor(r() * 4)] });
  return { group: b.build({ receiveShadow: true }), anims };
}

function rangoliTex() {
  return canvasTexture('rangoliTex', 256, 256, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    drawRangoli(ctx, w / 2, h / 2, 100);
  });
}

/** Gate arch announcing a new zone. */
function buildGate(zone: ZoneDef): THREE.Group {
  const b = new Builder();
  const col = toon(zone.id === 'valley' ? C.indigo : zone.id === 'garden' ? C.teal : C.terracotta);
  for (const side of [-1, 1]) {
    b.add(G.box, col, side * 4.3, 2.9, -2, 0, 0, 0, 0.6, 5.8, 0.6);
    b.add(G.box, toon(C.haldi), side * 4.3, 5.85, -2, 0, 0, 0, 0.8, 0.2, 0.8);
    b.add(G.sphereLo, toon(C.haldi), side * 4.3, 6.15, -2, 0, 0, 0, 0.25);
  }
  b.add(G.box, col, 0, 5.4, -2, 0, 0, 0, 9.2, 0.5, 0.5);
  b.add(G.box, toon('#FFFFFF', { map: signTexture(zone.name), key: `sign-${zone.name}` }), 0, 6.3, -2, 0, 0, 0, 5.2, 1.3, 0.2);
  // marigold toran
  for (let i = 0; i < 19; i++) {
    const x = -4 + i * (8 / 18);
    const sag = Math.sin((i / 18) * Math.PI) * 0.4;
    b.add(G.ico0, toon(i % 2 ? '#E8892B' : C.haldi), x, 5.05 - sag, -1.7, 0, i, 0, 0.13);
    if (i % 3 === 0) b.add(G.cone, toon(C.leaf), x, 4.7 - sag, -1.7, Math.PI, 0, 0, 0.08, 0.3, 0.03);
  }
  return b.build();
}

// ---------------------------------------------------------------------------

export const VARIANTS = 3;
let templates: Record<ZoneId, Template[]> | null = null;
let gates: Record<ZoneId, THREE.Group> | null = null;

export function getTemplates() {
  if (!templates) {
    templates = {
      city: [0, 1, 2].map(buildCity),
      garden: [0, 1, 2].map(buildGarden),
      boulevard: [0, 1, 2].map(buildBoulevard),
      valley: [0, 1, 2].map(buildValley),
    };
    gates = Object.fromEntries(ZONES.map((z) => [z.id, buildGate(z)])) as Record<ZoneId, THREE.Group>;
  }
  return { templates, gates: gates! };
}

// ---------------------------------------------------------------------------
// Distant backdrops (one per zone), drawn on canvas.

export function backdropTexture(zone: ZoneId) {
  return canvasTexture(`backdrop-${zone}`, 1024, 256, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    const r = seededRandom(zone.length * 13 + 1);
    const layer = (col: string, base: number, amp: number, freq: number, bumps = false) => {
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.moveTo(0, h);
      for (let x = 0; x <= w; x += 8) {
        let y = base - Math.sin(x * freq + base) * amp - Math.sin(x * freq * 2.7) * amp * 0.4;
        if (bumps) y -= (Math.sin(x * 0.11) > 0.6 ? 12 : 0);
        ctx.lineTo(x, y);
      }
      ctx.lineTo(w, h);
      ctx.fill();
    };
    if (zone === 'city' || zone === 'boulevard') {
      const far = zone === 'city' ? '#E7C9A0' : '#D9DCCB';
      const near = zone === 'city' ? '#D9AF85' : '#C3CDB4';
      layer(far, 190, 10, 0.01);
      // skyline blocks with tanks
      for (let x = 0; x < w; x += 18 + r() * 30) {
        const bw = 24 + r() * 46, bh = 40 + r() * 80;
        ctx.fillStyle = r() > 0.5 ? near : far;
        ctx.fillRect(x, h - 40 - bh, bw, bh + 40);
        if (r() > 0.5) { ctx.fillRect(x + bw * 0.3, h - 52 - bh, 12, 12); }
      }
      // a temple shikhara and a clock tower silhouette
      ctx.fillStyle = near;
      ctx.beginPath(); ctx.moveTo(620, h - 40); ctx.lineTo(650, h - 170); ctx.lineTo(680, h - 40); ctx.fill();
      ctx.fillRect(300, h - 180, 26, 160);
      layer(zone === 'city' ? '#CFA27A' : '#B3C2A2', 236, 6, 0.02);
    } else if (zone === 'garden') {
      layer('#C9D7B9', 150, 26, 0.006);
      layer('#A9C096', 185, 18, 0.011);
      for (let i = 0; i < 40; i++) {
        ctx.fillStyle = r() > 0.5 ? '#8DA77A' : '#7E9A6E';
        const x = r() * w, y = 180 + r() * 30;
        ctx.beginPath(); ctx.arc(x, y, 10 + r() * 16, 0, Math.PI * 2); ctx.fill();
      }
      layer('#8DA77A', 230, 8, 0.02);
    } else {
      layer('#C88A86', 120, 40, 0.005);
      layer('#9C6E7E', 160, 30, 0.009);
      layer('#6E5E7C', 200, 22, 0.014);
      layer('#4E5070', 238, 10, 0.02);
    }
  });
}
