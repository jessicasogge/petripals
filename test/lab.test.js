// @vitest-environment jsdom
// Detective mode's lab bench (lab.js): each test's result drawn for the
// mystery pal, labeled for screen readers.
import { describe, expect, it } from 'vitest';
import { KEY, pathTo } from '../public/game/key.js';
import { DRAWINGS, labView } from '../public/game/lab.js';

describe('labView', () => {
  it('shows the pal under the microscope, Gram stained, without her tile color', () => {
    const view = labView(KEY, 0, 'goldie');
    expect(view.className).toBe('lab-view lab-microscope');
    expect(view.getAttribute('role')).toBe('img');
    expect(view.getAttribute('aria-label')).toBe('The cells are stained purple.');
    // Her drawing, recolored with the stain.
    expect(view.querySelector('.pal-icon svg [style*="fill"]')).not.toBeNull();
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
