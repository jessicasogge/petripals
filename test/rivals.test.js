// rivals.js reads who's racing from the address, and writes race addresses.
import { describe, expect, it } from 'vitest';
import { MIXED, raceTarget, SPECIES } from '../public/game/config.js';
import { listOf, raceAddress, rivalsFor } from '../public/game/rivals.js';

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
