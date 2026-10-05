// @vitest-environment jsdom
// The rival screen before a mixed culture race: pick up to three other pals,
// or Surprise me for one at random.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MIXED, SPECIES } from '../public/game/config.js';
import { PALS } from '../public/game/pals.js';

const page = readFileSync(resolve(process.cwd(), 'public/choose-rivals.html'), 'utf8');
let location;

async function open(search) {
  location = { search, href: `http://localhost/choose-rivals.html${search}`, replace: vi.fn() };
  vi.stubGlobal('location', location);
  document.body.outerHTML = page.slice(page.indexOf('<body'), page.indexOf('</body>'));
  vi.resetModules();
  await import('../public/game/choose-rivals.js');
}

const button = (pal) => document.querySelector(`.rival-btn[data-pal="${pal}"]`);
const start = () => document.querySelector('.start-race');
const status = () => document.querySelector('.rivals-status').textContent;

afterEach(() => vi.unstubAllGlobals());

describe('picking rivals', () => {
  it('offers every pal but yours, each once', async () => {
    await open('?pal=mona');
    const offered = [...document.querySelectorAll('.rival-btn')].map((b) => b.dataset.pal);
    expect(offered).toEqual(PALS.map((pal) => pal.id).filter((id) => id !== 'mona'));
  });

  it('shows you and your name in your color', async () => {
    await open('?pal=coco');
    expect(document.querySelector('.mode-pal .pal-icon').classList).toContain('coco');
    expect(document.querySelector('.mode-pal-name').textContent).toBe('Coco');
    expect(document.title).toBe('PetriPals | Coco | Pick Your Rivals');
    const expected = document.createElement('span');
    expected.style.color = SPECIES.coco.color;
    expect(document.querySelector('.mode-pal-name').style.color).toBe(expected.style.color);
  });

  it("can't start until at least one rival is picked", async () => {
    await open('?pal=mona');
    expect(start().disabled).toBe(true);
    expect(status()).toBe(`Pick up to ${MIXED.MAX_RIVALS} rivals.`);
    button('vi').click();
    expect(start().disabled).toBe(false);
    expect(button('vi').getAttribute('aria-pressed')).toBe('true');
    expect(status()).toBe('1 rival picked: race to 64 cells.');
  });

  it('tapping a picked rival again lets her go', async () => {
    await open('?pal=mona');
    button('vi').click();
    button('vi').click();
    expect(button('vi').getAttribute('aria-pressed')).toBe('false');
    expect(start().disabled).toBe(true);
  });

  it(`stops at ${MIXED.MAX_RIVALS}, racing to 32 cells`, async () => {
    await open('?pal=mona');
    for (const pal of ['vi', 'elia', 'ceres']) button(pal).click();
    expect(status()).toBe("3 rivals picked: race to 32 cells. That's a full dish!");
    expect(button('coco').disabled).toBe(true);
    button('coco').click(); // can't be picked, even if the click gets through
    expect(button('coco').getAttribute('aria-pressed')).toBe('false');
    button('elia').click(); // let one go, and the rest open up again
    expect(button('coco').disabled).toBe(false);
    expect(status()).toBe('2 rivals picked: race to 32 cells.');
  });

  it('Start race goes to the dish with the rivals, in the order picked', async () => {
    await open('?pal=mona');
    button('ceres').click();
    button('vi').click();
    start().click();
    expect(location.href).toBe('./petri-dish.html?pal=mona&mode=mixed&rivals=ceres,vi');
  });

  it('Surprise me races one random rival, and Back goes to the modes', async () => {
    await open('?pal=mona');
    expect(document.querySelector('.surprise-me').getAttribute('href')).toBe('./petri-dish.html?pal=mona&mode=mixed');
    expect(document.querySelector('.back-link').getAttribute('href')).toBe('./choose-mode.html?pal=mona');
  });

  it('sends an unknown pal back to the picker', async () => {
    await open('?pal=nobody');
    expect(location.replace).toHaveBeenCalledWith('./pal-picker.html');
    expect(document.querySelectorAll('.rival-btn')).toHaveLength(0);
  });
});
