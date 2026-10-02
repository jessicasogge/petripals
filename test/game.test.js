// @vitest-environment jsdom
// game.js runs a classic-mode level: steer, grow the colony past the
// antibiotic disks, and show the level-complete, win or game-over pop-up.
// These tests load the real petri dish page into jsdom and stand in for the
// colony, steering and effects, so each test can say exactly what happens
// ("the colony reached 4 cells", "the pal touched a disk") and then check
// what the player sees.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GAME, LEVELS, SPECIES } from '../public/game/config.js';

// A stand-in colony whose cell count and division timing each test sets.
const fake = vi.hoisted(() => ({ colony: null, hit: null }));

vi.mock('../public/game/colony.js', () => ({
  makeColony: vi.fn(() => fake.colony),
  moveGroups: vi.fn(),
}));
vi.mock('../public/game/rod.js', () => ({ rodGroup: vi.fn(() => ({ body: () => [[0, 0, 5]] })) }));
vi.mock('../public/game/coccus.js', () => ({ coccusGroup: vi.fn(() => ({ body: () => [[0, 0, 5]] })) }));
vi.mock('../public/game/keyboard.js', () => ({
  arrowKeys: vi.fn(() => ({ direction: () => [0, 0], stop: vi.fn() })),
}));
vi.mock('../public/game/touch.js', () => ({
  steer: vi.fn(),
  touchSteering: vi.fn(() => ({ target: () => null, stop: vi.fn() })),
}));
vi.mock('../public/game/spores.js', () => ({ sporeBurst: vi.fn() }));
vi.mock('../public/game/track.js', () => ({ track: vi.fn() }));
// Keep the real pop-up wording; only decide which disk (if any) is touched.
vi.mock('../public/game/antibiotic.js', async (importActual) => ({
  ...(await importActual()),
  touchedDisk: vi.fn(() => fake.hit),
}));

const { playGame } = await import('../public/game/game.js');
const { makeColony } = await import('../public/game/colony.js');

// (jsdom changes import.meta.url to a web address, so find the file from the project folder.)
const page = readFileSync(resolve(process.cwd(), 'public/petri-dish.html'), 'utf8');
const body = page.slice(page.indexOf('<body'), page.indexOf('</body>'));

let frames; // the animation frames waiting to run
let nutrients;
let location;

function makeFakeColony() {
  let cells = 1;
  return {
    groups: [],
    sinceAnyDivision: Infinity,
    cellCount: () => cells,
    setCells(n) { cells = n; },
    tick: vi.fn(),
    eat: vi.fn(),
    popInZones: vi.fn(),
    divideLeader: vi.fn(),
  };
}

// Start a level as Mona (or `pal`) and return the pop-up.
function start({ level = 1, target = LEVELS[level - 1].target, pal = 'mona' } = {}) {
  const palEl = document.createElement('div');
  palEl.dataset.pal = pal;
  palEl.dataset.name = pal[0].toUpperCase() + pal.slice(1);
  playGame(palEl, SPECIES[pal], nutrients, [], { level, target });
  return document.querySelector('.win-banner');
}

// Run the next animation frame, `ms` after the last one.
let now = 0;
function frame(ms = 16) {
  now += ms;
  const waiting = frames;
  frames = [];
  for (const run of waiting) run(now);
}

const disk = (zone) => ({ fx: 0.5, fy: 0, r: 0.08, zone, antibiotic: { code: 'GM', name: 'Gentamicin' } });

beforeEach(() => {
  document.body.outerHTML = body;
  frames = [];
  now = 0;
  fake.colony = makeFakeColony();
  fake.hit = null;
  nutrients = { stop: vi.fn() };
  sessionStorage.clear();
  location = { href: 'http://localhost/petri-dish.html?pal=mona&level=3' };
  vi.stubGlobal('location', location);
  vi.stubGlobal('requestAnimationFrame', (run) => frames.push(run));
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe('the cell counter', () => {
  it('shows the level and how many cells it takes to win', () => {
    start({ level: 2 });
    expect(document.querySelector('.cell-count').textContent).toBe('Level 2 · 1 / 8 cells');
  });

  it('puts the target in the how-to-play line too', () => {
    start({ level: 3 });
    expect(document.querySelector('.target-cells').textContent).toBe('16');
  });

  it('stops at the target, even if the colony grows past it', () => {
    start({ level: 1 });
    // The counter updates whenever the colony divides.
    const [{ onDivide }] = vi.mocked(makeColony).mock.calls[0];
    fake.colony.setCells(7);
    onDivide();
    expect(document.querySelector('.cell-count').textContent).toBe('Level 1 · 4 / 4 cells');
  });

  it('counts down when offspring pop in an antibiotic zone', () => {
    start({ level: 2 });
    const [{ onPop }] = vi.mocked(makeColony).mock.calls[0];
    fake.colony.setCells(5);
    onPop(2);
    expect(document.querySelector('.cell-count').textContent).toBe('Level 2 · 5 / 8 cells');
  });
});

describe('beating a level', () => {
  it('waits until the colony reaches the target', () => {
    const banner = start({ level: 1 });
    fake.colony.setCells(3);
    frame();
    vi.runAllTimers();
    expect(banner.hidden).toBe(true);
    expect(fake.colony.divideLeader).toHaveBeenCalled();
  });

  it('says the level is complete and offers the next one', () => {
    const banner = start({ level: 2 });
    fake.colony.setCells(8);
    frame();
    vi.runAllTimers();
    expect(banner.hidden).toBe(false);
    expect(banner.querySelector('h2').textContent).toBe('Level 2 complete!');
    expect(banner.querySelector('.win-message').textContent).toBe('You grew a colony of 8 cells!');
    expect(banner.querySelector('.play-again').textContent).toBe('Play level 3');
    expect(banner.querySelector('.start-over').hidden).toBe(true);
  });

  it('says "You won!" after the last level and starts over from level 1', () => {
    const last = LEVELS.length;
    const banner = start({ level: last });
    fake.colony.setCells(LEVELS[last - 1].target);
    frame();
    vi.runAllTimers();
    expect(banner.querySelector('h2').textContent).toBe('You won!');
    expect(banner.querySelector('.win-message').textContent)
      .toBe(`You beat all ${last} levels with a colony of ${LEVELS[last - 1].target} cells!`);
    expect(banner.querySelector('.play-again').textContent).toBe('Play again');
    banner.querySelector('.play-again').click();
    expect(new URL(location.href).searchParams.get('level')).toBe('1');
  });

  it('"Play level N" goes to the next level and keeps the pal', () => {
    const banner = start({ level: 3 });
    fake.colony.setCells(16);
    frame();
    vi.runAllTimers();
    banner.querySelector('.play-again').click();
    const url = new URL(location.href);
    expect(url.searchParams.get('level')).toBe('4');
    expect(url.searchParams.get('pal')).toBe('mona');
  });

  it('stops play once the target is reached', () => {
    start({ level: 1 });
    fake.colony.setCells(4);
    frame();
    expect(nutrients.stop).toHaveBeenCalled();
    expect(fake.colony.divideLeader).not.toHaveBeenCalled();
    // Touching a disk after winning doesn't turn it into a game over.
    fake.hit = disk(0.05);
    frame();
    vi.runAllTimers();
    expect(document.querySelector('.win-banner h2').textContent).toBe('Level 1 complete!');
  });
});

describe('when the win pop-up appears', () => {
  it('waits for the newest cell to finish dividing', () => {
    const banner = start({ level: 1 });
    fake.colony.setCells(4);
    fake.colony.sinceAnyDivision = 100; // the last cell split 100 ms ago
    frame();
    vi.advanceTimersByTime(GAME.DIVIDE_MS - 100 - 1);
    expect(banner.hidden).toBe(true);
    vi.advanceTimersByTime(1);
    expect(banner.hidden).toBe(false);
  });

  it('shows right away if nothing is still dividing', () => {
    const banner = start({ level: 1 });
    fake.colony.setCells(4);
    fake.colony.sinceAnyDivision = GAME.DIVIDE_MS * 2;
    frame();
    vi.advanceTimersByTime(0);
    expect(banner.hidden).toBe(false);
  });
});

describe('touching a disk', () => {
  it('is game over, with a message naming the antibiotic and its zone', () => {
    const banner = start({ level: 2 });
    fake.hit = disk(0.05);
    frame();
    expect(document.querySelector('.pal-mover').classList).toContain('killed');
    expect(nutrients.stop).toHaveBeenCalled();
    vi.runAllTimers();
    expect(banner.hidden).toBe(false);
    expect(banner.querySelector('h2').textContent).toBe('Game over');
    expect(banner.querySelector('.win-message').textContent)
      .toBe('Mona swam into the Gentamicin zone of inhibition. Antibiotics kill bacteria!');
  });

  it('says the disk still counts when she is resistant (no zone)', () => {
    start({ level: 1 });
    fake.hit = disk(0);
    frame();
    vi.runAllTimers();
    expect(document.querySelector('.win-message').textContent).toMatch(/^Mona bumped into the Gentamicin disk/);
  });

  it('waits a moment before the pop-up, so the pop can be seen', () => {
    const banner = start({ level: 1 });
    fake.hit = disk(0.05);
    frame();
    vi.advanceTimersByTime(499);
    expect(banner.hidden).toBe(true);
    vi.advanceTimersByTime(1);
    expect(banner.hidden).toBe(false);
  });

  it('stops growing the colony', () => {
    start({ level: 1 });
    fake.hit = disk(0.05);
    frame();
    fake.colony.setCells(4);
    frame();
    vi.runAllTimers();
    expect(fake.colony.eat).not.toHaveBeenCalled();
    expect(document.querySelector('.win-banner h2').textContent).toBe('Game over');
  });
});

describe('the game-over buttons', () => {
  function gameOver(level) {
    const banner = start({ level });
    fake.hit = disk(0.05);
    frame();
    vi.runAllTimers();
    return banner;
  }

  it('"Try level N again" replays the same level', () => {
    const banner = gameOver(3);
    expect(banner.querySelector('.play-again').textContent).toBe('Try level 3 again');
    banner.querySelector('.play-again').click();
    expect(new URL(location.href).searchParams.get('level')).toBe('3');
  });

  it('"Start over" goes back to level 1', () => {
    const banner = gameOver(3);
    const startOver = banner.querySelector('.start-over');
    expect(startOver.hidden).toBe(false);
    startOver.click();
    expect(new URL(location.href).searchParams.get('level')).toBe('1');
  });

  it('hides "Start over" on level 1, where it would do the same thing', () => {
    expect(gameOver(1).querySelector('.start-over').hidden).toBe(true);
  });
});

describe('the fun fact', () => {
  const factShown = () => {
    const line = document.querySelector('.fun-fact');
    return line.hidden ? null : line.querySelector('.fun-fact-text').textContent;
  };

  it('is hidden while playing', () => {
    start({ level: 1 });
    frame();
    expect(factShown()).toBeNull();
  });

  it("shows one of the pal's facts when she beats a level", () => {
    start({ level: 1, pal: 'goldie' });
    fake.colony.setCells(4);
    frame();
    vi.runAllTimers();
    expect(SPECIES.goldie.facts).toContain(factShown());
  });

  it("shows one of the pal's facts on a game over", () => {
    start({ level: 2, pal: 'vi' });
    fake.hit = disk(0.05);
    frame();
    vi.runAllTimers();
    expect(SPECIES.vi.facts).toContain(factShown());
  });
});
