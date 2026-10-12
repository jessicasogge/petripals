// Where Colony Stack's cells are drawn on the round dish, and which spot a
// finger is over.
import { describe, expect, it } from 'vitest';
import { STACK } from '../public/game/stack-board.js';
import {
  COCCUS, DISH, ROD, cellShape, flatCells, guideCircles, guideSpokes, sectorAt, spotCenter, spotPath, stepsBetween,
} from '../public/game/stack-draw.js';

const middle = DISH.SIZE / 2;
const fromMiddle = ({ x, y }) => Math.hypot(x - middle, y - middle);

describe('the dish', () => {
  it('fits every ring inside the rim', () => {
    expect(DISH.HUB + STACK.RINGS * DISH.RING).toBeLessThan(middle - 5);
  });

  it('has room for a whole cell in every spot, even by the food', () => {
    const across = (DISH.HUB + DISH.RING / 2) * ((2 * Math.PI) / STACK.SECTORS);
    expect(ROD.LONG).toBeLessThan(across);
    expect(Math.max(COCCUS, ROD.WIDE)).toBeLessThan(DISH.RING);
  });
});

describe('spotCenter', () => {
  it('puts sector 0 just clockwise of the top, lying left to right', () => {
    const { x, y, along } = spotCenter(0, 0);
    expect(x).toBeGreaterThan(middle);
    expect(y).toBeLessThan(middle);
    expect(along).toBeCloseTo(180 / STACK.SECTORS, 0);
  });

  it('puts outer rings further out', () => {
    expect(fromMiddle(spotCenter(STACK.RINGS - 1, 4))).toBeGreaterThan(fromMiddle(spotCenter(0, 4)));
  });
});

describe('spotPath', () => {
  it('is a curved patch: an arc out, a line in, an arc back', () => {
    expect(spotPath(2, 3)).toMatch(/^M.*A.*L.*A.*Z$/);
  });
});

describe('cellShape', () => {
  it('draws a coccus as a circle in the middle of her spot', () => {
    const { x, y } = spotCenter(2, 3);
    expect(cellShape(2, 3, true)).toEqual({ tag: 'circle', attrs: { cx: x, cy: y, r: COCCUS / 2 } });
  });

  it('draws a rod as a capsule lying along the ring, the same size anywhere', () => {
    const inner = cellShape(0, 3, false);
    const outer = cellShape(STACK.RINGS - 1, 5, false);
    expect(inner.tag).toBe('rect');
    expect(inner.attrs.width).toBe(ROD.LONG);
    expect(outer.attrs.width).toBe(ROD.LONG);
    const { x, y, along } = spotCenter(0, 3);
    expect(inner.attrs.transform).toBe(`translate(${x} ${y}) rotate(${along})`);
  });
});

describe('sectorAt', () => {
  const quarter = STACK.SECTORS / 4;

  it('finds the sector under a point, clockwise from the top', () => {
    expect(sectorAt(middle + 1, 10)).toBe(0);
    expect(sectorAt(DISH.SIZE - 10, middle + 1)).toBe(quarter);
    expect(sectorAt(middle - 1, DISH.SIZE - 10)).toBe(2 * quarter);
    expect(sectorAt(10, middle - 1)).toBe(3 * quarter);
    expect(sectorAt(middle - 1, 10)).toBe(STACK.SECTORS - 1);
  });
});

describe('stepsBetween', () => {
  it('goes the short way round', () => {
    expect(stepsBetween(0, 2)).toBe(2);
    expect(stepsBetween(2, 0)).toBe(-2);
    expect(stepsBetween(1, STACK.SECTORS - 1)).toBe(-2);
    expect(stepsBetween(STACK.SECTORS - 1, 1)).toBe(2);
  });

  it('copes with pieces that have gone round more than once', () => {
    expect(stepsBetween(-1, 1)).toBe(2);
    expect(stepsBetween(STACK.SECTORS * 3, 0)).toBe(0);
  });
});

describe('the guides', () => {
  it('has a circle at every ring edge and a line between every sector', () => {
    expect(guideCircles()).toHaveLength(STACK.RINGS + 1);
    expect(guideSpokes()).toHaveLength(STACK.SECTORS);
  });
});

describe('flatCells', () => {
  it('lays a piece out flat from the top left, outer rings up', () => {
    expect(flatCells('nova')).toEqual([{ x: 0, y: 0 }, { x: 0, y: 1 }, { x: 0, y: 2 }, { x: 1, y: 2 }]);
    expect(flatCells('scarlett')).toEqual([{ x: 1, y: 0 }, { x: 0, y: 0 }, { x: 2, y: 0 }, { x: 3, y: 0 }]);
  });
});
