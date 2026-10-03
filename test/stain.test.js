// @vitest-environment jsdom
// Microscope mode (stain.js): every pal in her Gram stain colors, the same
// few shades for every pal of a stain, and Elia only faintly.
import { describe, expect, it } from 'vitest';
import { SPECIES } from '../public/game/config.js';
import { dishPal, PALS, palById } from '../public/game/pals.js';
import { STAINS, stainOf, stainPal, unstainPal } from '../public/game/stain.js';

// Every color her drawing shows: inline style if set, otherwise its own attribute.
function shown(svg, { skipFace = true } = {}) {
  const colors = new Set();
  for (const el of svg.querySelectorAll('[fill], [stroke]')) {
    if (skipFace && el.closest('.face')) continue;
    for (const attr of ['fill', 'stroke']) {
      const value = el.style.getPropertyValue(attr) || el.getAttribute(attr);
      if (value && value !== 'none') colors.add(value.toLowerCase());
    }
  }
  return colors;
}
// jsdom reports colors set in style as rgb(); turn a hex into the same form.
function rgb(hex) {
  const el = document.createElement('span');
  el.style.color = hex;
  return el.style.color;
}
const allowed = (stain) => new Set([...Object.values(stain).map(rgb), 'white', '#fff', '#ffffff'].map((c) => c.toLowerCase()));

describe('the stain shades', () => {
  it('gives Gram-positive pals purple, Gram-negative pink, and Elia faint', () => {
    expect(stainOf(SPECIES.goldie)).toBe(STAINS.positive);
    expect(stainOf(SPECIES.vi)).toBe(STAINS.negative);
    expect(stainOf(SPECIES.elia)).toBe(STAINS.faint);
  });

  it.each(PALS.map((pal) => pal.id))('recolors %s in only her stain shades (besides white shines)', (id) => {
    const svg = dishPal(palById(id));
    stainPal(svg, SPECIES[id]);
    const ok = allowed(stainOf(SPECIES[id]));
    for (const color of shown(svg)) expect(ok.has(color), `${id}: ${color}`).toBe(true);
  });

  it('makes every pal of a stain the same body color, so they match', () => {
    for (const gram of ['positive', 'negative']) {
      const bodies = new Set();
      for (const pal of PALS.filter((p) => SPECIES[p.id].gram === gram && !SPECIES[p.id].faintStain)) {
        const svg = dishPal(pal);
        stainPal(svg, SPECIES[pal.id]);
        // Each uses her stain's body shade somewhere.
        expect(shown(svg).has(rgb(STAINS[gram].body)), pal.id).toBe(true);
        bodies.add(rgb(STAINS[gram].body));
      }
      expect(bodies.size).toBe(1);
    }
  });

  it("leaves her cheeks and the whites of her eyes alone, but stains her eyes", () => {
    const svg = dishPal(palById('vi'));
    stainPal(svg, SPECIES.vi);
    const face = shown(svg, { skipFace: false });
    expect(face.has(rgb(STAINS.negative.eyes))).toBe(true);
    expect([...svg.querySelectorAll('.face [fill="white"]')].every((el) => !el.style.fill)).toBe(true);
  });

  it('puts her own colors back', () => {
    const svg = dishPal(palById('mona'));
    const before = shown(svg);
    stainPal(svg, SPECIES.mona);
    expect(shown(svg)).not.toEqual(before);
    unstainPal(svg);
    expect(shown(svg)).toEqual(before);
  });
});
