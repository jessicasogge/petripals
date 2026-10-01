// Checks where the win spore burst comes from and that its colors are real
// colors.
import { describe, expect, it } from 'vitest';
import { AGAR_COLORS, burstOrigin } from '../public/game/spores.js';

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
