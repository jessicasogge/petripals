// @vitest-environment jsdom
// phage.js runs Phage Attack: grow your colony while phages hunt it. A phage
// landing on an offspring cell infects it, and it later bursts and lets out
// more phages; one landing on your pal is game over. Like tumble.test.js,
// these tests load the real petri dish page into jsdom and stand in for the
// colony, steering and effects, so each test can put the phages exactly
// where it wants them and check what the player sees.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GAME, PHAGE, SPECIES } from '../public/game/config.js';

const fake = vi.hoisted(() => ({ colony: null }));

vi.mock('../public/game/colony.js', () => ({
  // The real colony starts with your pal in it.
  makeColony: vi.fn(({ leader, target, onLeaderEat }) => {
    fake.colony.groups.push(leader);
    Object.assign(fake.colony, { target, onLeaderEat });
    return fake.colony;
  }),
  moveGroups: vi.fn(),
  showPop: vi.fn(),
}));
// The leader: one cell of radius 10 px, wherever it's put.
const cell = () => {
  const g = { x: 0, y: 0, facing: 1, reach: () => 10 };
  g.body = () => [[g.x, g.y, 10]];
  return g;
};
vi.mock('../public/game/rod.js', () => ({ rodGroup: vi.fn(() => cell()) }));
vi.mock('../public/game/coccus.js', () => ({ coccusGroup: vi.fn(() => cell()) }));
vi.mock('../public/game/keyboard.js', () => ({
  arrowKeys: vi.fn(() => ({ direction: () => [0, 0], stop: vi.fn() })),
}));
vi.mock('../public/game/touch.js', () => ({
  steer: vi.fn(),
  touchSteering: vi.fn(() => ({ target: () => null, drag: () => [0, 0], stop: vi.fn() })),
}));
vi.mock('../public/game/spores.js', () => ({ sporeBurst: vi.fn() }));
vi.mock('../public/game/facts.js', () => ({ showFact: vi.fn() }));
vi.mock('../public/game/track.js', () => ({ track: vi.fn() }));

const { nearestCell, phageDrawing, phageSwarm, playPhage, TAIL } = await import('../public/game/phage.js');
const { showPop } = await import('../public/game/colony.js');
const { rodGroup } = await import('../public/game/rod.js');
const { coccusGroup } = await import('../public/game/coccus.js');
const { steer } = await import('../public/game/touch.js');
const { sporeBurst } = await import('../public/game/spores.js');
const { showFact } = await import('../public/game/facts.js');
const { track } = await import('../public/game/track.js');

const page = readFileSync(resolve(process.cwd(), 'public/petri-dish.html'), 'utf8');
const body = page.slice(page.indexOf('<body'), page.indexOf('</body>'));

// The dish is 400 px across, so 200 px is one dish radius.
const RADIUS = 200;
let frames;
let now;
let nutrients;
let location;
let colony;

function makeFakeColony() {
  let extra = 0;
  const c = {
    groups: [],
    sinceAnyDivision: Infinity,
    cellCount: () => c.groups.reduce((sum, g) => sum + (g.cellCount ? g.cellCount() : 1), 0) + extra,
    addCells(n) { extra += n; },
    tick: vi.fn(),
    // Your pal eats `meal` nutrients next frame.
    meal: 0,
    eat: vi.fn(() => {
      if (c.meal > 0) c.onLeaderEat(c.meal);
      c.meal = 0;
    }),
    divideLeader: vi.fn(),
  };
  return c;
}

// An offspring rod at (x, y) px from the center.
function offspring(x, y) {
  const mover = document.createElement('div');
  mover.className = 'pal-mover offspring';
  document.querySelector('.agar').appendChild(mover);
  const g = { x, y, reach: () => 10, mover };
  g.body = () => [[g.x, g.y, 10]];
  return g;
}

// An offspring chain of cocci, one cell of radius 10 px at each spot.
function chain(spots) {
  const g = offspring(spots[0][0], spots[0][1]);
  g.cells = spots.map(([x, y]) => [x, y, 10]);
  g.body = () => g.cells;
  g.cellCount = () => g.cells.length;
  g.removeCells = vi.fn((indexes) => { g.cells = g.cells.filter((_, i) => !indexes.includes(i)); });
  return g;
}

function drawing(pal) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.dataset.pal = pal;
  svg.dataset.name = pal[0].toUpperCase() + pal.slice(1);
  document.querySelector('.pal-mover').appendChild(svg);
  return svg;
}

// Start Phage Attack with Mona (or `me`), with a second phage on the agar
// (straight across from the first) so tests can use one and park the other.
function play(me = 'mona', target = PHAGE.TARGET) {
  const game = start(me, target);
  while (game.swarm.count() < 2) game.swarm.arrive(Math.PI);
  return game;
}

function start(me = 'mona', target = PHAGE.TARGET) {
  return playPhage({ you: { svg: drawing(me), species: SPECIES[me] }, nutrients, target, random: () => 0.5 });
}

function frame(ms = 50) {
  now += ms;
  const waiting = frames;
  frames = [];
  for (const run of waiting) run(now);
}

// Run frames until `ms` of game time has passed.
function run(ms) {
  for (let t = 0; t < ms; t += 50) frame(50);
}

const counter = () => document.querySelector('.cell-count').textContent;
const banner = () => document.querySelector('.win-banner');
const leader = () => colony.groups[0];

// Put a phage with its tail tip right on (x, y) px, heading `heading`.
function landOn(phage, x, y, heading = 0) {
  phage.heading = heading;
  phage.wander = 0;
  phage.fx = x / RADIUS - TAIL * Math.cos(heading);
  phage.fy = y / RADIUS - TAIL * Math.sin(heading);
}

// Keep a phage out of the way, far across the dish.
function park(phage) {
  phage.fx = 0;
  phage.fy = -0.92;
}

beforeEach(() => {
  document.body.outerHTML = body;
  Object.defineProperty(document.querySelector('.agar'), 'clientWidth', { value: 2 * RADIUS, configurable: true });
  frames = [];
  now = 0;
  colony = makeFakeColony();
  fake.colony = colony;
  nutrients = { stop: vi.fn() };
  location = { href: 'http://localhost/petri-dish.html?pal=mona&mode=phage' };
  vi.stubGlobal('location', location);
  vi.stubGlobal('requestAnimationFrame', (next) => frames.push(next));
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe('phageDrawing', () => {
  it('draws a phage with a head, a tail and tail fibers', () => {
    const svg = phageDrawing();
    expect(svg.getAttribute('viewBox')).toBe('0 0 40 60');
    expect(svg.querySelector('polygon')).not.toBeNull();
    expect(svg.querySelectorAll('polyline')).toHaveLength(4);
    expect(svg.querySelector('.phage-face')).not.toBeNull();
  });
});

describe('nearestCell', () => {
  it('picks the nearest cell', () => {
    const near = { fx: 0.1, fy: 0 };
    expect(nearestCell(0, 0, [{ fx: 0.5, fy: 0 }, near, { fx: -0.3, fy: 0.3 }])).toBe(near);
  });

  it('gives null when there are no cells', () => {
    expect(nearestCell(0, 0, [])).toBeNull();
  });
});

describe('phageSwarm', () => {
  const agar = () => document.querySelector('.agar');

  it('brings a phage in from the rim, heading inward and turned tail first', () => {
    const swarm = phageSwarm(agar(), () => 0);
    const phage = swarm.arrive();
    expect(phage.fx).toBeCloseTo(0.9);
    expect(phage.fy).toBeCloseTo(0);
    expect(phage.heading).toBeCloseTo(Math.PI);
    expect(phage.el.className).toBe('phage');
    expect(phage.el.parentElement).toBe(agar());
    expect(phage.el.style.left).toBe('95%');
    expect(phage.el.style.getPropertyValue('--turn')).toBe('90deg');
    expect(swarm.count()).toBe(1);
  });

  it('has no limit on how many phages there can be', () => {
    const swarm = phageSwarm(agar());
    for (let i = 0; i < 50; i++) swarm.arrive();
    expect(swarm.burst(0, 0, 50)).toHaveLength(50);
    expect(swarm.count()).toBe(100);
    expect(agar().querySelectorAll('.phage')).toHaveLength(100);
  });

  it('lets phages out of a burst, spraying different ways, drifting a moment before they hunt', () => {
    const swarm = phageSwarm(agar(), () => 0);
    const made = swarm.burst(0.2, 0.1, 2);
    expect(made).toHaveLength(2);
    expect(made.map((p) => p.heading)).toEqual([0, Math.PI]);
    for (const phage of made) {
      expect([phage.fx, phage.fy]).toEqual([0.2, 0.1]);
      expect(phage.grace).toBe(PHAGE.GRACE_MS);
    }
    // Fresh out of the burst, it swims straight on and ignores the cells.
    swarm.step(0.1, [{ fx: 0.2, fy: -0.5 }]);
    expect(made[0].fy).toBeCloseTo(0.1);
    expect(made[0].fx).toBeCloseTo(0.2 + PHAGE.SPEED * 0.1);
    expect(made[0].grace).toBeCloseTo(PHAGE.GRACE_MS - 100);
  });

  it('hunts the nearest cell', () => {
    const swarm = phageSwarm(agar(), () => 0.5); // no weaving
    const phage = swarm.arrive(0); // at (0.9, 0)
    swarm.step(0.1, [{ fx: 0.9, fy: 0.5 }, { fx: -0.5, fy: 0 }]);
    expect(phage.heading).toBeCloseTo(Math.PI / 2);
    expect(phage.fy).toBeCloseTo(PHAGE.SPEED * 0.1);
  });

  it('weaves a little, but never far off course', () => {
    const swarm = phageSwarm(agar(), () => 1);
    const phage = swarm.arrive(0);
    for (let i = 0; i < 50; i++) swarm.step(0.05, [{ fx: -0.9, fy: 0 }]);
    expect(phage.wander).toBe(PHAGE.WANDER);
  });

  it('swims straight on with no cells to hunt', () => {
    const swarm = phageSwarm(agar(), () => 0.5);
    const phage = swarm.arrive(0);
    swarm.step(0.5, []);
    expect(phage.heading).toBeCloseTo(Math.PI);
    expect(phage.fx).toBeCloseTo(0.9 - PHAGE.SPEED * 0.5);
  });

  it('stays on the agar', () => {
    const swarm = phageSwarm(agar(), () => 0.5);
    const [phage] = swarm.burst(0.9, 0, 1);
    phage.heading = 0;
    swarm.step(1, []);
    expect(Math.hypot(phage.fx, phage.fy)).toBeCloseTo(0.92);
  });

  it('finds its tail tip ahead of it', () => {
    const swarm = phageSwarm(agar(), () => 0);
    const phage = swarm.arrive(Math.PI / 2); // at the bottom, heading up
    const [tx, ty] = swarm.tip(phage);
    expect(tx).toBeCloseTo(0);
    expect(ty).toBeCloseTo(0.9 - TAIL);
  });

  it('fades a landed phage out and removes it', () => {
    const swarm = phageSwarm(agar());
    const first = swarm.arrive();
    const second = swarm.arrive();
    swarm.remove(first);
    swarm.remove(second);
    expect(swarm.count()).toBe(0);
    expect(first.el.classList).toContain('landed');
    first.el.dispatchEvent(new Event('animationend'));
    expect(first.el.isConnected).toBe(false);
    expect(second.el.isConnected).toBe(true);
    vi.advanceTimersByTime(600);
    expect(second.el.isConnected).toBe(false);
  });
});

describe('Phage Attack', () => {
  it(`starts with ${PHAGE.START} phage on the rim, and counts only the nutrients`, () => {
    const { swarm } = start();
    expect(swarm.count()).toBe(PHAGE.START);
    for (const phage of swarm.phages) expect(Math.hypot(phage.fx, phage.fy)).toBeCloseTo(0.9);
    expect(counter()).toBe(`0 / ${PHAGE.TARGET} nutrients`);
    expect(document.querySelector('.pal-mover').classList).toContain('player');
  });

  it('goes after your offspring, not your pal, unless she swims close', () => {
    const { swarm } = play();
    const [phage, other] = swarm.phages;
    park(other);
    colony.groups.push(offspring(0, 160)); // straight below the middle
    run(PHAGE.START_MS);
    // Your pal is in the middle, nearer than the offspring, but far enough
    // away not to be noticed: it heads for the offspring.
    phage.fx = 0;
    phage.fy = 0.4;
    frame();
    expect(phage.heading).toBeCloseTo(Math.PI / 2, 0);
    // Swim close and it comes for you instead.
    phage.fx = 0;
    phage.fy = PHAGE.NOTICE - 0.05;
    frame();
    expect(phage.heading).toBeCloseTo(-Math.PI / 2, 0);
  });

  it('uses the coccus drawing for round pals', () => {
    play('goldie');
    expect(coccusGroup).toHaveBeenCalledTimes(1);
    expect(rodGroup).not.toHaveBeenCalled();
  });

  it('steers your pal every frame', () => {
    play();
    frame();
    frame();
    expect(steer).toHaveBeenCalledTimes(2);
    expect(steer.mock.calls[0][0]).toBe(leader());
  });

  it('gives you a head start before the phages move', () => {
    const { swarm } = play();
    const [phage] = swarm.phages;
    const start = [phage.fx, phage.fy];
    run(PHAGE.START_MS - 100);
    expect([phage.fx, phage.fy]).toEqual(start);
    run(200);
    expect([phage.fx, phage.fy]).not.toEqual(start);
  });

  it("doesn't send in any new phages from the rim: they only come out of burst cells", () => {
    const { swarm } = play();
    // Keep them all away from your pal while we wait.
    for (let t = 0; t < 60000; t += 50) {
      for (const phage of swarm.phages) park(phage);
      frame(50);
    }
    expect(swarm.count()).toBe(2);
  });

  it('is game over when a phage lands on your pal', () => {
    const { swarm } = play();
    run(PHAGE.START_MS);
    park(swarm.phages[1]);
    landOn(swarm.phages[0], 0, 0);
    frame();
    expect(document.querySelector('.pal-mover').classList).toContain('killed');
    expect(nutrients.stop).toHaveBeenCalled();
    expect(track).toHaveBeenCalledWith('phage/lost/mona', 'Mona was caught by a phage');
    expect(swarm.count()).toBe(1);
    // Nothing more happens once it's over.
    frame();
    expect(colony.eat).toHaveBeenCalledTimes(Math.round(PHAGE.START_MS / 50));
    expect(banner().hidden).toBe(true);
    vi.advanceTimersByTime(500);
    expect(banner().hidden).toBe(false);
    expect(banner().querySelector('h2').textContent).toBe('Game over');
    expect(banner().querySelector('.win-message').textContent).toBe(
      'A phage landed on Mona and injected its DNA. Phages are viruses that infect bacteria!');
    expect(showFact).toHaveBeenCalledWith('mona', SPECIES.mona);
  });

  it('infects an offspring cell, which later bursts and lets out new phages', () => {
    const { swarm } = play();
    const rod = offspring(100, 0);
    colony.groups.push(rod);
    run(PHAGE.START_MS);
    park(swarm.phages[1]);
    landOn(swarm.phages[0], 100, 0);
    frame();
    expect(rod.infected).toBeTruthy();
    expect(rod.pending).toBe(-Infinity);
    expect(rod.mover.classList).toContain('infected');
    expect(swarm.count()).toBe(1);
    expect(counter()).toBe(`0 / ${PHAGE.TARGET} nutrients`);

    run(PHAGE.LATENT_MS);
    expect(colony.groups).not.toContain(rod);
    expect(rod.mover.isConnected).toBe(false);
    expect(showPop).toHaveBeenCalledWith(document.querySelector('.agar'), [100, 0, 10], SPECIES.mona.color);
    expect(swarm.count()).toBe(1 + PHAGE.BURST);
    expect(counter()).toBe(`0 / ${PHAGE.TARGET} nutrients`);
  });

  it("doesn't let two phages land on the same cell", () => {
    const { swarm } = play();
    const rod = offspring(100, 0);
    colony.groups.push(rod);
    run(PHAGE.START_MS);
    landOn(swarm.phages[0], 100, 0);
    landOn(swarm.phages[1], 100, 0);
    frame();
    expect(swarm.count()).toBe(1);
  });

  it('pops just the infected cell of a chain, and the rest live on', () => {
    const { swarm } = play();
    const pair = chain([[100, 0], [120, 0]]);
    colony.groups.push(pair);
    run(PHAGE.START_MS);
    park(swarm.phages[1]);
    landOn(swarm.phages[0], 120, 0);
    frame();
    expect(pair.mover.classList).toContain('infected');
    run(PHAGE.LATENT_MS);
    expect(pair.removeCells).toHaveBeenCalledWith([1]);
    expect(showPop).toHaveBeenCalledWith(document.querySelector('.agar'), [120, 0, 10], SPECIES.mona.color);
    expect(colony.groups).toContain(pair);
    expect(pair.infected).toBeNull();
    expect(pair.pending).toBe(0);
    expect(pair.mover.classList).not.toContain('infected');
  });

  it('pops a chain of one cell whole', () => {
    const { swarm } = play();
    const single = chain([[100, 0]]);
    colony.groups.push(single);
    run(PHAGE.START_MS);
    park(swarm.phages[1]);
    landOn(swarm.phages[0], 100, 0);
    frame();
    run(PHAGE.LATENT_MS);
    expect(single.removeCells).not.toHaveBeenCalled();
    expect(colony.groups).not.toContain(single);
  });

  it("leaves infected cells alone, and new phages don't land the moment they're out", () => {
    const { swarm } = play();
    const rod = offspring(100, 0);
    colony.groups.push(rod);
    run(PHAGE.START_MS);
    park(swarm.phages[1]);
    landOn(swarm.phages[0], 100, 0);
    frame();
    // The only phage left is far away; nothing else is near the infected
    // rod, so the hunters go for your pal, not it.
    const [hunter] = swarm.phages;
    frame();
    expect(Math.cos(hunter.heading - Math.atan2(-hunter.fy, -hunter.fx))).toBeGreaterThan(0.6);
    // A cell right next to the burst isn't infected straight away.
    const neighbor = offspring(100, 0);
    colony.groups.push(neighbor);
    run(PHAGE.LATENT_MS);
    expect(neighbor.infected).toBeUndefined();
  });

  it('says how many cells the phages burst when they catch your pal', () => {
    const { swarm } = play();
    const rod = offspring(100, 0);
    colony.groups.push(rod);
    run(PHAGE.START_MS);
    park(swarm.phages[1]);
    landOn(swarm.phages[0], 100, 0);
    frame();
    run(PHAGE.LATENT_MS);
    for (const phage of swarm.phages) park(phage);
    landOn(swarm.phages[0], 0, 0);
    run(PHAGE.GRACE_MS);
    vi.advanceTimersByTime(500);
    expect(banner().querySelector('.win-message').textContent).toMatch(/They burst 1 cell of her colony first\.$/);
  });

  it('counts burst cells in the plural too', () => {
    const { swarm } = play();
    colony.groups.push(offspring(100, 0), offspring(-100, 0));
    run(PHAGE.START_MS);
    landOn(swarm.phages[0], 100, 0);
    landOn(swarm.phages[1], -100, 0);
    frame();
    run(PHAGE.LATENT_MS);
    for (const phage of swarm.phages) park(phage);
    landOn(swarm.phages[0], 0, 0);
    run(PHAGE.GRACE_MS);
    vi.advanceTimersByTime(500);
    expect(banner().querySelector('.win-message').textContent).toMatch(/They burst 2 cells/);
  });

  it("doesn't cap the colony's size: it's the nutrients that count", () => {
    play();
    expect(colony.target).toBe(Infinity);
  });

  it('counts the nutrients your pal eats, and you win once she has eaten enough', () => {
    play('mona', 4);
    colony.meal = 3;
    frame();
    expect(colony.divideLeader).toHaveBeenCalledTimes(1);
    expect(counter()).toBe('3 / 4 nutrients');
    // Her offspring don't add to the count (they're the colony's to eat with,
    // and the colony only tells the game what she ate).
    colony.addCells(5);
    colony.meal = 2;
    colony.sinceAnyDivision = 200;
    frame();
    expect(colony.divideLeader).toHaveBeenCalledTimes(1);
    expect(sporeBurst).toHaveBeenCalledWith(document.querySelector('.pal-mover'));
    expect(nutrients.stop).toHaveBeenCalled();
    expect(track).toHaveBeenCalledWith('phage/won/mona', 'Mona outgrew the phages');
    expect(counter()).toBe('4 / 4 nutrients');
    vi.advanceTimersByTime(GAME.DIVIDE_MS - 200 - 1);
    expect(banner().hidden).toBe(true);
    vi.advanceTimersByTime(1);
    expect(banner().hidden).toBe(false);
    expect(banner().querySelector('h2').textContent).toBe('You outgrew the phages!');
    expect(banner().querySelector('.win-message').textContent).toBe(
      'Your colony ate 4 nutrients before the phages could stop it.');
    expect(banner().querySelector('.play-again').textContent).toBe('Play again');
    expect(banner().querySelector('.start-over').textContent).toBe('Choose a mode');
    expect(banner().querySelector('.start-over').hidden).toBe(false);
    expect(document.activeElement).toBe(banner().querySelector('.play-again'));
  });

  it('plays again, or goes back to the modes', () => {
    play();
    banner().querySelector('.play-again').click();
    expect(location.href).toBe('http://localhost/petri-dish.html?pal=mona&mode=phage');
    banner().querySelector('.start-over').click();
    expect(location.href).toBe('./choose-mode.html?pal=mona');
  });
});
