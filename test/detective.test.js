// @vitest-environment jsdom
// Detective mode (detective.js): loads the real page into jsdom, solves cases
// by tapping through the key, and checks the stars, suspects and Pal Book.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SPECIES } from '../public/game/config.js';
import { pathTo } from '../public/game/key.js';
import { PALS } from '../public/game/pals.js';

const page = readFileSync(resolve(process.cwd(), 'public/detective.html'), 'utf8');
const body = page.slice(page.indexOf('<body'), page.indexOf('</body>'));
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

let location;

async function open(search) {
  location = { search, href: `http://localhost/detective.html${search}`, replace: vi.fn() };
  vi.stubGlobal('location', location);
  document.body.outerHTML = body;
  vi.resetModules();
  await import('../public/game/detective.js');
}

// Run the current test and tap answer `index`.
function answer(index) {
  if (!$('.run-test').hidden) $('.run-test').click();
  $$('.answer-btn')[index].click();
}

// Solve the case for `id`, getting `wrong` answers wrong at the first step.
function solve(id, wrong = 0) {
  pathTo(id).forEach(({ answer: right }, i) => {
    if (i === 0) for (let n = 0; n < wrong; n++) answer(1 - right);
    answer(right);
    $('.next-step').click();
  });
}

beforeEach(() => localStorage.clear());
afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('opening a case', () => {
  it('sends a missing or unknown pal back to the picker', async () => {
    await open('?pal=nobody');
    expect(location.replace).toHaveBeenCalledWith('./pal-picker.html');
    expect($('.detective-pal').children).toHaveLength(0);
  });

  it('shows your pal as the detective, with her name in her color', async () => {
    await open('?pal=mona&case=vi');
    expect($('.detective-pal .pal-icon').classList).toContain('mona');
    expect($('.detective-name').textContent).toBe('Mona');
    const expected = document.createElement('span');
    expected.style.color = SPECIES.mona.color;
    expect($('.detective-name').style.color).toBe(expected.style.color);
    expect(document.title).toBe('PetriPals | Mona | Detective');
    expect($('.next-case').getAttribute('href')).toBe('./detective.html?pal=mona');
    expect($('.other-mode').getAttribute('href')).toBe('./choose-mode.html?pal=mona');
  });

  it('lists every pal but the detective as a suspect', async () => {
    await open('?pal=mona&case=vi');
    const suspects = $$('.suspects li').map((li) => li.dataset.pal);
    expect(suspects).toEqual(PALS.map((p) => p.id).filter((id) => id !== 'mona'));
    expect($('.suspect-count').textContent).toBe(`(${PALS.length - 1} left)`);
    expect($$('.suspects .ruled-out')).toHaveLength(0);
  });

  it('picks a random mystery pal, never the detective, unless the address names one', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    await open('?pal=terra'); // Terra is first, so the first suspect after her
    solve('penny');
    expect($('.solved-name').textContent).toBe("It's Penny!");
    // Asking for the detective herself gets a random pal instead.
    await open('?pal=terra&case=terra');
    solve('penny');
    expect($('.solved-name').textContent).toBe("It's Penny!");
  });

  it('starts at the Gram stain, with the sample waiting', async () => {
    await open('?pal=mona&case=vi');
    expect($('.step-name').textContent).toBe('Gram stain');
    expect($('.step-question').textContent).toBe('What color are the cells?');
    expect($('.bench-hint').textContent).toBe('The sample is ready.');
    expect($('.answers').hidden).toBe(true);
    expect($('.next-step').hidden).toBe(true);
  });
});

describe('running tests', () => {
  it('shows the result and the two answers when you run a test', async () => {
    await open('?pal=mona&case=vi');
    $('.run-test').click();
    expect($('.lab-bench .lab-view').getAttribute('aria-label')).toBe('The cells are stained pink.');
    expect($('.run-test').hidden).toBe(true);
    expect($$('.answer-btn').map((b) => b.textContent)).toEqual(['Purple', 'Pink']);
    expect(document.activeElement).toBe($('.answer-btn'));
  });

  it('marks a wrong answer and lets you try again', async () => {
    await open('?pal=mona&case=vi');
    answer(0);
    expect($$('.answer-btn')[0].disabled).toBe(true);
    expect($$('.answer-btn')[0].classList).toContain('wrong');
    expect($('.step-feedback').textContent).toBe('Not quite. Look at the result again!');
    expect($('.next-step').hidden).toBe(true);
    expect($$('.trail li')).toHaveLength(0);
  });

  it('explains the science, adds to the trail and rules out suspects for a right answer', async () => {
    await open('?pal=mona&case=vi');
    answer(1);
    expect($('.step-feedback').textContent).toMatch(/^Yes! Thick cell walls/);
    expect($('.step-feedback').classList).toContain('correct');
    expect($$('.answer-btn').every((b) => b.disabled)).toBe(true);
    expect($$('.trail li').map((li) => li.textContent)).toEqual(['Gram stain: Pink']);
    const left = $$('.suspects li:not(.ruled-out)').map((li) => li.dataset.pal);
    expect(left.sort()).toEqual(['coco', 'elia', 'sallie', 'vi']); // Mona's the detective
    expect($('.suspect-count').textContent).toBe('(4 left)');
    expect($('.next-step').textContent).toBe('Next test');
    expect(document.activeElement).toBe($('.next-step'));
  });

  it('moves on to the next test, with a fresh bench', async () => {
    await open('?pal=mona&case=vi');
    answer(1);
    $('.next-step').click();
    expect($('.step-name').textContent).toBe('Microscope');
    expect($('.step-question').textContent).toBe('Are the cells corkscrews, or rods?');
    expect($('.bench-hint')).not.toBeNull();
    expect($('.run-test').hidden).toBe(false);
    expect($('.step-feedback').textContent).toBe('');
    expect(document.activeElement).toBe($('.step-name'));
  });

  it('offers to solve the case once one pal is left', async () => {
    await open('?pal=mona&case=elia');
    answer(1);
    $('.next-step').click();
    answer(0);
    expect($('.next-step').textContent).toBe('Solve the case');
  });
});

describe('solving the case', () => {
  it.each(PALS.map((p) => p.id).filter((id) => id !== 'mona'))('names %s at the end of her trail', async (id) => {
    await open(`?pal=mona&case=${id}`);
    solve(id);
    expect($('.case').hidden).toBe(true);
    expect($('.solved').hidden).toBe(false);
    const pal = PALS.find((p) => p.id === id);
    expect($('.solved-name').textContent).toBe(`It's ${pal.name}!`);
    expect($('.solved-pal .pal-icon').classList).toContain(id);
    expect($('.solved-species').textContent).toBe(SPECIES[id].scientific.replaceAll('*', ''));
    expect($$('.recap li')).toHaveLength(pathTo(id).length);
    expect(SPECIES[id].facts.map((f) => f.replaceAll('*', ''))).toContain($('.fun-fact-text').textContent);
    expect(document.title).toBe('PetriPals | Mona | Case solved');
  });

  it('gives Mona her own case when someone else is the detective', async () => {
    await open('?pal=vi&case=mona');
    solve('mona');
    expect($('.solved-name').textContent).toBe("It's Mona!");
    expect($$('.recap li').map((li) => li.textContent)).toEqual([
      'Gram stain: Pink',
      'Microscope: Rods',
      'Oxidase test: Purple',
      'Microscope: Straight',
      'Chocolate agar: Plain agar too',
    ]);
  });

  it('gives three stars with no wrong answers, fewer for each one, and never none', async () => {
    const starsAfter = async (wrong) => {
      await open('?pal=mona&case=vi');
      // The first step has only one wrong answer to tap, so spread the rest out.
      pathTo('vi').forEach(({ answer: right }, i) => {
        if (i < wrong) answer(1 - right);
        answer(right);
        $('.next-step').click();
      });
      return [$('.stars').textContent, $('.stars').getAttribute('aria-label')];
    };
    expect(await starsAfter(0)).toEqual(['★★★', '3 of 3 stars']);
    expect(await starsAfter(1)).toEqual(['★★☆', '2 of 3 stars']);
    expect(await starsAfter(3)).toEqual(['★☆☆', '1 of 3 stars']);
  });

  it('adds her to the Pal Book, which remembers past cases', async () => {
    await open('?pal=mona&case=vi');
    solve('vi');
    expect($('.book-count').textContent).toBe(`(1 of ${PALS.length} found)`);
    await open('?pal=mona&case=goldie');
    solve('goldie', 1);
    expect($('.book-count').textContent).toBe(`(2 of ${PALS.length} found)`);
    const found = $$('.pal-book li:not(.unfound) span').map((span) => span.textContent);
    expect(found.sort()).toEqual(['Goldie', 'Vi']);
    const unfound = $$('.pal-book .unfound');
    expect(unfound).toHaveLength(PALS.length - 2);
    expect(unfound[0].textContent).toBe('?');
    expect(unfound[0].getAttribute('aria-label')).toBe('Not found yet');
    expect(document.activeElement).toBe($('.solved-name'));
  });
});
