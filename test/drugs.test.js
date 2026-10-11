// @vitest-environment jsdom
// Disk Detective's antibiotics: every disk in the game, with facts to learn it by.
import { describe, expect, it } from 'vitest';
import { SPECIES } from '../public/game/config.js';
import { capitalized, CHOICES, choicesFor, drugDeck, DRUGS, palsFor, TARGETS, withArticle } from '../public/game/drugs.js';
import { withBlanks } from '../public/game/guess.js';

const inDishes = Object.values(SPECIES).flatMap((species) => species.antibiotics);

describe('the antibiotics', () => {
  it('covers every disk in the game, and only them', () => {
    expect(Object.keys(DRUGS).sort()).toEqual([...new Set(inDishes.map((drug) => drug.code))].sort());
  });

  it("uses each disk's name from the dish", () => {
    for (const { code, name } of inDishes) expect(DRUGS[code].name, code).toBe(name);
  });

  it.each(Object.keys(DRUGS))('%s says what it attacks and how', (code) => {
    const drug = DRUGS[code];
    expect(Object.keys(TARGETS)).toContain(drug.target);
    expect(drug.family).toBeTruthy();
    expect(drug.works).toMatch(/^[A-Z].*\.$/);
  });

  it.each(Object.keys(DRUGS))('%s has facts that each name it, and never give it away', (code) => {
    const { name, facts } = DRUGS[code];
    expect(facts.length).toBeGreaterThanOrEqual(2);
    expect(new Set(facts).size).toBe(facts.length);
    for (const fact of facts) {
      expect(fact.split('*').length % 2, fact).toBe(1); // italics come in pairs
      expect(fact.replaceAll('*', ''), fact).toMatch(/^[A-Z0-9].*[.!”]$/);
      const p = document.createElement('p');
      p.append(...withBlanks(fact, name, { noun: 'drug', ignoreCase: true }));
      expect(p.textContent, fact).toMatch(/\b[Tt]his drug\b/);
      expect(p.textContent.toLowerCase(), fact).not.toContain(name);
    }
  });
});

describe('the deck of facts', () => {
  it('has every fact about every drug, once each', () => {
    const all = Object.entries(DRUGS).flatMap(([code, drug]) => drug.facts.map((fact) => `${code}: ${fact}`));
    expect(drugDeck().map(({ code, fact }) => `${code}: ${fact}`).sort()).toEqual(all.sort());
  });

  it('is shuffled', () => {
    const order = (random) => drugDeck(random).map(({ fact }) => fact);
    expect(order(() => 0)).not.toEqual(order(() => 0.999));
  });
});

describe('the disks to choose from', () => {
  it.each(Object.keys(DRUGS))('for %s, has it and three that attack something else', (code) => {
    for (let i = 0; i < 10; i++) {
      const choices = choicesFor(code);
      expect(choices).toHaveLength(CHOICES);
      expect(new Set(choices).size).toBe(CHOICES);
      expect(choices).toContain(code);
      for (const other of choices.filter((c) => c !== code)) {
        expect(DRUGS[other].target).not.toBe(DRUGS[code].target);
      }
    }
  });

  it("doesn't always put the answer in the same spot", () => {
    const spots = new Set();
    for (let i = 0; i < 50; i++) spots.add(choicesFor('P').indexOf('P'));
    expect(spots.size).toBeGreaterThan(1);
  });
});

describe('helpers', () => {
  it("finds the pals whose dishes have a drug's disk", () => {
    expect(palsFor('MTZ').map((pal) => pal.id).sort()).toEqual(
      Object.keys(SPECIES).filter((id) => SPECIES[id].antibiotics.some((d) => d.code === 'MTZ')).sort(),
    );
    for (const code of Object.keys(DRUGS)) expect(palsFor(code).length, code).toBeGreaterThan(0);
  });

  it('writes "a" or "an" and capitals', () => {
    expect(withArticle('macrolide')).toBe('A macrolide');
    expect(withArticle('aminoglycoside')).toBe('An aminoglycoside');
    expect(capitalized('penicillin')).toBe('Penicillin');
  });
});
