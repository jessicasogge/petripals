import { describe, expect, it } from 'vitest';
import { chainSpot, clusterSpot, R, SPACING, wobble } from '../public/game/attach.js';

const cell = (x, y) => ({ x, y });
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

// Grow a cluster the way the game does: keep attaching a new cell at the spot
// clusterSpot picks, approaching from a series of different directions.
function growCluster(size, twist) {
  const cells = [cell(0, 0)];
  for (let i = 1; i < size; i++) {
    const angle = i * 2.4; // approach from a different side each time
    const spot = clusterSpot(cells, twist, Math.cos(angle) * 200, Math.sin(angle) * 200);
    cells.push(cell(spot.x, spot.y));
  }
  return cells;
}

describe('wobble', () => {
  it('gives the same value for the same inputs', () => {
    expect(wobble(3, 1)).toBe(wobble(3, 1));
  });

  it('stays between -1 and 1', () => {
    for (let k = 0; k < 50; k++) {
      for (let salt = 0; salt < 5; salt++) {
        expect(Math.abs(wobble(k, salt))).toBeLessThanOrEqual(1);
      }
    }
  });
});

describe('chainSpot', () => {
  it('puts the second cell touching the first, toward the player', () => {
    const spot = chainSpot([cell(0, 0)], 100, 0);
    expect(spot.x).toBeCloseTo(SPACING);
    expect(spot.y).toBeCloseTo(0);
    expect(spot.atStart).toBe(false);
  });

  it('points the second cell whichever way the player is', () => {
    const spot = chainSpot([cell(0, 0)], 0, -50);
    expect(spot.x).toBeCloseTo(0);
    expect(spot.y).toBeCloseTo(-SPACING);
  });

  it('still places the second cell touching the first when the player is right on top of it', () => {
    const only = cell(0, 0);
    const spot = chainSpot([only], 0, 0);
    expect(Number.isFinite(spot.x) && Number.isFinite(spot.y)).toBe(true);
    expect(distance(spot, only)).toBeCloseTo(SPACING);
  });

  it('grows from the end nearer the player', () => {
    const chain = [cell(0, 0), cell(SPACING, 0), cell(2 * SPACING, 0)];

    const right = chainSpot(chain, 500, 0);
    expect(right.atStart).toBe(false);
    expect(right.x).toBeGreaterThan(2 * SPACING);

    const left = chainSpot(chain, -500, 0);
    expect(left.atStart).toBe(true);
    expect(left.x).toBeLessThan(0);
  });

  it('adds the new cell touching the end it grows from', () => {
    const chain = [cell(0, 0), cell(SPACING, 0), cell(2 * SPACING, 0)];
    expect(distance(chainSpot(chain, 500, 0), chain[2])).toBeCloseTo(SPACING);
    expect(distance(chainSpot(chain, -500, 0), chain[0])).toBeCloseTo(SPACING);
  });

  it('only bends the chain gently at each new cell', () => {
    const chain = [cell(0, 0), cell(SPACING, 0)];
    const spot = chainSpot(chain, 500, 0);
    const bend = Math.atan2(spot.y - chain[1].y, spot.x - chain[1].x);
    expect(Math.abs(bend)).toBeLessThanOrEqual(0.35 + 1e-9);
  });

  it('reports how far the spot is from the player', () => {
    const spot = chainSpot([cell(0, 0), cell(SPACING, 0)], 60, 40);
    expect(spot.distance).toBeCloseTo(Math.hypot(spot.x - 60, spot.y - 40));
  });

  it('skips an end that is ruled out and grows from the other one', () => {
    const chain = [cell(0, 0), cell(SPACING, 0), cell(2 * SPACING, 0)];
    const noRightSide = (x) => x < 2 * SPACING; // e.g. an antibiotic disk to the right
    const spot = chainSpot(chain, 500, 0, noRightSide);
    expect(spot.atStart).toBe(true);
    expect(spot.x).toBeLessThan(0);
  });

  it('returns null when every spot is ruled out', () => {
    expect(chainSpot([cell(0, 0)], 50, 0, () => false)).toBeNull();
    expect(chainSpot([cell(0, 0), cell(SPACING, 0)], 50, 0, () => false)).toBeNull();
  });

  it('does not change the cells it is given', () => {
    const chain = [cell(0, 0), cell(SPACING, 0)];
    const before = JSON.stringify(chain);
    chainSpot(chain, 100, 20);
    expect(JSON.stringify(chain)).toBe(before);
  });
});

describe('clusterSpot', () => {
  it('returns nothing for an empty cluster', () => {
    expect(clusterSpot([], 0, 10, 10)).toBeNull();
  });

  it('puts the new cell touching a lone cell', () => {
    const only = cell(0, 0);
    const spot = clusterSpot([only], 0, 100, 0);
    expect(distance(spot, only)).toBeCloseTo(SPACING * 0.95);
  });

  it('grows on the side facing the player', () => {
    expect(clusterSpot([cell(0, 0)], 0, 100, 0).x).toBeGreaterThan(0);
    expect(clusterSpot([cell(0, 0)], 0, -100, 0).x).toBeLessThan(0);
    expect(clusterSpot([cell(0, 0)], 0, 0, 100).y).toBeGreaterThan(0);
    expect(clusterSpot([cell(0, 0)], 0, 0, -100).y).toBeLessThan(0);
  });

  it('tucks a new cell into a nook touching two cells instead of sticking out', () => {
    const pair = [cell(0, 0), cell(SPACING * 0.95, 0)];
    const spot = clusterSpot(pair, 0, SPACING / 2, -300);
    expect(distance(spot, pair[0])).toBeLessThan(SPACING * 1.15);
    expect(distance(spot, pair[1])).toBeLessThan(SPACING * 1.15);
  });

  it('never places a cell on top of another as a cluster grows to 8', () => {
    for (const twist of [0, 0.7, 1.9, 3.3, 5.1]) {
      const cells = growCluster(8, twist);
      for (let i = 0; i < cells.length; i++) {
        for (let j = i + 1; j < cells.length; j++) {
          expect(distance(cells[i], cells[j])).toBeGreaterThanOrEqual(R * 1.5);
        }
      }
    }
  });

  it('keeps a grown cluster bunched up rather than strung out', () => {
    const cells = growCluster(8, 0.7);
    // Every cell touches at least one other.
    for (const c of cells) {
      const neighbors = cells.filter((o) => o !== c && distance(o, c) < SPACING * 1.15);
      expect(neighbors.length).toBeGreaterThan(0);
    }
    // And the whole bunch fits well inside the length of an 8-cell chain.
    const widest = Math.max(...cells.flatMap((a) => cells.map((b) => distance(a, b))));
    expect(widest).toBeLessThan(7 * SPACING * 0.6);
  });

  it('never picks a spot that is ruled out', () => {
    const notBelow = (x, y) => y <= 0; // e.g. an antibiotic disk below
    const cells = growCluster(5, 0.7);
    for (let angle = 0; angle < 6.28; angle += 0.5) {
      const spot = clusterSpot(cells, 0.7, Math.cos(angle) * 200, Math.sin(angle) * 200, notBelow);
      expect(spot.y).toBeLessThanOrEqual(0);
    }
  });

  it('returns null when every spot is ruled out', () => {
    expect(clusterSpot([cell(0, 0)], 0, 10, 10, () => false)).toBeNull();
  });

  it('does not change the cells it is given', () => {
    const cells = [cell(0, 0), cell(SPACING, 0)];
    const before = JSON.stringify(cells);
    clusterSpot(cells, 1.2, 50, 50);
    expect(JSON.stringify(cells)).toBe(before);
  });
});
