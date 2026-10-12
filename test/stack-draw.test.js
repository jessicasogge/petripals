// Where Colony Stack's cells are drawn on the round dish.
import { describe, expect, it } from 'vitest';
import { STACK } from '../public/game/stack-board.js';
import { DISH, cellCenter, cellPath, dishTurn, flatCells, guideCircles, guideSpokes } from '../public/game/stack-draw.js';

const middle = DISH.SIZE / 2;

describe('the dish', () => {
  it('fits every ring inside the rim', () => {
    expect(DISH.HUB + STACK.RINGS * DISH.RING).toBeLessThan(middle - 5);
  });
});

describe('cellCenter', () => {
  it('puts sector 0 just clockwise of the top', () => {
    const { x, y } = cellCenter(0, 0);
    expect(x).toBeGreaterThan(middle);
    expect(y).toBeLessThan(middle);
  });

  it('puts outer rings further out, with more room around', () => {
    const inner = cellCenter(0, 4);
    const outer = cellCenter(STACK.RINGS - 1, 4);
    expect(Math.hypot(outer.x - middle, outer.y - middle)).toBeGreaterThan(Math.hypot(inner.x - middle, inner.y - middle));
    expect(outer.across).toBeGreaterThan(inner.across);
  });
});

describe('cellPath', () => {
  it('draws a round cell as a circle in the middle of its spot', () => {
    const { x, y } = cellCenter(2, 3);
    const path = cellPath(2, 3, true);
    expect(path).toMatch(/^M[\d.]+ [\d.]+ a/);
    expect(path).toContain(` ${y} `);
    const [, left, r] = path.match(/^M([\d.]+) [\d.]+ a([\d.]+)/).map(Number);
    expect(left + r).toBeCloseTo(x, 0);
  });

  it('draws a rod as a curved block filling its spot', () => {
    expect(cellPath(2, 3, false)).toMatch(/^M.*A.*L.*A.*Z$/);
  });
});

describe('dishTurn', () => {
  it('turns the sector to the top, a little more for each sector', () => {
    const step = 360 / STACK.SECTORS;
    expect(dishTurn(0)).toBeCloseTo(-step / 2);
    expect(dishTurn(1) - dishTurn(0)).toBeCloseTo(-step);
    expect(dishTurn(STACK.SECTORS)).toBeCloseTo(-360 - step / 2);
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
