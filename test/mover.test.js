// @vitest-environment jsdom
// mover.js works with elements on the page, so these tests run in jsdom, a
// simulated browser page.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { idlePose, newMover } from '../public/game/mover.js';

const SVG = 'http://www.w3.org/2000/svg';

beforeEach(() => {
  document.body.innerHTML = '<div class="agar"></div>';
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('newMover', () => {
  function makeArt() {
    const svg = document.createElementNS(SVG, 'svg');
    svg.setAttribute('role', 'img');
    svg.setAttribute('aria-label', 'Mona, a green rod');
    return svg;
  }

  it('adds a new offspring holder to the agar with the art inside', () => {
    const svg = makeArt();
    const mover = newMover(svg);
    expect(mover.parentElement).toBe(document.querySelector('.agar'));
    expect(mover.classList.contains('pal-mover')).toBe(true);
    expect(mover.classList.contains('offspring')).toBe(true);
    expect(mover.firstChild).toBe(svg);
  });

  it('hides the copy from screen readers, so only the player pal is announced', () => {
    const svg = makeArt();
    newMover(svg);
    expect(svg.hasAttribute('role')).toBe(false);
    expect(svg.hasAttribute('aria-label')).toBe(false);
    expect(svg.getAttribute('aria-hidden')).toBe('true');
  });

  it('gives each offspring its own holder', () => {
    const a = newMover(makeArt());
    const b = newMover(makeArt());
    expect(a).not.toBe(b);
    expect(document.querySelectorAll('.agar .pal-mover')).toHaveLength(2);
  });
});

describe('idlePose', () => {
  // jsdom doesn't run CSS animations, so stand in for what the browser would
  // report mid-animation: the drawing's current transform, as a matrix, and
  // the point it pivots around (in px from the drawing's top-left corner).
  class Matrix {
    constructor(text) {
      [this.a, this.b, this.c, this.d, this.e, this.f] = text.match(/-?[\d.]+(?:e-?\d+)?/g).map(Number);
    }
  }
  function posed({ transform, origin = '50px 50px', size = 100 }) {
    const box = document.createElement('div');
    Object.defineProperty(box, 'offsetWidth', { value: size });
    Object.defineProperty(box, 'offsetHeight', { value: size });
    const svg = document.createElementNS(SVG, 'svg');
    box.appendChild(svg);
    vi.stubGlobal('DOMMatrixReadOnly', Matrix);
    vi.spyOn(window, 'getComputedStyle').mockReturnValue({ transform, transformOrigin: origin });
    return idlePose(svg);
  }
  const deg = (d) => (d * Math.PI) / 180;

  it('leaves circles alone when the drawing has no animation', () => {
    const pose = posed({ transform: 'none' });
    expect(pose(12, -5, 3)).toEqual([12, -5, 3]);
  });

  it('leaves circles alone in a browser that can\'t read the animation', () => {
    const svg = document.createElementNS(SVG, 'svg');
    document.body.appendChild(svg);
    vi.stubGlobal('DOMMatrixReadOnly', undefined);
    vi.spyOn(window, 'getComputedStyle').mockReturnValue({ transform: 'matrix(1, 0, 0, 1, 0, -10)', transformOrigin: '0px 0px' });
    expect(idlePose(svg)(4, 5, 6)).toEqual([4, 5, 6]);
  });

  it('follows a bob: everything moves up with the drawing', () => {
    const pose = posed({ transform: 'matrix(1, 0, 0, 1, 0, -10)' }); // translateY(-10px)
    const [x, y, r] = pose(20, 5, 4);
    expect([x, y, r]).toEqual([20, -5, 4]);
  });

  it('follows a wobble: turning around the middle of the drawing', () => {
    const pose = posed({ transform: 'matrix(0, 1, -1, 0, 0, 0)' }); // rotate(90deg)
    const [x, y, r] = pose(30, 0, 5); // a point to the right of center...
    expect(x).toBeCloseTo(0); // ...ends up below it
    expect(y).toBeCloseTo(30);
    expect(r).toBeCloseTo(5);
  });

  it('follows a squish around the bottom of the drawing, using the bigger stretch for size', () => {
    // scale(1.08, 0.92) pivoting on the bottom center, like Goldie's squish.
    const pose = posed({ transform: 'matrix(1.08, 0, 0, 0.92, 0, 0)', origin: '50px 100px' });
    const [x, y, r] = pose(10, 0, 10);
    expect(x).toBeCloseTo(10.8); // wider
    expect(y).toBeCloseTo(4); // flattened down toward the bottom (50px below center)
    expect(r).toBeCloseTo(10.8); // circles grow by the bigger stretch, so touches aren't missed
    // The bottom center itself doesn't move.
    const [bx, by] = pose(0, 50, 1);
    expect(bx).toBeCloseTo(0);
    expect(by).toBeCloseTo(50);
  });

  it('follows a slither: leaning sideways more the further from the middle', () => {
    const t = Math.tan(deg(8));
    const pose = posed({ transform: `matrix(1, 0, ${t}, 1, 0, 0)` }); // skewX(8deg)
    expect(pose(0, 0, 2)[0]).toBeCloseTo(0);
    expect(pose(0, -20, 2)[0]).toBeCloseTo(-20 * t);
    expect(pose(0, 20, 2)[0]).toBeCloseTo(20 * t);
  });
});
