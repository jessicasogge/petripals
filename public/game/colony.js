// A colony: one pal (its "leader", the cell that's steered) and all the
// offspring it grows. It eats nutrients, divides, and counts its cells. Both
// game modes use it: classic has one colony, mixed culture has two.
import { touchesDisk } from './antibiotic.js';
import { GAME } from './config.js';
import { keepInDish, pushApart, pushInsideRim } from './physics.js';

// `leader` is the steered group, `target` the size the colony stops dividing
// at, `onDivide` is called after every division and `onPop` after offspring
// cells pop in an antibiotic zone. `color` tints the pop.
export function makeColony({
  leader, nutrients, disks = [], dishRadius, target, color = '#94a3b8',
  onDivide = () => {}, onPop = () => {},
}) {
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

    // Antibiotics kill bacteria: any offspring cell touching a disk or its
    // zone of inhibition pops. A rod is one cell, so it pops whole; a chain or
    // cluster loses just the cells that touch, and the rest live on. (The
    // leader touching one is game over, which the game itself handles.)
    // Returns how many cells popped.
    popInZones(radius) {
      if (disks.length === 0) return 0;
      let popped = 0;
      for (const group of [...groups]) {
        if (group === leader) continue;
        const body = group.body();
        const hit = body
          .map((circle, i) => (disks.some((disk) => touchesDisk(disk, [circle], radius)) ? i : -1))
          .filter((i) => i >= 0);
        if (hit.length === 0) continue;
        const dish = group.mover.parentElement;
        if (group.removeCells) {
          // A chain or cluster: one circle per cell, so pop just those.
          for (const i of hit) showPop(dish, body[i], color);
          popped += hit.length;
          if (hit.length < body.length) {
            group.removeCells(hit);
            continue;
          }
        } else {
          // A rod: its outline is several circles, but it's one cell.
          showPop(dish, [group.x, group.y, group.reach()], color);
          popped += group.cellCount();
        }
        groups.splice(groups.indexOf(group), 1);
        group.mover.remove();
      }
      if (popped > 0) onPop(popped);
      return popped;
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

// A little "pop" where a cell died: a ring in the pal's color that bursts
// outward and fades (see .pop in styles.css). `circle` is [x, y, r] in px
// from the dish center.
export function showPop(dish, [x, y, r], color) {
  if (!dish) return;
  const ring = document.createElement('div');
  ring.className = 'pop';
  ring.setAttribute('aria-hidden', 'true');
  ring.style.left = `calc(50% + ${x}px)`;
  ring.style.top = `calc(50% + ${y}px)`;
  ring.style.width = `${2 * r}px`;
  ring.style.borderColor = color;
  dish.appendChild(ring);
  const remove = () => ring.remove();
  ring.addEventListener('animationend', remove);
  setTimeout(remove, 1000); // in case the animation never runs
}

// One frame of movement for every group in the dish (from every colony):
// offspring slide and settle, nobody lands on top of anybody, offspring stay
// inside the rim, and leaders stay inside the dish. Leaders (isPlayer) swim
// over everything. (Offspring aren't kept out of the antibiotic zones: ones
// that wander in pop, see popInZones.)
export function moveGroups(groups, { agar, radius, seconds }) {
  for (const group of groups) {
    if (!group.isPlayer) group.coast(seconds);
    group.update(seconds);
  }
  // Measure every group once, after all the size changes, instead of
  // measuring between writes (which makes the browser re-lay-out each time).
  for (const group of groups) group.size = group.reach();
  pushApart(groups);
  // Offspring stay inside the rim, checked cell by cell (a long chain isn't
  // one big circle).
  for (const group of groups) {
    if (group.isPlayer) {
      [group.x, group.y] = keepInDish(agar, group.x, group.y, group.size, group);
    } else {
      nudge(group, pushInsideRim(group.body(), radius));
    }
    group.place();
  }
}
