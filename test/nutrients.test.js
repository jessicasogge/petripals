// @vitest-environment jsdom
// nutrients.js adds elements to the page, so these tests run in jsdom, a
// simulated browser page.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { scatterNutrients } from '../public/game/nutrients.js';

const COUNT = 10; // flecks on the agar at a time
const RESPAWN_MS = 3000;

// Every fleck on the agar that hasn't been eaten, with its position as a
// fraction of the dish radius from the center (-1 to 1), read back from the
// left/top percentages it was placed at.
function liveFlecks() {
  return [...document.querySelectorAll('.agar .nutrient:not(.eaten)')].map((el) => ({
    el,
    fx: (parseFloat(el.style.left) - 50) / 50,
    fy: (parseFloat(el.style.top) - 50) / 50,
  }));
}

beforeEach(() => {
  document.body.innerHTML = '<div class="agar"></div>';
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('scattering nutrients', () => {
  it(`starts with ${COUNT} flecks on the agar`, () => {
    scatterNutrients();
    expect(liveFlecks()).toHaveLength(COUNT);
  });

  // Placement is random, so check the rules hold across many fresh dishes.
  it('keeps every fleck away from the rim', () => {
    for (let dish = 0; dish < 30; dish++) {
      document.body.innerHTML = '<div class="agar"></div>';
      scatterNutrients();
      for (const f of liveFlecks()) expect(Math.hypot(f.fx, f.fy)).toBeLessThanOrEqual(0.82);
    }
  });

  it('keeps the middle clear so the buddy does not start on top of food', () => {
    for (let dish = 0; dish < 30; dish++) {
      document.body.innerHTML = '<div class="agar"></div>';
      scatterNutrients();
      for (const f of liveFlecks()) expect(Math.hypot(f.fx, f.fy)).toBeGreaterThan(0.3);
    }
  });

  it('spaces flecks apart instead of clumping them', () => {
    for (let dish = 0; dish < 30; dish++) {
      document.body.innerHTML = '<div class="agar"></div>';
      scatterNutrients();
      const flecks = liveFlecks();
      for (let i = 0; i < flecks.length; i++) {
        for (let j = i + 1; j < flecks.length; j++) {
          const gap = Math.hypot(flecks[i].fx - flecks[j].fx, flecks[i].fy - flecks[j].fy);
          expect(gap).toBeGreaterThan(0.12);
        }
      }
    }
  });

  it('hides flecks from screen readers, since they are decoration', () => {
    scatterNutrients();
    for (const f of liveFlecks()) expect(f.el.getAttribute('aria-hidden')).toBe('true');
  });
});

describe('eating nutrients', () => {
  it('eats a fleck the buddy is on and reports it', () => {
    const nutrients = scatterNutrients();
    const [target] = liveFlecks();
    expect(nutrients.eatNear(target.fx, target.fy, 0.01)).toBe(1);
    expect(target.el.classList.contains('eaten')).toBe(true);
    expect(liveFlecks()).toHaveLength(COUNT - 1);
  });

  it('does not eat flecks that are out of reach', () => {
    const nutrients = scatterNutrients();
    // The middle is kept clear, so nothing is within 0.2 of the center.
    expect(nutrients.eatNear(0, 0, 0.2)).toBe(0);
    expect(liveFlecks()).toHaveLength(COUNT);
  });

  it('can eat several flecks at once with a big enough reach', () => {
    const nutrients = scatterNutrients();
    expect(nutrients.eatNear(0, 0, 2)).toBe(COUNT);
    expect(liveFlecks()).toHaveLength(0);
  });

  it('cannot eat the same fleck twice', () => {
    const nutrients = scatterNutrients();
    const [target] = liveFlecks();
    nutrients.eatNear(target.fx, target.fy, 0.01);
    expect(nutrients.eatNear(target.fx, target.fy, 0.01)).toBe(0);
  });

  it('removes an eaten fleck from the page once its shrink animation ends', () => {
    const nutrients = scatterNutrients();
    const [target] = liveFlecks();
    nutrients.eatNear(target.fx, target.fy, 0.01);
    expect(target.el.isConnected).toBe(true); // still shrinking away
    target.el.dispatchEvent(new Event('transitionend'));
    expect(target.el.isConnected).toBe(false);
  });
});

describe('respawning nutrients', () => {
  it(`replaces an eaten fleck ${RESPAWN_MS / 1000} seconds later, not sooner`, () => {
    const nutrients = scatterNutrients();
    const [target] = liveFlecks();
    nutrients.eatNear(target.fx, target.fy, 0.01);

    vi.advanceTimersByTime(RESPAWN_MS - 1);
    expect(liveFlecks()).toHaveLength(COUNT - 1);

    vi.advanceTimersByTime(1);
    expect(liveFlecks()).toHaveLength(COUNT);
  });

  it('puts the replacement somewhere else, not right where the buddy ate', () => {
    for (let round = 0; round < 20; round++) {
      document.body.innerHTML = '<div class="agar"></div>';
      const nutrients = scatterNutrients();
      const [target] = liveFlecks();
      nutrients.eatNear(target.fx, target.fy, 0.01);
      const before = new Set(liveFlecks().map((f) => f.el));
      vi.advanceTimersByTime(RESPAWN_MS);
      const replacement = liveFlecks().find((f) => !before.has(f.el));
      expect(Math.hypot(replacement.fx - target.fx, replacement.fy - target.fy)).toBeGreaterThan(0.3);
    }
  });

  it('keeps the count steady through lots of eating', () => {
    const nutrients = scatterNutrients();
    for (let bite = 0; bite < 25; bite++) {
      const [target] = liveFlecks();
      nutrients.eatNear(target.fx, target.fy, 0.01);
      vi.advanceTimersByTime(RESPAWN_MS);
    }
    expect(liveFlecks()).toHaveLength(COUNT);
  });

  it('stops replacing flecks once the game is over', () => {
    const nutrients = scatterNutrients();
    const [target] = liveFlecks();
    nutrients.eatNear(target.fx, target.fy, 0.01);
    nutrients.stop();
    vi.advanceTimersByTime(RESPAWN_MS * 2);
    expect(liveFlecks()).toHaveLength(COUNT - 1);
  });
});
