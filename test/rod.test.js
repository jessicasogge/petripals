// @vitest-environment jsdom
// rod.js sizes and moves elements on the page, so these tests run in jsdom,
// a simulated browser page.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GAME, SPECIES } from '../public/game/config.js';
import { touchesDisk } from '../public/game/antibiotic.js';
import { palById } from '../public/game/pals.js';
import { MIN_STEP, rodGroup, STILL_FRAMES } from '../public/game/rod.js';

// jsdom doesn't lay anything out, so every width reads as 0. Give the dish a
// fixed size and work out each element's width from its percent width, the
// way the browser would.
const DISH_WIDTH = 400;
const DISH_RADIUS = DISH_WIDTH / 2;
// Rods are drawn 12% of the dish wide unless their species says otherwise.
const rodPx = (name) => ((SPECIES[name].size ?? 12) / 100) * DISH_WIDTH;
const ROD_PX = rodPx('mona');

let saved;
beforeEach(() => {
  document.body.innerHTML = '<div class="agar"></div>';
  Object.defineProperty(document.querySelector('.agar'), 'clientWidth', { value: DISH_WIDTH });
  saved = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetWidth');
  Object.defineProperty(HTMLElement.prototype, 'offsetWidth', {
    configurable: true,
    get() {
      return ((parseFloat(this.style.width) || 0) / 100) * DISH_WIDTH;
    },
  });
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  if (saved) Object.defineProperty(HTMLElement.prototype, 'offsetWidth', saved);
  else delete HTMLElement.prototype.offsetWidth;
});

const RODS = Object.keys(SPECIES).filter((name) => SPECIES[name].kind === 'rod');

// A rod in the dish at (x, y) px from the center, like the game makes.
function makeRod(name, { isPlayer = false, x = 0, y = 0, facing = 1 } = {}) {
  const mover = document.createElement('div');
  mover.className = 'pal-mover';
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('role', 'img');
  svg.setAttribute('aria-label', name);
  mover.appendChild(svg);
  document.querySelector('.agar').appendChild(mover);
  const rod = rodGroup({ mover, svg, species: SPECIES[name], isPlayer });
  Object.assign(rod, { x, y, facing });
  rod.update(0);
  return rod;
}

describe('a rod', () => {
  it('is one cell', () => {
    expect(makeRod('mona').cellCount()).toBe(1);
  });

  it('is sized to 12% of the dish unless its species says otherwise, and reaches half its width', () => {
    const rod = makeRod('elia');
    expect(rod.mover.style.width).toBe(`${SPECIES.elia.size}%`);
    expect(rod.reach()).toBeCloseTo(rodPx('elia') / 2);
    const noSize = { ...SPECIES.elia };
    delete noSize.size;
    const mover = document.createElement('div');
    document.querySelector('.agar').appendChild(mover);
    const plain = rodGroup({ mover, svg: document.createElementNS('http://www.w3.org/2000/svg', 'svg'), species: noSize, isPlayer: false });
    plain.update(0);
    expect(mover.style.width).toBe('12%');
  });

  it('draws Mona, Vi and Elia the same size, a bit bigger than Coco', () => {
    for (const name of ['mona', 'vi', 'elia']) {
      expect(SPECIES[name].size).toBe(SPECIES.vi.size);
      expect(makeRod(name).mover.style.width).toBe(`${SPECIES[name].size}%`);
      expect(SPECIES[name].size).toBeLessThan(12);
      expect(SPECIES[name].size).toBeGreaterThan(SPECIES.coco.size);
    }
  });

  it('draws Coco smaller than the other rods, since she is one of the smallest bacteria', () => {
    const coco = makeRod('coco');
    expect(coco.mover.style.width).toBe(`${SPECIES.coco.size}%`);
    expect(SPECIES.coco.size).toBeLessThan(12);
    expect(coco.reach()).toBeCloseTo(rodPx('coco') / 2);
  });

  it('is drawn where it is in the dish, flipped to face the way it is going', () => {
    const rod = makeRod('coco', { x: 30, y: -12, facing: -1 });
    rod.place();
    expect(rod.mover.style.transform).toBe('translate(30px, -12px) scaleX(-1)');
  });
});

describe('touch outline', () => {
  it.each(RODS)('follows %s\'s traced shape, scaled to the drawing and placed where she is', (name) => {
    const rod = makeRod(name, { x: 50, y: 20 });
    const body = rod.body();
    const w = rodPx(name);
    expect(body).toHaveLength(SPECIES[name].body.length);
    SPECIES[name].body.forEach(([fx, fy, fr], i) => {
      expect(body[i][0]).toBeCloseTo(50 + fx * w);
      expect(body[i][1]).toBeCloseTo(20 + fy * w);
      expect(body[i][2]).toBeCloseTo(fr * w);
    });
  });

  it.each(RODS)('mirrors %s\'s outline when she faces left', (name) => {
    const right = makeRod(name, { x: 10, facing: 1 }).body();
    const left = makeRod(name, { x: 10, facing: -1 }).body();
    right.forEach(([x, y, r], i) => {
      expect(left[i][0] - 10).toBeCloseTo(-(x - 10));
      expect(left[i][1]).toBeCloseTo(y);
      expect(left[i][2]).toBeCloseTo(r);
    });
  });

  it('puts Mona\'s tail behind her: on the left facing right, on the right facing left', () => {
    const tail = (rod) => rod.body()[0][0]; // her first circles are the flagellum
    expect(tail(makeRod('mona', { facing: 1 }))).toBeLessThan(0);
    expect(tail(makeRod('mona', { facing: -1 }))).toBeGreaterThan(0);
  });
});

describe("the player's touch outline follows her idle animation", () => {
  // jsdom doesn't run CSS animations, so stand in for what the browser would
  // report mid-animation: the drawing's current transform, as a matrix (see
  // mover.test.js for the same trick).
  class Matrix {
    constructor(text) {
      [this.a, this.b, this.c, this.d, this.e, this.f] = text.match(/-?[\d.]+(?:e-?\d+)?/g).map(Number);
    }
  }
  function animate(transform) {
    vi.stubGlobal('DOMMatrixReadOnly', Matrix);
    vi.spyOn(window, 'getComputedStyle').mockReturnValue({ transform, transformOrigin: '0px 0px' });
  }
  const BOB_UP = 'matrix(1, 0, 0, 1, 0, -10)'; // translateY(-10px), mid-bob

  it.each(RODS)('moves %s\'s outline up with her when she bobs', (name) => {
    const still = makeRod(name, { isPlayer: true, x: 50, y: 20 }).body();
    animate(BOB_UP);
    const bobbing = makeRod(name, { isPlayer: true, x: 50, y: 20 }).body();
    bobbing.forEach(([x, y, r], i) => {
      expect(x).toBeCloseTo(still[i][0]);
      expect(y).toBeCloseTo(still[i][1] - 10);
      expect(r).toBeCloseTo(still[i][2]);
    });
  });

  it('still mirrors her outline when she bobs facing left', () => {
    animate(BOB_UP);
    const right = makeRod('mona', { isPlayer: true, x: 10, facing: 1 }).body();
    const left = makeRod('mona', { isPlayer: true, x: 10, facing: -1 }).body();
    right.forEach(([x, y], i) => {
      expect(left[i][0] - 10).toBeCloseTo(-(x - 10));
      expect(left[i][1]).toBeCloseTo(y);
    });
  });

  it('grows her touch circles when the animation stretches her, so touches are not missed', () => {
    const still = makeRod('vi', { isPlayer: true }).body();
    animate('matrix(1.1, 0, 0, 0.9, 0, 0)'); // a squish: wider and shorter
    const squished = makeRod('vi', { isPlayer: true }).body();
    squished.forEach(([, , r], i) => expect(r).toBeCloseTo(still[i][2] * 1.1));
  });

  it("ignores the animation for offspring, which don't bob", () => {
    const before = makeRod('mona', { x: 50, y: 20 }).body();
    animate(BOB_UP);
    expect(makeRod('mona', { x: 50, y: 20 }).body()).toEqual(before);
    expect(window.getComputedStyle).not.toHaveBeenCalled();
  });
});

describe('dividing', () => {
  it('makes a new offspring rod in the same spot, facing the same way', () => {
    const player = makeRod('mona', { isPlayer: true, x: 40, y: -25, facing: -1 });
    const child = player.divide();
    expect(child.isPlayer).toBe(false);
    expect([child.x, child.y, child.facing]).toEqual([40, -25, -1]);
    expect(child.cellCount()).toBe(1);
  });

  it('adds the new rod to the dish as its own faceless, hidden-from-screen-readers copy', () => {
    const player = makeRod('vi', { isPlayer: true });
    const child = player.divide();
    expect(child.svg).not.toBe(player.svg);
    expect(child.mover.parentElement).toBe(document.querySelector('.agar'));
    expect(child.mover.classList.contains('offspring')).toBe(true);
    expect(child.svg.getAttribute('aria-hidden')).toBe('true');
    expect(child.svg.hasAttribute('aria-label')).toBe(false);
    // The player keeps its own label.
    expect(player.svg.getAttribute('aria-label')).toBe('vi');
  });

  it('sends the new rod sliding off the way the parent faces', () => {
    const burst = GAME.BURST_SPEED * DISH_RADIUS;
    for (const facing of [1, -1]) {
      const child = makeRod('elia', { isPlayer: true, facing }).divide();
      expect(child.vx).toBeCloseTo(facing * burst);
      // ...with only a little sideways drift.
      expect(Math.abs(child.vy)).toBeLessThanOrEqual(burst * 0.2);
    }
  });

  it('leaves the player where it is', () => {
    const player = makeRod('coco', { isPlayer: true });
    player.divide();
    expect([player.vx, player.vy]).toEqual([0, 0]);
  });

  it('pushes an offspring that divides the other way, and lets it settle again', () => {
    const offspring = makeRod('mona', { x: 60 });
    offspring.coast(5); // long since settled
    expect(offspring.age).toBeGreaterThan(GAME.SETTLE_MS / 1000);

    const child = offspring.divide();
    expect(offspring.vx).toBeCloseTo(-child.vx);
    expect(offspring.vy).toBeCloseTo(-child.vy);
    expect(offspring.age).toBe(0);
  });

  it('lets an offspring that was itself born from a division divide again', () => {
    const child = makeRod('vi', { isPlayer: true }).divide();
    child.update(0);
    const grandchild = child.divide();
    expect(grandchild.isPlayer).toBe(false);
    expect(document.querySelectorAll('.agar .pal-mover')).toHaveLength(3);
  });
});

describe("Astrid's two kinds of cell", () => {
  // Astrid in the dish, drawn as the game draws her.
  function astrid(options) {
    const rod = makeRod('astrid', options);
    rod.svg.innerHTML = palById('astrid').art;
    return rod;
  }
  const shown = (svg, part) => svg.querySelector(part).getAttribute('display') !== 'none';
  const isSwarmer = (svg) => shown(svg, '.swarmer') && !shown(svg, '.stalked');
  const isStalked = (svg) => shown(svg, '.stalked') && !shown(svg, '.swarmer');

  it('starts out with her stalks, and her flagellum hidden', () => {
    expect(isStalked(astrid().svg)).toBe(true);
  });

  it('keeps her stalks when she divides, and her new cell is a swarmer that swims', () => {
    const player = astrid({ isPlayer: true });
    const child = player.divide([], DISH_RADIUS);
    expect(isStalked(player.svg)).toBe(true);
    expect(child.swarmer).toBe(true);
    expect(isSwarmer(child.svg)).toBe(true);
    expect(child.svg.querySelector('.swarmer .flagellum')).not.toBeNull();
  });

  it('grows stalks on a swarmer before she divides, and makes a swarmer in turn', () => {
    const swarmer = astrid({ isPlayer: true }).divide([], DISH_RADIUS);
    const next = swarmer.divide([], DISH_RADIUS);
    expect(swarmer.swarmer).toBe(false);
    expect(isStalked(swarmer.svg)).toBe(true);
    expect(isSwarmer(next.svg)).toBe(true);
  });

  it("leaves other rods' offspring just like their parents", () => {
    expect(makeRod('mona', { isPlayer: true }).divide([], DISH_RADIUS).swarmer).toBe(false);
  });
});

describe('dividing near an antibiotic zone', () => {
  // A disk with its zone, in fractions of the dish radius like the game's.
  const disk = (fx, fy, zone = 0.15) => ({ fx, fy, r: GAME.DISK_RADIUS, zone, fullZone: zone });
  // Where a rod ends up once its burst has settled.
  function settle(rod) {
    rod.update(0); // the game sizes a new rod as soon as it's made
    for (let i = 0; i < 200; i++) rod.coast(1 / 60);
    return rod;
  }
  // How far her body reaches ahead of (or behind) her center, as a fraction
  // of the dish radius.
  const nose = (rod, side = 1) =>
    Math.max(...rod.body().map(([x, , r]) => side * (x - rod.x) + r)) / DISH_RADIUS;
  // A disk (with a zone `zone` wide) off toward `angle` from the rod, placed
  // so its zone is just `gap` (fractions of the dish radius) from her body.
  function diskNear(rod, angle, gap, zone) {
    const room = (d) => Math.min(...rod.body().map(([x, y, r]) =>
      Math.hypot(x - d * Math.cos(angle) * DISH_RADIUS, y - d * Math.sin(angle) * DISH_RADIUS) - r)) / DISH_RADIUS
      - GAME.DISK_RADIUS - zone;
    let d = 1;
    while (room(d) > gap) d -= 0.0005;
    return disk(d * Math.cos(angle), d * Math.sin(angle), zone);
  }
  const inZone = (rod, disks) => disks.some((d) => touchesDisk(d, rod.body(), DISH_RADIUS));

  it('slides the way the parent faces when that way is clear', () => {
    const burst = GAME.BURST_SPEED * DISH_RADIUS;
    // A zone well off behind her.
    const child = makeRod('vi', { isPlayer: true, x: 0, y: 0, facing: 1 }).divide([], DISH_RADIUS, [disk(-0.7, 0)]);
    expect(child.vx).toBeCloseTo(burst, 0);
    expect(Math.abs(child.vy)).toBeLessThanOrEqual(burst * 0.2);
  });

  it("turns away from a zone just ahead, so the new rod doesn't pop", () => {
    for (const name of RODS) {
      const rod = makeRod(name, { isPlayer: true, x: 0, y: 0, facing: 1 });
      // The zone's edge sits just past her nose: one burst would carry her in.
      const edge = nose(rod) + 0.01;
      const disks = [disk(edge + 0.15 + GAME.DISK_RADIUS, 0)];
      expect(inZone(rod, disks)).toBe(false);
      const child = settle(rod.divide([], DISH_RADIUS, disks));
      expect(inZone(child, disks), name).toBe(false);
      expect(child.vx).toBe(0); // settled
    }
  });

  it('keeps an offspring that divides, sliding back, clear of a zone behind it too', () => {
    const offspring = makeRod('vi', { x: 0, y: 0, facing: 1 });
    offspring.coast(5);
    // Ahead is clear, but the parent slides back into this zone if the new
    // rod just goes forward.
    const disks = [disk(-(nose(offspring, -1) + 0.01 + 0.15 + GAME.DISK_RADIUS), 0)];
    const child = offspring.divide([], DISH_RADIUS, disks);
    settle(child);
    settle(offspring);
    expect(inZone(child, disks)).toBe(false);
    expect(inZone(offspring, disks)).toBe(false);
  });

  it('picks a clear way close to the one it wanted, not just any way', () => {
    // A small zone ahead and below: veering up is enough.
    vi.spyOn(Math, 'random').mockReturnValue(0.5); // no sideways drift wanted
    const rod = makeRod('mona', { isPlayer: true, facing: 1 });
    const child = rod.divide([], DISH_RADIUS, [diskNear(rod, 0.8, 0.015, 0.03)]);
    // It veers up, away from the zone, but still goes forward.
    expect(child.vy).toBeLessThan(0);
    expect(child.vx).toBeGreaterThan(0);
  });

  it('leaves room to spare, not just a touch away', () => {
    // A zone ahead at many distances and angles: wherever the new rod goes,
    // it settles with a little room between it and the zone.
    for (let gap = 0; gap <= 0.05; gap += 0.005) {
      for (let angle = -0.6; angle <= 0.6; angle += 0.1) {
        const rod = makeRod('vi', { isPlayer: true, facing: 1 });
        const d = nose(rod) + gap + 0.08 + GAME.DISK_RADIUS;
        const disks = [disk(d * Math.cos(angle), d * Math.sin(angle), 0.08)];
        const child = settle(rod.divide([], DISH_RADIUS, disks));
        const near = disks.some((z) => touchesDisk(z, child.body(), DISH_RADIUS, 0.015));
        expect(near, `gap ${gap.toFixed(3)}, angle ${angle.toFixed(1)}`).toBe(false);
      }
    }
  });

  it('goes the way with the most room when every way is close to a zone', () => {
    // Zones on three sides, the open side above (negative y).
    const rod = makeRod('vi', { isPlayer: true, facing: 1 });
    const zone = 0.15 + GAME.DISK_RADIUS;
    const disks = [disk(nose(rod) + 0.005 + zone, 0), disk(-(nose(rod, -1) + 0.005 + zone), 0), disk(0, 0.05 + zone)];
    const child = rod.divide([], DISH_RADIUS, disks);
    expect(child.vy).toBeLessThan(0);
  });

  it('ignores zones when there are none', () => {
    const child = makeRod('vi', { isPlayer: true, facing: -1 }).divide([], DISH_RADIUS, []);
    expect(child.vx).toBeCloseTo(-GAME.BURST_SPEED * DISH_RADIUS);
  });
});

describe('the wiggling flagellum', () => {
  // jsdom has no SVG animation, so record whether it's paused.
  function swimmer() {
    const rod = makeRod('mona', { isPlayer: true });
    rod.svg.pauseAnimations = vi.fn(() => { rod.svg.paused = true; });
    rod.svg.unpauseAnimations = vi.fn(() => { rod.svg.paused = false; });
    return rod;
  }
  const still = (rod, frames) => { for (let i = 0; i < frames; i++) rod.place(); };
  const swim = (rod, frames, step = 3) => {
    for (let i = 0; i < frames; i++) { rod.x += step; rod.place(); }
  };

  it('stops once she has been still for a moment', () => {
    const rod = swimmer();
    still(rod, STILL_FRAMES - 1);
    expect(rod.svg.paused).toBeUndefined(); // not quite yet
    still(rod, 1);
    expect(rod.svg.paused).toBe(true);
  });

  it('starts again as soon as she swims', () => {
    const rod = swimmer();
    still(rod, STILL_FRAMES + 1);
    swim(rod, 1);
    expect(rod.svg.paused).toBe(false);
  });

  it('keeps going through a brief pause, so it does not flicker', () => {
    const rod = swimmer();
    swim(rod, 5);
    still(rod, STILL_FRAMES - 1);
    swim(rod, 5);
    expect(rod.svg.pauseAnimations).not.toHaveBeenCalled();
  });

  it("ignores tiny nudges, like a settled cell's", () => {
    const rod = swimmer();
    swim(rod, STILL_FRAMES * 3, MIN_STEP / 2);
    expect(rod.svg.paused).toBe(true);
  });

  it('only tells the drawing when it changes, not every frame', () => {
    const rod = swimmer();
    still(rod, 30);
    swim(rod, 30);
    expect(rod.svg.pauseAnimations).toHaveBeenCalledTimes(1);
    expect(rod.svg.unpauseAnimations).toHaveBeenCalledTimes(1);
  });
});
