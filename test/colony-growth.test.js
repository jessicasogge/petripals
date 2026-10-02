// @vitest-environment jsdom
// How a colony grows (colony.js): cells eat nutrients, divide, and keep their
// place in the dish. Both game modes are built on this.
//
// The eating and dividing tests use stand-in cells, so each test can say
// exactly what was eaten and when. The moving tests use real pals in jsdom,
// a simulated browser page.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { makeColony, moveGroups, showPop } from '../public/game/colony.js';
import { GAME, SPECIES } from '../public/game/config.js';
import { rodGroup } from '../public/game/rod.js';

const RADIUS = 200; // the dish radius in px
const WAIT = GAME.DIVIDE_MS / 1000; // seconds a cell waits between divisions

// A stand-in cell: one circle at (x, y). Dividing makes another stand-in,
// unless `joins` is set (a round cell joining a chain or cluster instead).
function cell({ x = 0, y = 0, cells = 1, joins = false } = {}) {
  const group = {
    x,
    y,
    cells,
    mover: document.createElement('div'),
    cellCount: () => group.cells,
    body: () => [[group.x, group.y, 5]],
    update: vi.fn(),
    place: vi.fn(),
    divide: vi.fn(() => (joins ? null : cell({ x: group.x, y: group.y }))),
  };
  return group;
}

// Nutrients that feed whichever cell asks next, `meals` times in a row.
function food(meals = 0) {
  return {
    left: meals,
    eatNear: vi.fn(function eatNear() {
      if (this.left === 0) return 0;
      this.left -= 1;
      return 1;
    }),
  };
}

function colonyOf(leader, nutrients, extra = {}) {
  return makeColony({ leader, nutrients, dishRadius: () => RADIUS, target: 64, ...extra });
}

describe('your pal dividing', () => {
  it("eating a nutrient doesn't divide her by itself; the game says when", () => {
    const leader = cell();
    const colony = colonyOf(leader, food(1));
    colony.eat(0.016, RADIUS);
    expect(leader.divide).not.toHaveBeenCalled();
    colony.divideLeader();
    expect(leader.divide).toHaveBeenCalledTimes(1);
    expect(colony.cellCount()).toBe(2);
  });

  it("doesn't divide before she's eaten anything", () => {
    const leader = cell();
    const colony = colonyOf(leader, food(0));
    colony.eat(0.016, RADIUS);
    colony.divideLeader();
    expect(leader.divide).not.toHaveBeenCalled();
    expect(colony.cellCount()).toBe(1);
  });

  it('waits between divisions, however much she eats', () => {
    const leader = cell();
    const colony = colonyOf(leader, food(3));
    colony.eat(0.016, RADIUS);
    colony.eat(0.016, RADIUS);
    colony.eat(0.016, RADIUS);
    colony.divideLeader();
    colony.divideLeader(); // too soon
    expect(leader.divide).toHaveBeenCalledTimes(1);

    colony.tick(WAIT); // exactly the wait isn't enough
    colony.divideLeader();
    expect(leader.divide).toHaveBeenCalledTimes(1);

    colony.tick(0.001);
    colony.divideLeader();
    expect(leader.divide).toHaveBeenCalledTimes(2);
  });

  it('can eat with any part of her body', () => {
    const leader = cell({ x: 40, y: -20 });
    // A long rod: three circles along her length.
    leader.body = () => [[20, -20, 6], [40, -20, 6], [60, -20, 6]];
    const nutrients = food(0);
    colonyOf(leader, nutrients).eat(0.016, RADIUS);
    // Each circle is checked, as fractions of the dish radius.
    expect(nutrients.eatNear.mock.calls).toEqual([
      [0.1, -0.1, 0.03],
      [0.2, -0.1, 0.03],
      [0.3, -0.1, 0.03],
    ]);
  });
});

describe('a division', () => {
  it('adds the new cell, sized and placed right away so it never flashes in the middle', () => {
    const leader = cell();
    const onDivide = vi.fn();
    const colony = colonyOf(leader, food(1), { onDivide });
    colony.eat(0.016, RADIUS);
    colony.divideLeader();

    const [, daughter] = colony.groups;
    expect(colony.groups).toHaveLength(2);
    expect(daughter.update).toHaveBeenCalledWith(0);
    expect(daughter.place).toHaveBeenCalled();
    expect(onDivide).toHaveBeenCalledWith(daughter);
  });

  it('tells the cell about the other groups (not your pal), the dish and the disks', () => {
    const leader = cell();
    const disks = [{ fx: 0.5, fy: 0, r: 0.08, zone: 0.1 }];
    const colony = colonyOf(leader, food(2), { disks });
    colony.eat(0.016, RADIUS);
    colony.eat(0.016, RADIUS); // two meals, for two divisions
    colony.divideLeader();
    colony.tick(WAIT + 0.01);
    colony.divideLeader();

    const [others, radius, passedDisks] = leader.divide.mock.calls[1];
    expect(others).toEqual([colony.groups[1]]); // the first daughter, not the leader
    expect(radius).toBe(RADIUS);
    expect(passedDisks).toBe(disks);
  });

  it('still updates the counter when a round cell joins a chain instead of starting a new group', () => {
    const leader = cell({ joins: true });
    const onDivide = vi.fn();
    const colony = colonyOf(leader, food(1), { onDivide });
    colony.eat(0.016, RADIUS);
    colony.divideLeader();
    expect(colony.groups).toEqual([leader]);
    expect(onDivide).toHaveBeenCalledWith(null);
  });

  it('remembers how long ago any of its cells divided, for the win pop-up', () => {
    const colony = colonyOf(cell(), food(1));
    expect(colony.sinceAnyDivision).toBe(Infinity);
    colony.eat(0.016, RADIUS);
    colony.divideLeader();
    expect(colony.sinceAnyDivision).toBe(0);
    colony.tick(0.25);
    expect(colony.sinceAnyDivision).toBe(250);
  });
});

describe('offspring dividing', () => {
  // A colony whose leader is off to the side, with one offspring at (50, 0).
  function withOffspring({ meals, target = 64, cells = 1 }) {
    const leader = cell({ x: -100 });
    const nutrients = food(0);
    const colony = colonyOf(leader, nutrients, { target });
    const daughter = cell({ x: 50, y: 0, cells });
    colony.groups.push(daughter);
    // Only the offspring finds food; the leader eats first, so feed after it.
    nutrients.eatNear.mockImplementation((fx) => (fx > 0 && meals-- > 0 ? 1 : 0));
    return { colony, leader, daughter };
  }

  it('divide on their own as soon as they eat, from the cell that ate', () => {
    const { colony, leader, daughter } = withOffspring({ meals: 1 });
    colony.eat(0.016, RADIUS);
    expect(daughter.divide).toHaveBeenCalledTimes(1);
    expect(daughter.divide.mock.calls[0][3]).toEqual([50, 0]);
    expect(leader.divide).not.toHaveBeenCalled();
    expect(colony.cellCount()).toBe(3);
  });

  it('wait between divisions too', () => {
    const { colony, daughter } = withOffspring({ meals: 3 });
    colony.eat(0.016, RADIUS);
    colony.eat(0.016, RADIUS); // ate again, but too soon
    expect(daughter.divide).toHaveBeenCalledTimes(1);
    colony.eat(WAIT + 0.01, RADIUS);
    expect(daughter.divide).toHaveBeenCalledTimes(2);
  });

  it("stop dividing once the colony is big enough (the game's win check takes over)", () => {
    // A cluster of 3 cells plus the leader: 4, the level-1 target.
    const { colony, daughter } = withOffspring({ meals: 1, target: 4, cells: 3 });
    colony.eat(0.016, RADIUS);
    expect(daughter.divide).not.toHaveBeenCalled();
    expect(colony.cellCount()).toBe(4);
  });

  it("don't eat for the leader: her next division still needs her own meal", () => {
    const { colony, leader } = withOffspring({ meals: 1 });
    colony.eat(0.016, RADIUS);
    colony.tick(WAIT + 0.01);
    colony.divideLeader();
    expect(leader.divide).not.toHaveBeenCalled();
  });
});

describe('moving the groups in the dish', () => {
  // jsdom doesn't lay anything out; give each element a width from its
  // percent width, the way the browser would (as in colony.test.js).
  let saved;
  beforeEach(() => {
    document.body.innerHTML = '<div class="agar"></div>';
    saved = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetWidth');
    Object.defineProperty(HTMLElement.prototype, 'offsetWidth', {
      configurable: true,
      get() {
        return ((parseFloat(this.style.width) || 0) / 100) * 2 * RADIUS;
      },
    });
  });
  afterEach(() => {
    if (saved) Object.defineProperty(HTMLElement.prototype, 'offsetWidth', saved);
    else delete HTMLElement.prototype.offsetWidth;
  });

  const agar = { clientWidth: 2 * RADIUS };

  function rod({ x = 0, y = 0, isPlayer = false } = {}) {
    const mover = document.createElement('div');
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    mover.appendChild(svg);
    document.querySelector('.agar').appendChild(mover);
    const group = rodGroup({ mover, svg, species: SPECIES.mona, isPlayer });
    Object.assign(group, { x, y, vx: 0, vy: 0 });
    group.update(0);
    return group;
  }

  const insideRim = (group) => group.body().every(([x, y, r]) => Math.hypot(x, y) + r <= RADIUS + 1e-6);

  it('pulls an offspring that pokes past the rim back inside', () => {
    const daughter = rod({ x: RADIUS - 2 });
    expect(insideRim(daughter)).toBe(false);
    moveGroups([daughter], { agar, radius: RADIUS, seconds: 0.016 });
    expect(insideRim(daughter)).toBe(true);
  });

  it("stops an offspring sliding into the rim from pushing on through it", () => {
    const daughter = rod({ x: RADIUS - 2 });
    daughter.vx = 300; // heading straight out
    moveGroups([daughter], { agar, radius: RADIUS, seconds: 0.016 });
    expect(daughter.vx).toBeLessThanOrEqual(1e-9);
    expect(insideRim(daughter)).toBe(true);
  });

  it('keeps your pal inside the dish', () => {
    const leader = rod({ x: 500, isPlayer: true });
    moveGroups([leader], { agar, radius: RADIUS, seconds: 0.016 });
    expect(Math.hypot(leader.x, leader.y) + leader.reach()).toBeCloseTo(RADIUS);
  });

  it("doesn't let your pal drift: she only moves when you steer", () => {
    const leader = rod({ x: 10, isPlayer: true });
    leader.vx = 300;
    moveGroups([leader], { agar, radius: RADIUS, seconds: 0.1 });
    expect(leader.x).toBe(10);
  });

  it('nudges two new offspring off each other instead of piling them up', () => {
    const a = rod({ x: 0 });
    const b = rod({ x: 1 });
    moveGroups([a, b], { agar, radius: RADIUS, seconds: 0.016 });
    expect(b.x - a.x).toBeGreaterThan(1);
  });

  it('puts every group where it now is on the page', () => {
    const daughter = rod({ x: 30, y: -40 });
    moveGroups([daughter], { agar, radius: RADIUS, seconds: 0 });
    expect(daughter.mover.style.transform).toContain('translate(30px, -40px)');
  });
});

describe('the pop ring', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div class="agar"></div>';
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  const ring = () => document.querySelector('.pop');

  it('sits where the cell was, as wide as the cell, in her color', () => {
    showPop(document.querySelector('.agar'), [12, -8, 6], '#15803d');
    expect(ring().style.left).toBe('calc(50% + 12px)');
    expect(ring().style.top).toBe('calc(50% - 8px)');
    expect(ring().style.width).toBe('12px');
    expect(ring().style.borderColor).toBe('rgb(21, 128, 61)');
  });

  it('is gone once its animation ends', () => {
    showPop(document.querySelector('.agar'), [0, 0, 5], 'red');
    ring().dispatchEvent(new Event('animationend'));
    expect(ring()).toBeNull();
  });

  it("is gone after a second even if the animation never runs (like with reduced motion)", () => {
    vi.useFakeTimers();
    showPop(document.querySelector('.agar'), [0, 0, 5], 'red');
    vi.advanceTimersByTime(999);
    expect(ring()).not.toBeNull();
    vi.advanceTimersByTime(1);
    expect(ring()).toBeNull();
  });

  it('does nothing if the cell had already left the dish', () => {
    expect(() => showPop(null, [0, 0, 5], 'red')).not.toThrow();
    expect(ring()).toBeNull();
  });
});
