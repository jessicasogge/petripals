// The game loop: arrow-key steering, dividing as the player eats, the cell
// counter, and the win banner.
import { GAME } from './config.js';
import { coccusGroup } from './coccus.js';
import { keepInDish, pushApart } from './physics.js';
import { rodGroup } from './rod.js';

export function playGame(buddyEl, species, nutrients) {
  const agar = document.querySelector('.agar');
  const counter = document.querySelector('.cell-count');
  const dishRadius = () => agar.clientWidth / 2;

  // Every living group in the dish. The first is the one the player steers.
  const playerMover = document.querySelector('.buddy-mover');
  playerMover.classList.add('player');
  const makeGroup = species.kind === 'rod' ? rodGroup : coccusGroup;
  const player = makeGroup({ mover: playerMover, svg: buddyEl, species, isPlayer: true });
  const groups = [player];

  let pending = 0; // nutrients eaten toward the next division
  let sinceDivision = Infinity; // ms since the last division
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

  document.querySelector('.play-again').addEventListener('click', () => {
    window.location.reload();
  });

  const totalCells = () => groups.reduce((sum, g) => sum + g.cellCount(), 0);

  function updateCounter() {
    const shown = Math.min(totalCells(), GAME.TARGET_CELLS);
    counter.textContent = `${shown} / ${GAME.TARGET_CELLS} cells`;
  }

  // Binary fission: the player's cell divides and the daughter stays behind.
  // A rod's daughter slides off on its own; a coccus's daughter joins a nearby
  // chain or cluster, or starts a new one. Offspring never divide themselves.
  function dividePlayer() {
    pending -= GAME.NUTRIENTS_PER_DIVISION;
    sinceDivision = 0;
    const offspring = player.divide(groups.filter((g) => g !== player), dishRadius());
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

    for (const group of groups) {
      if (group !== player) group.coast(seconds);
      group.update(seconds);
    }
    // Measure every group once, after all the size changes, instead of
    // measuring between writes (which makes the browser re-lay-out each time).
    for (const group of groups) group.size = group.reach();
    pushApart(groups, player);
    for (const group of groups) {
      [group.x, group.y] = keepInDish(agar, group.x, group.y, group.size, group);
      group.place();
    }

    if (!finished) {
      let ate = 0;
      for (const [px, py, reach] of player.mouths()) {
        ate += nutrients.eatNear(px / radius, py / radius, reach / radius);
      }
      pending += ate;

      const won = totalCells() >= GAME.TARGET_CELLS;
      if (won && sinceDivision > GAME.DIVIDE_MS + 300) {
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

  function showWin() {
    const banner = document.querySelector('.win-banner');
    banner.querySelector('.win-message').textContent =
      `${buddyEl.dataset.name} grew a colony of ${GAME.TARGET_CELLS} cells!`;
    banner.removeAttribute('hidden');
    banner.querySelector('.play-again').focus();
  }

  updateCounter();
  requestAnimationFrame(step);
}
