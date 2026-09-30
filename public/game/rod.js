import { GAME } from './config.js';
import { newMover } from './mover.js';
import { coaster } from './physics.js';

// A rod-shaped cell (Mona, Vi). Each division it splits across the middle
// and the two cells go their separate ways.
export function rodGroup({ mover, svg, species, isPlayer }) {
  const ROD_WIDTH = 14; // percent of the dish

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
    halfWidth: () => svg.getBoundingClientRect().width / 2,
    reach: () => group.halfWidth(),
    update() {
      mover.style.width = `${ROD_WIDTH}%`;
    },
    place() {
      mover.style.transform = `translate(${group.x}px, ${group.y}px) scaleX(${group.facing})`;
    },
    mouths: () => [[group.x, group.y, group.halfWidth() * GAME.PICKUP_REACH]],
    // Split into two rods that push apart end to end.
    divide() {
      const copy = svg.cloneNode(true);
      const child = rodGroup({ mover: newMover(copy), svg: copy, species, isPlayer: false });
      child.x = group.x;
      child.y = group.y;
      child.facing = group.facing;
      const burst = GAME.BURST_SPEED * (document.querySelector('.agar').clientWidth / 2);
      child.vx = group.facing * burst;
      child.vy = (Math.random() - 0.5) * burst * 0.4;
      if (!isPlayer) group.vx = -child.vx;
      return child;
    },
    coast: null,
  };
  group.coast = coaster(group);
  return group;
}
