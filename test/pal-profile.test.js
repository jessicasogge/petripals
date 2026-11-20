// @vitest-environment jsdom
// A pal's profile (pal-profile.html?pal=mona) in the browser, and About on
// the mode screen, which opens her ready-made page (see build-site.test.js).
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

  it('says how fast she doubles, labeled, and the conditions behind it', async () => {
    await open('pal-profile.html', 'game/pal-profile.js', '?pal=cleo');
    expect(text('.profile-doubling')).toBe('10 minutes in favorable conditions');
    // Hours for the slow ones, in words rather than minutes.
    await open('pal-profile.html', 'game/pal-profile.js', '?pal=myra');
    expect(text('.profile-doubling')).toBe('12 hours in favorable conditions');
    await open('pal-profile.html', 'game/pal-profile.js', '?pal=elia');
    expect(text('.profile-doubling')).toBe('18 hours in favorable conditions');
  });

  it('writes every doubling time so it reads after her label', async () => {
    const { doublingText } = await import('../public/game/profile.js');
    expect(doublingText(45)).toBe('45 minutes');
    expect(doublingText(60)).toBe('1 hour');
    expect(doublingText(90)).toBe('1.5 hours');
    expect(doublingText(150)).toBe('2.5 hours');
    expect(doublingText(720)).toBe('12 hours');
    // Every pal's reads as a counted phrase ("1 hour", never a bare "hour"),
    // since it follows "Approximate doubling time:".
    for (const [pal, species] of Object.entries(SPECIES)) {
      expect(doublingText(species.doubling), pal).toMatch(/^\d+(\.5)? (minutes|hours?)$/);
    }
  });

  it('reads as a whole sentence on every pal, with nothing left over', async () => {
    for (const id of Object.keys(SPECIES)) {
      await open('pal-profile.html', 'game/pal-profile.js', `?pal=${id}`);
      const label = [...document.querySelectorAll('.profile-quick dt')].at(-1).textContent;
      expect(`${label} ${text('.profile-doubling')}`, id)
        .toMatch(/^Approximate doubling time: \d+(\.5)? (minutes|hours?) in favorable conditions$/);
    }
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

  it('shows her colonies on a plate, and what to notice about them', async () => {
    const { COLONIES } = await import('../public/game/colonies.js');
    await open('pal-profile.html', 'game/pal-profile.js', '?pal=sara');
    expect([...document.querySelectorAll('.profile h2')].map((h) => h.textContent)).toContain('On the Plate');
    expect(document.querySelector('.profile-plate-pic svg.plate')).not.toBeNull();
    expect(text('.profile-plate-text')).toBe(COLONIES.sara.caption);
  });

  it('has buttons to try her on other plates, her own first and picked', async () => {
    await open('pal-profile.html', 'game/pal-profile.js', '?pal=colette');
    const labels = [...document.querySelectorAll('.plate-chips label')];
    expect(labels.map((l) => l.textContent)).toEqual(['EMB', 'Blood agar', 'MacConkey', 'Chocolate agar']);
    // Each button is a radio button's label, one group, her own plate picked.
    const radios = [...document.querySelectorAll('.profile-plates input[type="radio"]')];
    expect(radios.map((r) => r.id)).toEqual(labels.map((l) => l.htmlFor));
    expect(new Set(radios.map((r) => r.name))).toEqual(new Set(['plate']));
    expect(radios.filter((r) => r.checked).map((r) => r.id)).toEqual(['plate-home']);
    // A plate and caption for each, in the same order.
    const panels = [...document.querySelectorAll('.plate-panels .profile-plate')];
    expect(panels.map((p) => p.className)).toEqual(radios.map((r) => `profile-plate ${r.id}`));
    for (const panel of panels) expect(panel.querySelector('svg.plate')).not.toBeNull();
    expect(panels[2].querySelector('.profile-plate-text').textContent).toMatch(/lactose/);
    // Picking one is plain HTML, so it works without JavaScript too.
    expect(document.querySelector('legend').textContent).toBe('Which plate to grow her on');
  });

  it('has no buttons for Elia, who only gets her own empty plate', async () => {
    await open('pal-profile.html', 'game/pal-profile.js', '?pal=elia');
    expect(document.querySelector('.plate-chips')).toBeNull();
    expect(document.querySelectorAll('.plate-panels .profile-plate')).toHaveLength(1);
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
    expect(about.getAttribute('href')).toBe('./pals/coco.html');
    expect(about.textContent.trim()).toMatch(/About Coco$/);
    // Outside her picture, which screen readers skip, so they reach it.
    expect(about.closest('[aria-hidden]')).toBeNull();
  });
});
