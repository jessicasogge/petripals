// The classic game loop: steer with the arrow keys, grow a colony past the
// antibiotic disks, and the level-complete, win or game-over pop-up.
import { touchedDisk } from './antibiotic.js';
import { makeColony, moveGroups } from './colony.js';
import { GAME, LEVELS } from './config.js';
import { coccusGroup } from './coccus.js';
import { arrowKeys } from './keyboard.js';
import { rodGroup } from './rod.js';
import { sporeBurst } from './spores.js';
import { track } from './track.js';

// `level` is which level this is (1 to 7) and `target` how many cells it
// takes to beat it.
export function playGame(palEl, species, nutrients, disks, { level = 1, target = LEVELS[0].target } = {}) {
  const agar = document.querySelector('.agar');
  const counter = document.querySelector('.cell-count');
  const dishRadius = () => agar.clientWidth / 2;

  // The player's pal leads the colony.
  const playerMover = document.querySelector('.pal-mover');
  playerMover.classList.add('player');
  const makeGroup = species.kind === 'rod' ? rodGroup : coccusGroup;
  const player = makeGroup({ mover: playerMover, svg: palEl, species, isPlayer: true });
  const colony = makeColony({
    leader: player, nutrients, disks, dishRadius, target, onDivide: () => updateCounter(),
  });

  let finished = false;
  let lastTime = null;
  const keys = arrowKeys();

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

  function updateCounter() {
    const shown = Math.min(colony.cellCount(), target);
    counter.textContent = `Level ${level} · ${shown} / ${target} cells`;
  }

  function step(time) {
    const seconds = lastTime === null ? 0 : Math.min(0.05, (time - lastTime) / 1000);
    lastTime = time;
    const radius = dishRadius();

    // Steer the player's pal.
    if (!finished) {
      const [dx, dy] = keys.direction();
      if (dx !== 0 || dy !== 0) {
        const length = Math.hypot(dx, dy); // same speed on diagonals
        player.x += (dx / length) * GAME.SPEED * radius * seconds;
        player.y += (dy / length) * GAME.SPEED * radius * seconds;
        if (dx !== 0) player.facing = Math.sign(dx);
      }
    }

    colony.tick(seconds);
    moveGroups(colony.groups, { agar, radius, seconds, disks });

    // Touching any antibiotic disk, or the zone of inhibition around it, is
    // game over.
    const hit = finished ? null : touchedDisk(disks, player.body(), radius, GAME.TOUCH_MARGIN);
    if (hit) {
      finished = true;
      keys.stop();
      nutrients.stop();
      playerMover.classList.add('killed');
      setTimeout(() => showGameOver(hit), 500);
    }

    if (!finished) {
      colony.eat(seconds, radius);

      if (colony.cellCount() >= target) {
        // Celebrate the moment the colony is big enough, and stop play so a
        // disk can't be touched after winning. The pop-up waits only until
        // the newest cell has finished sliding into place.
        finished = true;
        keys.stop();
        nutrients.stop();
        sporeBurst(playerMover, { big: level === LEVELS.length });
        setTimeout(showWin, Math.max(0, GAME.DIVIDE_MS - colony.sinceAnyDivision));
      } else {
        colony.divideLeader();
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
    const name = palEl.dataset.name;
    const pal = palEl.dataset.pal;
    track(`level-complete/${pal}/level-${level}`, `${name} finished level ${level}`);
    if (level === LEVELS.length) track(`won-all-levels/${pal}`, `${name} beat every level`);
    if (level < LEVELS.length) {
      nextLevel = level + 1;
      showBanner(`Level ${level} complete!`, `You grew a colony of ${target} cells!`,
        `Play level ${nextLevel}`);
    } else {
      nextLevel = 1;
      showBanner('You won!', `You beat all ${LEVELS.length} levels with a colony of ${target} cells!`,
        'Play again');
    }
  }

  function showGameOver(disk) {
    const { code, name } = disk.antibiotic;
    track(`game-over/${palEl.dataset.pal}/level-${level}/${code}`,
      `${palEl.dataset.name} hit ${name} on level ${level}`);
    showBanner(
      'Game over',
      `${palEl.dataset.name} swam into the ${disk.antibiotic.name} zone of inhibition. Antibiotics kill bacteria!`,
      `Try level ${level} again`,
      { startOver: level > 1 }, // on level 1 they'd do the same thing
    );
  }

  // Keep the how-to-play target in step with the real one.
  for (const el of document.querySelectorAll('.target-cells')) el.textContent = target;
  updateCounter();
  requestAnimationFrame(step);
}
