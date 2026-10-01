// A colony: one pal (its "leader", the cell that's steered) and all the
// offspring it grows. It eats nutrients, divides, and counts its cells. Both
// game modes use it: classic has one colony, mixed culture has two.
import { pushOffDisks } from './antibiotic.js';
import { GAME } from './config.js';
import { keepInDish, pushApart, pushInsideRim } from './physics.js';

// `leader` is the steered group, `target` the size the colony stops dividing
// at, and `onDivide` is called after every division.
export function makeColony({ leader, nutrients, disks = [], dishRadius, target, onDivide = () => {} }) {
  const groups = [leader];
  let pending = 0; // nutrients the leader has eaten toward its next division
  let sinceDivision = Infinity; // ms since the leader last divided

  const colony = {
    leader,
    groups,
    sinceAnyDivision: Infinity, // ms since any of its cells last divided
    cellCount: () => groups.reduce((sum, g) => sum + g.cellCount(), 0),

    tick(seconds) {
      sinceDivision += seconds * 1000;
      colony.sinceAnyDivision += seconds * 1000;
    },

    // Binary fission: a cell divides and the daughter stays behind. A rod's
    // daughter slides off on its own; a coccus's daughter joins a nearby chain
    // or cluster of this colony (maybe the one it came from), or starts a new
    // one. `from` is where the dividing cell is, for cocci.
    divide(group, from) {
      colony.sinceAnyDivision = 0;
      const others = groups.filter((g) => g !== leader);
      const offspring = group.divide(others, dishRadius(), disks, from);
      if (offspring) {
        // Size and position the new cell right away. Otherwise the browser
        // draws it once at the center of the dish before this frame's
        // positioning catches up, which shows up as a flash.
        offspring.update(0);
        offspring.place();
        groups.push(offspring);
      }
      onDivide(offspring);
    },

    // Every cell eats any nutrient it touches. Offspring divide as soon as
    // they've eaten enough; the leader's division waits for divideLeader().
    eat(seconds, radius) {
      for (const [x, y, reach] of leader.body()) {
        pending += nutrients.eatNear(x / radius, y / radius, reach / radius);
      }
      for (const group of [...groups]) {
        if (group === leader) continue;
        group.pending ??= 0;
        group.sinceDivision = (group.sinceDivision ?? Infinity) + seconds * 1000;
        for (const [x, y, reach] of group.body()) {
          const ate = nutrients.eatNear(x / radius, y / radius, reach / radius);
          if (ate === 0) continue;
          group.pending += ate;
          group.from = [x, y]; // for cocci, the cell that ate is the one that divides
        }
        if (group.pending >= GAME.NUTRIENTS_PER_DIVISION && group.sinceDivision > GAME.DIVIDE_MS &&
            colony.cellCount() < target) {
          group.pending -= GAME.NUTRIENTS_PER_DIVISION;
          group.sinceDivision = 0;
          colony.divide(group, group.from);
        }
      }
    },

    // Divide the leader if it has eaten enough and isn't still mid-division.
    divideLeader() {
      if (pending < GAME.NUTRIENTS_PER_DIVISION || sinceDivision <= GAME.DIVIDE_MS) return;
      pending -= GAME.NUTRIENTS_PER_DIVISION;
      sinceDivision = 0;
      colony.divide(leader);
    },
  };
  return colony;
}

// Move an offspring group by [dx, dy] and stop it sliding back the way it
// was pushed from.
function nudge(group, [dx, dy]) {
  if (dx === 0 && dy === 0) return;
  group.x += dx;
  group.y += dy;
  const length = Math.hypot(dx, dy);
  const against = -(group.vx * dx + group.vy * dy) / length;
  if (against > 0) {
    group.vx += (against * dx) / length;
    group.vy += (against * dy) / length;
  }
}

// One frame of movement for every group in the dish (from every colony):
// offspring slide and settle, nobody lands on top of anybody, offspring stay
// out of the disks' zones and inside the rim, and leaders stay inside the
// dish. Leaders (isPlayer) swim over everything.
export function moveGroups(groups, { agar, radius, seconds, disks = [] }) {
  for (const group of groups) {
    if (!group.isPlayer) group.coast(seconds);
    group.update(seconds);
  }
  // Measure every group once, after all the size changes, instead of
  // measuring between writes (which makes the browser re-lay-out each time).
  for (const group of groups) group.size = group.reach();
  pushApart(groups);
  // Offspring grow up to the edge of each disk's zone of inhibition but never
  // into it, and stay inside the rim, checked cell by cell (a long chain isn't
  // one big circle). Then the disks get one more say, so the rim can never
  // push a chain back onto a disk.
  for (const group of groups) {
    if (group.isPlayer) {
      [group.x, group.y] = keepInDish(agar, group.x, group.y, group.size, group);
    } else {
      nudge(group, pushOffDisks(disks, group.body(), radius));
      nudge(group, pushInsideRim(group.body(), radius));
      nudge(group, pushOffDisks(disks, group.body(), radius));
    }
    group.place();
  }
}
