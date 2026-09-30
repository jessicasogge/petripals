// @vitest-environment jsdom
// coccus.js draws cells into the page, so these tests run in jsdom, a
// simulated browser page.
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { R, SPACING } from '../public/game/attach.js';
import { coccusGroup } from '../public/game/coccus.js';
import { GAME, SPECIES } from '../public/game/config.js';

// jsdom doesn't lay anything out, so every width reads as 0. Give the dish a
// fixed size and work out each mover's width from its percent width, the way
// the browser would.
const DISH_WIDTH = 400;
const DISH_RADIUS = DISH_WIDTH / 2;
const CELL_PX = 0.06 * DISH_WIDTH; // CELL_SIZE is 6% of the dish
const UNIT = CELL_PX / (2 * R); // pixels per SVG unit

let saved;
beforeEach(() => {
  document.body.innerHTML = '<div class="agar"></div>';
  saved = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetWidth');
  Object.defineProperty(HTMLElement.prototype, 'offsetWidth', {
    configurable: true,
    get() {
      return ((parseFloat(this.style.width) || 0) / 100) * DISH_WIDTH;
    },
  });
});
afterEach(() => {
  if (saved) Object.defineProperty(HTMLElement.prototype, 'offsetWidth', saved);
  else delete HTMLElement.prototype.offsetWidth;
});

// A group in the dish at (x, y) px from the center, like the game makes.
function makeGroup(name, { isPlayer = false, x = 0, y = 0 } = {}) {
  const mover = document.createElement('div');
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  mover.appendChild(svg);
  document.querySelector('.agar').appendChild(mover);
  const group = coccusGroup({ mover, svg, species: SPECIES[name], isPlayer });
  group.x = x;
  group.y = y;
  return group;
}

// Grow an offspring group to `size` cells by dividing a player next to it.
function grow(group, size) {
  const player = makeGroup('goldie', { isPlayer: true, x: group.x, y: group.y });
  while (group.cellCount() < size) {
    player.divide([group], DISH_RADIUS);
    group.update(1); // finish sliding the new cell into place
  }
}

const cellCenters = (group) => group.body().map(([x, y]) => [x, y]);
const distance = ([ax, ay], [bx, by]) => Math.hypot(ax - bx, ay - by);

describe('a new coccus', () => {
  it('starts as a single cell', () => {
    const player = makeGroup('scarlett', { isPlayer: true });
    expect(player.cellCount()).toBe(1);
  });

  it('only the player has a face', () => {
    const player = makeGroup('goldie', { isPlayer: true });
    const offspring = makeGroup('goldie');
    expect(player.svg.querySelectorAll('ellipse')).toHaveLength(2); // cheeks
    expect(offspring.svg.querySelectorAll('ellipse')).toHaveLength(0);
  });

  it('draws in its species colors', () => {
    const scarlett = makeGroup('scarlett');
    expect(scarlett.svg.querySelector('circle').getAttribute('fill'))
      .toBe(SPECIES.scarlett.colors.fill);
  });

  it('has a body of one circle, one cell wide, where the group is', () => {
    const group = makeGroup('goldie', { x: 30, y: -40 });
    const [[x, y, r]] = group.body();
    expect(x).toBeCloseTo(30);
    expect(y).toBeCloseTo(-40);
    expect(r).toBeCloseTo(CELL_PX / 2);
  });
});

describe('dividing with no group nearby', () => {
  it('starts a new offspring group where the player is', () => {
    const player = makeGroup('goldie', { isPlayer: true, x: 20, y: 10 });
    const child = player.divide([], DISH_RADIUS);
    expect(child).not.toBeNull();
    expect(child.isPlayer).toBe(false);
    expect(child.cellCount()).toBe(1);
    expect([child.x, child.y]).toEqual([20, 10]);
  });

  it('sends the new group off with a push', () => {
    const player = makeGroup('scarlett', { isPlayer: true });
    const child = player.divide([], DISH_RADIUS);
    expect(Math.hypot(child.vx, child.vy)).toBeCloseTo(GAME.BURST_SPEED * DISH_RADIUS * 0.5);
  });

  it('adds the new group to the dish as a faceless, hidden-from-screen-readers copy', () => {
    const player = makeGroup('goldie', { isPlayer: true });
    const child = player.divide([], DISH_RADIUS);
    expect(child.mover.parentElement).toBe(document.querySelector('.agar'));
    expect(child.mover.classList.contains('offspring')).toBe(true);
    expect(child.svg.getAttribute('aria-hidden')).toBe('true');
    expect(child.svg.querySelectorAll('ellipse')).toHaveLength(0);
  });

  it('leaves the player a single cell', () => {
    const player = makeGroup('goldie', { isPlayer: true });
    player.divide([], DISH_RADIUS);
    expect(player.cellCount()).toBe(1);
  });
});

describe('dividing next to a group', () => {
  it('adds the daughter to the group instead of starting a new one', () => {
    const group = makeGroup('scarlett', { x: 30 });
    const player = makeGroup('scarlett', { isPlayer: true, x: 50 });
    expect(player.divide([group], DISH_RADIUS)).toBeNull();
    expect(group.cellCount()).toBe(2);
  });

  it('slides the new cell from the player into place, touching its neighbor', () => {
    const group = makeGroup('scarlett', { x: 0 });
    const player = makeGroup('scarlett', { isPlayer: true, x: 50 });
    player.divide([group], DISH_RADIUS);

    // It starts where the player is...
    group.update(0);
    expect(cellCenters(group)[1][0]).toBeCloseTo(50);

    // ...and ends up touching the first cell, on the player's side.
    group.update(GAME.DIVIDE_MS / 1000);
    const [first, second] = cellCenters(group);
    expect(distance(first, second)).toBeCloseTo(SPACING * UNIT);
    expect(second[0]).toBeGreaterThan(first[0]);
  });

  it('starts a new group if the nearest one is out of reach', () => {
    const group = makeGroup('goldie', { x: 0 });
    const player = makeGroup('goldie', { isPlayer: true, x: GAME.SNAP_REACH * DISH_RADIUS + 40 });
    expect(player.divide([group], DISH_RADIUS)).not.toBeNull();
    expect(group.cellCount()).toBe(1);
  });

  it('joins whichever group is nearest', () => {
    const near = makeGroup('goldie', { x: 20 });
    const far = makeGroup('goldie', { x: -45 });
    const player = makeGroup('goldie', { isPlayer: true, x: 0 });
    player.divide([far, near], DISH_RADIUS);
    expect(near.cellCount()).toBe(2);
    expect(far.cellCount()).toBe(1);
  });

  it(`stops growing a group at ${GAME.GROUP_CAP} cells`, () => {
    const group = makeGroup('goldie');
    grow(group, GAME.GROUP_CAP);
    const player = makeGroup('goldie', { isPlayer: true, x: 5 });
    expect(group.attachSpot(5, 0, [], DISH_RADIUS)).toBeNull();
    expect(player.divide([group], DISH_RADIUS)).not.toBeNull();
    expect(group.cellCount()).toBe(GAME.GROUP_CAP);
  });

  it('never lets two cells in a grown cluster sit on top of each other', () => {
    const group = makeGroup('goldie');
    grow(group, GAME.GROUP_CAP);
    const centers = cellCenters(group);
    for (let i = 0; i < centers.length; i++) {
      for (let j = i + 1; j < centers.length; j++) {
        expect(distance(centers[i], centers[j])).toBeGreaterThan(R * UNIT);
      }
    }
  });

  it('grows a chain end to end', () => {
    const group = makeGroup('scarlett');
    const player = makeGroup('scarlett', { isPlayer: true });
    for (let i = 0; i < 4; i++) {
      player.x = 40 + i * SPACING * UNIT; // swim along to the right
      player.divide([group], DISH_RADIUS);
      group.update(1);
    }
    const xs = cellCenters(group).map(([x]) => x);
    for (let i = 1; i < xs.length; i++) expect(xs[i]).toBeGreaterThan(xs[i - 1]);
  });

  it('works out the right spot when the group is flipped to face left', () => {
    const group = makeGroup('scarlett', { x: 0 });
    group.facing = -1;
    const spot = group.attachSpot(50, 0, [], DISH_RADIUS);
    expect(spot.world[0]).toBeGreaterThan(0); // still on the player's side
    expect(distance(spot.world, [0, 0])).toBeCloseTo(SPACING * UNIT);
  });
});

describe('an offspring cell dividing', () => {
  it('adds the daughter to its own group, next to the cell that divided', () => {
    const group = makeGroup('goldie');
    grow(group, 3);
    const before = cellCenters(group);
    const [cx, cy] = before[2];
    expect(group.divide([group], DISH_RADIUS, [], [cx, cy])).toBeNull();
    expect(group.cellCount()).toBe(4);
    group.update(1);
    const newest = cellCenters(group).find((c) => before.every((b) => distance(b, c) > 0.01));
    expect(distance(newest, [cx, cy])).toBeLessThan(2 * SPACING * UNIT);
  });

  it('starts the daughter sliding in from the cell that divided', () => {
    const group = makeGroup('scarlett');
    grow(group, 2);
    const [ex, ey] = group.body()[1];
    group.divide([group], DISH_RADIUS, [], [ex, ey]);
    group.update(0);
    const centers = cellCenters(group);
    // The new cell starts on top of the cell that divided...
    expect(centers.some(([x, y]) => distance([x, y], [ex, ey]) < 0.01 &&
      centers.filter((c) => distance(c, [ex, ey]) < 0.01).length === 2)).toBe(true);
    // ...and ends up touching the end of the chain.
    group.update(1);
    const after = cellCenters(group);
    const ends = [after[0], after[after.length - 1]];
    expect(ends.some((end) => Math.abs(distance(end, [ex, ey]) - SPACING * UNIT) < 0.01)).toBe(true);
  });

  it('starts a new group at the cell that divided when its own group is full', () => {
    const group = makeGroup('goldie');
    grow(group, GAME.GROUP_CAP);
    const [cx, cy] = group.body()[0];
    const child = group.divide([group], DISH_RADIUS, [], [cx, cy]);
    expect(child).not.toBeNull();
    expect([child.x, child.y]).toEqual([cx, cy]);
    expect(child.isPlayer).toBe(false);
    expect(group.cellCount()).toBe(GAME.GROUP_CAP);
  });
});

describe('antibiotic disks', () => {
  // A disk to the right of a cell at the center, as the game stores it
  // (fractions of the dish radius). The usual spot for a new cell on that
  // side is just clear of the disk itself but inside its buffer, so the
  // buffer is the only thing keeping a cell out of it.
  const diskRight = { fx: 0.255, fy: 0, r: GAME.DISK_RADIUS };

  it('never attaches a new cell on or right next to a disk', () => {
    // A one-cell chain only grows toward the player, and here that spot is
    // clear of the disk itself but inside its buffer, so there's no room.
    const group = makeGroup('scarlett');
    expect(group.attachSpot(50, 0, [diskRight], DISH_RADIUS)).toBeNull();
    // Away from the disk, it grows fine.
    expect(group.attachSpot(-50, 0, [diskRight], DISH_RADIUS)).not.toBeNull();
  });

  it('keeps every cell it does attach clear of the disk and its buffer', () => {
    const reach = (diskRight.r + GAME.DISK_BUFFER) * DISH_RADIUS + CELL_PX / 2;
    const diskCenter = [diskRight.fx * DISH_RADIUS, 0];
    for (let angle = 0; angle < 6.28; angle += 0.4) {
      const group = makeGroup('goldie');
      grow(group, 3);
      const spot = group.attachSpot(Math.cos(angle) * 50, Math.sin(angle) * 50, [diskRight], DISH_RADIUS);
      if (spot) expect(distance(spot.world, diskCenter)).toBeGreaterThanOrEqual(reach);
    }
  });

  it('starts a new group instead when the only spots are on a disk', () => {
    const group = makeGroup('goldie');
    const player = makeGroup('goldie', { isPlayer: true, x: 20 });
    const covering = { fx: 0, fy: 0, r: 0.5 };
    expect(group.attachSpot(20, 0, [covering], DISH_RADIUS)).toBeNull();
    expect(player.divide([group], DISH_RADIUS, [covering])).not.toBeNull();
    expect(group.cellCount()).toBe(1);
  });
});
