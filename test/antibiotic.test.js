import { describe, expect, it } from 'vitest';
import { diskSpot, diskSpots, touchedDisk, touchesDisk } from '../public/game/antibiotic.js';
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

  it('is never close enough to the middle to touch a buddy at the start', () => {
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
          // The open space between their edges is wider than a buddy (about 0.14).
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

  it('detects a buddy overlapping the disk', () => {
    expect(touchesDisk(disk, [[100, 0, 5]], dishRadius)).toBe(true);
    expect(touchesDisk(disk, [[125, 0, 10]], dishRadius)).toBe(true); // edges overlap
  });

  it('ignores a buddy that is close but not touching', () => {
    expect(touchesDisk(disk, [[131, 0, 10]], dishRadius)).toBe(false);
    expect(touchesDisk(disk, [[0, 0, 30]], dishRadius)).toBe(false);
  });

  it('counts a touch by any part of a group', () => {
    const chain = [[0, 0, 10], [40, 0, 10], [80, 0, 10]]; // last cell reaches the disk
    expect(touchesDisk(disk, chain, dishRadius)).toBe(true);
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

describe('antibiotic choices', () => {
  it('gives every buddy three different antibiotics, each with a code and a name', () => {
    for (const [buddy, species] of Object.entries(SPECIES)) {
      expect(species.antibiotics, buddy).toHaveLength(3);
      for (const antibiotic of species.antibiotics) {
        expect(antibiotic.code, buddy).toMatch(/^[A-Z]{1,3}$/);
        expect(antibiotic.name, buddy).toBeTruthy();
      }
      const codes = new Set(species.antibiotics.map((a) => a.code));
      expect(codes.size, buddy).toBe(3);
    }
  });
});
