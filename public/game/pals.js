// Every pal's drawing, in one place. The home page, the pal picker, the mode
// page and the petri dish all draw the pals from here, so a change to how a
// pal looks only has to be made once.
//
// The list is in the order the pals appear on the home page (the picker
// shuffles them).
// Each pal has:
//   id      her key, matching SPECIES in config.js and ?pal= in addresses
//   name    what she's called
//   looks   what a screen reader says after her name
//   motion  her idle animation in styles.css (bob, squish, wobble or slither)
//   frames  the part of the drawing each page shows (an SVG viewBox), so each
//           page can frame her its own way: a little room around her on the
//           home page, filling her tile on the picker, snug in the dish
//   art     the drawing itself, in a 200 x 200 space. Wrap the face in
//           <g class="face">: offspring in the dish hide it.
//
// To add a pal: add her to the end of this list and to SPECIES in config.js,
// and give her tile a color in styles.css (.<id> next to .penny and the
// others). The home page row is full, so new pals go in the picker only:
// don't add them to HOME below.

const SVG = 'http://www.w3.org/2000/svg';

// Elia's corkscrew body is a wave along her length: 3½ waves from her tail
// (x 33) to where it meets her head (x 166), 14 units high, a little smaller
// over the last half-wave so her neck doesn't wobble. `phase` slides the wave
// along her (2π is one whole wave).
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
// Her swimming: the wave travels from her head to her tail, the way a
// spirochete's inner flagella push her forward. Played with SVG's own
// <animate>, like Mona's and Vi's flagella, so in the dish it only runs
// while she swims (rod.js), and not at all on the picker or for anyone who
// has asked for less motion (drawing() below).
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

// Flagella all over the body (peritrichous), for Sallie, Terra, Lissie and Sara: each one
// starts at (x, y) on her outline and heads off at `angle` degrees, `length`
// long, waving 12 units to each side. Wiggled with SVG's own <animate>, like
// Mona's and Vi's tails, each at its own speed so they don't move in lockstep.
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

// One of Ivy's rods, centered at (x, y), turned `angle` degrees, with a shine
// near one corner.
const ivyRod = (x, y, angle, w, h) =>
  `<g transform="rotate(${angle} ${x} ${y})">` +
  `<rect x="${x - w / 2}" y="${y - h / 2}" width="${w}" height="${h}" rx="${(h * 0.36).toFixed(1)}" fill="#b8d8a0" stroke="#4d6b3c" stroke-width="4" />` +
  `<circle cx="${x - w / 2 + 9}" cy="${y - h / 2 + 8}" r="3.2" fill="#f0f7e8" /></g>`;

// Rebecca's nanowires: 16 conductive filaments, evenly spaced all around her
// and all the same length. Each starts on her outline at [x, y] and heads
// out at `angle` degrees (on her underside, which curves in, they fan out a
// little so they don't cross).
const REBECCA_WIRES = [
  [51, 78, -113],
  [73, 71, -103],
  [96, 68, -92],
  [119, 70, -81],
  [141, 75, -70],
  [161, 85, -59],
  [174, 104, -29],
  [168, 125, 0],
  [149, 136, 30],
  [126, 130, 57],
  [104, 124, 84],
  [81, 127, 115],
  [60, 135, 139],
  [39, 132, 167],
  [26, 113, -163],
  [32, 91, -133],
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
const REBECCA_NANOWIRES = REBECCA_WIRES.map((wire, i) => {
  const points = wirePoints(wire, i);
  const d = points.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join(' L');
  return (
    `<path d="M${d}" stroke="#4c1d95" stroke-width="2.6" fill="none" stroke-linecap="round" stroke-linejoin="round" />` +
    spark(...points[5], 3.6, 0, 'burst') +
    spark(...points[10], 5, 0.3, 'spark')
  );
}).join('');

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
  // Rebecca: Geobacter sulfurreducens, a grape-purple rod covered in electric nanowires
  {
    id: 'rebecca',
    name: 'Rebecca',
    looks: 'a grape-purple, slightly curved Geobacter sulfurreducens rod covered in sparking nanowires',
    motion: 'bob',
    frames: { home: '-11 -9 222 222', picker: '-5 -3 210 210', dish: '-5 -3 210 210' },
    art: `
      <!-- nanowires all around her, with yellow bursts running out along them (no flagella: the usual lab strain doesn't make any) -->
      ${REBECCA_NANOWIRES}
      <!-- a slightly curved rod: outline, then fill -->
      <path d="M54 108 Q100 84 146 108" stroke="#4c1d95" stroke-width="56" fill="none" stroke-linecap="round" />
      <path d="M54 108 Q100 84 146 108" stroke="#b27ee0" stroke-width="48" fill="none" stroke-linecap="round" />
      <ellipse cx="132" cy="90" rx="8" ry="4" fill="#f5ecff" transform="rotate(20 132 90)" />
      <circle cx="58" cy="118" r="3" fill="#f5ecff" />
      <g class="face">
        <circle cx="88" cy="96" r="6" fill="#2e1065" />
        <circle cx="112" cy="96" r="6" fill="#2e1065" />
        <circle cx="90" cy="94" r="2" fill="white" />
        <circle cx="114" cy="94" r="2" fill="white" />
        <ellipse cx="73" cy="108" rx="6.5" ry="3.8" fill="#f9a8d4" opacity="0.95" />
        <ellipse cx="127" cy="108" rx="6.5" ry="3.8" fill="#f9a8d4" opacity="0.95" />
        <path d="M94 107 Q100 113 106 107" stroke="#2e1065" stroke-width="3" fill="none" stroke-linecap="round" />
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
  // A flagellum (Mona's, Vi's), Elia's body and Rebecca's sparks move with
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
