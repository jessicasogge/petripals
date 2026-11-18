// @vitest-environment jsdom
// On the Plate: each pal's colonies on a streaked plate (game/colonies.js).
import { describe, expect, it } from 'vitest';
import { AGAR_NAMES, COLONIES, COMPARE, plate, platesFor } from '../public/game/colonies.js';
import { SPECIES } from '../public/game/config.js';

const IDS = Object.keys(SPECIES);
const svgOf = (id) => {
  const box = document.createElement('div');
  box.innerHTML = plate(id);
  return box.querySelector('svg');
};

describe('colonies', () => {
  it('describes every pal, and no one else', () => {
    expect(Object.keys(COLONIES).sort()).toEqual([...IDS].sort());
  });

  it.each(IDS)("%s's caption fits beside her plate and has no dashes", (id) => {
    const { caption } = COLONIES[id];
    expect(caption.length).toBeLessThanOrEqual(110);
    // Like her fun facts: hyphenated words (blue-green) are fine, dashes
    // between phrases aren't.
    expect(caption).not.toMatch(/[\u2013\u2014]|\s-\s|\d-\d/);
  });

  it.each(IDS)("draws %s's plate the same every time, with everything kept on the agar", (id) => {
    expect(plate(id)).toBe(plate(id));
    const svg = svgOf(id);
    expect(svg.getAttribute('viewBox')).toBe('0 0 200 200');
    expect(svg.querySelector(`clipPath#dish-${id}`)).not.toBeNull();
    expect(svg.querySelector('g[clip-path]').getAttribute('clip-path')).toBe(`url(#dish-${id})`);
  });

  it('gives each pal her own pattern of colonies', () => {
    const scatter = (id) => [...svgOf(id).querySelectorAll('g[clip-path] circle')].slice(0, 5).map((c) => c.getAttribute('cx'));
    expect(scatter('goldie')).not.toEqual(scatter('sara'));
  });

  it('streaks most plates: a merged band of growth, then separate colonies', () => {
    const svg = svgOf('goldie');
    // The band: many overlapping blobs, outlined all around.
    expect(svg.querySelectorAll('.band circle').length).toBeGreaterThan(150);
    expect(svg.querySelectorAll('g[clip-path] > circle').length).toBeGreaterThan(50);
    // Ivy's colonies are spread out instead, with no band.
    expect(svgOf('ivy').querySelector('.band')).toBeNull();
  });

  it('puts the right agar under her: blood agar for Scarlett, chocolate for Coco', () => {
    const agar = (id) => svgOf(id).querySelector(`#agar-${id} stop`).getAttribute('stop-color');
    expect(agar('scarlett')).toBe('#a3202a');
    expect(agar('coco')).toBe('#8a5a3c');
  });

  it('draws what she does to the agar as soft, see-through layers that don\'t pile up', () => {
    const layers = (id) => [...svgOf(id).querySelectorAll('g[class^="ring-"]')].map((g) => g.getAttribute('class'));
    expect(layers('scarlett')).toEqual(['ring-clear']);
    expect(layers('penny')).toEqual(['ring-green']);
    // Cleo's double zone: the hazy outer ring under the clear inner one.
    expect(layers('cleo')).toEqual(['ring-partial', 'ring-clear']);
    expect(layers('goldie')).toEqual([]);
    const clear = svgOf('scarlett').querySelector('.ring-clear');
    expect(Number(clear.getAttribute('opacity'))).toBeLessThan(1);
    expect(clear.getAttribute('filter')).toBe('url(#soft-scarlett)');
    // The rings sit under her colonies, which are solid, so they read as agar.
    const inside = svgOf('scarlett').querySelector('g[clip-path]');
    expect(inside.firstElementChild.getAttribute('class')).toBe('ring-clear');
  });

  it("spills Vera's blackening into the agar in irregular patches, not neat rings", () => {
    const black = svgOf('vera').querySelector('.ring-black');
    expect(black.querySelector('circle')).toBeNull();
    expect(black.querySelectorAll('path').length).toBeGreaterThan(50);
    expect(black.getAttribute('filter')).toBe('url(#spill-vera)');
  });

  it("leaves Elia's plate empty: she doesn't grow on ordinary agar", () => {
    expect(svgOf('elia').querySelector('g[clip-path]').children).toHaveLength(0);
    expect(COLONIES.elia.caption).toMatch(/won't grow/);
  });

  it('spreads Ivy out in a few big rootlike colonies, not a streak', () => {
    const svg = svgOf('ivy');
    expect(svg.querySelectorAll('g[clip-path] path[stroke="#fbf8ee"]').length).toBeGreaterThan(50);
  });

  it('covers Terra\'s plate in a thin film, and gives Sallie black centers', () => {
    expect(svgOf('terra').querySelector('g[clip-path] > path[opacity="0.35"]')).not.toBeNull();
    expect(svgOf('terra').querySelector('.ring-clear path')).not.toBeNull();
    expect([...svgOf('sallie').querySelectorAll('circle')].some((c) => c.getAttribute('fill') === '#1f1a1a')).toBe(true);
  });

  it('gives Colette and Mona a metallic sheen', () => {
    for (const id of ['colette', 'mona']) expect(svgOf(id).querySelector(`linearGradient#colony-${id}`)).not.toBeNull();
    expect(svgOf('goldie').querySelector('linearGradient')).toBeNull();
  });
});

describe('comparison plates', () => {
  const COMPARED = ['blood', 'macconkey', 'chocolate'];
  const grows = (id, kind) => svgOf2(id, kind).querySelector('g[clip-path]').children.length > 0;
  const svgOf2 = (id, kind) => {
    const box = document.createElement('div');
    box.innerHTML = plate(id, kind);
    return box.querySelector('svg');
  };

  it('tries every pal but Elia on blood, MacConkey and chocolate agar, after her own plate', () => {
    for (const id of IDS) {
      const kinds = platesFor(id).map((p) => p.kind);
      expect(kinds[0], id).toBe('home');
      if (id === 'elia') {
        expect(kinds, id).toEqual(['home']);
        continue;
      }
      // Each of the three, unless it's already her own plate.
      const own = COLONIES[id].agar;
      expect(kinds.slice(1).sort(), id).toEqual(COMPARED.filter((k) => k !== own).sort());
    }
  });

  it('names every plate on its button', () => {
    for (const id of IDS) {
      for (const { name } of platesFor(id)) expect(typeof name, id).toBe('string');
    }
    expect(platesFor('colette').map((p) => p.name)).toEqual(['EMB', 'Blood agar', 'MacConkey', 'Chocolate agar']);
    expect(platesFor('myra')[0].name).toBe('SP4 agar');
    expect(Object.keys(AGAR_NAMES)).toEqual(expect.arrayContaining(Object.values(COLONIES).map((c) => c.agar)));
  });

  it.each(IDS.filter((id) => COMPARE[id]))("%s's comparison captions fit and have no dashes", (id) => {
    for (const { caption } of platesFor(id)) {
      expect(caption.length).toBeLessThanOrEqual(110);
      expect(caption).not.toMatch(/[–—]|\s-\s|\d-\d/);
    }
  });

  it("gives each of a pal's plates its own names inside, so they can share a page", () => {
    for (const id of IDS) {
      const ids = platesFor(id).flatMap(({ kind }) => [...svgOf2(id, kind).querySelectorAll('[id]')].map((el) => el.id));
      expect(new Set(ids).size, id).toBe(ids.length);
    }
  });

  it('stops every Gram-positive pal on MacConkey, except Vera, who grows there anyway', () => {
    for (const id of IDS.filter((id) => SPECIES[id].gram === 'positive' && COMPARE[id]?.macconkey)) {
      expect(grows(id, 'macconkey'), id).toBe(id === 'vera');
    }
    expect(platesFor('scarlett').find((p) => p.kind === 'macconkey').caption).toMatch(/Gram-positive/);
  });

  it('turns lactose fermenters pink on MacConkey, and leaves the rest pale', () => {
    const pink = (id) => svgOf2(id, 'macconkey').querySelector('.ring-pink') !== null;
    for (const id of ['colette', 'pearl', 'kiki']) expect(pink(id), id).toBe(true);
    for (const id of ['sallie', 'vi', 'mona']) expect(pink(id), id).toBe(false);
    expect(grows('sallie', 'macconkey')).toBe(true);
  });

  it("only grows Coco once the blood is heated, and hides Scarlett's rings on chocolate agar", () => {
    expect(grows('coco', 'blood')).toBe(false);
    expect(grows('coco', 'home')).toBe(true); // her own plate is chocolate agar
    expect(svgOf2('scarlett', 'chocolate').querySelector('.ring-clear')).toBeNull();
    expect(grows('scarlett', 'chocolate')).toBe(true);
    // Goldie and Ceres break blood cells on blood agar, but not on their own plain agar.
    expect(svgOf2('goldie', 'blood').querySelector('.ring-clear')).not.toBeNull();
    expect(svgOf2('goldie').querySelector('.ring-clear')).toBeNull();
  });

  it('keeps her own look on other plates unless it changes there', () => {
    // Ivy still branches, Terra still swarms.
    expect(svgOf2('ivy', 'blood').querySelector('.band')).toBeNull();
    expect(svgOf2('terra', 'chocolate').querySelector('g[clip-path] > path[opacity="0.35"]')).not.toBeNull();
    // Sallie's black centers are her XLD plate's, not blood agar's.
    expect([...svgOf2('sallie', 'blood').querySelectorAll('circle')].some((c) => c.getAttribute('fill') === '#1f1a1a')).toBe(false);
  });

  it('draws each plate on its own agar', () => {
    const agar = (id, kind) => svgOf2(id, kind).querySelector('[id^="agar-"] stop').getAttribute('stop-color');
    expect(agar('colette', 'macconkey')).toBe('#e98fae');
    expect(agar('colette', 'blood')).toBe('#a3202a');
    expect(agar('colette', 'chocolate')).toBe('#8a5a3c');
  });
});

