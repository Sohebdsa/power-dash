// Illustrated item art (SVG, viewBox 0 0 100 100), in the flat "Aangan"
// storyboard style: warm palette, soft highlights, ink-brown outlines.
// These are rasterised at high resolution into sprite textures (see sprites.ts).

const K = '#3A2420'; // ink outline
const ow = (w = 2.6) => `stroke="${K}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;
const o = ow();
const hi = (cx: number, cy: number, rx: number, ry: number, rot = -30) =>
  `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="#fff" opacity="0.55" transform="rotate(${rot} ${cx} ${cy})"/>`;
const fly = (x: number, y: number) =>
  `<g><ellipse cx="${x - 2.5}" cy="${y - 2.5}" rx="3" ry="1.8" fill="#DDE7EC" opacity="0.9"/><ellipse cx="${x + 2.5}" cy="${y - 2.5}" rx="3" ry="1.8" fill="#DDE7EC" opacity="0.9"/><circle cx="${x}" cy="${y}" r="2.4" fill="#2B2420"/></g>`;
const stink = (x: number, y: number) =>
  `<path d="M${x} ${y}c-3-4 3-6 0-10s3-6 0-10" fill="none" stroke="#8E9A7E" stroke-width="2.4" stroke-linecap="round"/>`;

export const ITEM_ART: Record<string, string> = {
  // ---------------- fruit
  apple: `<path d="M50 30c-8-6-26-6-30 10-4 18 8 42 20 44 5 1 7-2 10-2s5 3 10 2c12-2 24-26 20-44-4-16-22-16-30-10Z" fill="#D2402E" ${o}/>
    <path d="M50 30c0-6 2-12 6-16" fill="none" ${ow(3.4)}/>
    <path d="M56 22c6-8 16-8 20-4-4 6-12 8-20 4Z" fill="#6E9A4E" ${o}/>
    ${hi(32, 44, 5, 9)}`,
  banana: `<path d="M18 30c2 26 24 46 56 40 6-1 10-4 10-8-26 6-48-8-56-34-2-6-10-4-10 2Z" fill="#F4C842" ${o}/>
    <path d="M24 36c8 18 26 30 52 28" fill="none" stroke="#D9A72A" stroke-width="2.4"/>
    <path d="M18 30l-2-8 6-1 2 6" fill="#7A5A28" ${o}/>
    <circle cx="83" cy="63" r="3" fill="#5A3E1E"/>`,
  orange: `<circle cx="50" cy="54" r="30" fill="#EE8A26" ${o}/>
    ${[[38, 46], [56, 40], [62, 60], [44, 66], [50, 52], [34, 58], [66, 48]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.4" fill="#C96A14"/>`).join('')}
    <path d="M50 24c4-8 14-12 22-8-4 8-12 10-22 8Z" fill="#6E9A4E" ${o}/>
    <circle cx="50" cy="25" r="2.5" fill="#6B4A22"/>
    ${hi(38, 42, 5, 9)}`,
  strawberry: `<path d="M50 88C30 74 18 56 22 40c3-10 14-12 28-10 14-2 25 0 28 10 4 16-8 34-28 48Z" fill="#DE3B3B" ${o}/>
    ${[[36, 44], [50, 42], [64, 44], [42, 56], [58, 56], [50, 68], [32, 54], [68, 54], [46, 78], [56, 70]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="1.6" ry="2.4" fill="#F8DA6E"/>`).join('')}
    <path d="M30 32l8 4 4-10 8 8 8-8 4 10 8-4-6 10H36Z" fill="#5E8A44" ${o}/>
    <path d="M50 26v-10" ${ow(3.2)}/>
    ${hi(34, 48, 3.5, 7)}`,
  watermelon: `<path d="M12 40a38 38 0 0 0 76 0Z" fill="#4E8A3C" ${o}/>
    <path d="M18 40a32 32 0 0 0 64 0Z" fill="#EEF2D2"/>
    <path d="M22 40a28 28 0 0 0 56 0Z" fill="#EB4D4B"/>
    ${[[36, 50], [50, 56], [64, 50], [43, 62], [57, 62]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="2" ry="3.2" fill="${K}"/>`).join('')}
    <path d="M12 40h76" ${o}/>`,
  // ---------------- vegetables
  carrot: `<path d="M38 34c8-4 18-2 22 4L40 88c-2 4-6 4-6 0Z" fill="#EC7B2A" ${o}/>
    <path d="M42 46l8 2M38 58l7 2M36 70l6 2" stroke="#C25E16" stroke-width="2.4" stroke-linecap="round"/>
    <path d="M46 34c-4-10-2-20 2-24 2 8 2 16 2 22M50 32c2-10 10-18 16-18-2 8-8 14-14 20M44 34c-8-6-12-14-12-20 8 2 12 10 14 18" fill="#5E8A44" ${o}/>`,
  broccoli: `<path d="M44 58h12l4 30H40Z" fill="#A9C67A" ${o}/>
    <circle cx="34" cy="48" r="14" fill="#4E8A3C" ${o}/><circle cx="66" cy="48" r="14" fill="#4E8A3C" ${o}/>
    <circle cx="50" cy="36" r="17" fill="#5A9646" ${o}/><circle cx="50" cy="54" r="12" fill="#4E8A3C" ${o}/>
    ${[[44, 30], [56, 34], [30, 44], [68, 44], [50, 46]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="3" fill="#6FAE58"/>`).join('')}`,
  spinach: `<path d="M50 86C30 70 20 44 34 18c14 10 20 38 16 68Z" fill="#3F7A36" ${o}/>
    <path d="M50 86c20-16 30-42 16-68-14 10-20 38-16 68Z" fill="#4E8E40" ${o}/>
    <path d="M50 86c-6-24 0-50 0-72" fill="none" stroke="#A9C67A" stroke-width="2.6"/>
    <path d="M40 30l6 6M38 46l8 6M60 30l-6 6M62 46l-8 6" stroke="#A9C67A" stroke-width="2" stroke-linecap="round"/>
    <rect x="42" y="72" width="16" height="7" rx="3" fill="#C4452E" ${o}/>`,
  tomato: `<ellipse cx="50" cy="56" rx="32" ry="28" fill="#DC3F2E" ${o}/>
    <path d="M50 30l6-8 2 9 10-2-6 8 8 4-10 1L50 38l-10 4-10-1 8-4-6-8 10 2 2-9Z" fill="#5E8A44" ${o}/>
    ${hi(36, 48, 5, 9)}`,
  // ---------------- protein
  egg: `<path d="M50 12c18 0 30 30 30 48 0 16-13 28-30 28S20 76 20 60c0-18 12-48 30-48Z" fill="#F8F0DE" ${o}/>
    ${hi(38, 38, 5, 11, -20)}
    <path d="M30 70c4 8 12 12 20 12" fill="none" stroke="#E2D3B4" stroke-width="3" stroke-linecap="round"/>`,
  milk: `<path d="M38 18h24v10l8 12v42a6 6 0 0 1-6 6H36a6 6 0 0 1-6-6V40l8-12Z" fill="#FFFFFF" ${o}/>
    <rect x="36" y="10" width="28" height="10" rx="3" fill="#4F86C6" ${o}/>
    <path d="M30 54h40v18H30Z" fill="#2F4A73"/>
    <path d="M44 63c2-4 8-4 10 0" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/>
    <path d="M30 40h40" stroke="#E6EEF5" stroke-width="3"/>
    ${hi(38, 46, 3, 10, 0)}`,
  almonds: [[36, 48, -30], [62, 44, 25], [50, 68, 80]].map(([x, y, r]) =>
    `<g transform="rotate(${r} ${x} ${y})"><path d="M${x} ${y - 18}c10 6 12 20 0 32-12-12-10-26 0-32Z" fill="#B0703E" ${o}/><path d="M${x - 3} ${y - 8}l2 3M${x + 2} ${y}l2 3M${x - 3} ${y + 6}l2 2" stroke="#8A5228" stroke-width="2" stroke-linecap="round"/></g>`).join(''),
  beans: `<path d="M14 50h72c0 18-16 32-36 32S14 68 14 50Z" fill="#C8CCCF" ${o}/>
    <ellipse cx="50" cy="50" rx="36" ry="9" fill="#9EA5AA" ${o}/>
    ${[[34, 48], [44, 46], [56, 47], [66, 49], [40, 52], [52, 52], [62, 53], [48, 49]].map(([x, y], i) => `<ellipse cx="${x}" cy="${y}" rx="5" ry="3" fill="${i % 2 ? '#8E3324' : '#A8452F'}" stroke="${K}" stroke-width="1.4" transform="rotate(${i * 25} ${x} ${y})"/>`).join('')}
    ${hi(26, 64, 3, 7, 30)}`,
  // ---------------- menstrual hygiene products
  pad: `<rect x="14" y="20" width="72" height="60" rx="12" fill="#EE9FAB" ${o}/>
    <rect x="14" y="20" width="72" height="12" rx="6" fill="#F6C9CF" ${o}/>
    <path d="M50 38c9 0 10 6 9 9 7 1 7 7 0 8 1 3 0 10-9 10s-10-7-9-10c-7-1-7-7 0-8-1-3 0-9 9-9Z" fill="#FFFFFF" stroke="${K}" stroke-width="2"/>
    <ellipse cx="50" cy="51" rx="4.5" ry="9" fill="#F4B7C0"/>
    <g fill="#C4452E">${[0, 1, 2, 3, 4].map((i) => `<circle cx="${74 + Math.cos(i * 1.257) * 3.4}" cy="${70 + Math.sin(i * 1.257) * 3.4}" r="2.4"/>`).join('')}</g>
    <rect x="70" y="16" width="12" height="10" rx="2" fill="#C4452E" ${o}/>`,
  tampon: `<g transform="rotate(-35 50 50)">
    <rect x="38" y="14" width="24" height="58" rx="12" fill="#FFFFFF" ${o}/>
    <rect x="38" y="44" width="24" height="16" fill="#9CC9C2" stroke="${K}" stroke-width="2.6"/>
    <path d="M50 72v10c0 4 4 4 4 8" fill="none" stroke="#3F6E68" stroke-width="2.6" stroke-linecap="round"/>
    <path d="M44 22c0-4 3-6 6-6" fill="none" stroke="#E6EEF0" stroke-width="3" stroke-linecap="round"/></g>`,
  cup: `<path d="M24 20h52l-6 34c-3 16-12 22-20 22s-17-6-20-22Z" fill="#E78DA2" ${o}/>
    <ellipse cx="50" cy="20" rx="26" ry="6" fill="#F3B6C4" ${o}/>
    <path d="M50 76v14" ${ow(5)}/>
    <path d="M44 82h12M45 87h10" stroke="${K}" stroke-width="2" stroke-linecap="round"/>
    <path d="M28 30h44" stroke="#D2708A" stroke-width="2"/>
    ${hi(36, 40, 4, 12, -10)}`,
  cloth: `<rect x="16" y="58" width="68" height="16" rx="8" fill="#E2A93B" ${o}/>
    <rect x="20" y="44" width="62" height="16" rx="8" fill="#3F6E68" ${o}/>
    <rect x="16" y="30" width="68" height="16" rx="8" fill="#C66161" ${o}/>
    ${[26, 38, 50, 62, 74].map((x) => `<circle cx="${x}" cy="38" r="2" fill="#FAF3E3"/><circle cx="${x + 4}" cy="52" r="2" fill="#FAF3E3"/><circle cx="${x}" cy="66" r="2" fill="#C4452E"/>`).join('')}
    <circle cx="72" cy="38" r="4" fill="#FFFFFF" ${ow(2)}/>`,
  kit: `<path d="M30 30l6-12h14l-2 12" fill="#F0A9B3" ${o}/>
    <path d="M52 30l4-14 14 2-4 12" fill="#FFFFFF" ${o}/>
    <rect x="14" y="30" width="72" height="52" rx="14" fill="#3F6E68" ${o}/>
    <path d="M14 42h72" stroke="#C4452E" stroke-width="4"/>
    <rect x="66" y="38" width="8" height="10" rx="2" fill="#E2A93B" ${ow(2)}/>
    <g fill="#E2A93B">${[0, 1, 2, 3, 4, 5, 6, 7].map((i) => `<ellipse cx="${50 + Math.cos(i * 0.785) * 8}" cy="${62 + Math.sin(i * 0.785) * 8}" rx="5" ry="2.6" transform="rotate(${i * 45} ${50 + Math.cos(i * 0.785) * 8} ${62 + Math.sin(i * 0.785) * 8})"/>`).join('')}</g>
    <circle cx="50" cy="62" r="4" fill="#FAF3E3"/>`,
  water: `<path d="M50 10c18 26 28 38 28 52a28 28 0 0 1-56 0c0-14 10-26 28-52Z" fill="#6FB7D2" ${o}/>
    <path d="M34 62a16 16 0 0 0 12 16" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity="0.8"/>
    <circle cx="60" cy="44" r="4" fill="#fff" opacity="0.7"/>`,
  // ---------------- hygiene hazards (unsafe practices — drawn dull, never gross)
  unwashed_cloth: `<path d="M18 66c-4-14 8-20 14-28 8-10 22-10 32-4 10 6 22 8 20 24-2 14-18 18-34 18s-28-2-32-10Z" fill="#8F8C6A" ${o}/>
    <path d="M30 52c8 4 18 2 26-4M40 68c10 2 22 0 30-6" fill="none" stroke="#6E6B4E" stroke-width="2.4" stroke-linecap="round"/>
    <ellipse cx="46" cy="58" rx="6" ry="4" fill="#6B573A"/><ellipse cx="66" cy="54" rx="4" ry="3" fill="#6B573A"/><ellipse cx="32" cy="64" rx="4" ry="3" fill="#6B573A"/>
    ${fly(26, 26)}${fly(72, 30)}${stink(50, 34)}`,
  damp_cloth: `<path d="M8 22h84" ${o}/>
    <path d="M28 22h44v40c0 6-4 8-8 6l-6-4-6 4-6-4-6 4c-6 2-12 0-12-6Z" fill="#5F7280" ${o}/>
    <rect x="34" y="16" width="6" height="12" rx="2" fill="#C8B79A" ${ow(2)}/><rect x="60" y="16" width="6" height="12" rx="2" fill="#C8B79A" ${ow(2)}/>
    ${[[38, 76], [52, 82], [64, 74]].map(([x, y]) => `<path d="M${x} ${y - 6}c3 4 4 6 4 8a4 4 0 0 1-8 0c0-2 1-4 4-8Z" fill="#8FC3D6" stroke="${K}" stroke-width="1.6"/>`).join('')}
    <ellipse cx="50" cy="92" rx="26" ry="4" fill="#8FB4C4" opacity="0.8"/>`,
  stored_used: `<path d="M14 60h72v26H14Z" fill="#A07D56" ${o}/>
    <path d="M14 60l10-12h52l10 12" fill="#8A6A48" ${o}/>
    <rect x="28" y="40" width="44" height="18" rx="9" fill="#CFC6B0" ${o}/>
    <path d="M40 40v18M52 40v18" stroke="#A39882" stroke-width="2.4"/>
    ${fly(22, 30)}${fly(78, 26)}${stink(50, 30)}`,
  unclean_product: `<g transform="rotate(-12 50 54)"><rect x="18" y="30" width="64" height="48" rx="10" fill="#B59D99" ${o}/>
    <path d="M70 30l12 8-6 6 6 6" fill="#9E8682" ${o}/></g>
    ${[[30, 50], [44, 62], [58, 46], [66, 66], [36, 72], [52, 38], [74, 52]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2.6" fill="#5B4634"/>`).join('')}
    <ellipse cx="30" cy="86" rx="12" ry="5" fill="#B8AE9C" opacity="0.7"/><ellipse cx="68" cy="88" rx="14" ry="5" fill="#B8AE9C" opacity="0.7"/>
    ${fly(80, 20)}`,
  bad_disposal: `<rect x="10" y="66" width="80" height="20" rx="3" fill="#5E5A57" ${o}/>
    ${[22, 34, 46, 58, 70].map((x) => `<rect x="${x}" y="69" width="6" height="14" rx="2" fill="#2E2A28"/>`).join('')}
    <path d="M30 60c-4-10 6-18 16-16 6-8 20-4 20 6 8 2 6 12-2 12H34c-2 0-4 0-4-2Z" fill="#D8D2C6" ${o}/>
    <path d="M40 52l8 4 6-6" fill="none" stroke="#B9B09C" stroke-width="2.4" stroke-linecap="round"/>
    ${fly(24, 34)}${fly(76, 38)}${stink(54, 34)}`,
  // ---------------- junk food
  burger: `<path d="M18 46c0-18 14-26 32-26s32 8 32 26Z" fill="#E0A04E" ${o}/>
    ${[[34, 32], [46, 28], [58, 30], [66, 38], [40, 40]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="2.4" ry="1.4" fill="#FAF3E3"/>`).join('')}
    <path d="M14 50c6-4 10 2 16-2s10 2 16-2 10 2 16-2 10 2 16-2 6 0 8 4" fill="none" stroke="#6FA04A" stroke-width="5" stroke-linecap="round"/>
    <path d="M16 54h68l-6 8H22Z" fill="#F4C14E" ${ow(2)}/>
    <rect x="16" y="58" width="68" height="10" rx="5" fill="#6B3B24" ${o}/>
    <path d="M18 70h64c0 8-6 12-14 12H32c-8 0-14-4-14-12Z" fill="#E0A04E" ${o}/>`,
  pizza: `<path d="M50 88L18 24c20-10 44-10 64 0Z" fill="#F4C14E" ${o}/>
    <path d="M16 22c22-12 46-12 68 0l-3 8c-20-10-42-10-62 0Z" fill="#C8873E" ${o}/>
    ${[[50, 40], [38, 48], [60, 52], [50, 66]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="5.5" fill="#B83A2A" ${ow(1.6)}/>`).join('')}
    <path d="M30 40l3 3M64 38l-2 3" stroke="#6E9A4E" stroke-width="3" stroke-linecap="round"/>`,
  fries: `${[[34, 14, -8], [42, 10, -3], [50, 12, 2], [58, 10, 6], [66, 16, 10], [46, 18, 0], [56, 18, 4]].map(([x, y, r]) => `<rect x="${x - 3}" y="${y}" width="7" height="40" rx="2" fill="#F6CB4F" ${ow(2)} transform="rotate(${r} ${x} ${y + 20})"/>`).join('')}
    <path d="M24 42h52l-6 46H30Z" fill="#C4452E" ${o}/>
    <path d="M24 42c8 8 18 10 26 10s18-2 26-10" fill="#D85A42" ${o}/>
    <circle cx="50" cy="70" r="7" fill="#FAF3E3"/>`,
  donut: `<circle cx="50" cy="52" r="34" fill="#D9A060" ${o}/>
    <path d="M18 48c2-16 16-28 32-28s30 12 32 28c-2 6-6 4-8 8s-6 2-10 6-8-2-14 2-10-2-14-2-8-6-12-6-6-4-6-8Z" fill="#EC8FA8" ${o}/>
    <circle cx="50" cy="50" r="10" fill="#F2E6CF" ${o}/>
    ${[[30, 38, 30], [40, 30, -20], [62, 30, 40], [70, 42, -40], [34, 52, 60], [66, 54, 10], [52, 34, 90]].map(([x, y, r], i) => `<rect x="${x}" y="${y}" width="7" height="2.6" rx="1.3" fill="${['#E2A93B', '#3F6E68', '#FAF3E3', '#2F4A73'][i % 4]}" transform="rotate(${r} ${x} ${y})"/>`).join('')}`,
  soda: `<path d="M30 20h40l2 6v56l-2 6H30l-2-6V26Z" fill="#C4452E" ${o}/>
    <path d="M28 46c10-6 22 8 44-2v12c-22 10-34-4-44 2Z" fill="#FAF3E3"/>
    <rect x="30" y="14" width="40" height="8" rx="3" fill="#C8CCCF" ${o}/>
    <path d="M56 16l8-14" stroke="#E79BA6" stroke-width="5" stroke-linecap="round"/>
    ${hi(36, 66, 3, 12, 0)}`,
  candy: `<path d="M8 36l20 8v12l-20 8 6-14Z" fill="#F0B0C0" ${o}/><path d="M92 36l-20 8v12l20 8-6-14Z" fill="#F0B0C0" ${o}/>
    <circle cx="50" cy="50" r="22" fill="#E8809A" ${o}/>
    <path d="M34 36c10 10 22 20 30 30M44 30c8 8 16 18 20 22M30 48c8 8 14 14 18 20" stroke="#FAF3E3" stroke-width="4" stroke-linecap="round"/>`,
  // ---------------- power-up icons (drawn inside a coloured badge by sprites.ts)
  pu_shield: `<path d="M50 12c10 6 22 8 32 8 0 34-12 56-32 68-20-12-32-34-32-68 10 0 22-2 32-8Z" fill="#4F86C6" ${o}/>
    <path d="M50 30c8 0 9 6 8 9 6 1 6 7 0 8 1 3 0 9-8 9s-9-6-8-9c-6-1-6-7 0-8-1-3 0-9 8-9Z" fill="#fff" stroke="${K}" stroke-width="2"/>`,
  pu_hygieneMagnet: `<path d="M22 20h18v34a10 10 0 0 0 20 0V20h18v34a28 28 0 0 1-56 0Z" fill="#C66161" ${o}/>
    <rect x="22" y="14" width="18" height="12" fill="#FAF3E3" ${o}/><rect x="60" y="14" width="18" height="12" fill="#FAF3E3" ${o}/>
    <path d="M50 66c5 0 6 3 5 5 4 1 4 4 0 5 1 2 0 5-5 5s-6-3-5-5c-4-1-4-4 0-5-1-2 0-5 5-5Z" fill="#fff" stroke="${K}" stroke-width="1.6"/>`,
  pu_foodMagnet: `<path d="M22 20h18v34a10 10 0 0 0 20 0V20h18v34a28 28 0 0 1-56 0Z" fill="#6E9A4E" ${o}/>
    <rect x="22" y="14" width="18" height="12" fill="#FAF3E3" ${o}/><rect x="60" y="14" width="18" height="12" fill="#FAF3E3" ${o}/>
    <circle cx="50" cy="72" r="8" fill="#D2402E" ${ow(2)}/>`,
  pu_knowledge: `<path d="M10 30c14-6 28-6 40 4 12-10 26-10 40-4v50c-14-6-28-6-40 4-12-10-26-10-40-4Z" fill="#E2A93B" ${o}/>
    <path d="M16 34c12-4 24-4 34 4v42c-10-8-22-8-34-4ZM84 34c-12-4-24-4-34 4v42c10-8 22-8 34-4Z" fill="#FAF3E3" ${ow(2)}/>
    <path d="M50 6l4 8 9 1-7 6 2 9-8-5-8 5 2-9-7-6 9-1Z" fill="#F6C453" ${ow(2)}/>`,
  pu_confidence: `<path d="M50 8l11 24 26 3-19 18 5 26-23-13-23 13 5-26-19-18 26-3Z" fill="#C4452E" ${o}/>
    <path d="M50 28l6 12 13 2-10 9 3 13-12-7-12 7 3-13-10-9 13-2Z" fill="#E2A93B"/>`,
  pu_preparation: `<rect x="22" y="24" width="56" height="62" rx="14" fill="#3F6E68" ${o}/>
    <path d="M22 44c0-14 12-20 28-20s28 6 28 20Z" fill="#E2A93B" ${o}/>
    <path d="M38 24c0-10 24-10 24 0" fill="none" ${ow(4)}/>
    <path d="M50 54v20M40 64h20" stroke="#fff" stroke-width="6" stroke-linecap="round"/>`,
  pu_protein: `<path d="M50 14c16 0 26 26 26 42 0 14-11 26-26 26S24 70 24 56c0-16 10-42 26-42Z" fill="#F8F0DE" ${o}/>
    <circle cx="50" cy="56" r="34" fill="none" stroke="#E2A93B" stroke-width="5" stroke-dasharray="10 6"/>
    ${hi(40, 40, 4, 9, -20)}`,
  pu_energy: `<path d="M58 6L22 54h22l-8 40 38-52H52Z" fill="#F0B232" ${o}/>`,
  pu_superJump: `<path d="M18 70h50c10 0 14 6 14 10H18Z" fill="#C4452E" ${o}/>
    <path d="M30 70l6-12h16l4 12" fill="#8E2E1E" ${ow(2)}/>
    <path d="M16 58c-8-6-8-20 0-26 6 8 14 14 20 20M24 52c-2-12 4-22 12-24 2 10 2 18 0 26" fill="#FFFFFF" ${ow(2)}/>
    <path d="M20 90c6-4 12-4 18 0s12 4 18 0 12-4 18 0" fill="none" stroke="#2F4A73" stroke-width="3" stroke-linecap="round"/>`,
};
