// @vitest-environment jsdom
// The zone of inhibition: the clear ring around each antibiotic disk.
import { beforeEach, describe, expect, it } from 'vitest';
import { placeAntibiotics, spreadZones, touchedDisk, zoneAt, zoneWidth } from '../public/game/antibiotic.js';
import { GAME } from '../public/game/config.js';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

beforeEach(() => {
  document.body.innerHTML = '<div class="agar"></div>';
});

describe('drawing the zone', () => {
  it('puts a zone around every disk, centered on it', () => {
    const disks = placeAntibiotics([{ code: 'P', name: 'penicillin', zone: 30 }, { code: 'E', name: 'erythromycin', zone: 27 }]);
    const zones = document.querySelectorAll('.agar .zone');
    expect(zones).toHaveLength(2);
    disks.forEach((disk, i) => {
      expect(disk.zoneEl).toBe(zones[i]);
      expect(disk.zoneEl.style.left).toBe(disk.el.style.left);
      expect(disk.zoneEl.style.top).toBe(disk.el.style.top);
    });
  });

  it("sizes each zone from its drug's zone in mm: a bigger zone for a drug that works better", () => {
    const [big, small] = placeAntibiotics([{ code: 'CRO', name: 'ceftriaxone', zone: 36 }, { code: 'AZM', name: 'azithromycin', zone: 17 }]);
    for (const [disk, mm] of [[big, 36], [small, 17]]) {
      expect(disk.zoneEl).toBeTruthy();
      const drawn = parseFloat(disk.zoneEl.style.width) - parseFloat(disk.el.style.width);
      expect(drawn).toBeCloseTo(zoneWidth(mm) * 100);
    }
    expect(parseFloat(big.zoneEl.style.width)).toBeGreaterThan(parseFloat(small.zoneEl.style.width));
  });

  it('draws the zone under its disk, so the disk and its label stay on top', () => {
    const [disk] = placeAntibiotics([{ code: 'P', name: 'penicillin', zone: 30 }]);
    expect(disk.zoneEl.compareDocumentPosition(disk.el) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(disk.zoneEl.getAttribute('aria-hidden')).toBe('true');
  });
});

describe('touching the zone', () => {
  const dishRadius = 200;
  const disk = { fx: 0.5, fy: 0, r: GAME.DISK_RADIUS, zone: zoneWidth(30), antibiotic: { code: 'P' } };
  const edgeOfZone = (disk.fx - disk.r - disk.zone) * dishRadius; // px from the dish center

  it('counts as touching once a cell reaches the zone, before it gets to the disk', () => {
    const cell = [edgeOfZone - 4, 0, 5]; // 1px into the zone, well short of the disk
    expect(touchedDisk([{ ...disk, zone: 0 }], [cell], dishRadius)).toBeNull();
    expect(touchedDisk([disk], [cell], dishRadius)).toBe(disk);
  });

  it('counts the slightest touch of the edge', () => {
    const cell = [edgeOfZone - 4.9, 0, 5]; // a tenth of a pixel over the edge
    expect(touchedDisk([disk], [cell], dishRadius)).toBe(disk);
  });

  it("doesn't count a cell that's even a pixel short of the zone, with no extra margin", () => {
    // The game used to count coming within an extra margin as touching, so it
    // could end with a gap still showing.
    const cell = [edgeOfZone - 6, 0, 5]; // 1px short of the zone's edge
    expect(touchedDisk([disk], [cell], dishRadius)).toBeNull();
  });
});

describe('when the pal dies', () => {
  // Read the stylesheet from the project folder (jsdom changes import.meta.url).
  const css = readFileSync(resolve(process.cwd(), 'public/styles.css'), 'utf8');
  const rule = css.match(/\.pal-mover\.killed \.dish-pal \{([^}]*)\}/)[1];

  it('freezes her mid-wiggle, so she stays exactly where she touched the zone', () => {
    // Turning the animation off instead snaps her back to her resting pose,
    // up to 10px away, so she looked like she never touched it.
    expect(rule).toMatch(/animation-play-state:\s*paused/);
    expect(rule).not.toMatch(/animation:\s*none/);
  });
});

describe('spreading zones', () => {
  it('starts each zone small and widens it to full size as the drug soaks in', () => {
    expect(zoneAt(0.06, 0)).toBeCloseTo(0.06 * GAME.ZONE_START);
    expect(zoneAt(0.06, GAME.ZONE_SPREAD_SECONDS)).toBeCloseTo(0.06);
    expect(zoneAt(0.06, GAME.ZONE_SPREAD_SECONDS / 2)).toBeGreaterThan(zoneAt(0.06, GAME.ZONE_SPREAD_SECONDS / 4));
  });

  it('spreads quickly at first and then slows down, like diffusion', () => {
    const quarter = GAME.ZONE_SPREAD_SECONDS / 4;
    const firstQuarter = zoneAt(0.06, quarter) - zoneAt(0.06, 0);
    const lastQuarter = zoneAt(0.06, GAME.ZONE_SPREAD_SECONDS) - zoneAt(0.06, 3 * quarter);
    expect(firstQuarter).toBeGreaterThan(lastQuarter);
  });

  it('stops at full size, and never shrinks below the start', () => {
    expect(zoneAt(0.06, GAME.ZONE_SPREAD_SECONDS * 10)).toBeCloseTo(0.06);
    expect(zoneAt(0.06, -5)).toBeCloseTo(0.06 * GAME.ZONE_START);
  });

  it('keeps no zone for a drug the pal is resistant to', () => {
    expect(zoneAt(0, 0)).toBe(0);
    expect(zoneAt(0, GAME.ZONE_SPREAD_SECONDS)).toBe(0);
  });

  it("remembers each disk's full zone, so it knows how far to spread", () => {
    const [disk] = placeAntibiotics([{ code: 'P', name: 'penicillin', zone: 30 }]);
    expect(disk.fullZone).toBeCloseTo(zoneWidth(30));
  });

  it('widens both what counts as touching and the drawn ring', () => {
    const [disk] = placeAntibiotics([{ code: 'P', name: 'penicillin', zone: 30 }]);
    spreadZones([disk], 0);
    expect(disk.zone).toBeCloseTo(disk.fullZone * GAME.ZONE_START);
    expect(parseFloat(disk.zoneEl.style.width)).toBeCloseTo((disk.r + disk.zone) * 100);
    const startWidth = parseFloat(disk.zoneEl.style.width);
    spreadZones([disk], GAME.ZONE_SPREAD_SECONDS);
    expect(disk.zone).toBeCloseTo(disk.fullZone);
    expect(parseFloat(disk.zoneEl.style.width)).toBeGreaterThan(startWidth);
  });

  it('lets the pal swim closer at first than once the zone has spread', () => {
    const disk = { fx: 0, fy: 0, r: 0.1, fullZone: 0.06, zone: 0.06 };
    const dishRadius = 100;
    // A cell just outside where the zone starts, inside where it ends up.
    const edge = (disk.r + 0.06 * GAME.ZONE_START) * dishRadius + 2;
    const cell = [[edge + 1, 0, 1]];
    spreadZones([disk], 0);
    expect(touchedDisk([disk], cell, dishRadius)).toBeNull();
    spreadZones([disk], GAME.ZONE_SPREAD_SECONDS);
    expect(touchedDisk([disk], cell, dishRadius)).toBe(disk);
  });

  it("leaves disks that weren't set up to spread alone", () => {
    const disk = { fx: 0, fy: 0, r: 0.1, zone: 0.05 };
    spreadZones([disk], 0);
    expect(disk.zone).toBe(0.05);
  });
});
