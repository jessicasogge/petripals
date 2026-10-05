// @vitest-environment jsdom
// main.js starts the petri dish page from its address, e.g.
// petri-dish.html?pal=mona&level=2. These tests load the real page into
// jsdom, a simulated browser page, and check it picks the right pal and
// level, and copes with addresses that are broken or made up.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LEVELS, MIXED, SPECIES } from '../public/game/config.js';

// Don't run the real game loop; just record how the game was started.
vi.mock('../public/game/game.js', () => ({ playGame: vi.fn() }));
vi.mock('../public/game/race.js', () => ({ playRace: vi.fn() }));
// The real nutrients, watched so a test can see how many were asked for.
vi.mock('../public/game/nutrients.js', async (original) => {
  const real = await original();
  return { scatterNutrients: vi.fn(real.scatterNutrients) };
});

// (jsdom changes import.meta.url to a web address, so find the file from the project folder.)
const page = readFileSync(resolve(process.cwd(), 'public/petri-dish.html'), 'utf8');
const body = page.slice(page.indexOf('<body'), page.indexOf('</body>'));

let location;

// Open the dish page at `search` (like '?pal=mona&level=2') and run main.js.
async function open(search) {
  location = { search, href: `http://localhost/petri-dish.html${search}`, replace: vi.fn() };
  vi.stubGlobal('location', location);
  document.body.outerHTML = body;
  vi.resetModules();
  await import('../public/game/main.js');
  const { playGame } = await import('../public/game/game.js');
  return playGame;
}

beforeEach(() => {
  document.title = 'PetriPals | Petri Dish';
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe('picking the pal', () => {
  it('shows the chosen pal and hides the others', async () => {
    await open('?pal=vi');
    const shown = [...document.querySelectorAll('.dish-pal:not([hidden])')];
    expect(shown.map((el) => el.dataset.pal)).toEqual(['vi']);
  });

  it('puts her name, in her color, and species above the dish', async () => {
    await open('?pal=goldie');
    const name = document.querySelector('.pal-name');
    expect(name.textContent).toBe('Goldie');
    // jsdom reports colors as rgb(), so compare against the same color set the same way.
    const expected = document.createElement('span');
    expected.style.color = SPECIES.goldie.color;
    expect(name.style.color).toBe(expected.style.color);
    expect(document.querySelector('.species-name').textContent).toBe(SPECIES.goldie.scientific);
  });

  it("puts Sallie's genus in italics above the dish, and her serovar upright", async () => {
    await open('?pal=sallie');
    const species = document.querySelector('.species-name');
    expect(species.textContent).toBe('Salmonella Typhi');
    expect([...species.querySelectorAll('i')].map((i) => i.textContent)).toEqual(['Salmonella']);
  });

  it('names the pal and level in the tab title', async () => {
    await open('?pal=mona&level=3');
    expect(document.title).toBe('PetriPals | Mona | Level 3');
  });

  it.each(Object.keys(SPECIES))('starts the game for %s with her own species settings', async (pal) => {
    const playGame = await open(`?pal=${pal}`);
    expect(playGame).toHaveBeenCalledTimes(1);
    const [palEl, species] = playGame.mock.calls[0];
    expect(palEl.dataset.pal).toBe(pal);
    expect(species).toEqual(SPECIES[pal]);
  });
});

describe('picking the level', () => {
  // The level and cell target the game was started with.
  async function startedAt(search) {
    const playGame = await open(search);
    return playGame.mock.calls[0][4];
  }

  it('starts at level 1 when the address has no level', async () => {
    expect(await startedAt('?pal=mona')).toEqual({ level: 1, target: LEVELS[0].target });
  });

  it.each(LEVELS.map((level, i) => [i + 1, level]))(
    'level %i uses its own cell target and number of disks',
    async (n, level) => {
      expect(await startedAt(`?pal=mona&level=${n}`)).toEqual({ level: n, target: level.target });
      expect(document.querySelectorAll('.agar .antibiotic')).toHaveLength(level.disks);
    },
  );

  it.each([
    ['too high', '99', LEVELS.length],
    ['zero', '0', 1],
    ['negative', '-3', 1],
    ['not a number', 'abc', 1],
    ['empty', '', 1],
    ['a decimal', '2.7', 2],
  ])('a level that is %s ("%s") becomes level %i', async (_, value, expected) => {
    const { level } = await startedAt(`?pal=mona&level=${value}`);
    expect(level).toBe(expected);
  });
});

describe('a broken address', () => {
  it.each([
    ['no pal', ''],
    ['an unknown pal', '?pal=bogus'],
    ['a pal with the wrong capitals', '?pal=Mona'],
  ])('with %s, sends them back to pick a pal instead of starting', async (_, search) => {
    const playGame = await open(search);
    expect(location.replace).toHaveBeenCalledWith('./pal-picker.html');
    expect(playGame).not.toHaveBeenCalled();
    expect(document.querySelectorAll('.dish-pal:not([hidden])')).toHaveLength(0);
  });

  it('with a mangled pal name, still sends them back instead of crashing', async () => {
    // A stray quote or bracket once broke the page before it could redirect.
    const playGame = await open('?pal=mona"]');
    expect(location.replace).toHaveBeenCalledWith('./pal-picker.html');
    expect(playGame).not.toHaveBeenCalled();
  });
});

describe('mixed culture mode', () => {
  async function openMixed(search) {
    await open(search);
    const { playRace } = await import('../public/game/race.js');
    return playRace;
  }

  it('starts a race instead of the classic game, with no antibiotic disks', async () => {
    const playRace = await openMixed('?pal=mona&mode=mixed');
    expect(playRace).toHaveBeenCalledTimes(1);
    const { playGame } = await import('../public/game/game.js');
    expect(playGame).not.toHaveBeenCalled();
    expect(document.querySelectorAll('.antibiotic')).toHaveLength(0);
  });

  it('with no rivals in the address, picks one at random, never your own pal', async () => {
    for (let i = 0; i < 12; i++) {
      const playRace = await openMixed('?pal=goldie&mode=mixed');
      const { you, rivals, target } = playRace.mock.calls.at(-1)[0];
      expect(you.svg.dataset.pal).toBe('goldie');
      expect(rivals).toHaveLength(1);
      expect(rivals[0].svg.dataset.pal).not.toBe('goldie');
      expect(rivals[0].species).toEqual(SPECIES[rivals[0].svg.dataset.pal]);
      expect(target).toBe(MIXED.TARGET);
    }
  });

  it('uses the rivals in the address, racing to 64 against one and 32 against more', async () => {
    let playRace = await openMixed('?pal=mona&mode=mixed&rivals=vi');
    let { rivals, target } = playRace.mock.calls.at(-1)[0];
    expect(rivals.map((r) => r.svg.dataset.pal)).toEqual(['vi']);
    expect(target).toBe(64);
    playRace = await openMixed('?pal=mona&mode=mixed&rivals=vi,elia,ceres');
    ({ rivals, target } = playRace.mock.calls.at(-1)[0]);
    expect(rivals.map((r) => r.svg.dataset.pal)).toEqual(['vi', 'elia', 'ceres']);
    expect(target).toBe(32);
  });

  it('puts out more nutrients for a fuller dish', async () => {
    const { scatterNutrients } = await import('../public/game/nutrients.js');
    await openMixed('?pal=mona&mode=mixed&rivals=vi,elia,ceres');
    expect(scatterNutrients).toHaveBeenLastCalledWith({ count: MIXED.NUTRIENTS_PER_PAL * 4 });
  });

  it('shows "Mona vs. Vi, Elia and Ceres" with every species', async () => {
    await openMixed('?pal=mona&mode=mixed&rivals=vi,elia,ceres');
    expect(document.querySelector('.pal-name').textContent).toBe('Mona vs. Vi, Elia and Ceres');
    expect(document.querySelector('.species').textContent)
      .toBe('Pseudomonas aeruginosa vs. Vibrio cholerae, Borrelia burgdorferi and Bacillus cereus');
    expect(document.title).toBe('PetriPals | Mona vs. Vi, Elia and Ceres');
    expect(document.querySelector('.how-to-play').textContent).toMatch(/Race Vi, Elia and Ceres to 32 cells/);
    expect(document.querySelector('.how-to-play').textContent).toMatch(/before your rivals do!/);
  });

  it("keeps Sallie's serovar upright in a race, too", async () => {
    await openMixed('?pal=sallie&mode=mixed&rivals=mona');
    const line = document.querySelector('.species');
    expect(line.textContent).toBe('Salmonella Typhi vs. Pseudomonas aeruginosa');
    expect([...line.querySelectorAll('i')].map((i) => i.textContent)).toEqual(['Salmonella', 'Pseudomonas aeruginosa']);
  });

  it('shows "Mona vs. Vi" above the dish with both species', async () => {
    await openMixed('?pal=mona&mode=mixed&rivals=vi');
    expect(document.querySelector('.pal-name').textContent).toBe('Mona vs. Vi');
    expect(document.querySelector('.species').textContent).toBe('Pseudomonas aeruginosa vs. Vibrio cholerae');
    expect(document.title).toBe('PetriPals | Mona vs. Vi');
    expect(document.querySelector('.how-to-play').textContent).toMatch(/Race Vi to 64 cells/);
  });
});
