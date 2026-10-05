// Mixed culture mode: you and one to three rival pals steered by the
// computer race to grow a colony of the target size first. No antibiotic
// disks, just a shared plate of nutrients.
import { makeColony, moveGroups } from './colony.js';
import { GAME } from './config.js';
import { coccusGroup } from './coccus.js';
import { arrowKeys } from './keyboard.js';
import { rivalBrain } from './rival.js';
import { listOf } from './rivals.js';
import { rodGroup } from './rod.js';
import { showFact } from './facts.js';
import { sporeBurst } from './spores.js';
import { steer, touchSteering } from './touch.js';
import { track } from './track.js';

const groupFor = (species) => (species.kind === 'rod' ? rodGroup : coccusGroup);

// `you` is { svg, species }: your pal's drawing on the page and its settings
// from config.js. `rivals` are the same for each of the one to three rival
// pals, and `target` is how many cells win.
export function playRace({ you, rivals, nutrients, target }) {
  const agar = document.querySelector('.agar');
  const counter = document.querySelector('.cell-count');
  const dishRadius = () => agar.clientWidth / 2;
  const yourName = you.svg.dataset.name;
  const rivalNames = rivals.map((rival) => rival.svg.dataset.name);

  // Your pal, in the page's pal holder.
  const playerMover = document.querySelector('.pal-mover');
  playerMover.classList.add('player');
  const yourLeader = groupFor(you.species)({ mover: playerMover, svg: you.svg, species: you.species, isPlayer: true });
  const yours = makeColony({ leader: yourLeader, nutrients, dishRadius, target, onDivide: () => updateCounter() });

  // Each rival: a copy of its drawing in a holder of its own.
  const others = rivals.map((rival, i) => {
    const svg = rival.svg.cloneNode(true);
    svg.removeAttribute('hidden');
    svg.setAttribute('aria-label', `${rivalNames[i]}, your rival`);
    const mover = document.createElement('div');
    mover.className = 'pal-mover rival';
    mover.appendChild(svg);
    agar.appendChild(mover);
    const leader = groupFor(rival.species)({ mover, svg, species: rival.species, isPlayer: true });
    const colony = makeColony({ leader, nutrients, dishRadius, target, onDivide: () => updateCounter() });
    return { ...rival, name: rivalNames[i], mover, leader, colony, brain: null };
  });

  // Everyone starts spaced evenly around the dish: you on the left, and with
  // one rival, it's straight across. Rivals face the middle.
  const start = 0.3 * dishRadius();
  const spots = rivals.length + 1;
  yourLeader.x = -start;
  others.forEach((rival, i) => {
    const angle = Math.PI + (2 * Math.PI * (i + 1)) / spots;
    rival.leader.x = round(start * Math.cos(angle));
    rival.leader.y = round(start * Math.sin(angle));
    rival.leader.facing = rival.leader.x > 0 ? -1 : 1;
    rival.brain = rivalBrain(rival.leader, nutrients);
  });

  const keys = arrowKeys();
  // On a touch screen (or with a mouse), touch and hold where to swim.
  const touch = touchSteering(agar);
  let finished = false;
  let lastTime = null;

  // "Race again" goes back to picking rivals; "Play classic" goes to the levels.
  document.querySelector('.play-again').addEventListener('click', () => {
    window.location.href = `./choose-rivals.html?pal=${you.svg.dataset.pal}`;
  });
  document.querySelector('.start-over').addEventListener('click', () => {
    window.location.href = `./petri-dish.html?pal=${you.svg.dataset.pal}`;
  });

  function updateCounter() {
    const tallies = [
      tally(yourName, Math.min(yours.cellCount(), target), you.species.color),
      ...others.map((rival) => tally(rival.name, Math.min(rival.colony.cellCount(), target), rival.species.color)),
    ];
    counter.replaceChildren(...tallies.flatMap((t, i) => (i === 0 ? [t] : [' · ', t])), ` / ${target} cells`);
  }

  function step(time) {
    const seconds = lastTime === null ? 0 : Math.min(0.05, (time - lastTime) / 1000);
    lastTime = time;
    const radius = dishRadius();
    const colonies = [yours, ...others.map((rival) => rival.colony)];

    if (!finished) {
      // Steer your pal; the computer steers the rivals.
      steer(yourLeader, keys.direction(), touch.target(), GAME.SPEED * radius * seconds, GAME.ARRIVE * radius);
      for (const rival of others) rival.brain.step(seconds, radius);
    }

    for (const colony of colonies) colony.tick(seconds);
    moveGroups(colonies.flatMap((colony) => colony.groups), { agar, radius, seconds });

    if (!finished) {
      for (const colony of colonies) colony.eat(seconds, radius);
      // You win a tie.
      const winner = colonies.findIndex((colony) => colony.cellCount() >= target);
      if (winner === 0) finish(null);
      else if (winner > 0) finish(others[winner - 1]);
      else for (const colony of colonies) colony.divideLeader();
    }

    requestAnimationFrame(step);
  }

  // `beaten` is the rival who got there first, or null if you did.
  function finish(beaten) {
    finished = true;
    const won = beaten === null;
    keys.stop();
    touch.stop();
    nutrients.stop();
    updateCounter();
    const winner = won ? yours : beaten.colony;
    sporeBurst(won ? playerMover : beaten.mover);
    const pals = `${you.svg.dataset.pal}/vs-${rivals.map((rival) => rival.svg.dataset.pal).join('+')}`;
    const versus = listOf(rivalNames);
    track(`mixed/${won ? 'won' : 'lost'}/${pals}`, `${yourName} ${won ? 'beat' : 'lost to'} ${versus} in mixed culture`);
    setTimeout(() => {
      // A fun fact about your pal, win or lose.
      showFact(you.svg.dataset.pal, you.species);
      if (won) {
        const before = rivals.length > 1 ? 'any of your rivals did' : `${rivalNames[0]}'s did`;
        showBanner('You won the race!', `Your colony reached ${target} cells before ${before}.`);
      } else {
        showBanner('You lost!', `${beaten.name} took over the plate, reaching ${target} cells first.`);
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

// Rounded to a hundredth of a pixel, so a rival straight across starts at
// exactly the opposite spot from you.
const round = (n) => Math.round(n * 100) / 100 || 0;

// "Mona 9", with the name in the pal's color.
function tally(name, count, color) {
  const span = document.createElement('span');
  const strong = document.createElement('span');
  strong.textContent = name;
  strong.style.color = color;
  span.append(strong, ` ${count}`);
  return span;
}
