// @vitest-environment jsdom
// Offspring popping in an antibiotic zone (popInZones in colony.js). These
// use real pals in jsdom, a simulated browser page.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { coccusGroup } from '../public/game/coccus.js';
import { makeColony } from '../public/game/colony.js';
import { GAME, SPECIES } from '../public/game/config.js';
import { rodGroup } from '../public/game/rod.js';

// jsdom doesn't lay anything out, so every width reads as 0. Give the dish a
// fixed size and work out each element's width from its percent width, the
// way the browser would (as in rod.test.js and coccus.test.js).
const DISH_WIDTH = 400;
const RADIUS = DISH_WIDTH / 2;

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

// A pal group in the dish at (x, y) px from the center.
function makeGroup(name, { isPlayer = false, x = 0, y = 0 } = {}) {
  const mover = document.createElement('div');
  mover.className = 'pal-mover';
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  mover.appendChild(svg);
  document.querySelector('.agar').appendChild(mover);
  const species = SPECIES[name];
  const group = (species.kind === 'rod' ? rodGroup : coccusGroup)({ mover, svg, species, isPlayer });
  Object.assign(group, { x, y });
  group.update(0);
  return group;
}

// A colony led by a player far off to the side, with these offspring and disks.
function colonyWith(offspring, disks, onPop = vi.fn()) {
  const leader = makeGroup(offspring[0]?.cells ? 'goldie' : 'mona', { isPlayer: true, x: -150, y: 0 });
  const colony = makeColony({
    leader, nutrients: {}, disks, dishRadius: () => RADIUS, target: 64, onPop,
  });
  colony.groups.push(...offspring);
  return colony;
}

// A disk whose zone reaches exactly to px from the dish center along x, so
// anything at px or beyond is touching it. Placed out to the right.
function diskWithEdgeAt(px) {
  const r = GAME.DISK_RADIUS;
  const zone = 0.05;
  return { fx: px / RADIUS + r + zone, fy: 0, r, zone };
}

describe('popping in an antibiotic zone', () => {
  it('pops a rod offspring that touches a zone, taking it off the plate', () => {
    const rod = makeGroup('mona', { x: 40 });
    const [, , reach] = rod.body().reduce((far, c) => (c[0] + c[2] > far[0] + far[2] ? c : far));
    const onPop = vi.fn();
    const colony = colonyWith([rod], [diskWithEdgeAt(40 + reach / 2)], onPop);

    expect(colony.popInZones(RADIUS)).toBe(1);
    expect(colony.groups).not.toContain(rod);
    expect(rod.mover.isConnected).toBe(false);
    expect(colony.cellCount()).toBe(1); // just the leader left
    expect(onPop).toHaveBeenCalledWith(1);
  });

  it('shows one pop in the pal\'s color where the rod was', () => {
    const rod = makeGroup('mona', { x: 40 });
    const leader = makeGroup('mona', { isPlayer: true, x: -150 });
    const colony = makeColony({
      leader, nutrients: {}, disks: [diskWithEdgeAt(40)], dishRadius: () => RADIUS, target: 64, color: '#15803d',
    });
    colony.groups.push(rod);
    colony.popInZones(RADIUS);
    const pops = document.querySelectorAll('.agar .pop');
    expect(pops).toHaveLength(1); // one rod, one pop
    expect(pops[0].style.borderColor).toBe('rgb(21, 128, 61)');
    expect(pops[0].getAttribute('aria-hidden')).toBe('true');
  });

  it('leaves offspring that are clear of every zone alone', () => {
    const rod = makeGroup('vi', { x: -40 });
    const onPop = vi.fn();
    const colony = colonyWith([rod], [diskWithEdgeAt(120)], onPop);
    expect(colony.popInZones(RADIUS)).toBe(0);
    expect(colony.groups).toContain(rod);
    expect(onPop).not.toHaveBeenCalled();
  });

  it('never pops the pal you steer (touching a zone is game over instead)', () => {
    const leader = makeGroup('mona', { isPlayer: true, x: 100 });
    const colony = makeColony({
      leader, nutrients: {}, disks: [diskWithEdgeAt(100)], dishRadius: () => RADIUS, target: 64,
    });
    expect(colony.popInZones(RADIUS)).toBe(0);
    expect(colony.groups).toEqual([leader]);
    expect(leader.mover.isConnected).toBe(true);
  });

  it('does nothing in mixed culture, where there are no disks', () => {
    const rod = makeGroup('coco', { x: 0 });
    const colony = colonyWith([rod], []);
    expect(colony.popInZones(RADIUS)).toBe(0);
    expect(colony.groups).toContain(rod);
  });
});

describe('popping part of a chain or cluster', () => {
  // A straight chain of `count` touching cells in a row along x.
  function chainOf(count) {
    const chain = makeGroup('scarlett', { x: 0 });
    chain.cells = Array.from({ length: count }, (_, i) => ({
      x: i * 18, y: 0, fromX: i * 18, fromY: 0, toX: i * 18, toY: 0, face: false,
    }));
    // Redraw at the new size, the way the game does after a cell slides in.
    chain.moveFor = 0;
    chain.update(1);
    return chain;
  }

  it('pops only the cells touching the zone, and the rest live on where they were', () => {
    const chain = chainOf(5);
    const before = chain.body();
    const rightmost = before[before.length - 1];
    const onPop = vi.fn();
    // The zone reaches just past the rightmost cell's left edge but no further.
    const colony = colonyWith([chain], [diskWithEdgeAt(rightmost[0] - rightmost[2] / 2)], onPop);

    const popped = colony.popInZones(RADIUS);
    expect(popped).toBeGreaterThanOrEqual(1);
    expect(popped).toBeLessThan(5);
    expect(chain.cellCount()).toBe(5 - popped);
    expect(colony.groups).toContain(chain);
    expect(onPop).toHaveBeenCalledWith(popped);
    // The survivors are the leftmost cells, still in the same places.
    const after = chain.body();
    after.forEach(([x, y], i) => {
      expect(x).toBeCloseTo(before[i][0]);
      expect(y).toBeCloseTo(before[i][1]);
    });
  });

  it('removes the whole chain when every cell touches the zone', () => {
    const chain = chainOf(3);
    const colony = colonyWith([chain], [{ fx: 0, fy: 0, r: 0.5, zone: 0.1 }]);
    expect(colony.popInZones(RADIUS)).toBe(3);
    expect(colony.groups).not.toContain(chain);
    expect(chain.mover.isConnected).toBe(false);
  });
});
