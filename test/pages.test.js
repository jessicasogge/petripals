// Checks the things every page shares: the PetriPals tab icon (not the
// browser's generic globe) and Jess's signature at the foot.
import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { LEVELS, MIXED } from '../public/game/config.js';

const file = (name) => new URL(`../public/${name}`, import.meta.url);
const PAGES = ['index.html', 'pal-picker.html', 'choose-mode.html', 'choose-rivals.html', 'petri-dish.html', 'whos-that-pal.html'];

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

describe('the mode choice page', () => {
  // Its descriptions are typed into the page, so check they match the game.
  const html = readFileSync(file('choose-mode.html'), 'utf8');

  it('says how many levels classic has', () => {
    expect(html).toContain(`through ${LEVELS.length} levels`);
  });

  it('says how many rivals a mixed culture race can have', () => {
    expect(html).toContain(`Race up to ${MIXED.MAX_RIVALS} rival pals`);
  });
});

describe('the home page title', () => {
  const html = readFileSync(file('index.html'), 'utf8');
  const css = readFileSync(file('styles.css'), 'utf8');

  it('says what the game is under its name', () => {
    expect(html).toContain('<h1 class="logo">PetriPals</h1>');
    expect(html).toContain('<p class="tagline">Grow your colony. Dodge antibiotics.</p>');
  });

  it('links to FunGals, the sister game', () => {
    expect(html).toMatch(/The sister game to\s*<a href="https:\/\/jessicasogge\.github\.io\/fungals\/">FunGals<\/a>\./);
  });

  it("has every font file the stylesheet uses, each with its license", () => {
    const fonts = [...css.matchAll(/url\(\.\/(fonts\/[^)]+\.woff2)\)/g)].map((m) => m[1]);
    expect(fonts.length).toBeGreaterThan(0);
    for (const font of fonts) expect(existsSync(file(font)), font).toBe(true);
    expect(existsSync(file('fonts/Fredoka-OFL.txt'))).toBe(true);
    expect(existsSync(file('fonts/Nunito-OFL.txt'))).toBe(true);
  });

  it('preloads the title font, so the name shows up in it quickly', () => {
    const [, preloaded] = html.match(/<link rel="preload" href="\.\/([^"]+)" as="font"/);
    expect(css).toContain(`url(./${preloaded})`);
  });
});

describe('search engines and shared links', () => {
  const SITE = 'https://jessicasogge.github.io/petripals/';
  const meta = (html, attr, name) => html.match(new RegExp(`<meta ${attr}="${name}" content="([^"]*)"`))?.[1];

  it('names the game and what it is in the home page title', () => {
    expect(readFileSync(file('index.html'), 'utf8')).toContain('<title>PetriPals: A Microbiology Game</title>');
  });

  it.each(PAGES)('%s has a description short enough for a search result', (page) => {
    const description = meta(readFileSync(file(page), 'utf8'), 'name', 'description');
    expect(description).toBeTruthy();
    expect(description.length).toBeLessThanOrEqual(160);
  });

  it.each(PAGES)('%s says where it lives, for search engines and shared links', (page) => {
    const html = readFileSync(file(page), 'utf8');
    const address = page === 'index.html' ? SITE : SITE + page;
    expect(html).toContain(`<link rel="canonical" href="${address}" />`);
    expect(meta(html, 'property', 'og:url')).toBe(address);
  });

  it.each(PAGES)('%s shows a picture when its link is shared', (page) => {
    const html = readFileSync(file(page), 'utf8');
    const image = meta(html, 'property', 'og:image');
    expect(image.startsWith(SITE)).toBe(true); // apps need the full address
    expect(existsSync(file(image.slice(SITE.length)))).toBe(true);
    expect(meta(html, 'property', 'og:title')).toBeTruthy();
    expect(meta(html, 'property', 'og:description')).toBe(meta(html, 'name', 'description'));
    expect(meta(html, 'name', 'twitter:card')).toBe('summary_large_image');
  });

  it('lists real pages in the sitemap', () => {
    const sitemap = readFileSync(file('sitemap.xml'), 'utf8');
    const pages = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
    expect(pages).toContain(SITE);
    for (const address of pages) {
      expect(address.startsWith(SITE)).toBe(true);
      expect(existsSync(file(address.slice(SITE.length) || 'index.html')), address).toBe(true);
    }
  });
});

describe('Google Search Console', () => {
  // Proves to Google that Jess owns the site. Google checks it again from
  // time to time, so deleting or changing it would undo the verification.
  it('keeps the verification file, exactly as Google gave it', () => {
    const name = 'google32efa8321a61b455.html';
    expect(readFileSync(file(name), 'utf8')).toBe(`google-site-verification: ${name}`);
  });
});

