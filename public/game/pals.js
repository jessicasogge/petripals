// Shared pal drawings for the home page, picker, mode page and petri dish.
// Listed in home-page order; the picker shuffles them.
//
// Each pal has:
//   id      key matching SPECIES in config.js and ?pal=
//   name    display name
//   looks   screen-reader description after her name
//   motion  idle animation in styles.css: bob, squish, wobble or slither
//   frames  per-page SVG viewBoxes: roomy on home, tile-filling in picker,
//           snug in dish
//   art     200 x 200 drawing; wrap the face in <g class="face"> so dish
//           offspring can hide it
//
// To add a pal: append here and to SPECIES (with her `tile` color). New pals
// are picker-only; don't add to HOME.

import { SPECIES } from './config.js';

const SVG = 'http://www.w3.org/2000/svg';

// Elia's body: 3.5 waves from tail (x 33) to head (x 166), 14 units high,
// tapering over the last half-wave to steady her neck.
// `phase` slides the wave along her; 2π is one full wave.
const ELIA_TAIL = 33;
const ELIA_NECK = 166;
const ELIA_WAVE = 38; // one wave's length
function eliaY(x, phase = 0) {
  const nearHead = Math.min(1, (ELIA_NECK - x) / (ELIA_WAVE / 2));
  const height = 14 * (0.275 + 0.725 * nearHead);
  return 100 + height * Math.sin((2 * Math.PI * (x - ELIA_TAIL)) / ELIA_WAVE + phase);
}
function eliaBody(phase = 0) {
  const points = [];
  for (let x = ELIA_TAIL; x <= ELIA_NECK + 0.01; x += 1.9) {
    points.push(`${x.toFixed(1)} ${eliaY(x, phase).toFixed(1)}`);
  }
  return `M${points.join(' L')}`;
}

// Head-to-tail swimming wave, like a spirochete's inner flagella.
// Uses SVG <animate>, like Mona and Vi: runs only while swimming in the
// dish (rod.js), never in the picker or with reduced motion (drawing() below).
const ELIA_SWIM = '0.9s';
const ELIA_STEPS = 8;
const eliaPhases = Array.from({ length: ELIA_STEPS + 1 }, (_, i) => (2 * Math.PI * i) / ELIA_STEPS);
const eliaWave = () =>
  `<animate attributeName="d" dur="${ELIA_SWIM}" repeatCount="indefinite" values="${eliaPhases.map(eliaBody).join(';')}" />`;
// A shine dot that rides along on her body, 2 units above it.
const eliaShine = (x) => {
  const y = (phase) => (eliaY(x, phase) - 2).toFixed(1);
  return `<circle cx="${x}" cy="${y(0)}" r="2" fill="#f3e8ff">` +
    `<animate attributeName="cy" dur="${ELIA_SWIM}" repeatCount="indefinite" values="${eliaPhases.map(y).join(';')}" /></circle>`;
};

// Body-wide (peritrichous) flagella for Sallie, Terra, Lissie, Sara, Kiki,
// Diffany and Colette,
// plus Astrid's swimmers' single tail. Each starts at (x, y), extends
// `length` at `angle` degrees, and waves 12 units either side.
// SVG <animate>, like Mona's and Vi's tails, gives each its own speed.
const SPLINES = 'calcMode="spline" keyTimes="0;0.25;0.5;0.75;1" keySplines="0.4 0 0.6 1;0.4 0 0.6 1;0.4 0 0.6 1;0.4 0 0.6 1"';
function flagellum(stroke, x, y, angle, length, duration) {
  const a = (angle * Math.PI) / 180;
  const [ux, uy] = [Math.cos(a), Math.sin(a)];
  const at = (t, wave) => `${(x + ux * length * t - uy * wave).toFixed(1)} ${(y + uy * length * t + ux * wave).toFixed(1)}`;
  const d = (wave) => `M${x} ${y} C${at(0.33, wave)} ${at(0.66, -wave)} ${at(1, 0)}`;
  const frames = [12, 3, -12, -3, 12].map(d).join(';');
  return `<path class="flagellum" d="${d(12)}" stroke="${stroke}" stroke-width="3.5" fill="none" stroke-linecap="round">` +
    `<animate attributeName="d" dur="${duration}" repeatCount="indefinite" ${SPLINES} values="${frames}" /></path>`;
}
const SALLIE_FLAGELLA = [
  [62, 76, -120, 34, '0.7s'],
  [100, 74, -90, 32, '0.65s'],
  [138, 76, -60, 34, '0.75s'],
  [62, 124, 120, 34, '0.72s'],
  [100, 126, 90, 32, '0.68s'],
  [138, 124, 60, 34, '0.7s'],
  [40, 100, 180, 32, '0.6s'],
  [160, 100, 0, 30, '0.66s'],
]
  .map((f) => flagellum('#52525b', ...f))
  .join('');
// Terra's: fewer, along her slim rod (her spore end has none).
const TERRA_FLAGELLA = [
  [56, 80, -115, 30, '0.7s'],
  [98, 80, -80, 30, '0.66s'],
  [56, 120, 115, 30, '0.72s'],
  [98, 120, 80, 30, '0.68s'],
  [30, 100, 180, 28, '0.6s'],
]
  .map((f) => flagellum('#65751c', ...f))
  .join('');
// Lissie's: just a few around her short rod, since she tumbles rather than
// swims fast.
const LISSIE_FLAGELLA = [
  [72, 78, -110, 28, '0.8s'],
  [128, 78, -70, 28, '0.75s'],
  [72, 122, 110, 28, '0.78s'],
  [128, 122, 70, 28, '0.82s'],
  [50, 100, 180, 26, '0.7s'],
]
  .map((f) => flagellum('#2c4f7c', ...f))
  .join('');
// Sara's: all around her short, plump rod.
const SERRA_FLAGELLA = [
  [72, 74, -110, 28, '0.7s'],
  [100, 72, -90, 26, '0.66s'],
  [128, 74, -70, 28, '0.74s'],
  [72, 126, 110, 28, '0.72s'],
  [100, 128, 90, 26, '0.68s'],
  [128, 126, 70, 28, '0.7s'],
  [52, 100, 180, 26, '0.6s'],
  [148, 100, 0, 24, '0.64s'],
]
  .map((f) => flagellum('#b0002f', ...f))
  .join('');
// Kiki's: all around her short, plump rod, like Sara's.
const KIKI_FLAGELLA = [
  [70, 76, -112, 28, '0.72s'],
  [100, 74, -90, 26, '0.66s'],
  [130, 76, -68, 28, '0.7s'],
  [70, 124, 112, 28, '0.74s'],
  [100, 126, 90, 26, '0.68s'],
  [130, 124, 68, 28, '0.7s'],
  [50, 100, 180, 26, '0.62s'],
  [150, 100, 0, 24, '0.65s'],
]
  .map((f) => flagellum('#7d7200', ...f))
  .join('');
// Diffany's: all around her big, plump rod, the ones on the right growing
// from the bulge over her spore.
const DIFFANY_FLAGELLA = [
  [72, 72, -112, 28, '0.74s'],
  [102, 72, -90, 28, '0.68s'],
  [130, 69, -68, 28, '0.72s'],
  [72, 128, 112, 28, '0.76s'],
  [102, 128, 90, 28, '0.7s'],
  [130, 131, 68, 28, '0.73s'],
  [42, 100, 180, 26, '0.64s'],
  [158, 100, 0, 24, '0.67s'],
]
  .map((f) => flagellum('#7a2e1a', ...f))
  .join('');

// One of Ivy's rods, centered at (x, y), turned `angle` degrees, with a shine
// near one corner.
const ivyRod = (x, y, angle, w, h) =>
  `<g transform="rotate(${angle} ${x} ${y})">` +
  `<rect x="${x - w / 2}" y="${y - h / 2}" width="${w}" height="${h}" rx="${(h * 0.36).toFixed(1)}" fill="#b8d8a0" stroke="#4d6b3c" stroke-width="4" />` +
  `<circle cx="${x - w / 2 + 9}" cy="${y - h / 2 + 8}" r="3.2" fill="#f0f7e8" /></g>`;

// Astrid's two stalks (prosthecae), from her sides near her back end out to
// (x2, y2): an outline with a lighter middle, like the rest of her.
const astridStalk = (x1, y1, x2, y2) =>
  `<path d="M${x1} ${y1} L${x2} ${y2}" stroke="#1a4f9c" stroke-width="13" stroke-linecap="round" />` +
  `<path d="M${x1} ${y1} L${x2} ${y2}" stroke="#5aa9f5" stroke-width="6" stroke-linecap="round" />`;
// Electra's nanowires: 16 conductive filaments, evenly spaced all around her
// and all the same length. Each starts on her outline at [x, y] and heads
// straight out from it at `angle` degrees.
const ELECTRA_WIRES = [
  [66, 72, -90],
  [89, 72, -90],
  [111, 72, -90],
  [134, 72, -90],
  [159, 76, -60],
  [172, 92, -20],
  [172, 112, 20],
  [159, 128, 60],
  [134, 132, 90],
  [111, 132, 90],
  [89, 132, 90],
  [66, 132, 90],
  [41, 128, 120],
  [28, 112, 160],
  [28, 92, -160],
  [41, 76, -120],
];
const WIRE_LENGTH = 26;
// The points along one wire, from her outline to its tip: a gentle wave that
// starts straight where it leaves her, every other one waving the other way.
function wirePoints([x, y, angle], i) {
  const a = (angle * Math.PI) / 180;
  const [dx, dy] = [Math.cos(a), Math.sin(a)];
  const points = [];
  for (let step = 0; step <= 10; step++) {
    const s = step / 10;
    const wave = 3.2 * Math.sin(2 * Math.PI * 1.25 * s + (i % 2) * Math.PI) * Math.min(1, s * 4);
    points.push([x + dx * WIRE_LENGTH * s - dy * wave, y + dy * WIRE_LENGTH * s + dx * wave]);
  }
  return points;
}
// A four-pointed yellow spark of radius r at (x, y). It flashes on a loop,
// `delay` seconds in, so the bursts run out along each wire like current.
function spark(x, y, r, delay, className) {
  const points = [[0, -r], [0.3 * r, -0.3 * r], [r, 0], [0.3 * r, 0.3 * r], [0, r], [-0.3 * r, 0.3 * r], [-r, 0], [-0.3 * r, -0.3 * r]]
    .map(([px, py]) => `${(x + px).toFixed(1)} ${(y + py).toFixed(1)}`)
    .join(' L');
  return (
    `<path class="${className}" d="M${points} Z" fill="#fde047" stroke="#ca8a04" stroke-width="1" stroke-linejoin="round">` +
    `<animate attributeName="opacity" values="0.35;1;0.35;0.35" keyTimes="0;0.2;0.6;1" dur="1.2s" begin="${delay}s" repeatCount="indefinite" /></path>`
  );
}
const ELECTRA_NANOWIRES = ELECTRA_WIRES.map((wire, i) => {
  const points = wirePoints(wire, i);
  const d = points.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join(' L');
  return (
    `<path d="M${d}" stroke="#4c1d95" stroke-width="2.6" fill="none" stroke-linecap="round" stroke-linejoin="round" />` +
    spark(...points[5], 3.6, 0, 'burst') +
    spark(...points[10], 5, 0.3, 'spark')
  );
}).join('');

// Nova's filaments: one through her hub, branching off and branching again,
// nearly at right angles (Ana splits once into a Y; Nova keeps going).
const NOVA_FILAMENTS = [
  // the main filament, left to right through her hub
  'M14 132 Q44 142 80 116',
  'M120 102 Q150 84 186 92',
  // left side
  'M46 136 Q46 156 30 174',
  'M62 128 Q58 100 36 80',
  'M46 92 Q34 98 20 98',
  // up from the hub, with a side branch
  'M100 86 Q98 58 112 28',
  'M101 56 Q88 52 76 38',
  // right side
  'M158 88 Q160 64 178 50',
  'M148 92 Q158 120 178 136',
  'M164 120 Q150 138 152 160',
  // down from the hub
  'M106 130 Q112 156 100 180',
]
  .map((d) => `<path d="${d}" />`)
  .join('');
// Darker beads along her filaments, and light shines.
const NOVA_BEADS =
  [[30, 137], [134, 92], [170, 89], [58, 108], [108, 44], [161, 124], [109, 152], [46, 156]]
    .map(([x, y]) => `<circle cx="${x}" cy="${y}" r="3" fill="#3bb3a5" />`)
    .join('') +
  [[22, 133], [178, 90], [110, 34], [38, 82]]
    .map(([x, y]) => `<circle cx="${x}" cy="${y - 1.5}" r="2" fill="#e6fffb" />`)
    .join('');

// Colette's: all around her long, slim rod, the same lengths as Sallie's.
const COLETTE_FLAGELLA = [
  [60, 80, -115, 34, '0.7s'],
  [100, 78, -90, 32, '0.64s'],
  [140, 80, -65, 34, '0.74s'],
  [60, 120, 115, 34, '0.72s'],
  [100, 122, 90, 32, '0.68s'],
  [140, 120, 65, 34, '0.7s'],
  [36, 100, 180, 32, '0.6s'],
  [164, 100, 0, 30, '0.66s'],
]
  .map((f) => flagellum('#2e6b0e', ...f))
  .join('');

// Pearl's pili (fimbriae): short, straight, sticky hairs spread evenly
// around her rod (a stadium from x 58 to 142, y 76 to 124), each pointing
// straight out. They're short enough to stay inside her capsule, and they
// don't move: pili aren't for swimming.
const PEARL_PILI = (() => {
  const [x1, x2, cy, r] = [82, 118, 100, 24];
  const straight = x2 - x1;
  const arc = Math.PI * r;
  const total = 2 * straight + 2 * arc;
  const count = 26;
  const length = 6;
  const hairs = [];
  for (let i = 0; i < count; i++) {
    let d = ((i + 0.5) / count) * total;
    let point;
    if (d < straight) point = [x1 + d, cy - r, 0, -1];
    else if ((d -= straight) < arc) {
      const a = -Math.PI / 2 + d / r;
      point = [x2 + r * Math.cos(a), cy + r * Math.sin(a), Math.cos(a), Math.sin(a)];
    } else if ((d -= arc) < straight) point = [x2 - d, cy + r, 0, 1];
    else {
      const a = Math.PI / 2 + (d - straight) / r;
      point = [x1 + r * Math.cos(a), cy + r * Math.sin(a), Math.cos(a), Math.sin(a)];
    }
    const [x, y, nx, ny] = point;
    hairs.push(`<path class="pilus" d="M${x.toFixed(1)} ${y.toFixed(1)} l${(nx * length).toFixed(1)} ${(ny * length).toFixed(1)}" />`);
  }
  return hairs.join('');
})();

// Dina's four cells, two across and two down. Each is fully round on its
// outer corner, rounder than a tile on the sides it shares with one
// neighbor, and only a little rounded where all four meet, so the walls
// between them look pressed flat. Radii go top-left, top-right,
// bottom-right, bottom-left. Each has a shine near its top-left.
function dinaCell(x, y, [tl, tr, br, bl]) {
  const s = 68;
  return `<path d="M${x + tl} ${y} H${x + s - tr} A${tr} ${tr} 0 0 1 ${x + s} ${y + tr} ` +
    `V${y + s - br} A${br} ${br} 0 0 1 ${x + s - br} ${y + s} H${x + bl} A${bl} ${bl} 0 0 1 ${x} ${y + s - bl} ` +
    `V${y + tl} A${tl} ${tl} 0 0 1 ${x + tl} ${y} Z" fill="#f0abfc" stroke="#a21caf" stroke-width="4" />` +
    `<circle cx="${x + 18}" cy="${y + 16}" r="4" fill="#fdf4ff" />`;
}
const [OUTER, SIDE, INNER] = [34, 30, 4];
const DINA_CELLS = [
  dinaCell(32, 32, [OUTER, SIDE, INNER, SIDE]),
  dinaCell(100, 32, [SIDE, OUTER, SIDE, INNER]),
  dinaCell(32, 100, [SIDE, INNER, SIDE, OUTER]),
  dinaCell(100, 100, [INNER, SIDE, OUTER, SIDE]),
].join('');

// Ari's filament: round cells along a gentle wave, each just overlapping the
// next, as [radius, kind]. Her face is on the big one; the gold one is a
// heterocyst, thick walled, with a bright plug where it meets each neighbor.
const ARI_CELLS = (() => {
  const cells = [[13, 'veg'], [15, 'veg'], [24, 'face'], [16, 'veg'], [19, 'het'], [15, 'veg'], [13, 'veg']];
  const waveY = (x) => 100 + 10 * Math.sin(((x - 100) / 160) * 2 * Math.PI * 0.8 + 0.35);
  const gaps = cells.slice(1).map(([r], i) => (r + cells[i][0]) * 0.8);
  let x = 100 - gaps.reduce((a, b) => a + b, 0) / 2;
  const placed = [{ x, y: waveY(x) }];
  for (const gap of gaps) {
    const last = placed.at(-1);
    x = last.x;
    while (Math.hypot(x - last.x, waveY(x) - last.y) < gap) x += 0.05;
    placed.push({ x, y: waveY(x) });
  }
  const at = placed.map((p, i) => ({ ...p, r: cells[i][0], kind: cells[i][1] }));
  const f = (n) => n.toFixed(1);
  let out = '';
  // Plain cells first, so the heterocyst and her face sit on top.
  for (const c of [...at].sort((a, b) => (a.kind === 'veg' ? 0 : 1) - (b.kind === 'veg' ? 0 : 1))) {
    if (c.kind === 'het') {
      out += `<circle cx="${f(c.x)}" cy="${f(c.y)}" r="${c.r}" fill="#f6e7a6" stroke="#9a7b12" stroke-width="5" />`;
      const i = at.indexOf(c);
      for (const n of [at[i - 1], at[i + 1]]) {
        const d = Math.hypot(n.x - c.x, n.y - c.y);
        out += `<circle cx="${f(c.x + ((n.x - c.x) / d) * (c.r - 3.5))}" cy="${f(c.y + ((n.y - c.y) / d) * (c.r - 3.5))}" ` +
          'r="2.6" fill="#fffbe6" stroke="#9a7b12" stroke-width="1.2" />';
      }
      out += `<circle cx="${f(c.x - 4)}" cy="${f(c.y - 5)}" r="2.6" fill="#fffbe6" />`;
      continue;
    }
    out += `<circle cx="${f(c.x)}" cy="${f(c.y)}" r="${c.r}" fill="#7dd8b0" stroke="#0d5c43" stroke-width="3.5" />` +
      `<circle cx="${f(c.x - c.r * 0.38)}" cy="${f(c.y - c.r * 0.42)}" r="${f(c.r * 0.2)}" fill="#e2f8ee" />`;
    if (c.kind === 'face') {
      out += `<g class="face" transform="translate(${f(c.x)} ${f(c.y)}) scale(${(c.r / 17).toFixed(2)})">` +
        '<circle cx="-6" cy="0" r="4.3" fill="#06321f" /><circle cx="6" cy="0" r="4.3" fill="#06321f" />' +
        '<circle cx="-4.6" cy="-1.4" r="1.5" fill="white" /><circle cx="7.4" cy="-1.4" r="1.5" fill="white" />' +
        '<ellipse cx="-10.5" cy="7" rx="3.4" ry="2.2" fill="#f9a8d4" opacity="0.95" />' +
        '<ellipse cx="10.5" cy="7" rx="3.4" ry="2.2" fill="#f9a8d4" opacity="0.95" />' +
        '<path d="M-3.5 6.5 Q0 10.5 3.5 6.5" stroke="#06321f" stroke-width="2.4" fill="none" stroke-linecap="round" />' +
        '</g>';
    }
  }
  return out;
})();

export const PALS = [
  // Terra: Clostridium tetani, an olive rod with a round spore at one end (a "drumstick")
  {
    id: 'terra',
    name: 'Terra',
    looks: 'an olive drumstick-shaped Clostridium tetani rod with a round spore at one end',
    motion: 'bob',
    frames: { home: '0 0 200 200', picker: '10 12 176 176', dish: '0 8 184 184' },
    // Drawn a little smaller than the others on the home page.
    homeWidth: 108,
    art: `
      <!-- flagella along her rod -->
      ${TERRA_FLAGELLA}
      <!-- one outline: a slim rod that swells into a round spore at the right end -->
      <path d="M50 80 L133.9 80 A27 27 0 1 1 133.9 120 L50 120 A20 20 0 0 1 50 80 Z" fill="#d9dfa0" stroke="#65751c" stroke-width="4" stroke-linejoin="round" />
      <circle cx="44" cy="90" r="3.5" fill="#f4f7d9" />
      <!-- the spore: bright and glassy, and pure white so a Gram stain leaves it clear, as on a real slide -->
      <circle cx="153" cy="100" r="16" fill="#ffffff" stroke="#65751c" stroke-width="2" stroke-opacity="0.45" />
      <circle cx="157" cy="104" r="8" fill="#f4f7d9" opacity="0.7" />
      <g class="face">
        <circle cx="74" cy="97" r="5.5" fill="#3a4410" />
        <circle cx="98" cy="97" r="5.5" fill="#3a4410" />
        <circle cx="75.8" cy="95.2" r="1.9" fill="white" />
        <circle cx="99.8" cy="95.2" r="1.9" fill="white" />
        <ellipse cx="62" cy="108" rx="6" ry="3.6" fill="#f9a8d4" opacity="0.9" />
        <ellipse cx="110" cy="108" rx="6" ry="3.6" fill="#f9a8d4" opacity="0.9" />
        <path d="M81 108 Q86 113 91 108" stroke="#3a4410" stroke-width="3" fill="none" stroke-linecap="round" />
      </g>
    `,
  },
  // Penny: Streptococcus pneumoniae, a bluish-purple pair of cells, with glasses
  {
    id: 'penny',
    name: 'Penny',
    looks: 'a bluish-purple pair of round Streptococcus pneumoniae cells wearing round glasses',
    motion: 'bob',
    frames: { home: '-12 -12 224 224', picker: '0 0 200 200', dish: '10 10 180 180' },
    art: `
      <!-- left cell: a little narrower at the outside end, rounder where the pair meets -->
      <path d="M98 100 C98 79 84 67 64 67 C41 67 26 84 26 100 C26 116 41 133 64 133 C84 133 98 121 98 100 Z" fill="#a5b4fc" stroke="#4f46e5" stroke-width="4" stroke-linejoin="round" />
      <circle cx="52" cy="84" r="4" fill="#e0e7ff" />
      <!-- right cell, with her face -->
      <path d="M102 100 C102 79 116 67 136 67 C159 67 174 84 174 100 C174 116 159 133 136 133 C116 133 102 121 102 100 Z" fill="#a5b4fc" stroke="#4f46e5" stroke-width="4" stroke-linejoin="round" />
      <circle cx="158" cy="83" r="3.5" fill="#e0e7ff" />
      <g class="face">
        <!-- eyes -->
        <circle cx="127" cy="97" r="5.5" fill="#312e81" />
        <circle cx="151" cy="97" r="5.5" fill="#312e81" />
        <circle cx="128.8" cy="95.2" r="1.9" fill="white" />
        <circle cx="152.8" cy="95.2" r="1.9" fill="white" />
        <!-- round glasses -->
        <circle cx="127" cy="97" r="10.5" fill="#eef2ff" fill-opacity="0.35" stroke="#312e81" stroke-width="2.6" />
        <circle cx="151" cy="97" r="10.5" fill="#eef2ff" fill-opacity="0.35" stroke="#312e81" stroke-width="2.6" />
        <path d="M137.5 96 Q139 93.5 140.5 96" stroke="#312e81" stroke-width="2.6" fill="none" stroke-linecap="round" />
        <path d="M116.5 95 L111 92" stroke="#312e81" stroke-width="2.6" stroke-linecap="round" />
        <path d="M161.5 95 L166 92" stroke="#312e81" stroke-width="2.6" stroke-linecap="round" />
        <!-- a glint on one lens -->
        <path d="M121 91 Q123 89 125.5 89" stroke="white" stroke-width="1.6" fill="none" stroke-linecap="round" opacity="0.9" />
        <!-- cheeks and smile -->
        <ellipse cx="118" cy="114" rx="6" ry="3.6" fill="#f9a8d4" opacity="0.85" />
        <ellipse cx="160" cy="114" rx="6" ry="3.6" fill="#f9a8d4" opacity="0.85" />
        <path d="M133 113 Q139 119 145 113" stroke="#312e81" stroke-width="3" fill="none" stroke-linecap="round" />
      </g>
    `,
  },
  // Vi: Vibrio cholerae, an orange comma-shaped rod
  {
    id: 'vi',
    name: 'Vi',
    looks: 'an orange comma-shaped Vibrio cholerae',
    motion: 'wobble',
    frames: { home: '0 0 200 200', picker: '2 15 180 180', dish: '2 15 180 180' },
    // Drawn a little smaller than the others on the home page.
    homeWidth: 108,
    art: `
      <!-- flagellum -->
      <path class="flagellum" d="M34 92 C24 76 16 108 4 92" stroke="#c2410c" stroke-width="4" fill="none" stroke-linecap="round">
        <animate attributeName="d" dur="0.6s" repeatCount="indefinite" calcMode="spline" keyTimes="0;0.25;0.5;0.75;1" keySplines="0.4 0 0.6 1;0.4 0 0.6 1;0.4 0 0.6 1;0.4 0 0.6 1" values="M34 92 C24 76 16 108 4 92;M34 92 C24 88.8 16 95.2 4 92;M34 92 C24 108 16 76 4 92;M34 92 C24 95.2 16 88.8 4 92;M34 92 C24 76 16 108 4 92" />
      </path>
      <!-- comma-shaped body: outline, then fill -->
      <path d="M58 92 Q108 62 150 122" stroke="#c2410c" stroke-width="58" fill="none" stroke-linecap="round" />
      <path d="M58 92 Q108 62 150 122" stroke="#fdba74" stroke-width="50" fill="none" stroke-linecap="round" />
      <circle cx="70" cy="80" r="5" fill="#ffedd5" />
      <circle cx="146" cy="126" r="4" fill="#ffedd5" />
      <g class="face">
        <circle cx="96" cy="88" r="7" fill="#7c2d12" />
        <circle cx="120" cy="92" r="7" fill="#7c2d12" />
        <circle cx="98" cy="86" r="2.5" fill="white" />
        <circle cx="122" cy="90" r="2.5" fill="white" />
        <ellipse cx="84" cy="101" rx="6" ry="4" fill="#f9a8d4" opacity="0.8" />
        <ellipse cx="132" cy="108" rx="6" ry="4" fill="#f9a8d4" opacity="0.8" />
        <path d="M101 102 Q108 109 116 104" stroke="#7c2d12" stroke-width="3.5" fill="none" stroke-linecap="round" />
      </g>
    `,
  },
  // Goldie: Staphylococcus aureus, a golden grape-like cluster
  {
    id: 'goldie',
    name: 'Goldie',
    looks: 'a golden grape-like cluster of Staphylococcus',
    motion: 'squish',
    frames: { home: '0 0 200 200', picker: '24 29 152 152', dish: '24 29 152 152' },
    art: `
      <!-- grape-like cluster of cocci (Staphylococcus) -->
      <circle cx="84" cy="58" r="22" fill="#fde68a" stroke="#b45309" stroke-width="4" />
      <circle cx="76" cy="49" r="4" fill="#fef3c7" />
      <circle cx="120" cy="56" r="21" fill="#fde68a" stroke="#b45309" stroke-width="4" />
      <circle cx="112" cy="47" r="4" fill="#fef3c7" />
      <circle cx="62" cy="88" r="22" fill="#fde68a" stroke="#b45309" stroke-width="4" />
      <circle cx="54" cy="79" r="4" fill="#fef3c7" />
      <circle cx="100" cy="84" r="22" fill="#fde68a" stroke="#b45309" stroke-width="4" />
      <circle cx="92" cy="75" r="4" fill="#fef3c7" />
      <circle cx="138" cy="88" r="22" fill="#fde68a" stroke="#b45309" stroke-width="4" />
      <circle cx="130" cy="79" r="4" fill="#fef3c7" />
      <circle cx="56" cy="124" r="21" fill="#fde68a" stroke="#b45309" stroke-width="4" />
      <circle cx="48" cy="115" r="4" fill="#fef3c7" />
      <circle cx="146" cy="124" r="21" fill="#fde68a" stroke="#b45309" stroke-width="4" />
      <circle cx="138" cy="115" r="4" fill="#fef3c7" />
      <circle cx="76" cy="150" r="20" fill="#fde68a" stroke="#b45309" stroke-width="4" />
      <circle cx="68" cy="141" r="4" fill="#fef3c7" />
      <circle cx="124" cy="154" r="20" fill="#fde68a" stroke="#b45309" stroke-width="4" />
      <circle cx="116" cy="145" r="4" fill="#fef3c7" />
      <!-- front coccus with face -->
      <circle cx="100" cy="122" r="30" fill="#fde68a" stroke="#b45309" stroke-width="4" />
      <circle cx="88" cy="108" r="5" fill="#fef3c7" />
      <circle cx="90" cy="120" r="6" fill="#78350f" />
      <circle cx="110" cy="120" r="6" fill="#78350f" />
      <circle cx="92" cy="118" r="2" fill="white" />
      <circle cx="112" cy="118" r="2" fill="white" />
      <ellipse cx="81" cy="132" rx="5" ry="3" fill="#f9a8d4" opacity="0.8" />
      <ellipse cx="119" cy="132" rx="5" ry="3" fill="#f9a8d4" opacity="0.8" />
      <path d="M95 132 Q100 137 105 132" stroke="#78350f" stroke-width="3" fill="none" stroke-linecap="round" />
    `,
  },
  // Ana: Bifidobacterium bifidum, a pink Y-shaped rod cheering with her arms up
  {
    id: 'ana',
    name: 'Ana',
    looks: 'a pink Y-shaped Bifidobacterium bifidum cheering with her arms up',
    motion: 'bob',
    frames: { home: '-14 2 228 228', picker: '0 16 200 200', dish: '18 34 164 164' },
    art: `
      <!-- outline: the stem and two branches, drawn thick in the darker pink -->
      <g stroke="#be185d" stroke-width="42" fill="none" stroke-linecap="round" stroke-linejoin="round">
        <path d="M100 118 L100 166" />
        <path d="M100 116 Q92 92 70 66" />
        <path d="M100 116 Q108 92 130 66" />
      </g>
      <circle cx="100" cy="114" r="22" fill="#be185d" />
      <!-- fill: the same shapes a little thinner, in strawberry-yogurt pink -->
      <g stroke="#f9a8d4" stroke-width="34" fill="none" stroke-linecap="round" stroke-linejoin="round">
        <path d="M100 118 L100 166" />
        <path d="M100 116 Q92 92 70 66" />
        <path d="M100 116 Q108 92 130 66" />
      </g>
      <circle cx="100" cy="114" r="18" fill="#f9a8d4" />
      <circle cx="72" cy="70" r="3.5" fill="#fdf2f8" />
      <circle cx="126" cy="68" r="3" fill="#fdf2f8" />
      <circle cx="96" cy="158" r="3" fill="#fdf2f8" />
      <g class="face">
        <circle cx="93" cy="108" r="5" fill="#831843" />
        <circle cx="107" cy="108" r="5" fill="#831843" />
        <circle cx="94.6" cy="106.4" r="1.7" fill="white" />
        <circle cx="108.6" cy="106.4" r="1.7" fill="white" />
        <ellipse cx="88" cy="118" rx="4" ry="2.6" fill="#f472b6" opacity="0.7" />
        <!-- a little heart on her other cheek -->
        <path d="M108.6 116.6 C108.6 114.6 111.5 114.3 111.8 116.2 C112.1 114.3 115 114.6 115 116.6 C115 118.6 111.8 120.6 111.8 121.4 C111.8 120.6 108.6 118.6 108.6 116.6 Z" fill="#ec4899" />
        <path d="M96 118 Q100 123 104 118" stroke="#831843" stroke-width="3" fill="none" stroke-linecap="round" />
      </g>
    `,
  },
  // Lissie: Listeria monocytogenes, a short denim-blue rod with a few flagella
  {
    id: 'lissie',
    name: 'Lissie',
    looks: 'a short denim-blue rod-shaped Listeria monocytogenes with a few flagella around her',
    motion: 'bob',
    frames: { home: '0 0 200 200', picker: '10 10 180 180', dish: '8 8 184 184' },
    art: `
      <!-- a few flagella around her short rod -->
      ${LISSIE_FLAGELLA}
      <rect x="52" y="76" width="96" height="48" rx="24" fill="#9fbbdc" stroke="#2c4f7c" stroke-width="4" />
      <circle cx="131" cy="88" r="3.8" fill="#e6eef8" />
      <circle cx="66" cy="114" r="2.8" fill="#e6eef8" />
      <g class="face">
        <circle cx="89" cy="98" r="5.5" fill="#1b3150" />
        <circle cx="111" cy="98" r="5.5" fill="#1b3150" />
        <circle cx="90.8" cy="96.2" r="1.9" fill="white" />
        <circle cx="112.8" cy="96.2" r="1.9" fill="white" />
        <ellipse cx="76" cy="109" rx="6" ry="3.6" fill="#f9a8d4" opacity="0.9" />
        <ellipse cx="124" cy="109" rx="6" ry="3.6" fill="#f9a8d4" opacity="0.9" />
        <path d="M95 109 Q100 114 105 109" stroke="#1b3150" stroke-width="3" fill="none" stroke-linecap="round" />
      </g>
    `,
  },
  // Scarlett: Streptococcus pyogenes, a red chain of cocci
  {
    id: 'scarlett',
    name: 'Scarlett',
    looks: 'a red chain of round Streptococcus pyogenes cells',
    motion: 'bob',
    frames: { home: '0 0 200 200', picker: '6 10 188 188', dish: '6 10 188 188' },
    art: `
      <!-- chain of cocci (Streptococcus) -->
      <circle cx="26" cy="116" r="18" fill="#fca5a5" stroke="#b91c1c" stroke-width="4" />
      <circle cx="20" cy="109" r="3.5" fill="#fee2e2" />
      <circle cx="60" cy="106" r="19" fill="#fca5a5" stroke="#b91c1c" stroke-width="4" />
      <circle cx="54" cy="99" r="3.5" fill="#fee2e2" />
      <circle cx="140" cy="106" r="19" fill="#fca5a5" stroke="#b91c1c" stroke-width="4" />
      <circle cx="134" cy="99" r="3.5" fill="#fee2e2" />
      <circle cx="174" cy="116" r="18" fill="#fca5a5" stroke="#b91c1c" stroke-width="4" />
      <circle cx="168" cy="109" r="3.5" fill="#fee2e2" />
      <!-- middle coccus with face -->
      <circle cx="100" cy="100" r="25" fill="#fca5a5" stroke="#b91c1c" stroke-width="4" />
      <circle cx="91" cy="89" r="4" fill="#fee2e2" />
      <circle cx="91" cy="100" r="5" fill="#7f1d1d" />
      <circle cx="109" cy="100" r="5" fill="#7f1d1d" />
      <circle cx="92.5" cy="98.5" r="1.8" fill="white" />
      <circle cx="110.5" cy="98.5" r="1.8" fill="white" />
      <ellipse cx="84" cy="110" rx="4.5" ry="3" fill="#f9a8d4" opacity="0.9" />
      <ellipse cx="116" cy="110" rx="4.5" ry="3" fill="#f9a8d4" opacity="0.9" />
      <path d="M95 110 Q100 115 105 110" stroke="#7f1d1d" stroke-width="3" fill="none" stroke-linecap="round" />
    `,
  },
  // Coco: Haemophilus influenzae, a small coffee-with-cream coccobacillus
  {
    id: 'coco',
    name: 'Coco',
    looks: 'a small coffee-with-cream brown Haemophilus influenzae',
    motion: 'bob',
    frames: { home: '0 0 200 200', picker: '20 20 160 160', dish: '40 40 120 120' },
    art: `
      <!-- coccobacillus: a short, plump oval between a coccus and a rod (no flagellum) -->
      <rect x="52" y="70" width="96" height="62" rx="31" fill="#d4b08c" stroke="#7c4a2d" stroke-width="4" />
      <circle cx="126" cy="84" r="4" fill="#f5e6d6" />
      <circle cx="70" cy="118" r="3" fill="#f5e6d6" />
      <g class="face">
        <circle cx="89" cy="100" r="5.5" fill="#4a2c17" />
        <circle cx="111" cy="100" r="5.5" fill="#4a2c17" />
        <circle cx="90.8" cy="98.2" r="1.9" fill="white" />
        <circle cx="112.8" cy="98.2" r="1.9" fill="white" />
        <ellipse cx="78" cy="111" rx="6" ry="3.6" fill="#f9a8d4" opacity="0.85" />
        <ellipse cx="122" cy="111" rx="6" ry="3.6" fill="#f9a8d4" opacity="0.85" />
        <path d="M95 111 Q100 116 105 111" stroke="#4a2c17" stroke-width="3" fill="none" stroke-linecap="round" />
      </g>
    `,
  },
  // Mona: Pseudomonas aeruginosa, a green rod with one flagellum
  {
    id: 'mona',
    name: 'Mona',
    looks: 'a green rod-shaped Pseudomonas with one flagellum',
    motion: 'bob',
    frames: { home: '0 0 200 200', picker: '0 17 176 176', dish: '0 17 176 176' },
    art: `
      <!-- flagellum -->
      <path class="flagellum" d="M34 105 C24 88 16 122 6 105" stroke="#15803d" stroke-width="4" fill="none" stroke-linecap="round">
        <animate attributeName="d" dur="0.6s" repeatCount="indefinite" calcMode="spline" keyTimes="0;0.25;0.5;0.75;1" keySplines="0.4 0 0.6 1;0.4 0 0.6 1;0.4 0 0.6 1;0.4 0 0.6 1" values="M34 105 C24 88 16 122 6 105;M34 105 C24 101.6 16 108.4 6 105;M34 105 C24 122 16 88 6 105;M34 105 C24 108.4 16 101.6 6 105;M34 105 C24 88 16 122 6 105" />
      </path>
      <rect x="30" y="75" width="140" height="60" rx="30" fill="#86efac" stroke="#15803d" stroke-width="4" />
      <circle cx="145" cy="90" r="4" fill="#dcfce7" />
      <circle cx="55" cy="122" r="3" fill="#dcfce7" />
      <g class="face">
        <circle cx="86" cy="101" r="6" fill="#14532d" />
        <circle cx="114" cy="101" r="6" fill="#14532d" />
        <circle cx="88" cy="99" r="2" fill="white" />
        <circle cx="116" cy="99" r="2" fill="white" />
        <ellipse cx="70" cy="113" rx="7" ry="4" fill="#f9a8d4" opacity="0.8" />
        <ellipse cx="130" cy="113" rx="7" ry="4" fill="#f9a8d4" opacity="0.8" />
        <path d="M94 113 Q100 119 106 113" stroke="#14532d" stroke-width="3" fill="none" stroke-linecap="round" />
      </g>
    `,
  },
  // Elia: Borrelia burgdorferi, a light purple spirochete (corkscrew)
  {
    id: 'elia',
    name: 'Elia',
    looks: 'a light purple corkscrew-shaped Borrelia burgdorferi',
    motion: 'slither',
    frames: { home: '8 0 200 200', picker: '12 4 192 192', dish: '12 4 192 192' },
    art: `
      <!-- corkscrew body: outline, then fill (her flagella are inside the cell) -->
      <path class="wave" d="${eliaBody()}" stroke="#7e22ce" stroke-width="18" fill="none" stroke-linecap="round" stroke-linejoin="round">${eliaWave()}</path>
      <circle cx="176" cy="100" r="16" fill="#7e22ce" />
      <path class="wave" d="${eliaBody()}" stroke="#d8b4fe" stroke-width="12" fill="none" stroke-linecap="round" stroke-linejoin="round">${eliaWave()}</path>
      <circle cx="176" cy="100" r="13" fill="#d8b4fe" />
      ${eliaShine(42.5)}
      ${eliaShine(99.5)}
      <circle cx="171" cy="93" r="2.5" fill="#f3e8ff" />
      <g class="face">
        <circle cx="171.5" cy="99" r="3" fill="#581c87" />
        <circle cx="180.5" cy="99" r="3" fill="#581c87" />
        <circle cx="172.4" cy="97.9" r="1.1" fill="white" />
        <circle cx="181.4" cy="97.9" r="1.1" fill="white" />
        <ellipse cx="167.5" cy="104.5" rx="2.4" ry="1.6" fill="#f9a8d4" opacity="0.9" />
        <ellipse cx="184.5" cy="104.5" rx="2.4" ry="1.6" fill="#f9a8d4" opacity="0.9" />
        <path d="M173.5 104.5 Q176 107.5 178.5 104.5" stroke="#581c87" stroke-width="1.8" fill="none" stroke-linecap="round" />
      </g>
    `,
  },
  // Ceres: Bacillus cereus, a sky-blue chain of three square-ended rods
  {
    id: 'ceres',
    name: 'Ceres',
    looks: 'a sky-blue chain of three Bacillus cereus rods',
    motion: 'wobble',
    frames: { home: '0 0 200 200', picker: '6 10 188 188', dish: '6 10 188 188' },
    art: `
      <!-- left rod, tipped down at its outer end -->
      <g transform="rotate(14 42 112)">
        <rect x="14" y="93" width="56" height="38" rx="11" fill="#bae6fd" stroke="#0369a1" stroke-width="4" />
        <circle cx="26" cy="103" r="4" fill="#f0f9ff" />
      </g>
      <!-- right rod -->
      <g transform="rotate(-14 158 112)">
        <rect x="130" y="93" width="56" height="38" rx="11" fill="#bae6fd" stroke="#0369a1" stroke-width="4" />
        <circle cx="142" cy="103" r="4" fill="#f0f9ff" />
      </g>
      <!-- middle rod, with her face -->
      <rect x="67" y="80" width="66" height="46" rx="13" fill="#bae6fd" stroke="#0369a1" stroke-width="4" />
      <circle cx="79" cy="90" r="4.5" fill="#f0f9ff" />
      <g class="face">
        <circle cx="90" cy="101" r="5.5" fill="#0c4a6e" />
        <circle cx="110" cy="101" r="5.5" fill="#0c4a6e" />
        <circle cx="91.8" cy="99.2" r="1.9" fill="white" />
        <circle cx="111.8" cy="99.2" r="1.9" fill="white" />
        <ellipse cx="80" cy="113" rx="5" ry="3.2" fill="#f9a8d4" opacity="0.9" />
        <ellipse cx="120" cy="113" rx="5" ry="3.2" fill="#f9a8d4" opacity="0.9" />
        <path d="M94 112 Q100 118 106 112" stroke="#0c4a6e" stroke-width="3" fill="none" stroke-linecap="round" />
      </g>
    `,
  },
  // Sallie: Salmonella Typhi, a grey rod with flagella all over
  {
    id: 'sallie',
    name: 'Sallie',
    looks: 'a grey rod-shaped Salmonella Typhi with flagella all around her',
    motion: 'bob',
    frames: { home: '0 0 200 200', picker: '10 10 180 180', dish: '8 8 184 184' },
    // Drawn a little smaller than the others on the home page.
    homeWidth: 104,
    art: `
      <!-- flagella all over her body -->
      ${SALLIE_FLAGELLA}
      <rect x="40" y="74" width="120" height="52" rx="26" fill="#d4d4d8" stroke="#52525b" stroke-width="4" />
      <circle cx="140" cy="87" r="4" fill="#f4f4f5" />
      <circle cx="58" cy="115" r="3" fill="#f4f4f5" />
      <g class="face">
        <circle cx="87" cy="98" r="6" fill="#27272a" />
        <circle cx="113" cy="98" r="6" fill="#27272a" />
        <circle cx="89" cy="96" r="2" fill="white" />
        <circle cx="115" cy="96" r="2" fill="white" />
        <ellipse cx="72" cy="110" rx="7" ry="4" fill="#f9a8d4" opacity="0.9" />
        <ellipse cx="128" cy="110" rx="7" ry="4" fill="#f9a8d4" opacity="0.9" />
        <path d="M94 110 Q100 116 106 110" stroke="#27272a" stroke-width="3" fill="none" stroke-linecap="round" />
      </g>
    `,
  },
  // Sara: Serratia marcescens, a short, plump rod in prodigiosin red, with flagella all over
  {
    id: 'sara',
    name: 'Sara',
    looks: 'a short, plump red rod-shaped Serratia marcescens with flagella all around her',
    motion: 'bob',
    frames: { home: '0 0 200 200', picker: '10 10 180 180', dish: '8 8 184 184' },
    art: `
      <!-- flagella all over her body -->
      ${SERRA_FLAGELLA}
      <rect x="52" y="72" width="96" height="56" rx="28" fill="#ff5a6e" stroke="#b0002f" stroke-width="4" />
      <ellipse cx="124" cy="83" rx="9" ry="4.5" fill="#ffd1d8" opacity="0.9" transform="rotate(-12 124 83)" />
      <circle cx="66" cy="117" r="3" fill="#ffd1d8" />
      <g class="face">
        <circle cx="88" cy="96" r="6" fill="#6b0016" />
        <circle cx="112" cy="96" r="6" fill="#6b0016" />
        <circle cx="90" cy="94" r="2" fill="white" />
        <circle cx="114" cy="94" r="2" fill="white" />
        <ellipse cx="74" cy="108" rx="6.5" ry="3.8" fill="#ffc2cc" opacity="0.95" />
        <ellipse cx="126" cy="108" rx="6.5" ry="3.8" fill="#ffc2cc" opacity="0.95" />
        <path d="M94 108 Q100 114 106 108" stroke="#6b0016" stroke-width="3" fill="none" stroke-linecap="round" />
      </g>
    `,
  },
  // Ivy: Bacillus mycoides, a sage-green chain of rods curling up like a vine
  {
    id: 'ivy',
    name: 'Ivy',
    looks: 'a sage-green chain of Bacillus mycoides rods curling up at the end like a vine',
    motion: 'wobble',
    frames: { home: '0 12 204 204', picker: '2 22 194 194', dish: '2 22 194 194' },
    art: `
      <!-- five rods end to end, curling up at the front like a tendril (her colonies swirl as they spread) -->
      ${ivyRod(28, 156, 16, 44, 30)}
      ${ivyRod(70, 144, 6, 46, 32)}
      ${ivyRod(124, 132, -8, 62, 46)}
      ${ivyRod(170, 96, -62, 46, 32)}
      ${ivyRod(168, 50, -118, 38, 26)}
      <g class="face">
        <circle cx="113" cy="128" r="6" fill="#2f4224" />
        <circle cx="135" cy="125" r="6" fill="#2f4224" />
        <circle cx="115" cy="126" r="2" fill="white" />
        <circle cx="137" cy="123" r="2" fill="white" />
        <ellipse cx="102" cy="140" rx="6" ry="3.6" fill="#f9a8d4" opacity="0.9" />
        <ellipse cx="146" cy="136" rx="6" ry="3.6" fill="#f9a8d4" opacity="0.9" />
        <path d="M118 139 Q124 145 131 138" stroke="#2f4224" stroke-width="3" fill="none" stroke-linecap="round" />
      </g>
    `,
  },
  // Astrid: Asticcacaulis biprosthecum, an azure rod with two stalks near one end
  {
    id: 'astrid',
    name: 'Astrid',
    looks: 'an azure rod-shaped Asticcacaulis biprosthecum with two stalks near one end',
    motion: 'bob',
    frames: { home: '0 0 200 200', picker: '18 18 164 164', dish: '20 20 160 160' },
    // She comes in two forms (see rod.js): this one, with stalks and a
    // holdfast, and the swimmer her divisions make, with a flagellum instead.
    // The swimmer's parts are hidden until then.
    art: `
      <g class="stalked">
        <!-- two stalks (prosthecae) from her sides, near her back end -->
        ${astridStalk(70, 84, 41, 44)}
        ${astridStalk(70, 116, 41, 156)}
        <!-- holdfast: a dab of glue right at her back end -->
        <ellipse cx="40" cy="100" rx="9" ry="12" fill="#fde68a" stroke="#d4a017" stroke-width="3" />
      </g>
      <g class="swarmer" display="none">
        ${flagellum('#1a4f9c', 44, 100, 180, 24, '0.6s')}
      </g>
      <rect x="44" y="74" width="122" height="52" rx="26" fill="#5aa9f5" stroke="#1a4f9c" stroke-width="4" />
      <circle cx="146" cy="87" r="4" fill="#e3effd" />
      <circle cx="62" cy="115" r="3" fill="#e3effd" />
      <g class="face">
        <circle cx="103" cy="98" r="6" fill="#0f2f5e" />
        <circle cx="129" cy="98" r="6" fill="#0f2f5e" />
        <circle cx="105" cy="96" r="2" fill="white" />
        <circle cx="131" cy="96" r="2" fill="white" />
        <ellipse cx="89" cy="110" rx="7" ry="4" fill="#f9a8d4" opacity="0.9" />
        <ellipse cx="143" cy="110" rx="7" ry="4" fill="#f9a8d4" opacity="0.9" />
        <path d="M110 110 Q116 116 122 110" stroke="#0f2f5e" stroke-width="3" fill="none" stroke-linecap="round" />
      </g>
    `,
  },
  // Kiki: Cronobacter sakazakii, a short, plump lemon-yellow rod with flagella all over
  {
    id: 'kiki',
    name: 'Kiki',
    looks: 'a short, plump yellow rod-shaped Cronobacter sakazakii with flagella all around her',
    motion: 'bob',
    frames: { home: '0 0 200 200', picker: '10 10 180 180', dish: '8 8 184 184' },
    // A cooler, brighter lemon than Goldie's buttery gold, with an olive
    // outline rather than an orange one, so the two don't look alike.
    art: `
      <!-- flagella all over her body -->
      ${KIKI_FLAGELLA}
      <!-- yellow from the pigment many strains make at room temperature -->
      <rect x="50" y="74" width="100" height="52" rx="26" fill="#fff35c" stroke="#7d7200" stroke-width="4" />
      <ellipse cx="127" cy="85" rx="8" ry="4" fill="#fffde0" transform="rotate(-12 127 85)" />
      <circle cx="64" cy="115" r="3" fill="#fffde0" />
      <g class="face">
        <circle cx="88" cy="97" r="6" fill="#3b3600" />
        <circle cx="112" cy="97" r="6" fill="#3b3600" />
        <circle cx="90" cy="95" r="2" fill="white" />
        <circle cx="114" cy="95" r="2" fill="white" />
        <ellipse cx="74" cy="109" rx="6.5" ry="3.8" fill="#f9a8d4" opacity="0.9" />
        <ellipse cx="126" cy="109" rx="6.5" ry="3.8" fill="#f9a8d4" opacity="0.9" />
        <path d="M94 109 Q100 115 106 109" stroke="#3b3600" stroke-width="3" fill="none" stroke-linecap="round" />
      </g>
    `,
  },  // Electra: Geobacter sulfurreducens, a grape-purple rod covered in electric nanowires
  {
    id: 'electra',
    name: 'Electra',
    looks: 'a grape-purple Geobacter sulfurreducens rod covered in sparking nanowires',
    motion: 'bob',
    frames: { home: '-11 -9 222 222', picker: '-5 -3 210 210', dish: '-5 -3 210 210' },
    art: `
      <!-- nanowires all around her, with yellow bursts running out along them (no flagella: the usual lab strain doesn't make any) -->
      ${ELECTRA_NANOWIRES}
      <rect x="28" y="74" width="144" height="56" rx="28" fill="#b27ee0" stroke="#4c1d95" stroke-width="4" />
      <circle cx="148" cy="87" r="4" fill="#f5ecff" />
      <circle cx="52" cy="119" r="3" fill="#f5ecff" />
      <g class="face">
        <circle cx="87" cy="99" r="6" fill="#2e1065" />
        <circle cx="113" cy="99" r="6" fill="#2e1065" />
        <circle cx="89" cy="97" r="2" fill="white" />
        <circle cx="115" cy="97" r="2" fill="white" />
        <ellipse cx="71" cy="111" rx="6.5" ry="3.8" fill="#f9a8d4" opacity="0.95" />
        <ellipse cx="129" cy="111" rx="6.5" ry="3.8" fill="#f9a8d4" opacity="0.95" />
        <path d="M94 110 Q100 116 106 110" stroke="#2e1065" stroke-width="3" fill="none" stroke-linecap="round" />
      </g>
    `,
  },
  // Nova: Nocardia nova, a teal filament that branches and branches again,
  // beaded along its length
  {
    id: 'nova',
    name: 'Nova',
    looks: 'a teal Nocardia nova, a thin, beaded filament branching every which way',
    motion: 'wobble',
    frames: { home: '-4 0 208 208', picker: '3 7 194 194', dish: '3 7 194 194' },
    art: `
      <!-- outline: every filament, drawn thick in dark teal, so the whole network shares one edge -->
      <g stroke="#0f766e" stroke-width="18" fill="none" stroke-linecap="round" stroke-linejoin="round">
        ${NOVA_FILAMENTS}
      </g>
      <!-- her hub, where the filaments meet (her face goes here) -->
      <circle cx="100" cy="108" r="23" fill="#8fe3d8" stroke="#0f766e" stroke-width="4" />
      <!-- fill: the same filaments a little thinner, in light teal -->
      <g stroke="#8fe3d8" stroke-width="10" fill="none" stroke-linecap="round" stroke-linejoin="round">
        ${NOVA_FILAMENTS}
      </g>
      <!-- beads: Nocardia stains unevenly, so her filaments look like strings of beads -->
      ${NOVA_BEADS}
      <circle cx="90" cy="96" r="3.2" fill="#e6fffb" />
      <g class="face">
        <circle cx="92" cy="105" r="5" fill="#134e4a" />
        <circle cx="108" cy="105" r="5" fill="#134e4a" />
        <circle cx="93.6" cy="103.4" r="1.7" fill="white" />
        <circle cx="109.6" cy="103.4" r="1.7" fill="white" />
        <ellipse cx="86" cy="115" rx="4" ry="2.6" fill="#f9a8d4" opacity="0.9" />
        <ellipse cx="114" cy="115" rx="4" ry="2.6" fill="#f9a8d4" opacity="0.9" />
        <path d="M96 115 Q100 120 104 115" stroke="#134e4a" stroke-width="3" fill="none" stroke-linecap="round" />
      </g>
    `,
  },
  // Diffany: Clostridioides difficile, a big, plump chestnut-brown rod with
  // flagella all over and an oval spore near one end
  {
    id: 'diffany',
    name: 'Diffany',
    looks: 'a big, plump chestnut-brown Clostridioides difficile rod with flagella all around her and an oval spore near one end',
    motion: 'bob',
    frames: { home: '0 0 200 200', picker: '12 12 176 176', dish: '4 4 192 192' },
    art: `
      <!-- flagella all over her body -->
      ${DIFFANY_FLAGELLA}
      <!-- one outline: her rod, bulging a little over her spore. Drawn as a
           thick outline under a fill, so the rod and bulge share one edge. -->
      <g stroke="#7a2e1a" stroke-width="8" fill="#d2927f">
        <rect x="42" y="72" width="116" height="56" rx="28" />
        <ellipse cx="130" cy="100" rx="27" ry="31" />
      </g>
      <g fill="#d2927f">
        <rect x="42" y="72" width="116" height="56" rx="28" />
        <ellipse cx="130" cy="100" rx="27" ry="31" />
      </g>
      <ellipse cx="62" cy="83" rx="8" ry="3.5" fill="#f6ddd4" transform="rotate(-14 62 83)" />
      <circle cx="54" cy="113" r="3" fill="#f6ddd4" />
      <!-- the spore: oval, near the end but not at the tip (subterminal), and
           pure white so a Gram stain leaves it clear, as on a real slide -->
      <ellipse cx="132" cy="100" rx="14" ry="12" fill="#ffffff" stroke="#7a2e1a" stroke-width="2" stroke-opacity="0.45" />
      <ellipse cx="135" cy="103" rx="7" ry="5" fill="#f6ddd4" opacity="0.7" />
      <g class="face">
        <circle cx="76" cy="97" r="6" fill="#3d140a" />
        <circle cx="98" cy="97" r="6" fill="#3d140a" />
        <circle cx="78" cy="95" r="2" fill="white" />
        <circle cx="100" cy="95" r="2" fill="white" />
        <ellipse cx="62" cy="109" rx="6" ry="3.6" fill="#f9a8d4" opacity="0.9" />
        <ellipse cx="111" cy="109" rx="6" ry="3.6" fill="#f9a8d4" opacity="0.9" />
        <path d="M81 109 Q87 115 93 109" stroke="#3d140a" stroke-width="3" fill="none" stroke-linecap="round" />
      </g>
    `,
  },
  // Pearl: Klebsiella pneumoniae, a short, plump pink rod in a thick, glossy
  // capsule, with tiny pili and no flagella
  {
    id: 'pearl',
    name: 'Pearl',
    looks: 'a short, plump pink Klebsiella pneumoniae rod in a thick, glossy capsule, with tiny hairs all around her',
    motion: 'bob',
    frames: { home: '0 0 200 200', picker: '26 26 148 148', dish: '22 22 156 156' },
    // A soft pearly pink with a slate outline, so she doesn't look like
    // Scarlett (red outline) or Ana and Sara (hot pink).
    art: `
      <!-- her capsule: a thick, slimy coat around her, glossy and see-through.
           Pure white, so a Gram stain leaves it clear, as on a real slide -->
      <ellipse cx="100" cy="100" rx="70" ry="45" fill="#ffffff" fill-opacity="0.55" stroke="#e6dcef" stroke-width="3.5" />
      <path d="M52 78 Q70 60 102 58" stroke="#ffffff" stroke-width="4" fill="none" stroke-linecap="round" opacity="0.9" />
      <circle cx="146" cy="126" r="3" fill="#ffffff" opacity="0.9" />
      <!-- her pili: tiny sticky hairs all around her, inside her capsule -->
      <g stroke="#5c5670" stroke-width="1.8" stroke-linecap="round" opacity="0.85">${PEARL_PILI}</g>
      <!-- her short, plump rod -->
      <rect x="58" y="76" width="84" height="48" rx="24" fill="#efc6cd" stroke="#5c5670" stroke-width="4" />
      <ellipse cx="124" cy="86" rx="7" ry="3.5" fill="#fdeef0" transform="rotate(-12 124 86)" />
      <circle cx="70" cy="113" r="2.8" fill="#fdeef0" />
      <g class="face">
        <circle cx="89" cy="97" r="5.5" fill="#2a2534" />
        <circle cx="111" cy="97" r="5.5" fill="#2a2534" />
        <circle cx="90.8" cy="95.2" r="1.9" fill="white" />
        <circle cx="112.8" cy="95.2" r="1.9" fill="white" />
        <ellipse cx="76" cy="108" rx="6" ry="3.5" fill="#f9a8d4" opacity="0.9" />
        <ellipse cx="124" cy="108" rx="6" ry="3.5" fill="#f9a8d4" opacity="0.9" />
        <path d="M95 108 Q100 113 105 108" stroke="#2a2534" stroke-width="3" fill="none" stroke-linecap="round" />
      </g>
    `,
  },
  // Francisella tularensis
  {
    id: 'frannie',
    name: 'Frannie',
    looks: 'a small, plump coral Francisella tularensis with tiny bunny ears',
    motion: 'bob',
    // Framed roomy, so she looks small: she's one of the tiniest pals.
    frames: { home: '0 0 200 200', picker: '26 26 148 148', dish: '22 22 156 156' },
    art: `
      <!-- tiny bunny ears, a nod to "snuffles," the sniffles she gives pet
           rabbits (real cells have no ears!). Drawn first so her rod covers
           their bases. -->
      <g transform="rotate(-14 91 70)">
        <ellipse cx="91" cy="66" rx="6" ry="14" fill="#ffb8a3" stroke="#a8432e" stroke-width="3" />
        <!-- the pink middle of each ear, so they read as bunny ears -->
        <ellipse cx="91" cy="64.5" rx="3.4" ry="10" fill="#f472b6" />
        <ellipse cx="90" cy="61" rx="1.2" ry="4" fill="#fbcfe8" />
      </g>
      <g transform="rotate(14 109 70)">
        <ellipse cx="109" cy="66" rx="6" ry="14" fill="#ffb8a3" stroke="#a8432e" stroke-width="3" />
        <ellipse cx="109" cy="64.5" rx="3.4" ry="10" fill="#f472b6" />
        <ellipse cx="108" cy="61" rx="1.2" ry="4" fill="#fbcfe8" />
      </g>
      <!-- her short, plump rod (no flagella: she can't swim) -->
      <rect x="60" y="78" width="80" height="44" rx="22" fill="#ffb8a3" stroke="#a8432e" stroke-width="4" />
      <circle cx="72" cy="89" r="3.2" fill="#fff1ea" />
      <circle cx="129" cy="89" r="2.6" fill="#fff1ea" />
      <g class="face">
        <circle cx="92" cy="97" r="5" fill="#4a1a10" />
        <circle cx="108" cy="97" r="5" fill="#4a1a10" />
        <circle cx="93.6" cy="95.4" r="1.7" fill="white" />
        <circle cx="109.6" cy="95.4" r="1.7" fill="white" />
        <ellipse cx="80" cy="108" rx="5" ry="3.2" fill="#f9a8d4" opacity="0.9" />
        <ellipse cx="120" cy="108" rx="5" ry="3.2" fill="#f9a8d4" opacity="0.9" />
        <path d="M96 107 Q100 111.5 104 107" stroke="#4a1a10" stroke-width="2.8" fill="none" stroke-linecap="round" />
      </g>
    `,
  },
  // Colette: Escherichia coli, a long, slim green-apple rod with flagella all over
  {
    id: 'colette',
    name: 'Colette',
    looks: 'a long, slim green Escherichia coli rod with flagella all around her',
    motion: 'bob',
    frames: { home: '0 0 200 200', picker: '10 10 180 180', dish: '4 4 192 192' },
    // A bright green apple with a deep green outline, so she doesn't look
    // like Terra (olive) or Mona (mint).
    art: `
      <!-- flagella all over her body -->
      ${COLETTE_FLAGELLA}
      <rect x="34" y="78" width="132" height="44" rx="22" fill="#abee64" stroke="#2e6b0e" stroke-width="4" />
      <path d="M118 85 Q136 81 152 88" stroke="#effde0" stroke-width="4" fill="none" stroke-linecap="round" opacity="0.95" />
      <circle cx="148" cy="113" r="2.8" fill="#effde0" />
      <g class="face">
        <circle cx="88" cy="97" r="6" fill="#14300a" />
        <circle cx="112" cy="97" r="6" fill="#14300a" />
        <circle cx="90" cy="95" r="2" fill="white" />
        <circle cx="114" cy="95" r="2" fill="white" />
        <ellipse cx="74" cy="109" rx="7" ry="4" fill="#f9a8d4" opacity="0.9" />
        <ellipse cx="126" cy="109" rx="7" ry="4" fill="#f9a8d4" opacity="0.9" />
        <path d="M94 109 Q100 115 106 109" stroke="#14300a" stroke-width="3" fill="none" stroke-linecap="round" />
      </g>
    `,
  },
  // Dina: Deinococcus radiodurans, an orchid square of four round cells (a tetrad)
  {
    id: 'dina',
    name: 'Dina',
    looks: 'an orchid-pink square of four round Deinococcus radiodurans cells',
    motion: 'squish',
    frames: { home: '0 0 200 200', picker: '16 16 168 168', dish: '20 20 160 160' },
    art: `
      <!-- a tetrad: four cells in a square, pressed a little flat where they
           touch, since each division splits a cell straight across -->
      ${DINA_CELLS}
      <g class="face">
        <circle cx="56" cy="132" r="5.5" fill="#701a75" />
        <circle cx="78" cy="132" r="5.5" fill="#701a75" />
        <circle cx="57.8" cy="130.2" r="1.9" fill="white" />
        <circle cx="79.8" cy="130.2" r="1.9" fill="white" />
        <ellipse cx="46" cy="143" rx="5.5" ry="3.4" fill="#f9a8d4" opacity="0.95" />
        <ellipse cx="88" cy="143" rx="5.5" ry="3.4" fill="#f9a8d4" opacity="0.95" />
        <path d="M62 143 Q67 148 72 143" stroke="#701a75" stroke-width="3" fill="none" stroke-linecap="round" />
      </g>
    `,
  },
  // Ari: Anabaena variabilis, a jade string of beads with one gold heterocyst
  {
    id: 'ari',
    name: 'Ari',
    looks: 'a jade-green Anabaena variabilis, a string of round cells with one pale gold heterocyst',
    motion: 'wobble',
    frames: { home: '0 0 200 200', picker: '2 2 196 196', dish: '2 2 196 196' },
    art: `
      ${ARI_CELLS}
    `,
  },
  // Marina: Mycobacterium marinum, a slim, gently curved persimmon rod in a
  // soft, waxy glow
  {
    id: 'marina',
    name: 'Marina',
    looks: 'a slim, gently curved persimmon Mycobacterium marinum rod in a soft, waxy coat',
    motion: 'bob',
    // Framed roomy, so her long, slim rod comes out about as long as Mona's
    // and Colette's.
    frames: { home: '0 0 200 200', picker: '0 0 200 200', dish: '0 0 200 200' },
    art: `
      <!-- her waxy coat: a soft, glossy glow around the rod (mycolic acids) -->
      <path d="M44 97 Q100 116 156 100" stroke="#fde7d6" stroke-width="50" stroke-opacity="0.75" fill="none" stroke-linecap="round" />
      <!-- the slim, curved rod: outline, then her body (marked, since it's
           darker than microscope mode would take for a body) -->
      <path d="M44 97 Q100 116 156 100" stroke="#8a2c0b" stroke-width="34" fill="none" stroke-linecap="round" />
      <path data-stain="body" d="M44 97 Q100 116 156 100" stroke="#f4803f" stroke-width="27" fill="none" stroke-linecap="round" />
      <path d="M56 91 Q72 96 88 97" stroke="#fde7d6" stroke-width="4" fill="none" stroke-linecap="round" />
      <g class="face">
        <circle cx="94" cy="104.5" r="5" fill="#3f1406" />
        <circle cx="114" cy="104.5" r="5" fill="#3f1406" />
        <circle cx="95.6" cy="102.9" r="1.7" fill="white" />
        <circle cx="115.6" cy="102.9" r="1.7" fill="white" />
        <ellipse cx="84" cy="112.5" rx="4.5" ry="2.8" fill="#f9a8d4" opacity="0.95" />
        <ellipse cx="124" cy="112.5" rx="4.5" ry="2.8" fill="#f9a8d4" opacity="0.95" />
        <path d="M99.5 112.5 Q104 116.5 108.5 112.5" stroke="#3f1406" stroke-width="2.6" fill="none" stroke-linecap="round" />
      </g>
    `,
  },
];

// The pals in the home page's row, in PALS order. The row is full: pals
// added after Lissie appear only in the picker and the game.
const HOME = ['terra', 'penny', 'vi', 'goldie', 'ana', 'lissie', 'scarlett', 'coco', 'mona', 'elia', 'ceres', 'sallie'];
export const HOME_PALS = PALS.filter((pal) => HOME.includes(pal.id));

// How many pals fit on one page of the picker: four across, two down.
export const PAGE_SIZE = 8;

// `pals` split into the picker's pages, in order, PAGE_SIZE to a page (the
// last page has whoever is left over).
export function pickerPages(pals = PALS, size = PAGE_SIZE) {
  const pages = [];
  for (let i = 0; i < pals.length; i += size) pages.push(pals.slice(i, i + size));
  return pages;
}

// A copy of `pals` in a random order (a Fisher-Yates shuffle, so every order
// is equally likely). The picker uses it so no pal is always first.
export function inRandomOrder(pals, random = Math.random) {
  const order = [...pals];
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  return order;
}

// The pal with this id, or undefined. Compares ids rather than looking one
// up by name, so an address like ?pal=toString finds nothing.
export function palById(id) {
  return PALS.find((pal) => pal.id === id);
}

// Her drawing as an <svg>, framed for `page` ('home', 'picker' or 'dish').
function drawing(pal, page) {
  const svg = document.createElementNS(SVG, 'svg');
  svg.setAttribute('viewBox', pal.frames[page]);
  svg.innerHTML = pal.art;
  // A flagellum (Mona's, Vi's), Elia's body and Electra's sparks move with
  // SVG's own <animate> on the home page, and in the dish while she swims
  // (see rod.js). They stay still on the picker, and for anyone who has asked for less
  // motion (CSS can't pause <animate>).
  const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  if (page === 'picker' || reduced) {
    for (const wiggle of svg.querySelectorAll('animate')) wiggle.remove();
  }
  return svg;
}

// For the home page's row of pals.
export function homePal(pal) {
  const svg = drawing(pal, 'home');
  svg.setAttribute('class', `pal ${pal.motion}`);
  if (pal.homeWidth) svg.style.width = `${pal.homeWidth}px`;
  svg.setAttribute('role', 'img');
  svg.setAttribute('aria-label', `${pal.name}, ${pal.looks}`);
  return svg;
}

// Her picture on a colored tile, for the picker and the mode page. The name
// next to it says who she is, so the picture is hidden from screen readers.
export function palTile(pal) {
  const tile = document.createElement('div');
  tile.className = `pal-icon ${pal.id}`;
  tile.style.setProperty('--tile', SPECIES[pal.id].tile);
  const svg = drawing(pal, 'picker');
  svg.setAttribute('aria-hidden', 'true');
  tile.append(svg);
  return tile;
}

// For the petri dish, hidden until the game picks her (main.js).
export function dishPal(pal) {
  const svg = drawing(pal, 'dish');
  svg.setAttribute('class', `dish-pal ${pal.motion}`);
  svg.dataset.pal = pal.id;
  svg.dataset.name = pal.name;
  svg.setAttribute('role', 'img');
  svg.setAttribute('aria-label', `${pal.name}, ${pal.looks}`);
  svg.setAttribute('hidden', '');
  return svg;
}
