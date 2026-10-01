// Entry point for the petri dish page: find the pal, mode and level picked in
// the URL and start the game with them:
//   petri-dish.html?pal=mona&level=2    classic, level 2
//   petri-dish.html?pal=mona&mode=mixed mixed culture against a random rival
//                                       (add &rival=vi to pick the rival)
import { antibioticsFor, placeAntibiotics } from './antibiotic.js';
import { LEVELS, MIXED, SPECIES } from './config.js';
import { playGame } from './game.js';
import { scatterNutrients } from './nutrients.js';
import { playRace } from './race.js';

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
} else if (params.get('mode') === 'mixed') {
  startMixed();
} else {
  startClassic();
}

function startClassic() {
  pal.removeAttribute('hidden');
  document.title = `PetriPals | ${pal.dataset.name} | Level ${levelNumber}`;
  const species = SPECIES[pal.dataset.pal];
  // Her name and species above the dish.
  const title = document.querySelector('.pal-name');
  title.textContent = pal.dataset.name;
  title.style.color = species.color;
  document.querySelector('.species-name').textContent = species.scientific;
  const disks = placeAntibiotics(antibioticsFor(species.antibiotics, level.disks));
  const nutrients = scatterNutrients({ avoid: disks });
  playGame(pal, species, nutrients, disks, { level: levelNumber, target: level.target });
}

function startMixed() {
  pal.removeAttribute('hidden');
  const species = SPECIES[pal.dataset.pal];
  // A random rival, any pal but yours (or the one in the URL, for testing).
  const others = Object.keys(SPECIES).filter((name) => name !== pal.dataset.pal);
  const asked = params.get('rival');
  const rivalName = others.includes(asked) ? asked : others[Math.floor(Math.random() * others.length)];
  const rival = { svg: drawingOf(rivalName), species: SPECIES[rivalName] };
  document.title = `PetriPals | ${pal.dataset.name} vs. ${rival.svg.dataset.name}`;
  document.body.classList.add('mixed-mode');

  // "Mona vs. Vi" above the dish, each name in its pal's color, and both species.
  const title = document.querySelector('.pal-name');
  title.replaceChildren(named(pal.dataset.name, species.color), ' vs. ', named(rival.svg.dataset.name, rival.species.color));
  const speciesLine = document.querySelector('.species');
  speciesLine.replaceChildren(italic(species.scientific), ' vs. ', italic(rival.species.scientific));

  const howTo = document.querySelector('.how-to-play');
  howTo.replaceChildren(
    `Race ${rival.svg.dataset.name} to ${MIXED.TARGET} cells! Use the arrow keys to eat nutrients.`,
    document.createElement('br'),
    'Any cell that eats a nutrient divides, so grab them before the rival does!',
  );

  const nutrients = scatterNutrients({ count: MIXED.NUTRIENTS });
  playRace({ you: { svg: pal, species }, rival, nutrients });
}

function named(text, color) {
  const span = document.createElement('span');
  span.textContent = text;
  span.style.color = color;
  return span;
}

function italic(text) {
  const i = document.createElement('i');
  i.textContent = text;
  return i;
}
