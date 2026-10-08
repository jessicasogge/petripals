// Checks that the game's settings in config.js are complete and sensible.
// (The pals' names and drawings are checked in pals.test.js.)
import { describe, expect, it } from 'vitest';
import { GAME, LEVELS, SPECIES } from '../public/game/config.js';

const PALS = Object.keys(SPECIES);

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
  it('keys every pal by a short lowercase id, used in addresses like ?pal=mona', () => {
    expect(PALS.length).toBeGreaterThan(1);
    for (const pal of PALS) expect(pal).toMatch(/^[a-z]+$/);
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

  it('makes Penny a Streptococcus whose chains stop at pairs (Streptococcus pneumoniae)', () => {
    expect(SPECIES.penny.kind).toBe('coccus');
    expect(SPECIES.penny.layout).toBe('chain');
    expect(SPECIES.penny.maxCells).toBe(2);
  });

  it('makes Sallie a rod that swims apart after dividing, like Mona', () => {
    expect(SPECIES.sallie.kind).toBe('rod');
    expect(SPECIES.sallie.layout).toBeUndefined();
    expect(SPECIES.sallie.gram).toBe('negative');
  });

  it('makes Terra a rod that swims apart after dividing, with her spore end traced wider than her rod', () => {
    const { kind, gram, body } = SPECIES.terra;
    expect(kind).toBe('rod');
    expect(gram).toBe('positive');
    const widest = Math.max(...body.map(([, , r]) => r));
    expect(body.at(-1)[2]).toBe(widest); // the spore, at her front end
    expect(body.at(-1)[0]).toBe(Math.max(...body.map(([x]) => x)));
  });

  it("makes Diffany a big Gram-positive rod with her spore's bulge near her front end, not at the tip like Terra's", () => {
    const { kind, gram, size, body } = SPECIES.diffany;
    expect(kind).toBe('rod');
    expect(gram).toBe('positive');
    expect(size).toBeGreaterThan(SPECIES.terra.size);
    const widest = Math.max(...body.map(([, , r]) => r));
    const [x, , r] = body.at(-1); // the bulge over her spore
    expect(r).toBe(widest);
    // Toward her front end, but no farther out than her rod's tip.
    const rodTip = Math.max(...body.slice(0, -1).map(([bx, , br]) => bx + br));
    expect(x).toBeGreaterThan(0);
    expect(x + r).toBeLessThanOrEqual(rodTip + 1e-9);
  });

  it('makes Lissie a Gram-positive rod that tumbles apart after dividing, like Sallie', () => {
    expect(SPECIES.lissie.kind).toBe('rod');
    expect(SPECIES.lissie.layout).toBeUndefined();
    expect(SPECIES.lissie.gram).toBe('positive');
  });

  it('makes Ivy a Bacillus like Ceres: rod-shaped cells in chains, longer than hers', () => {
    expect(SPECIES.ivy.kind).toBe('coccus'); // grows with the chain code
    expect(SPECIES.ivy.layout).toBe('chain');
    expect(SPECIES.ivy.shape).toBe('rod');
    expect(SPECIES.ivy.maxCells).toBeGreaterThan(SPECIES.ceres.maxCells);
  });

  it('makes Ceres a Bacillus: rod-shaped cells in short chains of up to three', () => {
    expect(SPECIES.ceres.kind).toBe('coccus'); // grows with the chain code
    expect(SPECIES.ceres.layout).toBe('chain');
    expect(SPECIES.ceres.maxCells).toBe(3);
    expect(SPECIES.ceres.shape).toBe('rod');
  });

  it.each(PALS)("gives %s a sensible chain or cluster size, if she has her own", (pal) => {
    const { maxCells } = SPECIES[pal];
    if (maxCells === undefined) return;
    expect(Number.isInteger(maxCells)).toBe(true);
    expect(maxCells).toBeGreaterThanOrEqual(2);
    expect(maxCells).toBeLessThanOrEqual(GAME.GROUP_CAP);
  });
});

describe('names above the dish', () => {
  it.each(PALS)("writes %s's species the scientific way: Genus species, or *Genus* Serovar", (pal) => {
    // A serovar (Typhi) is capitalized and never in italics, so a name with
    // one marks just the genus for italics.
    expect(SPECIES[pal].scientific).toMatch(/^([A-Z][a-z]+ [a-z]+|\*[A-Z][a-z]+\* [A-Z][a-z]+)$/);
  });

  it('writes Sallie as Salmonella Typhi, with only the genus in italics', () => {
    expect(SPECIES.sallie.scientific).toBe('*Salmonella* Typhi');
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
    expect(GAME.DISK_MAX_DISTANCE + GAME.DISK_RADIUS + GAME.ZONE_MAX_WIDTH).toBeLessThan(1);
  });

  it('let a chain or cluster hold at least a few cells', () => {
    expect(Number.isInteger(GAME.GROUP_CAP)).toBe(true);
    expect(GAME.GROUP_CAP).toBeGreaterThanOrEqual(4);
  });
});

describe('Gram stains', () => {
  it('says whether each pal is Gram-positive or Gram-negative', () => {
    for (const [name, species] of Object.entries(SPECIES)) {
      expect(['positive', 'negative'], name).toContain(species.gram);
    }
  });

  it('matches the real bacteria: the cocci, Ana, Ceres, Terra, Lissie and Diffany are Gram-positive, the other rods negative', () => {
    const positive = Object.keys(SPECIES).filter((name) => SPECIES[name].gram === 'positive').sort();
    expect(positive).toEqual(['ana', 'ceres', 'diffany', 'goldie', 'ivy', 'lissie', 'penny', 'scarlett', 'terra']);
  });

  it('marks only Elia as barely taking the stain', () => {
    expect(Object.keys(SPECIES).filter((name) => SPECIES[name].faintStain)).toEqual(['elia']);
  });
});
