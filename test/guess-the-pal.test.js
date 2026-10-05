// @vitest-environment jsdom
// Guess the Pal: a fact with the pal's name blanked out, and a button for
// every pal. No score, just tries until you find her.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SPECIES } from '../public/game/config.js';
import { factDeck } from '../public/game/guess.js';
import { PALS } from '../public/game/pals.js';

const page = readFileSync(resolve(process.cwd(), 'public/guess-the-pal.html'), 'utf8');

// The same deck the page shuffles, with Math.random pinned to 0 below. The
// page deals from the end.
const deck = factDeck(PALS, SPECIES, () => 0);
const dealt = (n) => deck[deck.length - 1 - n];

async function open() {
  document.body.outerHTML = page.slice(page.indexOf('<body'), page.indexOf('</body>'));
  vi.resetModules();
  await import('../public/game/guess-the-pal.js');
}

const button = (id) => document.querySelector(`.guess-btn[data-pal="${id}"]`);
const status = () => document.querySelector('.guess-status').textContent;
const fact = () => document.querySelector('.guess-fact');
const next = () => document.querySelector('.next-fact');
const wrong = (pal) => PALS.find((other) => other.id !== pal.id);

beforeEach(() => vi.spyOn(Math, 'random').mockReturnValue(0));
afterEach(() => vi.restoreAllMocks());

describe('Guess the Pal', () => {
  it('offers every pal, in order', async () => {
    await open();
    const offered = [...document.querySelectorAll('.guess-btn')].map((b) => b.dataset.pal);
    expect(offered).toEqual(PALS.map((pal) => pal.id));
    expect(document.querySelector('.loading-overlay').hidden).toBe(true);
  });

  it("shows each pal's species, shortened, under her name", async () => {
    await open();
    expect(button('mona').querySelector('.guess-species').textContent).toBe('P. aeruginosa');
    expect(button('mona').querySelector('.guess-species i').textContent).toBe('P. aeruginosa');
    expect(button('sallie').querySelector('.guess-species').textContent).toBe('S. Typhi');
    for (const pal of PALS) expect(button(pal.id).querySelector('.guess-species').textContent).toMatch(/^[A-Z]\.\s\S+$/);
  });

  it('shows a fact with "this pal" in place of her name', async () => {
    await open();
    const { pal } = dealt(0);
    expect(fact().textContent).toMatch(/\b[Tt]his pal\b/);
    expect(fact().textContent).not.toContain(pal.name);
    expect(status()).toBe('Who is this fact about? Tap her!');
    expect(next().hidden).toBe(true);
  });

  it('greys out a wrong guess so you can try again', async () => {
    await open();
    const other = wrong(dealt(0).pal);
    button(other.id).click();
    expect(status()).toBe(`Not ${other.name}. Try again!`);
    expect(button(other.id).disabled).toBe(true);
    expect(next().hidden).toBe(true);
  });

  it('fills in her name and species when you find her', async () => {
    await open();
    const { pal, fact: text } = dealt(0);
    button(pal.id).click();
    expect(fact().textContent).toContain(pal.name);
    expect(fact().textContent).not.toMatch(/\b[Tt]his pal\b/);
    expect(text).toContain(pal.name);
    expect(button(pal.id).classList).toContain('right');
    expect(status()).toBe(`Yes! It's ${pal.name}, ${SPECIES[pal.id].scientific.replaceAll('*', '')}.`);
    expect(document.querySelector('.guess-status i')).not.toBeNull();
    for (const other of PALS) expect(button(other.id).disabled).toBe(other.id !== pal.id);
    expect(next().hidden).toBe(false);
    expect(document.activeElement).toBe(next());
  });

  it("doesn't keep score", async () => {
    await open();
    expect(document.body.textContent).not.toMatch(/score|points|\d+ \/ \d+/i);
  });

  it('moves on to the next fact, with every pal back', async () => {
    await open();
    const first = dealt(0).pal;
    button(wrong(first).id).click();
    button(first.id).click();
    next().click();
    const { pal } = dealt(1);
    expect(fact().textContent).not.toContain(pal.name);
    expect(status()).toBe('Who is this fact about? Tap her!');
    expect(next().hidden).toBe(true);
    for (const other of PALS) {
      expect(button(other.id).disabled).toBe(false);
      expect(button(other.id).classList).not.toContain('right');
    }
  });

  it('shuffles every fact again once they have all been shown', async () => {
    await open();
    for (let i = 0; i < deck.length; i++) {
      button(dealt(i).pal.id).click();
      next().click();
    }
    // Back to the top of a fresh deck.
    const { pal } = dealt(0);
    expect(fact().textContent).toMatch(/\b[Tt]his pal\b/);
    button(pal.id).click();
    expect(next().hidden).toBe(false);
  });
});
