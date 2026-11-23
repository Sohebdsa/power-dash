import * as THREE from 'three';
import { World } from './world/world';
import { LANE_W, ZONES } from './world/scenery';
import { Kid, CHARACTER_BY_ID, type AnimMode, type CharacterId } from './models/kid';
import { Gauri } from './models/gauri';
import { createModel } from './models/items';
import { createSprite } from './models/sprites';
import { Particles } from './particles';
import { Input, type Action } from './input';
import { Spawner, JUMP_V, GRAVITY, type ObstacleDef, type SpawnRequest } from './spawner';
import { flat, toon, G, C } from './materials';
import { COLLECTIBLE_BY_ID, HAZARD_BY_ID, POWERUP_BY_ID, type PowerUpId, type CollectCategory } from '../data/items';
import { useGame, type ActivePower } from '../store/gameStore';
import { audio } from '../systems/audio';

type State = 'menu' | 'intro' | 'running' | 'paused' | 'dying' | 'over';

interface Entity {
  kind: 'obstacle' | 'hazard' | 'collect' | 'powerup';
  id: string;
  poolKey: string;
  obj: THREE.Group;
  lane: number;
  z: number;
  y: number;
  def?: ObstacleDef;
  category?: CollectCategory;
  done: boolean;
  pulled: boolean;
  phase: number;
}

const LANE_X = [-LANE_W, 0, LANE_W];
const STAND_H = 1.55;
const SLIDE_H = 0.72;
const SLIDE_TIME = 0.72;
const INVULN_TIME = 1.7;
const SPAWN_AHEAD = 190;

export class Game {
  renderer: THREE.WebGLRenderer;
  scene = new THREE.Scene();
  camera: THREE.PerspectiveCamera;
  world: World;
  devi: Kid;
  gauri: Gauri;
  particles: Particles;
  input: Input;
  private spawner = new Spawner();
  private entities: Entity[] = [];
  private pools = new Map<string, THREE.Group[]>();
  private requests: SpawnRequest[] = [];
  private state: State = 'menu';
  private clock = new THREE.Clock();
  private t = 0;
  private quality: 'high' | 'low';
  private container: HTMLElement;
  private popLayer: HTMLElement;
  private resizeObs: ResizeObserver;

  // player
  private lane = 1;
  private x = 0;
  private prevX = 0;
  private y = 0;
  private vy = 0;
  private grounded = true;
  private slideT = 0;
  private invuln = 0;
  private laneVel = 0;
  private bumpCooldown = 0;
  private prevLane = 1;

  // run
  private distance = 0;
  private score = 0;
  private speed = 0;
  private lives = 3;
  private food = 0;
  private hygiene = 0;
  private streakFoods = new Set<string>();
  private streakBonus = 0;
  private hygieneStreak = 0;
  private balanced = { fruit: false, vegetable: false, protein: false, hygiene: false };
  private hygieneHazardsHit = 0;
  private hazardLessons: string[] = [];
  private powers = new Map<PowerUpId, number>();
  private lastToastT = -10;
  private stateT = 0;
  private hudT = 0;
  private dustT = 0;
  private shake = 0;
  private lastZoneShown = -1;
  private foodPitch = 0;
  private foodPitchT = 0;

  // visuals
  private aura: THREE.Mesh;
  private blob: THREE.Mesh;
  private camPos = new THREE.Vector3(0, 2.9, 6.2);
  private camLook = new THREE.Vector3(0, 1, -8);
  private menuDesktop = true;
  private baseFov = 62;
  private reduceMotion = false;

  constructor(container: HTMLElement, popLayer: HTMLElement) {
    this.container = container;
    this.popLayer = popLayer;
    const settings = useGame.getState().settings;
    const coarse = window.matchMedia('(pointer: coarse)').matches;
    this.quality = settings.quality === 'auto' ? (coarse ? 'low' : 'high') : settings.quality;
    this.reduceMotion = settings.reduceMotion;

    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, this.quality === 'high' ? 2 : 1.6));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.renderer.shadowMap.enabled = this.quality === 'high';
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(this.renderer.domElement);
    this.renderer.domElement.className = 'game-canvas';

    this.camera = new THREE.PerspectiveCamera(this.baseFov, 1, 0.1, 900);
    this.world = new World(this.scene, this.quality);
    this.world.enableCameos = true;
    this.world.onZoneChange = (i) => this.onZone(i);

    this.devi = this.buildPlayer(settings.character ?? 'devi');
    this.world.setPlayer(settings.character ?? 'devi');
    this.gauri = new Gauri();
    this.gauri.root.position.set(0.8, 1.9, 0.5);
    this.scene.add(this.gauri.root);

    this.blob = new THREE.Mesh(G.circle, flat(C.ink, 0.25, 'blob'));
    this.blob.rotation.x = -Math.PI / 2;
    this.blob.scale.setScalar(0.45);
    this.blob.renderOrder = 1;
    this.scene.add(this.blob);

    this.aura = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 16), new THREE.MeshBasicMaterial({ color: '#4F86C6', transparent: true, opacity: 0.2, depthWrite: false }));
    this.aura.visible = false;
    this.scene.add(this.aura);

    this.particles = new Particles(this.scene);
    this.input = new Input(container);
    this.input.enabled = false;
    this.input.onAny = () => audio.unlock();

    this.resizeObs = new ResizeObserver(() => this.resize());
    this.resizeObs.observe(container);
    this.resize();
    document.addEventListener('visibilitychange', this.onVisibility);

    this.enterMenu();
    this.renderer.setAnimationLoop(() => this.frame());
  }

  // ---- lifecycle --------------------------------------------------------
  private onVisibility = () => {
    if (document.hidden && (this.state === 'running' || this.state === 'intro')) this.pause();
  };

  private resize() {
    const w = this.container.clientWidth || window.innerWidth;
    const h = this.container.clientHeight || window.innerHeight;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.baseFov = w / h < 0.8 ? 74 : w / h < 1.2 ? 68 : 60;
    this.camera.fov = this.baseFov;
    this.camera.updateProjectionMatrix();
    this.menuDesktop = w > 560 && w / h > 1.1;
    this.particles.setScale(h * 0.75);
  }

  setReduceMotion(v: boolean) { this.reduceMotion = v; }

  private characterId: CharacterId = 'devi';

  private buildPlayer(id: CharacterId) {
    const def = CHARACTER_BY_ID[id] ?? CHARACTER_BY_ID.devi;
    this.characterId = def.id;
    const kid = new Kid({ ...def.style, backpack: true });
    kid.onFootstep = () => { if (this.state === 'running' && this.grounded && this.slideT <= 0) audio.sfx('step'); };
    this.scene.add(kid.root);
    return kid;
  }

  /** Swap the playable character (used live by the character-select lobby). */
  setCharacter(id: CharacterId) {
    if (id === this.characterId) return;
    const old = this.devi;
    const next = this.buildPlayer(id);
    next.root.position.copy(old.root.position);
    next.root.rotation.copy(old.root.rotation);
    this.scene.remove(old.root);
    this.devi = next;
    this.deviTransparent = false;
    next.express('glad', 0.8);
    this.world.setPlayer(id);
  }

  enterMenu() {
    this.state = 'menu';
    this.clearEntities();
    this.particles.clear();
    this.world.reset(0);
    this.speed = 0;
    this.lane = 1; this.x = 0; this.y = 0; this.vy = 0; this.slideT = 0;
    this.devi.root.position.set(0, 0, 0);
    this.devi.root.rotation.y = 0;
    this.setDeviOpacity(1);
    this.devi.setBaseExpression('smile');
    this.aura.visible = false;
    this.input.enabled = false;
    this.menuCam(this.camPos, this.camLook);
    this.camera.position.copy(this.camPos);
    this.camera.lookAt(this.camLook);
    audio.playMusic('menu');
  }

  start() {
    audio.unlock();
    useGame.getState().resetRun();
    this.clearEntities();
    this.particles.clear();
    this.world.reset(0);
    this.spawner.reset(0);
    this.distance = 0; this.score = 0; this.speed = 0; this.lives = 3;
    this.food = 0; this.hygiene = 0; this.streakFoods.clear(); this.streakBonus = 0; this.hygieneStreak = 0;
    this.balanced = { fruit: false, vegetable: false, protein: false, hygiene: false };
    this.hygieneHazardsHit = 0; this.hazardLessons = [];
    this.powers.clear();
    this.lane = 1; this.prevLane = 1; this.x = 0; this.y = 0; this.vy = 0; this.slideT = 0; this.invuln = 0; this.grounded = true;
    this.lastZoneShown = 0;
    this.state = 'intro';
    this.stateT = 0;
    this.input.clear();
    this.input.enabled = true;
    this.devi.setBaseExpression('smile');
    audio.playMusic('game');
    audio.sfx('start');
    this.pushHud(true);
    useGame.getState().setZone(ZONES[0].name);
  }

  pause() {
    if (this.state !== 'running' && this.state !== 'intro') return;
    this.pausedFrom = this.state;
    this.state = 'paused';
    this.input.enabled = false;
    audio.suspend(true);
    useGame.getState().setScreen('paused');
  }
  private pausedFrom: State = 'running';

  resume() {
    if (this.state !== 'paused') return;
    this.state = this.pausedFrom;
    this.input.clear();
    this.input.enabled = true;
    this.clock.getDelta(); // swallow paused time
    audio.suspend(false);
    useGame.getState().setScreen('playing');
  }

  toMenu() {
    if (this.state === 'menu') return;
    audio.suspend(false);
    this.enterMenu();
  }

  dispose() {
    this.renderer.setAnimationLoop(null);
    this.resizeObs.disconnect();
    document.removeEventListener('visibilitychange', this.onVisibility);
    this.input.dispose();
    this.world.dispose();
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }

  // ---- frame ------------------------------------------------------------
  private frame() {
    const dt = Math.min(0.05, this.clock.getDelta());
    if (this.state === 'paused') {
      this.renderer.render(this.scene, this.camera);
      return;
    }
    this.t += dt;
    this.stateT += dt;

    if (this.state === 'menu') this.updateMenu(dt);
    else if (this.state === 'intro') this.updateIntro(dt);
    else if (this.state === 'running') this.updateRun(dt);
    else if (this.state === 'dying' || this.state === 'over') this.updateDying(dt);

    this.particles.update(dt, this.state === 'running' ? this.speed * dt : 0);
    this.renderer.render(this.scene, this.camera);
  }

  private updateMenu(dt: number) {
    this.world.update(dt, 0, 0, 0);
    const wave = Math.sin(this.t * 0.35) > 0.85;
    this.devi.update(dt, { mode: wave ? 'wave' : 'idle', speed: 0, vy: 0, laneVel: 0 });
    this.devi.root.rotation.y = -0.35;
    this.gauri.perched = false;
    this.gauri.update(dt, new THREE.Vector3(0.7 + Math.sin(this.t * 0.8) * 0.3, 1.95 + Math.sin(this.t * 1.3) * 0.15, 0.3), -1);
    const sway = this.reduceMotion ? 0 : Math.sin(this.t * 0.3) * 0.25;
    this.menuCam(this.camPos, this.camLook);
    this.camPos.x += sway;
    this.camera.position.lerp(this.camPos, Math.min(1, dt * 3));
    this.camera.lookAt(this.camLook);
    this.blob.position.set(0, 0.02, 0);
  }

  /** Menu framing: Devi to the left of the panel on desktop, above the sheet on mobile. */
  private menuCam(pos: THREE.Vector3, look: THREE.Vector3) {
    if (this.menuDesktop) {
      pos.set(0.15, 1.35, 4.6);
      look.set(1.45, 1.05, 0);
    } else {
      pos.set(0.9, 1.05, 5.6);
      look.set(0.15, -0.35, 0);
    }
  }

  private updateIntro(dt: number) {
    const k = Math.min(1, this.stateT / 1.1);
    const e = k * k * (3 - 2 * k);
    this.devi.root.rotation.y = -0.35 + (Math.PI + 0.35) * e;
    this.devi.update(dt, { mode: k > 0.5 ? 'run' : 'idle', speed: 0.2, vy: 0, laneVel: 0 });
    this.speed = 15 * Math.max(0, (k - 0.6) / 0.4);
    this.world.update(dt, this.speed, 0, 0);
    this.distance += this.speed * dt;
    this.updateCamera(dt, e);
    this.updateGauri(dt);
    if (k >= 1) {
      this.state = 'running';
      this.devi.root.rotation.y = Math.PI;
    }
  }

  private updateCamera(dt: number, blend = 1) {
    const energy = this.powers.has('energy');
    const runPos = new THREE.Vector3(this.x * 0.65, 2.75 + this.y * 0.35, 5.6);
    const runLook = new THREE.Vector3(this.x * 0.8, 1.05 + this.y * 0.25, -9);
    if (blend < 1) {
      const mPos = new THREE.Vector3(), mLook = new THREE.Vector3();
      this.menuCam(mPos, mLook);
      runPos.lerpVectors(mPos, runPos, blend);
      runLook.lerpVectors(mLook, runLook, blend);
    }
    this.camPos.lerp(runPos, Math.min(1, dt * 7));
    this.camLook.lerp(runLook, Math.min(1, dt * 9));
    this.camera.position.copy(this.camPos);
    if (this.shake > 0 && !this.reduceMotion) {
      this.camera.position.x += (Math.random() - 0.5) * this.shake;
      this.camera.position.y += (Math.random() - 0.5) * this.shake;
      this.shake = Math.max(0, this.shake - dt * 1.6);
    }
    this.camera.lookAt(this.camLook);
    const fov = this.baseFov + (energy ? 9 : 0) + Math.min(6, (this.speed - 15) * 0.25);
    if (Math.abs(this.camera.fov - fov) > 0.05) {
      this.camera.fov += (fov - this.camera.fov) * Math.min(1, dt * 3);
      this.camera.updateProjectionMatrix();
    }
  }

  private updateGauri(dt: number) {
    const tgt = new THREE.Vector3(this.x + 0.9 + Math.sin(this.t * 0.9) * 0.3, this.y + 2.1 + Math.sin(this.t * 1.7) * 0.2, 0.6);
    this.gauri.perched = false;
    this.gauri.update(dt, tgt, -1);
  }

  private updateRun(dt: number) {
    // input
    let a: Action | undefined;
    while ((a = this.input.next())) this.handleAction(a);

    // speed / difficulty
    const diff = Math.min(1, this.distance / 2600);
    let target = 15 + diff * 15 + Math.max(0, this.distance - 2600) * 0.0015;
    target = Math.min(target, 33);
    if (this.powers.has('energy')) target *= 1.55;
    this.speed += (target - this.speed) * Math.min(1, dt * 2);
    const dz = this.speed * dt;
    this.distance += dz;
    this.score += dz * 0.5;

    // lateral movement (critically damped toward lane)
    this.prevX = this.x;
    const tx = LANE_X[this.lane];
    this.x += (tx - this.x) * Math.min(1, dt * 15);
    this.laneVel = (this.x - this.prevX) / dt / LANE_W;

    // vertical
    if (!this.grounded) {
      this.vy -= GRAVITY * dt;
      this.y += this.vy * dt;
      if (this.y <= 0) {
        this.y = 0;
        const impact = Math.min(1.5, -this.vy / 10);
        this.vy = 0;
        this.grounded = true;
        this.devi.land(impact);
        audio.sfx('land');
        this.particles.emit(this.x, 0.05, 0, { count: 10, color: ['#E7D3AE', '#D9BE8E'], speed: 2.5, up: 1, size: 0.18, life: 0.45, gravity: 3 });
        if (this.slideQueued) { this.slideQueued = false; this.startSlide(); }
      }
    }
    if (this.slideT > 0) this.slideT -= dt;
    if (this.invuln > 0) this.invuln -= dt;
    if (this.bumpCooldown > 0) this.bumpCooldown -= dt;

    // power-up timers
    for (const [id, rem] of this.powers) {
      if (rem < 0) continue; // until-used
      const n = rem - dt;
      if (n <= 0) this.powers.delete(id); else this.powers.set(id, n);
    }

    // world + entities
    this.world.update(dt, this.speed, this.x, 0);
    this.spawn();
    this.updateEntities(dt, dz);

    // character
    const mode: AnimMode = !this.grounded ? 'jump' : this.slideT > 0 ? 'slide' : 'run';
    this.devi.update(dt, { mode, speed: Math.min(1, (this.speed - 12) / 20), vy: this.vy, laneVel: this.laneVel });
    this.devi.root.position.set(this.x, this.y, 0);
    // gentle translucency pulse while invulnerable (no harsh flashing)
    this.setDeviOpacity(this.invuln > 0 && this.state === 'running' ? 0.55 + Math.sin(this.t * 10) * 0.2 : 1);
    this.blob.position.set(this.x, 0.02, 0);
    this.blob.scale.setScalar(0.45 * Math.max(0.4, 1 - this.y * 0.25));

    this.updateGauri(dt);
    this.updateEffects(dt);
    this.updateCamera(dt);

    // HUD + music intensity
    audio.setIntensity(diff);
    this.hudT -= dt;
    if (this.hudT <= 0) { this.hudT = 0.1; this.pushHud(); }
  }

  private slideQueued = false;

  private handleAction(a: Action) {
    switch (a) {
      case 'pause': this.pause(); break;
      case 'left':
        if (this.lane > 0) { this.prevLane = this.lane; this.lane--; audio.sfx('lane'); }
        break;
      case 'right':
        if (this.lane < 2) { this.prevLane = this.lane; this.lane++; audio.sfx('lane'); }
        break;
      case 'jump':
        if (this.grounded) {
          const v = this.powers.has('superJump') ? 13.2 : JUMP_V;
          this.vy = v;
          this.grounded = false;
          this.slideT = 0;
          audio.sfx(this.powers.has('superJump') ? 'superjump' : 'jump');
          this.particles.emit(this.x, 0.05, 0, { count: 6, color: '#E7D3AE', speed: 2, up: 0.5, size: 0.14, life: 0.35 });
        }
        break;
      case 'slide':
        if (!this.grounded) { this.vy = Math.min(this.vy, -18); this.slideQueued = true; }
        else this.startSlide();
        break;
    }
  }

  private startSlide() {
    this.slideT = SLIDE_TIME;
    audio.sfx('slide');
  }

  private setDeviOpacity(o: number) {
    const transparent = o < 0.99;
    if (transparent === this.deviTransparent && !transparent) return;
    this.deviTransparent = transparent;
    this.devi.root.traverse((obj) => {
      const m = (obj as THREE.Mesh).material as THREE.Material | undefined;
      if (!m) return;
      // Clone materials once so the shared ones aren't affected.
      if (!obj.userData.ownMat) {
        const c = m.clone();
        c.userData.baseOpacity = m.opacity;
        c.userData.baseTransparent = m.transparent;
        (obj as THREE.Mesh).material = c;
        obj.userData.ownMat = true;
      }
      const mm = (obj as THREE.Mesh).material as THREE.Material;
      mm.transparent = transparent || mm.userData.baseTransparent;
      mm.opacity = mm.userData.baseOpacity * (transparent ? o : 1);
    });
  }
  private deviTransparent = false;

  // ---- spawning ---------------------------------------------------------
  private spawn() {
    const zone = ZONES[this.world.zoneAtZ(-SPAWN_AHEAD * 0.6)].id;
    this.requests.length = 0;
    this.spawner.update(this.distance, this.speed, zone, SPAWN_AHEAD, this.requests);
    for (const r of this.requests) {
      const z = -(r.dist - this.distance);
      if (r.kind === 'obstacle') this.addEntity('obstacle', r.def.id, r.def.id, r.lane, z, 0, r.def);
      else if (r.kind === 'hazard') this.addEntity('hazard', r.id, r.id, r.lane, z, 0.62);
      else if (r.kind === 'collect') this.addEntity('collect', r.id, r.id, r.lane, z, r.y);
      else this.addEntity('powerup', r.id, `pu-${r.id}`, r.lane, z, 1.0);
    }
  }

  private getObj(poolKey: string, kind: Entity['kind'], id: string) {
    const pool = this.pools.get(poolKey);
    if (pool && pool.length) return pool.pop()!;
    if (kind === 'obstacle') return createModel(id);
    // Collectibles, hazards and power-ups are crisp image sprites (always face the camera).
    const g = new THREE.Group();
    const hy = COLLECTIBLE_BY_ID[id]?.category === 'hygiene';
    const size = kind === 'powerup' ? 1.35 : kind === 'hazard' ? 1.15 : hy ? 1.3 : 1.1;
    const sprite = createSprite(kind === 'powerup' ? `pu_${id}` : id, size);
    g.add(sprite);
    g.userData.sprite = sprite;
    if (kind === 'hazard' || hy || kind === 'powerup') {
      // soft ground marker: rose for hygiene products, sindoor for hazards, badge colour for power-ups
      const col = kind === 'hazard' ? C.sindoor : kind === 'powerup' ? POWERUP_BY_ID[id as PowerUpId].color : C.rose;
      const ring = new THREE.Mesh(new THREE.RingGeometry(0.44, 0.56, 32), flat(col, 0.5, `ring-${col}`));
      ring.rotation.x = -Math.PI / 2;
      ring.name = 'marker';
      g.add(ring);
    }
    return g;
  }

  private addEntity(kind: Entity['kind'], id: string, poolKey: string, lane: number, z: number, y: number, def?: ObstacleDef) {
    const obj = this.getObj(poolKey, kind, id);
    obj.position.set(LANE_X[lane], y, z);
    obj.rotation.set(0, 0, 0);
    obj.visible = true;
    if (kind === 'obstacle') obj.rotation.y = 0;
    this.scene.add(obj);
    const marker = obj.getObjectByName('marker');
    if (marker) marker.position.y = (-y + 0.03) / obj.scale.y;
    this.entities.push({
      kind, id, poolKey, obj, lane, z, y, def, done: false, pulled: false, phase: Math.random() * 6,
      category: kind === 'collect' ? COLLECTIBLE_BY_ID[id]?.category : undefined,
    });
  }

  private release(e: Entity) {
    this.scene.remove(e.obj);
    let pool = this.pools.get(e.poolKey);
    if (!pool) this.pools.set(e.poolKey, (pool = []));
    pool.push(e.obj);
  }

  private clearEntities() {
    for (const e of this.entities) this.release(e);
    this.entities.length = 0;
  }

  // ---- entities & collisions -------------------------------------------
  private updateEntities(dt: number, dz: number) {
    const ph = this.slideT > 0 ? SLIDE_H : STAND_H;
    const pBottom = this.y, pTop = this.y + ph;
    const foodMag = this.powers.has('foodMagnet');
    const hygMag = this.powers.has('hygieneMagnet');
    const safeFromAll = this.powers.has('preparation') || this.powers.has('energy');
    let write = 0;
    for (let i = 0; i < this.entities.length; i++) {
      const e = this.entities[i];
      e.z += dz;
      const o = e.obj;
      if (e.kind === 'collect' || e.kind === 'powerup') {
        const magnet = e.kind === 'collect' && ((foodMag && e.category !== 'hygiene') || (hygMag && e.category === 'hygiene'));
        if (magnet && !e.done && e.z > -16 && e.z < 2) e.pulled = true;
        if (e.pulled && !e.done) {
          const k = Math.min(1, dt * 9);
          o.position.x += (this.x - o.position.x) * k;
          o.position.y += (this.y + 0.9 - o.position.y) * k;
          e.z += (0 - e.z) * k;
          if (Math.random() < 0.3) this.particles.emit(o.position.x, o.position.y, e.z, { count: 1, color: e.category === 'hygiene' ? C.rose : C.neem, speed: 0.5, size: 0.08, life: 0.3, gravity: 0 });
        } else {
          o.position.y = e.y + Math.sin(this.t * 3 + e.phase) * 0.08;
        }
        o.position.z = e.z;
        const sp = o.userData.sprite as THREE.Sprite | undefined;
        if (sp) { const b = sp.userData.baseScale * (1 + Math.sin(this.t * 4 + e.phase) * 0.04); sp.scale.set(b, b, 1); }
        if (!e.done) {
          const dx = Math.abs(o.position.x - this.x);
          const dzz = Math.abs(e.z);
          const iy = o.position.y;
          if (dx < 0.95 && dzz < 0.95 && iy > pBottom - 0.45 && iy < pTop + 0.35) {
            e.done = true;
            if (e.kind === 'collect') this.collect(e); else this.activatePower(e.id as PowerUpId, o.position);
            o.visible = false;
          }
        }
      } else {
        o.position.z = e.z;
        o.userData.update?.(this.t);
        if (e.kind === 'hazard') o.position.y = e.y + Math.sin(this.t * 2 + e.phase) * 0.04;
        if (!e.done && Math.abs(e.z) < 3) {
          if (e.kind === 'obstacle') this.checkObstacle(e, pBottom, pTop, safeFromAll);
          else this.checkHazard(e, pBottom, pTop, safeFromAll);
        }
      }
      if (e.z > 12) { this.release(e); continue; }
      this.entities[write++] = e;
    }
    this.entities.length = write;
  }

  private checkObstacle(e: Entity, pBottom: number, pTop: number, safe: boolean) {
    const d = e.def!;
    const ox = LANE_X[e.lane];
    const halfW = 0.95, pHalf = 0.32;
    const xPen = halfW + pHalf - Math.abs(this.x - ox);
    if (xPen <= 0) return;
    if (Math.abs(e.z) > d.len / 2 + 0.3) return;
    if (pTop <= d.y0 + 0.02 || pBottom >= d.y1 - 0.02) return;
    if (safe) { this.smash(e); return; }
    // side bump: grazing the obstacle while changing lanes
    const movingToward = Math.sign(ox - this.x) === Math.sign(LANE_X[this.lane] - this.x) && this.lane === e.lane;
    if (xPen < 0.55 && movingToward && this.bumpCooldown <= 0) {
      this.lane = this.prevLane === e.lane ? 1 : this.prevLane;
      this.bumpCooldown = 0.4;
      this.devi.flinch();
      this.shake = 0.15;
      audio.sfx('lane');
      return;
    }
    if (xPen < 0.55) return;
    e.done = true;
    this.hit(d.hazard, e.obj.position);
  }

  private checkHazard(e: Entity, pBottom: number, pTop: number, safe: boolean) {
    const ox = LANE_X[e.lane];
    if (Math.abs(this.x - ox) > 0.75) return;
    if (Math.abs(e.z) > 0.55) return;
    const y0 = e.obj.position.y - 0.4, y1 = e.obj.position.y + 0.32;
    if (pTop <= y0 || pBottom >= y1) return;
    e.done = true;
    if (safe) { this.smash(e); return; }
    e.obj.visible = false;
    this.particles.emit(e.obj.position.x, e.obj.position.y, e.z, { count: 12, color: ['#8E9A7E', '#B8AE9C'], speed: 3, size: 0.14, life: 0.5 });
    this.hit(e.id, e.obj.position);
  }

  private smash(e: Entity) {
    e.done = true;
    this.particles.emit(LANE_X[e.lane], 1, e.z, { count: 14, color: [C.haldi, C.cream, C.teal], speed: 5, up: 2, size: 0.16, life: 0.6 });
    if (e.kind === 'hazard') e.obj.visible = false;
  }

  private hit(hazardId: string | undefined, pos: THREE.Vector3) {
    if (this.invuln > 0) return;
    const hz = hazardId ? HAZARD_BY_ID[hazardId] : undefined;
    if (hz?.kind === 'hygiene') { this.hygieneHazardsHit++; this.hygieneStreak = 0; }
    if (this.powers.has('shield')) {
      this.powers.delete('shield');
      this.invuln = 0.8;
      audio.sfx('shieldBreak');
      this.particles.emit(this.x, 1, 0, { count: 26, color: ['#4F86C6', '#A9CBEE', C.white], speed: 5, up: 1, size: 0.16, life: 0.6 });
      if (hz) this.lessonToast(hz.message, hz.kind === 'hygiene' ? 'Shield saved you!' : 'Shield saved you!');
      return;
    }
    this.lives--;
    this.invuln = INVULN_TIME;
    this.streakFoods.clear();
    this.streakBonus = 0;
    this.devi.flinch();
    this.shake = 0.35;
    audio.sfx('hit');
    this.particles.emit(this.x, 1.3, 0, { count: 10, color: [C.haldi, C.cream], speed: 3, up: 2, size: 0.14, life: 0.5 });
    if (hz) {
      if (!this.hazardLessons.includes(hz.message)) this.hazardLessons.push(hz.message);
      this.lessonToast(hz.message, hz.kind === 'hygiene' ? 'Hygiene tip' : 'Food tip');
    }
    void pos;
    if (this.lives <= 0) this.die();
    this.pushHud(true);
  }

  private lessonToast(text: string, title: string) {
    if (this.t - this.lastToastT < 1.2) return;
    this.lastToastT = this.t;
    void title; void text;
    this.popScore('Oops!', 'pop-oops');
  }

  private collect(e: Entity) {
    const def = COLLECTIBLE_BY_ID[e.id];
    if (!def) return;
    const store = useGame.getState();
    const isHygiene = def.category === 'hygiene';
    let pts = def.points;
    if (isHygiene && this.powers.has('knowledge')) pts *= 2;
    if (!isHygiene && this.powers.has('protein')) pts *= 2;
    const mult = this.multiplier();
    this.score += pts * mult;
    this.devi.collect();
    const p = e.obj.position;
    if (isHygiene) {
      this.hygiene++;
      this.hygieneStreak++;
      this.balanced.hygiene = true;
      audio.sfx('hygiene');
      this.particles.emit(p.x, p.y, e.z, { count: 16, color: [C.rose, '#F6C9CF', C.white], speed: 3.5, up: 1.5, size: 0.14, life: 0.55, gravity: 2 });
      if (this.hygieneStreak > 0 && this.hygieneStreak % 5 === 0) {
        const bonus = 250 * (this.powers.has('knowledge') ? 2 : 1);
        this.score += bonus;
        audio.sfx('combo');
        this.devi.twirl();
        this.popScore(`Hygiene Streak +${bonus}`, 'pop-combo');
        this.celebrate(C.rose);
      }
    } else {
      this.food++;
      this.balanced[def.category as 'fruit' | 'vegetable' | 'protein'] = true;
      // rising pitch while collecting in quick succession
      this.foodPitch = this.t - this.foodPitchT < 0.6 ? Math.min(8, this.foodPitch + 1) : 0;
      this.foodPitchT = this.t;
      audio.sfx('food', this.foodPitch);
      this.particles.emit(p.x, p.y, e.z, { count: 8, color: [C.haldi, C.cream, C.neem], speed: 2.5, up: 1, size: 0.11, life: 0.4, gravity: 3 });
      this.streakFoods.add(def.id);
      if (this.streakFoods.size >= 5) {
        this.streakFoods.clear();
        this.streakBonus = Math.min(4, this.streakBonus + 1);
        audio.sfx('combo');
        this.devi.twirl();
        this.popScore(`Healthy Streak ×${this.multiplier()}`, 'pop-combo');
        this.celebrate(C.neem);
        if (!store.progress.flags.healthyStreak) store.mutateProgress((pr) => { pr.flags.healthyStreak = true; });
      }
    }
    const b = this.balanced;
    if (b.fruit && b.vegetable && b.protein && b.hygiene) {
      this.balanced = { fruit: false, vegetable: false, protein: false, hygiene: false };
      this.score += 500;
      audio.sfx('combo');
      this.popScore('Balanced! +500', 'pop-combo');
      this.celebrate(C.haldi);
      if (!store.progress.flags.balanced) store.mutateProgress((pr) => { pr.flags.balanced = true; });
    }
    this.popScore(`+${pts * mult}`, isHygiene ? 'pop-hygiene' : 'pop-food');

    // discovery
    const run = store.run;
    if (!run.seenFacts.includes(def.id)) store.setRun({ seenFacts: [...run.seenFacts, def.id] });
    if (!store.progress.discovered.includes(def.id)) {
      store.mutateProgress((pr) => { pr.discovered.push(def.id); });
      store.setRun({ newFacts: [...useGame.getState().run.newFacts, def.id] });
      audio.sfx('discovery');
      this.gauri.flip();
      this.popScore('New fact!', 'pop-fact');
      this.lastToastT = this.t;
    }
  }

  private multiplier() {
    return 1 + this.streakBonus + (this.powers.has('confidence') ? 1 : 0);
  }

  private celebrate(color: string) {
    for (let i = 0; i < 3; i++) this.particles.emit(this.x, 1.2, -0.5, { count: 14, color: [color, C.haldi, C.cream], speed: 5, up: 3, size: 0.15, life: 0.9, gravity: 4 });
  }

  private activatePower(id: PowerUpId, pos: THREE.Vector3) {
    const def = POWERUP_BY_ID[id];
    this.powers.set(id, def.duration > 0 ? def.duration : -1);
    this.devi.twirl();
    audio.sfx(id === 'shield' || id === 'preparation' ? 'shield' : id.includes('Magnet') ? 'magnet' : id === 'energy' ? 'energy' : 'powerup');
    this.particles.emit(pos.x, pos.y, pos.z, { count: 30, color: [def.color, C.cream, C.haldi], speed: 5, up: 1, size: 0.18, life: 0.7, gravity: 1 });
    const store = useGame.getState();
    this.popScore(def.short, 'pop-power');
    if (!store.progress.powerupsUsed.includes(id)) store.mutateProgress((p) => { p.powerupsUsed.push(id); });
    this.pushHud(true);
  }

  private updateEffects(dt: number) {
    // dust while running
    this.dustT -= dt;
    if (this.grounded && this.dustT <= 0) {
      this.dustT = this.slideT > 0 ? 0.03 : 0.07;
      this.particles.emit(this.x + (Math.random() - 0.5) * 0.3, 0.05, 0.3, { count: this.slideT > 0 ? 2 : 1, color: ['#E7D3AE', '#D9C3A0'], speed: 0.8, up: 0.6, size: 0.12, life: 0.4, gravity: 0.5, vz: 2 });
    }
    // aura for protective powers
    const shield = this.powers.has('shield'), prep = this.powers.has('preparation'), energy = this.powers.has('energy');
    this.aura.visible = shield || prep || energy;
    if (this.aura.visible) {
      const m = this.aura.material as THREE.MeshBasicMaterial;
      m.color.set(energy ? '#F0B232' : prep ? C.teal : '#4F86C6');
      m.opacity = 0.16 + Math.sin(this.t * 4) * 0.04;
      const h = this.slideT > 0 ? 0.55 : 0.95;
      this.aura.position.set(this.x, this.y + h * 0.85, 0);
      this.aura.scale.set(0.75, h, 0.75);
    }
    if (this.powers.has('knowledge') && Math.random() < 0.25) this.particles.emit(this.x, this.y + 1.8, 0, { count: 1, color: ['#F6C453', C.cream], speed: 1, up: 1, size: 0.1, life: 0.6, gravity: -0.5, spread: 0.6 });
    if (this.powers.has('confidence') && Math.random() < 0.3) this.particles.emit(this.x, this.y + 1.0, 0.2, { count: 1, color: [C.sindoor, C.haldi], speed: 1.5, up: 1.5, size: 0.11, life: 0.6, gravity: 1, spread: 0.8 });
    if (energy) this.particles.emit(this.x, this.y + 0.3 + Math.random() * 1.2, 0.5, { count: 2, color: ['#F0B232', C.cream], speed: 0.3, size: 0.12, life: 0.3, gravity: 0, vz: 14, spread: 0.5 });
    if (this.powers.has('superJump') && Math.random() < 0.3) this.particles.emit(this.x, this.y + 0.1, 0.2, { count: 1, color: [C.white, '#A9CBEE'], speed: 1, size: 0.1, life: 0.4, gravity: 0, spread: 0.4 });
    if ((this.powers.has('foodMagnet') || this.powers.has('hygieneMagnet')) && Math.random() < 0.3) {
      const a = Math.random() * Math.PI * 2;
      this.particles.emit(this.x + Math.cos(a) * 1.4, this.y + 1, Math.sin(a) * 1.4, { count: 1, color: this.powers.has('foodMagnet') ? C.neem : C.rose, speed: 0.4, size: 0.1, life: 0.4, gravity: 0 });
    }
  }

  private popScore(text: string, cls: string) {
    const v = new THREE.Vector3(this.x, this.y + 2.0, 0).project(this.camera);
    const w = this.container.clientWidth, h = this.container.clientHeight;
    const el = document.createElement('div');
    el.className = `score-pop ${cls}`;
    el.textContent = text;
    el.style.left = `${(v.x * 0.5 + 0.5) * w + (Math.random() - 0.5) * 30}px`;
    const stackOff = cls === 'pop-food' || cls === 'pop-hygiene' ? 0 : -34;
    el.style.top = `${(-v.y * 0.5 + 0.5) * h + stackOff}px`;
    this.popLayer.appendChild(el);
    if (this.popLayer.childElementCount > 6) this.popLayer.firstElementChild?.remove();
    window.setTimeout(() => el.remove(), 800);
  }

  private onZone(i: number) {
    if (this.state !== 'running' || i === this.lastZoneShown) return;
    this.lastZoneShown = i;
    const store = useGame.getState();
    store.setZone(ZONES[i].name);
    if (ZONES[i].id === 'valley' && !store.progress.flags.rainbowValley) store.mutateProgress((p) => { p.flags.rainbowValley = true; });
  }

  // ---- death ------------------------------------------------------------
  private die() {
    this.state = 'dying';
    this.stateT = 0;
    this.invuln = 0;
    this.input.enabled = false;
    this.devi.express('oops', 1.2);
    audio.sfx('gameover');
    audio.playMusic('none');
    this.setDeviOpacity(1);
    this.aura.visible = false;
  }

  private updateDying(dt: number) {
    this.speed = Math.max(0, this.speed - dt * 40);
    this.world.update(dt, this.speed, this.x, 0);
    for (const e of this.entities) { e.z += this.speed * dt; e.obj.position.z = e.z; e.obj.userData.update?.(this.t); }
    if (!this.grounded) {
      this.vy -= GRAVITY * dt; this.y = Math.max(0, this.y + this.vy * dt);
      if (this.y === 0) this.grounded = true;
    }
    this.setDeviOpacity(1);
    this.devi.update(dt, { mode: 'sit', speed: 0, vy: 0, laneVel: 0 });
    this.devi.root.position.set(this.x, this.y, 0);
    if (this.stateT > 1.4) this.devi.setBaseExpression('smile');
    // Gauri circles over Devi's head
    const a = this.t * 3;
    this.gauri.update(dt, new THREE.Vector3(this.x + Math.cos(a) * 0.6, 1.6 + Math.sin(this.t * 2) * 0.1, Math.sin(a) * 0.6), Math.cos(a) > 0 ? 1 : -1);
    // camera eases closer
    this.camPos.lerp(new THREE.Vector3(this.x + 1.6, 1.8, 3.4), Math.min(1, dt * 2));
    this.camLook.lerp(new THREE.Vector3(this.x, 0.8, 0), Math.min(1, dt * 3));
    this.camera.position.copy(this.camPos);
    this.camera.lookAt(this.camLook);
    if (this.state === 'dying' && this.stateT > 1.8) {
      this.state = 'over';
      this.finishRun();
    }
  }

  private finishRun() {
    const store = useGame.getState();
    const score = Math.floor(this.score);
    const dist = Math.floor(this.distance);
    store.setRun({ score, distance: dist, lives: 0, food: this.food, hygiene: this.hygiene, hygieneHazardsHit: this.hygieneHazardsHit });
    store.mutateProgress((p) => {
      p.runs++;
      p.totalScore += score;
      p.totalDistance += dist;
      p.totalFood += this.food;
      p.totalHygiene += this.hygiene;
      p.bestScore = Math.max(p.bestScore, score);
      p.bestDistance = Math.max(p.bestDistance, dist);
      if (dist >= 500 && this.hygieneHazardsHit === 0) p.flags.hygieneChampion = true;
    });
    const fresh = store.checkAchievements();
    store.setRun({ achievementsUnlocked: fresh, hazardLessons: [...this.hazardLessons] });
    if (fresh.length) audio.sfx('achievement');
    store.setScreen('gameover');
  }

  get lessons() { return this.hazardLessons; }

  private pushHud(force = false) {
    const store = useGame.getState();
    const run = store.run;
    const score = Math.floor(this.score);
    const dist = Math.floor(this.distance);
    const mult = this.multiplier();
    if (force || run.score !== score || run.distance !== dist || run.lives !== this.lives || run.food !== this.food || run.hygiene !== this.hygiene || run.multiplier !== mult) {
      store.setRun({ score, distance: dist, lives: this.lives, food: this.food, hygiene: this.hygiene, multiplier: mult });
    }
    const powers: ActivePower[] = [];
    for (const [id, rem] of this.powers) powers.push({ id, remaining: rem, duration: POWERUP_BY_ID[id].duration });
    const prev = store.powers;
    const changed = force || prev.length !== powers.length || powers.some((p, i) => prev[i]?.id !== p.id || Math.abs(prev[i].remaining - p.remaining) > 0.1);
    if (changed) store.setPowers(powers);
  }

}

// keep tree-shaking honest for helpers only used in some builds
void toon;
