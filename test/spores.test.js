// @vitest-environment jsdom
// The spore burst when a colony wins: where it comes from, how big it is,
// and that it can never break the game. The confetti library is swapped for
// a stand-in that records each burst.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../public/game/vendor/confetti.js', () => ({
  default: Object.assign(vi.fn(), { shapeFromPath: vi.fn(() => 'spore-shape') }),
}));

const { default: confetti } = await import('../public/game/vendor/confetti.js');
const { AGAR_COLORS, burstOrigin, sporeBurst } = await import('../public/game/spores.js');

describe('burstOrigin', () => {
  it('bursts from the middle of the element, as fractions of the window', () => {
    const rect = { left: 100, top: 200, width: 50, height: 100 };
    expect(burstOrigin(rect, 1000, 500)).toEqual({ x: 0.125, y: 0.5 });
  });

  it('uses the middle of the window when there is no element', () => {
    expect(burstOrigin(undefined, 1000, 500)).toEqual({ x: 0.5, y: 0.5 });
  });

  it('stays on screen if the element is partly off it', () => {
    const rect = { left: -200, top: 900, width: 100, height: 100 };
    expect(burstOrigin(rect, 1000, 500)).toEqual({ x: 0, y: 1 });
  });
});

describe('AGAR_COLORS', () => {
  it('are all six-digit hex colors', () => {
    for (const color of AGAR_COLORS) expect(color).toMatch(/^#[0-9A-F]{6}$/i);
  });
});

describe('sporeBurst', () => {
  // The player's pal: 100 x 100px with its top left at (300, 100), in a
  // 1000 x 500 window, so its middle is at (0.35, 0.3).
  const pal = { getBoundingClientRect: () => ({ left: 300, top: 100, width: 100, height: 100 }) };

  beforeEach(() => {
    vi.stubGlobal('innerWidth', 1000);
    vi.stubGlobal('innerHeight', 500);
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  const bursts = () => confetti.mock.calls.map(([options]) => options);

  it('beating a level: one quick little puff from your pal', () => {
    sporeBurst(pal);
    vi.runAllTimers();
    expect(bursts()).toHaveLength(1);
    const [puff] = bursts();
    expect(puff.origin).toEqual({ x: 0.35, y: 0.3 });
    expect(puff.particleCount).toBe(30);
    expect(puff.ticks).toBeLessThan(100); // gone in under a second or so
  });

  it('beating the last level: a big burst in three waves', () => {
    sporeBurst(pal, { big: true });
    expect(bursts()).toHaveLength(1); // the first wave right away
    vi.advanceTimersByTime(180);
    expect(bursts()).toHaveLength(2);
    vi.advanceTimersByTime(270);
    expect(bursts()).toHaveLength(3);
    const total = bursts().reduce((n, b) => n + b.particleCount, 0);
    expect(total).toBeGreaterThan(30 * 10);
  });

  it('uses agar colors, bursts every direction, and respects reduced motion', () => {
    sporeBurst(pal, { big: true });
    vi.runAllTimers();
    for (const burst of bursts()) {
      expect(burst.colors).toBe(AGAR_COLORS);
      expect(burst.spread).toBe(360);
      expect(burst.disableForReducedMotion).toBe(true);
      expect(burst.shapes).toEqual(['spore-shape', 'circle']);
    }
  });

  it('bursts from the middle of the screen without a pal to burst from', () => {
    sporeBurst(null);
    expect(bursts()[0].origin).toEqual({ x: 0.5, y: 0.5 });
  });

  it("never breaks the game, even if the confetti can't be drawn", () => {
    confetti.mockImplementationOnce(() => {
      throw new Error('no canvas');
    });
    expect(() => sporeBurst(pal)).not.toThrow();
  });
});

describe('the spore shape', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('falls back to plain circles in a browser that can\'t draw custom shapes', async () => {
    // spores.js makes its shape once, so load a fresh copy of it.
    vi.resetModules();
    const fresh = await import('../public/game/vendor/confetti.js');
    fresh.default.shapeFromPath.mockImplementationOnce(() => {
      throw new Error('no Path2D');
    });
    const { sporeBurst: burst } = await import('../public/game/spores.js');
    burst(null);
    expect(fresh.default.mock.calls[0][0].shapes).toEqual(['circle', 'circle']);
  });
});
