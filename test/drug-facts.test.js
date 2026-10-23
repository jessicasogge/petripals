// How each antibiotic works, shown on a game over from touching its disk.
import { describe, expect, it } from 'vitest';
import { SPECIES } from '../public/game/config.js';
import { DRUG_FACTS } from '../public/game/drug-facts.js';

// Every drug in the game, by disk code, with its name.
const DRUGS = new Map(Object.values(SPECIES).flatMap((s) => s.antibiotics.map((a) => [a.code, a.name])));

describe('drug facts', () => {
  it('has a fact for every antibiotic in the game, and none for drugs not in it', () => {
    expect(Object.keys(DRUG_FACTS).sort()).toEqual([...DRUGS.keys()].sort());
  });

  it.each([...DRUGS])('%s (%s) starts with the drug name, fits the pop-up and has no dashes', (code, name) => {
    const fact = DRUG_FACTS[code];
    // "trimethoprim-sulfamethoxazole" starts "Trimethoprim".
    const first = name.split('-')[0];
    expect(fact.startsWith(first[0].toUpperCase() + first.slice(1))).toBe(true);
    expect(fact.length).toBeLessThanOrEqual(90);
    expect(fact).not.toMatch(/[-–—]/);
  });

  it('gives every drug its own fact', () => {
    expect(new Set(Object.values(DRUG_FACTS)).size).toBe(Object.keys(DRUG_FACTS).length);
  });
});
