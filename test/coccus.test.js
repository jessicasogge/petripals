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
const CELL_PX = 0.05 * DISH_WIDTH; // CELL_SIZE is 5% of the dish
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

  it('has a body of one circle, one cell wide plus its outline, where the group is', () => {
    const group = makeGroup('goldie', { x: 30, y: -40 });
    const [[x, y, r]] = group.body();
    expect(x).toBeCloseTo(30);
    expect(y).toBeCloseTo(-40);
    const OUTLINE = 1.7;
    expect(r).toBeCloseTo((R + OUTLINE / 2) * UNIT);
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

describe('sliding a new cell into place', () => {
  // A group that has just had a cell join it from the player 50px away.
  function joining() {
    const group = makeGroup('scarlett');
    const player = makeGroup('scarlett', { isPlayer: true, x: 50 });
    player.divide([group], DISH_RADIUS);
    const cell = group.cells.find((c) => c.fromX !== c.toX || c.fromY !== c.toY);
    return { group, cell };
  }

  it('glides partway there midway through, fast at first and slowing as it arrives', () => {
    const { group, cell } = joining();
    const half = GAME.DIVIDE_MS / 2000; // half the slide, in seconds
    group.update(half);
    // Halfway through the time it's already 7/8 of the way (an ease-out).
    expect(cell.x).toBeCloseTo(cell.fromX + (cell.toX - cell.fromX) * 0.875);
    expect(cell.y).toBeCloseTo(cell.fromY + (cell.toY - cell.fromY) * 0.875);
    expect(group.moveFor).not.toBeNull(); // still sliding
  });

  it('adds up the time across frames, landing exactly in place and stopping', () => {
    const { group, cell } = joining();
    const frame = GAME.DIVIDE_MS / 1000 / 10;
    for (let i = 0; i < 9; i++) group.update(frame);
    expect(group.moveFor).not.toBeNull();
    group.update(frame * 2); // a slow last frame overshoots the time, not the spot
    expect([cell.x, cell.y]).toEqual([cell.toX, cell.toY]);
    expect(group.moveFor).toBeNull();
  });

  it("stops redrawing once everything is still, since that's slow with many cells", () => {
    const { group } = joining();
    group.update(1); // finish the slide
    group.svg.innerHTML = '<g class="marker" />'; // anything a redraw would replace
    group.update(1);
    expect(group.svg.querySelector('.marker')).not.toBeNull();
  });
});

describe('size and position', () => {
  it('reaches one cell\'s radius from its middle when it is a single cell', () => {
    expect(makeGroup('goldie').reach()).toBeCloseTo(R * UNIT);
  });

  it('reaches to the edge of its farthest cell as it grows', () => {
    const group = makeGroup('scarlett', { x: 40, y: -10 });
    grow(group, 5);
    const farthest = Math.max(...cellCenters(group).map((c) => distance(c, [40, -10])));
    expect(group.reach()).toBeCloseTo(farthest + R * UNIT);
    expect(group.reach()).toBeGreaterThan(R * UNIT);
  });

  it('is drawn where it is in the dish, flipped to face the way it is going', () => {
    const group = makeGroup('goldie', { x: -25, y: 60 });
    group.facing = -1;
    group.place();
    expect(group.mover.style.transform).toBe('translate(-25px, 60px) scaleX(-1)');
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
  // (fractions of the dish radius), with a zone of inhibition around it. The
  // usual spot for a new cell on that side is just clear of the disk itself
  // but inside its zone, so the zone is the only thing keeping a cell out.
  const ZONE = 0.045;
  const clearOfDisk = SPACING * UNIT + (GAME.DISK_RADIUS + ZONE / 2) * DISH_RADIUS + CELL_PX / 2;
  const diskRight = { fx: clearOfDisk / DISH_RADIUS, fy: 0, r: GAME.DISK_RADIUS, zone: ZONE };

  it('never attaches a new cell on or right next to a disk', () => {
    // A one-cell chain only grows toward the player, and here that spot is
    // clear of the disk itself but inside its zone, so there's no room.
    const group = makeGroup('scarlett');
    expect(group.attachSpot(50, 0, [diskRight], DISH_RADIUS)).toBeNull();
    // Away from the disk, it grows fine.
    expect(group.attachSpot(-50, 0, [diskRight], DISH_RADIUS)).not.toBeNull();
  });

  it('keeps every cell it does attach clear of the disk and its zone', () => {
    const reach = (diskRight.r + ZONE) * DISH_RADIUS + CELL_PX / 2;
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

describe('Penny (Streptococcus pneumoniae)', () => {
  it('grows in pairs: her chains stop at two cells', () => {
    const pair = makeGroup('penny', { x: 30 });
    const player = makeGroup('penny', { isPlayer: true, x: 50 });
    expect(player.divide([pair], DISH_RADIUS)).toBeNull(); // the first daughter joins
    pair.update(1);
    expect(pair.cellCount()).toBe(2);
    // The next daughter can't join the full pair, so it starts a new one.
    const next = player.divide([pair], DISH_RADIUS);
    expect(next).not.toBeNull();
    expect(pair.cellCount()).toBe(2);
    expect(next.cellCount()).toBe(1);
  });

  it('counts every cell, two to a pair', () => {
    const pair = makeGroup('penny');
    grow(pair, 2);
    expect(pair.cellCount()).toBe(2);
    expect(pair.body()).toHaveLength(2);
  });

  it('still lets Scarlett grow long chains', () => {
    const chain = makeGroup('scarlett');
    grow(chain, 5);
    expect(chain.cellCount()).toBe(5);
  });

  it('wears glasses on her face, and only she does', () => {
    expect(makeGroup('penny', { isPlayer: true }).svg.querySelector('.glasses')).not.toBeNull();
    // Her offspring have no face, so no glasses either.
    expect(makeGroup('penny').svg.querySelector('.glasses')).toBeNull();
    // The other round pals don't wear glasses.
    expect(makeGroup('scarlett', { isPlayer: true }).svg.querySelector('.glasses')).toBeNull();
    expect(makeGroup('goldie', { isPlayer: true }).svg.querySelector('.glasses')).toBeNull();
  });

  it('draws in her bluish-purple colors', () => {
    expect(makeGroup('penny').svg.querySelector('.cell-body').getAttribute('fill')).toBe(SPECIES.penny.colors.fill);
  });

  // How a cell's lancet shape is turned: "translate(x y) rotate(deg)".
  const turn = (el) => Number(el.getAttribute('transform').match(/rotate\((-?[\d.]+)\)/)[1]);

  it('has lancet-shaped cells like her picture, not circles', () => {
    const cell = makeGroup('penny', { isPlayer: true }).svg.querySelector('.cell-body');
    expect(cell.tagName).toBe('path');
    // On her own, her narrow end points right, like the cell with her face in
    // her picture (the traced shape's narrow end points left, so 180).
    expect(turn(cell)).toBe(180);
  });

  it('points the narrow ends of a pair away from each other', () => {
    const pair = makeGroup('penny');
    grow(pair, 2);
    const [a, b] = pair.cells;
    const bodies = [...pair.svg.querySelectorAll('.cell-body')];
    // Each cell's narrow end points away from her partner.
    for (const [cell, other] of [[a, b], [b, a]]) {
      const el = bodies.find((x) => x.getAttribute('transform').startsWith(`translate(${cell.x} ${cell.y})`));
      const away = (Math.atan2(cell.y - other.y, cell.x - other.x) * 180) / Math.PI;
      expect(((turn(el) - 180 - away) % 360 + 360) % 360).toBeCloseTo(0, 0);
    }
  });

  it('keeps every lancet cell inside her cell circle, so what she touches is unchanged', () => {
    const d = makeGroup('penny').svg.querySelector('.cell-body').getAttribute('d');
    // The points the outline passes through: the start, then the end of each
    // curve (every third point after it).
    const points = [...d.matchAll(/(-?[\d.]+) (-?[\d.]+)/g)].map((m) => [Number(m[1]), Number(m[2])]);
    const onOutline = points.filter((_, i) => i === 0 || i % 3 === 0);
    expect(onOutline).toHaveLength(5);
    for (const [x, y] of onOutline) expect(Math.hypot(x, y)).toBeLessThanOrEqual(R);
  });

  it("leaves Scarlett's and Goldie's cells round", () => {
    for (const name of ['scarlett', 'goldie']) {
      expect(makeGroup(name).svg.querySelector('.cell-body').tagName).toBe('circle');
    }
  });
});

describe('Ceres (Bacillus cereus)', () => {
  // How a cell's rod is turned: "translate(x y) rotate(deg)".
  const turn = (el) => Number(el.getAttribute('transform').match(/rotate\((-?[\d.]+)\)/)[1]);
  const rodAt = (group, cell) =>
    [...group.svg.querySelectorAll('.cell-body')].find((el) =>
      el.getAttribute('transform').startsWith(`translate(${cell.x} ${cell.y})`));

  it('has square-ended rods like her picture, not circles, lying level on her own', () => {
    const cell = makeGroup('ceres', { isPlayer: true }).svg.querySelector('.cell-body');
    expect(cell.tagName).toBe('rect');
    expect(Number(cell.getAttribute('width'))).toBeGreaterThan(Number(cell.getAttribute('height')));
    expect(turn(cell)).toBe(0);
  });

  it('grows chains of at most three rods', () => {
    const chain = makeGroup('ceres');
    grow(chain, 3);
    expect(chain.cellCount()).toBe(3);
    expect(chain.attachSpot(0, 0)).toBeNull();
  });

  it('lines each rod up along the chain, end to end', () => {
    const chain = makeGroup('ceres');
    grow(chain, 3);
    const cells = chain.cells;
    cells.forEach((cell, i) => {
      const a = cells[i - 1] ?? cell;
      const b = cells[i + 1] ?? cell;
      const along = (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI;
      const off = ((turn(rodAt(chain, cell)) - along) % 360 + 360) % 360;
      expect(Math.min(off, 360 - off)).toBeLessThan(0.1);
    });
  });

  it('keeps every rod inside her cell circle, so what she touches is unchanged', () => {
    const rod = makeGroup('ceres').svg.querySelector('.cell-body');
    const [w, h, rx] = ['width', 'height', 'rx'].map((a) => Number(rod.getAttribute(a)));
    // The farthest point of a rounded rectangle from its center is on a corner's curve.
    const farthest = Math.hypot(w / 2 - rx, h / 2 - rx) + rx;
    expect(farthest).toBeLessThanOrEqual(R);
  });

  it('draws in her sky-blue colors', () => {
    expect(makeGroup('ceres').svg.querySelector('.cell-body').getAttribute('fill')).toBe(SPECIES.ceres.colors.fill);
  });
});

describe("Ceres's face in the dish", () => {
  const faceTransform = (name) =>
    [...makeGroup(name, { isPlayer: true }).svg.querySelectorAll('g')]
      .map((g) => g.getAttribute('transform') ?? '')
      .find((t) => t.startsWith('translate('));

  it('is drawn smaller, to fit her rod', () => {
    expect(faceTransform('ceres')).toMatch(/scale\(0\.75\)$/);
  });

  it("leaves the round pals' faces their usual size", () => {
    for (const name of ['scarlett', 'goldie', 'penny']) expect(faceTransform(name)).not.toMatch(/scale/);
  });
});
