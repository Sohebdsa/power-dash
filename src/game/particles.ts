import * as THREE from 'three';

// One pooled point-sprite system for every effect (bursts, dust, sparkles, trails).

const MAX = 700;

export class Particles {
  points: THREE.Points;
  private pos = new Float32Array(MAX * 3);
  private col = new Float32Array(MAX * 3);
  private size = new Float32Array(MAX);
  private vel = new Float32Array(MAX * 3);
  private life = new Float32Array(MAX);
  private maxLife = new Float32Array(MAX);
  private baseSize = new Float32Array(MAX);
  private gravity = new Float32Array(MAX);
  private drag = new Float32Array(MAX);
  private cursor = 0;
  private geo: THREE.BufferGeometry;
  private tmp = new THREE.Color();

  constructor(scene: THREE.Scene) {
    this.geo = new THREE.BufferGeometry();
    this.geo.setAttribute('position', new THREE.BufferAttribute(this.pos, 3).setUsage(THREE.DynamicDrawUsage));
    this.geo.setAttribute('color', new THREE.BufferAttribute(this.col, 3).setUsage(THREE.DynamicDrawUsage));
    this.geo.setAttribute('size', new THREE.BufferAttribute(this.size, 1).setUsage(THREE.DynamicDrawUsage));
    const mat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      uniforms: { scale: { value: 420 } },
      vertexShader: `attribute float size; attribute vec3 color; varying vec3 vColor; varying float vA; uniform float scale;
        void main(){ vColor = color; vA = clamp(size * 4.0, 0.0, 1.0); vec4 mv = modelViewMatrix * vec4(position,1.0);
        gl_PointSize = size * scale / -mv.z; gl_Position = projectionMatrix * mv; }`,
      fragmentShader: `varying vec3 vColor; varying float vA;
        void main(){ vec2 c = gl_PointCoord - 0.5; float d = length(c); if (d > 0.5) discard;
        float a = smoothstep(0.5, 0.25, d) * vA; gl_FragColor = vec4(vColor, a); }`,
    });
    this.points = new THREE.Points(this.geo, mat);
    this.points.frustumCulled = false;
    this.points.renderOrder = 5;
    scene.add(this.points);
  }

  setScale(px: number) {
    (this.points.material as THREE.ShaderMaterial).uniforms.scale.value = px;
  }

  emit(x: number, y: number, z: number, opts: {
    count: number; color: string | string[]; speed?: number; up?: number; size?: number; life?: number;
    gravity?: number; spread?: number; drag?: number; vz?: number;
  }) {
    const colors = Array.isArray(opts.color) ? opts.color : [opts.color];
    const sp = opts.speed ?? 3;
    for (let n = 0; n < opts.count; n++) {
      const i = this.cursor;
      this.cursor = (this.cursor + 1) % MAX;
      const s = opts.spread ?? 0.1;
      this.pos[i * 3] = x + (Math.random() - 0.5) * s;
      this.pos[i * 3 + 1] = y + (Math.random() - 0.5) * s;
      this.pos[i * 3 + 2] = z + (Math.random() - 0.5) * s;
      const a = Math.random() * Math.PI * 2;
      const e = Math.random() * 2 - 1;
      const r = Math.sqrt(1 - e * e);
      const v = sp * (0.4 + Math.random() * 0.6);
      this.vel[i * 3] = Math.cos(a) * r * v;
      this.vel[i * 3 + 1] = e * v * 0.6 + (opts.up ?? 0);
      this.vel[i * 3 + 2] = Math.sin(a) * r * v + (opts.vz ?? 0);
      this.tmp.set(colors[Math.floor(Math.random() * colors.length)]);
      this.col[i * 3] = this.tmp.r; this.col[i * 3 + 1] = this.tmp.g; this.col[i * 3 + 2] = this.tmp.b;
      const l = (opts.life ?? 0.6) * (0.7 + Math.random() * 0.6);
      this.life[i] = l;
      this.maxLife[i] = l;
      this.baseSize[i] = (opts.size ?? 0.12) * (0.7 + Math.random() * 0.6);
      this.gravity[i] = opts.gravity ?? 6;
      this.drag[i] = opts.drag ?? 1.5;
    }
  }

  update(dt: number, worldDz: number) {
    for (let i = 0; i < MAX; i++) {
      if (this.life[i] <= 0) { this.size[i] = 0; continue; }
      this.life[i] -= dt;
      const d = Math.max(0, 1 - this.drag[i] * dt);
      this.vel[i * 3] *= d; this.vel[i * 3 + 1] *= d; this.vel[i * 3 + 2] *= d;
      this.vel[i * 3 + 1] -= this.gravity[i] * dt;
      this.pos[i * 3] += this.vel[i * 3] * dt;
      this.pos[i * 3 + 1] += this.vel[i * 3 + 1] * dt;
      this.pos[i * 3 + 2] += this.vel[i * 3 + 2] * dt + worldDz;
      if (this.pos[i * 3 + 1] < 0.02) { this.pos[i * 3 + 1] = 0.02; this.vel[i * 3 + 1] *= -0.3; }
      const t = this.life[i] / this.maxLife[i];
      this.size[i] = this.baseSize[i] * Math.min(1, t * 3);
    }
    this.geo.attributes.position.needsUpdate = true;
    this.geo.attributes.color.needsUpdate = true;
    this.geo.attributes.size.needsUpdate = true;
  }

  clear() { this.life.fill(0); this.size.fill(0); }
}
