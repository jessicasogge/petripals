// @vitest-environment jsdom
// The zone of inhibition: the clear ring around each antibiotic disk.
import { beforeEach, describe, expect, it } from 'vitest';
import { placeAntibiotics, touchedDisk } from '../public/game/antibiotic.js';
import { GAME } from '../public/game/config.js';

beforeEach(() => {
  document.body.innerHTML = '<div class="agar"></div>';
});

describe('drawing the zone', () => {
  it('puts a zone around every disk, centered on it', () => {
    const disks = placeAntibiotics([{ code: 'P', name: 'penicillin' }, { code: 'E', name: 'erythromycin' }]);
    const zones = document.querySelectorAll('.agar .zone');
    expect(zones).toHaveLength(2);
    disks.forEach((disk, i) => {
      expect(disk.zone).toBe(zones[i]);
      expect(disk.zone.style.left).toBe(disk.el.style.left);
      expect(disk.zone.style.top).toBe(disk.el.style.top);
    });
  });

  it('makes the zone wider than its disk by the zone width all the way round', () => {
    const [disk] = placeAntibiotics([{ code: 'P', name: 'penicillin' }]);
    const zoneWidth = parseFloat(disk.zone.style.width);
    const diskWidth = parseFloat(disk.el.style.width);
    expect(zoneWidth - diskWidth).toBeCloseTo(GAME.ZONE_WIDTH * 100);
  });

  it('draws the zone under its disk, so the disk and its label stay on top', () => {
    const [disk] = placeAntibiotics([{ code: 'P', name: 'penicillin' }]);
    expect(disk.zone.compareDocumentPosition(disk.el) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(disk.zone.getAttribute('aria-hidden')).toBe('true');
  });
});

describe('touching the zone', () => {
  const dishRadius = 200;
  const disk = { fx: 0.5, fy: 0, r: GAME.DISK_RADIUS, antibiotic: { code: 'P' } };
  const edgeOfZone = (disk.fx - disk.r - GAME.ZONE_WIDTH) * dishRadius; // px from the dish center
  const margin = GAME.ZONE_WIDTH + GAME.TOUCH_MARGIN; // what the game passes

  it('counts as touching once a cell reaches the zone, before it gets to the disk', () => {
    const cell = [edgeOfZone - 4, 0, 5]; // 1px into the zone, well short of the disk
    expect(touchedDisk([disk], [cell], dishRadius)).toBeNull();
    expect(touchedDisk([disk], [cell], dishRadius, margin)).toBe(disk);
  });

  it("doesn't count a cell that's clear of the zone", () => {
    const cell = [edgeOfZone - 8, 0, 5]; // 3px short of the zone's edge
    expect(touchedDisk([disk], [cell], dishRadius, margin)).toBeNull();
  });
});
