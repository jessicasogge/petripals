// @vitest-environment jsdom
// Doing the Gram stain step by step on the picker (game/gram-steps.js, wired
// up in game/pal-picker.js): the four dyes, on the same pals the Gram stain
// button shows, ending on exactly the colors that button gives them.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SPECIES } from '../public/game/config.js';
import { GRAM_STEPS, WASHED } from '../public/game/gram-steps.js';
import { STAINS, stainOf } from '../public/game/stain.js';

// Count the events the picker sends to GoatCounter (see game/track.js).
vi.mock('../public/game/track.js', () => ({ track: vi.fn() }));
const { track } = await import('../public/game/track.js');

const file = (name) => readFileSync(resolve(process.cwd(), 'public', name), 'utf8');

async function openPicker() {
  const html = file('pal-picker.html');
  vi.stubGlobal('location', { search: '', href: 'http://localhost/pal-picker.html', replace: vi.fn() });
  document.body.outerHTML = html.slice(html.indexOf('<body'), html.indexOf('</body>'));
  vi.resetModules();
  await import('../public/game/pal-picker.js');
}

const dyes = () => [...document.querySelectorAll('.stain-step')];
const dyeNamed = (name) => dyes().find((b) => b.textContent.includes(name));
const takeAll = (...names) => names.forEach((name) => dyeNamed(name).click());
const stepCaption = () => document.querySelector('.stain-caption').textContent;

// Styles read back as "rgb(r, g, b)", so compare on that.
const rgb = (hex) => `rgb(${[1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)).join(', ')})`;
const shadesOn = (id) => {
  const on = new Set();
  for (const el of document.querySelectorAll(`.pal-icon.${id} svg [style]`)) {
    for (const attribute of ['fill', 'stroke']) {
      const value = el.style.getPropertyValue(attribute);
      if (value) on.add(value);
    }
  }
  return on;
};
// She's painted in these shades and no others.
const paintedIn = (id, shades) => {
  const on = shadesOn(id);
  return on.size > 0 && [...on].every((v) => Object.values(shades).some((hex) => rgb(hex) === v));
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('doing the stain yourself', () => {
  it('is offered once the pals are stained, and not before', async () => {
    await openPicker();
    const cta = document.querySelector('.stain-cta');
    expect(cta.hidden).toBe(true);
    document.querySelector('.scope-btn').click();
    expect(cta.hidden).toBe(false);
    expect(cta.querySelector('.stain-btn').textContent).toBe('Do the stain yourself');
    document.querySelector('.scope-btn').click();
    expect(cta.hidden).toBe(true);
  });

  it('starts by putting her own colors back, with the first dye to tap', async () => {
    await openPicker();
    document.querySelector('.scope-btn').click();
    expect(shadesOn('goldie').size).toBeGreaterThan(0); // stained
    document.querySelector('.stain-btn').click();
    // Back to her own colors, with nothing painted over them.
    for (const id of ['goldie', 'colette']) expect(shadesOn(id).size, id).toBe(0);
    expect(dyes().map((b) => b.textContent.trim()))
      .toEqual(['Crystal violet', 'Iodine', 'Alcohol', 'Safranin']);
    expect(dyes().map((b) => b.disabled)).toEqual([false, true, true, true]);
    expect(stepCaption()).toBe('Tap crystal violet to begin.');
    // The usual caption steps aside while the steps are running.
    expect(document.querySelector('.scope-caption').hidden).toBe(true);
  });

  it('turns every cell purple with the crystal violet, the faint ones palely', async () => {
    await openPicker();
    document.querySelector('.scope-btn').click();
    document.querySelector('.stain-btn').click();
    dyeNamed('Crystal violet').click();
    for (const id of ['goldie', 'colette', 'cleo']) expect(paintedIn(id, STAINS.positive), id).toBe(true);
    // A pal who barely stains only ever goes pale, never full purple. (Her
    // shades are all from the pale set; the two sets share a hex, so it's
    // the whole set that tells them apart, not any one color.)
    for (const id of ['elia', 'marina', 'myra']) {
      expect(paintedIn(id, STAINS.faintPositive), id).toBe(true);
      expect(paintedIn(id, STAINS.positive), id).toBe(false);
    }
    expect(dyes().map((b) => b.disabled)).toEqual([true, false, true, true]);
  });

  it('changes nothing on the slide with the iodine, and says that is the point', async () => {
    await openPicker();
    document.querySelector('.scope-btn').click();
    document.querySelector('.stain-btn').click();
    takeAll('Crystal violet');
    const before = ['goldie', 'colette'].map((id) => document.querySelector(`.pal-icon.${id} svg`).outerHTML);
    takeAll('Iodine');
    expect(['goldie', 'colette'].map((id) => document.querySelector(`.pal-icon.${id} svg`).outerHTML)).toEqual(before);
    expect(stepCaption()).toMatch(/Nothing looks different yet/);
  });

  it('washes the thin walls colorless with the alcohol, and keeps the thick ones', async () => {
    await openPicker();
    document.querySelector('.scope-btn').click();
    document.querySelector('.stain-btn').click();
    takeAll('Crystal violet', 'Iodine', 'Alcohol');
    // Every pal, by her wall: this is the step the whole stain turns on.
    for (const [id, species] of Object.entries(SPECIES)) {
      if (species.gram === 'positive') {
        expect(shadesOn(id).has(rgb(STAINS.positive.body)) || shadesOn(id).has(rgb(STAINS.faintPositive.body)), id).toBe(true);
      } else {
        expect(paintedIn(id, WASHED), id).toBe(true);
      }
    }
    // Marina's waxy wall keeps her pale rather than washing her out.
    expect(paintedIn('marina', STAINS.faintPositive)).toBe(true);
    expect(stepCaption()).toMatch(/thick wall holds the purple in/);
  });

  it('ends on exactly the colors the Gram stain button shows', async () => {
    await openPicker();
    document.querySelector('.scope-btn').click();
    document.querySelector('.stain-btn').click();
    takeAll('Crystal violet', 'Iodine', 'Alcohol', 'Safranin');
    for (const [id, species] of Object.entries(SPECIES)) {
      expect(paintedIn(id, stainOf(species)), id).toBe(true);
    }
    expect(shadesOn('goldie').has(rgb(STAINS.positive.body))).toBe(true);
    expect(shadesOn('colette').has(rgb(STAINS.negative.body))).toBe(true);
    expect(shadesOn('myra').has(rgb(STAINS.faint.body))).toBe(true);
  });

  it('puts the usual caption back once the stain is done, and offers another go', async () => {
    await openPicker();
    document.querySelector('.scope-btn').click();
    document.querySelector('.stain-btn').click();
    takeAll('Crystal violet', 'Iodine', 'Alcohol', 'Safranin');
    // The dyes are all used up, so the row goes away. (The row is a flex
    // box, which would otherwise beat the browser's own [hidden] rule, so
    // the stylesheet says so too.)
    expect(document.querySelector('.stain-steps').hidden).toBe(true);
    expect(readFileSync(resolve(process.cwd(), 'public', 'styles.css'), 'utf8'))
      .toMatch(/\n\.stain-steps\[hidden\] \{\s*display: none;/);
    expect(stepCaption()).toMatch(/only shows on the cells that lost their purple/);
    // The pals look the way the button leaves them, so its caption fits again.
    expect(document.querySelector('.scope-caption').hidden).toBe(false);
    expect(document.querySelector('.stain-btn').textContent).toBe('Do the stain again');
  });

  it('leaves the steps when the Gram stain button is turned off', async () => {
    await openPicker();
    document.querySelector('.scope-btn').click();
    document.querySelector('.stain-btn').click();
    takeAll('Crystal violet');
    document.querySelector('.scope-btn').click(); // back to color
    expect(document.querySelector('.stain-steps').hidden).toBe(true);
    expect(document.querySelector('.stain-caption').hidden).toBe(true);
    expect(shadesOn('goldie').size).toBe(0);
    // Turning it on again shows the finished stain, not where the steps were.
    document.querySelector('.scope-btn').click();
    expect(paintedIn('goldie', stainOf(SPECIES.goldie))).toBe(true);
    expect(document.querySelector('.stain-steps').hidden).toBe(true);
  });

  it('reaches the pals on every page, not just the one showing', async () => {
    await openPicker();
    document.querySelector('.scope-btn').click();
    document.querySelector('.stain-btn').click();
    takeAll('Crystal violet', 'Iodine', 'Alcohol');
    // A pal on a later page is washed out too, and still is after paging.
    const later = Object.keys(SPECIES).find((id) => {
      const grid = document.querySelector(`.pal-icon.${id}`)?.closest('.picker-grid');
      return grid && grid.dataset.page !== '1';
    });
    expect(later).toBeTruthy();
    if (SPECIES[later].gram === 'negative') expect(paintedIn(later, WASHED), later).toBe(true);
    document.querySelector('.pager-more').click();
    expect(shadesOn(later).size).toBeGreaterThan(0);
  });
});

describe('the steps themselves', () => {
  it('are the four real ones, in order', () => {
    expect(GRAM_STEPS.map((s) => s.name)).toEqual(['Crystal violet', 'Iodine', 'Alcohol', 'Safranin']);
    for (const step of GRAM_STEPS) {
      expect(step.dye).toMatch(/^#[0-9a-f]{6}$/);
      expect(step.says.length).toBeGreaterThan(20);
      expect(step.says, step.name).not.toMatch(/[–—]|\s-\s/);
    }
  });

  it('finish every pal the way microscope mode does', () => {
    const last = GRAM_STEPS.at(-1);
    for (const species of Object.values(SPECIES)) {
      expect(last.shades(species)).toEqual(stainOf(species));
    }
  });
});

describe('counting how far people get', () => {
  const paths = () => track.mock.calls.map(([path]) => path);
  const open = async () => {
    track.mockClear();
    await openPicker();
  };

  it('counts turning the Gram stain on, but not turning it off', async () => {
    await open();
    expect(paths()).toEqual([]);
    document.querySelector('.scope-btn').click();
    expect(paths()).toEqual(['gram-stain/on']);
    document.querySelector('.scope-btn').click(); // back to color
    expect(paths()).toEqual(['gram-stain/on']);
  });

  it('counts the whole run: starting, each dye, and finishing', async () => {
    await open();
    document.querySelector('.scope-btn').click();
    document.querySelector('.stain-btn').click();
    takeAll('Crystal violet', 'Iodine', 'Alcohol', 'Safranin');
    expect(paths()).toEqual([
      'gram-stain/on',
      'gram-stain/started',
      'gram-stain/dye/crystal-violet',
      'gram-stain/dye/iodine',
      'gram-stain/dye/alcohol',
      'gram-stain/dye/safranin',
      'gram-stain/finished',
    ]);
    // Each one says in words what it was, for the dashboard.
    const titles = track.mock.calls.map(([, title]) => title);
    expect(titles[0]).toBe('Turned on the Gram stain');
    expect(titles.at(-1)).toBe('Finished the whole Gram stain');
  });

  it('shows where someone stopped, without counting the rest', async () => {
    await open();
    document.querySelector('.scope-btn').click();
    document.querySelector('.stain-btn').click();
    takeAll('Crystal violet', 'Iodine');
    expect(paths()).toContain('gram-stain/dye/iodine');
    expect(paths()).not.toContain('gram-stain/dye/alcohol');
    expect(paths()).not.toContain('gram-stain/finished');
  });

  it('counts each one once a visit, so one kid is not a crowd', async () => {
    await open();
    const scope = document.querySelector('.scope-btn');
    for (let i = 0; i < 3; i++) {
      scope.click(); // on
      document.querySelector('.stain-btn').click();
      takeAll('Crystal violet');
      scope.click(); // off
    }
    expect(paths()).toEqual(['gram-stain/on', 'gram-stain/started', 'gram-stain/dye/crystal-violet']);
  });
});
