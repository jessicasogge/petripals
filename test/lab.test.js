// @vitest-environment jsdom
// Detective mode's lab bench (lab.js): each test's result drawn for the
// mystery pal, labeled for screen readers.
import { describe, expect, it } from 'vitest';
import { SPECIES } from '../public/game/config.js';
import { KEY, palsUnder, pathTo } from '../public/game/key.js';
import { CELL_SHAPES, DRAWINGS, labView, slide } from '../public/game/lab.js';
import { STAINS } from '../public/game/stain.js';

describe('labView', () => {
  it('shows plain cells under the microscope, Gram stained, not the pal herself', () => {
    const view = labView(KEY, 0, 'goldie');
    expect(view.className).toBe('lab-view lab-microscope');
    expect(view.getAttribute('role')).toBe('img');
    expect(view.getAttribute('aria-label')).toBe('The cells are stained purple.');
    expect(view.querySelector('.pal-icon')).toBeNull();
    expect(view.querySelector('svg').getAttribute('aria-hidden')).toBe('true');
    expect(view.querySelectorAll('.cell circle')).toHaveLength(8);
    expect(view.querySelector('.cell circle').getAttribute('fill')).toBe(STAINS.positive.body);
  });

  it("doesn't name her for screen readers: it says only what the test shows", () => {
    for (const { step, answer } of pathTo('scarlett')) {
      const label = labView(step, answer, 'scarlett').getAttribute('aria-label');
      expect(label).not.toMatch(/Scarlett|Streptococcus/);
    }
  });

  it('draws the other tests as pictures, hidden from screen readers behind the label', () => {
    const [, , catalase] = pathTo('goldie');
    const view = labView(catalase.step, catalase.answer, 'goldie');
    expect(view.className).toBe('lab-view lab-catalase');
    expect(view.getAttribute('aria-label')).toBe('Lots of bubbles fizz up in the drop.');
    expect(view.querySelector('svg').getAttribute('aria-hidden')).toBe('true');
    expect(view.querySelectorAll('.bubble').length).toBeGreaterThan(0);
  });
});

describe('the drawings', () => {
  // Draw one test's result into an <svg> to count its parts.
  const draw = (view, result) => {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.innerHTML = DRAWINGS[view](result);
    return svg;
  };

  it('fizzes for catalase, and sits still without it', () => {
    expect(draw('catalase', 0).querySelectorAll('.bubble').length).toBeGreaterThan(5);
    expect(draw('catalase', 1).querySelectorAll('.bubble')).toHaveLength(0);
  });

  it('rings the colonies green or clear on blood agar', () => {
    expect(draw('blood', 0).innerHTML).toContain('#65a30d');
    expect(draw('blood', 1).innerHTML).not.toContain('#65a30d');
  });

  it('shows green spores only for a spore former', () => {
    expect(draw('spores', 0).querySelectorAll('.spore')).toHaveLength(4);
    expect(draw('spores', 1).querySelectorAll('.spore')).toHaveLength(0);
  });

  it('grows near the air, or only at the bottom of the tube', () => {
    const highest = (result) => Math.min(...[...draw('oxygen', result).querySelectorAll('circle')].map((c) => +c.getAttribute('cy')));
    expect(highest(0)).toBeLessThan(40);
    expect(highest(1)).toBeGreaterThan(100);
  });

  it('turns the oxidase strip purple, or leaves it pale', () => {
    expect(draw('oxidase', 0).innerHTML).toContain('#4c1d95');
    expect(draw('oxidase', 1).innerHTML).not.toContain('#4c1d95');
  });

  it('grows on both plates, or only on chocolate agar', () => {
    const colonies = (result) => draw('chocolate', result).querySelectorAll('circle[r="6"], circle[r="5"]').length;
    expect(colonies(0)).toBe(8);
    expect(colonies(1)).toBe(4);
  });
});

describe('the microscope slide', () => {
  const draw = (id) => {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.innerHTML = slide(id);
    return svg;
  };
  // The pals under the answer labeled `label` at the microscope step `question`.
  const under = (question, label) => {
    const walk = (step) => {
      if (typeof step === 'string') return null;
      if (step.question === question) return palsUnder(step.answers.find((a) => a.label === label).next);
      for (const a of step.answers) {
        const found = walk(a.next);
        if (found) return found;
      }
      return null;
    };
    return walk(KEY);
  };

  it('knows the cell shape of every pal', () => {
    expect(Object.keys(CELL_SHAPES).sort()).toEqual(Object.keys(SPECIES).sort());
  });

  it('matches the key: round cells, corkscrews and curved rods where the key says so', () => {
    for (const id of under('Are the cells round, or rods?', 'Round')) expect(CELL_SHAPES[id], id).toBe('cocci');
    for (const id of under('Are the cells round, or rods?', 'Rods')) expect(CELL_SHAPES[id], id).toBe('rods');
    expect(under('Are the cells corkscrews, or rods?', 'Corkscrew').map((id) => CELL_SHAPES[id])).toEqual(['spirochetes']);
    expect(under('Are the rods curved, or straight?', 'Curved').map((id) => CELL_SHAPES[id])).toEqual(['curved']);
    for (const id of under('Are the rods curved, or straight?', 'Straight')) expect(CELL_SHAPES[id], id).toBe('rods');
  });

  it.each(Object.keys(SPECIES))('draws %s as eight plain cells in her stain colors', (id) => {
    const svg = draw(id);
    expect(svg.querySelectorAll('.cell')).toHaveLength(8);
    const colors = new Set([...svg.querySelectorAll('.cell [fill], .cell [stroke]')].flatMap((el) =>
      [el.getAttribute('fill'), el.getAttribute('stroke')].filter((c) => c && c !== 'none')));
    const stain = Object.values(SPECIES[id].faintStain ? STAINS.faint : STAINS[SPECIES[id].gram]);
    for (const color of colors) expect(stain, `${id}: ${color}`).toContain(color);
    // No face: nothing to tell one pal from another of the same shape.
    expect(svg.querySelector('.face')).toBeNull();
  });

  it('draws each shape its own way', () => {
    expect(draw('goldie').querySelectorAll('.cell circle')).toHaveLength(8);
    expect(draw('mona').querySelectorAll('.cell rect')).toHaveLength(8);
    expect(draw('vi').querySelectorAll('.cell path')).toHaveLength(16);
    expect(draw('elia').querySelector('.cell path').getAttribute('d')).toContain('T');
  });

  it('looks the same for two pals of the same shape and stain', () => {
    expect(slide('mona')).toBe(slide('sallie'));
    expect(slide('goldie')).toBe(slide('scarlett'));
  });
});
