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
const stats = () => Object.fromEntries([...document.querySelectorAll('.profile-stat')]
  .map((stat) => [stat.querySelector('dt').textContent, stat.querySelector('dd').textContent]));

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

  it('gives her quick facts from what the game knows: Gram stain, size and whether she swims', async () => {
    await open('pal-profile.html', 'game/pal-profile.js', '?pal=hallie');
    expect(stats()).toEqual({ 'Gram stain': 'Negative (pink)', Size: '~3 µm', 'Swims?': 'Yes, with flagella' });
    await open('pal-profile.html', 'game/pal-profile.js', '?pal=cora');
    expect(stats()).toEqual({ 'Gram stain': 'Positive (purple)', Size: '~3 µm', 'Swims?': 'No' });
    // One cell's size, like Compare sizes, or a note that says more.
    await open('pal-profile.html', 'game/pal-profile.js', '?pal=nova');
    expect(stats().Size).toBe('~15 µm filament');
    // Elia swims by twisting, with her flagella inside her, and barely stains.
    await open('pal-profile.html', 'game/pal-profile.js', '?pal=elia');
    expect(stats()['Swims?']).toBe('Yes, by twisting');
    expect(stats()['Gram stain']).toBe('Barely stains');
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
    expect(text('.profile-facts-head')).toBe('All about Marina');
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
