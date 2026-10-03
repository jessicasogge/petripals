import { describe, expect, it } from 'vitest';
import { GAME } from '../public/game/config.js';
import { coaster, keepInDish, pushApart, pushInsideRim } from '../public/game/physics.js';

// keepInDish only reads the dish's width, so a plain object stands in for it.
// This dish has a radius of 200px.
const dish = { clientWidth: 400 };

// A group as the physics code sees it. `age` is in seconds; offspring count as
// settling until they are GAME.SETTLE_MS old.
const group = (x, y, extra = {}) => ({ x, y, vx: 0, vy: 0, size: 20, age: 0, ...extra });
const settled = (x, y) => group(x, y, { age: GAME.SETTLE_MS / 1000 + 1 });

describe('keepInDish', () => {
  it('leaves a group alone when it is fully inside', () => {
    expect(keepInDish(dish, 50, -30, 20)).toEqual([50, -30]);
  });

  it('allows a group to touch the rim exactly', () => {
    expect(keepInDish(dish, 180, 0, 20)).toEqual([180, 0]);
  });

  it('pulls a group back inside along the same direction', () => {
    const [x, y] = keepInDish(dish, 300, 400, 20); // 500px out, direction 3:4
    expect(Math.hypot(x, y)).toBeCloseTo(180); // 200 radius minus 20 reach
    expect(x / y).toBeCloseTo(300 / 400);
  });

  it('uses the group size, so bigger groups stop farther from the rim', () => {
    const [x] = keepInDish(dish, 500, 0, 60);
    expect(x).toBeCloseTo(140);
  });

  it('pins something wider than the dish to the middle', () => {
    expect(keepInDish(dish, 50, 0, 300)).toEqual([0, 0]);
  });

  it('bounces an offspring that was moving out through the rim', () => {
    const g = group(0, 0, { vx: 100, vy: 0 });
    keepInDish(dish, 250, 0, 20, g);
    expect(g.vx).toBeCloseTo(-100);
    expect(g.vy).toBeCloseTo(0);
  });

  it('keeps the along-the-rim part of the motion when bouncing', () => {
    const g = group(0, 0, { vx: 100, vy: 50 });
    keepInDish(dish, 250, 0, 20, g); // rim is to the right, so only vx flips
    expect(g.vx).toBeCloseTo(-100);
    expect(g.vy).toBeCloseTo(50);
  });

  it('does not bounce an offspring already heading back inward', () => {
    const g = group(0, 0, { vx: -40, vy: 10 });
    keepInDish(dish, 250, 0, 20, g);
    expect(g.vx).toBe(-40);
    expect(g.vy).toBe(10);
  });

  it('never bounces the player', () => {
    const player = group(0, 0, { vx: 100, isPlayer: true });
    keepInDish(dish, 250, 0, 20, player);
    expect(player.vx).toBe(100);
  });
});

describe('pushApart', () => {
  it('nudges two overlapping settling groups apart equally', () => {
    const a = group(0, 0);
    const b = group(10, 0);
    pushApart([a, b], null);
    expect(a.x).toBeLessThan(0);
    expect(b.x).toBeGreaterThan(10);
    expect(a.x + b.x).toBeCloseTo(10); // they moved the same amount
    expect(a.y).toBe(0);
    expect(b.y).toBe(0);
  });

  it('moves at most 3px per step so settling looks smooth', () => {
    const a = group(0, 0);
    const b = group(1, 0);
    pushApart([a, b], null);
    expect(b.x - a.x).toBeCloseTo(1 + 3);
  });

  it('only moves the settling group when the other has settled', () => {
    const still = settled(0, 0);
    const moving = group(10, 0);
    pushApart([still, moving], null);
    expect(still.x).toBe(0);
    expect(moving.x).toBeGreaterThan(10);
  });

  it('leaves two settled groups where they are, even if they overlap', () => {
    const a = settled(0, 0);
    const b = settled(5, 0);
    pushApart([a, b], null);
    expect([a.x, b.x]).toEqual([0, 5]);
  });

  it('never moves the player, and never pushes offspring off the player', () => {
    const player = group(0, 0);
    const offspring = group(5, 0);
    pushApart([player, offspring], player);
    expect([player.x, player.y]).toEqual([0, 0]);
    expect([offspring.x, offspring.y]).toEqual([5, 0]);
  });

  it('lets new cells overlap a fair bit before nudging them apart', () => {
    // Combined reach 40px: they're only nudged closer than SPACING * 40.
    const close = [group(0, 0), group(40 * GAME.SPACING - 1, 0)];
    pushApart(close, null);
    expect(close[1].x - close[0].x).toBeGreaterThan(40 * GAME.SPACING - 1);
    const overlapping = [group(0, 0), group(40 * GAME.SPACING + 1, 0)];
    pushApart(overlapping, null);
    expect([overlapping[0].x, overlapping[1].x]).toEqual([0, 40 * GAME.SPACING + 1]);
    expect(GAME.SPACING).toBeLessThanOrEqual(0.5);
  });

  it('leaves groups that are not overlapping alone', () => {
    const a = group(0, 0);
    const b = group(100, 0);
    pushApart([a, b], null);
    expect([a.x, b.x]).toEqual([0, 100]);
  });

  it('does not produce broken positions for two groups on the exact same spot', () => {
    const a = group(7, 7);
    const b = group(7, 7);
    pushApart([a, b], null);
    for (const value of [a.x, a.y, b.x, b.y]) expect(Number.isFinite(value)).toBe(true);
  });
});

describe('coaster', () => {
  it('starts a new group at age 0 and ages it as time passes', () => {
    const g = group(0, 0, { age: 99 });
    const coast = coaster(g);
    expect(g.age).toBe(0);
    coast(0.25);
    coast(0.25);
    expect(g.age).toBeCloseTo(0.5);
  });

  it('slows a moving group down smoothly', () => {
    const g = group(0, 0, { vx: 100 });
    const coast = coaster(g);
    coast(0.1);
    expect(g.vx).toBeCloseTo(100 * Math.exp(-GAME.SETTLE_RATE * 0.1));
    expect(g.x).toBeCloseTo(g.vx * 0.1);
  });

  it('keeps the direction of travel while slowing down', () => {
    const g = group(0, 0, { vx: 30, vy: -40 });
    coaster(g)(0.2);
    expect(g.vy / g.vx).toBeCloseTo(-40 / 30);
  });

  it('comes to a complete stop instead of creeping forever', () => {
    const g = group(0, 0, { vx: 300, vy: 0 });
    const coast = coaster(g);
    for (let i = 0; i < 120; i++) coast(1 / 60); // two seconds at 60fps
    expect(g.vx).toBe(0);
    expect(g.vy).toBe(0);
    const restingX = g.x;
    coast(1 / 60);
    expect(g.x).toBe(restingX);
  });

  it('slides a short, predictable distance before stopping', () => {
    // Slowing at SETTLE_RATE, a group starting at speed v travels about
    // v / SETTLE_RATE before it stops.
    const g = group(0, 0, { vx: 200 });
    const coast = coaster(g);
    for (let i = 0; i < 600; i++) coast(1 / 600);
    expect(g.x).toBeGreaterThan(200 / GAME.SETTLE_RATE * 0.9);
    expect(g.x).toBeLessThan(200 / GAME.SETTLE_RATE * 1.05);
  });
});

describe('pushInsideRim', () => {
  const R = 200;

  it('leaves a body that is already inside alone', () => {
    expect(pushInsideRim([[0, 0, 10], [150, 0, 10]], R)).toEqual([0, 0]);
  });

  it('pulls a cell poking out back in, straight toward the center', () => {
    const [dx, dy] = pushInsideRim([[195, 0, 10]], R);
    expect(dx).toBeCloseTo(-5);
    expect(dy).toBeCloseTo(0);
  });

  it("doesn't pull in a long chain lying along the rim just because it's long", () => {
    // Eight cells in a gentle arc just inside the rim: a long group, but every
    // cell is inside, so nothing moves.
    const chain = [];
    for (let i = 0; i < 8; i++) {
      const a = i * 0.11;
      chain.push([Math.cos(a) * 175, Math.sin(a) * 175, 10]);
    }
    expect(pushInsideRim(chain, R)).toEqual([0, 0]);
  });

  it('only moves a chain as far as its one stray cell needs', () => {
    const chain = [[100, 0, 10], [120, 0, 10], [140, 0, 10], [160, 0, 10], [185, 0, 10], [195, 0, 10]];
    const [dx, dy] = pushInsideRim(chain, R);
    expect(dx).toBeCloseTo(-5);
    expect(dy).toBeCloseTo(0);
  });

  it('ends with every cell inside, even with several sticking out in different places', () => {
    const body = [[195, 30, 10], [150, 140, 12], [-10, 196, 8]];
    const [dx, dy] = pushInsideRim(body, R);
    for (const [x, y, r] of body) expect(Math.hypot(x + dx, y + dy) + r).toBeLessThanOrEqual(R + 1e-6);
  });
});
