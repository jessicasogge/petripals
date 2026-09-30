// The antibiotic disks: small white paper disks soaked in drugs, like the ones
// used in the lab (the Kirby-Bauer disk test). If the player's pal touches
// one, the game is over.
import { GAME } from './config.js';

// Pick a random spot for one disk, as fractions of the dish radius from the
// center: away from the middle (where the pal starts) and from the rim.
export function diskSpot(random = Math.random) {
  const angle = random() * Math.PI * 2;
  const distance = GAME.DISK_MIN_DISTANCE +
    random() * (GAME.DISK_MAX_DISTANCE - GAME.DISK_MIN_DISTANCE);
  return { fx: Math.cos(angle) * distance, fy: Math.sin(angle) * distance, r: GAME.DISK_RADIUS };
}

// Pick spots for `count` disks, spread apart from each other so there's
// always room to swim between them.
export function diskSpots(count, random = Math.random) {
  const disks = [];
  for (let tries = 0; disks.length < count && tries < 500; tries++) {
    const spot = diskSpot(random);
    if (disks.every((d) => Math.hypot(d.fx - spot.fx, d.fy - spot.fy) >= GAME.DISK_MIN_GAP)) {
      disks.push(spot);
    }
  }
  return disks;
}

// Whether any of the given circles overlaps the disk. Circles are
// [x, y, radius] in pixels from the dish center; the disk is in fractions of
// the dish radius, so `dishRadius` converts between the two. `buffer` (also a
// fraction of the dish radius) counts coming within that much as touching.
export function touchesDisk(disk, circles, dishRadius, buffer = 0) {
  const dx = disk.fx * dishRadius;
  const dy = disk.fy * dishRadius;
  const reach = (disk.r + buffer) * dishRadius;
  return circles.some(([x, y, r]) => Math.hypot(x - dx, y - dy) < reach + r);
}

// How far to move a body (circles as above) so it no longer overlaps any
// disk, as [dx, dy] in pixels. [0, 0] if it's already clear. Each disk pushes
// the body straight out from its center, by the deepest overlap. `buffer`
// keeps that much extra clear space around each disk.
export function pushOffDisks(disks, circles, dishRadius, buffer = 0) {
  let moveX = 0;
  let moveY = 0;
  for (const disk of disks) {
    const cx = disk.fx * dishRadius;
    const cy = disk.fy * dishRadius;
    const reach = (disk.r + buffer) * dishRadius;
    let deepest = null;
    for (const [x, y, r] of circles) {
      const px = x + moveX;
      const py = y + moveY;
      const distance = Math.hypot(px - cx, py - cy);
      const overlap = reach + r - distance;
      if (overlap > 0 && (!deepest || overlap > deepest.overlap)) {
        // Straight out from the disk's center; pick a direction if dead center.
        const nx = distance > 0 ? (px - cx) / distance : 1;
        const ny = distance > 0 ? (py - cy) / distance : 0;
        deepest = { overlap, nx, ny };
      }
    }
    if (deepest) {
      moveX += deepest.nx * deepest.overlap;
      moveY += deepest.ny * deepest.overlap;
    }
  }
  return [moveX, moveY];
}

// The first disk the circles touch, or null if they touch none.
export function touchedDisk(disks, circles, dishRadius) {
  return disks.find((disk) => touchesDisk(disk, circles, dishRadius)) || null;
}

// Put one disk per antibiotic on the agar and return where they are.
export function placeAntibiotics(antibiotics) {
  const agar = document.querySelector('.agar');
  return diskSpots(antibiotics.length).map((spot, i) => {
    const antibiotic = antibiotics[i];
    const el = document.createElement('div');
    el.className = 'antibiotic';
    el.style.left = `${50 + spot.fx * 50}%`;
    el.style.top = `${50 + spot.fy * 50}%`;
    el.style.width = `${spot.r * 100}%`;
    el.textContent = antibiotic.code;
    el.setAttribute('role', 'img');
    el.setAttribute('aria-label', `Antibiotic disk: ${antibiotic.name}. Don't touch it!`);
    el.title = antibiotic.name;
    agar.appendChild(el);
    return { ...spot, el, antibiotic };
  });
}
