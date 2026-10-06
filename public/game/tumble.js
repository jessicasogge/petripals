// Run & tumble mode: no steering. Your pal swims in a straight line on her
// own (a "run"), and a tap, or the space bar or an arrow key, makes her
// tumble: she spins on the spot and sets off a random new way. That's how
// real swimming bacteria find food (chemotaxis). They can't see it, but they
// can smell whether the sugar around them is getting stronger, and they keep
// running while it is and tumble sooner when it isn't.
import { makeColony, moveGroups } from './colony.js';
import { GAME, TUMBLE } from './config.js';
import { coccusGroup } from './coccus.js';
import { showFact } from './facts.js';
import { goTo } from './loading.js';
import { rodGroup } from './rod.js';
import { sporeBurst } from './spores.js';
import { track } from './track.js';

// The keys that tumble her.
const TUMBLE_KEYS = new Set([' ', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']);

// How sweet the agar smells at (fx, fy), from every fleck in `flecks`
// ({ fx, fy }, all in fractions of the dish radius): each fleck's sugar is
// strongest right on it and fades with distance, over about `scent`.
export function sweetness(fx, fy, flecks, scent = TUMBLE.SCENT) {
  let total = 0;
  for (const fleck of flecks) {
    const d = Math.hypot(fleck.fx - fx, fleck.fy - fy) / scent;
    total += Math.exp(-d * d);
  }
  return total;
}

// Swims `group` (the player's pal) straight ahead, and tumbles her on
// tumble(). `random` picks her new heading, for the tests.
export function swimmer(group, random = Math.random) {
  let heading = group.facing < 0 ? Math.PI : 0; // straight ahead, the way she faces
  let tumbling = 0; // ms left of a tumble

  return {
    heading: () => heading,
    tumbling: () => tumbling > 0,
    // Start a tumble, unless she's already in one. Returns whether she did.
    tumble() {
      if (tumbling > 0) return false;
      tumbling = TUMBLE.TUMBLE_MS;
      return true;
    },
    // One frame: spin on the spot if tumbling (and face a random new way when
    // it's done), otherwise swim `distance` px ahead. She bounces off the rim
    // of a dish of radius `radius` instead of pushing into it.
    step(seconds, distance, radius) {
      if (tumbling > 0) {
        tumbling -= seconds * 1000;
        if (tumbling <= 0) {
          tumbling = 0;
          heading = random() * 2 * Math.PI;
        }
        return;
      }
      let dx = Math.cos(heading);
      let dy = Math.sin(heading);
      const nx = group.x + dx * distance;
      const ny = group.y + dy * distance;
      const out = Math.hypot(nx, ny);
      if (out > 0 && out > radius - group.reach()) {
        // Heading outward at the rim: bounce back in, like a ball off a wall.
        const [ux, uy] = [nx / out, ny / out];
        const toward = dx * ux + dy * uy;
        if (toward > 0) {
          dx -= 2 * toward * ux;
          dy -= 2 * toward * uy;
          heading = Math.atan2(dy, dx);
        }
      }
      group.x += dx * distance;
      group.y += dy * distance;
      // Only turn around when mostly heading sideways, so she doesn't flip
      // back and forth while swimming nearly straight up or down.
      if (Math.abs(dx) > 0.3) group.facing = Math.sign(dx);
    },
  };
}

// `you` is { svg, species }: your pal's drawing on the page and her settings
// from config.js. `target` is how many cells win.
export function playTumble({ you, nutrients, target = TUMBLE.TARGET }) {
  const agar = document.querySelector('.agar');
  const dish = agar.closest('.petri-dish') ?? agar;
  const counter = document.querySelector('.cell-count');
  const dishRadius = () => agar.clientWidth / 2;
  const pal = you.svg.dataset.pal;
  const name = you.svg.dataset.name;

  const playerMover = document.querySelector('.pal-mover');
  playerMover.classList.add('player');
  const makeGroup = you.species.kind === 'rod' ? rodGroup : coccusGroup;
  const leader = makeGroup({ mover: playerMover, svg: you.svg, species: you.species, isPlayer: true });
  const colony = makeColony({
    leader, nutrients, dishRadius, target, color: you.species.color, onDivide: () => updateCounter(),
  });
  const swim = swimmer(leader);

  // Her sense of smell, under the counter: is it getting sweeter?
  const sense = document.createElement('p');
  sense.className = 'sense';
  sense.setAttribute('aria-hidden', 'true'); // changes too often to read out
  counter.after(sense);
  const smells = []; // [ms, sweetness] over the last SENSE_MS
  let clock = 0;
  let feeling = null;

  let tumbles = 0;
  let finished = false;
  let lastTime = null;

  function tumble() {
    if (finished || !swim.tumble()) return;
    tumbles++;
    playerMover.classList.add('tumbling');
    updateCounter();
  }
  dish.addEventListener('pointerdown', (event) => {
    if (!event.isPrimary) return;
    event.preventDefault(); // no text selection or long-press menu
    tumble();
  });
  window.addEventListener('keydown', (event) => {
    if (!TUMBLE_KEYS.has(event.key) || finished) return;
    event.preventDefault(); // the space bar and arrows would scroll the page
    if (!event.repeat) tumble();
  });

  // "Play again" starts a new dish; "Choose a mode" goes back to the modes.
  document.querySelector('.play-again').addEventListener('click', () => goTo(window.location.href));
  document.querySelector('.start-over').addEventListener('click', () => goTo(`./choose-mode.html?pal=${pal}`));

  function updateCounter() {
    const shown = Math.min(colony.cellCount(), target);
    counter.textContent = `${shown} / ${target} cells · ${tumbles} ${tumbles === 1 ? 'tumble' : 'tumbles'}`;
  }

  // Compare how sweet it smells here with a moment ago.
  function smell(seconds, radius) {
    clock += seconds * 1000;
    const now = sweetness(leader.x / radius, leader.y / radius, nutrients.positions());
    smells.push([clock, now]);
    while (smells.length > 1 && smells[1][0] <= clock - TUMBLE.SENSE_MS) smells.shift();
    const change = now - smells[0][1];
    let next = feeling;
    if (swim.tumbling()) next = 'tumbling';
    else if (change > 0.01) next = 'sweeter';
    else if (change < -0.01) next = 'fainter';
    if (next === feeling) return;
    feeling = next;
    sense.dataset.feeling = feeling;
    sense.textContent = {
      tumbling: 'Tumbling…',
      sweeter: 'Smells sweeter! Keep swimming.',
      fainter: 'Less sweet… tumble!',
    }[feeling];
  }

  function step(time) {
    const seconds = lastTime === null ? 0 : Math.min(0.05, (time - lastTime) / 1000);
    lastTime = time;
    const radius = dishRadius();

    if (!finished) {
      swim.step(seconds, TUMBLE.SPEED * radius * seconds, radius);
      if (!swim.tumbling()) playerMover.classList.remove('tumbling');
      smell(seconds, radius);
    }

    colony.tick(seconds);
    moveGroups(colony.groups, { agar, radius, seconds });

    if (!finished) {
      colony.eat(seconds, radius);
      if (colony.cellCount() >= target) finish();
      else colony.divideLeader();
    }

    requestAnimationFrame(step);
  }

  function finish() {
    finished = true;
    nutrients.stop();
    playerMover.classList.remove('tumbling');
    sense.textContent = '';
    updateCounter();
    sporeBurst(playerMover);
    track(`tumble/won/${pal}`, `${name} grew ${target} cells in ${tumbles} tumbles`);
    setTimeout(() => {
      showFact(pal, you.species);
      const banner = document.querySelector('.win-banner');
      banner.querySelector('h2').textContent = 'You found the food!';
      banner.querySelector('.win-message').textContent =
        `Your colony reached ${target} cells with ${tumbles} ${tumbles === 1 ? 'tumble' : 'tumbles'}. Can you do it in fewer?`;
      banner.querySelector('.play-again').textContent = 'Play again';
      const modes = banner.querySelector('.start-over');
      modes.textContent = 'Choose a mode';
      modes.hidden = false;
      banner.removeAttribute('hidden');
      banner.querySelector('.play-again').focus();
    }, Math.max(0, GAME.DIVIDE_MS - colony.sinceAnyDivision));
  }

  updateCounter();
  requestAnimationFrame(step);
}
