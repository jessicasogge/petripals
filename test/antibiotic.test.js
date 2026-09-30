import { describe, expect, it } from 'vitest';
import { diskSpot, diskSpots, pushOffDisks, touchedDisk, touchesDisk } from '../public/game/antibiotic.js';
import { GAME, SPECIES } from '../public/game/config.js';

describe('diskSpot', () => {
  it('keeps the disk off the starting spot and away from the rim', () => {
    for (let i = 0; i < 200; i++) {
      const disk = diskSpot();
      const distance = Math.hypot(disk.fx, disk.fy);
      expect(distance).toBeGreaterThanOrEqual(GAME.DISK_MIN_DISTANCE - 1e-9);
      expect(distance).toBeLessThanOrEqual(GAME.DISK_MAX_DISTANCE + 1e-9);
      expect(distance + disk.r).toBeLessThan(1); // the whole disk fits in the dish
    }
  });

  it('is never close enough to the middle to touch a pal at the start', () => {
    expect(GAME.DISK_MIN_DISTANCE - GAME.DISK_RADIUS).toBeGreaterThan(0.25);
  });

  it('can land anywhere around the dish', () => {
    // With fixed "random" numbers, the angle follows the first one.
    const right = diskSpot(() => 0);
    const left = diskSpot(() => 0.5);
    expect(right.fx).toBeGreaterThan(0);
    expect(left.fx).toBeLessThan(0);
  });
});

describe('diskSpots', () => {
  it('places three disks on every plate', () => {
    for (let i = 0; i < 200; i++) expect(diskSpots(3)).toHaveLength(3);
  });

  it('spreads the disks apart so there is room to swim between them', () => {
    for (let i = 0; i < 200; i++) {
      const disks = diskSpots(3);
      for (let a = 0; a < disks.length; a++) {
        for (let b = a + 1; b < disks.length; b++) {
          const gap = Math.hypot(disks[a].fx - disks[b].fx, disks[a].fy - disks[b].fy);
          expect(gap).toBeGreaterThanOrEqual(GAME.DISK_MIN_GAP);
          // The open space between their edges is wider than a pal (about 0.14).
          expect(gap - 2 * GAME.DISK_RADIUS).toBeGreaterThan(0.2);
        }
      }
    }
  });

  it('keeps every disk off the starting spot and away from the rim', () => {
    for (let i = 0; i < 200; i++) {
      for (const disk of diskSpots(3)) {
        const distance = Math.hypot(disk.fx, disk.fy);
        expect(distance).toBeGreaterThanOrEqual(GAME.DISK_MIN_DISTANCE - 1e-9);
        expect(distance).toBeLessThanOrEqual(GAME.DISK_MAX_DISTANCE + 1e-9);
      }
    }
  });
});

describe('touchesDisk', () => {
  const dishRadius = 200;
  const disk = { fx: 0.5, fy: 0, r: 0.1 }; // center at (100, 0), radius 20px

  it('detects a pal overlapping the disk', () => {
    expect(touchesDisk(disk, [[100, 0, 5]], dishRadius)).toBe(true);
    expect(touchesDisk(disk, [[125, 0, 10]], dishRadius)).toBe(true); // edges overlap
  });

  it('ignores a pal that is close but not touching', () => {
    expect(touchesDisk(disk, [[131, 0, 10]], dishRadius)).toBe(false);
    expect(touchesDisk(disk, [[0, 0, 30]], dishRadius)).toBe(false);
  });

  it('counts a touch by any part of a group', () => {
    const chain = [[0, 0, 10], [40, 0, 10], [80, 0, 10]]; // last cell reaches the disk
    expect(touchesDisk(disk, chain, dishRadius)).toBe(true);
  });

  it('counts coming within the buffer as touching when given one', () => {
    expect(touchesDisk(disk, [[133, 0, 10]], dishRadius)).toBe(false);
    expect(touchesDisk(disk, [[133, 0, 10]], dishRadius, 0.025)).toBe(true);
  });

  it('treats an empty body as not touching', () => {
    expect(touchesDisk(disk, [], dishRadius)).toBe(false);
  });
});

describe('touchedDisk', () => {
  const dishRadius = 200;
  const disks = [
    { fx: 0.5, fy: 0, r: 0.1, antibiotic: { code: 'A' } },
    { fx: -0.5, fy: 0, r: 0.1, antibiotic: { code: 'B' } },
  ];

  it('tells which disk was touched', () => {
    expect(touchedDisk(disks, [[-100, 0, 5]], dishRadius).antibiotic.code).toBe('B');
    expect(touchedDisk(disks, [[100, 0, 5]], dishRadius).antibiotic.code).toBe('A');
  });

  it('returns null when no disk is touched', () => {
    expect(touchedDisk(disks, [[0, 0, 5]], dishRadius)).toBeNull();
  });
});

describe('pushOffDisks', () => {
  const dishRadius = 200;
  const disk = { fx: 0.5, fy: 0, r: 0.1 }; // center at (100, 0), radius 20px

  it('leaves a body that is already clear where it is', () => {
    expect(pushOffDisks([disk], [[0, 0, 10]], dishRadius)).toEqual([0, 0]);
  });

  it('pushes an overlapping body straight out until it just touches', () => {
    const [dx, dy] = pushOffDisks([disk], [[125, 0, 10]], dishRadius); // 5px overlap
    expect(dx).toBeCloseTo(5);
    expect(dy).toBeCloseTo(0);
  });

  it('pushes out in whatever direction the body came from', () => {
    const [dx, dy] = pushOffDisks([disk], [[100, 25, 10]], dishRadius);
    expect(dx).toBeCloseTo(0);
    expect(dy).toBeCloseTo(5);
  });

  it('moves the whole body by its deepest overlap', () => {
    // A chain whose last two cells both overlap; the deeper one decides.
    const chain = [[60, 0, 10], [80, 0, 10], [95, 0, 10]];
    const [dx, dy] = pushOffDisks([disk], chain, dishRadius);
    const moved = chain.map(([x, y, r]) => [x + dx, y + dy, r]);
    expect(touchesDisk(disk, moved, dishRadius + 1e-6)).toBe(false);
    expect(dy).toBeCloseTo(0);
  });

  it('still picks a direction for a body right on the disk center', () => {
    const [dx, dy] = pushOffDisks([disk], [[100, 0, 10]], dishRadius);
    expect(Math.hypot(dx, dy)).toBeCloseTo(30);
  });

  it('keeps extra clear space around the disk when given a buffer', () => {
    // 5px of clear space (buffer 0.025 of a 200px radius), from the edge that
    // was already just touching.
    const [dx] = pushOffDisks([disk], [[130, 0, 10]], dishRadius, 0.025);
    expect(dx).toBeCloseTo(5);
  });

  it('clears every disk, not just one', () => {
    const disks = [disk, { fx: -0.5, fy: 0, r: 0.1 }];
    const bodies = [[[110, 0, 10]], [[-110, 0, 10]]];
    for (const body of bodies) {
      const [dx, dy] = pushOffDisks(disks, body, dishRadius);
      const moved = body.map(([x, y, r]) => [x + dx, y + dy, r - 1e-6]);
      expect(touchedDisk(disks, moved, dishRadius)).toBeNull();
    }
  });
});

describe('disk buffer', () => {
  it('leaves a visible gap without blocking the space between disks', () => {
    expect(GAME.DISK_BUFFER).toBeGreaterThan(0);
    // Even with the buffer on both disks, there's still room to swim between.
    expect(GAME.DISK_MIN_GAP - 2 * (GAME.DISK_RADIUS + GAME.DISK_BUFFER)).toBeGreaterThan(0.15);
  });
});

describe('touch shapes', () => {
  it('gives every rod-style pal a traced outline for touching disks', () => {
    for (const [pal, species] of Object.entries(SPECIES)) {
      if (species.kind !== 'rod') continue;
      expect(species.body?.length, pal).toBeGreaterThan(0);
      for (const [fx, fy, fr] of species.body) {
        // Every circle fits inside the drawing.
        expect(Math.abs(fx) + fr, pal).toBeLessThanOrEqual(0.5 + 1e-9);
        expect(Math.abs(fy) + fr, pal).toBeLessThanOrEqual(0.5 + 1e-9);
        expect(fr, pal).toBeGreaterThan(0);
      }
    }
  });
});

describe('antibiotic choices', () => {
  it('gives every pal three different antibiotics, each with a code and a name', () => {
    for (const [pal, species] of Object.entries(SPECIES)) {
      expect(species.antibiotics, pal).toHaveLength(3);
      for (const antibiotic of species.antibiotics) {
        expect(antibiotic.code, pal).toMatch(/^[A-Z]{1,3}$/);
        expect(antibiotic.name, pal).toBeTruthy();
      }
      const codes = new Set(species.antibiotics.map((a) => a.code));
      expect(codes.size, pal).toBe(3);
    }
  });
});
