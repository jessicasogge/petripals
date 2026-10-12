// Where Colony Stack's cells go on the round dish, as SVG drawing commands,
// and which spot on the dish a finger is over. Plain math with no page
// access, so it can be tested on its own.
import { PIECES, STACK } from './stack-board.js';

// In SVG units: the dish is SIZE across, the first ring starts HUB out from
// the middle (the food is inside that), and each ring is RING thick. A big
// hub keeps the outer spots from being much wider than the inner ones.
export const DISH = { SIZE: 362, HUB: 48, RING: 15 };
// Every pal cell is drawn the same size wherever she is, so a piece looks the
// same at the rim as by the food: a coccus is COCCUS across, a rod ROD long.
export const COCCUS = 13;
export const ROD = { LONG: 23, WIDE: 12 };
const CENTER = DISH.SIZE / 2;
const STEP = (2 * Math.PI) / STACK.SECTORS; // one sector, in radians
const GAP = 1.5; // between neighboring spots

const num = (n) => +n.toFixed(1);
// The point `r` from the center at angle `a` (0 is straight up, clockwise).
const point = (r, a) => [num(CENTER + r * Math.sin(a)), num(CENTER - r * Math.cos(a))];

// The middle of a spot, and which way is along the ring there, in degrees
// (0 at the top, where along the ring is left to right).
export function spotCenter(ring, sector) {
  const a = (sector + 0.5) * STEP;
  const [x, y] = point(DISH.HUB + (ring + 0.5) * DISH.RING, a);
  return { x, y, along: num((a * 180) / Math.PI) };
}

// The curved patch of agar a cell sits on. Patches of one colony touch, so
// a piece reads as one colony even where its cells are far apart.
export function spotPath(ring, sector) {
  const inner = DISH.HUB + ring * DISH.RING + GAP / 2;
  const outer = inner + DISH.RING - GAP;
  const nudge = GAP / (inner + outer); // the same gap all the way along
  const from = sector * STEP + nudge;
  const to = (sector + 1) * STEP - nudge;
  const [ax, ay] = point(outer, from);
  const [bx, by] = point(outer, to);
  const [cx, cy] = point(inner, to);
  const [dx, dy] = point(inner, from);
  return `M${ax} ${ay}A${outer} ${outer} 0 0 1 ${bx} ${by}L${cx} ${cy}A${inner} ${inner} 0 0 0 ${dx} ${dy}Z`;
}

// The pal cell in the middle of a spot: a circle for a coccus, and for a rod
// a capsule lying along the ring.
export function cellShape(ring, sector, round) {
  const { x, y, along } = spotCenter(ring, sector);
  if (round) return { tag: 'circle', attrs: { cx: x, cy: y, r: COCCUS / 2 } };
  return {
    tag: 'rect',
    attrs: {
      x: -ROD.LONG / 2, y: -ROD.WIDE / 2, width: ROD.LONG, height: ROD.WIDE, rx: ROD.WIDE / 2,
      transform: `translate(${x} ${y}) rotate(${along})`,
    },
  };
}

// Which sector a point on the dish is in (x, y in SVG units).
export function sectorAt(x, y) {
  const a = Math.atan2(x - CENTER, CENTER - y);
  return Math.floor((a < 0 ? a + 2 * Math.PI : a) / STEP) % STACK.SECTORS;
}

// The shortest way round from sector `from` to sector `to`: how many
// sectors, plus for clockwise and minus for counterclockwise. `from` can be
// any whole number (pieces keep counting as they go round).
export function stepsBetween(from, to) {
  const n = STACK.SECTORS;
  return ((((to - from) % n) + n + Math.floor(n / 2)) % n) - Math.floor(n / 2);
}

// The faint lines between rings and between sectors.
export function guideCircles() {
  return Array.from({ length: STACK.RINGS + 1 }, (_, i) => DISH.HUB + i * DISH.RING);
}
export function guideSpokes() {
  return Array.from({ length: STACK.SECTORS }, (_, i) => {
    const [ax, ay] = point(DISH.HUB, i * STEP);
    const [bx, by] = point(DISH.HUB + STACK.RINGS * DISH.RING, i * STEP);
    return `M${ax} ${ay}L${bx} ${by}`;
  });
}

// The next piece, laid out flat for the little preview: cells as
// { x, y } in a grid with the top-left cell at 0, 0 (rings out are up).
export function flatCells(pal) {
  const cells = PIECES[pal].cells;
  const top = Math.max(...cells.map(([out]) => out));
  const left = Math.min(...cells.map(([, around]) => around));
  return cells.map(([out, around]) => ({ x: around - left, y: top - out }));
}
