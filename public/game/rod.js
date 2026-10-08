import { GAME } from './config.js';
import { idlePose, newMover } from './mover.js';
import { coaster } from './physics.js';

// A rod-shaped cell (Mona, Vi, Elia, Coco). Each division it splits across the
// middle and the two cells go their separate ways.
//
// Astrid (`swarmers` in config.js) splits into two different cells: one keeps
// her stalks and holdfast, and the new one is a swarmer, a swimmer with a
// flagellum and no stalks. A swarmer can't divide as she is: before she does,
// she settles down, drops her flagellum and grows stalks of her own, and her
// new cell is a swarmer in turn.
export function rodGroup({ mover, svg, species, isPlayer }) {
  // How wide the drawing is, as a percent of the dish (see `size` in config.js).
  const ROD_WIDTH = species.size ?? 12;

  const group = {
    mover,
    svg,
    isPlayer,
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    facing: 1,
    cellCount: () => 1,
    // The drawing's size before any idle animation stretches or turns it.
    halfWidth: () => mover.offsetWidth / 2,
    reach: () => group.halfWidth(),
    update() {
      const width = `${ROD_WIDTH}%`;
      if (mover.style.width !== width) mover.style.width = width;
    },
    place() {
      mover.style.transform = `translate(${group.x}px, ${group.y}px) scaleX(${group.facing})`;
      wiggleWhileMoving();
    },
    // The rod's outline as circles in the dish, traced from its drawing (see
    // `body` in config.js). Used to tell whether it touches a nutrient or an
    // antibiotic disk.
    // The player's follows its idle animation, so touches match the screen.
    body() {
      const w = group.halfWidth() * 2;
      const pose = isPlayer ? idlePose(svg) : (x, y, r) => [x, y, r];
      return species.body.map(([fx, fy, fr]) => {
        const [x, y, r] = pose(fx * w, fy * w, fr * w);
        return [group.x + x * group.facing, group.y + y, r];
      });
    },
    // Split into two rods that push apart end to end. An offspring that
    // divides slides back the other way and settles again.
    // The new rod slides off the way the parent faces, unless that would
    // carry it (or the parent, sliding back) into an antibiotic zone: then it
    // goes the nearest way that's clear, or failing that the way that keeps
    // furthest from the zones.
    divide(others, dishRadius, disks = []) {
      const radius = dishRadius ?? document.querySelector('.agar').clientWidth / 2;
      const copy = svg.cloneNode(true);
      if (species.swarmers) {
        if (group.swarmer) {
          group.swarmer = false;
          setSwarmer(svg, false);
        }
        setSwarmer(copy, true);
      }
      const child = rodGroup({ mover: newMover(copy), svg: copy, species, isPlayer: false });
      child.swarmer = Boolean(species.swarmers);
      child.x = group.x;
      child.y = group.y;
      child.facing = group.facing;
      const burst = GAME.BURST_SPEED * radius;
      const [vx, vy] = burstDirection(group, disks, radius, [group.facing, (Math.random() - 0.5) * 0.4]);
      child.vx = vx * burst;
      child.vy = vy * burst;
      if (!isPlayer) {
        group.vx = -child.vx;
        group.vy = -child.vy;
        group.age = 0;
      }
      return child;
    },
    coast: null,
  };
  group.coast = coaster(group);

  // A flagellum (Mona's, Vi's), Elia's wavy body or Electra's sparks move
  // only while the rod is swimming. They keep going for a few frames after a
  // stop, so they don't flicker on and off between key presses, and ignore the
  // tiny nudges of settled cells.
  let lastX = null;
  let lastY = null;
  let stillFrames = 0;
  let wiggling = true; // a new drawing's <animate> starts running
  function wiggleWhileMoving() {
    const moved = lastX !== null && Math.hypot(group.x - lastX, group.y - lastY) > MIN_STEP;
    lastX = group.x;
    lastY = group.y;
    stillFrames = moved ? 0 : stillFrames + 1;
    const wiggle = stillFrames < STILL_FRAMES;
    if (wiggle === wiggling) return;
    wiggling = wiggle;
    // (pauseAnimations only stops the SVG's own <animate>, not the CSS bob.)
    if (wiggle) svg.unpauseAnimations?.();
    else svg.pauseAnimations?.();
  }

  return group;
}

// Show Astrid's drawing as a swarmer (her flagellum, no stalks or holdfast),
// or with her stalks again.
export function setSwarmer(svg, swarmer) {
  const [show, hide] = swarmer ? ['.swarmer', '.stalked'] : ['.stalked', '.swarmer'];
  for (const part of svg.querySelectorAll(show)) part.removeAttribute('display');
  for (const part of svg.querySelectorAll(hide)) part.setAttribute('display', 'none');
}

// How far, in pixels, a rod must move in one frame to count as swimming, and
// how many still frames in a row before its flagellum stops.
export const MIN_STEP = 0.3;
export const STILL_FRAMES = 6;

// How many ways a dividing rod tries for its new rod, all around the circle.
export const BURST_TRIES = 16;
// How far from a zone (as a fraction of the dish radius) the new rod should
// land to count as clear.
export const BURST_CLEARANCE = 0.02;

// Which way (a [x, y] step, about 1 long) the new rod slides when `rod`
// divides: `wanted` if that's clear of every zone, else the clear way closest
// to it, else the way that keeps furthest from the zones.
export function burstDirection(rod, disks, dishRadius, wanted) {
  if (!disks.length) return wanted;
  const speed = Math.hypot(...wanted);
  const start = Math.atan2(wanted[1], wanted[0]);
  // How far a burst carries a rod before it settles (see coaster in physics.js).
  const travel = (GAME.BURST_SPEED * dishRadius) / GAME.SETTLE_RATE;
  const body = rod.body();
  const reach = rod.reach();
  const maxDistance = Math.max(0, dishRadius - reach);
  // How far the rod's body is from the nearest zone, in fractions of the
  // dish radius, if it moves by (dx, dy), kept inside the rim.
  const roomAt = (dx, dy) => {
    let [x, y] = [rod.x + dx, rod.y + dy];
    const fromCenter = Math.hypot(x, y);
    if (fromCenter > maxDistance) [x, y] = [(x / fromCenter) * maxDistance, (y / fromCenter) * maxDistance];
    const [sx, sy] = [x - rod.x, y - rod.y];
    let room = Infinity;
    for (const disk of disks) {
      const reachOfZone = (disk.r + (disk.zone ?? 0)) * dishRadius;
      for (const [cx, cy, r] of body) {
        const gap = Math.hypot(cx + sx - disk.fx * dishRadius, cy + sy - disk.fy * dishRadius) - reachOfZone - r;
        room = Math.min(room, gap / dishRadius);
      }
    }
    return room;
  };
  // The least room anywhere along the slide, for the new rod and, if it
  // moves too, the parent sliding the other way.
  const roomFor = (angle) => {
    const [dx, dy] = [Math.cos(angle), Math.sin(angle)];
    let room = Infinity;
    for (const part of [1 / 3, 2 / 3, 1]) {
      const d = part * travel;
      room = Math.min(room, roomAt(dx * d, dy * d));
      if (!rod.isPlayer) room = Math.min(room, roomAt(-dx * d, -dy * d));
    }
    return room;
  };
  let best = { angle: start, room: roomFor(start) };
  if (best.room >= BURST_CLEARANCE) return wanted;
  for (let i = 1; i < BURST_TRIES; i++) {
    // Try the nearest ways first: a little either side, then further round.
    const turn = Math.ceil(i / 2) * (i % 2 ? 1 : -1) * ((2 * Math.PI) / BURST_TRIES);
    const angle = start + turn;
    const room = roomFor(angle);
    if (room >= BURST_CLEARANCE) return [Math.cos(angle) * speed, Math.sin(angle) * speed];
    if (room > best.room) best = { angle, room };
  }
  if (best.angle === start) return wanted;
  return [Math.cos(best.angle) * speed, Math.sin(best.angle) * speed];
}
