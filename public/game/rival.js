// The computer's pal in mixed culture mode. Every so often it looks around,
// picks a nutrient to go after (usually the nearest one, sometimes the next
// nearest), and swims toward it, weaving a little and slower than you, so
// it's beatable.
import { MIXED } from './config.js';

// Which nutrient to go after from (fx, fy): the nearest, or now and then the
// second nearest. `flecks` are { fx, fy }; `random` returns 0 to 1. Returns
// a fleck, or null if there are none.
export function chooseTarget(fx, fy, flecks, random = Math.random) {
  if (flecks.length === 0) return null;
  const sorted = [...flecks].sort((a, b) =>
    Math.hypot(a.fx - fx, a.fy - fy) - Math.hypot(b.fx - fx, b.fy - fy));
  return random() < 0.25 && sorted.length > 1 ? sorted[1] : sorted[0];
}

// Steers `leader` (a rod or coccus group). Call step() every frame.
export function rivalBrain(leader, nutrients, random = Math.random) {
  let target = null;
  let sinceLook = Infinity;
  let wander = 0; // radians off course, drifting slowly
  let waited = 0; // ms since the race started, until the rival gets going

  return {
    step(seconds, radius) {
      // Give you a head start: sit still for the first RIVAL_START_MS.
      if (waited < MIXED.RIVAL_START_MS) {
        waited += seconds * 1000;
        return;
      }
      sinceLook += seconds * 1000;
      const fx = leader.x / radius;
      const fy = leader.y / radius;
      const reached = target && Math.hypot(target.fx - fx, target.fy - fy) < 0.03;
      if (sinceLook >= MIXED.RIVAL_REACT_MS || reached) {
        sinceLook = 0;
        target = chooseTarget(fx, fy, nutrients.positions(), random);
      }
      wander += (random() - 0.5) * 4 * seconds;
      wander = Math.max(-MIXED.RIVAL_WANDER, Math.min(MIXED.RIVAL_WANDER, wander));
      if (!target) return;
      const angle = Math.atan2(target.fy - fy, target.fx - fx) + wander;
      const dx = Math.cos(angle);
      const dy = Math.sin(angle);
      leader.x += dx * MIXED.RIVAL_SPEED * radius * seconds;
      leader.y += dy * MIXED.RIVAL_SPEED * radius * seconds;
      if (Math.abs(dx) > 0.2) leader.facing = Math.sign(dx);
    },
  };
}
