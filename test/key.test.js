// Detective mode's dichotomous key (key.js): every pal at exactly one end of
// it, its splits matching each pal's traits in config.js, and the helpers the
// page uses to walk it.
import { describe, expect, it } from 'vitest';
import { SPECIES } from '../public/game/config.js';
import { isPal, KEY, MAX_STARS, palsUnder, pathTo, starsFor } from '../public/game/key.js';
import { DRAWINGS } from '../public/game/lab.js';

// Every step in the key, top first.
function steps(step = KEY) {
  return [step, ...step.answers.filter((a) => !isPal(a.next)).flatMap((a) => steps(a.next))];
}

describe('the key', () => {
  it('ends at every pal exactly once', () => {
    const ends = palsUnder(KEY);
    expect([...ends].sort()).toEqual(Object.keys(SPECIES).sort());
    expect(new Set(ends).size).toBe(ends.length);
  });

  it('asks two-way questions, each with a name, a question, the science and a drawing', () => {
    for (const step of steps()) {
      expect(step.answers, step.name).toHaveLength(2);
      expect(step.name && step.question && step.why, step.name).toBeTruthy();
      expect(step.view === 'microscope' || Object.hasOwn(DRAWINGS, step.view), step.view).toBe(true);
      for (const answer of step.answers) {
        expect(answer.label && answer.seen, step.name).toBeTruthy();
        expect(answer.seen, answer.seen).toMatch(/^[A-Z].*\.$/); // a sentence, for screen readers
      }
      // Two different answers to tap.
      expect(step.answers[0].label).not.toBe(step.answers[1].label);
    }
  });

  it('starts with the Gram stain, splitting the pals the way their stain does', () => {
    expect(KEY.name).toBe('Gram stain');
    const [purple, pink] = KEY.answers.map((a) => palsUnder(a.next));
    for (const id of purple) expect(SPECIES[id].gram, id).toBe('positive');
    for (const id of pink) expect(SPECIES[id].gram, id).toBe('negative');
  });

  it('separates the round pals from the rods the way they grow', () => {
    const shape = KEY.answers[0].next;
    const [round, rods] = shape.answers.map((a) => palsUnder(a.next));
    for (const id of round) expect(SPECIES[id].kind, id).toBe('coccus');
    expect(rods).toContain('ceres'); // a rod, though she grows in chains like a coccus
  });

  it('uses the tests the pals\' own fun facts mention', () => {
    // Goldie fizzes in peroxide and Scarlett doesn't, as Scarlett's fact says.
    expect(SPECIES.scarlett.facts.join(' ')).toContain('catalase-negative');
    expect(pathTo('goldie').map((s) => s.step.name)).toContain('Catalase test');
    // Mona is oxidase-positive, and Coco needs chocolate agar.
    expect(SPECIES.mona.facts.join(' ')).toContain('oxidase-positive');
    expect(pathTo('mona')[2]).toMatchObject({ answer: 0 });
    expect(SPECIES.coco.facts.join(' ')).toContain('chocolate agar');
    expect(pathTo('coco').at(-1).step.name).toBe('Chocolate agar');
  });
});

describe('palsUnder', () => {
  it('gives just the pal for a pal, and every pal below a step', () => {
    expect(palsUnder('vi')).toEqual(['vi']);
    expect(palsUnder(KEY.answers[1].next).sort()).toEqual(['coco', 'elia', 'mona', 'sallie', 'vi']);
  });
});

describe('pathTo', () => {
  it.each(Object.keys(SPECIES))('leads to %s, one right answer per step', (id) => {
    const path = pathTo(id);
    expect(path[0].step).toBe(KEY);
    // Following the right answers from the top reaches her.
    let at = KEY;
    for (const { step, answer } of path) {
      expect(step).toBe(at);
      at = step.answers[answer].next;
    }
    expect(at).toBe(id);
  });

  it('finds nothing for someone who isn\'t in the key', () => {
    expect(pathTo('nobody')).toEqual([]);
  });

  it('takes Goldie three steps and Coco five', () => {
    expect(pathTo('goldie')).toHaveLength(3);
    expect(pathTo('coco')).toHaveLength(5);
  });
});

describe('stars', () => {
  it('gives three for no wrong answers, one fewer for each, but never less than one', () => {
    expect(MAX_STARS).toBe(3);
    expect([0, 1, 2, 3, 7].map(starsFor)).toEqual([3, 2, 1, 1, 1]);
  });
});
