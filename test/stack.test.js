// @vitest-environment jsdom
// The Colony Stack page: pieces drift in on their own, the buttons and keys
// move them, full rings score, and the game ends when the rim is reached.
// The frame loop is driven by hand, and the spore burst and counting are
// swapped for stand-ins.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../public/game/spores.js', () => ({ sporeBurst: vi.fn() }));
vi.mock('../public/game/track.js', () => ({ track: vi.fn() }));
// The real rules, with clearRings watched so a test can pretend rings filled.
vi.mock('../public/game/stack-board.js', async (original) => {
  const real = await original();
  return { ...real, clearRings: vi.fn(real.clearRings) };
});

const board = await import('../public/game/stack-board.js');
const { PIECES, STACK, driftMs, emptyBoard, shuffledPals } = board;

const page = readFileSync(resolve(process.cwd(), 'public/colony-stack.html'), 'utf8');

let frames;
let listeners;

async function open() {
  document.body.outerHTML = page.slice(page.indexOf('<body'), page.indexOf('</body>'));
  vi.resetModules();
  await import('../public/game/stack.js');
  return {
    sporeBurst: (await import('../public/game/spores.js')).sporeBurst,
    track: (await import('../public/game/track.js')).track,
  };
}

// Run the next frame at `time` ms.
let clock;
function frameAt(time) {
  clock = time;
  frames.shift()(time);
}
// Run frames every 16 ms (about 60 a second) for `ms`.
function runFor(ms) {
  const end = clock + ms;
  while (clock < end) frameAt(clock + 16);
}

const $ = (selector) => document.querySelector(selector);
const text = (selector) => $(selector).textContent;
const press = (key) => window.dispatchEvent(new KeyboardEvent('keydown', { key, cancelable: true }));
const click = (name) => $(`.stack-${name}`).click();
const turn = () => $('.stack-turning').style.transform;
const cellCount = () => Number(text('.stack-cell-count'));
// The pals in the order they come, with Math.random pinned to 0.
const order = shuffledPals(() => 0).reverse();

beforeEach(() => {
  frames = [];
  clock = 0;
  vi.stubGlobal('requestAnimationFrame', (callback) => frames.push(callback));
  vi.spyOn(Math, 'random').mockReturnValue(0);
  // Just the timers: requestAnimationFrame is stubbed above.
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
  // Each test loads the page script afresh, so take its key listener away
  // after, or the next test's key presses would play this test's game too.
  listeners = [];
  const add = window.addEventListener.bind(window);
  vi.spyOn(window, 'addEventListener').mockImplementation((...args) => {
    listeners.push(args);
    add(...args);
  });
});

afterEach(() => {
  for (const args of listeners) window.removeEventListener(...args);
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('Colony Stack', () => {
  it('starts at level 1 with nothing scored, and a piece at the rim', async () => {
    const { track } = await open();
    expect(text('.stack-level')).toBe('Level 1');
    expect(text('.stack-score')).toBe('0');
    expect(text('.stack-rings')).toBe('0');
    expect($('.stack-cells').querySelectorAll('path:not(.ghost)').length).toBeGreaterThan(0);
    expect($('.stack-cells .ghost')).not.toBe(null);
    expect($('.stack-cells .face')).not.toBe(null);
    expect($('.stack-guides').children).toHaveLength(STACK.RINGS + 1 + STACK.SECTORS);
    expect($('.loading-overlay').hidden).toBe(true);
    expect(track).toHaveBeenCalledWith('colony-stack/start');
  });

  it('says why the falling piece is the shape she is, and shows the next one', async () => {
    await open();
    const fact = $('.stack-fact');
    expect(fact.querySelector('b').textContent).toBe('Scarlett');
    expect(fact.querySelector('i').textContent).toBe('Streptococcus');
    expect($('.stack-next').querySelectorAll('rect')).toHaveLength(PIECES[order[1]].cells.length);
    expect(order[0]).toBe('scarlett');
  });

  it('drifts the piece in on its own, but not for a long gap between frames', async () => {
    await open();
    const atRim = $('.stack-cells').innerHTML;
    frameAt(0);
    runFor(driftMs(1) - 20);
    expect($('.stack-cells').innerHTML).toBe(atRim);
    runFor(20);
    expect($('.stack-cells').innerHTML).not.toBe(atRim);
    // A hidden tab coming back counts as a short gap, not a long one.
    const before = $('.stack-cells').innerHTML;
    frameAt(clock + 60_000);
    expect($('.stack-cells').innerHTML).toBe(before);
  });

  it('lands a piece that drifts all the way in', async () => {
    await open();
    frameAt(0);
    runFor(STACK.RINGS * driftMs(1));
    expect(cellCount()).toBe(PIECES.scarlett.cells.length);
    expect(text('.stack-fact')).toMatch(/^Penny /);
  });

  it('slides around the dish with the buttons and arrow keys, turning the dish', async () => {
    await open();
    const start = turn();
    click('right');
    const right = turn();
    expect(right).not.toBe(start);
    click('left');
    expect(turn()).toBe(start);
    press('ArrowRight');
    expect(turn()).toBe(right);
    press('ArrowLeft');
    expect(turn()).toBe(start);
  });

  it("doesn't slide into another cell", async () => {
    await open();
    // Scarlett lands in the innermost ring, sectors 15, 0, 1 and 2.
    click('drop');
    // Penny (sectors 0 and 1) slides to 3 and 4 and drifts in beside her...
    for (let i = 0; i < 3; i++) click('right');
    for (let i = 0; i < STACK.RINGS - 1; i++) press('ArrowDown');
    // ...so she can't slide left into Scarlett, only right.
    const beside = turn();
    click('left');
    expect(turn()).toBe(beside);
    click('right');
    expect(turn()).not.toBe(beside);
  });

  it("doesn't slide into another cell on the other side either", async () => {
    await open();
    click('drop');
    // Penny at 13 and 14, just left of Scarlett.
    for (let i = 0; i < 3; i++) click('left');
    for (let i = 0; i < STACK.RINGS - 1; i++) press('ArrowDown');
    const beside = turn();
    click('right');
    expect(turn()).toBe(beside);
  });

  it('turns the piece', async () => {
    await open();
    const before = $('.stack-cells').innerHTML;
    click('turn');
    const once = $('.stack-cells').innerHTML;
    expect(once).not.toBe(before);
    press('ArrowUp');
    expect($('.stack-cells').innerHTML).not.toBe(once);
  });

  it('drifts in a ring with ↓, for a point', async () => {
    await open();
    press('ArrowDown');
    expect(text('.stack-score')).toBe('1');
  });

  it('drops all the way with the button or space, two points a ring', async () => {
    await open();
    click('drop');
    expect(cellCount()).toBe(4);
    expect(text('.stack-score')).toBe(String(2 * (STACK.RINGS - 1)));
    press(' ');
    expect(cellCount()).toBe(6);
  });

  it('leaves space to a focused button, and other keys alone', async () => {
    await open();
    const left = $('.stack-left');
    left.focus();
    const space = new KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true });
    left.dispatchEvent(space);
    expect(space.defaultPrevented).toBe(false);
    expect(cellCount()).toBe(0);
    const other = new KeyboardEvent('keydown', { key: 'a', cancelable: true });
    window.dispatchEvent(other);
    expect(other.defaultPrevented).toBe(false);
    const arrow = new KeyboardEvent('keydown', { key: 'ArrowUp', cancelable: true });
    window.dispatchEvent(arrow);
    expect(arrow.defaultPrevented).toBe(true);
  });

  it('cheers, scores and bursts spores for a full ring', async () => {
    const { sporeBurst } = await open();
    board.clearRings.mockReturnValueOnce({ board: emptyBoard(), cleared: [0] });
    click('drop');
    expect(text('.stack-rings')).toBe('1');
    expect($('.stack-cheer').hidden).toBe(false);
    expect(text('.stack-cheer')).toBe('Full ring! +100');
    expect(sporeBurst).toHaveBeenCalledWith($('.stack-dish'));
    vi.advanceTimersByTime(2000);
    expect($('.stack-cheer').hidden).toBe(true);
  });

  it('goes up a level after enough rings, and drifts faster', async () => {
    const { track } = await open();
    const five = [0, 1, 2, 3, 4];
    board.clearRings.mockReturnValueOnce({ board: emptyBoard(), cleared: five });
    click('drop');
    expect(text('.stack-cheer')).toBe('5 full rings! +800');
    expect(text('.stack-level')).toBe('Level 2');
    expect(track).toHaveBeenCalledWith('colony-stack/level-2');
    board.clearRings.mockReturnValueOnce({ board: emptyBoard(), cleared: [0] });
    click('drop');
    expect(text('.stack-level')).toBe('Level 2');
  });

  it('ends when a new piece has no room at the rim, and starts again', async () => {
    const { track } = await open();
    for (let i = 0; i < 20 && $('.stack-over').hidden; i++) click('drop');
    expect($('.stack-over').hidden).toBe(false);
    expect(text('.stack-final')).toMatch(/^You cleared 0 rings and scored \d+\.$/);
    expect(document.activeElement).toBe($('.stack-again'));
    expect(track).toHaveBeenCalledWith('colony-stack/game-over');
    // Nothing moves once it's over: not the buttons, keys or frames.
    const cells = cellCount();
    click('drop');
    press(' ');
    while (frames.length) frameAt(clock + 1000);
    expect(cellCount()).toBe(cells);

    $('.stack-again').click();
    expect($('.stack-over').hidden).toBe(true);
    expect(document.activeElement).not.toBe($('.stack-again'));
    expect(cellCount()).toBe(0);
    expect(text('.stack-score')).toBe('0');
  });

  it('says "1 ring" for one ring', async () => {
    await open();
    board.clearRings.mockReturnValueOnce({ board: emptyBoard(), cleared: [0] });
    click('drop');
    for (let i = 0; i < 20 && $('.stack-over').hidden; i++) click('drop');
    expect(text('.stack-final')).toMatch(/^You cleared 1 ring and/);
  });

  it('deals every pal before dealing any twice', async () => {
    await open();
    const seen = [];
    for (let i = 0; i < 8; i++) {
      seen.push($('.stack-fact b').textContent);
      // Drop at a new spot each time, so the dish doesn't fill.
      for (let s = 0; s < 4; s++) click('right');
      click('drop');
    }
    expect(new Set(seen.slice(0, 6)).size).toBe(6);
  });
});
