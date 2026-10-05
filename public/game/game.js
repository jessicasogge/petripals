// The classic game loop: steer with the arrow keys or by touch, grow a colony past the
// antibiotic disks, and the level-complete, win or game-over pop-up.
import { spreadZones, touchedDisk, touchMessage } from './antibiotic.js';
import { makeColony, moveGroups } from './colony.js';
import { GAME, LEVELS } from './config.js';
import { coccusGroup } from './coccus.js';
import { showFact } from './facts.js';
import { arrowKeys } from './keyboard.js';
import { goTo } from './loading.js';
import { rodGroup } from './rod.js';
import { sporeBurst } from './spores.js';
import { steer, touchSteering } from './touch.js';
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
    leader: player, nutrients, disks, dishRadius, target, color: species.color,
    onDivide: () => updateCounter(), onPop: () => updateCounter(),
  });

  let finished = false;
  let lastTime = null;
  // How long the level has been running, for how far the zones have spread.
  // Built from the same capped frame times as everything else, so the zones
  // don't jump ahead after the tab was hidden for a while.
  let elapsed = 0;
  const keys = arrowKeys();
  // On a touch screen (or with a mouse), touch and hold where to swim.
  const touch = touchSteering(agar);

  // The pop-up's buttons: the main one goes to the next level, back to
  // level 1, or tries this level again; after a game over, "Start over" goes
  // back to level 1.
  let nextLevel = level;
  function goToLevel(n) {
    const url = new URL(window.location.href);
    url.searchParams.set('level', n);
    goTo(url.toString());
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

    // The drugs keep soaking outward until the level ends.
    if (!finished) {
      elapsed += seconds;
      spreadZones(disks, elapsed);
    }

    // Steer the player's pal.
    if (!finished) {
      steer(player, keys.direction(), touch.target(), GAME.SPEED * radius * seconds, GAME.ARRIVE * radius,
        touch.onLoop() ? { step: GAME.LOOP_SPEED * radius * seconds, slip: GAME.LOOP_SLIP * radius } : null);
    }

    colony.tick(seconds);
    moveGroups(colony.groups, { agar, radius, seconds });
    // Offspring that wander into an antibiotic zone pop.
    if (!finished) colony.popInZones(radius);

    // Touching any antibiotic disk, or the zone of inhibition around it, is
    // game over.
    const hit = finished ? null : touchedDisk(disks, player.body(), radius);
    if (hit) {
      finished = true;
      keys.stop();
      touch.stop();
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
        touch.stop();
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
    showFact(pal, species);
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
    showFact(palEl.dataset.pal, species);
    const { code, name } = disk.antibiotic;
    track(`game-over/${palEl.dataset.pal}/level-${level}/${code}`,
      `${palEl.dataset.name} hit ${name} on level ${level}`);
    showBanner(
      'Game over',
      touchMessage(palEl.dataset.name, disk),
      `Try level ${level} again`,
      { startOver: level > 1 }, // on level 1 they'd do the same thing
    );
  }

  // The zones start small and spread from there (drawn before the first frame).
  spreadZones(disks, 0);

  // Keep the how-to-play target in step with the real one.
  for (const el of document.querySelectorAll('.target-cells')) el.textContent = target;
  updateCounter();
  requestAnimationFrame(step);
}
