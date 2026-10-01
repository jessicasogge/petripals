// Checks the things every page shares: the PetriPals tab icon (not the
// browser's generic globe) and Jess's signature at the foot.
import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const file = (name) => new URL(`../public/${name}`, import.meta.url);
const PAGES = ['index.html', 'pal-picker.html', 'petri-dish.html'];

describe('tab icon', () => {
  it.each(PAGES)('%s links the icon, with a PNG for browsers without SVG icons', (page) => {
    const html = readFileSync(file(page), 'utf8');
    expect(html).toContain('<link rel="icon" href="./favicon.svg" type="image/svg+xml" />');
    expect(html).toContain('<link rel="icon" href="./favicon-32.png" type="image/png" sizes="32x32" />');
  });

  it('has both icon files', () => {
    expect(existsSync(file('favicon.svg'))).toBe(true);
    expect(existsSync(file('favicon-32.png'))).toBe(true);
  });
});

describe('signature', () => {
  it.each(PAGES)('%s is signed at the foot', (page) => {
    const html = readFileSync(file(page), 'utf8');
    expect(html).toContain('<footer class="signature">jsogge 2026</footer>');
  });
});
