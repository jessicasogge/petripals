// Checks that the game's settings in config.js are complete, sensible, and
// match what the pages show.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { GAME, LEVELS, SPECIES } from '../public/game/config.js';

const PALS = Object.keys(SPECIES);
const page = (name) => readFileSync(new URL(`../public/${name}`, import.meta.url), 'utf8');

// How readable one color is on another (WCAG contrast ratio, 1 to 21).
function contrast(a, b) {
  const luminance = (hex) => {
    const [r, g, b2] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
    const lin = (c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
    return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b2);
  };
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

describe('pals', () => {
  it('has all six pals', () => {
    expect(PALS.sort()).toEqual(['coco', 'elia', 'goldie', 'mona', 'scarlett', 'vi']);
  });

  it.each(PALS)('%s is either a rod or a coccus, with what that kind needs', (pal) => {
    const species = SPECIES[pal];
    expect(['rod', 'coccus']).toContain(species.kind);
    if (species.kind === 'rod') {
      expect(species.body.length).toBeGreaterThan(0);
      if (species.size !== undefined) {
        expect(species.size).toBeGreaterThan(0);
        expect(species.size).toBeLessThanOrEqual(12);
      }
    } else {
      expect(['chain', 'cluster']).toContain(species.layout);
      for (const part of ['fill', 'stroke', 'highlight', 'dark']) {
        expect(species.colors[part]).toMatch(/^#[0-9a-f]{6}$/i);
      }
    }
  });

  it('makes Scarlett a chain (Streptococcus) and Goldie a cluster (Staphylococcus)', () => {
    expect(SPECIES.scarlett.layout).toBe('chain');
    expect(SPECIES.goldie.layout).toBe('cluster');
  });
});

describe('names above the dish', () => {
  it.each(PALS)("writes %s's species the scientific way: Genus species", (pal) => {
    expect(SPECIES[pal].scientific).toMatch(/^[A-Z][a-z]+ [a-z]+$/);
  });

  it.each(PALS)("matches %s's species name on the picker", (pal) => {
    const picker = page('pal-picker.html');
    // The picker card for this pal links to her dish and shows her species.
    const card = picker.slice(0, picker.indexOf(`petri-dish.html?pal=${pal}"`));
    const shown = [...card.matchAll(/<i>([^<]+)<\/i>/g)].at(-1)[1];
    expect(SPECIES[pal].scientific).toBe(shown);
  });

  it.each(PALS)("has a drawing for %s on the dish page", (pal) => {
    expect(page('petri-dish.html')).toContain(`data-pal="${pal}"`);
  });

  it.each(PALS)("colors %s's name so it's easy to read on the page", (pal) => {
    expect(SPECIES[pal].color).toMatch(/^#[0-9a-f]{6}$/i);
    // The page behind the title is a pale mint (#dcfcf5). 3:1 is the
    // standard minimum for large, bold text like her name.
    expect(contrast(SPECIES[pal].color, '#dcfcf5')).toBeGreaterThanOrEqual(3);
  });

  it('gives every pal her own name color', () => {
    const colors = PALS.map((pal) => SPECIES[pal].color.toLowerCase());
    expect(new Set(colors).size).toBe(colors.length);
  });
});

describe('levels', () => {
  it('get harder every level: one more disk and a bigger colony to grow', () => {
    for (let i = 1; i < LEVELS.length; i++) {
      expect(LEVELS[i].disks).toBe(LEVELS[i - 1].disks + 1);
      expect(LEVELS[i].target).toBeGreaterThan(LEVELS[i - 1].target);
    }
  });

  it('start with one disk and a small colony', () => {
    expect(LEVELS[0]).toEqual({ disks: 1, target: 4 });
  });
});

describe('game settings', () => {
  it('are all positive numbers', () => {
    for (const [name, value] of Object.entries(GAME)) {
      expect(typeof value, name).toBe('number');
      expect(value, name).toBeGreaterThan(0);
    }
  });

  it('keep the disks inside the dish and clear of where the pal starts', () => {
    expect(GAME.DISK_MIN_DISTANCE).toBeLessThan(GAME.DISK_MAX_DISTANCE);
    // The farthest disk, buffer and all, still sits inside the rim.
    expect(GAME.DISK_MAX_DISTANCE + GAME.DISK_RADIUS + GAME.DISK_BUFFER).toBeLessThan(1);
  });

  it('count a touch with a much smaller margin than the space offspring keep from disks', () => {
    expect(GAME.TOUCH_MARGIN).toBeLessThan(GAME.DISK_BUFFER);
  });

  it('let a chain or cluster hold at least a few cells', () => {
    expect(Number.isInteger(GAME.GROUP_CAP)).toBe(true);
    expect(GAME.GROUP_CAP).toBeGreaterThanOrEqual(4);
  });
});
