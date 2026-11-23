// High-resolution image sprites for collectibles, hazards and power-ups.
//
// Each item is drawn from an illustration (itemArt.ts) — or from a real photo if
// one is listed in /assets/items/manifest.json — onto a 256px "sticker" with a
// thick outline and soft shadow so it reads clearly against any background.
// Textures are mipmapped with anisotropic filtering, and a sprite is a single
// quad (one draw call), so this is lighter than the old 3D props.

import * as THREE from 'three';
import { ITEM_ART } from './itemArt';
import { HAZARD_BY_ID, POWERUP_BY_ID, type PowerUpId } from '../../data/items';

const SIZE = 256;
const PAD = 18;

interface SpriteEntry { material: THREE.SpriteMaterial; dataUrl: string; aspect: number }
const registry = new Map<string, SpriteEntry>();

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function svgUrl(body: string, size = 512) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 100 100">${body}</svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

/** Power-ups: icon inside a coloured badge ring. */
function badgeArt(id: PowerUpId, art: string) {
  const c = POWERUP_BY_ID[id].color;
  return `<circle cx="50" cy="50" r="47" fill="${c}"/>
    <circle cx="50" cy="50" r="40" fill="#FAF3E3"/>
    <circle cx="50" cy="50" r="47" fill="none" stroke="#3A2420" stroke-width="2.4"/>
    <g transform="translate(18 18) scale(0.64)">${art}</g>`;
}

function sticker(img: CanvasImageSource, outline: string, inner?: string) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = SIZE;
  const ctx = canvas.getContext('2d')!;
  const iw = (img as HTMLImageElement).naturalWidth || SIZE;
  const ih = (img as HTMLImageElement).naturalHeight || SIZE;
  const box = SIZE - PAD * 2;
  const s = Math.min(box / iw, box / ih);
  const w = iw * s, h = ih * s;
  const x = (SIZE - w) / 2, y = (SIZE - h) / 2;

  // silhouette of the art, filled with a flat colour
  const sil = (color: string) => {
    const c = document.createElement('canvas');
    c.width = c.height = SIZE;
    const cx = c.getContext('2d')!;
    cx.drawImage(img, x, y, w, h);
    cx.globalCompositeOperation = 'source-in';
    cx.fillStyle = color;
    cx.fillRect(0, 0, SIZE, SIZE);
    return c;
  };
  const dilate = (src: HTMLCanvasElement, r: number) => {
    const c = document.createElement('canvas');
    c.width = c.height = SIZE;
    const cx = c.getContext('2d')!;
    for (let i = 0; i < 24; i++) {
      const a = (i / 24) * Math.PI * 2;
      cx.drawImage(src, Math.cos(a) * r, Math.sin(a) * r);
    }
    cx.drawImage(src, 0, 0);
    return c;
  };
  const outer = dilate(sil(outline), inner ? 11 : 8);
  ctx.save();
  ctx.shadowColor = 'rgba(58, 36, 32, 0.35)';
  ctx.shadowBlur = 8;
  ctx.shadowOffsetY = 5;
  ctx.drawImage(outer, 0, 0);
  ctx.restore();
  if (inner) ctx.drawImage(dilate(sil(inner), 5), 0, 0);
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, x, y, w, h);
  return canvas;
}

function makeEntry(canvas: HTMLCanvasElement, maxAniso: number): SpriteEntry {
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.generateMipmaps = true;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.anisotropy = maxAniso;
  const material = new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, fog: true });
  return { material, dataUrl: canvas.toDataURL('image/png'), aspect: 1 };
}

/** Build all sprites. Call once before gameplay; resolves with UI thumbnail URLs. */
export async function buildSprites(maxAniso = 8): Promise<Record<string, string>> {
  let photos: Record<string, string> = {};
  try {
    const res = await fetch('/assets/items/manifest.json', { cache: 'no-cache' });
    if (res.ok) photos = ((await res.json()) as { images?: Record<string, string> }).images ?? {};
  } catch { /* no manifest — use illustrations */ }

  const thumbs: Record<string, string> = {};
  await Promise.all(Object.entries(ITEM_ART).map(async ([key, art]) => {
    const isPower = key.startsWith('pu_');
    const id = isPower ? key.slice(3) : key;
    let img: HTMLImageElement | null = null;
    if (!isPower && photos[id]) {
      try { img = await loadImage(`/assets/items/${photos[id]}`); } catch { img = null; }
    }
    if (!img) {
      try { img = await loadImage(svgUrl(isPower ? badgeArt(id as PowerUpId, art) : art)); } catch {
        console.warn('item art failed to load:', key);
        img = await loadImage(svgUrl('<circle cx="50" cy="50" r="40" fill="#E2A93B"/>'));
      }
    }
    const hazard = !!HAZARD_BY_ID[id];
    const canvas = hazard ? sticker(img, '#C4452E', '#FFFFFF') : sticker(img, '#FFFFFF');
    const entry = makeEntry(canvas, maxAniso);
    registry.set(key, entry);
    thumbs[isPower ? `pu-${id}` : id] = entry.dataUrl;
  }));
  return thumbs;
}

/** A billboard sprite for an item id (power-ups use `pu_<id>`). */
export function createSprite(key: string, height: number): THREE.Sprite {
  const entry = registry.get(key);
  const sprite = new THREE.Sprite(entry?.material ?? new THREE.SpriteMaterial({ color: '#E2A93B' }));
  sprite.scale.set(height, height, 1);
  sprite.userData.baseScale = height;
  sprite.renderOrder = 2;
  return sprite;
}

export function spritesReady() { return registry.size > 0; }
