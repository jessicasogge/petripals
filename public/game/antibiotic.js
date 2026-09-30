// The antibiotic disk: a small white paper disk soaked in a drug, like the
// ones used in the lab (the Kirby-Bauer disk test). If the player's buddy
// touches it, the game is over.
import { GAME } from './config.js';

// Pick a random spot for the disk, as fractions of the dish radius from the
// center: away from the middle (where the buddy starts) and from the rim.
export function diskSpot(random = Math.random) {
  const angle = random() * Math.PI * 2;
  const distance = GAME.DISK_MIN_DISTANCE +
    random() * (GAME.DISK_MAX_DISTANCE - GAME.DISK_MIN_DISTANCE);
  return { fx: Math.cos(angle) * distance, fy: Math.sin(angle) * distance, r: GAME.DISK_RADIUS };
}

// Whether any of the given circles overlaps the disk. Circles are
// [x, y, radius] in pixels from the dish center; the disk is in fractions of
// the dish radius, so `dishRadius` converts between the two.
export function touchesDisk(disk, circles, dishRadius) {
  const dx = disk.fx * dishRadius;
  const dy = disk.fy * dishRadius;
  const reach = disk.r * dishRadius;
  return circles.some(([x, y, r]) => Math.hypot(x - dx, y - dy) < reach + r);
}

// Put a disk on the agar and return where it is.
export function placeAntibiotic(antibiotic) {
  const disk = diskSpot();
  const el = document.createElement('div');
  el.className = 'antibiotic';
  el.style.left = `${50 + disk.fx * 50}%`;
  el.style.top = `${50 + disk.fy * 50}%`;
  el.style.width = `${disk.r * 100}%`;
  el.textContent = antibiotic.code;
  el.setAttribute('role', 'img');
  el.setAttribute('aria-label', `Antibiotic disk: ${antibiotic.name}. Don't touch it!`);
  el.title = antibiotic.name;
  document.querySelector('.agar').appendChild(el);
  return { ...disk, el, antibiotic };
}
