// Entry point for the petri dish page: find the pal, mode and level picked in
// the URL and start the game with them:
//   petri-dish.html?pal=mona&level=2    classic, level 2
//   petri-dish.html?pal=mona&mode=mixed mixed culture against a random rival
//                                       (or &rivals=vi,elia for up to three)
//   petri-dish.html?pal=mona&mode=tumble Petri Picnic
import { antibioticsFor, placeAntibiotics } from './antibiotic.js';
import { LEVELS, MIXED, raceTarget, SPECIES, TUMBLE } from './config.js';
import { playGame } from './game.js';
import { speciesName } from './italics.js';
import { pageReady, watchLoading } from './loading.js';
import { scatterNutrients } from './nutrients.js';
import { dishPal, PALS } from './pals.js';
import { playRace } from './race.js';
import { listOf, rivalsFor } from './rivals.js';
import { watchInputMode } from './touch.js';
import { playTumble } from './tumble.js';

// Show touch or arrow-key directions, whichever fits the device.
watchInputMode();
// "Growing the colony…" while the next screen loads.
watchLoading();

// Every pal's drawing, hidden: yours is shown below, and in mixed culture the
// rival's is copied from here.
document.querySelector('.pal-mover').append(...PALS.map(dishPal));

const params = new URLSearchParams(window.location.search);
const choice = params.get('pal');
// Compare names rather than building a CSS selector from the address, so a
// mangled link (e.g. ?pal=mona"]) can't crash the page.
const pal = [...document.querySelectorAll('.dish-pal')].find((el) => el.dataset.pal === choice);
// Level 1 unless the URL says otherwise.
const levelNumber = Math.min(Math.max(parseInt(params.get('level'), 10) || 1, 1), LEVELS.length);
const level = LEVELS[levelNumber - 1];

const drawingOf = (name) => [...document.querySelectorAll('.dish-pal')].find((el) => el.dataset.pal === name);

if (!pal) {
  // No pal (or an unknown one) in the URL: send them back to choose.
  window.location.replace('./pal-picker.html');
} else {
  if (params.get('mode') === 'mixed') startMixed();
  else if (params.get('mode') === 'tumble') startTumble();
  else startClassic();
  // The dish is set up: take the loading card away.
  pageReady();
}

function startClassic() {
  pal.removeAttribute('hidden');
  document.title = `PetriPals | ${pal.dataset.name} | Level ${levelNumber}`;
  const species = SPECIES[pal.dataset.pal];
  // Her name and species above the dish.
  const title = document.querySelector('.pal-name');
  title.textContent = pal.dataset.name;
  title.style.color = species.color;
  document.querySelector('.species-name').replaceChildren(...speciesName(species.scientific));
  const disks = placeAntibiotics(antibioticsFor(species.antibiotics, level.disks));
  const nutrients = scatterNutrients({ avoid: disks });
  playGame(pal, species, nutrients, disks, { level: levelNumber, target: level.target });
}

function startMixed() {
  pal.removeAttribute('hidden');
  const species = SPECIES[pal.dataset.pal];
  // The rivals in the address, or one at random.
  const rivals = rivalsFor(pal.dataset.pal, params.get('rivals')).map((id) => ({ svg: drawingOf(id), species: SPECIES[id] }));
  const rivalNames = rivals.map((rival) => rival.svg.dataset.name);
  const target = raceTarget(rivals.length);
  document.title = `PetriPals | ${pal.dataset.name} vs. ${listOf(rivalNames)}`;
  document.body.classList.add('mixed-mode');

  // "Mona vs. Vi and Elia" above the dish, each name in its pal's color, and
  // every species.
  const title = document.querySelector('.pal-name');
  title.replaceChildren(
    named(pal.dataset.name, species.color),
    ' vs. ',
    ...joined(rivals.map((rival) => [named(rival.svg.dataset.name, rival.species.color)])),
  );
  const speciesLine = document.querySelector('.species');
  speciesLine.replaceChildren(
    ...speciesName(species.scientific),
    ' vs. ',
    ...joined(rivals.map((rival) => speciesName(rival.species.scientific))),
  );

  const howTo = document.querySelector('.how-to-play');
  howTo.replaceChildren(
    `Race ${listOf(rivalNames)} to ${target} cells! `,
    // Arrow-key or touch wording, whichever fits the device (see styles.css).
    wording('for-keys', 'Use the arrow keys to eat nutrients.'),
    wording('for-touch', 'Touch the dish and slide your finger to eat nutrients.'),
    document.createElement('br'),
    `Any cell that eats a nutrient divides, so grab them before ${rivals.length > 1 ? 'your rivals do' : 'the rival does'}!`,
  );

  const nutrients = scatterNutrients({ count: MIXED.NUTRIENTS_PER_PAL * (rivals.length + 1) });
  playRace({ you: { svg: pal, species }, rivals, nutrients, target });
}

function startTumble() {
  pal.removeAttribute('hidden');
  const species = SPECIES[pal.dataset.pal];
  document.title = `PetriPals | ${pal.dataset.name} | Petri Picnic`;
  document.body.classList.add('tumble-mode');
  const title = document.querySelector('.pal-name');
  title.textContent = pal.dataset.name;
  title.style.color = species.color;
  document.querySelector('.species-name').replaceChildren(...speciesName(species.scientific));

  document.querySelector('.how-to-play').replaceChildren(
    `No steering! ${pal.dataset.name} swims straight ahead on her own. `,
    // Tap or key wording, whichever fits the device (see styles.css).
    wording('for-keys', 'Press the space bar'),
    wording('for-touch', 'Tap the dish'),
    ' to make her tumble and swim off a random new way.',
    document.createElement('br'),
    `Tumble when she's heading the wrong way, and grow to ${TUMBLE.TARGET} cells.`,
  );

  const nutrients = scatterNutrients({ count: TUMBLE.NUTRIENTS });
  playTumble({ you: { svg: pal, species }, nutrients, target: TUMBLE.TARGET });
}

// Lists of nodes joined like listOf: "A", "A and B", "A, B and C".
function joined(parts) {
  return parts.flatMap((part, i) => {
    if (i === 0) return part;
    return [i === parts.length - 1 ? ' and ' : ', ', ...part];
  });
}

function named(text, color) {
  const span = document.createElement('span');
  span.textContent = text;
  span.style.color = color;
  return span;
}

function wording(className, text) {
  const span = document.createElement('span');
  span.className = className;
  span.textContent = text;
  return span;
}
