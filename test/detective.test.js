// @vitest-environment jsdom
// Detective mode (detective.js): loads the real page into jsdom, solves cases
// by tapping through the key, and checks the suspects and the key shown at
// the end.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SPECIES } from '../public/game/config.js';
import { KEY, palsUnder, pathTo } from '../public/game/key.js';
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

// Tap answer `index` to the current test.
function answer(index) {
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

  it("starts at the Gram stain, with its result and both answers showing: there's nothing to tap first", async () => {
    await open('?case=vi');
    expect($('.step-question').textContent).toBe('What color are the cells?');
    expect($('.run-test')).toBeNull();
    expect($('.lab-bench .lab-view').getAttribute('aria-label')).toBe('The cells are stained pink.');
    expect($$('.answer-btn').map((b) => b.textContent)).toEqual(['Purple', 'Pink']);
    expect($('.next-step').hidden).toBe(true);
  });
});

describe('answering', () => {
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
    expect($('.next-step').textContent).toBe('Next test');
    expect(document.activeElement).toBe($('.next-step'));
  });

  it("moves on to the next test, showing its result and fresh answers", async () => {
    await open('?case=vi');
    answer(1);
    $('.next-step').click();
    expect($('.step-name').textContent).toBe('Microscope');
    expect($('.step-question').textContent).toBe('Are the cells corkscrews, or rods?');
    expect($('.lab-bench .lab-view').getAttribute('aria-label')).toBe('The cells are rods.');
    expect($$('.answer-btn').map((b) => [b.textContent, b.disabled])).toEqual([['Corkscrew', false], ['Rods', false]]);
    expect($('.next-step').hidden).toBe(true);
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
    // Only among the PetriPals: the key can't name a species among all bacteria.
    expect($('.solved-note').textContent).toBe(
      `Out of the ${PALS.length} PetriPals, only ${pal.name} fits these results. A real lab would run more tests to be sure.`,
    );
    expect(SPECIES[id].facts.map((f) => f.replaceAll('*', ''))).toContain($('.fun-fact-text').textContent);
    expect(document.title).toBe(`PetriPals | Detective | It's ${pal.name}!`);
    expect(document.activeElement).toBe($('.solved-name'));
  });

  it("doesn't keep score: no stars, however many answers were wrong", async () => {
    await open('?case=vi');
    solve('vi', 3);
    expect($('.solved-name').textContent).toBe("It's Vi!");
    expect($('.stars')).toBeNull();
    expect($('.solved').textContent).not.toMatch(/[★☆]|stars?\b/);
  });
});

describe('the key at the end', () => {
  // Each branch of the tree: its answer label and the test or pal it leads to.
  const box = (node) => {
    const b = node.querySelector(':scope > .node-box');
    return [b.querySelector('.node-answer')?.textContent ?? null, b.querySelector('.node-name').textContent];
  };

  it('starts at the Gram stain and branches into every test and pal, the way the key does', async () => {
    await open('?case=coco');
    solve('coco');
    const root = $('.key-tree > .key-node');
    expect($$('.key-tree > li')).toHaveLength(1);
    expect(box(root)).toEqual([null, 'Gram stain']);
    // The tree has one branch for every answer in the key.
    const answers = (step) => step.answers.flatMap((a) => [a, ...(typeof a.next === 'string' ? [] : answers(a.next))]);
    expect($$('.key-tree .node-answer')).toHaveLength(answers(KEY).length);
    // Under the Gram stain: Purple, then Pink, each leading to the microscope.
    const kids = [...root.querySelectorAll(':scope > ul > .key-node')];
    expect(kids.map(box)).toEqual([['Purple', 'Microscope'], ['Pink', 'Microscope']]);
    // Every pal is at the end of exactly one branch, with her picture.
    const ends = $$('.node-pal .node-name').map((name) => name.textContent);
    expect(ends.sort()).toEqual(PALS.map((p) => p.name).sort());
    expect($$('.node-pal .pal-icon')).toHaveLength(PALS.length);
    expect($$('.node-pal .pal-icon.coco')).toHaveLength(1);
    // A pal's branch ends there.
    expect($$('.node-pal + ul')).toHaveLength(0);
  });

  it('puts each pal under the branch the key sends her down', async () => {
    await open('?case=coco');
    solve('coco');
    const pink = $$('.key-tree > .key-node > ul > .key-node')[1];
    const under = [...pink.querySelectorAll('.node-pal .node-name')].map((n) => n.textContent.toLowerCase());
    expect(under.sort()).toEqual(palsUnder(KEY.answers[1].next).sort());
  });

  it('highlights the path to the mystery pal, and tells screen readers', async () => {
    await open('?case=coco');
    solve('coco');
    const taken = $$('.key-node.on-path');
    expect(taken.map(box)).toEqual([
      [null, 'Gram stain'],
      ['Pink', 'Microscope'],
      ['Rods', 'Oxidase test'],
      ['Purple', 'Microscope'],
      ['Straight', 'Chocolate agar'],
      ['Only chocolate', 'Coco'],
    ]);
    expect(taken.every((n) => n.querySelector(':scope > .node-box .visually-hidden').textContent === ' (your path)')).toBe(true);
    expect($$('.key-node:not(.on-path) > .node-box .visually-hidden')).toHaveLength(0);
  });

  it("colors the line running past the branches above hers, and only those", async () => {
    await open('?case=coco');
    solve('coco');
    // Pink is the second branch under the Gram stain, so the line to it runs past Purple.
    const trunk = $$('.key-node.trunk-on').map(box);
    expect(trunk).toEqual([['Purple', 'Microscope'], ['Corkscrew', 'Elia'], ['Curved', 'Vi'], ['Plain agar too', 'Mona']]);
    await open('?case=goldie');
    solve('goldie');
    expect($$('.key-node.trunk-on')).toHaveLength(0); // first branch every time
  });
});
