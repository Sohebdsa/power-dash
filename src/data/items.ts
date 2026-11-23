// All collectible, hazard and power-up definitions. Educational text lives here so
// it can be reviewed in one place.

export type FoodCategory = 'fruit' | 'vegetable' | 'protein';
export type CollectCategory = FoodCategory | 'hygiene';

export interface CollectibleDef {
  id: string;
  name: string;
  category: CollectCategory;
  points: number;
  fact: string;
  /** Longer encyclopedia note. */
  more: string;
}

export const FOODS: CollectibleDef[] = [
  { id: 'apple', name: 'Apple', category: 'fruit', points: 10,
    fact: 'Apples provide dietary fibre, which helps your digestion.',
    more: 'Eat apples with the skin on — most of the fibre is just under the peel.' },
  { id: 'banana', name: 'Banana', category: 'fruit', points: 10,
    fact: 'Bananas provide potassium, which helps your muscles and nerves work.',
    more: 'A banana is an easy snack before you play or run around.' },
  { id: 'orange', name: 'Orange', category: 'fruit', points: 10,
    fact: 'Oranges are a source of vitamin C, which helps your body absorb iron.',
    more: 'Pairing vitamin C foods with iron foods (like dal or spinach) helps your body use the iron.' },
  { id: 'strawberry', name: 'Strawberry', category: 'fruit', points: 15,
    fact: 'Strawberries are packed with vitamin C too!',
    more: 'Berries are colourful because of natural plant pigments.' },
  { id: 'watermelon', name: 'Watermelon', category: 'fruit', points: 20,
    fact: 'Watermelon is mostly water, so it helps you stay hydrated.',
    more: 'Juicy fruits are a tasty way to get extra water on hot days.' },
  { id: 'carrot', name: 'Carrot', category: 'vegetable', points: 10,
    fact: 'Carrots contain beta-carotene, which your body can convert into vitamin A.',
    more: 'Vitamin A helps keep your eyes and skin healthy.' },
  { id: 'broccoli', name: 'Broccoli', category: 'vegetable', points: 15,
    fact: 'Broccoli gives you vitamin C, fibre and folate.',
    more: 'Lightly cooking broccoli keeps it crunchy and full of nutrients.' },
  { id: 'spinach', name: 'Spinach', category: 'vegetable', points: 15,
    fact: 'Spinach contains iron. Iron helps your blood carry oxygen around your body.',
    more: 'Leafy greens like spinach (palak) and methi are easy to add to dal or roti.' },
  { id: 'tomato', name: 'Tomato', category: 'vegetable', points: 10,
    fact: 'Tomatoes contain vitamin C and a red pigment called lycopene.',
    more: 'Tomatoes are technically a fruit, but we cook them like a vegetable!' },
  { id: 'egg', name: 'Egg', category: 'protein', points: 20,
    fact: 'Eggs provide protein, which helps your body grow and repair tissues.',
    more: 'Eggs also contain vitamin D and iron.' },
  { id: 'milk', name: 'Milk', category: 'protein', points: 20,
    fact: 'Milk provides calcium, which helps maintain healthy bones.',
    more: 'Curd, paneer and ragi are other great sources of calcium.' },
  { id: 'almonds', name: 'Almonds', category: 'protein', points: 20,
    fact: 'Almonds give you protein, healthy fats and vitamin E.',
    more: 'A small handful of nuts is a filling snack.' },
  { id: 'beans', name: 'Beans & Dal', category: 'protein', points: 15,
    fact: 'Beans and lentils (dal) provide protein, fibre and iron.',
    more: 'Rajma, chana and dal are protein-rich foods enjoyed across India.' },
];

export const HYGIENE: CollectibleDef[] = [
  { id: 'pad', name: 'Sanitary Pad', category: 'hygiene', points: 30,
    fact: 'Sanitary pads absorb menstrual blood. Change them regularly according to your flow and the product instructions.',
    more: 'Pads come in sizes for lighter days, heavier days and night-time. Most people change every 4–6 hours.' },
  { id: 'tampon', name: 'Tampon', category: 'hygiene', points: 30,
    fact: 'Tampons absorb menstrual blood internally. Follow the instructions and change them within the recommended time — never more than 8 hours.',
    more: 'Tampons are one of several options. You don\'t have to use them — choose what feels right for you.' },
  { id: 'cup', name: 'Menstrual Cup', category: 'hygiene', points: 35,
    fact: 'Menstrual cups collect menstrual blood and can be reused when properly emptied, cleaned and maintained according to instructions.',
    more: 'Cups are made of soft medical-grade silicone and are sterilised by boiling between periods.' },
  { id: 'cloth', name: 'Reusable Cloth Pad', category: 'hygiene', points: 30,
    fact: 'Reusable cloth pads can be a safe option. Wash them thoroughly, dry them completely, and store them in a clean place.',
    more: 'Drying cloth pads in direct sunlight helps kill germs.' },
  { id: 'kit', name: 'Period Kit', category: 'hygiene', points: 60,
    fact: 'Keeping a small period kit can help you feel prepared and confident.',
    more: 'A kit can hold pads, clean underwear, tissues and a disposal bag.' },
  { id: 'water', name: 'Clean Water', category: 'hygiene', points: 20,
    fact: 'Clean water helps maintain personal hygiene during menstruation.',
    more: 'Wash your hands before and after changing a product, and wash your body with clean water every day.' },
];

export const COLLECTIBLES: CollectibleDef[] = [...FOODS, ...HYGIENE];
export const COLLECTIBLE_BY_ID: Record<string, CollectibleDef> =
  Object.fromEntries(COLLECTIBLES.map((c) => [c.id, c]));

// ---------------------------------------------------------------------------
// Hazards — things to avoid. The message is shown when the player bumps one.

export type HazardKind = 'hygiene' | 'junk';

export interface HazardDef {
  id: string;
  name: string;
  kind: HazardKind;
  message: string;
}

export const HAZARDS: HazardDef[] = [
  // Hygiene practice hazards (unsafe practices, never the products themselves)
  { id: 'unwashed_cloth', name: 'Unwashed cloth', kind: 'hygiene',
    message: 'Wash reusable cloth pads thoroughly with soap and clean water.' },
  { id: 'damp_cloth', name: 'Damp cloth', kind: 'hygiene',
    message: 'Dry reusable cloth pads completely — sunlight is best — before storing.' },
  { id: 'stored_used', name: 'Used product left out', kind: 'hygiene',
    message: 'Never reuse disposable pads. Wrap used ones and put them in a covered bin.' },
  { id: 'unclean_product', name: 'Dirty product', kind: 'hygiene',
    message: 'Always use clean menstrual products from a clean, dry pack.' },
  { id: 'bad_disposal', name: 'Unsafe disposal', kind: 'hygiene',
    message: 'Dispose of used pads hygienically — never flush them or throw them in the open.' },
  // Junk food (avoid in excess — messaging stays positive)
  { id: 'burger', name: 'Burger', kind: 'junk',
    message: 'Treats are okay sometimes. Enjoy different foods as part of a balanced diet.' },
  { id: 'pizza', name: 'Pizza', kind: 'junk',
    message: 'Balance your plate with vegetables, protein and grains.' },
  { id: 'fries', name: 'French fries', kind: 'junk',
    message: 'Your body needs a variety of nutritious foods.' },
  { id: 'donut', name: 'Donut', kind: 'junk',
    message: 'Sweet treats are best enjoyed once in a while.' },
  { id: 'soda', name: 'Sugary soda', kind: 'junk',
    message: 'Too much added sugar can affect your health. Water is a great choice!' },
  { id: 'candy', name: 'Candy', kind: 'junk',
    message: 'Too much added sugar can affect your teeth and health.' },
];
export const HAZARD_BY_ID: Record<string, HazardDef> = Object.fromEntries(HAZARDS.map((h) => [h.id, h]));

// ---------------------------------------------------------------------------
// Power-ups

export type PowerUpId =
  | 'shield' | 'hygieneMagnet' | 'foodMagnet' | 'knowledge' | 'confidence'
  | 'preparation' | 'protein' | 'energy' | 'superJump';

export interface PowerUpDef {
  id: PowerUpId;
  name: string;
  short: string;
  description: string;
  /** seconds; 0 = until used */
  duration: number;
  color: string;
}

export const POWERUPS: PowerUpDef[] = [
  { id: 'shield', name: 'Period Care Shield', short: 'Shield', duration: 0, color: '#4F86C6',
    description: 'Protects you from one bump or hazard.' },
  { id: 'hygieneMagnet', name: 'Hygiene Kit Magnet', short: 'Kit Magnet', duration: 9, color: '#C66161',
    description: 'Pulls nearby hygiene products towards you.' },
  { id: 'foodMagnet', name: 'Food Magnet', short: 'Food Magnet', duration: 9, color: '#7E9A6E',
    description: 'Pulls nearby healthy food towards you.' },
  { id: 'knowledge', name: 'Knowledge Boost', short: 'Knowledge ×2', duration: 12, color: '#E2A93B',
    description: 'Doubles the points from hygiene products.' },
  { id: 'confidence', name: 'Confidence Boost', short: 'Confidence', duration: 10, color: '#C4452E',
    description: 'Adds +1 to your score multiplier.' },
  { id: 'preparation', name: 'Preparation Boost', short: 'Prepared', duration: 6, color: '#3F6E68',
    description: 'Being prepared keeps you safe — no bumps can stop you for a while.' },
  { id: 'protein', name: 'Protein Boost', short: 'Protein ×2', duration: 10, color: '#B8643F',
    description: 'Doubles the points from healthy food.' },
  { id: 'energy', name: 'Energy Boost', short: 'Energy', duration: 5, color: '#F0B232',
    description: 'A burst of speed! You zoom safely past everything.' },
  { id: 'superJump', name: 'Super Jump', short: 'Super Jump', duration: 10, color: '#2F4A73',
    description: 'Jump much higher for a while.' },
];
export const POWERUP_BY_ID = Object.fromEntries(POWERUPS.map((p) => [p.id, p])) as Record<PowerUpId, PowerUpDef>;
