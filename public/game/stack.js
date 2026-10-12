// Colony Stack: colony pieces drift in from the rim of a round dish toward
// the food in the middle. Slide them around the dish and turn them, and fill
// a ring all the way around to clear it. The game ends when a new piece has
// no room at the rim. The rules are in stack-board.js, the drawing math in
// stack-draw.js.
import { withItalics } from './italics.js';
import { pageReady, watchLoading } from './loading.js';
import { palById } from './pals.js';
import { sporeBurst } from './spores.js';
import {
  PIECES, cellsOf, clearRings, driftMs, emptyBoard, fits, landing, levelFor,
  moved, newPiece, pointsFor, settle, shuffledPals, turned,
} from './stack-board.js';
import { cellCenter, cellPath, dishTurn, flatCells, guideCircles, guideSpokes } from './stack-draw.js';
import { track } from './track.js';

// "Growing the colony…" while the next screen loads.
watchLoading();

const $ = (selector) => document.querySelector(selector);
const turning = $('.stack-turning');
const cellsLayer = $('.stack-cells');
const cheer = $('.stack-cheer');
const over = $('.stack-over');

// The longest gap between frames that counts, so coming back to a hidden
// tab doesn't drop a pile of pieces at once.
const MAX_FRAME_MS = 250;
const CHEER_MS = 1200;

let board;
let piece;
let upNext;
let queue;
let score;
let rings;
let cells;
let level;
let waited;
let lastFrame;
let playing = false;
let cheerTimer;

// The guides never change, so they're drawn once.
$('.stack-guides').innerHTML =
  guideCircles().map((r) => `<circle cx="181" cy="181" r="${r}" />`).join('') +
  guideSpokes().map((d) => `<path d="${d}" />`).join('');

// The next pal from a shuffled run of all of them, so none is missing for long.
function nextPal() {
  if (queue.length === 0) queue = shuffledPals();
  return queue.pop();
}

// One cell, with her face if it's the piece's first cell. `ghost` is the
// dashed outline of where the falling piece will land.
function cellSvg({ ring, sector, face }, pal, ghost = false) {
  const { round, fill, line } = PIECES[pal];
  const d = cellPath(ring, sector, round);
  if (ghost) return `<path class="ghost" d="${d}" stroke="${line}" />`;
  let svg = `<path d="${d}" fill="${fill}" stroke="${line}" />`;
  if (face) {
    const { x, y } = cellCenter(ring, sector);
    svg += `<g class="face" transform="translate(${x} ${y})" fill="${line}" stroke="${line}">` +
      '<circle cx="-2.6" cy="-1" r="1.3" /><circle cx="2.6" cy="-1" r="1.3" />' +
      '<path d="M-2.6 2 Q0 4.4 2.6 2" fill="none" /></g>';
  }
  return svg;
}

function draw() {
  const parts = [];
  board.forEach((ring, r) => ring.forEach((cell, s) => {
    if (cell) parts.push(cellSvg({ ring: r, sector: s, face: cell.face }, cell.pal));
  }));
  if (piece) {
    const ghost = landing(board, piece);
    if (ghost.ring !== piece.ring) for (const cell of cellsOf(ghost)) parts.push(cellSvg(cell, piece.pal, true));
    for (const cell of cellsOf(piece)) parts.push(cellSvg(cell, piece.pal));
    turning.style.transform = `rotate(${dishTurn(piece.sector)}deg)`;
  }
  cellsLayer.innerHTML = parts.join('');
}

function showStats() {
  $('.stack-score').textContent = score.toLocaleString('en-US');
  $('.stack-rings').textContent = rings;
  $('.stack-cell-count').textContent = cells;
  $('.stack-level').textContent = `Level ${level}`;
}

// The little picture of the next piece.
function showNext() {
  const { round, fill, line } = PIECES[upNext];
  const flat = flatCells(upNext);
  const size = 40 / Math.max(3, ...flat.map(({ x, y }) => Math.max(x, y) + 1));
  const across = Math.max(...flat.map(({ x }) => x)) + 1;
  const down = Math.max(...flat.map(({ y }) => y)) + 1;
  const left = (40 - across * size) / 2;
  const top = (40 - down * size) / 2;
  $('.stack-next').innerHTML = flat.map(({ x, y }) =>
    `<rect x="${left + x * size + 1}" y="${top + y * size + 1}" width="${size - 2}" height="${size - 2}" ` +
    `rx="${round ? size / 2 : size / 4}" fill="${fill}" stroke="${line}" />`).join('');
}

// Why the falling piece is the shape she is.
function showFact() {
  const pal = palById(piece.pal);
  const name = document.createElement('b');
  name.textContent = pal.name;
  name.style.color = PIECES[piece.pal].line;
  $('.stack-fact').replaceChildren(name, ' ', ...withItalics(PIECES[piece.pal].fact));
}

// A new piece at the rim, where the last one was. No room means game over.
function spawn(sector) {
  piece = newPiece(upNext, sector);
  upNext = nextPal();
  showNext();
  if (!fits(board, piece)) {
    piece = null;
    endGame();
    return;
  }
  showFact();
}

function say(text) {
  cheer.textContent = text;
  cheer.hidden = false;
  clearTimeout(cheerTimer);
  cheerTimer = setTimeout(() => { cheer.hidden = true; }, CHEER_MS);
}

// The piece can't drift in any further: it sticks, full rings clear, and
// the next piece comes in.
function land() {
  board = settle(board, piece);
  cells += piece.cells.length;
  const result = clearRings(board);
  board = result.board;
  const cleared = result.cleared.length;
  if (cleared > 0) {
    const points = pointsFor(cleared, level);
    score += points;
    rings += cleared;
    say(`${cleared === 1 ? 'Full ring!' : `${cleared} full rings!`} +${points}`);
    sporeBurst($('.stack-dish'));
    const newLevel = levelFor(rings);
    if (newLevel > level) {
      level = newLevel;
      track(`colony-stack/level-${level}`);
    }
  }
  spawn(piece.sector);
  showStats();
  draw();
}

// Drift in one ring, or land if something's in the way.
function driftIn() {
  const next = moved(piece, -1, 0);
  if (fits(board, next)) piece = next;
  else land();
}

function frame(time) {
  if (!playing) return;
  if (lastFrame !== null) waited += Math.min(time - lastFrame, MAX_FRAME_MS);
  lastFrame = time;
  let drifted = false;
  while (playing && waited >= driftMs(level)) {
    waited -= driftMs(level);
    driftIn();
    drifted = true;
  }
  // Only redraw when something moved.
  if (drifted) draw();
  requestAnimationFrame(frame);
}

function endGame() {
  playing = false;
  $('.stack-final').textContent =
    `You cleared ${rings} ${rings === 1 ? 'ring' : 'rings'} and scored ${score.toLocaleString('en-US')}.`;
  over.hidden = false;
  $('.stack-again').focus();
  track('colony-stack/game-over');
}

function start() {
  board = emptyBoard();
  queue = [];
  score = 0;
  rings = 0;
  cells = 0;
  level = 1;
  waited = 0;
  lastFrame = null;
  // Out of the hidden pop-up, so space drops pieces again instead of
  // pressing Play again.
  if (over.contains(document.activeElement)) document.activeElement.blur();
  over.hidden = true;
  playing = true;
  upNext = nextPal();
  spawn(0);
  showStats();
  draw();
  requestAnimationFrame(frame);
}

// What each control does. Each redraws straight away, so it feels quick.
const ACTIONS = {
  left: () => { if (fits(board, moved(piece, 0, -1))) piece = moved(piece, 0, -1); },
  right: () => { if (fits(board, moved(piece, 0, 1))) piece = moved(piece, 0, 1); },
  turn: () => { piece = turned(board, piece); },
  // One ring in, and a point for hurrying.
  in: () => { score += 1; showStats(); driftIn(); waited = 0; },
  // All the way in, two points a ring.
  drop: () => {
    const end = landing(board, piece);
    score += 2 * (piece.ring - end.ring);
    piece = end;
    land();
    waited = 0;
  },
};

function act(name) {
  if (!playing) return;
  ACTIONS[name]();
  draw();
}

for (const name of ['left', 'turn', 'right', 'drop']) {
  $(`.stack-${name}`).addEventListener('click', () => act(name));
}

const KEYS = { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'turn', ArrowDown: 'in', ' ': 'drop' };
window.addEventListener('keydown', (event) => {
  const name = KEYS[event.key];
  if (!name || !playing) return;
  // Space on a focused button presses that button instead.
  if (event.key === ' ' && event.target.closest?.('button')) return;
  // Don't scroll the page.
  event.preventDefault();
  act(name);
});

$('.stack-again').addEventListener('click', start);

start();
track('colony-stack/start');

// All filled in: take the loading card away.
pageReady();
