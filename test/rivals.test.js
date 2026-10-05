// rivals.js reads who's racing from the address, and writes race addresses.
import { describe, expect, it } from 'vitest';
import { MIXED, raceTarget, SPECIES } from '../public/game/config.js';
import { PALS } from '../public/game/pals.js';
import { listOf, raceAddress, rivalChoices, rivalsFor } from '../public/game/rivals.js';

describe('rivalsFor', () => {
  it('keeps the rivals in the address, in order', () => {
    expect(rivalsFor('mona', 'vi,elia,ceres')).toEqual(['vi', 'elia', 'ceres']);
  });

  it('drops made-up pals, your own pal and repeats', () => {
    expect(rivalsFor('mona', 'nope,mona,vi,vi,toString')).toEqual(['vi']);
  });

  it(`never lets more than ${MIXED.MAX_RIVALS} in`, () => {
    expect(rivalsFor('mona', 'vi,elia,ceres,coco,ana')).toHaveLength(MIXED.MAX_RIVALS);
  });

  it('picks one random pal, never yours, when the address has none', () => {
    for (const text of [null, '', 'nope', 'mona']) {
      const rivals = rivalsFor('mona', text, () => 0);
      expect(rivals).toHaveLength(1);
      expect(Object.keys(SPECIES)).toContain(rivals[0]);
      expect(rivals[0]).not.toBe('mona');
    }
    const last = rivalsFor('mona', null, () => 0.999);
    expect(last[0]).not.toBe('mona');
  });
});

describe('raceAddress', () => {
  it('lists the rivals, or none for Surprise me', () => {
    expect(raceAddress('mona', ['vi', 'elia'])).toBe('./petri-dish.html?pal=mona&mode=mixed&rivals=vi,elia');
    expect(raceAddress('mona')).toBe('./petri-dish.html?pal=mona&mode=mixed');
  });
});

describe('listOf', () => {
  it('joins names the way you would say them', () => {
    expect(listOf(['Vi'])).toBe('Vi');
    expect(listOf(['Vi', 'Elia'])).toBe('Vi and Elia');
    expect(listOf(['Vi', 'Elia', 'Ceres'])).toBe('Vi, Elia and Ceres');
  });
});

describe('raceTarget', () => {
  it('is 64 cells against one rival and 32 against two or three', () => {
    expect(raceTarget(1)).toBe(64);
    expect(raceTarget(2)).toBe(32);
    expect(raceTarget(3)).toBe(32);
  });
});

describe('rivalChoices', () => {
  // A made-up roster of `n` pals.
  const roster = (n) => Array.from({ length: n }, (_, i) => ({ id: `pal${i}` }));

  it('offers every other pal, in order, while there are 12 or fewer', () => {
    const thirteen = roster(13);
    expect(rivalChoices('pal0', thirteen)).toEqual(thirteen.slice(1));
  });

  it(`offers a random ${MIXED.CHOICES} once there are more, never you, each once`, () => {
    const pals = roster(20);
    let seed = 0.37;
    const random = () => (seed = (seed * 9301 + 0.49297) % 1);
    const seen = new Set();
    for (let visit = 0; visit < 20; visit++) {
      const offered = rivalChoices('pal0', pals, random).map((pal) => pal.id);
      expect(offered).toHaveLength(MIXED.CHOICES);
      expect(new Set(offered).size).toBe(MIXED.CHOICES);
      expect(offered).not.toContain('pal0');
      offered.forEach((id) => seen.add(id));
    }
    expect(seen.size).toBe(19); // over a few visits, everyone gets a turn
  });

  it('offers real pals from the game: as many as fit, never you, each once', () => {
    const offered = rivalChoices('mona').map((pal) => pal.id);
    expect(offered).toHaveLength(Math.min(MIXED.CHOICES, PALS.length - 1));
    expect(new Set(offered).size).toBe(offered.length);
    expect(offered).not.toContain('mona');
    for (const id of offered) expect(PALS.map((pal) => pal.id)).toContain(id);
  });
});
