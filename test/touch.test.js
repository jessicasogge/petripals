// @vitest-environment jsdom
// touch.js: steering by dragging a finger on the dish (or toward a mouse
// pointer), and showing touch or arrow-key directions to match the device.
// These run in jsdom, a simulated browser page.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  fromCenter, steer, stepToward, touchSteering, watchInputMode,
} from '../public/game/touch.js';

describe('stepToward', () => {
  it('heads straight for the finger at full speed', () => {
    const [dx, dy] = stepToward(0, 0, 30, 40, 5); // the finger is 50px away
    expect(dx).toBeCloseTo(3);
    expect(dy).toBeCloseTo(4);
    expect(Math.hypot(dx, dy)).toBeCloseTo(5);
  });

  it('works in any direction, not just the 8 the arrow keys give', () => {
    const [dx, dy] = stepToward(10, 10, 10 - 12, 10 + 5, 1.3); // 13px away, down and left
    expect(dx).toBeCloseTo(-1.2);
    expect(dy).toBeCloseTo(0.5);
  });

  it('stops right on the finger instead of overshooting', () => {
    expect(stepToward(0, 0, 2, 0, 5)).toEqual([2, 0]);
  });

  it("stays put once she's there, so she doesn't jitter on the spot", () => {
    expect(stepToward(0, 0, 0, 0, 5)).toEqual([0, 0]);
    expect(stepToward(0, 0, 1.5, 0, 5, 2)).toEqual([0, 0]); // close enough counts
  });
});

describe('steer', () => {
  const pal = (x = 0, y = 0, facing = 1) => ({ x, y, facing });

  it('moves with the arrow keys at full speed, the same on diagonals', () => {
    const p = pal();
    steer(p, [1, 1], null, 10);
    expect(Math.hypot(p.x, p.y)).toBeCloseTo(10);
    expect(p.x).toBeCloseTo(p.y);
  });

  it('turns to face the way the arrow keys point', () => {
    const p = pal();
    steer(p, [-1, 0], null, 5);
    expect([p.x, p.facing]).toEqual([-5, -1]);
  });

  it('swims toward the finger when no arrow key is held', () => {
    const p = pal();
    steer(p, [0, 0], [30, 40], 5);
    expect(p.x).toBeCloseTo(3);
    expect(p.y).toBeCloseTo(4);
  });

  it('lets the arrow keys win over a finger', () => {
    const p = pal();
    steer(p, [0, 1], [100, 0], 5);
    expect([p.x, p.y]).toEqual([0, 5]);
  });

  it("doesn't flip her around while swimming nearly straight up or down", () => {
    const p = pal(0, 0, 1);
    steer(p, [0, 0], [-1, 50], 5);
    expect(p.facing).toBe(1);
  });

  it('stays put with no keys and no finger', () => {
    const p = pal(7, 8);
    steer(p, [0, 0], null, 5);
    expect([p.x, p.y]).toEqual([7, 8]);
  });

  describe('dragging', () => {
    it('moves her the same way the finger moved', () => {
      const p = pal(10, 10);
      steer(p, [0, 0], null, 5, 1, [6, -8], 20);
      expect([p.x, p.y]).toEqual([16, 2]);
    });

    it('keeps up with a finger faster than her normal speed', () => {
      const p = pal();
      steer(p, [0, 0], null, 5, 1, [15, 0], 20);
      expect(p.x).toBe(15);
    });

    it('moves her less than a really fast swipe, at her top drag speed', () => {
      const p = pal();
      steer(p, [0, 0], null, 5, 1, [0, 100], 20);
      expect([p.x, p.y]).toEqual([0, 20]);
    });

    it('turns her to face the way she is dragged', () => {
      const p = pal(0, 0, 1);
      steer(p, [0, 0], null, 5, 1, [-10, 2], 20);
      expect(p.facing).toBe(-1);
    });

    it('stays put while a dragging finger is held still', () => {
      const p = pal(7, 8);
      steer(p, [0, 0], null, 5, 1, [0, 0], 20);
      expect([p.x, p.y]).toEqual([7, 8]);
    });

    it('lets the arrow keys win over dragging', () => {
      const p = pal();
      steer(p, [0, 1], null, 5, 1, [15, 0], 20);
      expect([p.x, p.y]).toEqual([0, 5]);
    });
  });
});

describe('fromCenter', () => {
  it('measures a point on the screen from the middle of the dish', () => {
    const el = document.createElement('div');
    el.getBoundingClientRect = () => ({ left: 100, top: 50, width: 200, height: 200 });
    expect(fromCenter(el, 250, 120)).toEqual([50, -30]);
  });
});

// jsdom has no PointerEvent, so make a plain event with the same fields.
function pointer(type, { id = 1, x = 0, y = 0, primary = true, kind = 'touch' } = {}) {
  const event = new Event(type, { bubbles: true, cancelable: true });
  Object.assign(event, { pointerId: id, clientX: x, clientY: y, isPrimary: primary, pointerType: kind });
  return event;
}

describe('touchSteering with a mouse', () => {
  const mouse = (type, options) => pointer(type, { kind: 'mouse', ...options });
  let agar;
  let steering;
  beforeEach(() => {
    document.body.innerHTML = '<div class="agar"></div>';
    agar = document.querySelector('.agar');
    // A 200px dish with its middle at (200, 200) on the screen.
    agar.getBoundingClientRect = () => ({ left: 100, top: 100, width: 200, height: 200 });
    steering = touchSteering(agar);
  });

  it('has no target until the button is down', () => {
    expect(steering.target()).toBeNull();
  });

  it('follows the pointer while the button is held down and moved', () => {
    agar.dispatchEvent(mouse('pointerdown', { x: 260, y: 200 }));
    expect(steering.target()).toEqual([60, 0]);
    agar.dispatchEvent(mouse('pointermove', { x: 180, y: 150 }));
    expect(steering.target()).toEqual([-20, -50]);
  });

  it('stops when the button is let go, or the press is cancelled', () => {
    agar.dispatchEvent(mouse('pointerdown', { x: 260, y: 200 }));
    agar.dispatchEvent(mouse('pointerup'));
    expect(steering.target()).toBeNull();
    agar.dispatchEvent(mouse('pointerdown', { x: 260, y: 200 }));
    agar.dispatchEvent(mouse('pointercancel'));
    expect(steering.target()).toBeNull();
  });

  it('ignores a second pointer, so it keeps following the first', () => {
    agar.dispatchEvent(mouse('pointerdown', { id: 1, x: 260, y: 200 }));
    agar.dispatchEvent(mouse('pointerdown', { id: 2, x: 120, y: 120, primary: false }));
    agar.dispatchEvent(mouse('pointermove', { id: 2, x: 130, y: 130 }));
    expect(steering.target()).toEqual([60, 0]);
    agar.dispatchEvent(mouse('pointerup', { id: 2 }));
    expect(steering.target()).toEqual([60, 0]);
  });

  it("stops the page from scrolling or selecting text when you press on the dish", () => {
    const down = mouse('pointerdown', { x: 260, y: 200 });
    agar.dispatchEvent(down);
    expect(down.defaultPrevented).toBe(true);
  });

  it('ignores the mouse once the game is over', () => {
    agar.dispatchEvent(mouse('pointerdown', { x: 260, y: 200 }));
    steering.stop();
    expect(steering.target()).toBeNull();
    agar.dispatchEvent(mouse('pointerdown', { x: 260, y: 200 }));
    expect(steering.target()).toBeNull();
  });
});

describe('touchSteering with a finger', () => {
  let agar;
  let steering;
  beforeEach(() => {
    document.body.innerHTML = '<div class="agar"></div>';
    agar = document.querySelector('.agar');
    agar.getBoundingClientRect = () => ({ left: 100, top: 100, width: 200, height: 200 });
    steering = touchSteering(agar);
  });

  it("doesn't send her anywhere when a finger touches down", () => {
    agar.dispatchEvent(pointer('pointerdown', { x: 260, y: 250 }));
    expect(steering.target()).toBeNull();
    expect(steering.drag()).toEqual([0, 0]);
  });

  it('says how far the finger moved since it last asked', () => {
    agar.dispatchEvent(pointer('pointerdown', { x: 260, y: 250 }));
    agar.dispatchEvent(pointer('pointermove', { x: 270, y: 245 }));
    agar.dispatchEvent(pointer('pointermove', { x: 275, y: 240 }));
    expect(steering.drag()).toEqual([15, -10]);
    expect(steering.drag()).toEqual([0, 0]); // already counted
    agar.dispatchEvent(pointer('pointermove', { x: 270, y: 240 }));
    expect(steering.drag()).toEqual([-5, 0]);
  });

  it('starts fresh at each touch, wherever it lands', () => {
    agar.dispatchEvent(pointer('pointerdown', { x: 260, y: 250 }));
    agar.dispatchEvent(pointer('pointermove', { x: 270, y: 250 }));
    agar.dispatchEvent(pointer('pointerup'));
    expect(steering.drag()).toEqual([0, 0]); // lifting drops what wasn't used
    agar.dispatchEvent(pointer('pointerdown', { x: 120, y: 120 }));
    agar.dispatchEvent(pointer('pointermove', { x: 125, y: 120 }));
    expect(steering.drag()).toEqual([5, 0]);
  });

  it('works with a pen too', () => {
    agar.dispatchEvent(pointer('pointerdown', { x: 260, y: 250, kind: 'pen' }));
    agar.dispatchEvent(pointer('pointermove', { x: 262, y: 250, kind: 'pen' }));
    expect(steering.target()).toBeNull();
    expect(steering.drag()).toEqual([2, 0]);
  });

  it('lets a mouse steer right where it points, without dragging', () => {
    agar.dispatchEvent(pointer('pointerdown', { x: 260, y: 250, kind: 'mouse' }));
    agar.dispatchEvent(pointer('pointermove', { x: 270, y: 250, kind: 'mouse' }));
    expect(steering.target()).toEqual([70, 50]);
    expect(steering.drag()).toEqual([0, 0]);
  });

  it('ignores a second finger, so it keeps following the first', () => {
    agar.dispatchEvent(pointer('pointerdown', { id: 1, x: 260, y: 250 }));
    agar.dispatchEvent(pointer('pointerdown', { id: 2, x: 120, y: 120, primary: false }));
    agar.dispatchEvent(pointer('pointermove', { id: 2, x: 150, y: 120 }));
    expect(steering.drag()).toEqual([0, 0]);
  });

  it('drags from the rim too, measuring from the agar', () => {
    document.body.innerHTML = '<div class="petri-dish"><div class="agar"></div></div>';
    const dish = document.querySelector('.petri-dish');
    const inner = document.querySelector('.agar');
    inner.getBoundingClientRect = () => ({ left: 100, top: 100, width: 200, height: 200 });
    const whole = touchSteering(inner, dish);
    dish.dispatchEvent(pointer('pointerdown', { x: 95, y: 200 })); // on the rim, just left of the agar
    dish.dispatchEvent(pointer('pointermove', { x: 105, y: 190 }));
    expect(whole.drag()).toEqual([10, -10]);
    dish.dispatchEvent(pointer('pointerdown', { id: 3, x: 95, y: 200, kind: 'mouse' }));
    dish.dispatchEvent(pointer('pointerup'));
    dish.dispatchEvent(pointer('pointerdown', { id: 4, x: 95, y: 200, kind: 'mouse' }));
    expect(whole.target()).toEqual([-105, 0]);
  });

  it('stops dragging when the game ends', () => {
    agar.dispatchEvent(pointer('pointerdown', { x: 260, y: 250 }));
    agar.dispatchEvent(pointer('pointermove', { x: 270, y: 250 }));
    steering.stop();
    expect(steering.drag()).toEqual([0, 0]);
    agar.dispatchEvent(pointer('pointerdown', { id: 2, x: 260, y: 250 }));
    agar.dispatchEvent(pointer('pointermove', { id: 2, x: 290, y: 250 }));
    expect(steering.drag()).toEqual([0, 0]);
  });
});

describe('watchInputMode', () => {
  const root = document.documentElement;
  const mode = () => (root.classList.contains('input-touch') ? 'touch' : root.classList.contains('input-keys') ? 'keys' : null);
  // A stand-in window whose screen is a touch screen or not, that can be sent events.
  function fakeWindow(coarse) {
    const win = new EventTarget();
    win.matchMedia = (query) => ({ matches: query === '(pointer: coarse)' && coarse });
    return win;
  }
  afterEach(() => root.classList.remove('input-touch', 'input-keys'));

  it('starts with touch directions on a touch screen', () => {
    watchInputMode(root, fakeWindow(true));
    expect(mode()).toBe('touch');
  });

  it('starts with arrow-key directions on a computer', () => {
    watchInputMode(root, fakeWindow(false));
    expect(mode()).toBe('keys');
  });

  it("switches to touch directions when someone with both touches the screen", () => {
    const win = fakeWindow(false);
    watchInputMode(root, win);
    win.dispatchEvent(pointer('pointerdown', { kind: 'touch' }));
    expect(mode()).toBe('touch');
  });

  it('switches back to arrow-key directions when they press an arrow key', () => {
    const win = fakeWindow(true);
    watchInputMode(root, win);
    win.dispatchEvent(Object.assign(new Event('keydown'), { key: 'ArrowLeft' }));
    expect(mode()).toBe('keys');
  });

  it("doesn't switch for a mouse click or other keys", () => {
    const win = fakeWindow(true);
    watchInputMode(root, win);
    win.dispatchEvent(pointer('pointerdown', { kind: 'mouse' }));
    win.dispatchEvent(Object.assign(new Event('keydown'), { key: 'Tab' }));
    expect(mode()).toBe('touch');
  });

  it('works in a browser without matchMedia, defaulting to arrow keys', () => {
    const win = new EventTarget();
    watchInputMode(root, win);
    expect(mode()).toBe('keys');
  });
});

describe('the directions on the dish page', () => {
  // (jsdom changes import.meta.url to a web address, so find files from the project folder.)
  const page = readFileSync(resolve(process.cwd(), 'public/petri-dish.html'), 'utf8');
  const css = readFileSync(resolve(process.cwd(), 'public/styles.css'), 'utf8');

  it('has both touch and arrow-key wording', () => {
    expect(page).toContain('<span class="for-keys">Use the arrow keys to swim.</span>');
    expect(page).toContain('<span class="for-touch">Touch the dish and slide your finger to swim.</span>');
  });

  it('picks touch wording on a touch screen even before any script runs', () => {
    expect(css).toMatch(/@media \(pointer: coarse\)\s*\{[^@]*\.for-keys\s*\{\s*display: none;/);
  });

  it("doesn't let a finger near the dish's edge select text or bring up the magnifier", () => {
    const dish = css.match(/\n\.petri-dish \{([^}]*)\}/)[1];
    expect(dish).toMatch(/touch-action: none/);
    expect(dish).toMatch(/-webkit-user-select: none/);
    expect(dish).toMatch(/-webkit-touch-callout: none/);
    const shell = css.match(/\n\.dish-shell \{([^}]*)\}/)[1];
    expect(shell).toMatch(/-webkit-user-select: none/);
    expect(shell).toMatch(/-webkit-touch-callout: none/);
  });

  it("doesn't let touching the dish scroll or zoom the page", () => {
    const agar = css.match(/\n\.agar \{([^}]*)\}/)[1];
    expect(agar).toMatch(/touch-action: none/);
  });
});
