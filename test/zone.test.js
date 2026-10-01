// @vitest-environment jsdom
// The zone of inhibition: the clear ring around each antibiotic disk.
import { beforeEach, describe, expect, it } from 'vitest';
import { placeAntibiotics, touchedDisk, zoneWidth } from '../public/game/antibiotic.js';
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
