// @vitest-environment jsdom
// pong.js runs Phage Pong: you and a rival pal slide round the rim and bat a
// phage back and forth. These tests check the geometry on its own (where a
// pal is, whether the phage hits her, bounces and whose rim it reached), then
// load the real petri dish page into jsdom and play points frame by frame,
// standing in for the keys, finger and effects.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PONG, SPECIES } from '../public/game/config.js';

const input = vi.hoisted(() => ({ keys: [0, 0], drag: [0, 0], finger: null }));

vi.mock('../public/game/keyboard.js', () => ({
  arrowKeys: vi.fn(() => ({ direction: () => input.keys, stop: vi.fn() })),
}));
vi.mock('../public/game/touch.js', () => ({
  touchSteering: vi.fn(() => ({
    target: () => input.finger,
    drag() {
      const moved = input.drag;
      input.drag = [0, 0];
      return moved;
    },
    stop: vi.fn(),
  })),
}));
vi.mock('../public/game/colony.js', () => ({ showPop: vi.fn() }));
vi.mock('../public/game/spores.js', () => ({ sporeBurst: vi.fn() }));
vi.mock('../public/game/facts.js', () => ({ showFact: vi.fn() }));
vi.mock('../public/game/track.js', () => ({ track: vi.fn() }));

const {
  bounce, hitSpot, palSpot, playPong, returnHeading, rimOwner, rivalTarget, SIDES, slideToward, steady, wrap,
} = await import('../public/game/pong.js');
const { showPop } = await import('../public/game/colony.js');
const { sporeBurst } = await import('../public/game/spores.js');
const { showFact } = await import('../public/game/facts.js');
const { track } = await import('../public/game/track.js');

const page = readFileSync(resolve(process.cwd(), 'public/petri-dish.html'), 'utf8');
const body = page.slice(page.indexOf('<body'), page.indexOf('</body>'));

// The dish is 400 px across, so 200 px is one dish radius.
const RADIUS = 200;
let frames;
let now;
let location;

function drawing(pal) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.dataset.pal = pal;
  svg.dataset.name = pal[0].toUpperCase() + pal.slice(1);
  document.querySelector('.pal-mover').appendChild(svg);
  return svg;
}

// Mona vs. Vi. `random` is 0.5 unless a test says otherwise: serves go
// straight across and the rival aims dead on.
function play(random = () => 0.5) {
  return playPong({
    you: { svg: drawing('mona'), species: SPECIES.mona },
    rival: { svg: drawing('vi'), species: SPECIES.vi },
    random,
  });
}

function frame(ms = 16) {
  now += ms;
  const waiting = frames;
  frames = [];
  for (const run of waiting) run(now);
}

// Runs frames until `done()` or `ms` have passed.
function until(done, ms = 10000) {
  for (let t = 0; t < ms && !done(); t += 16) frame();
}

const counter = () => document.querySelector('.cell-count').textContent;
const banner = () => document.querySelector('.win-banner');
const phageEl = () => document.querySelector('.pong-phage');
const rivalMover = () => document.querySelector('.pal-mover.rival');

beforeEach(() => {
  document.body.outerHTML = body;
  Object.defineProperty(document.querySelector('.agar'), 'clientWidth', { value: 2 * RADIUS, configurable: true });
  frames = [];
  now = 0;
  Object.assign(input, { keys: [0, 0], drag: [0, 0], finger: null });
  location = { href: 'http://localhost/petri-dish.html?pal=mona&mode=pong' };
  vi.stubGlobal('location', location);
  vi.stubGlobal('requestAnimationFrame', (run) => frames.push(run));
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe('the geometry', () => {
  it('turns angles to between -π and π', () => {
    expect(wrap(3 * Math.PI / 2)).toBeCloseTo(-Math.PI / 2);
    expect(wrap(-0.5)).toBeCloseTo(-0.5);
  });

  it('puts you on the left of the ring and the rival on the right', () => {
    const [yx, yy] = palSpot('you', 0);
    expect(yx).toBeCloseTo(-PONG.RING);
    expect(yy).toBeCloseTo(0);
    expect(palSpot('rival', 0)[0]).toBeCloseTo(PONG.RING);
  });

  it('slides at most so far a frame, and only so far round her side', () => {
    expect(slideToward(0, 1, 0.1)).toBeCloseTo(0.1);
    expect(slideToward(0, -1, 0.1)).toBeCloseTo(-0.1);
    expect(slideToward(0.3, 0.32, 0.1)).toBeCloseTo(0.32);
    expect(slideToward(PONG.SPAN, 5, 1)).toBe(PONG.SPAN);
    expect(slideToward(-PONG.SPAN, -5, 1)).toBe(-PONG.SPAN);
  });

  it('hits a pal heading her way, and says how far up her it hit', () => {
    const [x] = palSpot('you', 0);
    expect(hitSpot('you', 0, { fx: x + 0.05, fy: 0, vx: -1, vy: 0 })).toBeCloseTo(0);
    // Higher up the screen (smaller y) is further up her, on either side.
    expect(hitSpot('you', 0, { fx: x + 0.05, fy: -PONG.REACH / 2, vx: -1, vy: 0 })).toBeCloseTo(0.5);
    expect(hitSpot('rival', 0, { fx: -x - 0.05, fy: -PONG.REACH / 2, vx: 1, vy: 0 })).toBeCloseTo(0.5);
    // Past her end, the hit is her end.
    expect(hitSpot('you', 0, { fx: x, fy: PONG.REACH + 0.02, vx: -1, vy: 0 })).toBeCloseTo(-1);
  });

  it('misses a pal it is heading away from, or nowhere near', () => {
    const [x] = palSpot('you', 0);
    expect(hitSpot('you', 0, { fx: x + 0.05, fy: 0, vx: 1, vy: 0 })).toBeNull();
    expect(hitSpot('you', 0, { fx: x + 0.2, fy: 0, vx: -1, vy: 0 })).toBeNull();
    expect(hitSpot('you', 0, { fx: x, fy: 0.4, vx: -1, vy: 0 })).toBeNull();
  });

  it('sends the phage straight back off her middle, and off at an angle off her ends', () => {
    expect(returnHeading('you', 0)).toBe(-0);
    expect(returnHeading('rival', 0)).toBe(Math.PI);
    // Off her top end it heads up the screen (negative y), on either side.
    expect(Math.sin(returnHeading('you', 1))).toBeLessThan(0);
    expect(Math.cos(returnHeading('you', 1))).toBeGreaterThan(0);
    expect(Math.sin(returnHeading('rival', 1))).toBeLessThan(0);
    expect(Math.cos(returnHeading('rival', 1))).toBeLessThan(0);
  });

  it('knows whose rim is whose, and that the top and bottom are nobody\'s', () => {
    expect(rimOwner(Math.PI)).toBe('you');
    expect(rimOwner(-Math.PI + 0.5)).toBe('you');
    expect(rimOwner(0.5)).toBe('rival');
    expect(rimOwner(Math.PI / 2)).toBeNull();
    expect(rimOwner(-Math.PI / 2)).toBeNull();
  });

  it('keeps the phage heading across the dish, at the same speed', () => {
    const ball = { vx: 0.1, vy: 1 };
    steady(ball);
    expect(Math.hypot(ball.vx, ball.vy)).toBeCloseTo(Math.hypot(0.1, 1));
    expect(Math.atan2(ball.vy, ball.vx)).toBeCloseTo(PONG.TILT);
    const left = { vx: -0.1, vy: -1 };
    steady(left);
    expect(left.vx).toBeLessThan(0);
    expect(wrap(Math.atan2(left.vy, left.vx) - Math.PI)).toBeCloseTo(PONG.TILT);
  });

  it('bounces off the rim like a mirror, back inside', () => {
    const ball = { fx: 0, fy: -0.95, vx: 0.6, vy: -0.6 };
    bounce(ball);
    expect(ball.vx).toBeCloseTo(0.6);
    expect(ball.vy).toBeCloseTo(0.6);
    expect(ball.fy).toBeCloseTo(-(PONG.RIM - PONG.BALL));
    // Already heading back in: just put back inside.
    const leaving = { fx: 0, fy: 0.96, vx: 0.6, vy: -0.6 };
    bounce(leaving);
    expect(leaving.vy).toBeCloseTo(-0.6);
    expect(leaving.fy).toBeCloseTo(PONG.RIM - PONG.BALL);
  });

  it('sends the rival to where the phage will reach her, or back to the middle', () => {
    expect(rivalTarget({ fx: 0, fy: 0, vx: 1, vy: 0 })).toBeCloseTo(0);
    const up = rivalTarget({ fx: 0, fy: 0, vx: 1, vy: -0.5 });
    expect(up).toBeCloseTo(Math.atan2(-0.5, 1));
    expect(rivalTarget({ fx: 0, fy: 0, vx: 1, vy: -0.5 }, 0.1)).toBeCloseTo(up + 0.1);
    expect(rivalTarget({ fx: 0, fy: 0, vx: 1, vy: 3 })).toBe(PONG.SPAN);
    expect(rivalTarget({ fx: 0.5, fy: 0, vx: -1, vy: 0.3 })).toBe(0);
    // Not past the middle yet.
    expect(rivalTarget({ fx: -0.1, fy: 0, vx: 1, vy: -0.5 })).toBe(0);
  });

  it('copes with a phage already past the rival\'s ring', () => {
    const target = rivalTarget({ fx: 0.9, fy: 0.1, vx: 1, vy: 0 });
    expect(Math.abs(target)).toBeLessThanOrEqual(PONG.SPAN);
  });
});

describe('playing', () => {
  it('puts both pals on the rim, the same size, and the score under the dish', () => {
    const { pals } = play();
    frame();
    expect(pals.you.mover.classList).toContain('player');
    expect(rivalMover().querySelector('svg').getAttribute('aria-label')).toBe('Vi, your rival');
    expect(rivalMover().querySelector('svg').hasAttribute('hidden')).toBe(false);
    for (const mover of [pals.you.mover, rivalMover()]) expect(mover.style.width).toBe(`${PONG.PADDLE}%`);
    expect(pals.you.mover.style.transform).toBe(`translate(${-PONG.RING * RADIUS}px, 0px) rotate(90deg)`);
    expect(rivalMover().style.transform).toBe(`translate(${PONG.RING * RADIUS}px, 0px) rotate(-90deg)`);
    expect(counter()).toBe(`Mona 0 · Vi 0 · first to ${PONG.TARGET}`);
  });

  it('shows the part of each pal that hits the phage, in her color, under her', () => {
    const { pals } = play();
    frame();
    const bars = [...document.querySelectorAll('.pong-bar')];
    expect(bars).toEqual([pals.you.bar, pals.rival.bar]);
    expect(pals.you.bar.style.width).toBe(`${PONG.REACH * 100}%`);
    expect(pals.you.bar.style.height).toBe(`${PONG.THICK * 100}%`);
    const expected = document.createElement('span');
    expected.style.background = SPECIES.vi.color;
    expect(pals.rival.bar.style.background).toBe(expected.style.background);
    expect(pals.you.bar.style.left).toBe(`${50 - PONG.RING * 50}%`);
    expect(pals.rival.bar.style.getPropertyValue('--turn')).toBe('-90deg');
  });

  it('serves to the rival first, after a pause', () => {
    const { ball } = play();
    frame();
    expect(phageEl().hidden).toBe(true);
    until(() => !phageEl().hidden, PONG.SERVE_MS + 100);
    expect(ball.vx).toBeCloseTo(PONG.SPEED);
    expect(ball.vy).toBeCloseTo(0);
    frame();
    expect(ball.fx).toBeGreaterThan(0);
    expect(phageEl().style.getPropertyValue('--turn')).toBe('-90deg');
  });

  it('lets the rival bat it back, faster, and you bat it back too', () => {
    const { ball } = play();
    until(() => ball.vx < 0);
    const speed = Math.hypot(ball.vx, ball.vy);
    expect(speed).toBeCloseTo(PONG.SPEED * PONG.SPEEDUP);
    until(() => ball.vx > 0);
    expect(Math.hypot(ball.vx, ball.vy)).toBeCloseTo(speed * PONG.SPEEDUP);
  });

  it('never speeds it up past the top speed', () => {
    const { ball } = play();
    for (let i = 0; i < 10; i++) {
      until(() => ball.vx < 0);
      until(() => ball.vx > 0);
    }
    expect(Math.hypot(ball.vx, ball.vy)).toBeCloseTo(PONG.MAX_SPEED);
  });

  it('scores a point when the phage gets past you, and serves to you next', () => {
    const { ball, pals, score } = play();
    until(() => ball.vx < 0);
    // Slide out of the way.
    input.keys = [0, 1];
    until(() => score.rival === 1);
    expect(pals.you.slide).toBe(-PONG.SPAN);
    expect(counter()).toBe(`Mona 0 · Vi 1 · first to ${PONG.TARGET}`);
    expect(showPop).toHaveBeenCalledTimes(1);
    expect(showPop.mock.calls[0][2]).toBe(SPECIES.mona.color);
    expect(phageEl().hidden).toBe(true);
    input.keys = [0, 0];
    until(() => !phageEl().hidden, PONG.SERVE_MS + 100);
    expect(ball.vx).toBeLessThan(0);
  });

  // Serves, then sends a fast phage from the middle toward the top of the
  // rival's rim while she's down at the bottom of her side, too far to reach.
  function shootPastRival({ ball, pals }) {
    until(() => !phageEl().hidden, PONG.SERVE_MS + 100);
    const angle = -(PONG.GOAL - 0.05);
    Object.assign(ball, { fx: 0, fy: 0, vx: 1.5 * Math.cos(angle), vy: 1.5 * Math.sin(angle) });
    pals.rival.slide = PONG.SPAN;
  }

  it('scores you a point when the rival misses', () => {
    const game = play();
    shootPastRival(game);
    until(() => game.score.you + game.score.rival > 0);
    expect(game.score).toEqual({ you: 1, rival: 0 });
    expect(showPop.mock.calls[0][2]).toBe(SPECIES.vi.color);
    expect(game.ball.fx).toBeGreaterThan(0);
    // The next serve goes to her.
    until(() => !phageEl().hidden, PONG.SERVE_MS + 100);
    expect(game.ball.vx).toBeGreaterThan(0);
  });

  it('bounces the phage off the top of the rim', () => {
    const { ball, score } = play();
    until(() => !phageEl().hidden, PONG.SERVE_MS + 100);
    Object.assign(ball, { fx: 0, fy: -0.8, vx: 0.3, vy: -0.6 });
    until(() => ball.vy > 0, 500);
    expect(ball.vy).toBeGreaterThan(0);
    expect(score).toEqual({ you: 0, rival: 0 });
  });

  it('wins when you reach the target first', () => {
    const game = play();
    const { score } = game;
    score.you = PONG.TARGET - 1;
    score.rival = 2;
    shootPastRival(game);
    until(() => score.you === PONG.TARGET);
    expect(score.you).toBe(PONG.TARGET);
    expect(sporeBurst).toHaveBeenCalledWith(document.querySelector('.pal-mover.player'));
    expect(rivalMover().classList).toContain('killed');
    expect(track).toHaveBeenCalledWith('pong/won/mona/vs-vi', 'Mona beat Vi in Phage Pong');
    expect(banner().hidden).toBe(true);
    vi.advanceTimersByTime(600);
    expect(showFact).toHaveBeenCalledWith('mona', SPECIES.mona);
    expect(banner().hidden).toBe(false);
    expect(banner().querySelector('h2').textContent).toBe('You won!');
    expect(banner().querySelector('.win-message').textContent).toBe(`You beat Vi, ${PONG.TARGET} to ${score.rival}!`);
    expect(banner().querySelector('.play-again').textContent).toBe('Play again');
    expect(banner().querySelector('.start-over').textContent).toBe('New rival');
    expect(banner().querySelector('.start-over').hidden).toBe(false);
    expect(banner().querySelector('.back-to-modes').hidden).toBe(false);
    expect(document.activeElement).toBe(banner().querySelector('.play-again'));
    // Play stops: no more serves.
    until(() => false, PONG.SERVE_MS * 2);
    expect(phageEl().hidden).toBe(true);
  });

  it('loses when the rival gets there first', () => {
    const { score } = play();
    input.keys = [0, 1]; // stay out of the way
    until(() => score.rival === PONG.TARGET, 60000);
    expect(sporeBurst).toHaveBeenCalledWith(rivalMover());
    expect(document.querySelector('.pal-mover.player').classList).toContain('killed');
    expect(track).toHaveBeenCalledWith('pong/lost/mona/vs-vi', 'Mona lost to Vi in Phage Pong');
    vi.advanceTimersByTime(600);
    expect(banner().querySelector('h2').textContent).toBe('Vi won!');
    expect(banner().querySelector('.win-message').textContent).toBe(
      `Vi beat you, ${PONG.TARGET} to 0. The phage got past Mona ${PONG.TARGET} times!`);
  });

  it('plays the same rival again, a new one, or goes back to the modes', () => {
    play();
    banner().querySelector('.play-again').click();
    expect(location.href).toBe('./petri-dish.html?pal=mona&mode=pong&rival=vi');
    banner().querySelector('.start-over').click();
    expect(location.href).toBe('./petri-dish.html?pal=mona&mode=pong');
    banner().querySelector('.back-to-modes').click();
    expect(location.href).toBe('./choose-mode.html?pal=mona');
  });
});

describe('sliding round the rim', () => {
  it('slides up with the up arrow and down with the down arrow, then stops', () => {
    const { pals } = play();
    frame();
    input.keys = [0, -1];
    frame(100);
    expect(pals.you.slide).toBeCloseTo(PONG.YOUR_SPEED * 0.05); // frames are capped at 0.05 s
    // Up the screen on the left side is round toward the top.
    expect(palSpot('you', pals.you.slide)[1]).toBeLessThan(0);
    input.keys = [0, 1];
    frame(16);
    frame(16);
    expect(pals.you.slide).toBeLessThan(PONG.YOUR_SPEED * 0.05);
    input.keys = [0, 0];
    const still = pals.you.slide;
    frame();
    expect(pals.you.slide).toBe(still);
  });

  it('follows a dragging finger as far round as it moves', () => {
    const { pals } = play();
    frame();
    input.drag = [0, -PONG.RING * RADIUS * 0.1]; // up the screen, a tenth of a radian round
    frame();
    expect(pals.you.slide).toBeCloseTo(0.1);
  });

  it('heads toward a held-down mouse', () => {
    const { pals } = play();
    frame();
    input.finger = [-100, -100]; // up and to the left: 45° round toward the top
    until(() => pals.you.slide >= Math.PI / 4 - 1e-9, 2000);
    expect(pals.you.slide).toBeCloseTo(Math.PI / 4);
  });

  it('turns her to lie along the rim wherever she is', () => {
    const { pals } = play();
    frame();
    pals.you.slide = 0.5;
    frame();
    const [fx, fy] = palSpot('you', 0.5);
    const round = (n) => Math.round(n * 100) / 100;
    expect(pals.you.mover.style.transform).toBe(
      `translate(${round(fx * RADIUS)}px, ${round(fy * RADIUS)}px) rotate(${round(((SIDES.you + 0.5) * 180) / Math.PI - 90)}deg)`);
  });

  it('heads the rival back to the middle between points', () => {
    const { pals } = play();
    pals.rival.slide = 0.5;
    frame();
    frame(100);
    expect(pals.rival.slide).toBeCloseTo(0.5 - PONG.RIVAL_SPEED * 0.05);
  });
});
