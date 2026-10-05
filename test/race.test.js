// @vitest-environment jsdom
// race.js runs mixed culture mode: you and one to three computer-steered
// rivals race to grow the target number of cells first. Like game.test.js, these tests load the real
// petri dish page into jsdom and stand in for the colonies, steering and
// effects, so each test can say exactly what happens ("the rival reached 64
// cells") and check what the player sees.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GAME, MIXED, SPECIES } from '../public/game/config.js';

// Stand-in colonies, yours first and then each rival's, in the order race.js
// makes them.
const fake = vi.hoisted(() => ({ colonies: [] }));

vi.mock('../public/game/colony.js', () => ({
  makeColony: vi.fn(() => fake.colonies.shift()),
  moveGroups: vi.fn(),
}));
// A pal's leading group just remembers where it was put.
const group = () => ({ x: 0, y: 0, facing: 1, body: () => [[0, 0, 5]] });
vi.mock('../public/game/rod.js', () => ({ rodGroup: vi.fn(() => group()) }));
vi.mock('../public/game/coccus.js', () => ({ coccusGroup: vi.fn(() => group()) }));
vi.mock('../public/game/rival.js', () => ({ rivalBrain: vi.fn(() => ({ step: vi.fn() })) }));
vi.mock('../public/game/keyboard.js', () => ({
  arrowKeys: vi.fn(() => ({ direction: () => [0, 0], stop: vi.fn() })),
}));
vi.mock('../public/game/touch.js', () => ({
  steer: vi.fn(),
  touchSteering: vi.fn(() => ({ target: () => null, stop: vi.fn() })),
}));
vi.mock('../public/game/spores.js', () => ({ sporeBurst: vi.fn() }));
vi.mock('../public/game/track.js', () => ({ track: vi.fn() }));

const { playRace } = await import('../public/game/race.js');
const { rodGroup } = await import('../public/game/rod.js');
const { coccusGroup } = await import('../public/game/coccus.js');
const { sporeBurst } = await import('../public/game/spores.js');

// (jsdom changes import.meta.url to a web address, so find the file from the project folder.)
const page = readFileSync(resolve(process.cwd(), 'public/petri-dish.html'), 'utf8');
const body = page.slice(page.indexOf('<body'), page.indexOf('</body>'));

const TARGET = MIXED.TARGET;
let frames; // the animation frames waiting to run
let now;
let nutrients;
let location;
let yours;
let theirs; // the first rival's colony
let others; // the other rivals' colonies, if any

function makeFakeColony() {
  let cells = 1;
  return {
    groups: [],
    sinceAnyDivision: Infinity,
    cellCount: () => cells,
    setCells(n) { cells = n; },
    tick: vi.fn(),
    eat: vi.fn(),
    divideLeader: vi.fn(),
  };
}

// A pal's drawing, as main.js finds it on the page.
function drawing(pal) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.dataset.pal = pal;
  svg.dataset.name = pal[0].toUpperCase() + pal.slice(1);
  svg.setAttribute('hidden', '');
  document.querySelector('.pal-mover').appendChild(svg);
  return svg;
}

// Race Mona (or `me`) against Vi (or `them`: one pal, or a list of up to
// three) to `target` cells, and return the pop-up.
function race({ me = 'mona', them = 'vi', target = TARGET } = {}) {
  const rivals = [].concat(them);
  others = rivals.slice(1).map(() => makeFakeColony());
  fake.colonies = [yours, theirs, ...others];
  playRace({
    you: { svg: drawing(me), species: SPECIES[me] },
    rivals: rivals.map((pal) => ({ svg: drawing(pal), species: SPECIES[pal] })),
    nutrients,
    target,
  });
  return document.querySelector('.win-banner');
}

// Run the next animation frame, `ms` after the last one.
function frame(ms = 16) {
  now += ms;
  const waiting = frames;
  frames = [];
  for (const run of waiting) run(now);
}

// The counter as plain text, e.g. "Mona 3 · Vi 5 / 64 cells".
const counter = () => document.querySelector('.cell-count').textContent;

beforeEach(() => {
  document.body.outerHTML = body;
  frames = [];
  now = 0;
  yours = makeFakeColony();
  theirs = makeFakeColony();
  nutrients = { stop: vi.fn() };
  sessionStorage.clear();
  location = { href: 'http://localhost/petri-dish.html?pal=mona&mode=mixed&rivals=vi' };
  vi.stubGlobal('location', location);
  vi.stubGlobal('requestAnimationFrame', (run) => frames.push(run));
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe('the rival', () => {
  it('is drawn as a copy of its pal, labeled "your rival"', () => {
    race({ them: 'goldie' });
    const mover = document.querySelector('.pal-mover.rival');
    expect(mover).not.toBeNull();
    const svg = mover.querySelector('svg');
    expect(svg.dataset.pal).toBe('goldie');
    expect(svg.hasAttribute('hidden')).toBe(false);
    expect(svg.getAttribute('aria-label')).toBe('Goldie, your rival');
  });

  it('leaves the original drawing where it was', () => {
    race({ them: 'goldie' });
    const original = document.querySelector('.pal-mover.player svg[data-pal="goldie"]');
    expect(original.hasAttribute('hidden')).toBe(true);
  });

  it('is a rod or a coccus like its pal', () => {
    race({ me: 'mona', them: 'scarlett' }); // a rod against a coccus
    expect(rodGroup).toHaveBeenCalledTimes(1);
    expect(coccusGroup).toHaveBeenCalledTimes(1);
    expect(coccusGroup.mock.calls[0][0].svg.getAttribute('aria-label')).toBe('Scarlett, your rival');
  });
});

describe('the start', () => {
  it('puts you and the rival on opposite sides of the dish, facing each other', () => {
    // jsdom doesn't lay out the page, so give the dish a size.
    Object.defineProperty(document.querySelector('.agar'), 'clientWidth', { value: 400 });
    race({ me: 'mona', them: 'vi' });
    const you = rodGroup.mock.results[0].value;
    const rival = rodGroup.mock.results[1].value;
    expect(you.x).toBeLessThan(0);
    expect(rival.x).toBeGreaterThan(0);
    expect(rival.x).toBe(-you.x);
    expect(rival.facing).toBe(-1);
  });
});

describe('the counter', () => {
  it('shows both colonies and the target', () => {
    race();
    expect(counter()).toBe(`Mona 1 · Vi 1 / ${TARGET} cells`);
  });

  it("colors each pal's name in her color", () => {
    race({ me: 'mona', them: 'goldie' });
    const [mine, rivals] = document.querySelectorAll('.cell-count > span > span');
    const color = (hex) => { const el = document.createElement('span'); el.style.color = hex; return el.style.color; };
    expect(mine.style.color).toBe(color(SPECIES.mona.color));
    expect(rivals.style.color).toBe(color(SPECIES.goldie.color));
  });

  it('updates as either colony divides', async () => {
    race();
    const { makeColony } = await import('../public/game/colony.js');
    const [[mine], [rivals]] = makeColony.mock.calls;
    yours.setCells(5);
    mine.onDivide();
    theirs.setCells(9);
    rivals.onDivide();
    expect(counter()).toBe(`Mona 5 · Vi 9 / ${TARGET} cells`);
  });

  it(`caps each colony at ${TARGET}`, () => {
    race();
    yours.setCells(TARGET + 5);
    theirs.setCells(TARGET + 9);
    frame();
    expect(counter()).toBe(`Mona ${TARGET} · Vi ${TARGET} / ${TARGET} cells`);
  });
});

describe('the race', () => {
  it('keeps going until someone reaches the target', () => {
    const banner = race();
    yours.setCells(TARGET - 1);
    theirs.setCells(TARGET - 1);
    frame();
    vi.runAllTimers();
    expect(banner.hidden).toBe(true);
    expect(yours.divideLeader).toHaveBeenCalled();
    expect(theirs.divideLeader).toHaveBeenCalled();
  });

  it(`you win if your colony reaches ${TARGET} first`, () => {
    const banner = race();
    yours.setCells(TARGET);
    frame();
    vi.runAllTimers();
    expect(banner.hidden).toBe(false);
    expect(banner.querySelector('h2').textContent).toBe('You won the race!');
    expect(banner.querySelector('.win-message').textContent)
      .toBe(`Your colony reached ${TARGET} cells before Vi's did.`);
    expect(sporeBurst).toHaveBeenCalledWith(document.querySelector('.pal-mover.player'));
  });

  it(`you lose if the rival reaches ${TARGET} first`, () => {
    const banner = race({ them: 'coco' });
    theirs.setCells(TARGET);
    frame();
    vi.runAllTimers();
    expect(banner.querySelector('h2').textContent).toBe('You lost!');
    expect(banner.querySelector('.win-message').textContent)
      .toBe(`Coco took over the plate, reaching ${TARGET} cells first.`);
    expect(sporeBurst).toHaveBeenCalledWith(document.querySelector('.pal-mover.rival'));
  });

  it('stops once someone wins, so the result never flips', () => {
    race();
    yours.setCells(TARGET);
    frame();
    expect(nutrients.stop).toHaveBeenCalled();
    theirs.setCells(TARGET);
    frame();
    vi.runAllTimers();
    expect(document.querySelector('.win-banner h2').textContent).toBe('You won the race!');
    expect(yours.eat).toHaveBeenCalledTimes(1);
  });

  it("waits for the winner's newest cell to finish dividing", () => {
    const banner = race();
    theirs.setCells(TARGET);
    theirs.sinceAnyDivision = 100;
    yours.sinceAnyDivision = Infinity; // only the winner's timing counts
    frame();
    vi.advanceTimersByTime(GAME.DIVIDE_MS - 100 - 1);
    expect(banner.hidden).toBe(true);
    vi.advanceTimersByTime(1);
    expect(banner.hidden).toBe(false);
  });
});

describe('the pop-up buttons', () => {
  function finished() {
    const banner = race();
    yours.setCells(TARGET);
    frame();
    vi.runAllTimers();
    return banner;
  }

  it('"Race again" goes back to picking rivals for the same pal', () => {
    const banner = finished();
    const again = banner.querySelector('.play-again');
    expect(again.textContent).toBe('Race again');
    again.click();
    expect(location.href).toBe('./choose-rivals.html?pal=mona');
  });

  it('"Play classic" goes to level 1 with the same pal', () => {
    const classic = finished().querySelector('.start-over');
    expect(classic.hidden).toBe(false);
    expect(classic.textContent).toBe('Play classic');
    classic.click();
    const url = new URL(location.href, 'http://localhost/');
    expect(url.pathname).toMatch(/petri-dish\.html$/);
    expect(url.searchParams.get('pal')).toBe('mona');
    expect(url.searchParams.has('mode')).toBe(false); // classic
    expect(url.searchParams.get('level') ?? '1').toBe('1');
  });
});

describe('the fun fact', () => {
  const factShown = () => {
    const line = document.querySelector('.fun-fact');
    return line.hidden ? null : line.querySelector('.fun-fact-text').textContent;
  };

  it('is hidden while racing', () => {
    race();
    frame();
    expect(factShown()).toBeNull();
  });

  it('is about your pal when you win', () => {
    race({ me: 'penny', them: 'ana' });
    yours.setCells(TARGET);
    frame();
    vi.runAllTimers();
    expect(SPECIES.penny.facts).toContain(factShown());
  });

  it('is still about your pal, not the rival, when you lose', () => {
    race({ me: 'penny', them: 'ana' });
    theirs.setCells(TARGET);
    frame();
    vi.runAllTimers();
    expect(SPECIES.penny.facts).toContain(factShown());
  });
});

describe('more than one rival', () => {
  const RIVALS = ['vi', 'elia', 'goldie'];
  const CROWDED = MIXED.CROWDED_TARGET;

  it('draws every rival, each labeled "your rival"', () => {
    race({ them: RIVALS, target: CROWDED });
    const labels = [...document.querySelectorAll('.pal-mover.rival svg')].map((svg) => svg.getAttribute('aria-label'));
    expect(labels).toEqual(['Vi, your rival', 'Elia, your rival', 'Goldie, your rival']);
  });

  it('spaces everyone evenly around the dish, with the rivals facing the middle', () => {
    Object.defineProperty(document.querySelector('.agar'), 'clientWidth', { value: 400 });
    race({ them: RIVALS, target: CROWDED });
    const leaders = [...rodGroup.mock.results, ...coccusGroup.mock.results].map((r) => r.value);
    const distances = leaders.map(({ x, y }) => Math.hypot(x, y));
    for (const d of distances) expect(d).toBeCloseTo(60, 1); // 0.3 of the 200px radius
    const spots = new Set(leaders.map(({ x, y }) => `${Math.round(x)},${Math.round(y)}`));
    expect(spots.size).toBe(4);
    for (const rival of leaders.slice(1)) {
      if (rival.x > 0) expect(rival.facing).toBe(-1);
      if (rival.x < 0) expect(rival.facing).toBe(1);
    }
  });

  it('counts every colony toward the target', async () => {
    const { makeColony } = await import('../public/game/colony.js');
    race({ them: RIVALS, target: CROWDED });
    others[1].setCells(7);
    makeColony.mock.calls[3][0].onDivide();
    expect(counter()).toBe(`Mona 1 · Vi 1 · Elia 1 · Goldie 7 / ${CROWDED} cells`);
  });

  it('steers every rival', async () => {
    const { rivalBrain } = await import('../public/game/rival.js');
    race({ them: RIVALS, target: CROWDED });
    frame();
    expect(rivalBrain).toHaveBeenCalledTimes(3);
    for (const { value } of rivalBrain.mock.results) expect(value.step).toHaveBeenCalled();
  });

  it('you lose to whichever rival gets there first', () => {
    const banner = race({ them: RIVALS, target: CROWDED });
    others[0].setCells(CROWDED); // Elia
    frame();
    vi.runAllTimers();
    expect(banner.querySelector('h2').textContent).toBe('You lost!');
    expect(banner.querySelector('.win-message').textContent)
      .toBe(`Elia took over the plate, reaching ${CROWDED} cells first.`);
    const elia = document.querySelectorAll('.pal-mover.rival')[1];
    expect(sporeBurst).toHaveBeenCalledWith(elia);
  });

  it('you win if you beat them all, and win a tie', async () => {
    const { track } = await import('../public/game/track.js');
    const banner = race({ them: RIVALS, target: CROWDED });
    yours.setCells(CROWDED);
    others[1].setCells(CROWDED);
    frame();
    vi.runAllTimers();
    expect(banner.querySelector('h2').textContent).toBe('You won the race!');
    expect(banner.querySelector('.win-message').textContent)
      .toBe(`Your colony reached ${CROWDED} cells before any of your rivals did.`);
    expect(track).toHaveBeenCalledWith('mixed/won/mona/vs-vi+elia+goldie', 'Mona beat Vi, Elia and Goldie in mixed culture');
  });
});
