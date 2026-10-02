// The antibiotic disks: small white paper disks soaked in drugs, like the ones
// used in the lab (the Kirby-Bauer disk test). Each has a zone of inhibition
// around it, sized by how well that drug works on the pal. If the player's pal
// touches a disk or its zone, the game is over; offspring cells that touch one
// pop (see popInZones in colony.js).
//
// A disk is { fx, fy, r, zone } in fractions of the dish radius: its center,
// its radius, and how wide its zone of inhibition is.
import { GAME } from './config.js';

// Pick a random spot for one disk, as fractions of the dish radius from the
// center: away from the middle (where the pal starts) and from the rim.
export function diskSpot(random = Math.random) {
  const angle = random() * Math.PI * 2;
  const distance = GAME.DISK_MIN_DISTANCE +
    random() * (GAME.DISK_MAX_DISTANCE - GAME.DISK_MIN_DISTANCE);
  return { fx: Math.cos(angle) * distance, fy: Math.sin(angle) * distance, r: GAME.DISK_RADIUS };
}

// How wide a zone of inhibition `mm` across is in the game, as a fraction of
// the dish radius (see the ZONE_* settings in config.js). A drug with no zone
// size given has no zone.
export function zoneWidth(mm) {
  if (!Number.isFinite(mm)) return 0;
  const t = (mm - GAME.ZONE_MM_SMALL) / (GAME.ZONE_MM_BIG - GAME.ZONE_MM_SMALL);
  const clamped = Math.min(1, Math.max(0, t));
  return GAME.ZONE_MIN_WIDTH + clamped * (GAME.ZONE_MAX_WIDTH - GAME.ZONE_MIN_WIDTH);
}

// How far apart two disks with these zones must be, center to center: at
// least DISK_MIN_GAP, and far enough to leave SWIM_ROOM between their zones.
function minGap(a, b) {
  return Math.max(GAME.DISK_MIN_GAP, a.r + a.zone + b.r + b.zone + GAME.SWIM_ROOM);
}

// Pick spots for disks with the given zone widths, spread apart from each
// other so there's always room to swim between them. With lots of disks, the
// first few can land so that there's no room left for the rest; then start
// over. (A number instead of a list means that many disks with no zones.)
export function diskSpots(zones, random = Math.random) {
  if (typeof zones === 'number') zones = new Array(zones).fill(0);
  const count = zones.length;
  let best = [];
  for (let attempt = 0; attempt < 50 && best.length < count; attempt++) {
    const disks = [];
    for (let tries = 0; disks.length < count && tries < 500; tries++) {
      const spot = { ...diskSpot(random), zone: zones[disks.length] };
      if (disks.every((d) => Math.hypot(d.fx - spot.fx, d.fy - spot.fy) >= minGap(d, spot))) {
        disks.push(spot);
      }
    }
    if (disks.length > best.length) best = disks;
  }
  return best;
}

// Whether any of the given circles overlaps the disk or its zone. Circles are
// [x, y, radius] in pixels from the dish center; the disk is in fractions of
// the dish radius, so `dishRadius` converts between the two. `buffer` (also a
// fraction of the dish radius) counts coming within that much as touching.
export function touchesDisk(disk, circles, dishRadius, buffer = 0) {
  const dx = disk.fx * dishRadius;
  const dy = disk.fy * dishRadius;
  const reach = (disk.r + (disk.zone ?? 0) + buffer) * dishRadius;
  return circles.some(([x, y, r]) => Math.hypot(x - dx, y - dy) < reach + r);
}

// The first disk (or zone) the circles touch, or null if they touch none.
export function touchedDisk(disks, circles, dishRadius, margin = 0) {
  return disks.find((disk) => touchesDisk(disk, circles, dishRadius, margin)) || null;
}

// What the game-over pop-up says when the pal called `name` touches `disk`.
// A drug she's resistant to has no zone, so she can only have touched the
// disk itself.
export function touchMessage(name, disk) {
  const drug = disk.antibiotic.name;
  if (disk.zone > 0) return `${name} swam into the ${drug} zone of inhibition. Antibiotics kill bacteria!`;
  return `${name} bumped into the ${drug} disk. She's resistant to ${drug}, so it has no zone, but the disk still counts!`;
}

// The antibiotics for a dish with `count` disks: the pal's list in order,
// starting over from the top if there are more disks than drugs.
export function antibioticsFor(list, count) {
  return Array.from({ length: count }, (_, i) => list[i % list.length]);
}

// Put one disk per antibiotic on the agar and return where they are.
export function placeAntibiotics(antibiotics) {
  const agar = document.querySelector('.agar');
  const zones = antibiotics.map((antibiotic) => zoneWidth(antibiotic.zone));
  return diskSpots(zones).map((spot, i) => {
    const antibiotic = antibiotics[i];
    // The zone of inhibition: a clear ring around the disk, drawn underneath it.
    const zoneEl = document.createElement('div');
    zoneEl.className = 'zone';
    zoneEl.style.left = `${50 + spot.fx * 50}%`;
    zoneEl.style.top = `${50 + spot.fy * 50}%`;
    zoneEl.style.width = `${(spot.r + spot.zone) * 100}%`;
    // A slightly uneven edge, different for each zone, like on a real plate.
    const wobble = () => `${48 + Math.random() * 4}%`;
    zoneEl.style.borderRadius =
      `${wobble()} ${wobble()} ${wobble()} ${wobble()} / ${wobble()} ${wobble()} ${wobble()} ${wobble()}`;
    zoneEl.setAttribute('aria-hidden', 'true');
    agar.appendChild(zoneEl);
    const el = document.createElement('div');
    el.className = 'antibiotic';
    el.style.left = `${50 + spot.fx * 50}%`;
    el.style.top = `${50 + spot.fy * 50}%`;
    el.style.width = `${spot.r * 100}%`;
    el.textContent = antibiotic.code;
    el.setAttribute('role', 'img');
    el.setAttribute('aria-label', spot.zone > 0
      ? `Antibiotic disk: ${antibiotic.name}. Don't touch it or the clear zone around it!`
      : `Antibiotic disk: ${antibiotic.name}. No clear zone (resistant), but don't touch the disk!`);
    // Shown in a little label above the disk when you hover over it (see
    // .antibiotic::after in css/dish.css), e.g. "Penicillin".
    el.dataset.name = antibiotic.name[0].toUpperCase() + antibiotic.name.slice(1);
    agar.appendChild(el);
    return { ...spot, el, zoneEl, antibiotic };
  });
}
