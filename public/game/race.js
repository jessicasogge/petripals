// Mixed culture mode: you and a rival pal steered by the computer race to
// grow a colony of MIXED.TARGET cells first. No antibiotic disks, just a
// shared plate of nutrients.
import { makeColony, moveGroups } from './colony.js';
import { GAME, MIXED } from './config.js';
import { coccusGroup } from './coccus.js';
import { arrowKeys } from './keyboard.js';
import { rivalBrain } from './rival.js';
import { rodGroup } from './rod.js';
import { sporeBurst } from './spores.js';
import { steer, touchSteering } from './touch.js';
import { track } from './track.js';

const groupFor = (species) => (species.kind === 'rod' ? rodGroup : coccusGroup);

// `you` and `rival` are { svg, species }: the pal's drawing on the page and
// its settings from config.js.
export function playRace({ you, rival, nutrients }) {
  const agar = document.querySelector('.agar');
  const counter = document.querySelector('.cell-count');
  const dishRadius = () => agar.clientWidth / 2;
  const target = MIXED.TARGET;
  const yourName = you.svg.dataset.name;
  const rivalName = rival.svg.dataset.name;

  // Your pal, in the page's pal holder.
  const playerMover = document.querySelector('.pal-mover');
  playerMover.classList.add('player');
  const yourLeader = groupFor(you.species)({ mover: playerMover, svg: you.svg, species: you.species, isPlayer: true });

  // The rival: a copy of its drawing in a holder of its own.
  const rivalSvg = rival.svg.cloneNode(true);
  rivalSvg.removeAttribute('hidden');
  rivalSvg.setAttribute('aria-label', `${rivalName}, your rival`);
  const rivalMover = document.createElement('div');
  rivalMover.className = 'pal-mover rival';
  rivalMover.appendChild(rivalSvg);
  agar.appendChild(rivalMover);
  const rivalLeader = groupFor(rival.species)({ mover: rivalMover, svg: rivalSvg, species: rival.species, isPlayer: true });

  // Start on opposite sides of the dish, facing each other.
  const start = 0.3 * dishRadius();
  yourLeader.x = -start;
  rivalLeader.x = start;
  rivalLeader.facing = -1;

  const yours = makeColony({ leader: yourLeader, nutrients, dishRadius, target, onDivide: () => updateCounter() });
  const theirs = makeColony({ leader: rivalLeader, nutrients, dishRadius, target, onDivide: () => updateCounter() });
  const brain = rivalBrain(rivalLeader, nutrients);
  const keys = arrowKeys();
  // On a touch screen (or with a mouse), touch and hold where to swim.
  const touch = touchSteering(agar);
  let finished = false;
  let lastTime = null;

  // "Race again" brings a new random rival; "Play classic" goes to the levels.
  document.querySelector('.play-again').addEventListener('click', () => {
    const url = new URL(window.location.href);
    url.searchParams.delete('rival');
    window.location.href = url.toString();
  });
  document.querySelector('.start-over').addEventListener('click', () => {
    window.location.href = `./petri-dish.html?pal=${you.svg.dataset.pal}`;
  });

  function updateCounter() {
    counter.replaceChildren(
      tally(yourName, Math.min(yours.cellCount(), target), you.species.color),
      ' · ',
      tally(rivalName, Math.min(theirs.cellCount(), target), rival.species.color),
      ` / ${target} cells`,
    );
  }

  function step(time) {
    const seconds = lastTime === null ? 0 : Math.min(0.05, (time - lastTime) / 1000);
    lastTime = time;
    const radius = dishRadius();

    if (!finished) {
      // Steer your pal; the computer steers the rival.
      steer(yourLeader, keys.direction(), touch.target(), GAME.SPEED * radius * seconds, GAME.ARRIVE * radius);
      brain.step(seconds, radius);
    }

    yours.tick(seconds);
    theirs.tick(seconds);
    moveGroups([...yours.groups, ...theirs.groups], { agar, radius, seconds });

    if (!finished) {
      yours.eat(seconds, radius);
      theirs.eat(seconds, radius);
      if (yours.cellCount() >= target) {
        finish(true);
      } else if (theirs.cellCount() >= target) {
        finish(false);
      } else {
        yours.divideLeader();
        theirs.divideLeader();
      }
    }

    requestAnimationFrame(step);
  }

  function finish(won) {
    finished = true;
    keys.stop();
    touch.stop();
    nutrients.stop();
    updateCounter();
    const winner = won ? yours : theirs;
    sporeBurst(won ? playerMover : rivalMover);
    const pals = `${you.svg.dataset.pal}/vs-${rival.svg.dataset.pal}`;
    track(`mixed/${won ? 'won' : 'lost'}/${pals}`, `${yourName} ${won ? 'beat' : 'lost to'} ${rivalName} in mixed culture`);
    setTimeout(() => {
      if (won) {
        showBanner('You won the race!', `Your colony reached ${target} cells before ${rivalName}'s did.`);
      } else {
        showBanner('You lost!', `${rivalName} took over the plate, reaching ${target} cells first.`);
      }
    }, Math.max(0, GAME.DIVIDE_MS - winner.sinceAnyDivision));
  }

  function showBanner(title, message) {
    const banner = document.querySelector('.win-banner');
    banner.querySelector('h2').textContent = title;
    banner.querySelector('.win-message').textContent = message;
    banner.querySelector('.play-again').textContent = 'Race again';
    const classic = banner.querySelector('.start-over');
    classic.textContent = 'Play classic';
    classic.hidden = false;
    banner.removeAttribute('hidden');
    banner.querySelector('.play-again').focus();
  }

  updateCounter();
  requestAnimationFrame(step);
}

// "Mona 9", with the name in the pal's color.
function tally(name, count, color) {
  const span = document.createElement('span');
  const strong = document.createElement('span');
  strong.textContent = name;
  strong.style.color = color;
  span.append(strong, ` ${count}`);
  return span;
}
