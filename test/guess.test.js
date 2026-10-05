// @vitest-environment jsdom
// Guess the Pal's facts: shuffled into a deck, with "this pal" in place of the pal's name.
import { describe, expect, it } from 'vitest';
import { SPECIES } from '../public/game/config.js';
import { factDeck, fillBlanks, withBlanks } from '../public/game/guess.js';
import { PALS } from '../public/game/pals.js';

describe('the deck of facts', () => {
  it('has every fact about every pal, once each', () => {
    const deck = factDeck(PALS, SPECIES);
    const all = PALS.flatMap((pal) => SPECIES[pal.id].facts.map((fact) => `${pal.id}: ${fact}`));
    expect(deck.map(({ pal, fact }) => `${pal.id}: ${fact}`).sort()).toEqual(all.sort());
  });

  it('is shuffled', () => {
    const order = (random) => factDeck(PALS, SPECIES, random).map(({ fact }) => fact);
    expect(order(() => 0)).not.toEqual(order(() => 0.999));
  });
});

describe('swapping her name for "this pal"', () => {
  const shown = (fact, name) => {
    const p = document.createElement('p');
    p.append(...withBlanks(fact, name));
    return p;
  };

  it('swaps every mention of her, possessives too', () => {
    expect(shown("Mona's cells signal to each other, so Mona can talk.", 'Mona').textContent)
      .toBe("This pal's cells signal to each other, so this pal can talk.");
  });

  it('starts every sentence with a capital', () => {
    expect(shown('Mona swims. Mona glows! "Mona" is a name.', 'Mona').textContent)
      .toBe('This pal swims. This pal glows! "This pal" is a name.');
    expect(shown('Without oxygen, Mona breathes nitrate.', 'Mona').textContent)
      .toBe('Without oxygen, this pal breathes nitrate.');
  });

  it('is plain text, with no question mark', () => {
    const p = shown('Mona swims.', 'Mona');
    expect(p.querySelector('.fact-blank').textContent).toBe('This pal');
    expect(p.textContent).not.toContain('?');
  });

  it('only swaps whole words', () => {
    expect(shown("Vi is a Vibrio, and so are Vi's cousins.", 'Vi').textContent)
      .toBe("This pal is a Vibrio, and so are this pal's cousins.");
  });

  it('says "strains of this pal", not "this pal strains"', () => {
    expect(shown('Some Ana strains eat mucin, unlike harmless Penny cells.', 'Ana').textContent)
      .toBe('Some strains of this pal eat mucin, unlike harmless Penny cells.');
    expect(shown('Vaccines cover the Penny types that matter.', 'Penny').textContent)
      .toBe('Vaccines cover the types of this pal that matter.');
  });

  it('keeps other bacteria in italics', () => {
    const p = shown("Ceres's cousin *Bacillus thuringiensis* is an insecticide. Ceres isn't.", 'Ceres');
    expect(p.textContent).toBe("This pal's cousin Bacillus thuringiensis is an insecticide. This pal isn't.");
    expect(p.querySelector('i').textContent).toBe('Bacillus thuringiensis');
  });

  it.each(PALS.map((pal) => [pal.name, pal.id]))("never gives %s's name away", (name, id) => {
    for (const fact of SPECIES[id].facts) {
      const text = shown(fact, name).textContent;
      expect(text, fact).not.toMatch(new RegExp(`\\b${name}\\b`));
      expect(text, fact).toMatch(/\b[Tt]his pal\b/);
      expect(text, fact).not.toMatch(/\bthis pal (strains|cells|types)\b/);
      expect(text, fact).toMatch(/^["A-Z0-9]/);
    }
  });
});

describe('filling the blanks', () => {
  it('puts her name in every blank, in her color', () => {
    const p = document.createElement('p');
    p.append(...withBlanks("Mona's tail helps Mona swim.", 'Mona'));
    fillBlanks(p, 'Mona', '#15803d');
    expect(p.textContent).toBe("Mona's tail helps Mona swim.");
    for (const gap of p.querySelectorAll('.fact-blank')) {
      expect(gap.classList).toContain('filled');
      expect(gap.style.color).toBe('rgb(21, 128, 61)');
    }
  });
});
