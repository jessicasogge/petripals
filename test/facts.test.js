// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SPECIES } from '../public/game/config.js';
import { hideFact, pickFact, showFact } from '../public/game/facts.js';

describe('every pal\'s facts', () => {
  it.each(Object.keys(SPECIES))('%s has at least 10 short, different facts', (pal) => {
    const { facts } = SPECIES[pal];
    expect(facts.length).toBeGreaterThanOrEqual(10);
    expect(new Set(facts).size).toBe(facts.length);
    const name = pal[0].toUpperCase() + pal.slice(1);
    for (const fact of facts) {
      expect(fact.length, fact).toBeLessThanOrEqual(90); // fits the pop-up
      // Says whose fact it is, so it's clear in a race against another pal.
      expect(fact, fact).toContain(name);
      expect(fact, fact).toMatch(/^["A-Z0-9].*[.!"]$/); // a full sentence
      // Commas and other punctuation instead of dashes (hyphenated words,
      // like whip-like, are fine).
      expect(fact, fact).not.toMatch(/[\u2013\u2014]|\s-\s|\d-\d/);
    }
  });
});

describe('pickFact', () => {
  const facts = ['A.', 'B.', 'C.'];

  it('picks one of the facts', () => {
    expect(facts).toContain(pickFact(facts));
  });

  it('never repeats the last one when there are others', () => {
    for (let i = 0; i < 50; i++) expect(pickFact(facts, 'B.')).not.toBe('B.');
  });

  it('can pick any fact', () => {
    expect(pickFact(facts, null, () => 0)).toBe('A.');
    expect(pickFact(facts, null, () => 0.99)).toBe('C.');
  });

  it('copes with just one fact, or none', () => {
    expect(pickFact(['Only.'], 'Only.')).toBe('Only.');
    expect(pickFact([], null)).toBeNull();
    expect(pickFact(undefined, null)).toBeNull();
  });
});

describe('the pop-up line', () => {
  beforeEach(() => {
    sessionStorage.clear();
    document.body.innerHTML =
      '<p class="fun-fact" hidden><strong>Did you know?</strong> <span class="fun-fact-text"></span></p>';
  });
  const line = () => document.querySelector('.fun-fact');

  it('shows one of the pal\'s facts', () => {
    showFact('mona', SPECIES.mona);
    expect(line().hidden).toBe(false);
    expect(SPECIES.mona.facts).toContain(line().querySelector('.fun-fact-text').textContent);
  });

  it('shows a different fact on the next win', () => {
    for (let i = 0; i < 20; i++) {
      showFact('vi', SPECIES.vi);
      const first = line().textContent;
      showFact('vi', SPECIES.vi);
      expect(line().textContent).not.toBe(first);
    }
  });

  it('still shows a fact when the browser blocks storage (like some private windows)', () => {
    const blocked = () => {
      throw new Error('storage is blocked');
    };
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(blocked);
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(blocked);
    try {
      expect(() => showFact('mona', SPECIES.mona)).not.toThrow();
      expect(line().hidden).toBe(false);
      expect(SPECIES.mona.facts).toContain(line().querySelector('.fun-fact-text').textContent);
    } finally {
      vi.restoreAllMocks();
    }
  });

  it('does nothing on a page without the fact line', () => {
    document.body.innerHTML = '';
    expect(() => showFact('mona', SPECIES.mona)).not.toThrow();
    expect(() => hideFact()).not.toThrow();
  });

  it('stays hidden for a pal with no facts, and hides on a game over', () => {
    showFact('nobody', {});
    expect(line().hidden).toBe(true);
    showFact('mona', SPECIES.mona);
    hideFact();
    expect(line().hidden).toBe(true);
  });
});
