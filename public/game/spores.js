// The spore burst: when the player beats a level, the colony "sporulates"
// and little spores in agar colors burst out from it and drift down. Uses
// canvas-confetti (vendor/confetti.js, v1.9.4, ISC license), copied in
// because the game is plain files with no build step.
import confetti from './vendor/confetti.js';

// Colors of real agar plates and stains. Each spore's outline is one of
// these, and its body a lighter shade of it, like the pals' drawings.
export const AGAR_COLORS = [
  '#B3262E', // blood agar red
  '#E85A8C', // MacConkey pink
  '#7B4A2A', // chocolate agar
  '#E8C26A', // nutrient agar amber
  '#3E7CC9', // chromogenic blue
  '#5DBB63', // colony green
  '#6A3FA0', // crystal violet
];

// `hex` mixed with white; `amount` 0 is the color itself, 1 is white.
export function lighten(hex, amount) {
  const channels = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  return `#${channels
    .map((c) => Math.round(c + (255 - c) * amount).toString(16).padStart(2, '0'))
    .join('')}`;
}

// The kinds of spore: [width, height, budding?] in pixels at normal size.
// Round, oval (like an endospore) and budding (a small one growing off a
// bigger one, like yeast).
const KINDS = [
  [10, 10, false],
  [13, 8, false],
  [12, 8, true],
];
const ANGLES = [0, 60, 120]; // every spore is drawn upright, so tilt some
const DETAIL = 3; // draw each one 3x bigger so it stays crisp when scaled

// One spore picture, the same way canvas-confetti's shapeFromText makes
// its pictures.
function drawSpore(color, [w, h, budding], angle) {
  const size = Math.ceil(Math.max(w, h) * 1.6 * DETAIL);
  const canvas = new OffscreenCanvas(size, size);
  const ctx = canvas.getContext('2d');
  ctx.translate(size / 2, size / 2);
  ctx.rotate((angle * Math.PI) / 180);
  ctx.scale(DETAIL, DETAIL);
  ctx.lineWidth = 1.4;
  ctx.fillStyle = lighten(color, 0.45);
  ctx.strokeStyle = color;
  const cell = (x, y, rx, ry) => {
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  };
  if (budding) cell(w / 2 - 1, -h / 4, h / 3, h / 3); // the bud, behind
  cell(budding ? -w / 6 : 0, 0, (budding ? h : w) / 2, h / 2);
  // The little white shine every pal has.
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.beginPath();
  ctx.arc((budding ? -w / 6 : 0) - w / 6, -h / 6, 1.3, 0, Math.PI * 2);
  ctx.fill();
  const scale = 1 / DETAIL;
  return {
    type: 'bitmap',
    bitmap: canvas.transferToImageBitmap(),
    matrix: [scale, 0, 0, scale, (-size * scale) / 2, (-size * scale) / 2],
  };
}

// Every spore picture, made the first time they're needed. Plain colored
// circles if the browser can't draw pictures off screen.
let spores;
function sporeShapes() {
  if (spores === undefined) {
    try {
      spores = AGAR_COLORS.flatMap((color) =>
        KINDS.flatMap((kind) => ANGLES.map((angle) => drawSpore(color, kind, angle))));
    } catch {
      spores = null;
    }
  }
  return spores ? { shapes: spores } : { shapes: ['circle'], colors: AGAR_COLORS };
}

// Where to burst from, as fractions of the window (0 to 1, what
// canvas-confetti wants), given the box of the element to burst from.
// The middle of the window if there's no box.
export function burstOrigin(rect, width, height) {
  if (!rect || !width || !height) return { x: 0.5, y: 0.5 };
  const clamp = (n) => Math.min(1, Math.max(0, n));
  return {
    x: clamp((rect.left + rect.width / 2) / width),
    y: clamp((rect.top + rect.height / 2) / height),
  };
}

// Burst spores out of `el` (the player's colony). Beating a level gets a
// quick little puff; `big` is for beating the last level: a full burst in
// three waves that floats down slowly.
export function sporeBurst(el, { big = false } = {}) {
  try {
    const base = {
      origin: burstOrigin(el?.getBoundingClientRect(), window.innerWidth, window.innerHeight),
      ...sporeShapes(),
      spread: 360, // every direction, like spores
      flat: true, // no paper-confetti tumbling, so they keep their shape
      disableForReducedMotion: true,
    };
    if (!big) {
      // About a second: fewer spores, not flung as far, and they fade fast.
      confetti({ ...base, particleCount: 50, startVelocity: 18, scalar: 1.1,
        gravity: 0.6, decay: 0.9, ticks: 110 });
      return;
    }
    const floaty = { ...base, gravity: 0.35, decay: 0.92, ticks: 250 };
    // One big burst, then a slower wave of fine spores, then one more pop.
    confetti({ ...floaty, particleCount: 240, startVelocity: 30, scalar: 1.3 });
    setTimeout(() => {
      confetti({ ...floaty, particleCount: 120, startVelocity: 15, scalar: 0.8, drift: 0.4 });
    }, 180);
    setTimeout(() => confetti({ ...floaty, particleCount: 150, startVelocity: 40, scalar: 1.1 }), 450);
  } catch {
    // A celebration is never worth breaking the game over.
  }
}
