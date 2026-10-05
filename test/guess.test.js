// @vitest-environment jsdom
// Who’s That Pal? facts: shuffled into a deck, with "this pal" in place of the pal's name.
import { describe, expect, it } from 'vitest';
import { SPECIES } from '../public/game/config.js';
import { factDeck, fillBlanks, withBlanks } from '../public/game/guess.js';
import { PALS } from '../public/game/pals.js';
import { QUIZ_FACTS } from '../public/game/quiz-facts.js';

describe('the quiz facts', () => {
  it.each(PALS.map((pal) => pal.id))('%s has quiz facts, each one of her facts in config.js', (id) => {
    expect(QUIZ_FACTS[id].length).toBeGreaterThanOrEqual(5);
    expect(new Set(QUIZ_FACTS[id]).size).toBe(QUIZ_FACTS[id].length);
    for (const fact of QUIZ_FACTS[id]) expect(SPECIES[id].facts, fact).toContain(fact);
  });

  it('leaves out the facts too broad to point to one pal', () => {
    expect(QUIZ_FACTS.mona).not.toContain('Mona is naturally resistant to many antibiotics.');
    expect(QUIZ_FACTS.ceres).not.toContain('Ceres is a large Gram-positive rod, so she stains purple on a Gram stain.');
  });

  it('covers no pal that is not in the game', () => {
    expect(Object.keys(QUIZ_FACTS).sort()).toEqual(PALS.map((pal) => pal.id).sort());
  });
});

describe('the deck of facts', () => {
  it('has every quiz fact about every pal, once each', () => {
    const deck = factDeck(PALS, QUIZ_FACTS);
    const all = PALS.flatMap((pal) => QUIZ_FACTS[pal.id].map((fact) => `${pal.id}: ${fact}`));
    expect(deck.map(({ pal, fact }) => `${pal.id}: ${fact}`).sort()).toEqual(all.sort());
  });

  it('is shuffled', () => {
    const order = (random) => factDeck(PALS, QUIZ_FACTS, random).map(({ fact }) => fact);
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
