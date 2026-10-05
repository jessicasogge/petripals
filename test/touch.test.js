// @vitest-environment jsdom
// touch.js: steering toward a finger held on the dish, and showing touch or
// arrow-key directions to match the device. These run in jsdom, a simulated
// browser page.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  fromCenter, LOOP_ART, LOOP_FINGER_Y, LOOP_REACH, loopChosen, steer, steeringChoice, STEERING_KEY, stepToward, touchSteering, watchInputMode,
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

describe('touchSteering', () => {
  let agar;
  let steering;
  beforeEach(() => {
    document.body.innerHTML = '<div class="agar"></div>';
    agar = document.querySelector('.agar');
    // A 200px dish with its middle at (200, 200) on the screen.
    agar.getBoundingClientRect = () => ({ left: 100, top: 100, width: 200, height: 200 });
    steering = touchSteering(agar, { useLoop: () => false });
  });

  it('has no target until a finger is down', () => {
    expect(steering.target()).toBeNull();
  });

  it('follows the finger while it is held down and moved', () => {
    agar.dispatchEvent(pointer('pointerdown', { x: 260, y: 200 }));
    expect(steering.target()).toEqual([60, 0]);
    agar.dispatchEvent(pointer('pointermove', { x: 180, y: 150 }));
    expect(steering.target()).toEqual([-20, -50]);
  });

  it('stops when the finger lifts, or the touch is cancelled', () => {
    agar.dispatchEvent(pointer('pointerdown', { x: 260, y: 200 }));
    agar.dispatchEvent(pointer('pointerup'));
    expect(steering.target()).toBeNull();
    agar.dispatchEvent(pointer('pointerdown', { x: 260, y: 200 }));
    agar.dispatchEvent(pointer('pointercancel'));
    expect(steering.target()).toBeNull();
  });

  it('ignores a second finger, so it keeps following the first', () => {
    agar.dispatchEvent(pointer('pointerdown', { id: 1, x: 260, y: 200 }));
    agar.dispatchEvent(pointer('pointerdown', { id: 2, x: 120, y: 120, primary: false }));
    agar.dispatchEvent(pointer('pointermove', { id: 2, x: 130, y: 130 }));
    expect(steering.target()).toEqual([60, 0]);
    agar.dispatchEvent(pointer('pointerup', { id: 2 }));
    expect(steering.target()).toEqual([60, 0]);
  });

  it("stops the page from scrolling or selecting text when you press on the dish", () => {
    const down = pointer('pointerdown', { x: 260, y: 200 });
    agar.dispatchEvent(down);
    expect(down.defaultPrevented).toBe(true);
  });

  it('ignores the finger once the game is over', () => {
    agar.dispatchEvent(pointer('pointerdown', { x: 260, y: 200 }));
    steering.stop();
    expect(steering.target()).toBeNull();
    agar.dispatchEvent(pointer('pointerdown', { x: 260, y: 200 }));
    expect(steering.target()).toBeNull();
  });
});

describe('touchSteering with the inoculating loop', () => {
  let agar;
  let loop;
  let loopOn;
  let steering;
  beforeEach(() => {
    document.body.innerHTML = '<div class="agar"></div><div class="inoc-loop" hidden></div>';
    agar = document.querySelector('.agar');
    loop = document.querySelector('.inoc-loop');
    agar.getBoundingClientRect = () => ({ left: 100, top: 100, width: 200, height: 200 });
    loopOn = true;
    steering = touchSteering(agar, { useLoop: () => loopOn });
  });

  it("aims at the loop's tip, above the finger, so the finger doesn't hide the pal", () => {
    agar.dispatchEvent(pointer('pointerdown', { x: 260, y: 250 }));
    expect(steering.target()).toEqual([60, 50 - LOOP_REACH]);
    agar.dispatchEvent(pointer('pointermove', { x: 180, y: 290 }));
    expect(steering.target()).toEqual([-20, 90 - LOOP_REACH]);
  });

  it('shows the loop on the finger while it is down, and hides it after', () => {
    agar.dispatchEvent(pointer('pointerdown', { x: 260, y: 250 }));
    expect(loop.hidden).toBe(false);
    expect(loop.style.transform).toBe('translate(260px, 250px)');
    agar.dispatchEvent(pointer('pointermove', { x: 180, y: 290 }));
    expect(loop.style.transform).toBe('translate(180px, 290px)');
    agar.dispatchEvent(pointer('pointerup'));
    expect(loop.hidden).toBe(true);
  });

  it('works with a pen too, since a hand covers the screen the same way', () => {
    agar.dispatchEvent(pointer('pointerdown', { x: 260, y: 250, kind: 'pen' }));
    expect(steering.target()).toEqual([60, 50 - LOOP_REACH]);
  });

  it('lets a mouse steer right where it points, with no loop', () => {
    agar.dispatchEvent(pointer('pointerdown', { x: 260, y: 250, kind: 'mouse' }));
    expect(steering.target()).toEqual([60, 50]);
    expect(loop.hidden).toBe(true);
  });

  it('steers right under the finger when the loop is turned off', () => {
    loopOn = false;
    agar.dispatchEvent(pointer('pointerdown', { x: 260, y: 250 }));
    expect(steering.target()).toEqual([60, 50]);
    expect(loop.hidden).toBe(true);
  });

  it("doesn't switch mid-swim, only at the next touch", () => {
    agar.dispatchEvent(pointer('pointerdown', { x: 260, y: 250 }));
    loopOn = false;
    agar.dispatchEvent(pointer('pointermove', { x: 260, y: 250 }));
    expect(steering.target()).toEqual([60, 50 - LOOP_REACH]);
  });

  it('hides the loop when the game ends', () => {
    agar.dispatchEvent(pointer('pointerdown', { x: 260, y: 250 }));
    steering.stop();
    expect(loop.hidden).toBe(true);
  });

  it('still steers on a page without the loop drawing', () => {
    loop.remove();
    const plain = touchSteering(agar, { useLoop: () => true, loop: null });
    agar.dispatchEvent(pointer('pointerdown', { id: 5, x: 260, y: 250 }));
    expect(plain.target()).toEqual([60, 50 - LOOP_REACH]);
    agar.dispatchEvent(pointer('pointerup', { id: 5 }));
    plain.stop();
    expect(plain.target()).toBeNull();
  });

  it("uses the player's choice on the page when not told otherwise", () => {
    document.documentElement.classList.add('steer-loop');
    const fresh = touchSteering(agar);
    agar.dispatchEvent(pointer('pointerdown', { id: 9, x: 260, y: 250 }));
    expect(fresh.target()).toEqual([60, 50 - LOOP_REACH]);
    document.documentElement.classList.remove('steer-loop');
  });
});

describe('steeringChoice', () => {
  const root = document.documentElement;
  let buttons;
  // A stand-in for the browser's saved settings.
  function memory(start = {}) {
    const saved = { ...start };
    return { saved, getItem: (key) => saved[key] ?? null, setItem: (key, value) => { saved[key] = value; } };
  }
  const pressed = () => buttons.map((b) => b.getAttribute('aria-pressed'));
  beforeEach(() => {
    document.body.innerHTML = `
      <button class="steer-btn" data-steer="loop"><span class="steer-icon"></span> Loop</button>
      <button class="steer-btn" data-steer="finger"><span class="steer-icon"></span> Finger</button>
      <div class="inoc-loop" hidden></div>`;
    buttons = [...document.querySelectorAll('.steer-btn')];
  });

  it('draws the button icons and the loop', () => {
    steeringChoice({ root, buttons, win: {} });
    expect(buttons[0].querySelector('.steer-icon svg')).not.toBeNull();
    expect(buttons[1].querySelector('.steer-icon').textContent).toBe('👆');
    expect(document.querySelector('.inoc-loop .inoc-loop-ring')).not.toBeNull();
  });

  it("doesn't mind buttons without an icon, or no loop on the page", () => {
    const bare = document.createElement('button');
    bare.dataset.steer = 'finger';
    steeringChoice({ root, buttons: [bare], loop: null, win: {} });
    expect(bare.getAttribute('aria-pressed')).toBe('false');
  });
  afterEach(() => root.classList.remove('steer-loop'));

  it('starts with the loop when nothing was picked before', () => {
    steeringChoice({ root, buttons, win: { localStorage: memory() } });
    expect(loopChosen(root)).toBe(true);
    expect(pressed()).toEqual(['true', 'false']);
  });

  it('remembers picking the finger', () => {
    const storage = memory();
    steeringChoice({ root, buttons, win: { localStorage: storage } });
    buttons[1].click();
    expect(loopChosen(root)).toBe(false);
    expect(pressed()).toEqual(['false', 'true']);
    expect(storage.saved[STEERING_KEY]).toBe('finger');
  });

  it('starts with the finger if that was picked last time', () => {
    steeringChoice({ root, buttons, win: { localStorage: memory({ [STEERING_KEY]: 'finger' }) } });
    expect(loopChosen(root)).toBe(false);
    expect(pressed()).toEqual(['false', 'true']);
  });

  it('can switch back to the loop', () => {
    const storage = memory({ [STEERING_KEY]: 'finger' });
    steeringChoice({ root, buttons, win: { localStorage: storage } });
    buttons[0].click();
    expect(loopChosen(root)).toBe(true);
    expect(storage.saved[STEERING_KEY]).toBe('loop');
  });

  it("still works when the browser won't save settings at all", () => {
    const win = {};
    Object.defineProperty(win, 'localStorage', { get() { throw new Error('blocked'); } });
    steeringChoice({ root, buttons, win });
    expect(loopChosen(root)).toBe(true);
    buttons[1].click();
    expect(loopChosen(root)).toBe(false);
  });

  it('still works when reading or saving the setting fails', () => {
    const broken = { getItem() { throw new Error('blocked'); }, setItem() { throw new Error('full'); } };
    steeringChoice({ root, buttons, win: { localStorage: broken } });
    expect(loopChosen(root)).toBe(true);
    buttons[1].click();
    expect(loopChosen(root)).toBe(false);
  });

  it("works in a browser with no saved settings, and finds the page's buttons itself", () => {
    steeringChoice({ win: {} });
    expect(loopChosen(root)).toBe(true);
    expect(pressed()).toEqual(['true', 'false']);
  });

  it('uses the real page and window when not told otherwise', () => {
    window.localStorage.removeItem(STEERING_KEY);
    steeringChoice();
    buttons[1].click();
    expect(window.localStorage.getItem(STEERING_KEY)).toBe('finger');
    window.localStorage.removeItem(STEERING_KEY);
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
    expect(page).toContain('<span class="for-touch">Touch and hold where you want to swim.</span>');
  });

  it('picks touch wording on a touch screen even before any script runs', () => {
    expect(css).toMatch(/@media \(pointer: coarse\)\s*\{[^@]*\.for-keys\s*\{\s*display: none;/);
  });

  it('has the Loop and Finger buttons, and the loop drawing', () => {
    expect(page).toContain('data-steer="loop" aria-pressed="true"');
    expect(page).toContain('data-steer="finger" aria-pressed="false"');
    expect(page).toContain('<div class="inoc-loop" aria-hidden="true" hidden></div>');
  });

  it('draws the ring LOOP_REACH px above the finger, where the pal aims', () => {
    // styles.css hangs the drawing so its (20, LOOP_FINGER_Y) is on the finger.
    expect(css).toMatch(new RegExp(`\\.inoc-loop svg \\{[^}]*left: -20px;[^}]*top: -${LOOP_FINGER_Y}px;`));
    const ring = Number(LOOP_ART.match(/class="inoc-loop-ring" cx="20" cy="([\d.]+)"/)[1]);
    expect(LOOP_FINGER_Y - ring).toBe(LOOP_REACH);
  });

  it('shows the Loop / Finger buttons only on touch screens', () => {
    expect(css).toMatch(/\.steer-choice \{\s*display: none;/);
    expect(css).toMatch(/html\.input-touch \.steer-choice \{\s*display: flex;/);
    expect(css).toMatch(/html\.input-keys \.steer-choice \{\s*display: none;/);
  });

  it("doesn't let touching the dish scroll or zoom the page", () => {
    const agar = css.match(/\n\.agar \{([^}]*)\}/)[1];
    expect(agar).toMatch(/touch-action: none/);
  });
});
