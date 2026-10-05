// @vitest-environment jsdom
// Guess the Pal's facts: shuffled into a deck, with the pal's name blanked.
import { describe, expect, it } from 'vitest';
import { SPECIES } from '../public/game/config.js';
import { factDeck, fillBlanks, withBlanks } from '../public/game/guess.js';
import { PALS } from '../public/game/pals.js';

// The fact as it would read on screen, with "___" for each blank.
function shown(nodes) {
  const p = document.createElement('p');
  p.append(...nodes);
  for (const gap of p.querySelectorAll('.fact-blank')) gap.replaceWith('___');
  return p;
}

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

describe('blanking out her name', () => {
  it('blanks every mention of her, possessives too', () => {
    const p = shown(withBlanks("Mona's cells signal to each other, so Mona can talk.", 'Mona'));
    expect(p.textContent).toBe("___'s cells signal to each other, so ___ can talk.");
  });

  it('only blanks whole words', () => {
    const p = shown(withBlanks('Vi is a Vibrio, and so are Vi\'s cousins.', 'Vi'));
    expect(p.textContent).toBe("___ is a Vibrio, and so are ___'s cousins.");
  });

  it('keeps other bacteria in italics', () => {
    const p = shown(withBlanks("Ceres's cousin *Bacillus thuringiensis* is an insecticide.", 'Ceres'));
    expect(p.textContent).toBe("___'s cousin Bacillus thuringiensis is an insecticide.");
    expect(p.querySelector('i').textContent).toBe('Bacillus thuringiensis');
  });

  it("shows a ? and tells a screen reader it's this pal", () => {
    const [gap] = withBlanks('Mona swims.', 'Mona');
    expect(gap.className).toBe('fact-blank');
    expect(gap.querySelector('[aria-hidden="true"]').textContent).toBe('?');
    expect(gap.querySelector('.visually-hidden').textContent).toBe('this pal');
  });

  it.each(PALS.map((pal) => [pal.name, pal.id]))("never gives %s's name away", (name, id) => {
    for (const fact of SPECIES[id].facts) {
      const p = shown(withBlanks(fact, name));
      expect(p.textContent, fact).not.toMatch(new RegExp(`\\b${name}\\b`));
      expect(p.textContent, fact).toContain('___');
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
