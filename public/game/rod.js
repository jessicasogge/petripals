import { GAME } from './config.js';
import { idlePose, newMover } from './mover.js';
import { coaster } from './physics.js';

// A rod-shaped cell (Mona, Vi, Elia, Coco). Each division it splits across the middle
// and the two cells go their separate ways.
//
// Most rods just flip to face left or right. A rod whose species `turns`
// (Elia) also tilts to point the way she swims: `tilt` is the angle from
// level, in radians, measured in the direction she faces (so tilting up is
// negative whichever way she faces), and she swings to it smoothly.
export function rodGroup({ mover, svg, species, isPlayer }) {
  const ROD_WIDTH = 12; // percent of the dish

  const group = {
    mover,
    svg,
    isPlayer,
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    facing: 1,
    tilt: 0,
    targetTilt: 0,
    cellCount: () => 1,
    // The drawing's size before any idle animation stretches or turns it.
    halfWidth: () => mover.offsetWidth / 2,
    reach: () => group.halfWidth(),
    update(seconds = 0) {
      const width = `${ROD_WIDTH}%`;
      if (mover.style.width !== width) mover.style.width = width;
      // Swing smoothly toward the way she's pointing.
      const ease = 1 - Math.exp(-GAME.TURN_RATE * seconds);
      group.tilt += (group.targetTilt - group.tilt) * ease;
    },
    // Point the way the player is steering (dx, dy), for a rod that turns.
    // Called after `facing` is set; straight up or down keeps the way she faces.
    aim(dx, dy) {
      if (!species.turns || (dx === 0 && dy === 0)) return;
      group.targetTilt = Math.atan2(dy, group.facing * dx);
    },
    place() {
      const degrees = (group.tilt * 180) / Math.PI;
      mover.style.transform =
        `translate(${group.x}px, ${group.y}px) scaleX(${group.facing}) rotate(${degrees}deg)`;
    },
    // The rod's outline as circles in the dish, traced from its drawing (see
    // `body` in config.js). Used to tell whether it touches a nutrient or an
    // antibiotic disk.
    // The player's follows its idle animation, so touches match the screen.
    body() {
      const w = group.halfWidth() * 2;
      const pose = isPlayer ? idlePose(svg) : (x, y, r) => [x, y, r];
      const cos = Math.cos(group.tilt);
      const sin = Math.sin(group.tilt);
      return species.body.map(([fx, fy, fr]) => {
        const [x, y, r] = pose(fx * w, fy * w, fr * w);
        // Tilt, then flip to face left or right, as place() draws it.
        const tx = x * cos - y * sin;
        const ty = x * sin + y * cos;
        return [group.x + tx * group.facing, group.y + ty, r];
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
      child.tilt = child.targetTilt = group.tilt;
      // The new rod slides off the way the parent points, with a little drift.
      const burst = GAME.BURST_SPEED * (document.querySelector('.agar').clientWidth / 2);
      const along = burst;
      const drift = (Math.random() - 0.5) * burst * 0.4;
      const cos = Math.cos(group.tilt);
      const sin = Math.sin(group.tilt);
      child.vx = group.facing * (along * cos - drift * sin);
      child.vy = along * sin + drift * cos;
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
  return group;
}
