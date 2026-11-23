// Dev-only model viewer: /preview.html?m=devi|class|maa&mode=run&view=front|back|side
import * as THREE from 'three';
import { MODEL_IDS, createModel, createPowerUp } from './game/models/items';
import { Gauri } from './game/models/gauri';
import { Kid, DEVI_STYLE, MEHER_STYLE, NAZIA_STYLE, ANJALI_STYLE, buildMaa, type AnimMode } from './game/models/kid';

const q = new URLSearchParams(location.search);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(2, devicePixelRatio));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);
const scene = new THREE.Scene();
scene.background = new THREE.Color('#F2E6CF');
scene.add(new THREE.HemisphereLight('#FFF4E0', '#B8643F', 1.6));
const sun = new THREE.DirectionalLight('#FFE6C2', 2.2);
sun.position.set(3, 6, 4);
sun.castShadow = true;
scene.add(sun);
const ground = new THREE.Mesh(new THREE.CircleGeometry(4, 32), new THREE.MeshToonMaterial({ color: '#E7D3AE' }));
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);
const cam = new THREE.PerspectiveCamera(35, innerWidth / innerHeight, 0.1, 100);
const view = q.get('view') ?? 'front';
const mode = (q.get('mode') ?? 'idle') as AnimMode;
const kids: Kid[] = [];
const m = q.get('m') ?? 'devi';
const updaters: THREE.Object3D[] = [];
let gauriRef: Gauri | null = null;
let maaUpdate: ((t: number) => void) | null = null;
if (m === 'class') {
  [MEHER_STYLE, NAZIA_STYLE, ANJALI_STYLE, DEVI_STYLE].forEach((s, i) => {
    const k = new Kid(s); k.root.position.x = (i - 1.5) * 0.8; scene.add(k.root); kids.push(k);
  });
} else if (m === 'items' || m === 'obs') {
  const ids = MODEL_IDS.filter((id) => (m === 'obs' ? id.startsWith('ob_') : !id.startsWith('ob_')));
  const cols = m === 'obs' ? 5 : 9;
  const sp = m === 'obs' ? 2.6 : 0.75;
  ids.forEach((id, i) => {
    const g = id.startsWith('pu_') ? createPowerUp(id.slice(3), '#E2A93B') : createModel(id);
    g.position.set(((i % cols) - (cols - 1) / 2) * sp, m === 'obs' ? 0 : 2.4 - Math.floor(i / cols) * 0.75, m === 'obs' ? -Math.floor(i / cols) * 3 : 0);
    if (m !== 'obs') g.position.y += 0;
    scene.add(g);
    updaters.push(g);
  });
} else if (m === 'gauri') {
  const g = new Gauri(); g.root.scale.setScalar(4); g.root.position.y = 1; scene.add(g.root);
  gauriRef = g;
} else if (m === 'maa') {
  const maa = buildMaa(); scene.add(maa.group); maaUpdate = maa.update;
} else {
  const k = new Kid(DEVI_STYLE); scene.add(k.root); kids.push(k);
}
const dist = m === 'class' ? 5.5 : m === 'items' ? 8 : m === 'obs' ? 16 : 3.2;
const pos = { front: [0, 1.0, dist], back: [0, 1.2, -dist], side: [dist, 1.0, 0], three: [dist * 0.7, 1.4, dist * 0.7] }[view] ?? [0, 1, dist];
cam.position.set(pos[0], pos[1], pos[2]);
cam.lookAt(0, m === 'items' ? 1.3 : m === 'obs' ? 0.5 : 0.8, m === 'obs' ? -3 : 0);
const clock = new THREE.Clock();
renderer.setAnimationLoop(() => {
  const dt = Math.min(0.05, clock.getDelta());
  kids.forEach((k) => k.update(dt, { mode, speed: 0.4, vy: mode === 'jump' ? 4 : 0, laneVel: 0 }));
  maaUpdate?.(clock.elapsedTime);
  updaters.forEach((u) => { u.userData.update?.(clock.elapsedTime); if (m === 'items') u.rotation.y = Math.sin(clock.elapsedTime) * 0.6; });
  if (gauriRef) gauriRef.update(dt, new THREE.Vector3(0, 1, 0));
  renderer.render(scene, cam);
});
