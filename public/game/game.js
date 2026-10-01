// The game loop: arrow-key steering, dividing as the player eats, the cell
// counter, the antibiotic disks, and the level-complete, win or game-over
// pop-up.
import { pushOffDisks, touchedDisk } from './antibiotic.js';
import { GAME, LEVELS } from './config.js';
import { coccusGroup } from './coccus.js';
import { keepInDish, pushApart, pushInsideRim } from './physics.js';
import { rodGroup } from './rod.js';
import { sporeBurst } from './spores.js';
import { track } from './track.js';

// `level` is which level this is (1 to 5) and `target` how many cells it
// takes to beat it.
export function playGame(palEl, species, nutrients, disks, { level = 1, target = LEVELS[0].target } = {}) {
  const agar = document.querySelector('.agar');
  const counter = document.querySelector('.cell-count');
  const dishRadius = () => agar.clientWidth / 2;

  // Every living group in the dish. The first is the one the player steers.
  const playerMover = document.querySelector('.pal-mover');
  playerMover.classList.add('player');
  const makeGroup = species.kind === 'rod' ? rodGroup : coccusGroup;
  const player = makeGroup({ mover: playerMover, svg: palEl, species, isPlayer: true });
  const groups = [player];

  let pending = 0; // nutrients the player has eaten toward the next division
  let sinceDivision = Infinity; // ms since the player last divided
  let sinceAnyDivision = Infinity; // ms since any cell last divided
  let finished = false;
  let lastTime = null;

  const directions = {
    ArrowUp: [0, -1],
    ArrowDown: [0, 1],
    ArrowLeft: [-1, 0],
    ArrowRight: [1, 0],
  };
  const held = new Set();

  window.addEventListener('keydown', (event) => {
    if (!(event.key in directions)) return;
    event.preventDefault(); // stop arrow keys from scrolling the page
    if (!finished) held.add(event.key);
  });
  window.addEventListener('keyup', (event) => held.delete(event.key));
  // Don't keep moving if the window loses focus while a key is down.
  window.addEventListener('blur', () => held.clear());

  // The pop-up's buttons: the main one goes to the next level, back to
  // level 1, or tries this level again; after a game over, "Start over" goes
  // back to level 1.
  let nextLevel = level;
  function goToLevel(n) {
    const url = new URL(window.location.href);
    url.searchParams.set('level', n);
    window.location.href = url.toString();
  }
  document.querySelector('.play-again').addEventListener('click', () => goToLevel(nextLevel));
  document.querySelector('.start-over').addEventListener('click', () => goToLevel(1));

  const totalCells = () => groups.reduce((sum, g) => sum + g.cellCount(), 0);

  function updateCounter() {
    const shown = Math.min(totalCells(), target);
    counter.textContent = `Level ${level} · ${shown} / ${target} cells`;
  }

  // Binary fission: a cell divides and the daughter stays behind. A rod's
  // daughter slides off on its own; a coccus's daughter joins a nearby chain
  // or cluster (maybe the one it came from), or starts a new one. `from` is
  // where the dividing cell is, for cocci.
  function divideGroup(group, from) {
    sinceAnyDivision = 0;
    const others = groups.filter((g) => g !== player);
    const offspring = group.divide(others, dishRadius(), disks, from);
    if (offspring) {
      // Size and position the new cell right away. Otherwise the browser draws
      // it once at the center of the dish before this frame's positioning
      // catches up, which shows up as a flash.
      offspring.update(0);
      offspring.place();
      groups.push(offspring);
    }
    updateCounter();
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

  function dividePlayer() {
    pending -= GAME.NUTRIENTS_PER_DIVISION;
    sinceDivision = 0;
    divideGroup(player);
  }

  // Offspring eat any nutrient they touch, whether they land on it or it
  // pops up under them, and divide in two just like the player.
  function feedOffspring(seconds, radius) {
    for (const group of [...groups]) {
      if (group === player) continue;
      group.pending ??= 0;
      group.sinceDivision = (group.sinceDivision ?? Infinity) + seconds * 1000;
      for (const [mx, my, reach] of group.body()) {
        const ate = nutrients.eatNear(mx / radius, my / radius, reach / radius);
        if (ate === 0) continue;
        group.pending += ate;
        group.from = [mx, my]; // for cocci, the cell that ate is the one that divides
      }
      if (group.pending >= GAME.NUTRIENTS_PER_DIVISION && group.sinceDivision > GAME.DIVIDE_MS &&
          totalCells() < target) {
        group.pending -= GAME.NUTRIENTS_PER_DIVISION;
        group.sinceDivision = 0;
        divideGroup(group, group.from);
      }
    }
  }

  function step(time) {
    const seconds = lastTime === null ? 0 : Math.min(0.05, (time - lastTime) / 1000);
    lastTime = time;
    const radius = dishRadius();

    // Steer the player's group.
    if (!finished) {
      let dx = 0;
      let dy = 0;
      for (const key of held) {
        dx += directions[key][0];
        dy += directions[key][1];
      }
      if (dx !== 0 || dy !== 0) {
        const length = Math.hypot(dx, dy); // same speed on diagonals
        player.x += (dx / length) * GAME.SPEED * radius * seconds;
        player.y += (dy / length) * GAME.SPEED * radius * seconds;
        if (dx !== 0) player.facing = Math.sign(dx);
      }
    }

    sinceDivision += seconds * 1000;
    sinceAnyDivision += seconds * 1000;

    for (const group of groups) {
      if (group !== player) group.coast(seconds);
      group.update(seconds);
    }
    // Measure every group once, after all the size changes, instead of
    // measuring between writes (which makes the browser re-lay-out each time).
    for (const group of groups) group.size = group.reach();
    pushApart(groups, player);
    // Offspring keep a little clear space around each antibiotic disk: nudge
    // any that slid too close back out, and stop them from sliding further in.
    // Offspring also stay inside the rim, checked cell by cell (a long chain
    // isn't one big circle). Then the disks get one more say, so the rim can
    // never push a chain back onto a disk.
    for (const group of groups) {
      if (group === player) {
        [group.x, group.y] = keepInDish(agar, group.x, group.y, group.size, group);
      } else {
        nudge(group, pushOffDisks(disks, group.body(), radius, GAME.DISK_BUFFER));
        nudge(group, pushInsideRim(group.body(), radius));
        nudge(group, pushOffDisks(disks, group.body(), radius, GAME.DISK_BUFFER));
      }
      group.place();
    }

    // Touching any antibiotic disk is game over.
    const hit = finished ? null : touchedDisk(disks, player.body(), radius, GAME.TOUCH_MARGIN);
    if (hit) {
      finished = true;
      held.clear();
      nutrients.stop();
      playerMover.classList.add('killed');
      setTimeout(() => showGameOver(hit), 500);
    }

    if (!finished) {
      let ate = 0;
      for (const [px, py, reach] of player.body()) {
        ate += nutrients.eatNear(px / radius, py / radius, reach / radius);
      }
      pending += ate;
      feedOffspring(seconds, radius);

      const won = totalCells() >= target;
      if (won && sinceAnyDivision > GAME.DIVIDE_MS + 300) {
        finished = true;
        held.clear();
        nutrients.stop();
        setTimeout(showWin, 300);
      } else if (!won && pending >= GAME.NUTRIENTS_PER_DIVISION &&
                 sinceDivision > GAME.DIVIDE_MS) {
        dividePlayer();
      }
    }

    requestAnimationFrame(step);
  }

  function showBanner(title, message, button, { startOver = false } = {}) {
    const banner = document.querySelector('.win-banner');
    banner.querySelector('h2').textContent = title;
    banner.querySelector('.win-message').textContent = message;
    banner.querySelector('.play-again').textContent = button;
    banner.querySelector('.start-over').hidden = !startOver;
    banner.removeAttribute('hidden');
    banner.querySelector('.play-again').focus();
  }

  function showWin() {
    sporeBurst(playerMover, { big: level === LEVELS.length });
    const name = palEl.dataset.name;
    const pal = palEl.dataset.pal;
    track(`level-complete/${pal}/level-${level}`, `${name} finished level ${level}`);
    if (level === LEVELS.length) track(`won-all-levels/${pal}`, `${name} beat every level`);
    if (level < LEVELS.length) {
      nextLevel = level + 1;
      showBanner(`Level ${level} complete!`, `${name} grew a colony of ${target} cells!`,
        `Play level ${nextLevel}`);
    } else {
      nextLevel = 1;
      showBanner('You won!', `${name} beat all ${LEVELS.length} levels with a colony of ${target} cells!`,
        'Play again');
    }
  }

  function showGameOver(disk) {
    const { code, name } = disk.antibiotic;
    track(`game-over/${palEl.dataset.pal}/level-${level}/${code}`,
      `${palEl.dataset.name} hit ${name} on level ${level}`);
    showBanner(
      'Game over',
      `${palEl.dataset.name} touched the ${disk.antibiotic.name} disk. Antibiotics kill bacteria!`,
      `Try level ${level} again`,
      { startOver: level > 1 }, // on level 1 they'd do the same thing
    );
  }

  // Keep the how-to-play target in step with the real one.
  for (const el of document.querySelectorAll('.target-cells')) el.textContent = target;
  updateCounter();
  requestAnimationFrame(step);
}
