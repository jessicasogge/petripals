// @vitest-environment jsdom
// A pal's profile (pal-profile.html?pal=mona), opened from About on the mode
// screen.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SPECIES } from '../public/game/config.js';
import { plainText } from '../public/game/italics.js';

const file = (name) => readFileSync(resolve(process.cwd(), 'public', name), 'utf8');

async function open(page, script, search) {
  const html = file(page);
  vi.stubGlobal('location', { search, href: `http://localhost/${page}${search}`, replace: vi.fn() });
  document.body.outerHTML = html.slice(html.indexOf('<body'), html.indexOf('</body>'));
  vi.resetModules();
  await import(`../public/${script}`);
}

const text = (selector) => document.querySelector(selector).textContent;

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("a pal's profile", () => {
  it('shows her picture, her name in her color and her species', async () => {
    await open('pal-profile.html', 'game/pal-profile.js', '?pal=hallie');
    expect(document.querySelector('.profile-pal .pal-icon').classList).toContain('hallie');
    expect(text('.profile-name')).toBe('Hallie');
    expect(document.querySelector('.profile-name').style.color).toBeTruthy();
    expect(text('.profile-species')).toBe('Helicobacter pylori');
    expect(document.querySelector('.profile-species i')).not.toBeNull();
    expect(document.title).toBe('PetriPals | About Hallie');
    expect(document.querySelector('.loading-overlay').hidden).toBe(true);
  });

  it('says about how long one of her cells is, like Compare sizes', async () => {
    await open('pal-profile.html', 'game/pal-profile.js', '?pal=hallie');
    expect(text('.profile-size')).toBe('~3 µm');
    // One cell, for a pal whose picture shows several.
    await open('pal-profile.html', 'game/pal-profile.js', '?pal=ari');
    expect(text('.profile-size')).toBe('~3.5 µm');
    // Nova is one filament, not a cell, but the line only gives her length.
    await open('pal-profile.html', 'game/pal-profile.js', '?pal=nova');
    expect(text('.profile-size')).toBe('~15 µm');
  });

  it('shows her after a Gram stain, and says why she turns that color', async () => {
    await open('pal-profile.html', 'game/pal-profile.js', '?pal=cora');
    expect(document.querySelector('.profile-stain-pal svg [style*="fill"]')).not.toBeNull();
    expect(text('.profile-stain-text')).toContain('purple: her thick wall holds the dye');
    // Her picture at the top stays in color.
    expect(document.querySelector('.profile-pal svg [style*="fill"]')).toBeNull();
    await open('pal-profile.html', 'game/pal-profile.js', '?pal=elia');
    expect(text('.profile-stain-text')).toContain('barely takes a Gram stain');
  });

  it('lists all her fun facts, with science names in italics', async () => {
    await open('pal-profile.html', 'game/pal-profile.js', '?pal=marina');
    expect([...document.querySelectorAll('.profile h2')].map((h) => h.textContent)).toContain('Fun Facts');
    const facts = [...document.querySelectorAll('.profile-facts li')].map((li) => li.textContent);
    expect(facts).toEqual(SPECIES.marina.facts.map(plainText));
    expect(document.querySelector('.profile-facts i')).not.toBeNull();
  });

  it('goes back to her mode screen', async () => {
    await open('pal-profile.html', 'game/pal-profile.js', '?pal=mona');
    expect(document.querySelector('.profile-back').getAttribute('href')).toBe('./choose-mode.html?pal=mona');
  });

  it('works for every pal', async () => {
    for (const id of Object.keys(SPECIES)) {
      await open('pal-profile.html', 'game/pal-profile.js', `?pal=${id}`);
      expect(location.replace, id).not.toHaveBeenCalled();
      expect(document.querySelectorAll('.profile-facts li').length, id).toBe(SPECIES[id].facts.length);
    }
  });

  it('sends you back to the picker for a pal who doesn\'t exist', async () => {
    await open('pal-profile.html', 'game/pal-profile.js', '?pal=nope');
    expect(location.replace).toHaveBeenCalledWith('./pal-picker.html');
  });
});

describe('About on the mode screen', () => {
  it('opens her profile, named for her', async () => {
    await open('choose-mode.html', 'game/choose-mode.js', '?pal=coco');
    const about = document.querySelector('.about-btn');
    expect(about.getAttribute('href')).toBe('./pal-profile.html?pal=coco');
    expect(about.textContent.trim()).toMatch(/About Coco$/);
    // Outside her picture, which screen readers skip, so they reach it.
    expect(about.closest('[aria-hidden]')).toBeNull();
  });
});
