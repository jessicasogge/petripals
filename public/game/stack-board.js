// Colony Stack's rules: a round dish split into rings (0 is the innermost,
// around the food in the middle) and sectors (going clockwise from the top).
// Colony pieces drift in from the rim toward the food, and a ring that's full
// all the way around clears, like a lawn covering the plate edge to edge.
// Plain data and math with no page access, so it can be tested on its own;
// stack.js puts it on the page.
//
// Made up for the game: real colonies spread outward from where they were
// put on the plate, they don't drift in toward food. The shapes are real,
// though (see PIECES).

export const STACK = {
  RINGS: 8,
  SECTORS: 12, // a full ring is three of Scarlett's chains
  START_MS: 900, // how often a piece drifts in one ring, at level 1
  SPEEDUP: 0.85, // each level drifts this much faster
  MIN_MS: 120,
  RINGS_PER_LEVEL: 5, // rings to clear for the next level
  POINTS: [0, 100, 300, 500, 800], // for clearing 0 to 4 rings at once, times the level
};

// The pieces, each a real way that pal's cells stay stuck together after
// dividing. A cell is [out, around]: rings out from the piece's lowest ring,
// and sectors clockwise. The first cell wears her face. `fill` and `line`
// are her body and outline colors from pals.js.
export const PIECES = {
  scarlett: {
    cells: [[0, 0], [0, -1], [0, 1], [0, 2]],
    round: true, fill: '#fca5a5', line: '#b91c1c',
    fact: 'falls as a straight chain: *Streptococcus* divides in one plane, so her cells line up end to end.',
  },
  goldie: {
    cells: [[1, 0], [0, 0], [0, 1], [1, 1]],
    round: true, fill: '#fcd34d', line: '#b45309', turns: false, // a square looks the same turned
    fact: 'comes in a bunch: *Staphylococcus* divides in several planes, so her cells cluster like grapes.',
  },
  ana: {
    cells: [[1, 0], [1, -1], [1, 1], [0, 0]],
    round: false, fill: '#f9a8d4', line: '#be185d',
    fact: 'branches: *bifidus* means "split in two," and bifidobacteria are rods that fork into a Y.',
  },
  nova: {
    cells: [[2, 0], [1, 0], [0, 0], [0, 1]],
    round: false, fill: '#5eead4', line: '#0f766e',
    fact: 'bends: *Nocardia* filaments branch off nearly at right angles.',
  },
  elia: {
    cells: [[1, 0], [1, 1], [0, 0], [0, -1]],
    round: false, fill: '#d8b4fe', line: '#7e22ce',
    fact: 'zigzags: *Borrelia* is a spirochete, shaped like a corkscrew.',
  },
  penny: {
    cells: [[0, 0], [0, 1]],
    round: true, fill: '#a5b4fc', line: '#4f46e5',
    fact: 'comes in pairs: *Streptococcus pneumoniae* is a diplococcus, so her chains stop at two.',
  },
};

const mod = (n, m) => ((n % m) + m) % m;

// A dish with nothing in it: board[ring][sector] is null or { pal, face }.
export function emptyBoard() {
  return Array.from({ length: STACK.RINGS }, () => Array(STACK.SECTORS).fill(null));
}

// A new piece of this pal, at `sector`, as far out as she fits inside the
// rim. `sector` can be any whole number; it wraps around.
export function newPiece(pal, sector = 0) {
  const cells = PIECES[pal].cells;
  const top = Math.max(...cells.map(([out]) => out));
  return { pal, cells, ring: STACK.RINGS - 1 - top, sector };
}

// The dish cells a piece covers: { ring, sector (0 to SECTORS - 1), face }.
export function cellsOf(piece) {
  return piece.cells.map(([out, around], i) => ({
    ring: piece.ring + out,
    sector: mod(piece.sector + around, STACK.SECTORS),
    face: i === 0,
  }));
}

// Whether the piece is inside the dish (between the food and the rim) and
// not on top of anything.
export function fits(board, piece) {
  return cellsOf(piece).every(({ ring, sector }) =>
    ring >= 0 && ring < STACK.RINGS && board[ring][sector] === null);
}

export const moved = (piece, rings, sectors) =>
  ({ ...piece, ring: piece.ring + rings, sector: piece.sector + sectors });

// The piece turned a quarter turn. If that pokes out past the rim, she's
// moved in just enough to fit, and if it bumps into something, she's nudged
// a sector either way. The same piece if there's no room to turn (or she's
// Goldie).
export function turned(board, piece) {
  if (PIECES[piece.pal].turns === false) return piece;
  const spun = { ...piece, cells: piece.cells.map(([out, around]) => [around, -out]) };
  const outermost = Math.max(...cellsOf(spun).map(({ ring }) => ring));
  const inside = moved(spun, Math.min(0, STACK.RINGS - 1 - outermost), 0);
  for (const sectors of [0, 1, -1]) {
    const tried = moved(inside, 0, sectors);
    if (fits(board, tried)) return tried;
  }
  return piece;
}

// Where the piece would stop if it drifted all the way in.
export function landing(board, piece) {
  let at = piece;
  while (fits(board, moved(at, -1, 0))) at = moved(at, -1, 0);
  return at;
}

// The board with the piece stuck in place.
export function settle(board, piece) {
  const next = board.map((ring) => [...ring]);
  for (const { ring, sector, face } of cellsOf(piece)) next[ring][sector] = { pal: piece.pal, face };
  return next;
}

// Take away every full ring. The rings outside it move in to fill the gap,
// and an empty one appears at the rim. `cleared` is which rings were full.
export function clearRings(board) {
  const cleared = [];
  const kept = board.filter((ring, i) => {
    const full = ring.every((cell) => cell !== null);
    if (full) cleared.push(i);
    return !full;
  });
  while (kept.length < STACK.RINGS) kept.push(Array(STACK.SECTORS).fill(null));
  return { board: kept, cleared };
}

export const levelFor = (rings) => 1 + Math.floor(rings / STACK.RINGS_PER_LEVEL);

export const pointsFor = (cleared, level) =>
  STACK.POINTS[Math.min(cleared, STACK.POINTS.length - 1)] * level;

export const driftMs = (level) =>
  Math.max(STACK.MIN_MS, Math.round(STACK.START_MS * STACK.SPEEDUP ** (level - 1)));

// The pieces in a shuffled order, each once, so none is ever missing for long.
export function shuffledPals(random = Math.random) {
  const order = Object.keys(PIECES);
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  return order;
}
