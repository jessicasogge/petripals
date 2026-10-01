import { describe, expect, it } from 'vitest';
import { MAX_LOOK, MAX_TURN, headPose } from '../public/elia-looks.js';

describe("Elia's head", () => {
  it('stays facing forward for a pointer straight ahead', () => {
    const { turn, look } = headPose(100, 0);
    expect(turn).toBeCloseTo(0);
    expect(look[0]).toBeCloseTo(MAX_LOOK);
    expect(look[1]).toBeCloseTo(0);
  });

  it('turns up toward a pointer above her and down toward one below', () => {
    expect(headPose(100, -50).turn).toBeLessThan(0); // up is negative (y points down)
    expect(headPose(100, 50).turn).toBeGreaterThan(0);
    expect(headPose(100, -50).turn).toBeCloseTo(-headPose(100, 50).turn);
  });

  it('turns exactly toward a pointer within reach', () => {
    expect(headPose(100, 100).turn).toBeCloseTo(Math.min(45, MAX_TURN));
    expect(headPose(100, 36).turn).toBeCloseTo((Math.atan2(36, 100) * 180) / Math.PI);
  });

  it(`never turns more than ${MAX_TURN} degrees, even for a pointer behind or right above her`, () => {
    for (const [dx, dy] of [[0, -100], [0, 100], [-100, -10], [-100, 10], [-50, -200]]) {
      expect(Math.abs(headPose(dx, dy).turn)).toBeLessThanOrEqual(MAX_TURN);
    }
  });

  it('slides her eyes the rest of the way toward a pointer her head can\'t turn to', () => {
    // Straight above: the head turns up as far as it goes, and the eyes look
    // further up along the turned head (negative y in the head's frame).
    const { turn, look } = headPose(0, -100);
    expect(turn).toBe(-MAX_TURN);
    expect(look[1]).toBeLessThan(0);
  });

  it(`never slides her face more than ${MAX_LOOK} units`, () => {
    for (const [dx, dy] of [[300, 0], [-300, 40], [5, 5], [0, -500]]) {
      const [x, y] = headPose(dx, dy).look;
      expect(Math.hypot(x, y)).toBeLessThanOrEqual(MAX_LOOK + 1e-9);
    }
  });

  it('looks straight ahead when the pointer is right on her neck', () => {
    expect(headPose(0, 0)).toEqual({ turn: 0, look: [0, 0] });
  });
});
