import * as THREE from 'three';
import {
  SEG_LEN, ZONES, ZONE_LENGTH, zoneIndexAt, getTemplates, backdropTexture, VARIANTS,
  type ZoneId, type AnimSpec, type Template,
} from './scenery';
import { Builder, C, G, toon, flat, seededRandom } from '../materials';
import { Kid, CHARACTERS, buildMaa, type CharacterId } from '../models/kid';
import { createModel } from '../models/items';

interface Segment {
  group: THREE.Group;
  zone: ZoneId;
  zoneIndex: number;
  key: string;
  anims: { spec: AnimSpec; obj: THREE.Object3D }[];
  cameo?: Template['cameo'];
  cameoActive?: boolean;
  /** distance coordinate of the near end */
  dist: number;
}

const tmpColor = new THREE.Color();

function sharedFountainWater() {
  const g = new THREE.Group();
  const m = toon('#9AD3E0', { opacity: 0.75 });
  const jet = new THREE.Mesh(G.cone, m);
  jet.scale.set(0.15, 1.4, 0.15);
  jet.position.y = 0.7;
  g.add(jet);
  const spray = new THREE.Mesh(G.sphereLo, m);
  spray.scale.set(0.7, 0.25, 0.7);
  spray.position.y = 1.4;
  g.add(spray);
  return g;
}

function kiteMesh(color: string) {
  const g = new THREE.Group();
  const shape = new THREE.Shape();
  shape.moveTo(0, 0.9); shape.lineTo(0.6, 0); shape.lineTo(0, -0.9); shape.lineTo(-0.6, 0); shape.closePath();
  const k = new THREE.Mesh(new THREE.ShapeGeometry(shape), toon(color, { side: THREE.DoubleSide }));
  g.add(k);
  const tail = new THREE.Mesh(G.box, toon(C.cream));
  tail.scale.set(0.04, 1.4, 0.01);
  tail.position.y = -1.6;
  g.add(tail);
  return g;
}

export class World {
  group = new THREE.Group();
  sky: THREE.Mesh;
  hemi: THREE.HemisphereLight;
  sun: THREE.DirectionalLight;
  fog: THREE.Fog;
  private segments: Segment[] = [];
  private pools = new Map<string, THREE.Group[]>();
  private spawnDist = 0; // distance coordinate where the next segment starts
  private farZ = 0; // world z of the far end of the last segment
  private skyUniforms: { top: { value: THREE.Color }; horizon: { value: THREE.Color }; sunDir: { value: THREE.Vector3 }; sunColor: { value: THREE.Color } };
  private backdrops: THREE.Mesh[] = [];
  private clouds: THREE.Group[] = [];
  private traffic: { obj: THREE.Group; v: number; lane: number }[] = [];
  private classmates: Kid[] = [];
  private classmatesGroup = new THREE.Group();
  private maa: ReturnType<typeof buildMaa>;
  private gauriPerch = new THREE.Vector3();
  currentZone = 0;
  private zoneBlend = 0;
  private t = 0;
  enableCameos = true;
  onZoneChange: ((index: number) => void) | null = null;
  private visibleAhead = 300;

  constructor(private scene: THREE.Scene, quality: 'high' | 'low') {
    getTemplates();
    this.visibleAhead = quality === 'high' ? 320 : 240;
    scene.add(this.group);
    // sky dome
    this.skyUniforms = {
      top: { value: new THREE.Color(ZONES[0].skyTop) },
      horizon: { value: new THREE.Color(ZONES[0].skyHorizon) },
      sunDir: { value: new THREE.Vector3(...ZONES[0].sunPos).normalize() },
      sunColor: { value: new THREE.Color('#FFE7B0') },
    };
    this.sky = new THREE.Mesh(
      new THREE.SphereGeometry(600, 24, 12),
      new THREE.ShaderMaterial({
        uniforms: this.skyUniforms,
        side: THREE.BackSide,
        depthWrite: false,
        fog: false,
        vertexShader: `varying vec3 vDir; void main(){ vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
        fragmentShader: `uniform vec3 top; uniform vec3 horizon; uniform vec3 sunDir; uniform vec3 sunColor; varying vec3 vDir;
          void main(){ float h = clamp(vDir.y, 0.0, 1.0); vec3 col = mix(horizon, top, pow(h, 0.55));
            float s = max(dot(normalize(vDir), normalize(sunDir)), 0.0);
            col += sunColor * (smoothstep(0.9965, 0.998, s) * 0.9 + pow(s, 24.0) * 0.18);
            gl_FragColor = vec4(col, 1.0); }`,
      }),
    );
    this.sky.renderOrder = -10;
    scene.add(this.sky);

    this.hemi = new THREE.HemisphereLight(ZONES[0].hemiSky, ZONES[0].hemiGround, ZONES[0].hemiIntensity);
    scene.add(this.hemi);
    this.sun = new THREE.DirectionalLight(ZONES[0].sun, ZONES[0].sunIntensity);
    this.sun.castShadow = quality === 'high';
    this.sun.shadow.mapSize.set(1024, 1024);
    const sc = this.sun.shadow.camera;
    sc.left = -8; sc.right = 8; sc.top = 10; sc.bottom = -6; sc.near = 1; sc.far = 60;
    this.sun.shadow.bias = -0.0008;
    this.sun.shadow.normalBias = 0.02;
    scene.add(this.sun, this.sun.target);
    this.fog = new THREE.Fog(ZONES[0].fog, 60, this.visibleAhead - 20);
    scene.fog = this.fog;

    // backdrops (one per zone, crossfaded)
    ZONES.forEach((z, i) => {
      const m = new THREE.Mesh(
        new THREE.PlaneGeometry(1400, 350),
        new THREE.MeshBasicMaterial({ map: backdropTexture(z.id), transparent: true, opacity: i === 0 ? 1 : 0, fog: false, depthWrite: false }),
      );
      m.position.set(0, z.id === 'valley' ? 40 : 95, -560);
      m.renderOrder = -9;
      scene.add(m);
      this.backdrops.push(m);
    });

    // clouds
    const r = seededRandom(77);
    const cloudMat = toon('#FFF8EC', { key: 'cloud', emissive: '#000001' });
    for (let i = 0; i < 9; i++) {
      const b = new Builder();
      const n = 4 + Math.floor(r() * 3);
      for (let k = 0; k < n; k++) b.add(G.sphereLo, cloudMat, k * 3 - n * 1.5, Math.sin(k) * 1.2, r() * 2, 0, 0, 0, 3 + r() * 2, 2.2 + r() * 1.2, 2.5);
      const c = b.build();
      c.position.set((r() - 0.5) * 300, 45 + r() * 40, -100 - r() * 400);
      scene.add(c);
      this.clouds.push(c);
    }

    // traffic on the city side-road
    const vehicles = ['ob_auto', 'ob_auto', 'scooter', 'car', 'scooter', 'car'];
    vehicles.forEach((v, i) => {
      const obj = v.startsWith('ob_') ? createModel(v) : this.vehicle(v, i);
      if (v === 'ob_auto') obj.scale.setScalar(0.85);
      const lane = i % 2;
      obj.position.set(lane ? -7.3 : -9.7, 0, -40 - i * 45);
      obj.rotation.y = lane ? 0 : Math.PI;
      obj.visible = false;
      this.group.add(obj);
      this.traffic.push({ obj, v: lane ? 6 + r() * 4 : -(5 + r() * 5), lane });
    });

    // cameo actors from the storyboard
    this.setPlayer('devi');
    this.classmatesGroup.visible = false;
    this.group.add(this.classmatesGroup);
    this.maa = buildMaa();
    this.maa.group.visible = false;
    this.maa.group.rotation.y = -Math.PI / 2 + 0.3;
    this.group.add(this.maa.group);

    this.reset(0);
  }

  /** The cheering classmates are always the three girls the player isn't playing. */
  setPlayer(id: CharacterId) {
    for (const k of this.classmates) this.classmatesGroup.remove(k.root);
    this.classmates = CHARACTERS.filter((c) => c.id !== id).map((c, i) => {
      const k = new Kid({ ...c.style, backpack: false });
      k.root.position.set(0, 0, (i - 1) * 1.1);
      k.root.rotation.y = Math.PI / 2 - 0.25;
      this.classmatesGroup.add(k.root);
      return k;
    });
  }

  private vehicle(kind: string, i: number) {
    const b = new Builder();
    const cols = [C.sindoor, C.teal, C.haldi, C.indigo, C.rose];
    const body = toon(cols[i % cols.length]);
    if (kind === 'scooter') {
      b.add(G.box, body, 0, 0.55, 0, 0, 0, 0, 0.45, 0.5, 1.3);
      b.add(G.box, toon(C.ink), 0, 0.85, -0.2, 0, 0, 0, 0.4, 0.12, 0.6);
      b.add(G.cyl, toon('#1E1A18'), 0, 0.25, 0.55, 0, 0, Math.PI / 2, 0.25, 0.12, 0.25);
      b.add(G.cyl, toon('#1E1A18'), 0, 0.25, -0.5, 0, 0, Math.PI / 2, 0.25, 0.12, 0.25);
      b.add(G.cylLo, toon(C.ink), 0, 1.0, 0.55, 0, 0, 0, 0.03, 0.7, 0.03);
      b.add(G.box, toon(C.ink), 0, 1.33, 0.55, 0, 0, 0, 0.7, 0.05, 0.05);
      // rider (simple)
      b.add(G.box, toon(C.indigo), 0, 1.25, -0.1, 0, 0, 0, 0.4, 0.6, 0.3);
      b.add(G.sphere, toon('#B9774B'), 0, 1.75, -0.05, 0, 0, 0, 0.17);
      b.add(G.sphere, toon(cols[(i + 2) % cols.length]), 0, 1.82, -0.05, 0, 0, 0, 0.19, 0.15, 0.19);
    } else {
      b.add(G.box, body, 0, 0.6, 0, 0, 0, 0, 1.6, 0.7, 3.4);
      b.add(G.box, body, 0, 1.2, -0.2, 0, 0, 0, 1.45, 0.6, 1.9);
      b.add(G.box, toon('#9CC3D6'), 0, 1.2, -0.2, 0, 0, 0, 1.5, 0.45, 1.6);
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) b.add(G.cyl, toon('#1E1A18'), sx * 0.78, 0.3, sz * 1.1, 0, 0, Math.PI / 2, 0.3, 0.2, 0.3);
      b.add(G.box, toon('#FFF3C2'), 0, 0.65, 1.71, 0, 0, 0, 1.2, 0.15, 0.04);
    }
    return b.build();
  }

  /** Clear and rebuild the world from a given distance (used on start/restart). */
  reset(distance: number) {
    for (const s of this.segments) this.release(s);
    this.segments = [];
    this.spawnDist = distance;
    this.farZ = 15;
    this.spawnDist -= 15;
    this.currentZone = zoneIndexAt(distance);
    this.zoneBlend = 1;
    this.applyZone(this.currentZone, 1);
    this.backdrops.forEach((b, i) => ((b.material as THREE.MeshBasicMaterial).opacity = i === this.currentZone ? 1 : 0));
    while (this.farZ > -this.visibleAhead) this.spawn();
  }

  private spawn() {
    const zoneIndex = zoneIndexAt(this.spawnDist + 1);
    const zone = ZONES[zoneIndex];
    const prevZone = this.segments.length ? this.segments[this.segments.length - 1].zoneIndex : zoneIndex;
    const isGate = this.segments.length > 0 && prevZone !== zoneIndex;
    const variant = Math.floor(Math.abs(Math.sin(this.spawnDist * 0.013)) * VARIANTS * 0.9999);
    const key = `${zone.id}-${variant}`;
    const { templates, gates } = getTemplates();
    const tpl = templates[zone.id][variant];
    let pool = this.pools.get(key);
    if (!pool) this.pools.set(key, (pool = []));
    const group = pool.pop() ?? tpl.group.clone();
    group.position.set(0, 0, this.farZ);
    // gate overlay
    const gate = group.getObjectByName('gate');
    if (gate) group.remove(gate);
    if (isGate) {
      const g = gates[zone.id].clone();
      g.name = 'gate';
      group.add(g);
    }
    this.group.add(group);
    const seg: Segment = { group, zone: zone.id, zoneIndex, key, anims: [], cameo: tpl.cameo, dist: this.spawnDist };
    for (const spec of tpl.anims) {
      let obj: THREE.Object3D;
      if (spec.type === 'fountain') obj = sharedFountainWater();
      else obj = kiteMesh(spec.c ?? C.sindoor);
      obj.position.set(spec.x, spec.y, spec.z);
      group.add(obj);
      seg.anims.push({ spec, obj });
    }
    if (tpl.cameo && this.enableCameos) this.tryCameo(seg);
    this.segments.push(seg);
    this.farZ -= SEG_LEN;
    this.spawnDist += SEG_LEN;
  }

  private tryCameo(seg: Segment) {
    const c = seg.cameo!;
    if (c.kind === 'classmates' && !this.classmatesGroup.visible) {
      this.classmatesGroup.visible = true;
      this.classmatesGroup.position.set(c.x, 0, seg.group.position.z + c.z);
      seg.cameoActive = true;
    } else if (c.kind === 'maa' && !this.maa.group.visible) {
      this.maa.group.visible = true;
      this.maa.group.position.set(c.x, 0.48, seg.group.position.z + c.z);
      seg.cameoActive = true;
    }
  }

  private release(seg: Segment) {
    this.group.remove(seg.group);
    for (const a of seg.anims) seg.group.remove(a.obj);
    if (seg.cameoActive) {
      if (seg.cameo?.kind === 'classmates') this.classmatesGroup.visible = false;
      else this.maa.group.visible = false;
    }
    this.pools.get(seg.key)!.push(seg.group);
  }

  zoneAtZ(z: number): number {
    for (const s of this.segments) {
      if (z <= s.group.position.z && z > s.group.position.z - SEG_LEN) return s.zoneIndex;
    }
    return this.currentZone;
  }

  /** Lerp lighting/sky/fog toward a zone. */
  private applyZone(index: number, k: number) {
    const z = ZONES[index];
    this.skyUniforms.top.value.lerp(tmpColor.set(z.skyTop), k);
    this.skyUniforms.horizon.value.lerp(tmpColor.set(z.skyHorizon), k);
    this.skyUniforms.sunDir.value.lerp(new THREE.Vector3(...z.sunPos).normalize(), k);
    this.skyUniforms.sunColor.value.lerp(tmpColor.set(z.id === 'valley' ? '#FFB070' : '#FFE7B0'), k);
    this.fog.color.lerp(tmpColor.set(z.fog), k);
    this.hemi.color.lerp(tmpColor.set(z.hemiSky), k);
    this.hemi.groundColor.lerp(tmpColor.set(z.hemiGround), k);
    this.hemi.intensity += (z.hemiIntensity - this.hemi.intensity) * k;
    this.sun.color.lerp(tmpColor.set(z.sun), k);
    this.sun.intensity += (z.sunIntensity - this.sun.intensity) * k;
    const cloudMat = toon('#FFF8EC', { key: 'cloud', emissive: '#000001' });
    cloudMat.color.lerp(tmpColor.set(z.id === 'valley' ? '#E9B39A' : '#FFF8EC'), k);
  }

  update(dt: number, speed: number, playerX: number, cameraZ = 0) {
    this.t += dt;
    const dz = speed * dt;
    for (const s of this.segments) s.group.position.z += dz;
    this.farZ += dz;
    if (this.classmatesGroup.visible) this.classmatesGroup.position.z += dz;
    if (this.maa.group.visible) this.maa.group.position.z += dz;
    // recycle
    while (this.segments.length && this.segments[0].group.position.z - SEG_LEN > 18) {
      this.release(this.segments.shift()!);
    }
    while (this.farZ > -this.visibleAhead) this.spawn();

    // zone lighting follows the segment just ahead of the player
    const zi = this.zoneAtZ(-12);
    if (zi !== this.currentZone) {
      this.currentZone = zi;
      this.zoneBlend = 0;
      this.onZoneChange?.(zi);
    }
    if (this.zoneBlend < 1) {
      this.zoneBlend = Math.min(1, this.zoneBlend + dt * 0.35);
      this.applyZone(this.currentZone, Math.min(1, dt * 1.6));
      this.backdrops.forEach((b, i) => {
        const m = b.material as THREE.MeshBasicMaterial;
        m.opacity += ((i === this.currentZone ? 1 : 0) - m.opacity) * Math.min(1, dt * 1.5);
      });
    }

    // sun follows the player for a tight shadow frustum
    const sp = ZONES[this.currentZone].sunPos;
    const dir = new THREE.Vector3(...sp).normalize();
    this.sun.position.set(playerX + dir.x * 30, dir.y * 30, cameraZ - 4 + dir.z * 30);
    this.sun.target.position.set(playerX, 0, cameraZ - 4);

    // clouds drift slowly (parallax)
    for (const c of this.clouds) {
      c.position.z += dz * 0.04 + dt * 0.6;
      if (c.position.z > 50) c.position.z -= 500;
    }

    // segment animations
    for (const s of this.segments) for (const a of s.anims) {
      if (a.spec.type === 'fountain') {
        a.obj.scale.y = 1 + Math.sin(this.t * 5 + a.spec.x) * 0.08;
        a.obj.children[1].scale.x = a.obj.children[1].scale.z = 0.7 + Math.sin(this.t * 7) * 0.05;
      } else if (a.spec.type === 'kite') {
        a.obj.position.y = a.spec.y + Math.sin(this.t * 0.9 + a.spec.z) * 1.4;
        a.obj.rotation.z = Math.sin(this.t * 1.3 + a.spec.x) * 0.3;
      }
    }

    // traffic: only visible where the side road exists (city)
    for (const tr of this.traffic) {
      tr.obj.position.z += dz + tr.v * dt;
      if (tr.obj.position.z > 25) tr.obj.position.z = -this.visibleAhead + Math.random() * 40;
      if (tr.obj.position.z < -this.visibleAhead - 10) tr.obj.position.z = 10;
      tr.obj.visible = ZONES[this.zoneAtZ(tr.obj.position.z)].id === 'city';
    }

    // cameos
    if (this.classmatesGroup.visible) {
      const near = this.classmatesGroup.position.z > -30 && this.classmatesGroup.position.z < 6;
      this.classmates.forEach((k, i) => k.update(dt, { mode: near ? 'cheer' : i === 1 ? 'wave' : 'idle', speed: 0, vy: 0, laneVel: 0 }));
    }
    if (this.maa.group.visible) this.maa.update(this.t);
  }

  get zoneName() { return ZONES[this.currentZone].name; }

  static zoneLength() { return ZONE_LENGTH; }

  /** Where Gauri can perch in the menu. */
  perch() { return this.gauriPerch; }

  dispose() {
    this.scene.remove(this.group, this.sky, this.hemi, this.sun, this.sun.target, ...this.backdrops, ...this.clouds);
  }

  /** Blob shadow helper material for others. */
  static blobMaterial() { return flat('#3A2420', 0.22, 'blob'); }
}
