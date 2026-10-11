// @vitest-environment jsdom
// Disk Detective shows a fact with "this drug" in place of an antibiotic's
// name, and four disks to choose from. No score, just tries until you find it,
// then a card on how it works.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { choicesFor, drugDeck, DRUGS, TARGETS } from '../public/game/drugs.js';

const page = readFileSync(resolve(process.cwd(), 'public/disk-detective.html'), 'utf8');

// The same deck and disks the page deals, with Math.random pinned to 0 below.
// The page deals from the end of the deck.
const deck = drugDeck(() => 0);
const dealt = (n) => deck[deck.length - 1 - n];

async function open() {
  document.body.outerHTML = page.slice(page.indexOf('<body'), page.indexOf('</body>'));
  vi.resetModules();
  await import('../public/game/disk-detective.js');
}

const disks = () => [...document.querySelectorAll('.drug-btn')];
const button = (code) => document.querySelector(`.drug-btn[data-drug="${code}"]`);
const status = () => document.querySelector('.guess-status').textContent;
const fact = () => document.querySelector('.guess-fact');
const card = () => document.querySelector('.drug-card');
const next = () => document.querySelector('.next-fact');
const wrong = (code) => disks().map((b) => b.dataset.drug).find((other) => other !== code);

beforeEach(() => vi.spyOn(Math, 'random').mockReturnValue(0));
afterEach(() => vi.restoreAllMocks());

describe('Disk Detective', () => {
  it('shows a fact with "this drug" in place of its name', async () => {
    await open();
    const { code } = dealt(0);
    expect(fact().textContent).toMatch(/\b[Tt]his drug\b/);
    expect(fact().textContent.toLowerCase()).not.toContain(DRUGS[code].name);
    expect(status()).toBe('Which antibiotic is this fact about? Tap its disk!');
    expect(card().hidden).toBe(true);
    expect(next().hidden).toBe(true);
    expect(document.querySelector('.loading-overlay').hidden).toBe(true);
  });

  it('offers four disks, one of them the answer, each with its code and name', async () => {
    await open();
    const { code } = dealt(0);
    expect(disks().map((b) => b.dataset.drug)).toEqual(choicesFor(code, () => 0));
    expect(button(code).querySelector('.drug-disk').textContent).toBe(code);
    expect(button(code).textContent.toLowerCase()).toContain(DRUGS[code].name);
  });

  it("counts how many facts you've seen, out of all of them", async () => {
    await open();
    const counter = () => document.querySelector('.guess-counter').textContent;
    expect(counter()).toBe(`Fact 1 of ${deck.length}`);
    button(dealt(0).code).click();
    expect(counter()).toBe(`Fact 1 of ${deck.length}`);
    next().click();
    expect(counter()).toBe(`Fact 2 of ${deck.length}`);
  });

  it('greys out a wrong guess and says what that drug does', async () => {
    await open();
    const other = wrong(dealt(0).code);
    button(other).click();
    expect(status()).toBe(`Not ${DRUGS[other].name}: it ${TARGETS[DRUGS[other].target].does}. Try again!`);
    expect(button(other).disabled).toBe(true);
    expect(card().hidden).toBe(true);
    expect(next().hidden).toBe(true);
  });

  it('fills in its name and shows how it works when you find it', async () => {
    await open();
    const { code } = dealt(0);
    const drug = DRUGS[code];
    button(code).click();
    expect(fact().textContent.toLowerCase()).toContain(drug.name);
    expect(fact().textContent).not.toMatch(/\b[Tt]his drug\b/);
    expect(status()).toBe(`Yes! It’s ${drug.name}.`);
    expect(button(code).classList).toContain('right');
    for (const b of disks()) expect(b.disabled).toBe(b !== button(code));
    expect(card().hidden).toBe(false);
    expect(card().textContent).toContain(drug.family);
    expect(card().textContent).toContain(drug.works);
    expect(card().textContent).toContain(TARGETS[drug.target].does);
    expect(card().textContent).toMatch(/Find its disk in Classic mode with .+\.$/);
    expect(next().hidden).toBe(false);
    expect(document.activeElement).toBe(next());
  });

  it("doesn't keep score", async () => {
    await open();
    expect(document.body.textContent).not.toMatch(/score|points|correct/i);
  });

  it('moves on to the next fact, with new disks', async () => {
    await open();
    button(dealt(0).code).click();
    next().click();
    const { code } = dealt(1);
    expect(disks().map((b) => b.dataset.drug)).toContain(code);
    for (const b of disks()) expect(b.disabled).toBe(false);
    expect(card().hidden).toBe(true);
    expect(next().hidden).toBe(true);
  });

  it('shuffles every fact again once you have seen them all', async () => {
    await open();
    for (let i = 0; i < deck.length; i++) {
      button(dealt(i).code).click();
      next().click();
    }
    expect(document.querySelector('.guess-counter').textContent).toBe(`Fact 1 of ${deck.length}`);
    expect(fact().textContent.toLowerCase()).not.toContain(DRUGS[dealt(0).code].name);
  });

  it('lists every disk in the guide, grouped by what it attacks', async () => {
    await open();
    const guide = document.querySelector('.drug-guide-list');
    expect([...guide.querySelectorAll('h3')].map((h) => h.textContent)).toEqual(Object.values(TARGETS).map((t) => t.title));
    expect([...guide.querySelectorAll('.drug-disk')].map((d) => d.textContent).sort()).toEqual(Object.keys(DRUGS).sort());
  });
});

describe('the home page', () => {
  it('links to Disk Detective', () => {
    const home = readFileSync(resolve(process.cwd(), 'public/index.html'), 'utf8');
    expect(home).toContain('<a class="guess-link" href="./disk-detective.html">Disk Detective</a>');
  });
});
