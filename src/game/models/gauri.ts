// Gauri the house sparrow — Devi's companion from the storyboard.
// Brown & buff feathers, a rufous cap, a pale eyebrow stripe and a rose thread.

import * as THREE from 'three';
import { C, G, toon, flat, torusArc, mergeStatic } from '../materials';

export class Gauri {
  root = new THREE.Group();
  private body = new THREE.Group();
  private wingL: THREE.Group;
  private wingR: THREE.Group;
  private head: THREE.Group;
  private t = 0;
  private flipT = 0;
  private vel = new THREE.Vector3();
  perched = false;

  constructor() {
    const buff = toon('#F1DDB6');
    const brown = toon('#8C5A3A');
    const dark = toon('#5A3622');
    const cap = toon('#A95A32');
    this.root.add(this.body);
    const m = (geo: THREE.BufferGeometry, mat: THREE.Material, x: number, y: number, z: number, sx: number, sy = sx, sz = sx) => {
      const mm = new THREE.Mesh(geo, mat);
      mm.position.set(x, y, z); mm.scale.set(sx, sy, sz); mm.castShadow = true;
      return mm;
    };
    // body faces +z
    this.body.add(m(G.sphere, buff, 0, 0, 0, 0.13, 0.12, 0.16));
    this.body.add(m(G.sphere, brown, 0, 0.035, -0.02, 0.12, 0.09, 0.15)); // back
    this.body.add(m(G.sphere, toon('#FBEBD0'), 0, -0.04, 0.05, 0.09, 0.07, 0.09)); // belly
    // tail
    const tail = new THREE.Group();
    tail.position.set(0, 0.02, -0.15);
    tail.rotation.x = -0.35;
    for (let i = -1; i <= 1; i++) {
      const f = m(G.box, i === 0 ? dark : brown, i * 0.025, 0, -0.07, 0.03, 0.012, 0.15);
      f.rotation.y = i * 0.2;
      tail.add(f);
    }
    this.body.add(tail);
    // wings
    const mkWing = (side: number) => {
      const w = new THREE.Group();
      w.position.set(side * 0.1, 0.05, 0);
      w.add(m(G.sphere, brown, side * 0.07, 0, -0.02, 0.09, 0.025, 0.12));
      w.add(m(G.sphere, dark, side * 0.12, -0.005, -0.06, 0.06, 0.02, 0.08));
      this.body.add(w);
      return w;
    };
    this.wingL = mkWing(1);
    this.wingR = mkWing(-1);
    // head
    this.head = new THREE.Group();
    this.head.position.set(0, 0.11, 0.1);
    this.body.add(this.head);
    this.head.add(m(G.sphere, buff, 0, 0, 0, 0.1));
    const capMesh = new THREE.Mesh(new THREE.SphereGeometry(0.104, 16, 10, 0, Math.PI * 2, 0, 1.3), cap);
    capMesh.rotation.x = -0.5;
    this.head.add(capMesh);
    const brow = flat('#F8EEDC');
    for (const s of [1, -1]) {
      const e = m(G.sphere, flat('#1A110D'), s * 0.055, 0.01, 0.07, 0.022, 0.026, 0.014);
      e.rotation.y = s * 0.6;
      this.head.add(e);
      this.head.add(m(G.sphereLo, flat('#FFFFFF'), s * 0.058, 0.02, 0.083, 0.007));
      const stripe = new THREE.Mesh(torusArc(0.05, 0.007, 1.6), brow);
      stripe.position.set(s * 0.045, 0.0, 0.055);
      stripe.rotation.set(0, s * 0.8, Math.PI / 2 - 0.8);
      this.head.add(stripe);
      this.head.add(m(G.circle, flat(C.rose, 0.5, 'gblush'), s * 0.065, -0.035, 0.065, 0.018).rotateY(s * 0.7));
    }
    const beak = m(G.cone, toon('#4A4646'), 0, -0.01, 0.12, 0.028, 0.07, 0.028);
    beak.rotation.x = Math.PI / 2;
    this.head.add(beak);
    // legs + rose thread
    for (const s of [1, -1]) {
      this.body.add(m(G.cylLo, toon('#C08A5C'), s * 0.04, -0.13, 0.02, 0.008, 0.07, 0.008));
    }
    this.body.add(m(new THREE.TorusGeometry(0.014, 0.005, 5, 10), toon(C.rose), 0.04, -0.13, 0.02, 1).rotateX(Math.PI / 2));
    mergeStatic(this.root);
  }

  flip() { this.flipT = 0.7; }

  /** Follow a target point with a springy flight. */
  update(dt: number, target: THREE.Vector3, faceDir = 1) {
    this.t += dt;
    const p = this.root.position;
    const k = 6, d = 4.2;
    this.vel.x += ((target.x - p.x) * k - this.vel.x * d) * dt * 4;
    this.vel.y += ((target.y - p.y) * k - this.vel.y * d) * dt * 4;
    this.vel.z += ((target.z - p.z) * k - this.vel.z * d) * dt * 4;
    p.addScaledVector(this.vel, dt);
    const flap = this.perched ? Math.sin(this.t * 3) * 0.1 + 0.2 : Math.sin(this.t * 26) * 0.9;
    this.wingL.rotation.z = flap;
    this.wingR.rotation.z = -flap;
    this.body.position.y = this.perched ? 0 : Math.sin(this.t * 4) * 0.04;
    this.head.rotation.y = Math.sin(this.t * 1.3) * 0.3;
    this.head.rotation.x = this.perched ? Math.sin(this.t * 2.2) * 0.15 : 0;
    let roll = 0;
    if (this.flipT > 0) {
      this.flipT -= dt;
      roll = (1 - this.flipT / 0.7) * Math.PI * 2;
    }
    this.root.rotation.set(-this.vel.y * 0.04 + (this.perched ? 0 : 0.1), faceDir > 0 ? 0 : Math.PI, -this.vel.x * 0.08);
    this.body.rotation.z = roll;
  }
}
