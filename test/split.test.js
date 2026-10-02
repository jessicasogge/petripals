// @vitest-environment jsdom
// The home-page easter egg (split.js): tap a pal and she divides in two,
// then comes back together. jsdom, the simulated browser page these tests
// run in, can't play animations, so a stand-in records each one and lets the
// test say when it finishes.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { homePal, palById } from '../public/game/pals.js';
import { split, splitKeyframes, splitOnTap } from '../public/game/split.js';

let animations; // every animation started, newest last

beforeEach(() => {
  animations = [];
  Element.prototype.animate = vi.fn(function animate(keyframes, options) {
    const animation = { target: this, keyframes, options, onfinish: null, oncancel: null };
    animations.push(animation);
    return animation;
  });
  document.body.innerHTML = '<div class="friends"></div>';
});
afterEach(() => {
  delete Element.prototype.animate;
  vi.unstubAllGlobals();
});

// Ana's home-page drawing, in the row.
function ana() {
  const svg = homePal(palById('ana'));
  document.querySelector('.friends').append(svg);
  return svg;
}
const finish = (animation) => animation.onfinish?.();
const translateX = (frame) => parseFloat(frame.transform.match(/translate\((-?[\d.]+)px/)?.[1] ?? 0);

describe('the split', () => {
  it('starts and ends as one whole pal, in the middle', () => {
    for (const side of [-1, 1]) {
      const frames = splitKeyframes(side);
      expect(frames[0].transform).toBe('translate(0, 0) scale(1)');
      expect(frames.at(-1).transform).toBe('translate(0, 0) scale(1)');
    }
  });

  it('sends the two daughters opposite ways, smaller, then holds them apart', () => {
    const left = splitKeyframes(-1, 150);
    const right = splitKeyframes(1, 150);
    const [, , apart, held] = right;
    expect(translateX(apart)).toBeGreaterThan(0);
    expect(translateX(left[2])).toBe(-translateX(apart));
    expect(held.transform).toBe(apart.transform);
    expect(apart.transform).toMatch(/scale\(0\.\d+\)/);
  });

  it('moves a long pal further apart than a round one, so the two never overlap', () => {
    const long = translateX(splitKeyframes(1, 180)[2]);
    const round = translateX(splitKeyframes(1, 90)[2]);
    expect(long).toBeGreaterThan(round);
    // Each daughter is SHRINK times as wide, so they clear each other when
    // their centers are at least that far apart.
    for (const width of [90, 180]) {
      const [, , apart] = splitKeyframes(1, width);
      const shrink = parseFloat(apart.transform.match(/scale\(([\d.]+)\)/)[1]);
      expect(2 * translateX(apart)).toBeGreaterThanOrEqual(shrink * width);
    }
  });
});

describe('splitting a pal', () => {
  it('makes a second daughter just like her, and moves both', () => {
    const svg = ana();
    const before = svg.innerHTML;
    expect(split(svg)).toBe(true);

    const [cell, daughter] = svg.querySelectorAll(':scope > g.cell');
    expect(cell.innerHTML).toBe(before);
    expect(daughter.innerHTML).toBe(before);
    expect(daughter.classList.contains('daughter')).toBe(true);
    expect(animations.map((a) => a.target)).toEqual([cell, daughter]);
    expect(translateX(animations[0].keyframes[2])).toBeLessThan(0);
    expect(translateX(animations[1].keyframes[2])).toBeGreaterThan(0);
  });

  it('is one pal again once the split ends, ready to split again', () => {
    const svg = ana();
    split(svg);
    finish(animations[1]);
    expect(svg.querySelectorAll('.daughter')).toHaveLength(0);
    expect(svg.dataset.splitting).toBeUndefined();

    expect(split(svg)).toBe(true);
    // Her drawing isn't wrapped twice.
    expect(svg.querySelectorAll('g.cell > g.cell')).toHaveLength(0);
  });

  it('ignores another tap while she is still split', () => {
    const svg = ana();
    split(svg);
    expect(split(svg)).toBe(false);
    expect(svg.querySelectorAll('.daughter')).toHaveLength(1);
  });

  it('cleans up if the animation is cut short', () => {
    const svg = ana();
    split(svg);
    animations[1].oncancel();
    expect(svg.querySelectorAll('.daughter')).toHaveLength(0);
    expect(svg.dataset.splitting).toBeUndefined();
  });

  it("leaves her alone in a browser that can't animate", () => {
    delete Element.prototype.animate;
    const svg = ana();
    const before = svg.innerHTML;
    expect(split(svg)).toBe(false);
    expect(svg.innerHTML).toBe(before);
  });
});

describe('tapping', () => {
  const tap = (el) => el.dispatchEvent(new MouseEvent('click', { bubbles: true }));

  it('splits the pal you tap, even if you tap part of her drawing', () => {
    const row = document.querySelector('.friends');
    const svg = ana();
    splitOnTap(row);
    tap(svg.querySelector('path'));
    expect(svg.querySelectorAll('.daughter')).toHaveLength(1);
    expect(row.classList.contains('splittable')).toBe(true);
  });

  it('does nothing when you tap the space between pals', () => {
    const row = document.querySelector('.friends');
    ana();
    splitOnTap(row);
    tap(row);
    expect(animations).toHaveLength(0);
  });

  it("is turned off for people who've asked for less motion", () => {
    const row = document.querySelector('.friends');
    const svg = ana();
    splitOnTap(row, { matchMedia: () => ({ matches: true }) });
    tap(svg);
    expect(animations).toHaveLength(0);
    expect(row.classList.contains('splittable')).toBe(false);
  });

  it('works on the real home page', async () => {
    const page = readFileSync(resolve(process.cwd(), 'public/index.html'), 'utf8');
    document.body.outerHTML = page.slice(page.indexOf('<body'), page.indexOf('</body>'));
    vi.stubGlobal('location', { href: 'http://localhost/index.html' });
    vi.resetModules();
    await import('../public/script.js');
    const pals = document.querySelectorAll('.friends svg.pal');
    tap(pals[2]);
    expect(pals[2].querySelectorAll('.daughter')).toHaveLength(1);
    expect(pals[0].querySelectorAll('.daughter')).toHaveLength(0);
  });
});
