// @vitest-environment jsdom
// The pals' drawings (pals.js), and the pages that draw them: the home page,
// the picker, the mode page and the petri dish. The pages are loaded into
// jsdom, a simulated browser page.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SPECIES } from '../public/game/config.js';
import { dishPal, homePal, palById, PALS, palTile } from '../public/game/pals.js';

// (jsdom changes import.meta.url to a web address, so find files from the project folder.)
const file = (name) => readFileSync(resolve(process.cwd(), 'public', name), 'utf8');
const css = file('styles.css');
const IDS = PALS.map((pal) => pal.id);

// Open `page` at `search` and run `script` on it.
async function open(page, script, search = '') {
  const html = file(page);
  vi.stubGlobal('location', { search, href: `http://localhost/${page}${search}`, replace: vi.fn() });
  document.body.outerHTML = html.slice(html.indexOf('<body'), html.indexOf('</body>'));
  vi.resetModules();
  await import(`../public/${script}`);
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('the pals', () => {
  it('are the same pals as in config.js, each once', () => {
    expect([...IDS].sort()).toEqual(Object.keys(SPECIES).sort());
    expect(new Set(IDS).size).toBe(IDS.length);
  });

  it('are in the order they appear on the home page and picker', () => {
    expect(IDS).toEqual(['penny', 'vi', 'goldie', 'ana', 'scarlett', 'coco', 'mona', 'elia']);
  });

  it.each(PALS)('$id has a name and a description', (pal) => {
    expect(pal.name).toMatch(/^[A-Z][a-z]+$/);
    // Her species is in the description, so a screen reader says what she is.
    expect(pal.looks).toContain(SPECIES[pal.id].scientific.split(' ')[0]);
  });

  it.each(PALS)("$id's idle animation and tile color are in styles.css", (pal) => {
    expect(css).toMatch(new RegExp(`\\n\\.${pal.motion} \\{[^}]*animation:`));
    expect(css).toMatch(new RegExp(`\\n\\.${pal.id} \\{[^}]*background:`));
  });

  it.each(PALS)('$id is framed for every page', (pal) => {
    expect(Object.keys(pal.frames).sort()).toEqual(['dish', 'home', 'picker']);
    for (const box of Object.values(pal.frames)) {
      // x y width height, and square, since every page shows her in a square.
      const [, , w, h] = box.split(' ').map(Number);
      expect(box).toMatch(/^-?[\d.]+ -?[\d.]+ [\d.]+ [\d.]+$/);
      expect(w).toBe(h);
    }
  });

  it.each(PALS.filter((pal) => SPECIES[pal.id].kind === 'rod'))(
    "$id's face can be hidden (offspring rods are copies of her, without a face)",
    (pal) => {
      expect(palTile(pal).querySelector('.face')).not.toBeNull();
    },
  );

  it('are found by id, and nothing else is', () => {
    expect(palById('ana').name).toBe('Ana');
    expect(palById('toString')).toBeUndefined();
    expect(palById(null)).toBeUndefined();
  });
});

describe('her drawing', () => {
  const ana = palById('ana');

  it('is real SVG, not just text', () => {
    const svg = homePal(ana);
    expect(svg.namespaceURI).toBe('http://www.w3.org/2000/svg');
    expect(svg.querySelector('path').namespaceURI).toBe('http://www.w3.org/2000/svg');
  });

  it('on the home page, animates and says who she is', () => {
    const svg = homePal(ana);
    expect(svg.getAttribute('viewBox')).toBe(ana.frames.home);
    expect(svg.getAttribute('class')).toBe('pal bob');
    expect(svg.getAttribute('role')).toBe('img');
    expect(svg.getAttribute('aria-label')).toBe(`Ana, ${ana.looks}`);
  });

  it('on the home page, keeps Vi a little smaller', () => {
    expect(homePal(palById('vi')).style.width).toBe('108px');
    expect(homePal(ana).style.width).toBe('');
  });

  it('on a tile, has her tile color and is hidden from screen readers', () => {
    const tile = palTile(ana);
    expect(tile.className).toBe('pal-icon ana');
    expect(tile.firstChild.getAttribute('viewBox')).toBe(ana.frames.picker);
    expect(tile.firstChild.getAttribute('aria-hidden')).toBe('true');
  });

  it('in the dish, starts hidden and carries her id and name', () => {
    const svg = dishPal(ana);
    expect(svg.getAttribute('viewBox')).toBe(ana.frames.dish);
    expect(svg.getAttribute('class')).toBe('dish-pal bob');
    expect(svg.dataset).toMatchObject({ pal: 'ana', name: 'Ana' });
    expect(svg.hasAttribute('hidden')).toBe(true);
  });
});

describe('the pages', () => {
  it('home shows every pal, in order', async () => {
    await open('index.html', 'script.js');
    const labels = [...document.querySelectorAll('.friends svg')].map((s) => s.getAttribute('aria-label'));
    expect(labels).toEqual(PALS.map((pal) => `${pal.name}, ${pal.looks}`));
  });

  it('the picker has a card for every pal, in order, linking to her', async () => {
    await open('pal-picker.html', 'game/pal-picker.js');
    const cards = [...document.querySelectorAll('.pal-card')];
    expect(cards.map((c) => c.querySelector('h2').textContent)).toEqual(PALS.map((pal) => pal.name));
    for (const [i, card] of cards.entries()) {
      const { id, name } = PALS[i];
      expect(card.querySelector('.pal-icon').classList).toContain(id);
      expect(card.querySelector('.species i').textContent).toBe(SPECIES[id].scientific);
      expect(card.querySelector('a').getAttribute('href')).toBe(`./choose-mode.html?pal=${id}`);
      expect(card.querySelector('a').textContent).toBe(`Select ${name}`);
    }
  });

  it('the mode page shows the pal picked, with her name in her color', async () => {
    await open('choose-mode.html', 'game/choose-mode.js', '?pal=coco');
    expect(document.querySelector('.mode-pal .pal-icon').classList).toContain('coco');
    const name = document.querySelector('.mode-pal-name');
    expect(name.textContent).toBe('Coco');
    const expected = document.createElement('span');
    expected.style.color = SPECIES.coco.color;
    expect(name.style.color).toBe(expected.style.color);
    expect(document.title).toBe('PetriPals | Coco | Choose a Mode');
    expect(document.querySelector('.mode-mixed').getAttribute('href')).toBe('./petri-dish.html?pal=coco&mode=mixed');
  });

  it('the mode page sends an unknown pal back to the picker', async () => {
    await open('choose-mode.html', 'game/choose-mode.js', '?pal=nobody');
    expect(location.replace).toHaveBeenCalledWith('./pal-picker.html');
    expect(document.querySelector('.mode-pal').children).toHaveLength(0);
  });

  it("the pages don't draw any pals by hand", () => {
    for (const page of ['index.html', 'pal-picker.html', 'choose-mode.html', 'petri-dish.html']) {
      expect(file(page), page).not.toContain('<svg');
    }
  });
});

describe('wiggly flagella', () => {
  const swimmers = PALS.filter((pal) => pal.art.includes('class="flagellum"'));

  it('gives Mona and Vi, who swim with a flagellum, a wiggling tail', () => {
    expect(swimmers.map((pal) => pal.id).sort()).toEqual(['mona', 'vi']);
  });

  it.each(swimmers.map((pal) => pal.id))("starts %s's wiggle from the tail as drawn and loops smoothly", (id) => {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.innerHTML = PALS.find((pal) => pal.id === id).art;
    const tail = svg.querySelector('.flagellum');
    const frames = tail.querySelector('animate').getAttribute('values').split(';');
    expect(frames[0]).toBe(tail.getAttribute('d'));
    expect(frames.at(-1)).toBe(frames[0]);
    // Every frame keeps the same shape of path, so the browser can blend them.
    for (const frame of frames) expect(frame).toMatch(/^M[\d.]+ [\d.]+ C([\d.]+ ){5}[\d.]+$/);
  });
});

describe('for anyone who prefers less motion', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('leaves the flagellum still', () => {
    vi.stubGlobal('matchMedia', (query) => ({ matches: query.includes('reduce') }));
    expect(dishPal(palById('mona')).querySelector('.flagellum animate')).toBeNull();
  });

  it('wiggles it otherwise', () => {
    vi.stubGlobal('matchMedia', () => ({ matches: false }));
    expect(dishPal(palById('mona')).querySelector('.flagellum animate')).not.toBeNull();
  });
});

describe('where the flagellum wiggles', () => {
  const wiggles = (svg) => svg.querySelector('.flagellum animate') !== null;
  const svgIn = (el) => (el.tagName.toLowerCase() === 'svg' ? el : el.querySelector('svg'));

  it.each(['mona', 'vi'])('wiggles on the home page (%s)', (id) => {
    expect(wiggles(svgIn(homePal(palById(id))))).toBe(true);
  });

  it.each(['mona', 'vi'])('stays still on the picker (%s)', (id) => {
    expect(wiggles(svgIn(palTile(palById(id))))).toBe(false);
  });

  it.each(['mona', 'vi'])('can wiggle in the dish, while she swims (%s)', (id) => {
    expect(wiggles(dishPal(palById(id)))).toBe(true);
  });
});
