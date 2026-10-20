// Phage Attack: eat the target number of nutrients on each of five levels,
// each starting with one more phage, while bacteriophages,
// viruses that infect bacteria, hunt your colony down. A phage that lands on one of
// your offspring injects its DNA, and a few seconds later that cell bursts
// open (lysis) and lets out new phages, so the more cells they catch, the
// more of them there are, with no limit. One landing on your pal is game over. No
// antibiotic disks this time.
import { makeColony, moveGroups, showPop } from './colony.js';
import { GAME, PHAGE } from './config.js';
import { coccusGroup } from './coccus.js';
import { showFact } from './facts.js';
import { arrowKeys } from './keyboard.js';
import { goTo } from './loading.js';
import { rodGroup } from './rod.js';
import { sporeBurst } from './spores.js';
import { steer, touchSteering } from './touch.js';
import { track } from './track.js';

const SVG = 'http://www.w3.org/2000/svg';

// How far the tips of the tail fibers are from the middle of the drawing, as
// a fraction of the dish radius: the drawing is 3.3% of the dish across (see
// .phage in styles.css) and half again as tall. The tips are what land on a
// cell, so a phage has to really touch it.
export const TAIL = 0.0484;

// A generic tailed phage, like T4: a twenty-sided head full of DNA, a tail
// it injects the DNA through, and tail fibers it lands on, in a deep plum
// so they stand out on the agar. Drawn tail down;
// the game turns it to point the way it's swimming. The angry little face
// is made up.
export function phageDrawing() {
  const svg = document.createElementNS(SVG, 'svg');
  svg.setAttribute('viewBox', '0 0 40 60');
  svg.setAttribute('aria-hidden', 'true');
  svg.innerHTML = `
    <g fill="none" stroke="#24042e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <polyline points="15,46 8,51 5,59" /><polyline points="18,47 14,53 12,60" />
      <polyline points="25,46 32,51 35,59" /><polyline points="22,47 26,53 28,60" />
    </g>
    <rect x="16.5" y="25" width="7" height="20" rx="1.5" fill="#5b1270" stroke="#24042e" stroke-width="1.4" />
    <path d="M16.5 30h7M16.5 35h7M16.5 40h7" stroke="#8a3aa0" stroke-width="0.9" />
    <rect x="13" y="44" width="14" height="3.5" rx="1.5" fill="#3d0a4c" stroke="#24042e" stroke-width="1.2" />
    <polygon points="20,2 30.4,8 30.4,20 20,26 9.6,20 9.6,8" fill="#4a0d5e" stroke="#24042e" stroke-width="1.6" stroke-linejoin="round" />
    <path d="M9.6 8L20 14L30.4 8M20 14V26" fill="none" stroke="#7a2a91" stroke-width="0.9" />
    <g class="phage-face">
      <path d="M13.5 11.5l4 1.6M26.5 11.5l-4 1.6" stroke="#f5f3ff" stroke-width="1.4" stroke-linecap="round" />
      <circle cx="16" cy="15.5" r="1.7" fill="#f5f3ff" /><circle cx="24" cy="15.5" r="1.7" fill="#f5f3ff" />
      <path d="M17.5 20.5q2.5 -1.6 5 0" fill="none" stroke="#f5f3ff" stroke-width="1.2" stroke-linecap="round" />
    </g>`;
  return svg;
}

// Which cell a phage at (fx, fy) goes after: the nearest one. `cells` are
// { fx, fy } (and anything else the caller needs back). Returns a cell, or
// null if there are none.
export function nearestCell(fx, fy, cells) {
  let best = null;
  let bestDistance = Infinity;
  for (const cell of cells) {
    const distance = Math.hypot(cell.fx - fx, cell.fy - fy);
    if (distance < bestDistance) {
      best = cell;
      bestDistance = distance;
    }
  }
  return best;
}

// All the phages on the agar. Positions are fractions of the dish radius
// from the center, like the nutrients, so they stay put on a resize.
// `random` returns 0 to 1, for the tests.
export function phageSwarm(agar, random = Math.random) {
  const phages = [];

  function add(fx, fy, heading, grace = 0) {
    const el = document.createElement('div');
    el.className = 'phage';
    el.appendChild(phageDrawing());
    agar.appendChild(el);
    const phage = { el, fx, fy, heading, wander: 0, grace };
    place(phage);
    phages.push(phage);
    return phage;
  }

  function place(phage) {
    phage.el.style.left = `${50 + phage.fx * 50}%`;
    phage.el.style.top = `${50 + phage.fy * 50}%`;
    // Drawn tail down: turn it so the tail leads.
    phage.el.style.setProperty('--turn', `${(phage.heading * 180) / Math.PI - 90}deg`);
  }

  return {
    phages,
    count: () => phages.length,
    // A phage on the rim at the start, heading inward: at `angle`
    // (radians), or a random spot. After that, new phages only come out of
    // the cells they burst.
    arrive(angle = random() * 2 * Math.PI) {
      return add(0.9 * Math.cos(angle), 0.9 * Math.sin(angle), angle + Math.PI);
    },
    // Phages let out of a cell bursting at (fx, fy), spraying outward.
    burst(fx, fy, count) {
      const made = [];
      for (let i = 0; i < count; i++) {
        const heading = random() * 2 * Math.PI + (2 * Math.PI * i) / count;
        made.push(add(fx, fy, heading, PHAGE.GRACE_MS));
      }
      return made;
    },
    // Where a phage's tail tip is, in fractions of the dish radius.
    tip(phage) {
      return [phage.fx + TAIL * Math.cos(phage.heading), phage.fy + TAIL * Math.sin(phage.heading)];
    },
    // One frame: each phage swims toward the nearest of `cells` ({ fx, fy }),
    // your offspring, weaving a little, or straight on while it's fresh out
    // of a burst. It goes after `pal` (your pal, { fx, fy }) instead when
    // she's within PHAGE.NOTICE, or when there's nothing else to hunt, so
    // the cells you leave behind draw them away from her.
    step(seconds, cells, pal = null) {
      for (const phage of phages) {
        if (phage.grace > 0) {
          phage.grace -= seconds * 1000;
        } else {
          const near = pal && Math.hypot(pal.fx - phage.fx, pal.fy - phage.fy) < PHAGE.NOTICE;
          const target = near ? pal : (nearestCell(phage.fx, phage.fy, cells) ?? pal);
          if (target) {
            phage.wander += (random() - 0.5) * 6 * seconds;
            phage.wander = Math.max(-PHAGE.WANDER, Math.min(PHAGE.WANDER, phage.wander));
            phage.heading = Math.atan2(target.fy - phage.fy, target.fx - phage.fx) + phage.wander;
          }
        }
        phage.fx += Math.cos(phage.heading) * PHAGE.SPEED * seconds;
        phage.fy += Math.sin(phage.heading) * PHAGE.SPEED * seconds;
        // Stay on the agar.
        const out = Math.hypot(phage.fx, phage.fy);
        if (out > 0.92) {
          phage.fx *= 0.92 / out;
          phage.fy *= 0.92 / out;
        }
        place(phage);
      }
    },
    // A phage that has landed: it injects its DNA and its empty coat fades.
    remove(phage) {
      phages.splice(phages.indexOf(phage), 1);
      phage.el.classList.add('landed');
      const gone = () => phage.el.remove();
      phage.el.addEventListener('animationend', gone);
      setTimeout(gone, 600); // in case the animation never runs
    },
  };
}

// `you` is { svg, species }: your pal's drawing on the page and her settings
// from config.js. `level` is which level this is (1 to PHAGE.LEVELS.length),
// which sets how many phages start, and `target` is how many nutrients
// finish it. Returns the phages, for the tests.
export function playPhage({ you, nutrients, level = 1, target = PHAGE.TARGET, random = Math.random }) {
  const agar = document.querySelector('.agar');
  const counter = document.querySelector('.cell-count');
  const dishRadius = () => agar.clientWidth / 2;
  const pal = you.svg.dataset.pal;
  const name = you.svg.dataset.name;
  const color = you.species.color;

  const playerMover = document.querySelector('.pal-mover');
  playerMover.classList.add('player');
  const makeGroup = you.species.kind === 'rod' ? rodGroup : coccusGroup;
  const leader = makeGroup({ mover: playerMover, svg: you.svg, species: you.species, isPlayer: true });
  // Only what your pal eats herself counts toward winning; her offspring
  // eat and divide too, but don't add to it. There's no cap on the colony's
  // size, since it's the nutrients that count.
  let eaten = 0;
  const colony = makeColony({
    leader, nutrients, dishRadius, target: Infinity, color,
    onLeaderEat: (ate) => { eaten += ate; },
  });

  const swarm = phageSwarm(agar, random);
  // The first phages, one more each level, start spread evenly around the rim.
  const start = PHAGE.LEVELS[level - 1];
  const first = random() * 2 * Math.PI;
  for (let i = 0; i < start; i++) swarm.arrive(first + (2 * Math.PI * i) / start);

  const keys = arrowKeys();
  const touch = touchSteering(agar, agar.closest('.petri-dish') ?? agar);
  let finished = false;
  let lastTime = null;
  let elapsed = 0; // ms since the start
  let lysed = 0; // cells the phages have burst

  // The pop-up's buttons, like Classic's: the main one goes to the next
  // level, back to level 1 after the last, or tries this level again after a
  // game over; "Start over" goes back to level 1; "Choose a mode" goes back
  // to the modes.
  const last = PHAGE.LEVELS.length;
  let nextLevel = level;
  function goToLevel(n) {
    const url = new URL(window.location.href);
    url.searchParams.set('level', n);
    goTo(url.toString());
  }
  document.querySelector('.play-again').addEventListener('click', () => goToLevel(nextLevel));
  document.querySelector('.start-over').addEventListener('click', () => goToLevel(1));
  document.querySelector('.back-to-modes').addEventListener('click', () => goTo(`./choose-mode.html?pal=${pal}`));

  function updateCounter() {
    // Just the level and nutrients: counting cells and phages too was confusing.
    counter.textContent = `Level ${level} · ${Math.min(eaten, target)} / ${target} nutrients`;
  }

  // Cells a phage has landed on, filling up with new phages:
  // { group, cell, ms }, where `cell` is the infected cell of a chain or
  // cluster (an entry in group.cells), or null for a rod, which is one cell.
  const infections = [];

  // Every healthy cell in the dish, for the phages to hunt and land on, as
  // the circles that trace its outline (body()): one per cell of a chain or
  // cluster (`index` says which), and a few along each rod, so a phage has
  // to really touch a long, thin rod, not just come near it.
  function healthyCells(radius) {
    const cells = [];
    for (const group of colony.groups) {
      if (group.removeCells) {
        group.body().forEach(([x, y, r], index) => {
          if (!group.cells[index].infected) cells.push({ fx: x / radius, fy: y / radius, r: r / radius, group, index });
        });
      } else if (!group.infected) {
        for (const [x, y, r] of group.body()) cells.push({ fx: x / radius, fy: y / radius, r: r / radius, group });
      }
    }
    return cells;
  }

  const isHealthy = ({ group, index }) => !(group.removeCells ? group.cells[index].infected : group.infected);

  // A phage landing on `hit`, one of healthyCells(). In a chain or cluster
  // only that cell is infected (and only it turns dark and throbs, see
  // infectCell in coccus.js); the others can still be caught.
  function infect(hit) {
    const { group } = hit;
    if (group === leader) {
      lose();
      return;
    }
    if (group.removeCells) {
      infections.push({ group, cell: group.infectCell(hit.index), ms: PHAGE.LATENT_MS });
    } else {
      group.infected = true;
      group.pending = -Infinity; // busy making phages, not dividing
      group.mover.classList.add('infected');
      infections.push({ group, cell: null, ms: PHAGE.LATENT_MS });
    }
  }

  // An infected cell bursts: it dies and lets out new phages. A chain or
  // cluster loses just the infected cell; a rod, or the last cell of a
  // chain, goes whole.
  function lyse({ group, cell }, radius) {
    const dish = group.mover.parentElement;
    const body = group.body();
    let [x, y] = [group.x, group.y];
    if (cell && body.length > 1) {
      const i = group.cells.indexOf(cell);
      [x, y] = body[i];
      showPop(dish, body[i], color);
      group.removeCells([i]);
    } else {
      if (cell) [x, y] = body[0];
      showPop(dish, [group.x, group.y, group.reach()], color);
      colony.groups.splice(colony.groups.indexOf(group), 1);
      group.mover.remove();
    }
    lysed++;
    swarm.burst(x / radius, y / radius, PHAGE.BURST);
  }

  function step(time) {
    const seconds = lastTime === null ? 0 : Math.min(0.05, (time - lastTime) / 1000);
    lastTime = time;
    const radius = dishRadius();

    if (!finished) {
      steer(leader, keys.direction(), touch.target(), GAME.SPEED * radius * seconds, GAME.ARRIVE * radius,
        touch.drag(), GAME.DRAG_SPEED * radius * seconds);
    }

    colony.tick(seconds);
    moveGroups(colony.groups, { agar, radius, seconds });

    if (!finished) {
      elapsed += seconds * 1000;
      if (elapsed >= PHAGE.START_MS) {
        const cells = healthyCells(radius);
        swarm.step(seconds, cells.filter((cell) => cell.group !== leader), { fx: leader.x / radius, fy: leader.y / radius });
        // Any phage whose tail touches a healthy cell lands on it.
        for (const phage of [...swarm.phages]) {
          if (phage.grace > 0) continue;
          const [tx, ty] = swarm.tip(phage);
          const hit = cells.find((cell) => isHealthy(cell) &&
            Math.hypot(cell.fx - tx, cell.fy - ty) < cell.r);
          if (!hit) continue;
          swarm.remove(phage);
          infect(hit);
          if (finished) break;
        }
      }
    }

    if (!finished) {
      // Infected cells burst when their time is up.
      for (const infection of [...infections]) {
        infection.ms -= seconds * 1000;
        if (infection.ms > 0) continue;
        infections.splice(infections.indexOf(infection), 1);
        lyse(infection, radius);
      }
      colony.eat(seconds, radius);
      if (eaten >= target) win();
      else colony.divideLeader();
      updateCounter();
    }

    requestAnimationFrame(step);
  }

  function stop() {
    finished = true;
    keys.stop();
    touch.stop();
    nutrients.stop();
    updateCounter();
  }

  function win() {
    stop();
    sporeBurst(playerMover, { big: level === last });
    track(`phage/level-complete/${pal}/level-${level}`, `${name} finished Phage Attack level ${level}`);
    if (level === last) track(`phage/won-all-levels/${pal}`, `${name} beat every Phage Attack level`);
    setTimeout(() => {
      showFact(pal, you.species);
      const ate = `You ate ${target} nutrients before the phages could stop you.`;
      if (level < last) {
        nextLevel = level + 1;
        showBanner(`Level ${level} complete!`, ate, `Play level ${nextLevel}`);
      } else {
        nextLevel = 1;
        showBanner('You outgrew the phages!', `You beat all ${last} levels! ${ate}`, 'Play again');
      }
    }, Math.max(0, GAME.DIVIDE_MS - colony.sinceAnyDivision));
  }

  function lose() {
    stop();
    playerMover.classList.add('killed');
    track(`phage/lost/${pal}/level-${level}`, `${name} was caught by a phage on level ${level}`);
    setTimeout(() => {
      showFact(pal, you.species);
      const lost = lysed === 0 ? '' : ` They burst ${lysed} ${lysed === 1 ? 'cell' : 'cells'} of her colony first.`;
      showBanner('Game over', `A phage landed on ${name} and injected its DNA. Phages are viruses that infect bacteria!${lost}`,
        `Try level ${level} again`, { startOver: level > 1 }); // on level 1 "Start over" would just try again
    }, 500);
  }

  function showBanner(title, message, button, { startOver = false } = {}) {
    const banner = document.querySelector('.win-banner');
    banner.querySelector('h2').textContent = title;
    banner.querySelector('.win-message').textContent = message;
    banner.querySelector('.play-again').textContent = button;
    banner.querySelector('.start-over').hidden = !startOver;
    banner.querySelector('.back-to-modes').hidden = false;
    banner.removeAttribute('hidden');
    banner.querySelector('.play-again').focus();
  }

  updateCounter();
  requestAnimationFrame(step);
  return { swarm };
}
