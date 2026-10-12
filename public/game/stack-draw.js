// Where Colony Stack's cells go on the round dish, as SVG drawing commands.
// Plain math with no page access, so it can be tested on its own.
import { PIECES, STACK } from './stack-board.js';

// In SVG units: the dish is SIZE across, the first ring starts HUB out from
// the middle (the food is inside that), and each ring is RING thick.
export const DISH = { SIZE: 362, HUB: 32, RING: 15 };
const CENTER = DISH.SIZE / 2;
const STEP = (2 * Math.PI) / STACK.SECTORS; // one sector, in radians
const GAP = 1.5; // between neighboring cells

const num = (n) => +n.toFixed(1);
// The point `r` from the center at angle `a` (0 is straight up, clockwise).
const point = (r, a) => [num(CENTER + r * Math.sin(a)), num(CENTER - r * Math.cos(a))];

// The middle of a cell, and how much room it has around the ring.
export function cellCenter(ring, sector) {
  const r = DISH.HUB + (ring + 0.5) * DISH.RING;
  const [x, y] = point(r, (sector + 0.5) * STEP);
  return { x, y, across: r * STEP };
}

// A cell's outline: a round cell (a coccus) sits in the middle of its spot,
// and a rod fills the whole curved spot.
export function cellPath(ring, sector, round) {
  if (round) {
    const { x, y, across } = cellCenter(ring, sector);
    const r = num(Math.min(DISH.RING, across) / 2 - GAP);
    return `M${num(x - r)} ${y} a${r} ${r} 0 1 0 ${num(2 * r)} 0 a${r} ${r} 0 1 0 ${num(-2 * r)} 0Z`;
  }
  const inner = DISH.HUB + ring * DISH.RING + GAP;
  const outer = inner + DISH.RING - 2 * GAP;
  const nudge = GAP / (inner + outer); // the same gap all the way along
  const from = sector * STEP + nudge;
  const to = (sector + 1) * STEP - nudge;
  const [ax, ay] = point(outer, from);
  const [bx, by] = point(outer, to);
  const [cx, cy] = point(inner, to);
  const [dx, dy] = point(inner, from);
  return `M${ax} ${ay}A${outer} ${outer} 0 0 1 ${bx} ${by}L${cx} ${cy}A${inner} ${inner} 0 0 0 ${dx} ${dy}Z`;
}

// How far to turn the dish, in degrees, so `sector` is at the top. The
// active piece always stays at the top and the dish turns under it. Not
// wrapped, so sliding from sector 15 to 16 turns a little, not all the way.
export const dishTurn = (sector) => -(sector + 0.5) * (360 / STACK.SECTORS);

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
