// Detective mode's lab bench: draws the result of each test in the key
// (key.js) for the mystery pal. Under the microscope she's a field of plain
// cells in her Gram stain color, the right shape but not her cartoon, so the
// picture shows only what a real slide would. The other tests are little
// drawings: a fizzing drop, a blood agar plate, a tube of broth...
//
// Every drawing is built from fixed shapes in this file, never from anything
// in the page's address, so nothing a visitor types can end up in it.
import { SPECIES } from './config.js';
import { stainOf } from './stain.js';

const SVG = 'http://www.w3.org/2000/svg';

// [x, y, radius] of each bubble in the catalase drop.
const BUBBLES = [
  [96, 74, 7], [112, 62, 5], [128, 78, 8], [146, 66, 6], [104, 96, 6],
  [138, 98, 5], [120, 88, 4], [156, 86, 5], [86, 88, 4], [122, 52, 4],
];
// Where the colonies sit on each plate.
const COLONIES = [[96, 58], [144, 56], [120, 88], [88, 104], [152, 106]];
const ROD_SPOTS = [[42, 46, -12], [118, 38, 8], [70, 98, 6], [150, 96, -8]];

const circles = (points, attrs) =>
  points.map(([cx, cy, r]) => `<circle cx="${cx}" cy="${cy}" r="${r}" ${attrs} />`).join('');

// The shape of each pal's cells under the microscope. Ceres grows in chains
// and Terra's rods carry a spore, but on the slide they're all just rods.
export const CELL_SHAPES = {
  goldie: 'cocci',
  penny: 'cocci',
  scarlett: 'cocci',
  ana: 'rods',
  ceres: 'rods',
  terra: 'rods',
  mona: 'rods',
  sallie: 'rods',
  coco: 'rods',
  vi: 'curved',
  elia: 'spirochetes',
};

// Where the cells sit on the slide: [x, y, angle in degrees].
const FIELD = [
  [86, 50, 20], [124, 38, -30], [158, 58, 60], [98, 84, -10],
  [140, 90, 35], [76, 112, 70], [118, 122, 0], [160, 118, -45],
];

// One cell of each shape, centered on (0, 0) and turned by its <g>.
const CELL = {
  cocci: (s) => `<circle r="9" fill="${s.body}" stroke="${s.outline}" stroke-width="2.5" />`,
  rods: (s) => `<rect x="-17" y="-7" width="34" height="14" rx="7" fill="${s.body}" stroke="${s.outline}" stroke-width="2.5" />`,
  curved: (s) => `
    <path d="M-15 4 Q0 -12 15 4" stroke="${s.outline}" stroke-width="13" fill="none" stroke-linecap="round" />
    <path d="M-15 4 Q0 -12 15 4" stroke="${s.body}" stroke-width="8" fill="none" stroke-linecap="round" />`,
  spirochetes: (s) => {
    const wave = 'M-18 0 Q-15 -5 -12 0 T-6 0 T0 0 T6 0 T12 0 T18 0';
    return `
    <path d="${wave}" stroke="${s.outline}" stroke-width="6" fill="none" stroke-linecap="round" />
    <path d="${wave}" stroke="${s.body}" stroke-width="3" fill="none" stroke-linecap="round" />`;
  },
};

// A round slide with pal `id`'s cells on it, in her Gram stain colors.
export function slide(id) {
  const shape = CELL_SHAPES[id];
  const stain = stainOf(SPECIES[id]);
  const cells = FIELD.map(([x, y, angle]) =>
    `<g class="cell" transform="translate(${x} ${y}) rotate(${angle})">${CELL[shape](stain)}</g>`).join('');
  return `
    <circle cx="120" cy="80" r="76" fill="#ffffff" stroke="#94a3b8" stroke-width="3" />
    ${cells}`;
}

// Each test's drawing, given which of its two results she shows (0 or 1, as
// in the step's `answers`).
export const DRAWINGS = {
  // A drop of peroxide on a smear of her cells. Catalase makes it fizz.
  catalase: (result) => `
    <rect x="20" y="36" width="200" height="88" rx="10" fill="#f8fafc" stroke="#94a3b8" stroke-width="3" />
    <ellipse cx="120" cy="82" rx="62" ry="30" fill="#dbeafe" opacity="0.8" />
    <ellipse cx="120" cy="84" rx="40" ry="16" fill="#fef3c7" stroke="#d6a35c" stroke-width="2" />
    ${result === 0 ? circles(BUBBLES, 'class="bubble" fill="#ffffff" fill-opacity="0.85" stroke="#3b82f6" stroke-width="2"') : ''}`,

  // Colonies on red blood agar, each ringed green (alpha) or clear (beta).
  blood: (result) => `
    <circle cx="120" cy="80" r="72" fill="#b91c1c" stroke="#7f1d1d" stroke-width="4" />
    ${circles(COLONIES.map(([x, y]) => [x, y, 17]), result === 0 ? 'fill="#65a30d" opacity="0.85"' : 'fill="#fde2e2" opacity="0.9"')}
    ${circles(COLONIES.map(([x, y]) => [x, y, 6]), 'fill="#f8fafc" stroke="#cbd5e1" stroke-width="1.5"')}`,

  // A spore stain: pink rods, with green spores if she makes them.
  spores: (result) => `
    <rect x="10" y="14" width="220" height="132" rx="12" fill="#f8fafc" stroke="#cbd5e1" stroke-width="3" />
    ${ROD_SPOTS.map(([x, y, angle]) => `
      <g transform="rotate(${angle} ${x + 28} ${y + 12})">
        <rect x="${x}" y="${y}" width="56" height="24" rx="12" fill="#f9a8d4" stroke="#be185d" stroke-width="3" />
        ${result === 0 ? `<ellipse class="spore" cx="${x + 42}" cy="${y + 12}" rx="9" ry="7" fill="#22c55e" stroke="#15803d" stroke-width="2" />` : ''}
      </g>`).join('')}`,

  // A tube of broth, open to the air at the top. Dots are her growing cells.
  oxygen: (result) => {
    const cells = result === 0
      ? [[110, 30], [126, 34], [118, 42], [132, 50], [108, 56], [122, 64], [114, 84], [130, 100], [112, 118], [126, 134]]
      : [[112, 120], [126, 126], [118, 134], [132, 116], [108, 132], [122, 142]];
    return `
    <rect x="94" y="8" width="52" height="12" rx="4" fill="#bfdbfe" />
    <text x="160" y="19" font-size="13" font-weight="700" fill="#1e40af">air</text>
    <path d="M96 20 V124 A24 24 0 0 0 144 124 V20 Z" fill="#fef9c3" stroke="#94a3b8" stroke-width="3" />
    ${circles(cells.map(([x, y]) => [x, y, 4]), 'fill="#a16207"')}`;
  },

  // A smear of her cells on an oxidase strip, dark purple if she's positive.
  oxidase: (result) => `
    <rect x="36" y="44" width="168" height="72" rx="8" fill="#fefce8" stroke="#cbd5e1" stroke-width="3" />
    <ellipse cx="120" cy="80" rx="34" ry="20" ${result === 0 ? 'fill="#4c1d95"' : 'fill="#f5f0e6" stroke="#d6d3d1" stroke-width="2"'} />`,

  // A plain agar plate and a chocolate agar plate, side by side.
  chocolate: (result) => `
    <circle cx="64" cy="72" r="52" fill="#fef3c7" stroke="#d6a35c" stroke-width="4" />
    <circle cx="176" cy="72" r="52" fill="#7c4a2d" stroke="#4a2c17" stroke-width="4" />
    ${result === 0 ? circles([[48, 58, 6], [76, 54, 6], [62, 86, 6], [84, 82, 5]], 'fill="#f5f5f4" stroke="#a8a29e" stroke-width="1.5"') : ''}
    ${circles([[160, 58, 6], [188, 54, 6], [174, 86, 6], [196, 82, 5]], 'fill="#f5f5f4" stroke="#a8a29e" stroke-width="1.5"')}
    <text x="64" y="148" text-anchor="middle" font-size="14" font-weight="700" fill="#134e4a">Plain</text>
    <text x="176" y="148" text-anchor="middle" font-size="14" font-weight="700" fill="#134e4a">Chocolate</text>`,
};

// The result of `step` for pal `id`: her answer's drawing, labeled for
// screen readers with what it shows.
export function labView(step, result, id) {
  const view = document.createElement('div');
  view.className = `lab-view lab-${step.view}`;
  view.setAttribute('role', 'img');
  view.setAttribute('aria-label', step.answers[result].seen);

  const svg = document.createElementNS(SVG, 'svg');
  svg.setAttribute('viewBox', '0 0 240 160');
  svg.setAttribute('aria-hidden', 'true');
  svg.innerHTML = step.view === 'microscope' ? slide(id) : DRAWINGS[step.view](result);
  view.append(svg);
  return view;
}
