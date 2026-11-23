# POWER DASH

A 3D educational endless runner. Run with **Devi** through the Wellness World, collect healthy food and menstrual-hygiene products, avoid unsafe hygiene habits and too many treats, and learn along the way.

## Run it

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # production build in dist/
```

Dev-only model viewer: `http://localhost:5173/preview.html?m=devi|class|maa|gauri|items|obs&view=front|back|side&mode=idle|run|jump|slide|sit|wave|cheer`

## Controls

| Desktop | Mobile | Action |
|---|---|---|
| ← / A | swipe left | move left |
| → / D | swipe right | move right |
| ↑ / W / Space | swipe up | jump |
| ↓ / S | swipe down | slide (fast-drop in the air) |
| Esc / P | pause button | pause |

## Characters and art direction

The cast and the look come from the **"Devi / Aangan" storyboard**:

- **Devi** (eleven): twin plaits with red ribbons, haldi kurta with a red sprig block print, indigo pants, red sandals, a dark bangle and a red thread. For the game she also carries a teal period-kit backpack. She's rebuilt as a rigged, cel-shaded 3D model (`src/game/models/kid.ts`) with blended procedural animation: idle, run, jump/land, slide, lane-lean, collect, power-up twirl, stumble and sit-down game over. Her plaits swing on spring physics, and she has blinking and five expressions.
- **Gauri** the house sparrow flies beside Devi, flips when you discover something, and delivers the tips (`gauri.ts`).
- **Maa** waves from a charpai in Sunrise City, and the classmates **Meher, Nazia and Anjali** cheer from Knowledge Boulevard.
- The palette uses the storyboard swatches: chandan, haldi, terracotta, sindoor, indigo, neem, deep teal, devi rose and ink brown. Moodboard details appear in the world: blue doors, charpais, water tanks, clotheslines, the school courtyard with its blue railing and peepal tree, rangoli, and the dusk terrace sky.

All models, textures, music and sound effects are generated in code (Three.js primitives, canvas textures, Web Audio synthesis), so there are no external assets or licences to track.

### Item images (and using real photos)

Collectibles, hazards and power-ups are high-resolution image sprites (`src/game/models/itemArt.ts` → `sprites.ts`). Each is drawn at 256 px with a sticker outline: white for good items, red for things to avoid. The same images are used for the HUD and Encyclopedia thumbnails.

To use a **real photo** instead, put a transparent-background PNG or WebP (about 512×512) in `public/assets/items/` and list it in `public/assets/items/manifest.json`, for example `"images": { "apple": "apple.webp" }`. Listed items load the photo, get the same sticker outline, and fall back to the illustration if the file is missing.

## Structure

```
src/
  game/
    Game.ts            engine: loop, physics, collisions, power-ups, combos, camera, effects
    spawner.ts         fair procedural patterns (always a reachable safe lane)
    particles.ts       pooled point-sprite effects
    input.ts           keyboard + swipe (threshold, no page scroll)
    materials.ts       palette, toon materials, geometry batching (vertex colours)
    models/            kid.ts (Devi, classmates, Maa), gauri.ts, items.ts (all props)
    world/             scenery.ts (4 zones), world.ts (segments, sky, zone blending, traffic, cameos)
  components/          React UI: menu, HUD, pause, results, learning center, encyclopedia, achievements, settings
  data/                items, learning content, achievements
  systems/             audio (synth music + SFX), persistence (localStorage)
  store/               Zustand game store
```

## Educational content

The content lives in `src/data/items.ts` and `src/data/learning.ts` so it can be reviewed in one place. It's written to be stigma-free and age-appropriate, following NHS, WHO/UNICEF and US Office on Women's Health guidance. It separates **safe and unsafe practices**: pads, tampons, cups and cloth pads are never shown as "bad". The game is not medical advice, and it says so in the Learning Center.

## Privacy

There are no accounts, ads, chat or analytics. Progress is saved only in `localStorage`, and Settings has a "Reset all progress" option.
