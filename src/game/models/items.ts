// Every collectible, hazard, power-up and obstacle model. Static parts are merged
// per material via Builder so each model costs only a few draw calls.

import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import {
  Builder, C, G, toon, flat, lathe, torusArc, canvasTexture, weaveTexture, blockPrint, seededRandom,
} from '../materials';

type Extras = { group: THREE.Group; updates: ((t: number) => void)[] };
type Maker = (b: Builder, x: Extras) => void;

const PI = Math.PI;

// ---- reusable geometries ---------------------------------------------------
const GEO = {
  pouch: new RoundedBoxGeometry(0.46, 0.09, 0.32, 3, 0.04),
  rbox: new RoundedBoxGeometry(1, 1, 1, 2, 0.12),
  rboxSoft: new RoundedBoxGeometry(1, 1, 1, 3, 0.3),
  apple: lathe([[0, -0.2], [0.12, -0.19], [0.2, -0.1], [0.21, 0.04], [0.16, 0.15], [0.06, 0.16], [0, 0.12]], 16),
  strawberry: lathe([[0, -0.2], [0.05, -0.17], [0.13, -0.05], [0.16, 0.06], [0.13, 0.13], [0, 0.15]], 14),
  egg: lathe([[0, -0.2], [0.1, -0.17], [0.15, -0.05], [0.13, 0.08], [0.07, 0.17], [0, 0.2]], 16),
  almond: lathe([[0, -0.1], [0.04, -0.06], [0.05, 0.0], [0.035, 0.06], [0, 0.1]], 10),
  bottle: lathe([[0, -0.22], [0.11, -0.22], [0.12, -0.18], [0.12, 0.06], [0.07, 0.14], [0.05, 0.2], [0.055, 0.24], [0, 0.24]], 16),
  bowl: lathe([[0, -0.08], [0.12, -0.08], [0.2, 0.0], [0.24, 0.08], [0.22, 0.085], [0.18, 0.02], [0, -0.02]], 20),
  cup: lathe([[0, -0.2], [0.03, -0.2], [0.03, -0.12], [0.06, -0.1], [0.12, -0.02], [0.15, 0.1], [0.15, 0.2], [0.13, 0.2], [0.13, 0.11], [0.1, 0.0], [0, -0.06]], 20),
  drop: lathe([[0, -0.2], [0.12, -0.17], [0.18, -0.07], [0.16, 0.04], [0.09, 0.15], [0.02, 0.25], [0, 0.27]], 18),
  can: lathe([[0, -0.2], [0.1, -0.2], [0.115, -0.17], [0.115, 0.17], [0.09, 0.21], [0, 0.21]], 16),
  barrel: lathe([[0, 0], [0.45, 0], [0.5, 0.4], [0.47, 0.8], [0, 0.8]], 16),
};

function extrude(shape: THREE.Shape, depth: number, bevel = 0.02) {
  const g = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 2, curveSegments: 10 });
  g.center();
  return g;
}

const starShape = (() => {
  const s = new THREE.Shape();
  for (let i = 0; i < 10; i++) {
    const r = i % 2 ? 0.09 : 0.2;
    const a = (i / 10) * PI * 2 + PI / 2;
    const x = Math.cos(a) * r, y = Math.sin(a) * r;
    if (i === 0) s.moveTo(x, y); else s.lineTo(x, y);
  }
  s.closePath();
  return s;
})();
const boltShape = (() => {
  const s = new THREE.Shape();
  s.moveTo(0.04, 0.24); s.lineTo(-0.12, -0.02); s.lineTo(-0.01, -0.02); s.lineTo(-0.06, -0.24);
  s.lineTo(0.12, 0.04); s.lineTo(0.01, 0.04); s.lineTo(0.06, 0.24); s.closePath();
  return s;
})();
const shieldShape = (() => {
  const s = new THREE.Shape();
  s.moveTo(0, 0.22); s.quadraticCurveTo(0.12, 0.17, 0.19, 0.18); s.quadraticCurveTo(0.2, -0.08, 0, -0.24);
  s.quadraticCurveTo(-0.2, -0.08, -0.19, 0.18); s.quadraticCurveTo(-0.12, 0.17, 0, 0.22);
  return s;
})();
const padShape = (() => {
  // pad silhouette with wings
  const s = new THREE.Shape();
  s.moveTo(0, 0.2);
  s.bezierCurveTo(0.08, 0.2, 0.09, 0.08, 0.07, 0.05);
  s.bezierCurveTo(0.14, 0.04, 0.14, -0.04, 0.07, -0.05);
  s.bezierCurveTo(0.09, -0.08, 0.08, -0.2, 0, -0.2);
  s.bezierCurveTo(-0.08, -0.2, -0.09, -0.08, -0.07, -0.05);
  s.bezierCurveTo(-0.14, -0.04, -0.14, 0.04, -0.07, 0.05);
  s.bezierCurveTo(-0.09, 0.08, -0.08, 0.2, 0, 0.2);
  return s;
})();
const GEO2 = {
  star: extrude(starShape, 0.06),
  bolt: extrude(boltShape, 0.06),
  shield: extrude(shieldShape, 0.06),
  pad: extrude(padShape, 0.025, 0.012),
};

// ---- label textures ----------------------------------------------------------
function padLabel() {
  return canvasTexture('padLabel', 256, 192, (ctx, w, h) => {
    ctx.fillStyle = '#E79BA6';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#F6C9CF';
    ctx.fillRect(0, h * 0.78, w, h * 0.22);
    // pad silhouette
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.ellipse(w / 2, h * 0.42, 70, 26, 0, 0, PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(w / 2, h * 0.42, 28, 42, 0, 0, PI * 2);
    ctx.fill();
    ctx.fillStyle = '#F4B7C0';
    ctx.beginPath();
    ctx.ellipse(w / 2, h * 0.42, 50, 14, 0, 0, PI * 2);
    ctx.fill();
    // little flower mark
    ctx.fillStyle = '#C4452E';
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * PI * 2;
      ctx.beginPath();
      ctx.arc(30 + Math.cos(a) * 7, 30 + Math.sin(a) * 7, 5, 0, PI * 2);
      ctx.fill();
    }
  });
}
function kitLabel() {
  return canvasTexture('kitLabel', 128, 128, (ctx, w, h) => {
    ctx.fillStyle = C.teal; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = C.haldi;
    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * PI * 2;
      ctx.ellipse(w / 2 + Math.cos(a) * 18, h / 2 + Math.sin(a) * 18, 14, 7, a, 0, PI * 2);
    }
    ctx.fill();
    ctx.fillStyle = C.cream;
    ctx.beginPath(); ctx.arc(w / 2, h / 2, 10, 0, PI * 2); ctx.fill();
  });
}
function textBoard(key: string, lines: string[], bg: string, fg: string, w = 512, h = 192, accent?: string) {
  return canvasTexture(key, w, h, (ctx) => {
    ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);
    if (accent) {
      ctx.fillStyle = accent;
      for (let x = 0; x < w; x += 24) { ctx.beginPath(); ctx.arc(x + 12, 10, 6, 0, PI * 2); ctx.fill(); ctx.beginPath(); ctx.arc(x + 12, h - 10, 6, 0, PI * 2); ctx.fill(); }
    }
    ctx.fillStyle = fg;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    let size = Math.floor(h / (lines.length + 1.2));
    ctx.font = `800 ${size}px "Baloo 2", "Poppins", sans-serif`;
    const widest = Math.max(...lines.map((l) => ctx.measureText(l).width));
    if (widest > w * 0.9) {
      size = Math.floor(size * (w * 0.9) / widest);
      ctx.font = `800 ${size}px "Baloo 2", "Poppins", sans-serif`;
    }
    lines.forEach((l, i) => ctx.fillText(l, w / 2, h / 2 + (i - (lines.length - 1) / 2) * size * 1.05));
  });
}
function chalkboard() {
  return canvasTexture('chalk', 256, 192, (ctx, w, h) => {
    ctx.fillStyle = '#2E4A3F'; ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#F2E6CF'; ctx.lineWidth = 3;
    // flowers (like the moodboard noticeboard)
    const flower = (x: number, y: number, col: string) => {
      ctx.fillStyle = col;
      for (let i = 0; i < 6; i++) { const a = (i / 6) * PI * 2; ctx.beginPath(); ctx.arc(x + Math.cos(a) * 10, y + Math.sin(a) * 10, 7, 0, PI * 2); ctx.fill(); }
      ctx.fillStyle = '#F2E6CF'; ctx.beginPath(); ctx.arc(x, y, 5, 0, PI * 2); ctx.fill();
      ctx.beginPath(); ctx.moveTo(x, y + 14); ctx.lineTo(x, y + 60); ctx.stroke();
    };
    flower(60, 60, C.haldi); flower(128, 50, C.rose); flower(196, 64, '#9CC3A0');
    ctx.font = '700 22px "Baloo 2", sans-serif'; ctx.fillStyle = '#F2E6CF'; ctx.textAlign = 'center';
    ctx.fillText('Every body grows', w / 2, 150);
    ctx.fillText('in its own time', w / 2, 174);
  });
}
function awningTex(a: string, b: string) {
  return canvasTexture(`awn-${a}-${b}`, 128, 32, (ctx, w, h) => {
    for (let x = 0; x < w; x += 16) { ctx.fillStyle = (x / 16) % 2 ? a : b; ctx.fillRect(x, 0, 16, h); }
  });
}

// ---- helper shapes ---------------------------------------------------------
function flies(x: Extras, y = 0.5, n = 3, r = 0.35) {
  const g = new THREE.Group();
  const fm = flat('#2B2420');
  const list: THREE.Mesh[] = [];
  for (let i = 0; i < n; i++) {
    const f = new THREE.Mesh(G.sphereLo, fm);
    f.scale.setScalar(0.022);
    g.add(f);
    list.push(f);
  }
  g.position.y = y;
  x.group.add(g);
  x.updates.push((t) => {
    list.forEach((f, i) => {
      const a = t * (3 + i) + i * 2.1;
      f.position.set(Math.cos(a) * r, Math.sin(a * 1.7) * 0.12 + Math.sin(t * 9 + i) * 0.03, Math.sin(a) * r);
    });
  });
}

function stinkLines(x: Extras, y: number) {
  const g = new THREE.Group();
  const m = flat('#8E9A7E', 0.7, 'stink');
  for (let i = 0; i < 3; i++) {
    const s = new THREE.Mesh(torusArc(0.06, 0.008, PI), m);
    s.position.set((i - 1) * 0.12, y, 0);
    s.rotation.z = PI / 2;
    g.add(s);
  }
  x.group.add(g);
  x.updates.push((t) => {
    g.children.forEach((c, i) => {
      c.position.y = y + ((t * 0.4 + i * 0.33) % 1) * 0.3;
      c.scale.setScalar(1 - ((t * 0.4 + i * 0.33) % 1) * 0.6);
    });
  });
}

function crumple(seed: number, detail = 1) {
  const g = new THREE.IcosahedronGeometry(1, detail);
  const r = seededRandom(seed);
  const pos = g.attributes.position as THREE.BufferAttribute;
  const map = new Map<string, number>();
  for (let i = 0; i < pos.count; i++) {
    const k = `${pos.getX(i).toFixed(3)},${pos.getY(i).toFixed(3)},${pos.getZ(i).toFixed(3)}`;
    let f = map.get(k);
    if (f === undefined) { f = 0.75 + r() * 0.5; map.set(k, f); }
    pos.setXYZ(i, pos.getX(i) * f, pos.getY(i) * f, pos.getZ(i) * f);
  }
  g.computeVertexNormals();
  return g;
}
const CRUMPLE = [crumple(3), crumple(7), crumple(11)];

function magnet(b: Builder, color: string) {
  const m = toon(color);
  b.add(torusArc(0.14, 0.055, PI), m, 0, 0.04, 0, 0, 0, 0);
  b.add(G.cyl, m, 0.14, -0.03, 0, 0, 0, 0, 0.055, 0.14, 0.055);
  b.add(G.cyl, m, -0.14, -0.03, 0, 0, 0, 0, 0.055, 0.14, 0.055);
  b.add(G.cyl, toon(C.white), 0.14, -0.12, 0, 0, 0, 0, 0.056, 0.05, 0.056);
  b.add(G.cyl, toon(C.white), -0.14, -0.12, 0, 0, 0, 0, 0.056, 0.05, 0.056);
}

function burger(b: Builder, s = 1, y = 0) {
  b.add(G.sphere, toon('#D99A4E'), 0, y + 0.08 * s, 0, 0, 0, 0, 0.22 * s, 0.12 * s, 0.22 * s);
  b.add(G.cyl, toon('#7DA34E'), 0, y + 0.0, 0, 0, 0, 0, 0.24 * s, 0.02 * s, 0.24 * s);
  b.add(G.box, toon('#F2C14E'), 0, y - 0.015 * s, 0, 0, 0.6, 0, 0.36 * s, 0.015 * s, 0.36 * s);
  b.add(G.cyl, toon('#6B3B24'), 0, y - 0.05 * s, 0, 0, 0, 0, 0.22 * s, 0.06 * s, 0.22 * s);
  b.add(G.cyl, toon('#D99A4E'), 0, y - 0.11 * s, 0, 0, 0, 0, 0.21 * s, 0.06 * s, 0.21 * s);
  for (let i = 0; i < 6; i++) {
    const a = i * 1.1;
    b.add(G.sphereLo, toon(C.cream), Math.cos(a) * 0.1 * s, y + 0.17 * s, Math.sin(a) * 0.1 * s, 0, 0, 0, 0.012 * s, 0.006 * s, 0.02 * s);
  }
}

function sodaBottle(b: Builder, x: number, y: number, z: number, s = 1) {
  b.add(GEO.bottle, toon('#B5462F'), x, y, z, 0, 0, 0, s * 0.6, s * 0.9, s * 0.6);
  b.add(G.cyl, toon(C.cream), x, y + 0.0 * s, z, 0, 0, 0, 0.075 * s, 0.08 * s, 0.075 * s);
}

// ---- makers ----------------------------------------------------------------
const MAKERS: Record<string, Maker> = {
  // ---------------- fruits
  apple: (b) => {
    b.add(GEO.apple, toon('#C9392A'), 0, 0, 0);
    b.add(G.sphereLo, toon('#E9705A'), -0.08, 0.06, 0.15, 0, 0, 0, 0.04, 0.03, 0.02);
    b.add(G.cylLo, toon(C.ink), 0, 0.17, 0, 0, 0, 0.15, 0.012, 0.09, 0.012);
    b.add(G.sphere, toon(C.neem), 0.06, 0.2, 0, 0, 0, -0.6, 0.06, 0.018, 0.035);
  },
  banana: (b) => {
    const y = toon('#F2C84B');
    b.add(new THREE.TorusGeometry(0.22, 0.055, 8, 18, 2.1), y, 0, -0.12, 0, 0, 0, 0.5);
    b.add(new THREE.TorusGeometry(0.2, 0.05, 8, 18, 1.9), toon('#E8B93A'), 0.02, -0.1, 0.06, 0.25, 0, 0.6);
    b.add(G.cylLo, toon('#6B4A22'), 0.205, 0.0, 0, 0, 0, -0.35, 0.02, 0.06, 0.02);
    b.add(G.sphereLo, toon('#4A3519'), -0.19, 0.13, 0, 0, 0, 0, 0.02);
  },
  orange: (b) => {
    b.add(G.sphere, toon('#E88A2A'), 0, 0, 0, 0, 0, 0, 0.19);
    b.add(G.sphereLo, toon('#F3A64C'), -0.07, 0.07, 0.14, 0, 0, 0, 0.04, 0.03, 0.02);
    b.add(G.sphere, toon(C.neem), 0.05, 0.19, 0, 0.3, 0, -0.5, 0.06, 0.016, 0.035);
    b.add(G.sphereLo, toon('#7A5A28'), 0, 0.185, 0, 0, 0, 0, 0.02);
  },
  strawberry: (b) => {
    b.add(GEO.strawberry, toon('#D23B3B'), 0, 0, 0);
    const r = seededRandom(5);
    for (let i = 0; i < 14; i++) {
      const a = r() * PI * 2, h = -0.12 + r() * 0.22;
      const rad = 0.06 + (h + 0.17) * 0.45;
      b.add(G.sphereLo, toon('#F6D36B'), Math.cos(a) * rad, h, Math.sin(a) * rad, 0, 0, 0, 0.012);
    }
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * PI * 2;
      b.add(G.cone, toon(C.leaf), Math.cos(a) * 0.06, 0.15, Math.sin(a) * 0.06, PI / 2, -a + PI / 2, 0, 0.03, 0.09, 0.012);
    }
  },
  watermelon: (b) => {
    const wedge = new THREE.CylinderGeometry(0.32, 0.32, 0.13, 16, 1, false, 0, PI / 2.4);
    const rind = new THREE.CylinderGeometry(0.35, 0.35, 0.1, 16, 1, false, 0, PI / 2.4);
    const white = new THREE.CylinderGeometry(0.335, 0.335, 0.115, 16, 1, false, 0, PI / 2.4);
    b.add(rind, toon('#4E7A3C'), 0, -0.12, 0, PI / 2, 0, -PI / 2 - PI / 4.8 + PI);
    b.add(white, toon('#E8EDC9'), 0, -0.12, 0, PI / 2, 0, -PI / 2 - PI / 4.8 + PI);
    b.add(wedge, toon('#E5534B'), 0, -0.12, 0.003, PI / 2, 0, -PI / 2 - PI / 4.8 + PI);
    for (const [x, y] of [[0, 0.05], [-0.05, 0.0], [0.05, 0.0], [0, -0.05]]) {
      b.add(G.sphereLo, toon(C.ink), x, y + 0.02, 0.07, 0, 0, 0, 0.012, 0.02, 0.01);
    }
  },
  // ---------------- vegetables
  carrot: (b) => {
    b.add(G.cone, toon('#E57A2C'), 0, -0.04, 0, PI, 0, 0.25, 0.08, 0.36, 0.08);
    for (let i = 0; i < 4; i++) b.add(G.torus, toon('#C9631F'), 0.01 * i - 0.01, 0.06 - i * 0.07, 0, PI / 2, 0, 0.25, 0.07 - i * 0.014, 0.07 - i * 0.014, 0.02);
    for (let i = -1; i <= 1; i++) b.add(G.cone, toon(C.leaf), -0.04 + i * 0.03, 0.22, 0, 0, 0, 0.25 + i * 0.35, 0.03, 0.18, 0.03);
  },
  broccoli: (b) => {
    b.add(G.cyl, toon('#9CB86B'), 0, -0.1, 0, 0, 0, 0, 0.05, 0.2, 0.05);
    const pos = [[0, 0.07, 0, 0.11], [0.09, 0.03, 0.03, 0.08], [-0.09, 0.03, 0.02, 0.085], [0.03, 0.04, 0.09, 0.08], [-0.03, 0.05, -0.09, 0.08], [0.05, 0.12, -0.03, 0.07]];
    for (const [x, y, z, r] of pos) b.add(G.ico, toon('#4F7A3A'), x, y, z, 0, 0, 0, r);
  },
  spinach: (b) => {
    for (let i = 0; i < 4; i++) {
      const a = (i - 1.5) * 0.35;
      b.add(G.sphere, toon(i % 2 ? '#3F6B35' : '#4D7D3E'), Math.sin(a) * 0.1, 0.06, 0, 0, 0, -a, 0.08, 0.17, 0.025);
      b.add(G.cylLo, toon('#A7C77E'), Math.sin(a) * 0.06, -0.1, 0, 0, 0, -a, 0.01, 0.16, 0.01);
    }
    b.add(G.torus, toon(C.sindoor), 0, -0.12, 0, PI / 2, 0, 0, 0.04, 0.04, 0.04);
  },
  tomato: (b) => {
    b.add(G.sphere, toon('#D6402F'), 0, 0, 0, 0, 0, 0, 0.18, 0.15, 0.18);
    b.add(G.sphereLo, toon('#EC6E58'), -0.07, 0.05, 0.13, 0, 0, 0, 0.035, 0.025, 0.02);
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * PI * 2;
      b.add(G.sphere, toon(C.leaf), Math.cos(a) * 0.05, 0.145, Math.sin(a) * 0.05, 0, -a, 0, 0.05, 0.012, 0.018);
    }
    b.add(G.cylLo, toon(C.leaf), 0, 0.17, 0, 0, 0, 0, 0.012, 0.05, 0.012);
  },
  // ---------------- protein
  egg: (b) => {
    b.add(GEO.egg, toon('#F6EEDC'), 0, 0, 0);
    b.add(G.sphereLo, toon(C.white), -0.05, 0.06, 0.11, 0, 0, 0, 0.03, 0.04, 0.02);
  },
  milk: (b) => {
    b.add(GEO.bottle, toon(C.white), 0, 0, 0);
    b.add(G.cyl, toon(C.indigo), 0, -0.05, 0, 0, 0, 0, 0.123, 0.12, 0.123);
    b.add(G.cyl, toon('#4F86C6'), 0, 0.25, 0, 0, 0, 0, 0.06, 0.04, 0.06);
    b.add(G.sphereLo, toon(C.white), 0, -0.05, 0.12, 0, 0, 0, 0.035, 0.035, 0.01);
  },
  almonds: (b) => {
    const m = toon('#A86B3C');
    b.add(GEO.almond, m, 0, 0.02, 0, 0, 0, 0.3, 1.1, 1.1, 0.7);
    b.add(GEO.almond, toon('#9A5F33'), 0.1, -0.03, 0.03, 0, 0.5, -0.6, 1.1, 1.1, 0.7);
    b.add(GEO.almond, m, -0.1, -0.04, -0.02, 0, -0.4, 0.9, 1.1, 1.1, 0.7);
  },
  beans: (b) => {
    b.add(GEO.bowl, toon(C.steel), 0, -0.05, 0);
    b.add(G.cyl, toon('#7B2E22'), 0, 0.01, 0, 0, 0, 0, 0.19, 0.03, 0.19);
    const r = seededRandom(9);
    for (let i = 0; i < 11; i++) {
      const a = r() * PI * 2, d = r() * 0.15;
      b.add(G.sphereLo, toon(i % 3 ? '#8E3324' : '#A8452F'), Math.cos(a) * d, 0.035, Math.sin(a) * d, 0, a, 0, 0.035, 0.022, 0.02);
    }
  },
  // ---------------- menstrual hygiene products
  pad: (b) => {
    b.add(GEO.pouch, toon('#FFFFFF', { map: padLabel(), key: 'padLabel' }), 0, 0, 0, PI / 2, 0, 0);
    b.add(G.box, toon('#F6C9CF'), 0, 0.17, 0, 0, 0, 0, 0.42, 0.03, 0.095); // sealed edge
    b.add(G.box, toon(C.sindoor), 0.17, 0.17, 0, 0, 0, 0, 0.06, 0.035, 0.1); // peel tab
  },
  tampon: (b) => {
    const wrap = toon('#9CC9C2');
    b.add(G.cyl, wrap, 0, 0, 0, 0, 0, PI / 2, 0.075, 0.34, 0.075);
    b.add(G.cyl, toon(C.white), 0, 0, 0, 0, 0, PI / 2, 0.077, 0.08, 0.077);
    b.add(G.cone, wrap, 0.22, 0, 0, 0, 0, -PI / 2, 0.06, 0.1, 0.03);
    b.add(G.cone, wrap, -0.22, 0, 0, 0, 0, PI / 2, 0.06, 0.1, 0.03);
    b.add(G.torus, toon(C.teal), 0.1, 0, 0, 0, PI / 2, 0, 0.077, 0.077, 0.05);
    b.add(G.torus, toon(C.teal), -0.1, 0, 0, 0, PI / 2, 0, 0.077, 0.077, 0.05);
  },
  cup: (b) => {
    b.add(GEO.cup, toon('#E58BA0', { opacity: 0.92, side: THREE.DoubleSide }), 0, 0, 0, 0, 0, 0, 1.15);
    for (let i = 0; i < 3; i++) b.add(G.torus, toon('#D07088'), 0, -0.19 - i * 0.03, 0, PI / 2, 0, 0, 0.036, 0.036, 0.04);
    b.add(G.torus, toon('#D07088'), 0, 0.23, 0, PI / 2, 0, 0, 0.165, 0.165, 0.08);
  },
  cloth: (b) => {
    const t1 = toon('#FFFFFF', { map: blockPrint('h', C.haldi, C.sindoor), key: 'bp-h' });
    const t2 = toon('#FFFFFF', { map: blockPrint('t', C.teal, C.cream), key: 'bp-t' });
    const t3 = toon('#FFFFFF', { map: blockPrint('r', C.rose, C.cream), key: 'bp-r' });
    b.add(GEO.rboxSoft, t1, 0, -0.1, 0, 0, 0.1, 0, 0.42, 0.07, 0.22);
    b.add(GEO.rboxSoft, t2, 0.01, -0.02, 0, 0, -0.08, 0, 0.42, 0.07, 0.22);
    b.add(GEO.rboxSoft, t3, -0.01, 0.06, 0, 0, 0.05, 0, 0.42, 0.07, 0.22);
    b.add(G.cyl, toon(C.white), 0.12, 0.1, 0, 0, 0, 0, 0.025, 0.02, 0.025); // snap button
  },
  kit: (b) => {
    b.add(new RoundedBoxGeometry(0.46, 0.32, 0.18, 3, 0.07), toon('#FFFFFF', { map: kitLabel(), key: 'kitLabel' }), 0, 0, 0);
    b.add(G.box, toon(C.sindoor), 0, 0.165, 0, 0, 0, 0, 0.4, 0.02, 0.04); // zip
    b.add(G.box, toon(C.haldi), 0.16, 0.18, 0.02, 0, 0, 0, 0.03, 0.05, 0.015); // zip pull
    b.add(GEO.pouch, toon('#F0A9B3'), -0.08, 0.2, -0.03, PI / 2, 0, 0.3, 0.45, 0.45, 0.45); // pad peeking out
    b.add(G.box, toon(C.white), 0.09, 0.21, -0.02, 0, 0, -0.2, 0.1, 0.12, 0.03); // tissue
  },
  water: (b) => {
    b.add(GEO.drop, toon('#6FB7C9', { opacity: 0.88 }), 0, 0, 0);
    b.add(G.sphereLo, toon(C.white, { opacity: 0.9 }), -0.07, 0.0, 0.12, 0, 0, 0, 0.03, 0.06, 0.02);
    b.add(G.sphereLo, toon(C.white, { opacity: 0.9 }), -0.05, -0.1, 0.13, 0, 0, 0, 0.015);
  },
  // ---------------- hygiene hazards (unsafe practices)
  unwashed_cloth: (b, x) => {
    b.add(CRUMPLE[0], toon('#8C8A6A'), 0, -0.05, 0, 0, 0, 0, 0.25, 0.14, 0.2);
    b.add(CRUMPLE[1], toon('#7C7A5C'), 0.12, 0.02, 0.05, 0.5, 0, 0, 0.13, 0.09, 0.12);
    for (const [px, py, pz] of [[0.05, 0.05, 0.15], [-0.12, 0.0, 0.1], [0.15, -0.05, -0.1]]) {
      b.add(G.sphereLo, toon('#5E4A33'), px, py, pz, 0, 0, 0, 0.04, 0.02, 0.04);
    }
    flies(x, 0.15, 3, 0.3);
    stinkLines(x, 0.15);
  },
  damp_cloth: (b, x) => {
    const wet = toon('#5F7280');
    b.add(G.cylLo, toon('#8B6A45'), 0, 0.2, 0, 0, 0, PI / 2, 0.02, 0.5, 0.02);
    b.add(GEO.rboxSoft, wet, 0, 0.0, 0, 0, 0, 0, 0.34, 0.38, 0.04);
    b.add(G.circle, toon('#7FA6B8', { opacity: 0.7 }), 0, -0.44, 0, -PI / 2, 0, 0, 0.26, 0.26, 0.26);
    const drips = new THREE.Group();
    const dm = toon('#8FC3D6');
    for (let i = 0; i < 3; i++) { const d = new THREE.Mesh(G.sphereLo, dm); d.scale.set(0.022, 0.035, 0.022); drips.add(d); }
    x.group.add(drips);
    x.updates.push((t) => drips.children.forEach((d, i) => {
      const p = (t * 1.2 + i * 0.33) % 1;
      d.position.set((i - 1) * 0.1, -0.2 - p * 0.24, 0);
    }));
  },
  stored_used: (b, x) => {
    b.add(G.box, toon('#9B7A55'), 0, -0.18, 0, 0, 0, 0, 0.44, 0.14, 0.3);
    b.add(G.box, toon('#8A6A48'), 0.0, -0.08, 0.17, -0.6, 0, 0, 0.44, 0.02, 0.18);
    b.add(G.cyl, toon('#C9BFA8'), 0, 0.0, 0, 0, 0, PI / 2, 0.08, 0.3, 0.08);
    b.add(G.cyl, toon('#A39882'), 0, 0.0, 0, 0, 0, PI / 2, 0.05, 0.31, 0.05);
    flies(x, 0.2, 3, 0.28);
    stinkLines(x, 0.2);
  },
  unclean_product: (b, x) => {
    b.add(GEO.pouch, toon('#AE9792'), 0, 0, 0, PI / 2 - 0.2, 0, 0.3);
    b.add(CRUMPLE[2], toon('#BBA5A0'), 0.17, 0.12, 0.02, 0, 0, 0, 0.08, 0.04, 0.06); // torn flap
    const r = seededRandom(21);
    for (let i = 0; i < 9; i++) b.add(G.sphereLo, toon('#5B4634'), (r() - 0.5) * 0.36, (r() - 0.5) * 0.3, 0.06, 0, 0, 0, 0.018);
    for (let i = 0; i < 4; i++) b.add(G.sphereLo, toon('#B8AE9C', { opacity: 0.55 }), (r() - 0.5) * 0.5, -0.22 + r() * 0.1, (r() - 0.5) * 0.3, 0, 0, 0, 0.07 + r() * 0.05);
    flies(x, 0.1, 2, 0.32);
  },
  bad_disposal: (b, x) => {
    b.add(G.box, toon('#5E5A57'), 0, -0.24, 0, 0, 0, 0, 0.5, 0.03, 0.4);
    for (let i = -2; i <= 2; i++) b.add(G.box, toon('#3B3735'), i * 0.09, -0.22, 0, 0, 0, 0, 0.03, 0.03, 0.38);
    b.add(CRUMPLE[1], toon('#D2CCBF'), 0.02, -0.1, 0, 0, 0, 0, 0.15, 0.09, 0.12);
    b.add(CRUMPLE[0], toon('#BFB7A7'), -0.15, -0.16, 0.1, 0, 0, 0, 0.07, 0.05, 0.06);
    flies(x, -0.02, 3, 0.25);
    stinkLines(x, 0.05);
  },
  // ---------------- junk food (small hazards)
  burger: (b) => burger(b, 1.05),
  pizza: (b) => {
    const tri = new THREE.Shape();
    tri.moveTo(0, -0.22); tri.lineTo(0.17, 0.16); tri.quadraticCurveTo(0, 0.22, -0.17, 0.16); tri.closePath();
    b.add(extrude(tri, 0.035, 0.01), toon('#F2C14E'), 0, 0, 0);
    b.add(G.cyl, toon('#C88A45'), 0, 0.17, 0, 0, 0, PI / 2, 0.035, 0.36, 0.035);
    for (const [px, py] of [[0, 0.05], [-0.06, 0.1], [0.06, 0.1], [0.0, -0.06]]) b.add(G.cyl, toon('#B23A2A'), px, py, 0.03, PI / 2, 0, 0, 0.035, 0.012, 0.035);
  },
  fries: (b) => {
    const box = lathe([[0, -0.15], [0.12, -0.15], [0.16, 0.08], [0, 0.08]], 4);
    b.add(box, toon(C.sindoor), 0, -0.04, 0, 0, PI / 4, 0, 1, 1, 0.7);
    const r = seededRandom(4);
    for (let i = 0; i < 9; i++) b.add(G.box, toon('#F2C64F'), (r() - 0.5) * 0.18, 0.08 + r() * 0.06, (r() - 0.5) * 0.08, (r() - 0.5) * 0.4, 0, (r() - 0.5) * 0.4, 0.03, 0.22, 0.03);
    b.add(G.circle, toon(C.cream), 0, -0.02, 0.085, 0, 0, 0, 0.04);
  },
  donut: (b) => {
    b.add(new THREE.TorusGeometry(0.14, 0.07, 10, 20), toon('#D8A060'), 0, 0, 0, PI / 2, 0, 0);
    b.add(new THREE.TorusGeometry(0.14, 0.06, 10, 20, PI * 2), toon('#E58BA0'), 0, 0.025, 0, PI / 2, 0, 0, 1, 1, 0.8);
    const r = seededRandom(8);
    const cols = [C.haldi, C.teal, C.cream, C.indigo];
    for (let i = 0; i < 12; i++) {
      const a = r() * PI * 2;
      b.add(G.box, toon(cols[i % 4]), Math.cos(a) * 0.14, 0.08, Math.sin(a) * 0.14, 0, r() * 3, 0, 0.03, 0.01, 0.01);
    }
  },
  soda: (b) => {
    b.add(GEO.can, toon('#C4452E'), 0, 0, 0, 0, 0, 0, 1.2);
    b.add(G.torus, toon(C.cream), 0, 0.02, 0, PI / 2, 0, 0.3, 0.14, 0.14, 0.12);
    b.add(G.cyl, toon(C.steel), 0, 0.26, 0, 0, 0, 0, 0.1, 0.02, 0.1);
    b.add(G.cylLo, toon('#E58BA0'), 0.03, 0.34, 0, 0, 0, 0.2, 0.012, 0.18, 0.012);
  },
  candy: (b) => {
    b.add(G.sphere, toon('#E58BA0'), 0, 0, 0, 0, 0, 0, 0.12, 0.12, 0.12);
    b.add(G.torus, toon(C.cream), 0, 0, 0, 0, PI / 2, 0, 0.12, 0.12, 0.16);
    b.add(G.cone, toon('#F0B0C0'), 0.17, 0, 0, 0, 0, PI / 2, 0.08, 0.12, 0.08);
    b.add(G.cone, toon('#F0B0C0'), -0.17, 0, 0, 0, 0, -PI / 2, 0.08, 0.12, 0.08);
  },
  // ---------------- power-up icons (wrapped in an orb by makePowerUp)
  pu_shield: (b) => {
    b.add(GEO2.shield, toon('#4F86C6'), 0, 0, 0);
    b.add(GEO2.pad, toon(C.white), 0, 0, 0.05, 0, 0, 0, 0.75);
  },
  pu_hygieneMagnet: (b) => { magnet(b, C.rose); b.add(GEO2.pad, toon(C.white), 0, 0.02, 0.06, 0, 0, 0, 0.45); },
  pu_foodMagnet: (b) => { magnet(b, C.neem); b.add(G.sphere, toon('#C9392A'), 0, 0.02, 0.06, 0, 0, 0, 0.06); },
  pu_knowledge: (b) => {
    b.add(G.box, toon(C.haldi), -0.1, 0, 0, 0, 0.35, 0, 0.2, 0.26, 0.025);
    b.add(G.box, toon(C.haldi), 0.1, 0, 0, 0, -0.35, 0, 0.2, 0.26, 0.025);
    b.add(G.box, toon(C.cream), -0.09, 0, 0.018, 0, 0.35, 0, 0.17, 0.23, 0.01);
    b.add(G.box, toon(C.cream), 0.09, 0, 0.018, 0, -0.35, 0, 0.17, 0.23, 0.01);
    b.add(GEO2.star, toon('#F6C453'), 0, 0.2, 0.05, 0, 0, 0, 0.45);
  },
  pu_confidence: (b) => {
    b.add(GEO2.star, toon(C.sindoor), 0, 0, 0, 0, 0, 0, 1.1);
    b.add(GEO2.star, toon(C.haldi), 0, 0, 0.04, 0, 0, 0, 0.6);
  },
  pu_preparation: (b) => {
    b.add(new RoundedBoxGeometry(0.3, 0.34, 0.16, 3, 0.06), toon(C.teal), 0, 0, 0);
    b.add(new RoundedBoxGeometry(0.31, 0.12, 0.17, 2, 0.04), toon(C.haldi), 0, 0.12, 0);
    b.add(G.box, toon(C.white), 0, -0.04, 0.085, 0, 0, 0, 0.12, 0.035, 0.01);
    b.add(G.box, toon(C.white), 0, -0.04, 0.085, 0, 0, 0, 0.035, 0.12, 0.01);
  },
  pu_protein: (b) => {
    b.add(GEO.egg, toon('#F6EEDC'), 0, 0, 0, 0, 0, 0, 1.0);
    b.add(G.torus, toon(C.haldi), 0, 0, 0, 0, 0, 0, 0.2, 0.2, 0.4);
  },
  pu_energy: (b) => { b.add(GEO2.bolt, toon('#F0B232'), 0, 0, 0, 0, 0, 0, 1.2); },
  pu_superJump: (b) => {
    b.add(new RoundedBoxGeometry(0.34, 0.07, 0.14, 2, 0.03), toon(C.sindoor), 0, -0.08, 0, 0, 0, 0.1);
    b.add(G.box, toon('#8E2E1E'), 0, -0.03, 0, 0, 0, 0.1, 0.06, 0.05, 0.15);
    for (const s of [1, -1]) {
      b.add(G.sphere, toon(C.white), 0.02, 0.06, s * 0.1, s * 0.5, 0, -0.5, 0.14, 0.03, 0.06);
      b.add(G.sphere, toon(C.cream), 0.07, 0.1, s * 0.1, s * 0.5, 0, -0.7, 0.1, 0.025, 0.05);
    }
    for (let i = 0; i < 3; i++) b.add(G.torus, toon(C.indigo), 0, -0.15 - i * 0.04, 0, PI / 2, 0, 0, 0.06, 0.06, 0.12);
  },
  // ---------------- big obstacles: LOW (jump)
  ob_charpai: (b) => {
    const wood = toon('#6E4527');
    b.add(G.box, toon('#FFFFFF', { map: weaveTexture(), key: 'weave' }), 0, 0.6, 0, 0, 0, 0, 1.8, 0.05, 1.0);
    for (const sx of [-1, 1]) {
      b.add(G.box, wood, sx * 0.92, 0.6, 0, 0, 0, 0, 0.08, 0.1, 1.08);
      for (const sz of [-1, 1]) {
        b.add(G.cyl, wood, sx * 0.9, 0.32, sz * 0.5, 0, 0, 0, 0.055, 0.64, 0.055);
        b.add(G.sphereLo, wood, sx * 0.9, 0.08, sz * 0.5, 0, 0, 0, 0.07);
      }
    }
    for (const sz of [-1, 1]) b.add(G.box, wood, 0, 0.6, sz * 0.52, 0, 0, 0, 1.9, 0.1, 0.08);
  },
  ob_burger: (b) => { burger(b, 3.6, 0.48); },
  ob_basket: (b, x) => {
    b.add(G.cyl, toon('#FFFFFF', { map: weaveTexture(), key: 'weave' }), 0, 0.32, 0, 0, 0, 0, 0.75, 0.64, 0.55);
    b.add(G.torus, toon('#9C7A4B'), 0, 0.64, 0, PI / 2, 0, 0, 0.75, 0.55, 0.3);
    b.add(CRUMPLE[0], toon('#8C8A6A'), 0.1, 0.72, 0, 0, 0, 0, 0.55, 0.22, 0.4);
    b.add(CRUMPLE[1], toon('#7A785B'), -0.3, 0.78, 0.1, 0, 0, 0, 0.3, 0.16, 0.25);
    b.add(CRUMPLE[2], toon('#96937A'), 0.4, 0.74, -0.1, 0, 0, 0, 0.25, 0.14, 0.2);
    for (const [px, pz] of [[-0.1, 0.25], [0.3, 0.2], [-0.4, -0.1]]) b.add(G.sphereLo, toon('#5E4A33'), px, 0.85, pz, 0, 0, 0, 0.07, 0.03, 0.07);
    flies(x, 1.0, 4, 0.5);
    stinkLines(x, 1.05);
  },
  ob_bin: (b, x) => {
    b.add(GEO.barrel, toon('#5F6E66'), 0, 0, 0, 0, 0, 0, 1.2, 1.0, 1.0);
    b.add(G.torus, toon('#4C5952'), 0, 0.8, 0, PI / 2, 0, 0, 0.57, 0.48, 0.3);
    for (let i = 0; i < 6; i++) {
      const a = i * 1.2;
      b.add(CRUMPLE[i % 3], toon(i % 2 ? '#D2CCBF' : '#B9B09C'), Math.cos(a) * 0.3, 0.86 + (i % 2) * 0.06, Math.sin(a) * 0.25, 0, 0, 0, 0.16, 0.1, 0.13);
    }
    b.add(CRUMPLE[1], toon('#C9C1AF'), 0.75, 0.08, 0.3, 0, 0, 0, 0.14, 0.08, 0.12);
    b.add(CRUMPLE[2], toon('#B7AE9A'), -0.7, 0.07, -0.2, 0, 0, 0, 0.12, 0.07, 0.1);
    flies(x, 1.1, 4, 0.45);
    stinkLines(x, 1.1);
  },
  ob_planter: (b) => {
    b.add(new RoundedBoxGeometry(1.8, 0.55, 0.8, 2, 0.06), toon(C.terracotta), 0, 0.28, 0);
    b.add(G.box, toon(C.brick), 0, 0.5, 0, 0, 0, 0, 1.84, 0.08, 0.84);
    b.add(G.box, toon('#5A4030'), 0, 0.55, 0, 0, 0, 0, 1.7, 0.04, 0.7);
    const r = seededRandom(2);
    for (let i = 0; i < 12; i++) {
      const px = -0.75 + (i % 6) * 0.3, pz = i < 6 ? -0.18 : 0.18;
      b.add(G.ico, toon(C.leaf), px, 0.68, pz, 0, 0, 0, 0.15);
      b.add(G.ico, toon(r() > 0.5 ? '#E8892B' : C.haldi), px + 0.03, 0.82, pz, 0, 0, 0, 0.09);
    }
  },
  // ---------------- big obstacles: HIGH (slide under)
  ob_clothesline: (b, x) => {
    const bamboo = toon('#B8995A');
    for (const s of [-1, 1]) {
      b.add(G.cyl, bamboo, s * 1.0, 1.25, 0, 0, 0, 0, 0.04, 2.5, 0.04);
      b.add(G.box, toon('#4A3A2A'), s * 1.0, 0.03, 0, 0, 0, 0, 0.3, 0.06, 0.3);
    }
    b.add(G.cylLo, toon('#E6DCC6'), 0, 2.25, 0, 0, 0, PI / 2, 0.012, 2.0, 0.012);
    const cloths: [number, string][] = [[-0.62, '#5F7280'], [-0.1, '#6A6F78'], [0.45, '#57707A']];
    for (const [cx, col] of cloths) {
      b.add(GEO.rboxSoft, toon(col), cx, 1.72, 0, 0, 0, 0, 0.42, 1.0, 0.04);
      b.add(G.box, toon('#C8B79A'), cx, 2.25, 0, 0, 0, 0, 0.05, 0.08, 0.06); // peg
    }
    const drips = new THREE.Group();
    const dm = toon('#8FC3D6');
    for (let i = 0; i < 6; i++) { const d = new THREE.Mesh(G.sphereLo, dm); d.scale.set(0.03, 0.045, 0.03); drips.add(d); }
    x.group.add(drips);
    x.updates.push((t) => drips.children.forEach((d, i) => {
      const p = (t * 0.9 + i * 0.17) % 1;
      d.position.set(cloths[i % 3][0] + ((i % 2) - 0.5) * 0.2, 1.2 - p * 1.1, 0);
    }));
    b.add(G.circle, toon('#7FA6B8', { opacity: 0.6 }), 0, 0.02, 0, -PI / 2, 0, 0, 0.9, 0.5, 1);
  },
  ob_banner: (b) => {
    const pole = toon(C.ink);
    for (const s of [-1, 1]) b.add(G.cyl, pole, s * 1.0, 1.25, 0, 0, 0, 0, 0.045, 2.5, 0.045);
    b.add(G.box, toon('#FFFFFF', { map: textBoard('bannerA', ['Periods are normal!'], C.haldi, C.ink, 512, 128, C.sindoor), key: 'bannerA' }), 0, 1.75, 0, 0, 0, 0, 2.0, 0.9, 0.06);
    // toran flags
    for (let i = 0; i < 9; i++) {
      const cols = [C.sindoor, C.teal, C.haldi];
      b.add(G.cone, toon(cols[i % 3]), -0.9 + i * 0.225, 2.15, 0.05, PI, 0, 0, 0.09, 0.18, 0.02);
    }
  },
  ob_candy: (b) => {
    for (const s of [-1, 1]) b.add(G.cyl, toon('#E58BA0'), s * 1.0, 1.25, 0, 0, 0, 0, 0.06, 2.5, 0.06);
    b.add(G.cylLo, toon(C.cream), 0, 2.2, 0, 0, 0, PI / 2, 0.02, 2.0, 0.02);
    for (let i = 0; i < 5; i++) {
      const px = -0.8 + i * 0.4;
      b.add(G.sphere, toon(i % 2 ? '#E58BA0' : '#9CC9C2'), px, 1.62, 0, 0, 0, 0, 0.2);
      b.add(G.cone, toon(i % 2 ? '#F0B0C0' : '#BFE0DA'), px, 1.38, 0, PI, 0, 0, 0.1, 0.18, 0.1);
      b.add(G.cone, toon(i % 2 ? '#F0B0C0' : '#BFE0DA'), px, 1.86, 0, 0, 0, 0, 0.1, 0.18, 0.1);
      b.add(G.cylLo, toon(C.cream), px, 2.02, 0, 0, 0, 0, 0.01, 0.2, 0.01);
    }
    b.add(G.box, toon('#FFFFFF', { map: textBoard('candyB', ['Sweet treats? Sometimes!'], C.cream, C.sindoor, 512, 96), key: 'candyB' }), 0, 2.4, 0, 0, 0, 0, 2.0, 0.3, 0.04);
  },
  ob_branch: (b) => {
    const wood = toon('#6E4F35');
    b.add(G.cyl, wood, 0, 1.55, 0, 0, 0, PI / 2 + 0.05, 0.14, 2.4, 0.14);
    b.add(G.cyl, wood, 1.15, 0.8, 0, 0, 0, 0, 0.18, 1.6, 0.18);
    for (let i = 0; i < 9; i++) {
      b.add(G.ico, toon(i % 2 ? C.leaf : C.leafDark), -1.0 + i * 0.26, 1.85 + Math.sin(i * 2) * 0.12, (i % 3 - 1) * 0.2, 0, 0, 0, 0.32);
    }
  },
  // ---------------- big obstacles: BLOCK (switch lanes)
  ob_stall: (b) => {
    const wood = toon('#8A5A3A');
    b.add(new RoundedBoxGeometry(1.8, 1.0, 1.4, 2, 0.06), toon(C.sindoor), 0, 0.5, 0);
    b.add(G.box, toon(C.cream), 0, 1.02, 0, 0, 0, 0, 1.86, 0.06, 1.46);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) b.add(G.cyl, wood, sx * 0.85, 1.6, sz * 0.65, 0, 0, 0, 0.04, 1.2, 0.04);
    b.add(G.box, toon('#FFFFFF', { map: awningTex(C.sindoor, C.cream), key: 'awn1' }), 0, 2.25, 0.1, 0.25, 0, 0, 2.1, 0.06, 1.7);
    b.add(G.box, toon('#FFFFFF', { map: textBoard('stallSign', ['SNACKS'], C.haldi, C.ink, 256, 96), key: 'stallSign' }), 0, 2.55, -0.6, 0, 0, 0, 1.4, 0.4, 0.05);
    burger(b, 1.1, 1.18);
    b.add(G.box, toon(C.sindoor), 0.55, 1.15, 0.2, 0, 0.7, 0, 0.2, 0.22, 0.15);
    sodaBottle(b, -0.55, 1.28, 0.1, 0.9);
    sodaBottle(b, -0.35, 1.28, 0.2, 0.9);
    b.add(G.cylLo, toon('#2A1E18'), -0.6, 0.06, 0.75, PI / 2, 0, 0, 0.18, 0.08, 0.18);
    b.add(G.cylLo, toon('#2A1E18'), 0.6, 0.06, 0.75, PI / 2, 0, 0, 0.18, 0.08, 0.18);
  },
  ob_auto: (b) => {
    const green = toon('#5C8A4C');
    const yellow = toon('#E8B93A');
    b.add(new RoundedBoxGeometry(1.5, 0.75, 2.4, 3, 0.15), green, 0, 0.62, 0);
    b.add(new RoundedBoxGeometry(1.55, 0.18, 2.5, 2, 0.08), toon(C.black), 0, 1.92, -0.05);
    b.add(new RoundedBoxGeometry(1.45, 0.95, 1.2, 2, 0.12), yellow, 0, 1.4, -0.45);
    b.add(G.box, toon('#9CC3D6', { opacity: 0.85 }), 0, 1.45, 0.42, -0.25, 0, 0, 1.3, 0.75, 0.04);
    for (const s of [-1, 1]) b.add(G.cyl, toon(C.black), s * 0.68, 1.35, 0.45, 0, 0, 0, 0.04, 1.0, 0.04);
    b.add(G.cyl, toon('#1E1A18'), 0, 0.28, 1.05, 0, 0, PI / 2, 0.28, 0.2, 0.28);
    for (const s of [-1, 1]) b.add(G.cyl, toon('#1E1A18'), s * 0.72, 0.28, -0.75, 0, 0, PI / 2, 0.28, 0.18, 0.28);
    b.add(G.sphereLo, toon('#FFF3C2', { emissive: '#FFE38A', emissiveIntensity: 0.6 }), 0, 0.85, 1.2, 0, 0, 0, 0.09);
    b.add(G.box, toon(C.black), 0, 0.98, 1.0, 0, 0, 0, 0.8, 0.08, 0.3);
  },
  ob_thela: (b) => {
    const wood = toon('#8A5A3A');
    b.add(G.box, wood, 0, 0.75, 0, 0, 0, 0, 1.7, 0.1, 2.0);
    for (const s of [-1, 1]) b.add(G.cyl, toon('#3A2A20'), s * 0.88, 0.38, 0, 0, 0, PI / 2, 0.38, 0.08, 0.38);
    b.add(G.cyl, wood, 0, 0.75, 1.3, PI / 2, 0, 0, 0.04, 0.8, 0.04);
    for (let cx = -1; cx <= 1; cx += 2) for (let cz = -1; cz <= 1; cz += 2) {
      b.add(G.box, toon(C.indigo), cx * 0.4, 1.05, cz * 0.45, 0, 0, 0, 0.75, 0.5, 0.8);
      for (let i = 0; i < 4; i++) sodaBottle(b, cx * 0.4 + ((i % 2) - 0.5) * 0.35, 1.5, cz * 0.45 + (Math.floor(i / 2) - 0.5) * 0.35, 1.2);
    }
    b.add(G.box, toon(C.indigo), 0, 1.75, 0, 0, 0, 0, 1.0, 0.5, 0.8);
    for (let i = 0; i < 4; i++) sodaBottle(b, ((i % 2) - 0.5) * 0.35, 2.2, (Math.floor(i / 2) - 0.5) * 0.35, 1.2);
  },
  ob_board: (b) => {
    b.add(G.box, toon(C.teal), 0, 1.4, 0, 0, 0, 0, 1.9, 1.3, 0.12);
    b.add(G.box, toon('#FFFFFF', { map: chalkboard(), key: 'chalk' }), 0, 1.4, 0.065, 0, 0, 0, 1.7, 1.1, 0.01);
    b.add(G.box, toon('#FFFFFF', { map: chalkboard(), key: 'chalk' }), 0, 1.4, -0.065, 0, PI, 0, 1.7, 1.1, 0.01);
    for (const s of [-1, 1]) b.add(G.box, toon(C.ink), s * 0.8, 0.4, 0, 0, 0, 0, 0.1, 0.8, 0.5);
    b.add(G.box, toon(C.terracotta), 0, 2.12, 0, 0, 0, 0, 2.0, 0.14, 0.2);
  },
  ob_rock: (b) => {
    b.add(CRUMPLE[2], toon('#9A8B7A'), 0, 0.9, 0, 0, 0, 0, 1.0, 0.95, 0.9);
    b.add(CRUMPLE[0], toon('#8A7B6B'), 0.5, 0.4, 0.3, 0, 0, 0, 0.5, 0.4, 0.45);
    b.add(G.circle, toon(C.haldi), 0, 1.1, 0.88, 0, 0, 0, 0.25);
    b.add(G.circle, toon(C.sindoor), 0, 1.1, 0.89, 0, 0, 0, 0.12);
    for (let i = 0; i < 8; i++) { const a = (i / 8) * PI * 2; b.add(G.circle, toon(C.cream), Math.cos(a) * 0.36, 1.1 + Math.sin(a) * 0.36, 0.86, 0, 0, 0, 0.05); }
  },
  ob_hedge: (b) => {
    b.add(new RoundedBoxGeometry(1.85, 2.0, 1.4, 3, 0.4), toon(C.leafDark), 0, 1.0, 0);
    const r = seededRandom(17);
    for (let i = 0; i < 10; i++) b.add(G.ico, toon(C.leaf), (r() - 0.5) * 1.6, 0.4 + r() * 1.6, 0.6 + r() * 0.12, 0, 0, 0, 0.18);
    for (let i = 0; i < 6; i++) b.add(G.ico, toon(r() > 0.5 ? C.rose : C.cream), (r() - 0.5) * 1.5, 0.5 + r() * 1.3, 0.72, 0, 0, 0, 0.07);
  },
};

export const MODEL_IDS = Object.keys(MAKERS);

/** Build a model by id. Returned group has userData.update(t) if animated. */
export function createModel(id: string): THREE.Group {
  const maker = MAKERS[id];
  const group = new THREE.Group();
  if (!maker) {
    console.warn('missing model', id);
    return group;
  }
  const b = new Builder();
  const extras: Extras = { group, updates: [] };
  maker(b, extras);
  const isBig = id.startsWith('ob_');
  const merged = b.build({ castShadow: isBig });
  group.add(merged);
  if (extras.updates.length) {
    const ups = extras.updates;
    group.userData.update = (t: number) => { for (const u of ups) u(t); };
  }
  return group;
}

/** Power-up: icon inside a glowing ring. */
export function createPowerUp(id: string, color: string): THREE.Group {
  const group = new THREE.Group();
  const icon = createModel(`pu_${id}`);
  icon.scale.setScalar(1.35);
  group.add(icon);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.035, 8, 32), toon(color, { emissive: color, emissiveIntensity: 0.35 }));
  group.add(ring);
  const halo = new THREE.Mesh(G.circle, flat(color, 0.18, 'halo'));
  halo.scale.setScalar(0.42);
  halo.position.z = -0.02;
  group.add(halo);
  group.userData.update = (t: number) => {
    ring.rotation.y = t * 2.5;
    ring.rotation.x = Math.sin(t * 1.5) * 0.3;
    halo.scale.setScalar(0.4 + Math.sin(t * 4) * 0.02);
  };
  return group;
}
