// Colony Stack's rules: pieces drift in toward the food in the middle of a
// round dish, and full rings clear.
import { describe, expect, it } from 'vitest';
import { SPECIES } from '../public/game/config.js';
import { palById } from '../public/game/pals.js';
import {
  PIECES, STACK, cellsOf, clearRings, driftMs, emptyBoard, fits, landing, levelFor,
  moved, newPiece, pointsFor, settle, shuffledPals, turned,
} from '../public/game/stack-board.js';

// A board with these [ring, sector] spots taken.
function boardWith(spots, pal = 'goldie') {
  const board = emptyBoard();
  for (const [ring, sector] of spots) board[ring][sector] = { pal, face: false };
  return board;
}

const fullRing = (ring) => Array.from({ length: STACK.SECTORS }, (_, sector) => [ring, sector]);
const spots = (piece) => cellsOf(piece).map(({ ring, sector }) => [ring, sector]);

describe('the pieces', () => {
  it('are all real pals, with a fact about their shape', () => {
    for (const [id, piece] of Object.entries(PIECES)) {
      expect(palById(id), id).toBeDefined();
      expect(piece.fact.length).toBeGreaterThan(20);
    }
  });

  it('are round for cocci and not for rods', () => {
    for (const [id, piece] of Object.entries(PIECES)) {
      expect(piece.round, id).toBe(SPECIES[id].kind === 'coccus');
    }
  });

  it('have no two cells in the same spot', () => {
    for (const piece of Object.values(PIECES)) {
      expect(new Set(piece.cells.map(String)).size).toBe(piece.cells.length);
    }
  });
});

describe('newPiece', () => {
  it('starts as far out as she fits, inside the rim', () => {
    for (const pal of Object.keys(PIECES)) {
      const rings = cellsOf(newPiece(pal)).map(({ ring }) => ring);
      expect(Math.max(...rings), pal).toBe(STACK.RINGS - 1);
      expect(fits(emptyBoard(), newPiece(pal))).toBe(true);
    }
  });

  it('wraps around the dish', () => {
    expect(spots(newPiece('penny', -1))).toEqual([[STACK.RINGS - 1, STACK.SECTORS - 1], [STACK.RINGS - 1, 0]]);
    expect(spots(newPiece('penny', STACK.SECTORS))).toEqual(spots(newPiece('penny', 0)));
  });

  it('puts her face on the first cell', () => {
    expect(cellsOf(newPiece('scarlett')).map(({ face }) => face)).toEqual([true, false, false, false]);
  });
});

describe('fits', () => {
  it("doesn't go into the food or past the rim", () => {
    expect(fits(emptyBoard(), { ...newPiece('penny'), ring: -1 })).toBe(false);
    expect(fits(emptyBoard(), { ...newPiece('penny'), ring: STACK.RINGS })).toBe(false);
  });

  it("doesn't go on top of another cell", () => {
    const piece = newPiece('penny', 3);
    expect(fits(boardWith([[STACK.RINGS - 1, 4]]), piece)).toBe(false);
    expect(fits(boardWith([[STACK.RINGS - 1, 5]]), piece)).toBe(true);
  });
});

describe('turned', () => {
  it('turns a quarter turn', () => {
    const piece = moved(newPiece('scarlett', 5), -3, 0);
    const spun = turned(emptyBoard(), piece);
    // (+ 0 so -0, from turning 0, reads as 0.)
    expect(spun.cells.map(([out, around]) => [out, around + 0])).toEqual([[0, 0], [-1, 0], [1, 0], [2, 0]]);
    expect(spun.ring).toBe(piece.ring);
  });

  it("leaves Goldie's square as it is", () => {
    const piece = moved(newPiece('goldie'), -3, 0);
    expect(turned(emptyBoard(), piece)).toBe(piece);
  });

  it('moves her in when turning would poke out past the rim', () => {
    const spun = turned(emptyBoard(), newPiece('scarlett'));
    expect(Math.max(...cellsOf(spun).map(({ ring }) => ring))).toBe(STACK.RINGS - 1);
    expect(fits(emptyBoard(), spun)).toBe(true);
  });

  it('nudges her a sector over if turning in place would bump something', () => {
    const piece = moved(newPiece('scarlett', 5), -3, 0);
    // Turned in place she'd stand in sector 5; something is in the way there.
    const blocked = boardWith([[piece.ring + 2, 5]]);
    expect(turned(blocked, piece).sector).toBe(6);
    // And the other way, if sector 6 is taken too.
    expect(turned(boardWith([[piece.ring + 2, 5], [piece.ring, 6]]), piece).sector).toBe(4);
  });

  it("doesn't turn when there's no room at all", () => {
    const piece = moved(newPiece('scarlett', 5), -3, 0);
    const crowded = boardWith(emptyBoard().flatMap((ring, r) =>
      ring.map((_, s) => [r, s])).filter(([r]) => r !== piece.ring));
    expect(turned(crowded, piece)).toBe(piece);
  });
});

describe('landing', () => {
  it('drifts all the way in to the food on an empty dish', () => {
    expect(landing(emptyBoard(), newPiece('penny')).ring).toBe(0);
  });

  it('stops on top of what is already there', () => {
    expect(landing(boardWith([[2, 0]]), newPiece('penny')).ring).toBe(3);
  });
});

describe('settle', () => {
  it('sticks the piece to the board, without changing the old board', () => {
    const board = emptyBoard();
    const piece = landing(board, newPiece('penny', 2));
    const next = settle(board, piece);
    expect(next[0][2]).toEqual({ pal: 'penny', face: true });
    expect(next[0][3]).toEqual({ pal: 'penny', face: false });
    expect(board[0][2]).toBe(null);
  });
});

describe('clearRings', () => {
  it('leaves a board with no full ring alone', () => {
    const board = boardWith([[0, 0]]);
    expect(clearRings(board)).toEqual({ board, cleared: [] });
  });

  it('takes away full rings and moves the outer ones in', () => {
    const board = boardWith([...fullRing(0), ...fullRing(2), [1, 5], [3, 7]]);
    const { board: next, cleared } = clearRings(board);
    expect(cleared).toEqual([0, 2]);
    expect(next).toHaveLength(STACK.RINGS);
    expect(next[0][5]).not.toBe(null);
    expect(next[1][7]).not.toBe(null);
    expect(next[STACK.RINGS - 1].every((cell) => cell === null)).toBe(true);
  });
});

describe('scoring and speed', () => {
  it('goes up a level every few rings', () => {
    expect(levelFor(0)).toBe(1);
    expect(levelFor(STACK.RINGS_PER_LEVEL - 1)).toBe(1);
    expect(levelFor(STACK.RINGS_PER_LEVEL)).toBe(2);
  });

  it('scores more for more rings at once, and more at higher levels', () => {
    expect(pointsFor(0, 1)).toBe(0);
    expect(pointsFor(1, 1)).toBe(100);
    expect(pointsFor(2, 3)).toBe(900);
    expect(pointsFor(9, 1)).toBe(800);
  });

  it('drifts faster each level, down to a limit', () => {
    expect(driftMs(1)).toBe(STACK.START_MS);
    expect(driftMs(2)).toBeLessThan(driftMs(1));
    expect(driftMs(100)).toBe(STACK.MIN_MS);
  });
});

describe('shuffledPals', () => {
  it('has every pal once', () => {
    expect([...shuffledPals()].sort()).toEqual(Object.keys(PIECES).sort());
  });

  it('shuffles', () => {
    expect(shuffledPals(() => 0)).not.toEqual(shuffledPals(() => 0.99));
  });
});
