import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

// The Aangan palette from the Devi storyboard.
export const C = {
  chandan: '#F2E6CF',
  haldi: '#E2A93B',
  terracotta: '#B8643F',
  sindoor: '#C4452E',
  indigo: '#2F4A73',
  neem: '#7E9A6E',
  teal: '#3F6E68',
  rose: '#C66161',
  ink: '#3A2420',
  // extensions that stay inside the same family
  cream: '#FAF3E3',
  skin: '#C98454',
  skinShade: '#B06F43',
  hair: '#26160F',
  leaf: '#5E7F4E',
  leafDark: '#486A3E',
  sky: '#A9D3E6',
  steel: '#C8CCCF',
  white: '#FBF7EE',
  black: '#1E1512',
  sand: '#E7D3AE',
  brick: '#A9583A',
} as const;

let gradientMap: THREE.DataTexture | null = null;
function toonGradient() {
  if (!gradientMap) {
    const data = new Uint8Array([110, 170, 220, 255]);
    gradientMap = new THREE.DataTexture(data, data.length, 1, THREE.RedFormat);
    gradientMap.minFilter = THREE.NearestFilter;
    gradientMap.magFilter = THREE.NearestFilter;
    gradientMap.generateMipmaps = false;
    gradientMap.needsUpdate = true;
  }
  return gradientMap;
}

const cache = new Map<string, THREE.Material>();

export interface MatOpts {
  emissive?: string;
  emissiveIntensity?: number;
  transparent?: boolean;
  opacity?: number;
  map?: THREE.Texture;
  key?: string;
  side?: THREE.Side;
  depthWrite?: boolean;
}

/** Shared cel-shaded material. Same args → same material instance. */
export function toon(color: string, o: MatOpts = {}): THREE.MeshToonMaterial {
  const key = `${color}|${o.emissive ?? ''}|${o.emissiveIntensity ?? ''}|${o.opacity ?? ''}|${o.key ?? ''}|${o.side ?? ''}`;
  let m = cache.get(key) as THREE.MeshToonMaterial | undefined;
  if (!m) {
    m = new THREE.MeshToonMaterial({
      color: new THREE.Color(color),
      gradientMap: toonGradient(),
      map: o.map ?? null,
      transparent: o.transparent ?? (o.opacity !== undefined && o.opacity < 1),
      opacity: o.opacity ?? 1,
      side: o.side ?? THREE.FrontSide,
      depthWrite: o.depthWrite ?? true,
    });
    if (o.emissive) {
      m.emissive = new THREE.Color(o.emissive);
      m.emissiveIntensity = o.emissiveIntensity ?? 1;
    }
    cache.set(key, m);
  }
  return m;
}

/** Flat unlit material for things like glows, eyes highlights. */
export function flat(color: string, opacity = 1, key = ''): THREE.MeshBasicMaterial {
  const k = `flat|${color}|${opacity}|${key}`;
  let m = cache.get(k) as THREE.MeshBasicMaterial | undefined;
  if (!m) {
    m = new THREE.MeshBasicMaterial({ color: new THREE.Color(color), transparent: opacity < 1, opacity, depthWrite: opacity >= 1 });
    cache.set(k, m);
  }
  return m;
}

// ---------------------------------------------------------------------------
// Geometry builder: collect primitives by material, then merge into one mesh per
// material. Keeps draw calls low for scenery and props.

let vcMaterial: THREE.MeshToonMaterial | null = null;
/** One shared cel material that reads colour from vertex colours. */
export function vertexColorMaterial() {
  if (!vcMaterial) vcMaterial = new THREE.MeshToonMaterial({ vertexColors: true, gradientMap: toonGradient() });
  return vcMaterial;
}

/** Opaque, untextured, non-emissive toon materials can be baked into vertex colours. */
export function isPlain(m: THREE.Material | THREE.Material[]): m is THREE.MeshToonMaterial {
  return (m as THREE.MeshToonMaterial).isMeshToonMaterial === true
    && !(m as THREE.MeshToonMaterial).map && !(m as THREE.MeshToonMaterial).transparent
    && !(m as THREE.MeshToonMaterial).vertexColors
    && (m as THREE.MeshToonMaterial).emissive.getHex() === 0
    && (m as THREE.MeshToonMaterial).side === THREE.FrontSide;
}

function withColor(g: THREE.BufferGeometry, c: THREE.Color) {
  const n = g.attributes.position.count;
  const arr = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { arr[i * 3] = c.r; arr[i * 3 + 1] = c.g; arr[i * 3 + 2] = c.b; }
  g.setAttribute('color', new THREE.BufferAttribute(arr, 3));
}

const tmpM = new THREE.Matrix4();
const tmpQ = new THREE.Quaternion();
const tmpE = new THREE.Euler();
const tmpV = new THREE.Vector3();
const tmpS = new THREE.Vector3();

function normalise(g: THREE.BufferGeometry) {
  const geo = g.index ? g.toNonIndexed() : g.clone();
  for (const name of Object.keys(geo.attributes)) {
    if (name !== 'position' && name !== 'normal' && name !== 'uv' && name !== 'color') geo.deleteAttribute(name);
  }
  if (!geo.attributes.uv) {
    const count = geo.attributes.position.count;
    geo.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(count * 2), 2));
  }
  if (!geo.attributes.normal) geo.computeVertexNormals();
  return geo;
}

export class Builder {
  private parts = new Map<THREE.Material, THREE.BufferGeometry[]>();

  add(
    geo: THREE.BufferGeometry, mat: THREE.Material,
    x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, sx = 1, sy = sx, sz = sx,
  ) {
    const g = normalise(geo);
    tmpQ.setFromEuler(tmpE.set(rx, ry, rz));
    tmpM.compose(tmpV.set(x, y, z), tmpQ, tmpS.set(sx, sy, sz));
    g.applyMatrix4(tmpM);
    return this.push(g, mat);
  }

  private push(g: THREE.BufferGeometry, mat: THREE.Material) {
    if (isPlain(mat)) {
      withColor(g, mat.color);
      mat = vertexColorMaterial();
    }
    let list = this.parts.get(mat);
    if (!list) this.parts.set(mat, (list = []));
    list.push(g);
    return this;
  }

  /** Add a geometry with an explicit matrix. */
  addMatrix(geo: THREE.BufferGeometry, mat: THREE.Material, m: THREE.Matrix4) {
    const g = normalise(geo);
    g.applyMatrix4(m);
    return this.push(g, mat);
  }

  build(opts: { castShadow?: boolean; receiveShadow?: boolean } = {}): THREE.Group {
    const group = new THREE.Group();
    for (const [mat, geos] of this.parts) {
      const merged = mergeGeometries(geos, false);
      geos.forEach((g) => g.dispose());
      if (!merged) continue;
      merged.computeBoundingSphere();
      const mesh = new THREE.Mesh(merged, mat);
      mesh.castShadow = !!opts.castShadow;
      mesh.receiveShadow = !!opts.receiveShadow;
      mesh.matrixAutoUpdate = false;
      mesh.updateMatrix();
      group.add(mesh);
    }
    this.parts.clear();
    return group;
  }
}

// ---------------------------------------------------------------------------
// Shared primitive geometries (unit sized; scale via Builder)

export const G = {
  box: new THREE.BoxGeometry(1, 1, 1),
  sphere: new THREE.SphereGeometry(1, 16, 12),
  sphereLo: new THREE.SphereGeometry(1, 10, 8),
  cyl: new THREE.CylinderGeometry(1, 1, 1, 14),
  cylLo: new THREE.CylinderGeometry(1, 1, 1, 8),
  cone: new THREE.ConeGeometry(1, 1, 14),
  coneLo: new THREE.ConeGeometry(1, 1, 7),
  ico: new THREE.IcosahedronGeometry(1, 1),
  ico0: new THREE.IcosahedronGeometry(1, 0),
  plane: new THREE.PlaneGeometry(1, 1),
  circle: new THREE.CircleGeometry(1, 20),
  torus: new THREE.TorusGeometry(1, 0.25, 8, 20),
};

export function torusArc(radius: number, tube: number, arc: number) {
  return new THREE.TorusGeometry(radius, tube, 6, 16, arc);
}

export function lathe(points: [number, number][], segments = 18) {
  return new THREE.LatheGeometry(points.map(([x, y]) => new THREE.Vector2(x, y)), segments);
}

// ---------------------------------------------------------------------------
// Canvas textures

const texCache = new Map<string, THREE.CanvasTexture>();

export function canvasTexture(
  key: string, w: number, h: number, draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void,
  repeat?: [number, number],
): THREE.CanvasTexture {
  const hit = texCache.get(key);
  if (hit) return hit;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  draw(ctx, w, h);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  if (repeat) {
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(repeat[0], repeat[1]);
  }
  texCache.set(key, tex);
  return tex;
}

/** Small block-print motif used on Devi's kurta (red sprigs on haldi). */
export function kurtaTexture() {
  return canvasTexture('kurta', 256, 256, (ctx, w, h) => {
    ctx.fillStyle = '#EDB43C';
    ctx.fillRect(0, 0, w, h);
    const step = 32;
    for (let y = 0; y < h + step; y += step) {
      for (let x = 0; x < w + step; x += step) {
        const ox = (y / step) % 2 ? step / 2 : 0;
        const cx = x + ox, cy = y;
        ctx.fillStyle = '#D0452C';
        // little four-petal sprig
        for (let i = 0; i < 4; i++) {
          const a = (i * Math.PI) / 2;
          ctx.beginPath();
          ctx.ellipse(cx + Math.cos(a) * 4, cy + Math.sin(a) * 4, 3.4, 2, a, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.fillStyle = '#F6D57E';
        ctx.beginPath();
        ctx.arc(cx, cy, 1.4, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }, [3, 2]);
}

/** Woven charpai / rope weave. */
export function weaveTexture() {
  return canvasTexture('weave', 128, 128, (ctx, w, h) => {
    ctx.fillStyle = '#D9BE8A';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#B08B55';
    ctx.lineWidth = 3;
    for (let i = -h; i < w + h; i += 10) {
      ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i + h, h); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(i + h, 0); ctx.lineTo(i, h); ctx.stroke();
    }
  }, [2, 2]);
}

/** Block-print fabric for cloth pads/bags. */
export function blockPrint(key: string, bg: string, fg: string) {
  return canvasTexture(`bp-${key}`, 128, 128, (ctx, w, h) => {
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = fg;
    for (let y = 8; y < h; y += 20) {
      for (let x = 8 + ((y / 20) % 2) * 10; x < w; x += 20) {
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillRect(x - 0.8, y - 7, 1.6, 4);
        ctx.fillRect(x - 0.8, y + 3, 1.6, 4);
      }
    }
  }, [1, 1]);
}

/** Rangoli mandala drawn procedurally. */
export function drawRangoli(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  const rings: [number, string, number][] = [
    [1.0, C.indigo, 12], [0.78, C.haldi, 12], [0.56, C.sindoor, 8], [0.36, C.haldi, 8],
  ];
  for (const [rr, col, petals] of rings) {
    ctx.fillStyle = col;
    for (let i = 0; i < petals; i++) {
      const a = (i / petals) * Math.PI * 2;
      ctx.save();
      ctx.translate(cx + Math.cos(a) * r * rr * 0.62, cy + Math.sin(a) * r * rr * 0.62);
      ctx.rotate(a);
      ctx.beginPath();
      ctx.ellipse(0, 0, r * rr * 0.38, r * rr * 0.16, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }
  ctx.fillStyle = C.cream;
  ctx.beginPath(); ctx.arc(cx, cy, r * 0.16, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = C.sindoor;
  ctx.beginPath(); ctx.arc(cx, cy, r * 0.08, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = C.white;
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * Math.PI * 2;
    ctx.beginPath(); ctx.arc(cx + Math.cos(a) * r * 1.05, cy + Math.sin(a) * r * 1.05, r * 0.025, 0, Math.PI * 2); ctx.fill();
  }
}

export function seededRandom(seed: number) {
  let s = seed >>> 0 || 1;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

/**
 * Merge the plain-toon mesh children of every group in a hierarchy into a single
 * vertex-coloured mesh per group. Animated joints keep working because merging
 * happens per group. Meshes flagged userData.keep (toggled expressions) are left alone.
 */
export function mergeStatic(root: THREE.Object3D, castShadow = true) {
  const groups: THREE.Object3D[] = [];
  root.traverse((o) => { if (!(o as THREE.Mesh).isMesh) groups.push(o); });
  for (const grp of groups) {
    const meshes = grp.children.filter((c) => {
      const m = c as THREE.Mesh;
      return m.isMesh && !m.userData.keep && m.children.length === 0 && isPlain(m.material as THREE.Material);
    }) as THREE.Mesh[];
    if (meshes.length < 2) continue;
    const b = new Builder();
    for (const m of meshes) {
      m.updateMatrix();
      b.addMatrix(m.geometry, m.material as THREE.Material, m.matrix);
      grp.remove(m);
    }
    const built = b.build({ castShadow });
    for (const child of [...built.children]) grp.add(child);
  }
}
