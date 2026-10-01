import { describe, expect, it } from 'vitest';
import { GAME, MIXED } from '../public/game/config.js';
import { chooseTarget, rivalBrain } from '../public/game/rival.js';

const flecks = [{ fx: 0.5, fy: 0 }, { fx: 0.1, fy: 0 }, { fx: -0.3, fy: 0 }];

describe('chooseTarget', () => {
  it('usually goes for the nearest nutrient', () => {
    expect(chooseTarget(0, 0, flecks, () => 0.9)).toEqual({ fx: 0.1, fy: 0 });
  });

  it('now and then goes for the second nearest, so it isn\'t perfect', () => {
    expect(chooseTarget(0, 0, flecks, () => 0.1)).toEqual({ fx: -0.3, fy: 0 });
  });

  it('takes the only one there is', () => {
    expect(chooseTarget(0, 0, [{ fx: 0.4, fy: 0.4 }], () => 0.1)).toEqual({ fx: 0.4, fy: 0.4 });
  });

  it('has nothing to go after on an empty plate', () => {
    expect(chooseTarget(0, 0, [], () => 0.5)).toBeNull();
  });
});

describe('rivalBrain', () => {
  const radius = 200;
  const plate = (list) => ({ positions: () => list });
  const steady = () => 0.5; // no weaving, always the nearest

  it('swims toward the nutrient it picked, at the rival\'s speed', () => {
    const leader = { x: 0, y: 0, facing: 1 };
    const brain = rivalBrain(leader, plate([{ fx: -0.5, fy: 0 }]), steady);
    brain.step(0.1, radius);
    expect(leader.x).toBeCloseTo(-MIXED.RIVAL_SPEED * radius * 0.1);
    expect(leader.y).toBeCloseTo(0);
    expect(leader.facing).toBe(-1); // turned to face it
  });

  it('is slower than you', () => {
    expect(MIXED.RIVAL_SPEED).toBeLessThan(GAME.SPEED);
  });

  it('stays put when there\'s nothing to eat', () => {
    const leader = { x: 10, y: 20, facing: 1 };
    rivalBrain(leader, plate([]), steady).step(0.1, radius);
    expect([leader.x, leader.y]).toEqual([10, 20]);
  });

  it('only looks around for a new nutrient every so often', () => {
    const list = [{ fx: 0.5, fy: 0 }];
    const leader = { x: 0, y: 0, facing: 1 };
    const brain = rivalBrain(leader, plate(list), steady);
    brain.step(0.01, radius); // picks the one to the right
    list[0] = { fx: -0.5, fy: 0 }; // a new one appears on the left instead
    brain.step(0.01, radius);
    expect(leader.x).toBeGreaterThan(0); // still heading right...
    const steps = Math.ceil(MIXED.RIVAL_REACT_MS / 10) + 1;
    for (let i = 0; i < steps; i++) brain.step(0.01, radius); // ...until it looks again
    expect(leader.facing).toBe(-1);
  });

  it('weaves a little but never by more than its limit', () => {
    let seed = 1;
    const random = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    const leader = { x: 0, y: 0, facing: 1 };
    const brain = rivalBrain(leader, plate([{ fx: 0.9, fy: 0 }]), random);
    for (let i = 0; i < 200; i++) {
      const before = [leader.x, leader.y];
      brain.step(0.016, radius);
      const heading = Math.atan2(leader.y - before[1], leader.x - before[0]);
      expect(Math.abs(heading)).toBeLessThanOrEqual(MIXED.RIVAL_WANDER + 1e-9);
      leader.x = 0; // keep it from arriving
      leader.y = 0;
    }
  });
});
