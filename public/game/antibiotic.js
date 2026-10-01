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
// always room to swim between them. With lots of disks, the first few can
// land so that there's no room left for the rest; then start over.
export function diskSpots(count, random = Math.random) {
  let best = [];
  for (let attempt = 0; attempt < 50 && best.length < count; attempt++) {
    const disks = [];
    for (let tries = 0; disks.length < count && tries < 500; tries++) {
      const spot = diskSpot(random);
      if (disks.every((d) => Math.hypot(d.fx - spot.fx, d.fy - spot.fy) >= GAME.DISK_MIN_GAP)) {
        disks.push(spot);
      }
    }
    if (disks.length > best.length) best = disks;
  }
  return best;
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
// disk, as [dx, dy] in pixels. [0, 0] if it's already clear. `buffer` keeps
// that much extra clear space around each disk.
//
// Each disk pushes the whole body one way: straight out from the disk's
// center toward the middle of the body, just far enough that every circle
// is clear. (Pushing along whichever circle overlaps most would flip back and
// forth for a chain curved around a disk: clearing one end shoves the other
// end in, and the next frame does the opposite, so it shakes forever.)
export function pushOffDisks(disks, circles, dishRadius, buffer = 0) {
  let moveX = 0;
  let moveY = 0;
  if (circles.length === 0) return [0, 0];
  const midX = circles.reduce((sum, [x]) => sum + x, 0) / circles.length;
  const midY = circles.reduce((sum, [, y]) => sum + y, 0) / circles.length;
  for (const disk of disks) {
    const cx = disk.fx * dishRadius;
    const cy = disk.fy * dishRadius;
    const reach = (disk.r + buffer) * dishRadius;
    const overlapping = circles.filter(([x, y, r]) =>
      Math.hypot(x + moveX - cx, y + moveY - cy) < reach + r);
    if (overlapping.length === 0) continue;
    // Which way to push: from the disk's center toward the body's middle
    // (or straight out through the one circle, or right if dead center).
    let ux = midX + moveX - cx;
    let uy = midY + moveY - cy;
    let length = Math.hypot(ux, uy);
    if (length < 1e-6) {
      const [x, y] = overlapping[0];
      ux = x + moveX - cx;
      uy = y + moveY - cy;
      length = Math.hypot(ux, uy);
    }
    if (length < 1e-6) {
      ux = 1;
      uy = 0;
      length = 1;
    }
    ux /= length;
    uy /= length;
    // How far along that way each overlapping circle must go to be clear:
    // solve |d + t u| = reach + r for the larger t.
    let push = 0;
    for (const [x, y, r] of overlapping) {
      const dx = x + moveX - cx;
      const dy = y + moveY - cy;
      const along = dx * ux + dy * uy;
      const need = reach + r;
      const t = -along + Math.sqrt(Math.max(0, along * along - (dx * dx + dy * dy) + need * need));
      push = Math.max(push, t);
    }
    moveX += ux * push;
    moveY += uy * push;
  }
  return [moveX, moveY];
}

// The first disk the circles touch, or null if they touch none.
export function touchedDisk(disks, circles, dishRadius, margin = 0) {
  return disks.find((disk) => touchesDisk(disk, circles, dishRadius, margin)) || null;
}

// The antibiotics for a dish with `count` disks: the pal's list in order,
// starting over from the top if there are more disks than drugs.
export function antibioticsFor(list, count) {
  return Array.from({ length: count }, (_, i) => list[i % list.length]);
}

// Put one disk per antibiotic on the agar and return where they are.
export function placeAntibiotics(antibiotics) {
  const agar = document.querySelector('.agar');
  return diskSpots(antibiotics.length).map((spot, i) => {
    const antibiotic = antibiotics[i];
    // The zone of inhibition: a clear ring around the disk, drawn underneath it.
    const zone = document.createElement('div');
    zone.className = 'zone';
    zone.style.left = `${50 + spot.fx * 50}%`;
    zone.style.top = `${50 + spot.fy * 50}%`;
    zone.style.width = `${(spot.r + GAME.ZONE_WIDTH) * 100}%`;
    // A slightly uneven edge, different for each zone, like on a real plate.
    const wobble = () => `${48 + Math.random() * 4}%`;
    zone.style.borderRadius =
      `${wobble()} ${wobble()} ${wobble()} ${wobble()} / ${wobble()} ${wobble()} ${wobble()} ${wobble()}`;
    zone.setAttribute('aria-hidden', 'true');
    agar.appendChild(zone);
    const el = document.createElement('div');
    el.className = 'antibiotic';
    el.style.left = `${50 + spot.fx * 50}%`;
    el.style.top = `${50 + spot.fy * 50}%`;
    el.style.width = `${spot.r * 100}%`;
    el.textContent = antibiotic.code;
    el.setAttribute('role', 'img');
    el.setAttribute('aria-label', `Antibiotic disk: ${antibiotic.name}. Don't touch it or the clear zone around it!`);
    el.title = antibiotic.name;
    agar.appendChild(el);
    return { ...spot, el, zone, antibiotic };
  });
}
