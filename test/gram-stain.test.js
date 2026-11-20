// @vitest-environment jsdom
// The Gram stain mini-game (gram-stain.html): four steps on a slide of three
// pals, ending in the same colors the picker's Gram stain button shows.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SPECIES } from '../public/game/config.js';
import { STAINS, stainOf } from '../public/game/stain.js';

const file = (name) => readFileSync(resolve(process.cwd(), 'public', name), 'utf8');

async function open() {
  const html = file('gram-stain.html');
  document.body.outerHTML = html.slice(html.indexOf('<body'), html.indexOf('</body>'));
  vi.resetModules();
  await import('../public/game/gram-stain.js');
}

const steps = () => [...document.querySelectorAll('.stain-step')];
const stepNamed = (name) => steps().find((b) => b.textContent.includes(name));
const cellOf = (id) => document.querySelector(`.stain-cell.${id} svg`);
const caption = () => document.querySelector('.stain-caption').textContent;

// The shades she's painted in now, read off the styles the stain set.
const shadesOn = (id) => {
  const painted = new Set();
  for (const el of cellOf(id).querySelectorAll('[style]')) {
    for (const attribute of ['fill', 'stroke']) {
      const value = el.style.getPropertyValue(attribute);
      if (value) painted.add(value);
    }
  }
  return painted;
};
// Styles read back as "rgb(r, g, b)", so compare on that.
const rgb = (hex) => `rgb(${[1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)).join(', ')})`;
const paintedIn = (id, shades) => {
  const on = shadesOn(id);
  // Every shade she shows is one of these, and she shows at least her body.
  return on.size > 0 && [...on].every((value) => Object.values(shades).some((hex) => rgb(hex) === value));
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('the Gram stain mini-game', () => {
  it('puts one of each ending on the slide, in her own colors to start', async () => {
    await open();
    const names = [...document.querySelectorAll('.stain-cell figcaption')].map((c) => c.textContent);
    expect(names).toEqual(['Goldie', 'Colette', 'Myra']);
    // A thick wall, a thin wall, and one who barely stains at all.
    expect(SPECIES.goldie.gram).toBe('positive');
    expect(SPECIES.colette.gram).toBe('negative');
    expect(SPECIES.myra.faintStain).toBe(true);
    // Nothing painted yet.
    for (const id of ['goldie', 'colette', 'myra']) expect(shadesOn(id).size, id).toBe(0);
    expect(caption()).toMatch(/Tap the first dye/);
  });

  it('offers the four dyes in order, one at a time', async () => {
    await open();
    expect(steps().map((b) => b.textContent.trim())).toEqual(['Crystal violet', 'Iodine', 'Alcohol', 'Safranin']);
    // Only the first can be tapped.
    expect(steps().map((b) => b.disabled)).toEqual([false, true, true, true]);
    steps()[0].click();
    expect(steps().map((b) => b.disabled)).toEqual([true, false, true, true]);
    expect(steps()[0].classList.contains('done')).toBe(true);
    expect(steps()[1].classList.contains('next')).toBe(true);
  });

  it('turns every cell purple with the crystal violet', async () => {
    await open();
    stepNamed('Crystal violet').click();
    for (const id of ['goldie', 'colette', 'myra']) expect(paintedIn(id, STAINS.positive), id).toBe(true);
    expect(caption()).toMatch(/soaks up the purple/);
  });

  it('leaves them all purple after the iodine, and says that is the point', async () => {
    await open();
    stepNamed('Crystal violet').click();
    const before = ['goldie', 'colette', 'myra'].map((id) => cellOf(id).outerHTML);
    stepNamed('Iodine').click();
    // The step you can't see: nothing on the slide changes.
    expect(['goldie', 'colette', 'myra'].map((id) => cellOf(id).outerHTML)).toEqual(before);
    expect(caption()).toMatch(/Nothing looks different yet/);
    expect(caption()).toMatch(/locks the purple inside/);
  });

  it('washes the purple out of the thin walls with the alcohol, and keeps the thick one', async () => {
    await open();
    for (const name of ['Crystal violet', 'Iodine', 'Alcohol']) stepNamed(name).click();
    // Goldie's thick wall holds the dye.
    expect(paintedIn('goldie', STAINS.positive)).toBe(true);
    // Colette and Myra are washed out: no purple left on either.
    for (const id of ['colette', 'myra']) {
      expect(paintedIn(id, STAINS.positive), id).toBe(false);
      expect([...shadesOn(id)].includes(rgb(STAINS.positive.body)), id).toBe(false);
    }
    expect(caption()).toMatch(/thick wall holds the purple in/);
  });

  it('ends in the same colors the picker shows, and says so', async () => {
    await open();
    for (const name of ['Crystal violet', 'Iodine', 'Alcohol', 'Safranin']) stepNamed(name).click();
    // Exactly microscope mode: purple, pink, and Myra's pale pink.
    for (const id of ['goldie', 'colette', 'myra']) {
      expect(paintedIn(id, stainOf(SPECIES[id])), id).toBe(true);
    }
    expect(shadesOn('goldie').has(rgb(STAINS.positive.body))).toBe(true);
    expect(shadesOn('colette').has(rgb(STAINS.negative.body))).toBe(true);
    expect(shadesOn('myra').has(rgb(STAINS.faint.body))).toBe(true);
    expect(caption()).toMatch(/the same colors the picker shows/);
    // Nothing left to tap.
    expect(steps().every((b) => b.disabled)).toBe(true);
  });

  it('starts over, back to her own colors', async () => {
    await open();
    const again = document.querySelector('.stain-again');
    expect(again.hidden).toBe(true);
    stepNamed('Crystal violet').click();
    expect(again.hidden).toBe(false);
    again.click();
    for (const id of ['goldie', 'colette', 'myra']) expect(shadesOn(id).size, id).toBe(0);
    expect(steps().map((b) => b.disabled)).toEqual([false, true, true, true]);
    expect(again.hidden).toBe(true);
    expect(caption()).toMatch(/Tap the first dye/);
  });
});

describe('the way in from the picker', () => {
  it('sits with the Gram stain caption, and shows and hides with it', async () => {
    const html = file('pal-picker.html');
    document.body.outerHTML = html.slice(html.indexOf('<body'), html.indexOf('</body>'));
    vi.stubGlobal('location', { search: '', href: 'http://localhost/pal-picker.html', replace: vi.fn() });
    vi.resetModules();
    await import('../public/game/pal-picker.js');

    const cta = document.querySelector('.stain-cta');
    expect(cta.querySelector('a').getAttribute('href')).toBe('./gram-stain.html');
    // Hidden until the Gram stain button is on, like the caption it follows.
    expect(cta.hidden).toBe(true);
    document.querySelector('.scope-btn').click();
    expect(cta.hidden).toBe(false);
    expect(document.querySelector('.scope-caption').hidden).toBe(false);
    document.querySelector('.scope-btn').click();
    expect(cta.hidden).toBe(true);
  });
});
