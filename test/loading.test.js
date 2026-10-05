// @vitest-environment jsdom
// loading.js shows the small "Growing the colony…" card while the next
// screen loads. These tests run it on a simulated page in jsdom.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

let loading;

beforeEach(async () => {
  document.body.innerHTML = '';
  vi.resetModules();
  loading = await import('../public/game/loading.js');
});

afterEach(() => {
  vi.unstubAllGlobals();
});

const card = () => document.querySelector('.loading-overlay');

describe('the loading card', () => {
  it('is not on the page until something loads', () => {
    expect(card()).toBeNull();
  });

  it('says "Growing the colony…", as a status a screen reader reads out', () => {
    loading.showLoading();
    expect(card().hidden).toBe(false);
    expect(card().textContent).toBe('Growing the colony…');
    expect(card().querySelector('[role="status"]')).not.toBeNull();
    // The dividing cell is decoration.
    expect(card().querySelector('.loading-cells').getAttribute('aria-hidden')).toBe('true');
  });

  it('is only ever made once', () => {
    loading.showLoading();
    loading.hideLoading();
    loading.showLoading();
    expect(document.querySelectorAll('.loading-overlay')).toHaveLength(1);
  });

  it('is made again if the page was swapped out from under it', () => {
    loading.showLoading();
    document.body.innerHTML = '';
    loading.showLoading();
    expect(card().hidden).toBe(false);
  });

  it('can be hidden again', () => {
    loading.showLoading();
    loading.hideLoading();
    expect(card().hidden).toBe(true);
  });

  it("doesn't mind being hidden before it was ever shown", () => {
    expect(() => loading.hideLoading()).not.toThrow();
  });
});

describe('goTo', () => {
  it('shows the card, then goes to the address', () => {
    const location = { href: 'http://localhost/petri-dish.html?pal=mona' };
    vi.stubGlobal('location', location);
    loading.goTo('./choose-rivals.html?pal=mona');
    expect(card().hidden).toBe(false);
    expect(location.href).toBe('./choose-rivals.html?pal=mona');
  });
});

describe('following links', () => {
  // A link on the page, clicked with `options` (a plain left click unless
  // they say otherwise). Clicks are cancelled after the card has had its
  // say, so jsdom doesn't try to leave the page.
  function click(attributes, options = {}) {
    const link = document.createElement('a');
    for (const [name, value] of Object.entries(attributes)) link.setAttribute(name, value);
    link.textContent = 'Go';
    document.body.append(link);
    document.addEventListener('click', (event) => event.preventDefault(), { once: true });
    link.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, button: 0, ...options }));
    return card();
  }

  beforeEach(() => loading.watchLoading());

  it('shows the card for a link to another PetriPals page', () => {
    expect(click({ href: './pal-picker.html' }).hidden).toBe(false);
  });

  it('shows the card for the same page with a different address (next level)', () => {
    expect(click({ href: '?level=2' }).hidden).toBe(false);
  });

  it('shows the card for a click on something inside the link', () => {
    const link = document.createElement('a');
    link.href = './pal-picker.html';
    const inside = document.createElement('span');
    link.append(inside);
    document.body.append(link);
    document.addEventListener('click', (event) => event.preventDefault(), { once: true });
    inside.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    expect(card().hidden).toBe(false);
  });

  it.each([
    ['another site', { href: 'https://example.com/' }, {}],
    ['a new tab', { href: './pal-picker.html', target: '_blank' }, {}],
    ['a download', { href: './social-preview.png', download: '' }, {}],
    ['a spot on this page', { href: '#how-to-play' }, {}],
    ['a ctrl-click', { href: './pal-picker.html' }, { ctrlKey: true }],
    ['a cmd-click', { href: './pal-picker.html' }, { metaKey: true }],
    ['a shift-click', { href: './pal-picker.html' }, { shiftKey: true }],
    ['an alt-click', { href: './pal-picker.html' }, { altKey: true }],
    ['a middle click', { href: './pal-picker.html' }, { button: 1 }],
  ])('stays away for %s', (_, attributes, options) => {
    expect(click(attributes, options)).toBeNull();
  });

  it('shows the card for a link that opens in this same tab', () => {
    expect(click({ href: './pal-picker.html', target: '_self' }).hidden).toBe(false);
  });

  it('stays away when something else already handled the click', () => {
    const link = document.createElement('a');
    link.href = './pal-picker.html';
    link.addEventListener('click', (event) => event.preventDefault());
    document.body.append(link);
    link.click();
    expect(card()).toBeNull();
  });

  it("stays away for clicks that aren't on a link", () => {
    const button = document.createElement('button');
    document.body.append(button);
    button.click();
    expect(card()).toBeNull();
  });

  it('stays away for clicks on the page itself', () => {
    document.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(card()).toBeNull();
  });

  it('is hidden again when the Back button brings the page back', () => {
    click({ href: './pal-picker.html' });
    window.dispatchEvent(new Event('pageshow'));
    expect(card().hidden).toBe(true);
  });
});

describe('every page', () => {
  const css = readFileSync(resolve(process.cwd(), 'public', 'styles.css'), 'utf8');

  it.each([
    ['script.js'],
    ['game/pal-picker.js'],
    ['game/choose-mode.js'],
    ['game/choose-rivals.js'],
    ['game/main.js'],
  ])('%s shows the card while the next screen loads', (file) => {
    const code = readFileSync(resolve(process.cwd(), 'public', file), 'utf8');
    expect(code).toContain('watchLoading();');
  });

  it("hides the card when it's hidden (a class with display set would otherwise win)", () => {
    expect(css).toContain('.loading-overlay[hidden] {\n  display: none;');
  });

  it("waits a moment before fading in, so a quick page change doesn't flash it", () => {
    expect(css).toMatch(/\.loading-overlay \{[^}]*animation: loading-in [\d.]+s ease-out [\d.]+s both;/);
  });
});
