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
      expect(['chain', 'cluster', 'tetrad']).toContain(species.layout);
      for (const part of ['fill', 'stroke', 'highlight', 'dark']) {
        expect(species.colors[part]).toMatch(/^#[0-9a-f]{6}$/i);
      }
    }
  });

  it('makes Scarlett a chain (Streptococcus) and Goldie a cluster (Staphylococcus)', () => {
    expect(SPECIES.scarlett.layout).toBe('chain');
    expect(SPECIES.goldie.layout).toBe('cluster');
  });

  it('makes Ari a Gram-negative chain of round cells, with a heterocyst every fifth cell', () => {
    const { kind, layout, gram, heterocyst } = SPECIES.ari;
    expect(kind).toBe('coccus');
    expect(layout).toBe('chain');
    expect(gram).toBe('negative');
    expect(heterocyst.every).toBe(5);
    for (const part of ['fill', 'stroke', 'highlight']) expect(heterocyst[part]).toMatch(/^#[0-9a-f]{6}$/i);
  });

  it('makes Marina a Gram-positive rod traced along her curve, end to end', () => {
    const { kind, layout, gram, body } = SPECIES.marina;
    expect(kind).toBe('rod');
    expect(layout).toBeUndefined();
    expect(gram).toBe('positive');
    // Her rod runs from x 44 to 156 in her 200-wide dish drawing, centered at 100,
    // and is 34 thick (17 each side), dipping in the middle.
    expect(Math.min(...body.map(([x]) => x))).toBeCloseTo(-56 / 200, 2);
    expect(Math.max(...body.map(([x]) => x))).toBeCloseTo(56 / 200, 2);
    for (const [, , r] of body) expect(r).toBeCloseTo(17 / 200, 3);
    const ys = body.map(([, y]) => y);
    expect(Math.max(...ys)).toBeGreaterThan(ys[0]);
    expect(Math.max(...ys)).toBeGreaterThan(ys.at(-1));
  });

  it('makes Dina a Deinococcus that grows in squares of four (tetrads)', () => {
    expect(SPECIES.dina.kind).toBe('coccus');
    expect(SPECIES.dina.layout).toBe('tetrad');
    expect(SPECIES.dina.maxCells).toBe(4);
    expect(SPECIES.dina.gram).toBe('positive');
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

  it('makes Colette a Gram-negative rod that swims apart after dividing, traced along her long, slim rod', () => {
    const { kind, layout, gram, body } = SPECIES.colette;
    expect(kind).toBe('rod');
    expect(layout).toBeUndefined();
    expect(gram).toBe('negative');
    // Her rod is 132 wide and 44 tall in her 192-wide dish drawing.
    const rod = body.filter(([, , r]) => r > 0.05);
    expect(Math.max(...rod.map(([x, , r]) => x + r))).toBeCloseTo(66 / 192, 2);
    expect(Math.max(...rod.map(([, , r]) => r))).toBeCloseTo(22 / 192, 2);
  });

  it('makes Pearl a Gram-negative rod traced around her capsule, not just the rod inside it', () => {
    const { kind, layout, gram, body } = SPECIES.pearl;
    expect(kind).toBe('rod');
    expect(layout).toBeUndefined();
    expect(gram).toBe('negative');
    // Her capsule is 140 wide and 90 tall in her 156-wide dish drawing.
    expect(Math.max(...body.map(([x, , r]) => x + r))).toBeCloseTo(70 / 156, 2);
    expect(Math.max(...body.map(([, , r]) => r))).toBeCloseTo(45 / 156, 2);
  });

  it('makes Frannie a small Gram-negative rod that splits apart, traced along her rod and up into her ears', () => {
    const { kind, layout, gram, size, body, antibiotics } = SPECIES.frannie;
    expect(kind).toBe('rod');
    expect(layout).toBeUndefined();
    expect(gram).toBe('negative');
    expect(size).toBeLessThan(12);
    // Her rod is 84 wide and 48 tall (outline and all) in her 156-wide dish drawing.
    const rod = body.filter(([, y]) => y === 0);
    expect(Math.max(...rod.map(([x, , r]) => x + r))).toBeCloseTo(42 / 156, 2);
    expect(Math.max(...rod.map(([, , r]) => r))).toBeCloseTo(24 / 156, 2);
    // Her two ears, above her rod (up is negative y).
    const ears = body.filter(([, y]) => y < 0);
    expect(ears).toHaveLength(2);
    expect(antibiotics[0].code).toBe('GM');
  });

  it('makes Bree a tiny Gram-negative oval, traced with three circles', () => {
    const { kind, layout, gram, size, body, antibiotics } = SPECIES.bree;
    expect(kind).toBe('rod');
    expect(layout).toBeUndefined();
    expect(gram).toBe('negative');
    expect(size).toBeLessThan(SPECIES.frannie.size);
    // Her oval is 100 wide and 76 tall (outline and all) in her 172-wide dish drawing.
    expect(Math.max(...body.map(([x, , r]) => x + r))).toBeCloseTo(50 / 172, 2);
    expect(Math.max(...body.map(([, , r]) => r))).toBeCloseTo(38 / 172, 2);
    expect(antibiotics[0].code).toBe('DO');
  });

  it('makes Electra a Gram-negative rod that splits and slides apart, traced along her straight rod', () => {
    const { kind, layout, gram, body } = SPECIES.electra;
    expect(kind).toBe('rod');
    expect(layout).toBeUndefined();
    expect(gram).toBe('negative');
    for (const [, y] of body) expect(y).toBe(0); // straight, like the other rods
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

  it('makes Nova a Gram-positive rod that breaks apart, traced widest at her hub and out along her branches', () => {
    const { kind, layout, gram, body } = SPECIES.nova;
    expect(kind).toBe('rod');
    expect(layout).toBeUndefined();
    expect(gram).toBe('positive');
    const widest = Math.max(...body.map(([, , r]) => r));
    expect(body[0][2]).toBe(widest); // her hub
    // Her branches reach every side, not just left and right like a rod.
    expect(body.some(([, y]) => y < -0.3)).toBe(true);
    expect(body.some(([, y]) => y > 0.3)).toBe(true);
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

  // Spot checks against the real bacteria, one pal at a time, so adding a pal
  // doesn't mean editing a list here (the test above checks every pal).
  it.each(['ana', 'ceres', 'diffany', 'dina', 'goldie', 'ivy', 'lissie', 'marina', 'nova', 'penny', 'scarlett', 'terra'])(
    '%s is Gram-positive, like her real species',
    (name) => expect(SPECIES[name].gram).toBe('positive'),
  );
  it.each(['mona', 'vi', 'elia', 'coco', 'sallie', 'sara', 'astrid', 'kiki', 'electra', 'pearl', 'frannie', 'colette', 'ari', 'bree'])(
    '%s is Gram-negative, like her real species',
    (name) => expect(SPECIES[name].gram).toBe('negative'),
  );

  it('marks only Elia as barely taking the stain', () => {
    expect(Object.keys(SPECIES).filter((name) => SPECIES[name].faintStain).sort()).toEqual(['elia', 'marina']);
  });
});
