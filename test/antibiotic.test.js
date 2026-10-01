import { describe, expect, it } from 'vitest';
import { antibioticsFor, diskSpot, diskSpots, pushOffDisks, touchedDisk, touchesDisk, zoneWidth } from '../public/game/antibiotic.js';
import { GAME, LEVELS, SPECIES } from '../public/game/config.js';

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
          // The open space between their edges is wider than a pal (about 0.12).
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

  it('counts edges within the margin as touching', () => {
    // Disk A's edge is at x = 80. A circle of radius 5 at x = 73 is 2px short.
    expect(touchedDisk(disks, [[73, 0, 5]], dishRadius)).toBeNull();
    expect(touchedDisk(disks, [[73, 0, 5]], dishRadius, 0.012).antibiotic.code).toBe('A');
    // But not ones farther away than the margin.
    expect(touchedDisk(disks, [[70, 0, 5]], dishRadius, 0.012)).toBeNull();
  });

  it('uses a game margin about the width of the outlines', () => {
    expect(GAME.TOUCH_MARGIN).toBeGreaterThan(0);
    expect(GAME.TOUCH_MARGIN).toBeLessThan(0.02);
    // Even the smallest zone is much wider than this.
    expect(GAME.ZONE_MIN_WIDTH).toBeGreaterThan(GAME.TOUCH_MARGIN * 3);
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

  // A chain of cells curved around a disk, hugging it, each `inside` px too
  // close. Like the ones that used to shake back and forth forever.
  function curvedChain(clear, inside) {
    const cells = [];
    for (let i = -3; i <= 3; i++) {
      const a = Math.PI / 2 + i * 0.45;
      cells.push([Math.cos(a) * (clear + 7 - inside), Math.sin(a) * (clear + 7 - inside), 7]);
    }
    return cells;
  }

  it('pushes a chain curved around a disk clear in one go, without shaking', () => {
    const dishRadius = 300;
    const disk = { fx: 0, fy: 0, r: 0.1 };
    const buffer = 0.035;
    const clear = (disk.r + buffer) * dishRadius;
    let cells = curvedChain(clear, 1);
    const moves = [];
    for (let frame = 0; frame < 10; frame++) {
      const [dx, dy] = pushOffDisks([disk], cells, dishRadius, buffer);
      moves.push([dx, dy]);
      cells = cells.map(([x, y, r]) => [x + dx, y + dy, r]);
    }
    // The first push clears it, and after that it stays put.
    expect(Math.hypot(...moves[0])).toBeGreaterThan(0);
    for (const [dx, dy] of moves.slice(1)) expect(Math.hypot(dx, dy)).toBeLessThan(1e-9);
    // It moved straight away from the disk (down, toward the chain's middle).
    expect(Math.abs(moves[0][0])).toBeLessThan(1e-9);
    expect(moves[0][1]).toBeGreaterThan(0);
    // And every cell really is clear.
    for (const [x, y, r] of cells) expect(Math.hypot(x, y)).toBeGreaterThanOrEqual(clear + r - 1e-9);
  });

});

describe('zone of inhibition', () => {
  it('turns a zone in mm into a width that grows with the zone', () => {
    expect(zoneWidth(GAME.ZONE_MM_SMALL)).toBeCloseTo(GAME.ZONE_MIN_WIDTH);
    expect(zoneWidth(GAME.ZONE_MM_BIG)).toBeCloseTo(GAME.ZONE_MAX_WIDTH);
    expect(zoneWidth(30)).toBeGreaterThan(zoneWidth(20));
    // Beyond the range it stays at the smallest or biggest width.
    expect(zoneWidth(6)).toBeCloseTo(GAME.ZONE_MIN_WIDTH);
    expect(zoneWidth(50)).toBeCloseTo(GAME.ZONE_MAX_WIDTH);
  });

  it('gives a drug with no zone size no zone, so its disk still gets placed', () => {
    expect(zoneWidth(undefined)).toBe(0);
    expect(diskSpots([zoneWidth(undefined), zoneWidth(undefined)])).toHaveLength(2);
  });

  it('gives every antibiotic a zone in a believable range, different across each pal\'s drugs', () => {
    for (const [pal, species] of Object.entries(SPECIES)) {
      for (const { code, zone } of species.antibiotics) {
        expect(zone, `${pal} ${code}`).toBeGreaterThanOrEqual(12);
        expect(zone, `${pal} ${code}`).toBeLessThanOrEqual(40);
      }
      const sizes = species.antibiotics.map((a) => a.zone);
      expect(Math.max(...sizes) - Math.min(...sizes), pal).toBeGreaterThanOrEqual(10);
    }
  });

  it('gives the same drug different zones on different pals', () => {
    // Ciprofloxacin, ceftriaxone, azithromycin and others show up for more than one pal.
    const byDrug = {};
    for (const species of Object.values(SPECIES)) {
      for (const { code, zone } of species.antibiotics) (byDrug[code] ??= new Set()).add(zone);
    }
    for (const code of ['CIP', 'CRO', 'AZM', 'VA', 'DO', 'SXT', 'CC']) {
      expect(byDrug[code].size, code).toBeGreaterThan(1);
    }
  });

  it('leaves room to swim between the two biggest zones, wider than a rod pal is tall', () => {
    const [a, b] = diskSpots([GAME.ZONE_MAX_WIDTH, GAME.ZONE_MAX_WIDTH]);
    const between = Math.hypot(a.fx - b.fx, a.fy - b.fy) - 2 * (GAME.DISK_RADIUS + GAME.ZONE_MAX_WIDTH);
    expect(between).toBeGreaterThanOrEqual(GAME.SWIM_ROOM - 1e-9);
    expect(GAME.SWIM_ROOM).toBeGreaterThan(0.1);
  });

  it('always fits seven disks with each pal\'s zones, with swimming room between every pair', () => {
    for (const species of Object.values(SPECIES)) {
      const zones = antibioticsFor(species.antibiotics, 7).map((a) => zoneWidth(a.zone));
      for (let dish = 0; dish < 30; dish++) {
        const disks = diskSpots(zones);
        expect(disks).toHaveLength(7);
        for (let i = 0; i < disks.length; i++) {
          expect(disks[i].zone).toBe(zones[i]);
          for (let j = i + 1; j < disks.length; j++) {
            const a = disks[i];
            const b = disks[j];
            const between = Math.hypot(a.fx - b.fx, a.fy - b.fy) - (a.r + a.zone + b.r + b.zone);
            expect(between).toBeGreaterThanOrEqual(GAME.SWIM_ROOM - 1e-9);
          }
        }
      }
    }
  });

  it('never reaches the middle, where the pal starts', () => {
    // A rod pal reaches about 0.12 of the dish radius from its center.
    expect(GAME.DISK_MIN_DISTANCE - GAME.DISK_RADIUS - GAME.ZONE_MAX_WIDTH).toBeGreaterThan(0.2);
  });

  it('counts touching a zone as touching its disk', () => {
    const disk = { fx: 0.5, fy: 0, r: 0.1, zone: 0.05 };
    // The zone's edge is at 0.35 of the dish radius = 70px.
    expect(touchesDisk(disk, [[64, 0, 5]], 200)).toBe(false);
    expect(touchesDisk(disk, [[66, 0, 5]], 200)).toBe(true);
    // pushOffDisks moves a body clear of the whole zone.
    const [dx] = pushOffDisks([disk], [[66, 0, 5]], 200);
    expect(66 + dx).toBeCloseTo(65);
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
  it('gives every pal five different antibiotics, each with a code and a name', () => {
    for (const [pal, species] of Object.entries(SPECIES)) {
      expect(species.antibiotics, pal).toHaveLength(5);
      for (const antibiotic of species.antibiotics) {
        expect(antibiotic.code, pal).toMatch(/^[A-Z]{1,3}$/);
        expect(antibiotic.name, pal).toBeTruthy();
      }
      const codes = new Set(species.antibiotics.map((a) => a.code));
      expect(codes.size, pal).toBe(5);
    }
  });

  it('uses the list in order, starting over when a level has more disks than drugs', () => {
    const list = ['A', 'B', 'C', 'D', 'E'];
    expect(antibioticsFor(list, 1)).toEqual(['A']);
    expect(antibioticsFor(list, 5)).toEqual(list);
    expect(antibioticsFor(list, 7)).toEqual(['A', 'B', 'C', 'D', 'E', 'A', 'B']);
  });
});

describe('levels', () => {
  it('adds one disk and doubles the colony each level, from 1 disk and 4 cells to 7 and 256', () => {
    expect(LEVELS).toEqual([
      { disks: 1, target: 4 },
      { disks: 2, target: 8 },
      { disks: 3, target: 16 },
      { disks: 4, target: 32 },
      { disks: 5, target: 64 },
      { disks: 6, target: 128 },
      { disks: 7, target: 256 },
    ]);
  });

  it('always finds room for every disk the level needs, spread apart', () => {
    for (const { disks: count } of LEVELS) {
      for (let dish = 0; dish < 200; dish++) {
        const disks = diskSpots(count);
        expect(disks).toHaveLength(count);
        for (let i = 0; i < disks.length; i++) {
          for (let j = i + 1; j < disks.length; j++) {
            const gap = Math.hypot(disks[i].fx - disks[j].fx, disks[i].fy - disks[j].fy);
            expect(gap).toBeGreaterThanOrEqual(GAME.DISK_MIN_GAP);
          }
        }
      }
    }
  });
});
