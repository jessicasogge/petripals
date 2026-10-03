// How groups move in the dish: staying inside the rim, not landing on top of
// each other, and sliding to a stop after splitting off.
import { GAME } from './config.js';

// How far to move a body (circles [x, y, r] in px from the dish center) so
// every circle is inside a dish of radius `dishRadius`, as [dx, dy]. [0, 0]
// if it's already inside. It checks the actual cells, so a long chain lying
// along the rim isn't pulled in as if it were one big circle; each step moves
// the body straight in from whichever cell pokes out furthest.
export function pushInsideRim(circles, dishRadius) {
  let moveX = 0;
  let moveY = 0;
  for (let step = 0; step < 4; step++) {
    let worst = null;
    for (const [x, y, r] of circles) {
      const px = x + moveX;
      const py = y + moveY;
      const fromCenter = Math.hypot(px, py);
      const over = fromCenter + r - dishRadius;
      if (over > 1e-9 && (!worst || over > worst.over)) worst = { over, px, py, fromCenter };
    }
    if (!worst) break;
    const nx = worst.fromCenter > 0 ? worst.px / worst.fromCenter : 1;
    const ny = worst.fromCenter > 0 ? worst.py / worst.fromCenter : 0;
    moveX -= nx * worst.over;
    moveY -= ny * worst.over;
  }
  return [moveX, moveY];
}

// Keep a group whose farthest edge is `reach` px from its center fully inside
// the dish, sliding along the rim. Offspring still sliding bounce off it.
export function keepInDish(agar, px, py, reach, group) {
  const maxDistance = Math.max(0, agar.clientWidth / 2 - reach);
  const fromCenter = Math.hypot(px, py);
  if (fromCenter <= maxDistance) return [px, py];
  const nx = px / fromCenter;
  const ny = py / fromCenter;
  if (group && !group.isPlayer) {
    const outward = group.vx * nx + group.vy * ny;
    if (outward > 0) {
      group.vx -= 2 * outward * nx;
      group.vy -= 2 * outward * ny;
    }
  }
  return [nx * maxDistance, ny * maxDistance];
}

// While offspring are still settling, nudge them off each other so they
// don't land in a pile. The player swims over everything, and offspring that
// have settled stay exactly where they are.
export function pushApart(groups, player) {
  // Leaders (`player`, or any group marked isPlayer) swim over everything.
  const leads = (g) => g === player || g.isPlayer === true;
  const settling = (g) => !leads(g) && g.age * 1000 < GAME.SETTLE_MS;
  for (let i = 0; i < groups.length; i++) {
    for (let j = i + 1; j < groups.length; j++) {
      const a = groups[i];
      const b = groups[j];
      if (leads(a) || leads(b)) continue;
      const aMoves = settling(a);
      const bMoves = settling(b);
      if (!aMoves && !bMoves) continue;
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const distance = Math.hypot(dx, dy) || 0.01;
      const overlap = (a.size + b.size) * GAME.SPACING - distance;
      if (overlap <= 0) continue;
      const nx = dx / distance;
      const ny = dy / distance;
      const aShare = aMoves && bMoves ? 0.5 : aMoves ? 1 : 0;
      const push = Math.min(overlap, 3);
      a.x -= nx * push * aShare;
      a.y -= ny * push * aShare;
      b.x += nx * push * (1 - aShare);
      b.y += ny * push * (1 - aShare);
    }
  }
}

// Offspring on agar don't wander: a new group slides a little way from where
// it split off, slows down, and stays put, the way cells on a plate stay
// where they land and grow into colonies.
export function coaster(group) {
  group.age = 0;
  return (seconds) => {
    group.age += seconds;
    const slowdown = Math.exp(-GAME.SETTLE_RATE * seconds);
    group.vx *= slowdown;
    group.vy *= slowdown;
    if (Math.hypot(group.vx, group.vy) < 1) {
      group.vx = 0;
      group.vy = 0;
    }
    group.x += group.vx * seconds;
    group.y += group.vy * seconds;
  };
}
