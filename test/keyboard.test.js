// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { arrowKeys } from '../public/game/keyboard.js';

const press = (key) => window.dispatchEvent(new KeyboardEvent('keydown', { key, cancelable: true }));
const release = (key) => window.dispatchEvent(new KeyboardEvent('keyup', { key }));

describe('arrowKeys', () => {
  it('points the way the held arrows point, and combines two into a diagonal', () => {
    const keys = arrowKeys();
    expect(keys.direction()).toEqual([0, 0]);
    press('ArrowUp');
    expect(keys.direction()).toEqual([0, -1]);
    press('ArrowRight');
    expect(keys.direction()).toEqual([1, -1]);
    release('ArrowUp');
    release('ArrowRight');
    expect(keys.direction()).toEqual([0, 0]);
  });

  it('stops the page scrolling when an arrow is pressed, but leaves other keys alone', () => {
    arrowKeys();
    const arrow = new KeyboardEvent('keydown', { key: 'ArrowDown', cancelable: true });
    const space = new KeyboardEvent('keydown', { key: ' ', cancelable: true });
    window.dispatchEvent(arrow);
    window.dispatchEvent(space);
    expect(arrow.defaultPrevented).toBe(true);
    expect(space.defaultPrevented).toBe(false);
    release('ArrowDown');
  });

  it('lets go of everything when the window loses focus', () => {
    const keys = arrowKeys();
    press('ArrowLeft');
    window.dispatchEvent(new Event('blur'));
    expect(keys.direction()).toEqual([0, 0]);
  });

  it('ignores the arrows once stopped, and lets them scroll the page again', () => {
    // Its own window, so other tests' listeners don't block the key.
    const win = new EventTarget();
    const keys = arrowKeys(win);
    keys.stop();
    const arrow = new KeyboardEvent('keydown', { key: 'ArrowDown', cancelable: true });
    win.dispatchEvent(arrow);
    expect(arrow.defaultPrevented).toBe(false);
    expect(keys.direction()).toEqual([0, 0]);
  });
});
