// @vitest-environment jsdom
// The family tree page: one branch at a time. Tap a branch to go in, a step
// in the trail to go back up, and a pal to see her branches and fun facts.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SPECIES } from '../public/game/config.js';

const page = readFileSync(resolve(process.cwd(), 'public/family-tree.html'), 'utf8');

async function open(hash = '') {
  window.location.hash = hash;
  document.body.outerHTML = page.slice(page.indexOf('<body'), page.indexOf('</body>'));
  vi.resetModules();
  await import('../public/game/family-tree.js');
}

const branch = (id) => document.querySelector(`.tree-branch[data-branch="${id}"]`);
const pal = (id) => document.querySelector(`.tree-pal-btn[data-pal="${id}"]`);
const trail = () => [...document.querySelectorAll('.tree-trail > :not(.tree-sep)')].map((s) => s.textContent);
const note = () => document.querySelector('.tree-note').textContent;
const card = () => document.querySelector('.tree-pal');

afterEach(() => { window.location.hash = ''; });

describe('the family tree page', () => {
  it('opens at the top, the bacteria, with a card for each big branch', async () => {
    await open();
    // At the top there's no trail to go back up, and no note.
    expect(document.querySelector('.tree-trail').hidden).toBe(true);
    expect(document.querySelector('.tree-note').hidden).toBe(true);
    expect([...document.querySelectorAll('.tree-branch')].map((b) => b.dataset.branch)).toEqual([
      'firmicutes', 'actinobacteria', 'deinococcota', 'cyanobacteria', 'spirochetes', 'desulfobacterota', 'proteobacteria',
    ]);
    expect(branch('proteobacteria').querySelector('.tree-count').textContent).toBe('11 pals ›');
    expect(branch('proteobacteria').querySelectorAll('.tree-faces .pal-icon')).toHaveLength(11);
    expect(document.querySelector('.loading-overlay').hidden).toBe(true);
  });

  it("goes in one branch at a time, showing each one's science name", async () => {
    await open();
    expect(branch('firmicutes').querySelector('.tree-branch-name').textContent).toBe('Firmicutes Bacillota');
    expect(branch('deinococcota').querySelector('.tree-branch-name').textContent).toBe('Deinococcota');
    expect(branch('deinococcota').querySelector('.tree-count').textContent).toBe('1 pal ›');
    branch('proteobacteria').click();
    branch('gamma').click();
    expect(trail()).toEqual(['Bacteria', 'Proteobacteria', 'Gammaproteobacteria']);
    expect(document.querySelector('.tree-trail').hidden).toBe(false);
    expect(note()).toBe('The biggest branch in PetriPals, from sea swimmers to gut cousins.');
    expect(document.querySelector('.tree-view > div').className).toContain('tree-branches');
  });

  it('shows the pals at the tip of a branch, in her own color', async () => {
    await open('#enterobacterales');
    expect([...document.querySelectorAll('.tree-pal-btn')].map((b) => b.dataset.pal)).toEqual(['colette', 'sallie', 'sara', 'kiki', 'pearl']);
    expect(pal('sara').querySelector('span:last-child').style.color).toBeTruthy();
    expect(document.querySelector('.tree-view > div').className).toContain('rivals-grid');
  });

  it('goes back up from a step in the trail', async () => {
    await open('#enterobacterales');
    const steps = [...document.querySelectorAll('.tree-step')];
    expect(steps.map((s) => s.textContent)).toEqual(['Bacteria', 'Proteobacteria', 'Gammaproteobacteria']);
    steps[1].click();
    expect(trail()).toEqual(['Bacteria', 'Proteobacteria']);
    expect(document.querySelector('.tree-view > div').classList).toContain('back');
  });

  it('opens a pal card with her branches and all her fun facts, and closes it when she is tapped again', async () => {
    await open('#actinobacteria');
    expect(card().hidden).toBe(true);
    pal('marina').click();
    expect(card().hidden).toBe(false);
    expect(pal('marina').getAttribute('aria-pressed')).toBe('true');
    expect(card().querySelector('.tree-pal-name').textContent).toBe('Marina');
    expect(card().querySelector('.tree-pal-species').textContent).toBe(SPECIES.marina.scientific);
    expect(card().querySelector('.tree-pal-line').textContent).toBe('Bacteria › Actinobacteria');
    const facts = [...card().querySelectorAll('.tree-facts li')];
    expect(facts.map((li) => li.textContent)).toEqual(SPECIES.marina.facts.map((f) => f.replaceAll('*', '')));
    // Science names in a fact are in italics.
    expect(card().querySelector('.tree-facts i')).not.toBeNull();
    expect(card().querySelector('button')).toBeNull();
    pal('nova').click();
    expect(card().querySelector('.tree-pal-name').textContent).toBe('Nova');
    expect(pal('marina').getAttribute('aria-pressed')).toBe('false');
    pal('nova').click();
    expect(card().hidden).toBe(true);
    expect(pal('nova').getAttribute('aria-pressed')).toBe('false');
  });

  it('closes the pal card when you go to another branch', async () => {
    await open('#alpha');
    pal('bree').click();
    document.querySelector('.tree-step').click();
    expect(card().hidden).toBe(true);
  });

  it('has Back to home only at the top, and Back up a branch everywhere else', async () => {
    const home = () => document.querySelector('.tree-home');
    const back = () => document.querySelector('.tree-back');
    await open();
    expect(home().hidden).toBe(false);
    expect(home().getAttribute('href')).toBe('./index.html');
    expect(back().hidden).toBe(true);
    branch('firmicutes').click();
    branch('bacilli').click();
    expect(home().hidden).toBe(true);
    expect(back().hidden).toBe(false);
    back().click();
    expect(trail()).toEqual(['Bacteria', 'Firmicutes']);
    expect(document.querySelector('.tree-view > div').classList).toContain('back');
    back().click();
    expect(home().hidden).toBe(false);
    expect(back().hidden).toBe(true);
  });

  it('starts at the top for a link to a pal or an unknown branch', async () => {
    await open('#bree');
    expect(trail()).toEqual(['Bacteria']);
    await open('#nope');
    expect(trail()).toEqual(['Bacteria']);
  });

  it('is linked from the home page', () => {
    const home = readFileSync(resolve(process.cwd(), 'public/index.html'), 'utf8');
    expect(home).toContain('<a class="guess-link" href="./family-tree.html">Family Tree</a>');
  });
});
