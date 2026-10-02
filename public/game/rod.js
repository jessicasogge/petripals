import { GAME } from './config.js';
import { idlePose, newMover } from './mover.js';
import { coaster } from './physics.js';

// A rod-shaped cell (Mona, Vi, Elia, Coco). Each division it splits across the
// middle and the two cells go their separate ways.
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
    divide() {
      const copy = svg.cloneNode(true);
      const child = rodGroup({ mover: newMover(copy), svg: copy, species, isPlayer: false });
      child.x = group.x;
      child.y = group.y;
      child.facing = group.facing;
      const burst = GAME.BURST_SPEED * (document.querySelector('.agar').clientWidth / 2);
      child.vx = group.facing * burst;
      child.vy = (Math.random() - 0.5) * burst * 0.4;
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

  // A flagellum (Mona's, Vi's), or Elia's wavy body, wiggles only while its
  // rod is swimming. It keeps going for a few frames after a stop, so it
  // doesn't flicker on and off between key presses, and ignores the tiny
  // nudges of settled cells.
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

// How far, in pixels, a rod must move in one frame to count as swimming, and
// how many still frames in a row before its flagellum stops.
export const MIN_STEP = 0.3;
export const STILL_FRAMES = 6;
