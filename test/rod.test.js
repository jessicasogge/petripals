// @vitest-environment jsdom
// rod.js sizes and moves elements on the page, so these tests run in jsdom,
// a simulated browser page.
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { GAME, SPECIES } from '../public/game/config.js';
import { rodGroup } from '../public/game/rod.js';

// jsdom doesn't lay anything out, so every width reads as 0. Give the dish a
// fixed size and work out each element's width from its percent width, the
// way the browser would.
const DISH_WIDTH = 400;
const DISH_RADIUS = DISH_WIDTH / 2;
const ROD_PX = 0.12 * DISH_WIDTH; // rods are 12% of the dish wide

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

  it('is sized to 12% of the dish, and reaches half its width from its center', () => {
    const rod = makeRod('vi');
    expect(rod.mover.style.width).toBe('12%');
    expect(rod.reach()).toBeCloseTo(ROD_PX / 2);
  });

  it('is drawn where it is in the dish, flipped to face the way it is going', () => {
    const rod = makeRod('coco', { x: 30, y: -12, facing: -1 });
    rod.place();
    expect(rod.mover.style.transform).toBe('translate(30px, -12px) scaleX(-1) rotate(0deg)');
  });
});

describe('touch outline', () => {
  it.each(RODS)('follows %s\'s traced shape, scaled to the drawing and placed where she is', (name) => {
    const rod = makeRod(name, { x: 50, y: 20 });
    const body = rod.body();
    expect(body).toHaveLength(SPECIES[name].body.length);
    SPECIES[name].body.forEach(([fx, fy, fr], i) => {
      expect(body[i][0]).toBeCloseTo(50 + fx * ROD_PX);
      expect(body[i][1]).toBeCloseTo(20 + fy * ROD_PX);
      expect(body[i][2]).toBeCloseTo(fr * ROD_PX);
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

describe('turning to point the way she swims (Elia)', () => {
  const deg = (radians) => (radians * 180) / Math.PI;
  // Steer like the game does: set facing from left/right, then aim.
  function steer(rod, dx, dy) {
    if (dx !== 0) rod.facing = Math.sign(dx);
    rod.aim(dx, dy);
    rod.update(10); // long enough to finish turning
  }

  it('points up, down and diagonally, whichever way she faces', () => {
    const elia = makeRod('elia', { isPlayer: true });
    steer(elia, 1, 0);
    expect(deg(elia.tilt)).toBeCloseTo(0);
    steer(elia, 0, -1); // straight up
    expect(deg(elia.tilt)).toBeCloseTo(-90);
    steer(elia, 1, 1); // down and to the right
    expect(deg(elia.tilt)).toBeCloseTo(45);
    steer(elia, -1, -1); // up and to the left
    expect(elia.facing).toBe(-1);
    expect(deg(elia.tilt)).toBeCloseTo(-45);
  });

  it('keeps facing the same way when steered straight up or down', () => {
    const elia = makeRod('elia', { isPlayer: true, facing: -1 });
    steer(elia, 0, 1);
    expect(elia.facing).toBe(-1);
    expect(deg(elia.tilt)).toBeCloseTo(90);
  });

  it('swings there smoothly rather than snapping', () => {
    const elia = makeRod('elia', { isPlayer: true });
    elia.aim(0, -1);
    elia.update(1 / 60);
    expect(deg(elia.tilt)).toBeLessThan(0);
    expect(deg(elia.tilt)).toBeGreaterThan(-90);
  });

  it.each(['mona', 'vi', 'coco'])('leaves %s level: she only flips left or right', (name) => {
    const rod = makeRod(name, { isPlayer: true });
    steer(rod, 0, -1);
    steer(rod, 1, 1);
    expect(rod.tilt).toBe(0);
  });

  it('is drawn tilted', () => {
    const elia = makeRod('elia', { isPlayer: true });
    steer(elia, 0, -1);
    elia.place();
    const angle = Number(elia.mover.style.transform.match(/rotate\(([-\d.e]+)deg\)/)[1]);
    expect(angle).toBeCloseTo(-90);
  });

  it('turns her touch outline with her: pointing up, her head is above her and her tail below', () => {
    for (const facing of [1, -1]) {
      const elia = makeRod('elia', { isPlayer: true, facing });
      steer(elia, 0, -1);
      const body = elia.body();
      const head = body[body.length - 1]; // her last circle is her head
      const tail = body[0];
      expect(head[1]).toBeLessThan(-ROD_PX * 0.3);
      expect(tail[1]).toBeGreaterThan(ROD_PX * 0.3);
      expect(Math.abs(head[0])).toBeLessThan(ROD_PX * 0.05);
    }
  });

  it('sends a new rod sliding off the way she points, and it points that way too', () => {
    const burst = GAME.BURST_SPEED * DISH_RADIUS;
    const elia = makeRod('elia', { isPlayer: true });
    steer(elia, 0, -1);
    const child = elia.divide();
    expect(child.tilt).toBeCloseTo(elia.tilt);
    expect(child.vy).toBeCloseTo(-burst);
    expect(Math.abs(child.vx)).toBeLessThanOrEqual(burst * 0.2 + 1e-9);
  });
});
