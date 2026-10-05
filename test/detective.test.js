// @vitest-environment jsdom
// Detective mode (detective.js): loads the real page into jsdom, solves cases
// by tapping through the key, and checks the stars, the suspects and the key
// shown at the end.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SPECIES } from '../public/game/config.js';
import { couplets, pathTo } from '../public/game/key.js';
import { PALS } from '../public/game/pals.js';

const page = readFileSync(resolve(process.cwd(), 'public/detective.html'), 'utf8');
const body = page.slice(page.indexOf('<body'), page.indexOf('</body>'));
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

async function open(search = '') {
  vi.stubGlobal('location', { search, href: `http://localhost/detective.html${search}` });
  document.body.outerHTML = body;
  vi.resetModules();
  await import('../public/game/detective.js');
}

// Run the current test and tap answer `index`.
function answer(index) {
  if (!$('.run-test').hidden) $('.run-test').click();
  $$('.answer-btn')[index].click();
}

// Solve the case for `id`, getting one answer wrong at each of the first
// `wrong` steps.
function solve(id, wrong = 0) {
  pathTo(id).forEach(({ answer: right }, i) => {
    if (i < wrong) answer(1 - right);
    answer(right);
    $('.next-step').click();
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('opening a case', () => {
  it('needs no pal picked first', async () => {
    await open();
    expect(document.title).toBe('PetriPals | Detective');
    expect($('.step-name').textContent).toBe('Gram stain');
  });

  it('lists every pal as a suspect', async () => {
    await open('?case=vi');
    expect($$('.suspects li').map((li) => li.dataset.pal)).toEqual(PALS.map((p) => p.id));
    expect($('.suspect-count').textContent).toBe(`(${PALS.length} left)`);
    expect($$('.suspects .ruled-out')).toHaveLength(0);
  });

  it('picks the mystery pal at random, unless the address names a real pal', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.99);
    const last = PALS.at(-1);
    await open();
    solve(last.id);
    expect($('.solved-name').textContent).toBe(`It's ${last.name}!`);
    await open('?case=nobody');
    solve(last.id);
    expect($('.solved-name').textContent).toBe(`It's ${last.name}!`);
  });

  it('starts at the Gram stain, with the sample waiting', async () => {
    await open('?case=vi');
    expect($('.step-question').textContent).toBe('What color are the cells?');
    expect($('.bench-hint').textContent).toBe('The sample is ready.');
    expect($('.answers').hidden).toBe(true);
    expect($('.next-step').hidden).toBe(true);
  });
});

describe('running tests', () => {
  it('shows the result and the two answers when you run a test', async () => {
    await open('?case=vi');
    $('.run-test').click();
    expect($('.lab-bench .lab-view').getAttribute('aria-label')).toBe('The cells are stained pink.');
    expect($('.run-test').hidden).toBe(true);
    expect($$('.answer-btn').map((b) => b.textContent)).toEqual(['Purple', 'Pink']);
    expect(document.activeElement).toBe($('.answer-btn'));
  });

  it('marks a wrong answer and lets you try again', async () => {
    await open('?case=vi');
    answer(0);
    expect($$('.answer-btn')[0].disabled).toBe(true);
    expect($$('.answer-btn')[0].classList).toContain('wrong');
    expect($('.step-feedback').textContent).toBe('Not quite. Look at the result again!');
    expect($('.next-step').hidden).toBe(true);
    expect($$('.trail li')).toHaveLength(0);
  });

  it('explains the science, adds to the trail and rules out suspects for a right answer', async () => {
    await open('?case=vi');
    answer(1);
    expect($('.step-feedback').textContent).toMatch(/^Yes! Thick cell walls/);
    expect($('.step-feedback').classList).toContain('correct');
    expect($$('.answer-btn').every((b) => b.disabled)).toBe(true);
    expect($$('.trail li').map((li) => li.textContent)).toEqual(['Gram stain: Pink']);
    const left = $$('.suspects li:not(.ruled-out)').map((li) => li.dataset.pal);
    expect(left.sort()).toEqual(['coco', 'elia', 'mona', 'sallie', 'vi']);
    expect($('.suspect-count').textContent).toBe('(5 left)');
    expect($('.next-step').textContent).toBe('Next test');
    expect(document.activeElement).toBe($('.next-step'));
  });

  it('moves on to the next test, with a fresh bench', async () => {
    await open('?case=vi');
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
    await open('?case=elia');
    answer(1);
    $('.next-step').click();
    answer(0);
    expect($('.next-step').textContent).toBe('Solve the case');
  });
});

describe('solving the case', () => {
  it.each(PALS.map((p) => p.id))('names %s at the end of her trail', async (id) => {
    await open(`?case=${id}`);
    solve(id);
    expect($('.case').hidden).toBe(true);
    expect($('.solved').hidden).toBe(false);
    const pal = PALS.find((p) => p.id === id);
    expect($('.solved-name').textContent).toBe(`It's ${pal.name}!`);
    expect($('.solved-pal .pal-icon').classList).toContain(id);
    expect($('.solved-species').textContent).toBe(SPECIES[id].scientific.replaceAll('*', ''));
    expect(SPECIES[id].facts.map((f) => f.replaceAll('*', ''))).toContain($('.fun-fact-text').textContent);
    expect(document.title).toBe(`PetriPals | Detective | It's ${pal.name}!`);
    expect(document.activeElement).toBe($('.solved-name'));
  });

  it('gives three stars with no wrong answers, fewer for each one, and never none', async () => {
    const starsAfter = async (wrong) => {
      await open('?case=vi');
      solve('vi', wrong);
      return [$('.stars').textContent, $('.stars').getAttribute('aria-label')];
    };
    expect(await starsAfter(0)).toEqual(['★★★', '3 of 3 stars']);
    expect(await starsAfter(1)).toEqual(['★★☆', '2 of 3 stars']);
    expect(await starsAfter(3)).toEqual(['★☆☆', '1 of 3 stars']);
  });
});

describe('the key at the end', () => {
  it('shows every couplet, numbered, each with its two answers', async () => {
    await open('?case=coco');
    solve('coco');
    const shown = $$('.couplet');
    expect(shown).toHaveLength(couplets().length);
    expect(shown[0].id).toBe('couplet-1');
    expect(shown[0].querySelector('.couplet-step').textContent).toBe('1. Gram stain What color are the cells?');
    const leads = [...shown[0].querySelectorAll('.lead')];
    expect(leads.map((l) => l.querySelector('.lead-letter').textContent)).toEqual(['1a', '1b']);
    expect(leads.map((l) => l.querySelector('.lead-label').textContent)).toEqual(['Purple', 'Pink']);
  });

  it('says where each answer goes: another couplet, or a pal', async () => {
    await open('?case=coco');
    solve('coco');
    const [purple, pink] = $('#couplet-1').querySelectorAll('.lead');
    expect(purple.querySelector('.lead-to').textContent).toBe('Go to 2');
    expect(purple.querySelector('.lead-to').getAttribute('href')).toBe('#couplet-2');
    expect($(pink.querySelector('.lead-to').getAttribute('href')).querySelector('.couplet-step b').textContent).toBe('7. Microscope');
    // Every pal is at the end of exactly one answer.
    const ends = $$('.lead-pal-name').map((name) => name.textContent);
    expect(ends.sort()).toEqual(PALS.map((p) => p.name).sort());
    expect($$('.lead-pal .pal-icon')).toHaveLength(PALS.length);
  });

  it('highlights the path to the mystery pal, and tells screen readers', async () => {
    await open('?case=coco');
    solve('coco');
    const taken = $$('.lead.on-path');
    expect(taken.map((l) => l.querySelector('.lead-label').textContent)).toEqual(
      pathTo('coco').map(({ step, answer: right }) => step.answers[right].label),
    );
    expect(taken.at(-1).querySelector('.lead-pal-name').textContent).toBe('Coco');
    expect(taken.every((l) => l.querySelector('.visually-hidden').textContent === ' (your path)')).toBe(true);
    expect($$('.couplet.on-path')).toHaveLength(pathTo('coco').length);
    expect($$('.lead:not(.on-path) .visually-hidden')).toHaveLength(0);
  });
});
