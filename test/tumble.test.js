// @vitest-environment jsdom
// tumble.js runs Petri Picnic: your pal swims straight on her own and a
// tap or key makes her tumble a random new way. Like race.test.js, these
// tests load the real petri dish page into jsdom and stand in for the colony
// and effects, so each test can say exactly what happens and check what the
// player sees.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GAME, SPECIES, TUMBLE } from '../public/game/config.js';

const fake = vi.hoisted(() => ({ colony: null }));

vi.mock('../public/game/colony.js', () => ({
  makeColony: vi.fn(() => fake.colony),
  moveGroups: vi.fn(),
}));
const group = () => ({ x: 0, y: 0, facing: 1, reach: () => 10, body: () => [[0, 0, 5]] });
vi.mock('../public/game/rod.js', () => ({ rodGroup: vi.fn(() => group()) }));
vi.mock('../public/game/coccus.js', () => ({ coccusGroup: vi.fn(() => group()) }));
vi.mock('../public/game/spores.js', () => ({ sporeBurst: vi.fn() }));
vi.mock('../public/game/track.js', () => ({ track: vi.fn() }));

const { playTumble, QUIET_MS, swimmer } = await import('../public/game/tumble.js');
const { rodGroup } = await import('../public/game/rod.js');
const { coccusGroup } = await import('../public/game/coccus.js');
const { sporeBurst } = await import('../public/game/spores.js');
const { track } = await import('../public/game/track.js');

const page = readFileSync(resolve(process.cwd(), 'public/petri-dish.html'), 'utf8');
const body = page.slice(page.indexOf('<body'), page.indexOf('</body>'));

const TARGET = TUMBLE.TARGET;
let frames;
let now;
let nutrients;
let location;
let colony;
let listening; // the window listeners this test's game added, removed after it

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

function drawing(pal) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.dataset.pal = pal;
  svg.dataset.name = pal[0].toUpperCase() + pal.slice(1);
  document.querySelector('.pal-mover').appendChild(svg);
  return svg;
}

// Start Petri Picnic with Mona (or `me`) and return the pop-up.
function play(me = 'mona') {
  playTumble({ you: { svg: drawing(me), species: SPECIES[me] }, nutrients, target: TARGET });
  return document.querySelector('.win-banner');
}

function frame(ms = 16) {
  now += ms;
  const waiting = frames;
  frames = [];
  for (const run of waiting) run(now);
}

const counter = () => document.querySelector('.cell-count').textContent;
const leader = () => rodGroup.mock.results[0].value;
const press = (key, options = {}) => {
  const event = new KeyboardEvent('keydown', { key, cancelable: true, ...options });
  window.dispatchEvent(event);
  return event;
};

// jsdom's pointer events have no isPrimary; make every one primary unless a
// test says otherwise.
function pointerdown(isPrimary = true) {
  const event = new MouseEvent('pointerdown', { bubbles: true, cancelable: true });
  Object.defineProperty(event, 'isPrimary', { value: isPrimary });
  document.querySelector('.petri-dish').dispatchEvent(event);
  return event;
}

beforeEach(() => {
  // Each game listens for keys on the window, which outlives the test, so
  // take this test's listeners off afterward; otherwise an earlier test's
  // game would still be answering key presses.
  listening = [];
  const add = window.addEventListener;
  vi.spyOn(window, 'addEventListener').mockImplementation((...args) => {
    listening.push(args);
    return add.apply(window, args);
  });
  document.body.outerHTML = body;
  Object.defineProperty(document.querySelector('.agar'), 'clientWidth', { value: 400, configurable: true });
  frames = [];
  now = 0;
  colony = makeFakeColony();
  fake.colony = colony;
  nutrients = { stop: vi.fn() };
  location = { href: 'http://localhost/petri-dish.html?pal=mona&mode=tumble' };
  vi.stubGlobal('location', location);
  vi.stubGlobal('requestAnimationFrame', (run) => frames.push(run));
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
});
afterEach(() => {
  window.addEventListener.mockRestore();
  for (const args of listening) window.removeEventListener(...args);
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe('swimmer', () => {
  it('swims straight ahead the way she faces', () => {
    const pal = group();
    pal.facing = -1;
    const swim = swimmer(pal);
    swim.step(0.1, 5, 200);
    expect(pal.x).toBeCloseTo(-5);
    expect(pal.y).toBeCloseTo(0);
    expect(pal.facing).toBe(-1);
  });

  it('spins on the spot while tumbling, then sets off a random new way', () => {
    const pal = group();
    const swim = swimmer(pal, () => 0.25); // a quarter turn: straight down
    expect(swim.tumble()).toBe(true);
    expect(swim.tumble()).toBe(false); // already tumbling
    swim.step(TUMBLE.TUMBLE_MS / 2000, 5, 200);
    expect(swim.tumbling()).toBe(true);
    expect(pal.x).toBe(0);
    swim.step(TUMBLE.TUMBLE_MS / 1000, 5, 200);
    expect(swim.tumbling()).toBe(false);
    expect(swim.heading()).toBeCloseTo(Math.PI / 2);
    swim.step(0.1, 5, 200);
    expect(pal.y).toBeCloseTo(5);
    expect(pal.facing).toBe(1); // heading straight down doesn't flip her
  });

  it('bounces off the rim instead of pushing into it', () => {
    const pal = group();
    pal.x = 188; // her edge (reach 10) is 2px from the rim of a 200px dish
    const swim = swimmer(pal);
    swim.step(0.1, 5, 200);
    expect(swim.heading()).toBeCloseTo(Math.PI);
    expect(pal.x).toBeCloseTo(183);
    expect(pal.facing).toBe(-1);
  });

  it('keeps going if she is already heading back in at the rim', () => {
    const pal = group();
    pal.x = 195;
    pal.facing = -1;
    const swim = swimmer(pal);
    swim.step(0.1, 5, 200);
    expect(swim.heading()).toBeCloseTo(Math.PI);
    expect(pal.x).toBeCloseTo(190);
  });
});

describe('playing', () => {
  it('is a rod, chain or cluster like the pal', () => {
    play('mona');
    play('ceres');
    play('goldie');
    expect(rodGroup).toHaveBeenCalledTimes(1);
    expect(coccusGroup).toHaveBeenCalledTimes(2);
  });

  it('counts cells and tumbles', () => {
    play();
    expect(counter()).toBe(`1 / ${TARGET} cells · 0 tumbles`);
    pointerdown();
    expect(counter()).toBe(`1 / ${TARGET} cells · 1 tumble`);
  });

  it('updates the counter as the colony divides', async () => {
    const { makeColony } = await import('../public/game/colony.js');
    play();
    colony.setCells(5);
    makeColony.mock.calls[0][0].onDivide();
    expect(counter()).toBe(`5 / ${TARGET} cells · 0 tumbles`);
  });

  it('swims on her own each frame', () => {
    play();
    frame();
    frame(100);
    expect(leader().x).toBeCloseTo(TUMBLE.SPEED * 200 * 0.05); // one frame is capped at 0.05s
  });

  it('tumbles on a tap, spinning until the tumble is done', () => {
    play();
    const mover = document.querySelector('.pal-mover');
    const event = pointerdown();
    expect(event.defaultPrevented).toBe(true);
    expect(mover.classList).toContain('tumbling');
    for (let i = 0; i < 10; i++) frame(50);
    expect(mover.classList).not.toContain('tumbling');
  });

  it("ignores a second finger, and taps that land mid-tumble don't count", () => {
    play();
    pointerdown(false);
    expect(counter()).toContain('0 tumbles');
    pointerdown();
    pointerdown();
    expect(counter()).toContain('1 tumble');
  });

  it('tumbles on the space bar or an arrow key, without scrolling the page', () => {
    play();
    expect(press(' ').defaultPrevented).toBe(true);
    for (let i = 0; i < 10; i++) frame(50);
    expect(press('ArrowLeft').defaultPrevented).toBe(true);
    expect(counter()).toContain('2 tumbles');
  });

  it("doesn't tumble on other keys, or again for a held key", () => {
    play();
    expect(press('a').defaultPrevented).toBe(false);
    press(' ', { repeat: true });
    expect(counter()).toContain('0 tumbles');
  });

  it('keeps eating and dividing until the colony is big enough', () => {
    const banner = play();
    frame();
    expect(colony.eat).toHaveBeenCalled();
    expect(colony.divideLeader).toHaveBeenCalled();
    expect(banner.hidden).toBe(true);
  });
});

describe('winning', () => {
  function won(tumbles = 3) {
    const banner = play();
    for (let i = 0; i < tumbles; i++) {
      pointerdown();
      for (let j = 0; j < 10; j++) frame(50);
    }
    colony.setCells(TARGET);
    colony.sinceAnyDivision = 100;
    frame();
    return banner;
  }

  it(`shows the pop-up once the colony reaches ${TARGET}, after the last division`, () => {
    const banner = won();
    expect(nutrients.stop).toHaveBeenCalled();
    expect(sporeBurst).toHaveBeenCalledWith(document.querySelector('.pal-mover.player'));
    vi.advanceTimersByTime(GAME.DIVIDE_MS - 100 - 1);
    expect(banner.hidden).toBe(true);
    vi.advanceTimersByTime(1);
    expect(banner.hidden).toBe(false);
    expect(banner.querySelector('h2').textContent).toBe('You found the food!');
    expect(banner.querySelector('.win-message').textContent)
      .toBe(`Your colony reached ${TARGET} cells with 3 tumbles.`);
    expect(SPECIES.mona.facts).toContain(document.querySelector('.fun-fact-text').textContent);
    expect(track).toHaveBeenCalledWith('tumble/won/mona', `Mona grew ${TARGET} cells in 3 tumbles`);
  });

  it('says "1 tumble"', () => {
    const banner = won(1);
    vi.runAllTimers();
    expect(banner.querySelector('.win-message').textContent).toContain('with 1 tumble.');
  });

  it('stops swimming and tumbling once won', () => {
    won();
    const { x } = leader();
    frame();
    pointerdown();
    press(' ');
    expect(leader().x).toBe(x);
    expect(counter()).toBe(`${TARGET} / ${TARGET} cells · 3 tumbles`);
    const eaten = colony.eat.mock.calls.length;
    frame();
    expect(colony.eat).toHaveBeenCalledTimes(eaten);
  });

  it("ignores the space bar just after winning, so it can't press Play again and skip the pop-up", () => {
    const banner = won();
    expect(press(' ').defaultPrevented).toBe(true); // before the pop-up
    vi.advanceTimersByTime(GAME.DIVIDE_MS);
    expect(banner.hidden).toBe(false);
    expect(document.activeElement).toBe(banner.querySelector('.play-again'));
    expect(press(' ').defaultPrevented).toBe(true);
    const up = new KeyboardEvent('keyup', { key: ' ', cancelable: true });
    window.dispatchEvent(up);
    expect(up.defaultPrevented).toBe(true);
    expect(press('ArrowLeft').defaultPrevented).toBe(true);
    expect(counter()).toContain('3 tumbles'); // and none of them tumble her
  });

  it('lets the space bar press the buttons again once the pop-up has been up a moment', () => {
    won();
    vi.advanceTimersByTime(GAME.DIVIDE_MS + QUIET_MS);
    expect(press(' ').defaultPrevented).toBe(false);
    const up = new KeyboardEvent('keyup', { key: ' ', cancelable: true });
    window.dispatchEvent(up);
    expect(up.defaultPrevented).toBe(false);
  });

  it('"Play again" starts a new dish, and "Choose a mode" goes back to the modes', () => {
    const banner = won();
    vi.runAllTimers();
    banner.querySelector('.play-again').click();
    expect(location.href).toBe('http://localhost/petri-dish.html?pal=mona&mode=tumble');
    const modes = banner.querySelector('.start-over');
    expect(modes.hidden).toBe(false);
    expect(modes.textContent).toBe('Choose a mode');
    modes.click();
    expect(location.href).toBe('./choose-mode.html?pal=mona');
  });
});

describe('the tumble spin', () => {
  it("spins her around her middle, even Goldie, whose squish pivots from her bottom", () => {
    const css = readFileSync(resolve(process.cwd(), 'public/styles.css'), 'utf8');
    const rule = css.match(/\.pal-mover\.tumbling \.dish-pal \{([^}]*)\}/)[1];
    expect(rule).toMatch(/animation: tumble /);
    expect(rule).toMatch(/transform-origin: center;/);
  });
});
